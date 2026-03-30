import { Stm32UartProtocol } from "@/protocols/stm32/serial/Stm32UartProtocol";
import { WebSerialTransport } from "@/transports/serial/WebSerialTransport";
import type { SerialTransport } from "@/transports/types";
import type { FlasherPlugin } from "@/plugins/types";

export const stm32SerialPlugin: FlasherPlugin = {
  id: "stm32-serial",
  displayName: "STM32 Serial",
  chipFamily: "stm32",
  flasherType: "serial",
  canSelectConnection: true,
  canFlash: true,
  priority: 100,
  supportedInputs: ["single-bin"],
  featureFlags: ["verify", "cancel"],
  supports: ({ chipFamily, flasherType, capabilities }) =>
    chipFamily === "stm32" && flasherType === "serial" && capabilities.webSerial,
  createTransport: () => new WebSerialTransport(),
  createProtocol: (transport) => new Stm32UartProtocol(transport as SerialTransport),
};
