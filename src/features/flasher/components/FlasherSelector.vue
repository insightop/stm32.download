<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { NButton, NButtonGroup, NText } from "naive-ui";
import { FlashOutline } from "@vicons/ionicons5";
import FunctionZone from "@/features/flasher/components/FunctionZone.vue";
import PluginConfigPanel from "@/features/flasher/components/PluginConfigPanel.vue";
import type { FlasherOption } from "@/features/flasher/services/flasherFacade";
import type { PluginConfigObject, PluginConfigSchema } from "@/plugins/config/pluginConfig.types";

const { t } = useI18n();

const props = defineProps<{
  value: "serial" | "usb-dfu" | "st-link" | "dap-link";
  options: FlasherOption[];
  flasherLabel: string | null;
  flasherError: string | null;
  configSchema: PluginConfigSchema | null;
  config: PluginConfigObject;
}>();
const emit = defineEmits<{
  "update:value": [value: "serial" | "usb-dfu" | "st-link" | "dap-link"];
  reenter: [];
  "update:field": [key: string, value: string | number | boolean];
}>();

function onClickFlasher(value: "serial" | "usb-dfu" | "st-link" | "dap-link"): void {
  if (props.value === value) {
    emit("reenter");
    return;
  }
  emit("update:value", value);
}
</script>

<template>
  <FunctionZone
    :title="t('zones.flasher')"
    :title-icon="FlashOutline"
    help-key="flasher"
  >
    <NButtonGroup class="row">
      <NButton
        v-for="option in props.options"
        :key="option.pluginId"
        class="btn"
        :type="props.value === option.flasherType ? 'primary' : 'default'"
        :disabled="!option.isSupported"
        @click="onClickFlasher(option.flasherType)"
      >
        {{ option.flasherType }}
      </NButton>
    </NButtonGroup>
    <NText class="meta">
      {{ t("flasherPage.connected") }}: {{ props.flasherLabel ?? t("flasherPage.notSelected") }}
      <span
        v-if="props.flasherError"
        class="warn"
      > ({{ props.flasherError }})</span>
    </NText>
    <PluginConfigPanel
      :schema="props.configSchema"
      :config="props.config"
      @update:field="(key, value) => emit('update:field', key, value)"
    />
  </FunctionZone>
</template>

<style scoped>
.row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  width: 100%;
}
.btn {
  text-transform: uppercase;
  font-weight: 600;
}
.meta { display: block; margin-top: 10px; color: var(--text-muted); font-size: 13px; text-align: left; }
.warn { color: var(--error-500); }
</style>

