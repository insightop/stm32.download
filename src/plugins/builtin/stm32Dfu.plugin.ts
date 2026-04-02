import { Stm32DfuProtocol } from "@/protocols/stm32/dfu/Stm32DfuProtocol";
import { stm32FixedAddressPolicy } from "@/plugins/firmwareInputPresets";
import type { FlasherPlugin } from "@/plugins/types";
import type { UsbTransport } from "@/transports/types";
import { WebUsbTransport } from "@/transports/usb/WebUsbTransport";

/**
 * STM32 ROM DFU (system bootloader) is commonly exposed as 0483:DF11.
 * Keep filter strict to avoid listing ST-Link devices in DFU mode picker.
 */
const STM32_DFU_USB_FILTERS: USBDeviceFilter[] = [
  { vendorId: 0x0483, productId: 0xdf11 },
];

export const stm32DfuPlugin: FlasherPlugin = {
  id: "stm32-usb-dfu",
  displayName: "STM32 USB DFU",
  chipFamily: "stm32",
  flasherType: "usb-dfu",
  canSelectConnection: true,
  canFlash: true,
  priority: 100,
  supportedInputs: ["single-bin"],
  firmwareInputPolicy: stm32FixedAddressPolicy,
  featureFlags: ["dfu"],
  supports: ({ chipFamily, flasherType, capabilities }) =>
    chipFamily === "stm32" && flasherType === "usb-dfu" && capabilities.webUsb,
  createTransport: () => new WebUsbTransport(STM32_DFU_USB_FILTERS),
  createProtocol: (transport) => new Stm32DfuProtocol(transport as UsbTransport),
};
