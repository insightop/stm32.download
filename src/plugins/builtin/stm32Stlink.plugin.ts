import { Stm32StlinkProtocol } from "@/protocols/stm32/stlink/Stm32StlinkProtocol";
import { WebUsbTransport } from "@/transports/usb/WebUsbTransport";
import type { UsbTransport } from "@/transports/types";
import type { FlasherPlugin } from "@/plugins/types";

export const stm32StlinkPlugin: FlasherPlugin = {
  id: "stm32-st-link",
  displayName: "STM32 ST-Link",
  chipFamily: "stm32",
  flasherType: "st-link",
  canSelectConnection: true,
  canFlash: true,
  priority: 100,
  supportedInputs: ["single-bin"],
  featureFlags: ["verify", "auto-reset"],
  supports: ({ chipFamily, flasherType, capabilities }) =>
    chipFamily === "stm32" && flasherType === "st-link" && capabilities.webUsb,
  createTransport: () => new WebUsbTransport([{ vendorId: 0x0483 }]),
  createProtocol: (transport, deps) =>
    new Stm32StlinkProtocol(transport as UsbTransport, deps?.pickStlinkTarget),
};
