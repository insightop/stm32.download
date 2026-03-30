import { DownloadSession } from "@/core/session/DownloadSession";
import { isUserCancelledError } from "@/core/errors/ErrorCode";
import { detectBrowserCapabilities, getBrowserSupportHint } from "@/plugins/capabilities";
import { globalPluginRegistry } from "@/plugins/registry";
import type { FlasherPlugin, PluginResolveCriteria, PluginRuntimeDeps } from "@/plugins/types";
import type { Transport } from "@/transports/types";
import { useFlasherStore } from "@/features/flasher/stores/flasher.store";
import { flasherLogger } from "@/features/flasher/services/flasherLogger";
import { i18n } from "@/i18n";
import { formatBytes, formatSpeed } from "@/shared/format/formatBytes";

function t(key: string, values?: Record<string, unknown>): string {
  return String(i18n.global.t(key, (values ?? {}) as Record<string, unknown>));
}

function formatEtaSeconds(eta: number | null): string {
  if (eta === null || eta < 0) return "—";
  if (eta < 60) return `${eta}s`;
  const m = Math.floor(eta / 60);
  const s = eta % 60;
  return `${m}m ${s}s`;
}

interface PreparedTransportSession {
  pluginId: string;
  transport: Transport;
}

let prepared: PreparedTransportSession | null = null;

function resolveCurrentPlugin(): FlasherPlugin | null {
  const store = useFlasherStore();
  const criteria: PluginResolveCriteria = {
    chipFamily: store.chipFamily,
    flasherType: store.flasherType,
    capabilities: detectBrowserCapabilities(),
  };
  return globalPluginRegistry.tryResolve(criteria);
}

export interface FlasherOption {
  pluginId: string;
  label: string;
  flasherType: "serial" | "usb-dfu" | "st-link" | "dap-link";
  canSelectConnection: boolean;
  canFlash: boolean;
  isSupported: boolean;
  reason: string;
}

export function getFlasherOptionsForTarget(target: "stm32" | "esp32"): FlasherOption[] {
  const capabilities = detectBrowserCapabilities();
  return globalPluginRegistry.listByTarget({ chipFamily: target, capabilities }).map(({ plugin, isSupported }) => {
    const reason = isSupported ? "" : getBrowserSupportHint(capabilities);
    return {
      pluginId: plugin.id,
      label: plugin.displayName,
      flasherType: plugin.flasherType,
      canSelectConnection: plugin.canSelectConnection,
      canFlash: plugin.canFlash,
      isSupported,
      reason,
    };
  });
}

export function getFlasherRuntimeInfo(): { canFlash: boolean; canSelectConnection: boolean; hint: string } {
  const capabilities = detectBrowserCapabilities();
  const plugin = resolveCurrentPlugin();
  if (!plugin) {
    return {
      canFlash: false,
      canSelectConnection: false,
      hint: t("flasherPage.runtimeUnavailable", { hint: getBrowserSupportHint(capabilities) }),
    };
  }
  const hint = plugin.canFlash ? "" : t("flasherPage.flashNotImplemented");
  return { canFlash: plugin.canFlash, canSelectConnection: plugin.canSelectConnection, hint };
}

export async function prepareFlasherForCurrentSelection(): Promise<void> {
  const store = useFlasherStore();
  const plugin = resolveCurrentPlugin();
  if (!plugin) {
    const hint = getFlasherRuntimeInfo().hint;
    store.setFlasherRuntime({ canFlash: false, canSelectConnection: false, hint });
    store.setFlasherState({ status: "failed", label: null, error: hint });
    throw new Error(hint);
  }

  store.setFlasherRuntime({
    canFlash: plugin.canFlash,
    canSelectConnection: plugin.canSelectConnection,
    hint: plugin.canFlash ? "" : t("flasherPage.flashNotImplemented"),
  });

  if (prepared && prepared.pluginId !== plugin.id) {
    await prepared.transport.close().catch(() => undefined);
    prepared = null;
  }

  if (!prepared) {
    prepared = { pluginId: plugin.id, transport: plugin.createTransport() };
  }

  if (!plugin.canSelectConnection) {
    store.setFlasherState({ status: "idle", label: null, error: t("flasherPage.noConnectionNeeded") });
    return;
  }

  if (prepared.transport.isDeviceReady?.()) {
    const label = prepared.transport.getDeviceLabel?.() ?? plugin.displayName;
    store.setFlasherState({ status: "ready", label, error: null });
    return;
  }

  store.setFlasherState({ status: "selecting", label: null, error: null });
  try {
    await prepared.transport.selectDevice?.();
    const label = prepared.transport.getDeviceLabel?.() ?? plugin.displayName;
    store.setFlasherState({ status: "ready", label, error: null });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    store.setFlasherState({ status: "failed", label: null, error: message });
    throw error;
  }
}

