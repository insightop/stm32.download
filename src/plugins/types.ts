import type { FlasherProtocol } from "@/protocols/types";
import type { Transport } from "@/transports/types";
import type { StlinkTargetVariant } from "@/transports/adapters/stlink.adapter";

export type ChipFamily = "stm32" | "esp32";
export type FlasherType = "serial" | "usb-dfu" | "st-link" | "dap-link";

export type SupportedInput = "single-bin" | "multi-image";

export interface BrowserCapabilities {
  webSerial: boolean;
  webUsb: boolean;
  webHid: boolean;
}

export interface PluginResolveCriteria {
  chipFamily: ChipFamily;
  flasherType: FlasherType;
  capabilities: BrowserCapabilities;
}

export interface FlasherPlugin {
  id: string;
  displayName: string;
  chipFamily: ChipFamily;
  flasherType: FlasherType;
  canSelectConnection: boolean;
  canFlash: boolean;
  priority: number;
  supportedInputs: SupportedInput[];
  featureFlags: string[];
  supports: (criteria: PluginResolveCriteria) => boolean;
  createTransport: () => Transport;
  createProtocol: (transport: Transport, deps?: PluginRuntimeDeps) => FlasherProtocol;
}

export interface PluginRuntimeDeps {
  pickStlinkTarget?: (candidates: StlinkTargetVariant[]) => Promise<string | null>;
}
