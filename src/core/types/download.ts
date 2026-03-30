export type DownloadStage =
  | "idle"
  | "selectingFirmware"
  | "connecting"
  | "probingTarget"
  | "syncing"
  | "preparingImagePlan"
  | "erasing"
  | "flashing"
  | "verifying"
  | "resetting"
  | "completed"
  | "failed"
  | "cancelled";

export type DownloadEvent =
  | "SELECT_FIRMWARE"
  | "START"
  | "CONNECT_OK"
  | "PROBE_OK"
  | "SYNC_OK"
  | "PLAN_OK"
  | "ERASE_OK"
  | "FLASH_OK"
  | "VERIFY_OK"
  | "RESET_OK"
  | "FAIL"
  | "CANCEL"
  | "RESET";

export interface StageProgress {
  stage: DownloadStage;
  stagePercent: number;
  totalPercent: number;
  bytesWritten: number;
  bytesTotal: number;
  etaSeconds?: number;
}

export interface FlashSegment {
  address: number;
  data: Uint8Array;
  label?: string;
}

export interface FlashPlan {
  chipFamily: "stm32" | "esp32";
  segments: FlashSegment[];
}

export interface DownloadTaskInput {
  flasherType: string;
  mode?: string;
  chipFamily: "stm32" | "esp32";
  firmware:
    | { kind: "single-bin"; items: Array<{ address: number; data: Uint8Array; label?: string }> }
    | {
        kind: "multi-image";
        bootloader: { address: number; data: Uint8Array };
        partitionTable: { address: number; data: Uint8Array };
        app: { address: number; data: Uint8Array };
        otaData?: { address: number; data: Uint8Array };
      };
}
