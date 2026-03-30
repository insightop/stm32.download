<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { NButton, NButtonGroup } from "naive-ui";
import { HardwareChipOutline } from "@vicons/ionicons5";
import FunctionZone from "@/features/flasher/components/FunctionZone.vue";

const { t } = useI18n();

const props = defineProps<{ value: "stm32" | "esp32" }>();
const emit = defineEmits<{ "update:value": [value: "stm32" | "esp32"] }>();

const options = [
  { id: "stm32", label: "STM32" },
  { id: "esp32", label: "ESP32" },
] as const;
</script>

<template>
  <FunctionZone
    :title="t('zones.target')"
    :title-icon="HardwareChipOutline"
    help-key="target"
  >
    <NButtonGroup class="row">
      <NButton
        v-for="option in options"
        :key="option.id"
        class="btn"
        :type="props.value === option.id ? 'primary' : 'default'"
        @click="emit('update:value', option.id)"
      >
        {{ option.label }}
      </NButton>
    </NButtonGroup>
  </FunctionZone>
</template>

<style scoped>
.row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  width: 100%;
}
.btn {
  text-transform: uppercase;
  font-weight: 600;
}
</style>

