import type { FlashPlan, StageProgress } from "@/core/types/download";
import type { Transport } from "@/transports/types";

export interface ProbeResult {
  chipFamily: "stm32" | "esp32";
  chipName: string;
}

export interface FlasherProtocol {
  probe(): Promise<ProbeResult>;
  sync(): Promise<void>;
  buildPlan(input: unknown): Promise<FlashPlan>;
  erase(plan: FlashPlan): Promise<void>;
  write(plan: FlashPlan, onProgress: (progress: StageProgress) => void): Promise<void>;
  verify?(plan: FlashPlan): Promise<void>;
  reset?(): Promise<void>;
}

export interface ProtocolContext {
  transport: Transport;
}
