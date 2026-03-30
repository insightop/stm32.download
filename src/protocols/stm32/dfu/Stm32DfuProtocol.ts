import type { FlashPlan, StageProgress } from "@/core/types/download";
import type { FlasherProtocol, ProbeResult } from "@/protocols/types";

export class Stm32DfuProtocol implements FlasherProtocol {
  async probe(): Promise<ProbeResult> {
    return { chipFamily: "stm32", chipName: "STM32-DFU" };
  }

  async sync(): Promise<void> {}

  async buildPlan(input: unknown): Promise<FlashPlan> {
    return input as FlashPlan;
  }

  async erase(): Promise<void> {}

  async write(plan: FlashPlan, onProgress: (progress: StageProgress) => void): Promise<void> {
    const total = plan.segments.reduce((sum, segment) => sum + segment.data.byteLength, 0);
    onProgress({ stage: "flashing", stagePercent: 100, totalPercent: 100, bytesWritten: total, bytesTotal: total });
  }

  async verify(): Promise<void> {}

  async reset(): Promise<void> {}
}
