import type { FlashPlan, StageProgress } from "@/core/types/download";
import { Esp32ImagePlanner, type Esp32ImageInput } from "@/protocols/esp32/imagePlan/Esp32ImagePlanner";
import type { FlasherProtocol, ProbeResult } from "@/protocols/types";

export class Esp32SerialProtocol implements FlasherProtocol {
  private readonly planner = new Esp32ImagePlanner();

  async probe(): Promise<ProbeResult> {
    return { chipFamily: "esp32", chipName: "ESP32" };
  }

  async sync(): Promise<void> {
    // Placeholder for esptool sync command sequence.
  }

  async buildPlan(input: unknown): Promise<FlashPlan> {
    return this.planner.buildPlan(input as Esp32ImageInput);
  }

  async erase(_plan: FlashPlan): Promise<void> {
    // Placeholder for optional erase command.
  }

  async write(plan: FlashPlan, onProgress: (progress: StageProgress) => void): Promise<void> {
    let bytesWritten = 0;
    const bytesTotal = plan.segments.reduce((sum, segment) => sum + segment.data.byteLength, 0);
    for (const segment of plan.segments) {
      bytesWritten += segment.data.byteLength;
      onProgress({
        stage: "flashing",
        stagePercent: 100,
        totalPercent: Math.floor((bytesWritten / bytesTotal) * 100),
        bytesWritten,
        bytesTotal,
      });
    }
  }

  async verify(_plan: FlashPlan): Promise<void> {
    // Placeholder for digest/verify command.
  }

  async reset(): Promise<void> {
    // Placeholder for reset command.
  }
}
