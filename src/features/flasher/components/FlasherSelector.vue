<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { NButton, NButtonGroup, NText } from "naive-ui";
import { FlashOutline } from "@vicons/ionicons5";
import FunctionZone from "@/features/flasher/components/FunctionZone.vue";
import type { FlasherOption } from "@/features/flasher/services/flasherFacade";

const { t } = useI18n();

const props = defineProps<{
  value: "serial" | "usb-dfu" | "st-link" | "dap-link";
  options: FlasherOption[];
  flasherLabel: string | null;
  flasherError: string | null;
}>();
const emit = defineEmits<{ "update:value": [value: "serial" | "usb-dfu" | "st-link" | "dap-link"] }>();
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
        @click="emit('update:value', option.flasherType)"
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

