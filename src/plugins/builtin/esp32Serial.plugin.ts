import { Esp32SerialProtocol } from "@/protocols/esp32/serial/Esp32SerialProtocol";
import { WebSerialTransport } from "@/transports/serial/WebSerialTransport";
import type { FlasherPlugin } from "@/plugins/types";

export const esp32SerialPlugin: FlasherPlugin = {
  id: "esp32-serial",
  displayName: "ESP32 Serial",
  chipFamily: "esp32",
  flasherType: "serial",
  canSelectConnection: true,
  canFlash: true,
  priority: 100,
  supportedInputs: ["single-bin", "multi-image"],
  featureFlags: ["single-bin", "partition-table", "multi-image"],
  supports: ({ chipFamily, flasherType, capabilities }) =>
    chipFamily === "esp32" && flasherType === "serial" && capabilities.webSerial,
  createTransport: () => new WebSerialTransport(460800),
  createProtocol: () => new Esp32SerialProtocol(),
};