/** @returns true if flash completed successfully; false if user cancelled (e.g. ST-Link target picker). */
export async function startFlash(input: unknown, deps: PluginRuntimeDeps = {}): Promise<boolean> {
  const store = useFlasherStore();
  store.setDownloadResult("running");
  // 新一轮下载开始时立刻清零，避免仍显示上一轮的 100%（握手阶段）
  store.setProgressDetails({
    percent: 0,
    bytesWritten: 0,
    bytesTotal: 0,
    bytesPerSecond: 0,
    etaSeconds: null,
  });
  const plugin = resolveCurrentPlugin();
  if (!plugin) {
    store.setDownloadResult("error");
    throw new Error(t("flasherPage.runtimeUnavailable", { hint: getBrowserSupportHint(detectBrowserCapabilities()) }));
  }
  if (!plugin.canFlash) {
    store.setDownloadResult("error");
    throw new Error(t("flasherPage.flashNotImplemented"));
  }
  if (!prepared || prepared.pluginId !== plugin.id) {
    store.setDownloadResult("error");
    throw new Error(t("flasherPage.selectConnectionFirst"));
  }

  const resetProgressIdle = (): void => {
    store.setProgressDetails({
      percent: 0,
      bytesWritten: 0,
      bytesTotal: 0,
      bytesPerSecond: 0,
      etaSeconds: null,
    });
    store.setStage("idle");
  };

  const transport = prepared.transport;
  const protocol = plugin.createProtocol(transport, deps);
  const speedWindow: Array<{ t: number; w: number }> = [];

  flasherLogger.info(t("logMessages.starting"), {
    plugin: plugin.displayName,
    transport: transport.name,
    flasherType: store.flasherType,
    chipFamily: store.chipFamily,
    deviceLabel: store.flasherLabel,
  });

  let lastProgressLogAt = 0;
  let lastLoggedPercent = -1;
  const session = new DownloadSession({
    transport,
    protocol,
    onStageChange: (stage) => {
      store.setStage(stage);
      flasherLogger.debug(t("logMessages.stage", { stage }), {
        plugin: plugin.displayName,
        stage,
      });
    },
    onProgress: (progress) => {
      const now = Date.now();
      speedWindow.push({ t: now, w: progress.bytesWritten });
      while (speedWindow.length > 0 && now - speedWindow[0].t > 3000) {
        speedWindow.shift();
      }
      let bytesPerSecond = 0;
      if (speedWindow.length >= 2) {
        const first = speedWindow[0];
        const last = speedWindow[speedWindow.length - 1];
        const deltaBytes = Math.max(0, last.w - first.w);
        const deltaSec = Math.max(0.001, (last.t - first.t) / 1000);
        bytesPerSecond = deltaBytes / deltaSec;
      }
      const remaining = Math.max(0, progress.bytesTotal - progress.bytesWritten);
      const etaSeconds = bytesPerSecond > 1 ? Math.ceil(remaining / bytesPerSecond) : null;
      store.setProgressDetails({
        percent: progress.totalPercent,
        bytesWritten: progress.bytesWritten,
        bytesTotal: progress.bytesTotal,
        bytesPerSecond,
        etaSeconds,
      });

      // Avoid flooding the log UI; keep it useful and readable.
      const shouldLog =
        progress.totalPercent !== lastLoggedPercent &&
        (now - lastProgressLogAt > 350 || progress.totalPercent % 10 === 0);
      if (shouldLog) {
        lastLoggedPercent = progress.totalPercent;
        lastProgressLogAt = now;
        const progressLine = t("logMessages.progress", {
          percent: progress.totalPercent,
          written: formatBytes(progress.bytesWritten),
          total: formatBytes(progress.bytesTotal),
          speed: formatSpeed(bytesPerSecond),
          eta: formatEtaSeconds(etaSeconds),
        });
        flasherLogger.debug(progressLine, {
          plugin: plugin.displayName,
          stage: progress.stage,
          percent: progress.totalPercent,
          bytesWritten: progress.bytesWritten,
          bytesTotal: progress.bytesTotal,
          bytesPerSecond,
          etaSeconds,
        });
      }
    },
  });
  flasherLogger.info(t("logMessages.usingPlugin", { name: plugin.displayName }), {
    pluginId: plugin.id,
  });
  try {
    await session.run(input);
    store.setDownloadResult("success");
    flasherLogger.info(t("logMessages.succeeded"), { plugin: plugin.displayName });
    return true;
  } catch (error) {
    if (isUserCancelledError(error)) {
      store.setDownloadResult("idle");
      resetProgressIdle();
      flasherLogger.info(t("target.selectionCancelledLog"), { plugin: plugin.displayName });
      return false;
    }
    store.setDownloadResult("error");
    const message =
      typeof error === "object" && error !== null && "userMessage" in error
        ? String((error as { userMessage: string }).userMessage)
        : error instanceof Error
          ? error.message
          : String(error);
    flasherLogger.error(t("logMessages.failed", { message }), { plugin: plugin.displayName, message });
    throw error;
  }
}
