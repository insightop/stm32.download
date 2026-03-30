import type { FlashPlan, StageProgress } from "@/core/types/download";
import type { FlasherProtocol, ProbeResult } from "@/protocols/types";
import { createDaplinkAdapter, type DaplinkAdapter } from "@/transports/adapters/daplink.adapter";

export class Stm32DaplinkProtocol implements FlasherProtocol {
  private readonly adapter: DaplinkAdapter = createDaplinkAdapter();

  async probe(): Promise<ProbeResult> {
    await this.adapter.connect();
    return { chipFamily: "stm32", chipName: "STM32-DAPLink" };
  }

  async sync(): Promise<void> {}

  async buildPlan(input: unknown): Promise<FlashPlan> {
    return input as FlashPlan;
  }

  async erase(): Promise<void> {}

  async write(plan: FlashPlan, onProgress: (progress: StageProgress) => void): Promise<void> {
    const mergedSize = plan.segments.reduce((sum, segment) => sum + segment.data.byteLength, 0);
    const image = new Uint8Array(mergedSize);
    let offset = 0;
    for (const segment of plan.segments) {
      image.set(segment.data, offset);
      offset += segment.data.byteLength;
    }
    await this.adapter.flash(image);
    onProgress({ stage: "flashing", stagePercent: 100, totalPercent: 100, bytesWritten: mergedSize, bytesTotal: mergedSize });
  }

  async verify(): Promise<void> {}

  async reset(): Promise<void> {
    await this.adapter.disconnect();
  }
}
