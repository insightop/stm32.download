import WebStlink from "../../../vendor/protocols/webstlink/src/webstlink.js";
import { Logger } from "../../../vendor/protocols/webstlink/src/lib/package.js";
import { ErrorCode, type DownloadError } from "@/core/errors/ErrorCode";
import { i18n } from "@/i18n";

export interface StlinkTargetVariant {
  type: string;
  freq?: number;
  flash_size?: number;
  sram_size?: number;
  eeprom_size?: number;
}

interface ProgressTracker {
  baseAddress: number;
  totalBytes: number;
}

export interface StlinkAdapter {
  connect(pickVariant?: (candidates: StlinkTargetVariant[]) => Promise<string | null>): Promise<void>;
  setProgressTracker(tracker: ProgressTracker): void;
  setProgressHandler(handler: (writtenBytes: number, totalBytes: number) => void): void;
  flash(address: number, data: Uint8Array): Promise<void>;
  reset(): Promise<void>;
  disconnect(): Promise<void>;
}

export function createStlinkAdapter(device: USBDevice): StlinkAdapter {
  class AdapterLogger extends Logger {
    private tracker: ProgressTracker = { baseAddress: 0, totalBytes: 0 };
    private progressHandler: (writtenBytes: number, totalBytes: number) => void = () => undefined;
    private writeStageActive = false;

    setProgressTracker(tracker: ProgressTracker): void {
      this.tracker = tracker;
    }

    setProgressHandler(handler: (writtenBytes: number, totalBytes: number) => void): void {
      this.progressHandler = handler;
    }

    bargraph_start(message: string): void {
      this.writeStageActive = message === "Writing FLASH";
    }

    bargraph_update({ value = 0 }: { value?: number }): void {
      if (!this.writeStageActive || this.tracker.totalBytes <= 0) return;
      const written = Math.max(
        0,
        Math.min(this.tracker.totalBytes, Math.floor(value - this.tracker.baseAddress)),
      );
      this.progressHandler(written, this.tracker.totalBytes);
    }

    bargraph_done(): void {
      if (!this.writeStageActive || this.tracker.totalBytes <= 0) return;
      this.progressHandler(this.tracker.totalBytes, this.tracker.totalBytes);
      this.writeStageActive = false;
    }
  }

  const logger = new AdapterLogger(1, null);
  const stlink = new WebStlink(logger);

  function targetSelectionCancelled(): DownloadError {
    return {
      code: ErrorCode.UserCancelled,
      userMessage: String(i18n.global.t("target.selectionCancelled")),
    };
  }

  return {
    async connect(pickVariant) {
      await stlink.attach(device);
      const wrappedPick = pickVariant
        ? async (candidates: StlinkTargetVariant[]) => {
            const picked = await pickVariant(candidates);
            if (picked === null || picked === undefined) {
              await stlink.detach().catch(() => undefined);
              throw targetSelectionCancelled();
            }
            return picked;
          }
        : undefined;
      await stlink.detect_cpu([], wrappedPick ?? null);
    },
    setProgressTracker(tracker) {
      logger.setProgressTracker(tracker);
    },
    setProgressHandler(handler) {
      logger.setProgressHandler(handler);
    },
    async flash(address, data) {
      await stlink.flash(address, data);
    },
    async reset() {
      await stlink.reset(false);
    },
    async disconnect() {
      await stlink.detach();
    },
  };
}
