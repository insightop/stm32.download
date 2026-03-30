import { Stm32DfuProtocol } from "@/protocols/stm32/dfu/Stm32DfuProtocol";
import { WebUsbTransport } from "@/transports/usb/WebUsbTransport";
import type { FlasherPlugin } from "@/plugins/types";

export const stm32DfuPlugin: FlasherPlugin = {
  id: "stm32-usb-dfu",
  displayName: "STM32 USB DFU",
  chipFamily: "stm32",
  flasherType: "usb-dfu",
  canSelectConnection: true,
  canFlash: false,
  priority: 100,
  supportedInputs: ["single-bin"],
  featureFlags: ["dfu"],
  supports: ({ chipFamily, flasherType, capabilities }) =>
    chipFamily === "stm32" && flasherType === "usb-dfu" && capabilities.webUsb,
  createTransport: () => new WebUsbTransport([{ vendorId: 0x0483 }]),
  createProtocol: () => new Stm32DfuProtocol(),
};
