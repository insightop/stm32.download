import type { ComputedRef } from "vue";
import type { DownloadTaskInput } from "@/core/types/download";

/** Public API exposed by `FirmwareInputPanel` for parent coordination. */
export interface FirmwareInputPanelExpose {
  getInput: () => Promise<DownloadTaskInput>;
  firmwareFingerprint: ComputedRef<string | null>;
}
