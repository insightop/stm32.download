import type { FlasherProtocol } from "@/protocols/types";
import type {
  PluginConfigMap,
  PluginConfigObject,
  PluginConfigSchema,
} from "@/plugins/config/pluginConfig.types";
import type { StlinkTargetVariant } from "@/transports/adapters/stlink.adapter";
import type { Transport } from "@/transports/types";

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

export interface PluginRuntimeDeps {
  pickStlinkTarget?: (candidates: StlinkTargetVariant[]) => Promise<string | null>;
}

export interface FlasherPlugin {
  id: keyof PluginConfigMap;
  displayName: string;
  chipFamily: ChipFamily;
  flasherType: FlasherType;
  canSelectConnection: boolean;
  canFlash: boolean;
  priority: number;
  supportedInputs: SupportedInput[];
  featureFlags: string[];
  supports: (criteria: PluginResolveCriteria) => boolean;
  configSchema?: PluginConfigSchema;
  createDefaultConfig?: () => PluginConfigObject;
  normalizeConfig?: (raw: Record<string, unknown> | undefined) => PluginConfigObject;
  createTransport: (config?: PluginConfigObject) => Transport;
  createProtocol: (transport: Transport, deps?: PluginRuntimeDeps, config?: PluginConfigObject) => FlasherProtocol;
}
