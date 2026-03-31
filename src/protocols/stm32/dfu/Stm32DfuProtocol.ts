import { ErrorCode } from "@/core/errors/ErrorCode";
import type { DownloadTaskInput, FlashPlan, StageProgress } from "@/core/types/download";
import {
  mapDfuProbeError,
  mapDfuResetError,
  mapDfuSyncError,
  mapDfuWriteError,
  toDownloadError,
} from "@/protocols/stm32/dfu/adapters/DfuErrorMapper";
import { WebDfuAdapter } from "@/protocols/stm32/dfu/adapters/WebDfuAdapter";
import type { FlasherProtocol, ProbeResult } from "@/protocols/types";
import type { UsbTransport } from "@/transports/types";

const DEFAULT_TRANSFER_SIZE = 2048;

export class Stm32DfuProtocol implements FlasherProtocol {
  private readonly adapter = new WebDfuAdapter();

  constructor(private readonly transport: UsbTransport) {}

  async probe(): Promise<ProbeResult> {
    try {
      await this.adapter.connect(this.transport.getDevice());
      return { chipFamily: "stm32", chipName: this.adapter.chipName };
    } catch (cause) {
      throw mapDfuProbeError(cause);
    }
  }

  async sync(): Promise<void> {
    try {
      await this.adapter.syncToIdle();
    } catch (cause) {
      throw mapDfuSyncError(cause);
    }
  }

  async buildPlan(input: unknown): Promise<FlashPlan> {
    const payload = input as DownloadTaskInput;
    if (payload.firmware.kind !== "single-bin" || payload.firmware.items.length === 0) {
      throw toDownloadError(
        ErrorCode.FlashPlanInvalid,
        "STM32 USB DFU 需要单镜像输入（single-bin）",
        new Error("Invalid STM32 USB DFU input"),
      );
    }
    const item = payload.firmware.items[0];
    return {
      chipFamily: "stm32",
      segments: [{ address: item.address, data: item.data, label: item.label ?? "app" }],
    };
  }

  async erase(_plan: FlashPlan): Promise<void> {
    // DfuSe erase is coupled with address mapping and is handled in write().
  }

  async write(plan: FlashPlan, onProgress: (progress: StageProgress) => void): Promise<void> {
    const segment = plan.segments[0];
    const bytesTotal = segment.data.byteLength;
    onProgress({
      stage: "flashing",
      stagePercent: 0,
      totalPercent: 0,
      bytesWritten: 0,
      bytesTotal,
    });

    try {
      await this.adapter.eraseAndWrite({
        startAddress: segment.address,
        data: segment.data,
        transferSize: DEFAULT_TRANSFER_SIZE,
        onProgress: (writtenBytes, totalBytes) => {
          const percent = totalBytes > 0 ? Math.floor((writtenBytes / totalBytes) * 100) : 0;
          onProgress({
            stage: "flashing",
            stagePercent: percent,
            totalPercent: percent,
            bytesWritten: writtenBytes,
            bytesTotal,
          });
        },
      });
    } catch (cause) {
      throw mapDfuWriteError(cause);
    }
  }

  async verify(): Promise<void> {
    // Optional: no verify for now.
  }

  async reset(): Promise<void> {
    try {
      await this.adapter.resetAndDetach();
    } catch (cause) {
      throw mapDfuResetError(cause);
    }
  }
}
