<script setup lang="ts">
import { computed, ref } from "vue";
import type { FirmwareInputPanelExpose } from "@/features/flasher/components/firmwareInputPanelExpose";
import { useI18n } from "vue-i18n";
import { NButton, NText, NUpload, NUploadDragger, type UploadFileInfo } from "naive-ui";
import { DocumentAttachOutline } from "@vicons/ionicons5";
import type { DownloadTaskInput } from "@/core/types/download";
import FunctionZone from "@/features/flasher/components/FunctionZone.vue";
import { useFlasherStore } from "@/features/flasher/stores/flasher.store";
import { globalPluginRegistry } from "@/plugins/registry";
import { detectBrowserCapabilities, getBrowserSupportHint } from "@/plugins/capabilities";
import { parseIntelHex } from "@/shared/firmware/hex";
import { flasherLogger } from "@/features/flasher/services/flasherLogger";

const store = useFlasherStore();
const { t } = useI18n();
const file = ref<File | null>(null);
const uploadFileList = ref<UploadFileInfo[]>([]);

const capabilities = computed(() => detectBrowserCapabilities());
const selectedPlugin = computed(() =>
  globalPluginRegistry.tryResolve({
    chipFamily: store.chipFamily,
    flasherType: store.flasherType,
    capabilities: capabilities.value,
  }),
);

const inputMode = computed(() =>
  selectedPlugin.value?.supportedInputs.includes("multi-image") ? "single-bin/multi-image" : "single-bin",
);

const unavailableHint = computed(() => {
  if (!selectedPlugin.value) return t("firmware.unavailable", { hint: getBrowserSupportHint(capabilities.value) });
  return "";
});

const firmwareFingerprint = computed((): string | null =>
  file.value
    ? JSON.stringify([file.value.name, file.value.size, file.value.lastModified] as const)
    : null,
);

const onFileChange = (fileList: UploadFileInfo[]): void => {
  const latest = fileList[0] ?? null;
  uploadFileList.value = latest ? [latest] : [];
  file.value = latest?.file ?? null;
  const isElf = Boolean(file.value?.name.toLowerCase().endsWith(".elf"));
  store.setFirmwareReady(Boolean(file.value) && !isElf && Boolean(selectedPlugin.value));
  flasherLogger.info("Firmware selected", {
    fileName: file.value?.name ?? null,
    fileSize: file.value?.size ?? null,
    chipFamily: store.chipFamily,
    flasherType: store.flasherType,
  });
};

defineExpose({
  firmwareFingerprint,
  getInput: async (): Promise<DownloadTaskInput> => {
    if (!selectedPlugin.value) throw new Error(unavailableHint.value || t("firmware.unavailable", { hint: "" }));
    if (!file.value) throw new Error("No firmware selected");
    const fileName = file.value.name.toLowerCase();
    flasherLogger.debug("Loading firmware file", {
      rawFileName: file.value.name,
      sizeBytes: file.value.size,
      chipFamily: store.chipFamily,
      flasherType: store.flasherType,
    });
    if (fileName.endsWith(".elf")) {
      throw new Error("ELF parsing not implemented yet");
    }
    let data = new Uint8Array(await file.value.arrayBuffer());
    flasherLogger.trace("Firmware bytes loaded", { bytes: data.byteLength });
    let address = store.chipFamily === "esp32" ? 0x10000 : 0x08000000;
    if (fileName.endsWith(".hex")) {
      const text = await file.value.text();
      flasherLogger.debug("Parsing Intel HEX", { chars: text.length });
      const parsed = parseIntelHex(text);
      data = parsed.bytes;
      address = parsed.baseAddr;
      flasherLogger.debug("Intel HEX parsed", {
        bytes: data.byteLength,
        baseAddr: `0x${address.toString(16)}`,
      });
    }

    return {
      flasherType: store.flasherType,
      chipFamily: store.chipFamily,
      firmware: {
        kind: "single-bin",
        items: [{ address, data, label: "app" }],
      },
    };
  },
} satisfies FirmwareInputPanelExpose);
</script>

<template>
  <FunctionZone
    :title="t('zones.firmware')"
    :title-icon="DocumentAttachOutline"
    help-key="firmware"
  >
    <NText
      depth="2"
      class="hint"
    >
      {{ t("firmware.input") }}: {{ inputMode }}
    </NText>
    <NText
      v-if="store.flasherHint"
      class="warn"
    >
      {{ store.flasherHint }}
    </NText>
    <NText
      v-if="unavailableHint"
      class="warn"
    >
      {{ unavailableHint }}
    </NText>
    <NUpload
      class="upload"
      :default-upload="false"
      :show-file-list="false"
      :max="1"
      :file-list="uploadFileList"
      accept=".hex,.bin,.elf"
      @update:file-list="onFileChange"
    >
      <NUploadDragger>
        <div class="dragger-content">
          <NButton size="small">
            {{ t("firmware.selectFile") }}
          </NButton>
          <NText
            class="file-meta"
            depth="2"
          >
            {{ file ? `${file.name} | ${file.size} bytes` : t("firmware.noFile") }}
          </NText>
        </div>
        <NText
          class="drag-hint"
          depth="3"
        >
          {{ t("firmware.dragHint") }}
        </NText>
      </NUploadDragger>
    </NUpload>
  </FunctionZone>
</template>

<style scoped>
.hint { color: var(--text-muted); font-size: 13px; font-weight: 600; }
.warn { margin: 0; color: var(--error-500); font-size: 13px; }
.upload { width: 100%; }
.dragger-content {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.file-meta {
  text-align: right;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
  flex: 1 1 auto;
}
.drag-hint {
  display: block;
  margin-top: 8px;
  text-align: left;
}
</style>
