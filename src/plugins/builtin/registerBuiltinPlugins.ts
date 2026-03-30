import { globalPluginRegistry } from "@/plugins/registry";
import { esp32SerialPlugin } from "@/plugins/builtin/esp32Serial.plugin";
import { stm32DaplinkPlugin } from "@/plugins/builtin/stm32Daplink.plugin";
import { stm32DfuPlugin } from "@/plugins/builtin/stm32Dfu.plugin";
import { stm32SerialPlugin } from "@/plugins/builtin/stm32Serial.plugin";
import { stm32StlinkPlugin } from "@/plugins/builtin/stm32Stlink.plugin";

export function registerBuiltinPlugins(): void {
  globalPluginRegistry.register(stm32SerialPlugin);
  globalPluginRegistry.register(stm32DfuPlugin);
  globalPluginRegistry.register(stm32StlinkPlugin);
  globalPluginRegistry.register(stm32DaplinkPlugin);
  globalPluginRegistry.register(esp32SerialPlugin);
}
