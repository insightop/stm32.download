import { Stm32DaplinkProtocol } from "@/protocols/stm32/daplink/Stm32DaplinkProtocol";
import { WebHidTransport } from "@/transports/hid/WebHidTransport";
import type { FlasherPlugin } from "@/plugins/types";

export const stm32DaplinkPlugin: FlasherPlugin = {
  id: "stm32-dap-link",
  displayName: "STM32 DAP-Link",
  chipFamily: "stm32",
  flasherType: "dap-link",
  canSelectConnection: true,
  canFlash: false,
  priority: 100,
  supportedInputs: ["single-bin"],
  featureFlags: ["cmsis-dap"],
  supports: ({ chipFamily, flasherType, capabilities }) =>
    chipFamily === "stm32" && flasherType === "dap-link" && capabilities.webHid,
  createTransport: () => new WebHidTransport([]),
  createProtocol: () => new Stm32DaplinkProtocol(),
};
