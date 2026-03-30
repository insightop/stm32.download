<script setup lang="ts">
import { computed, ref, unref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { NFloatButton, NIcon } from "naive-ui";
import { DocumentTextOutline } from "@vicons/ionicons5";
import { Pane, Splitpanes } from "splitpanes";
import TargetSelector from "@/features/flasher/components/TargetSelector.vue";
import FlasherSelector from "@/features/flasher/components/FlasherSelector.vue";
import FirmwareInputPanel from "@/features/flasher/components/FirmwareInputPanel.vue";
import type { FirmwareInputPanelExpose } from "@/features/flasher/components/firmwareInputPanelExpose";
import DownloadPanel from "@/features/flasher/components/DownloadPanel.vue";
import LogSidebar from "@/features/flasher/components/LogSidebar.vue";
import TargetVariantDialog from "@/features/flasher/components/TargetVariantDialog.vue";
import LanguageSwitcher from "@/features/flasher/components/LanguageSwitcher.vue";
import { useFlasherStore } from "@/features/flasher/stores/flasher.store";
import {
  getFlasherOptionsForTarget,
  getFlasherRuntimeInfo,
  prepareFlasherForCurrentSelection,
  startFlash,
} from "@/features/flasher/services/flasherFacade";
import { flasherLogger } from "@/features/flasher/services/flasherLogger";
import { createStlinkTargetSession, tryAutoPickTarget } from "@/features/flasher/services/stlinkTargetPreference";
import type { StlinkTargetVariant } from "@/transports/adapters/stlink.adapter";
import { i18n } from "@/i18n";

const { t } = useI18n();
const store = useFlasherStore();
const firmwareInput = ref<FirmwareInputPanelExpose | null>(null);
const resolveTargetPicker = ref<((type: string | null) => void) | null>(null);
const flasherOptions = computed(() => getFlasherOptionsForTarget(store.chipFamily));
const logPanelExpanded = ref(true);
const rightPanePercent = ref<number>(28);
const onPaneResized = (event: { size: number }[]): void => {
  if (!logPanelExpanded.value) return;
  const right = event[1];
  if (!right) return;
  rightPanePercent.value = right.size;
};
const expandLogPanel = (): void => {
  logPanelExpanded.value = true;
};
const collapseLogPanel = (): void => {
  logPanelExpanded.value = false;
};

const syncFlasherSelection = async (): Promise<void> => {
  const currentValid = flasherOptions.value.some((opt) => opt.flasherType === store.flasherType);
  if (!currentValid) {
    const firstSupported = flasherOptions.value.find((opt) => opt.isSupported) ?? flasherOptions.value[0];
    if (firstSupported) {
      store.setFlasherType(firstSupported.flasherType);
    }
  }
  store.setFlasherRuntime(getFlasherRuntimeInfo());
  try {
    await prepareFlasherForCurrentSelection();
  } catch (error) {
    flasherLogger.error(error instanceof Error ? error.message : String(error));
  }
};

watch(
  () => store.chipFamily,
  () => {
    store.clearStlinkTargetSession();
    void syncFlasherSelection();
  },
  { immediate: true },
);

watch(
  () => store.flasherType,
  () => {
    store.clearStlinkTargetSession();
    void syncFlasherSelection();
  },
);

watch(
  () => (firmwareInput.value ? unref(firmwareInput.value.firmwareFingerprint) : null),
  () => {
    store.clearStlinkTargetSession();
  },
);

watch(
  () => [store.firmwareReady, store.flasherStatus, store.flasherType, store.chipFamily],
  () => {
    if (store.downloadResult !== "running") {
      store.resetDownloadResult();
    }
  },
);

const download = async (): Promise<void> => {
  try {
    if (!store.canStartDownload) {
      flasherLogger.warning(t("flasherPage.downloadBlocked"));
      return;
    }
    if (!store.flasherCanFlash) {
      flasherLogger.warning(t("flasherPage.flashNotImplemented"));
      return;
    }
    const input = await firmwareInput.value?.getInput();
    if (!input) return;
    const finished = await startFlash(input, {
      pickStlinkTarget: async (candidates: StlinkTargetVariant[]) => {
        const auto = tryAutoPickTarget(store.stlinkTargetSession, candidates);
        if (auto) {
          flasherLogger.info(String(i18n.global.t("target.autoPicked", { type: auto })), {
            type: auto,
            candidates: candidates.map((c) => c.type),
          });
          return auto;
        }
        return await new Promise<string | null>((resolve) => {
          resolveTargetPicker.value = resolve;
          store.openTargetPicker(candidates);
        });
      },
    });
    if (finished) {
      flasherLogger.info(t("flasherPage.downloadCompleted"));
    }
  } catch (error) {
    if (store.downloadResult !== "running") {
      store.setDownloadResult("error");
    }
    const maybeDownloadError = error as unknown as { userMessage?: unknown; debugMessage?: unknown };
    if (maybeDownloadError && typeof maybeDownloadError.userMessage === "string") {
      flasherLogger.error(maybeDownloadError.userMessage);
      if (typeof maybeDownloadError.debugMessage === "string") {
        flasherLogger.debug(`Debug: ${maybeDownloadError.debugMessage}`);
      }
      return;
    }
    flasherLogger.error(error instanceof Error ? error.message : String(error));
  }
};

const onTargetConfirm = (payload: { type: string; remember: boolean }): void => {
  if (payload.remember) {
    store.setStlinkTargetSession(createStlinkTargetSession(store.targetCandidates, payload.type));
  }
  store.confirmTargetSelection(payload.type);
  resolveTargetPicker.value?.(payload.type);
  resolveTargetPicker.value = null;
};

const onTargetCancel = (): void => {
  store.cancelTargetSelection();
  resolveTargetPicker.value?.(null);
  resolveTargetPicker.value = null;
};
</script>

<template>
  <main class="workspace">
    <NFloatButton
      v-if="!logPanelExpanded"
      class="log-float-toggle"
      shape="square"
      @click="expandLogPanel"
    >
      <span class="float-inner">
        <NIcon
          :component="DocumentTextOutline"
          :size="18"
        />
        <span>{{ t("log.show") }}</span>
      </span>
    </NFloatButton>
    <Splitpanes
      class="split-layout"
      @resized="onPaneResized"
    >
      <Pane
        :size="logPanelExpanded ? Math.max(100 - rightPanePercent, 30) : 100"
        :min-size="logPanelExpanded ? 30 : 96"
      >
        <section class="main">
          <div class="page-head">
            <h1>{{ t("app.title") }}</h1>
            <LanguageSwitcher />
          </div>
          <TargetSelector
            :value="store.chipFamily"
            @update:value="store.setChipFamily"
          />
          <FlasherSelector
            :value="store.flasherType"
            :options="flasherOptions"
            :flasher-label="store.flasherLabel"
            :flasher-error="store.flasherError"
            @update:value="store.setFlasherType"
          />
          <FirmwareInputPanel ref="firmwareInput" />
          <DownloadPanel
            :can-start="store.canStartDownload"
            :download-result="store.downloadResult"
            :progress-percent="store.progressPercent"
            :bytes-per-second="store.bytesPerSecond"
            :eta-seconds="store.etaSeconds"
            @download="download"
          />
          <TargetVariantDialog
            :open="store.targetPickerOpen"
            :candidates="store.targetCandidates"
            @confirm="onTargetConfirm"
            @cancel="onTargetCancel"
          />
        </section>
      </Pane>
      <Pane
        :size="logPanelExpanded ? rightPanePercent : 0"
        :min-size="logPanelExpanded ? 18 : 0"
        :max-size="logPanelExpanded ? 48 : 4"
      >
        <LogSidebar
          :expanded="logPanelExpanded"
          :logs="store.filteredLogs"
          @collapse="collapseLogPanel"
        />
      </Pane>
    </Splitpanes>
  </main>
</template>

<style scoped>
.workspace {
  min-height: 100vh;
  background: var(--workspace-bg);
  position: relative;
}
.split-layout {
  min-height: 100vh;
}
.main {
  padding: 24px;
  display: grid;
  gap: 16px;
  align-content: start;
  max-width: 1200px;
}
.page-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.page-head h1 {
  margin: 0;
  font-size: 30px;
  line-height: 1.1;
  color: var(--text-primary);
  letter-spacing: -0.02em;
}
:global(.splitpanes__splitter) {
  background: color-mix(in srgb, var(--border-default) 40%, transparent);
}
:global(.splitpanes__splitter:hover) {
  background: color-mix(in srgb, var(--brand-500) 45%, transparent);
}
.log-float-toggle {
  position: fixed;
  top: 88px;
  right: 18px;
  z-index: 30;
}
.float-inner {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  font-size: 11px;
}
</style>
