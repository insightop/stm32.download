<!-- eslint-disable vue/no-v-html -->
<script setup lang="ts">
import { computed } from "vue";
import { NButton, NIcon, NPopover } from "naive-ui";
import type { Component } from "vue";
import { useI18n } from "vue-i18n";
import { marked } from "marked";
import DOMPurify from "dompurify";

const props = defineProps<{ title: string; helpKey?: string; titleIcon?: Component }>();

const { t, locale } = useI18n();

const helpsZh = import.meta.glob("@/helps/zh/*.md", { eager: true, query: "?raw", import: "default" }) as Record<
  string,
  string
>;
const helpsEn = import.meta.glob("@/helps/en/*.md", { eager: true, query: "?raw", import: "default" }) as Record<
  string,
  string
>;

const helpHtml = computed(() => {
  if (!props.helpKey) return "<p>No help available.</p>";
  const dir = locale.value === "zh-CN" ? "zh" : "en";
  const modules = dir === "zh" ? helpsZh : helpsEn;
  const path = `/src/helps/${dir}/${props.helpKey}.md`;
  const raw =
    modules[path] ??
    `# ${props.title}\n\n${dir === "zh" ? "帮助内容即将提供。" : "Help content is coming soon."}`;
  const html = marked.parse(raw) as string;
  return DOMPurify.sanitize(html);
});
</script>

<template>
  <section class="zone">
    <header class="zone-title">
      <span class="title-main">
        <NIcon
          v-if="titleIcon"
          :component="titleIcon"
          :size="14"
          class="title-icon"
        />
        <span>{{ title }}</span>
      </span>
      <NPopover
        v-if="helpKey"
        trigger="hover"
        placement="bottom-end"
        :show-arrow="true"
        :delay="180"
        scrollable
        class="help-popover"
      >
        <template #trigger>
          <NButton
            quaternary
            circle
            size="tiny"
            class="help-btn"
            :aria-label="t('help.tooltip')"
          >
            ?
          </NButton>
        </template>
        <div class="help-popover-inner">
          <!-- eslint-disable-next-line vue/no-v-html -->
          <article
            class="help-content"
            v-html="helpHtml"
          />
        </div>
      </NPopover>
    </header>
    <div class="zone-content">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.zone {
  border: 1px solid var(--border-default);
  border-radius: 14px;
  background: var(--surface-bg);
  box-shadow: var(--shadow-soft);
  overflow: hidden;
}
.zone-title {
  padding: 10px 14px;
  border-bottom: 1px solid var(--border-default);
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  text-transform: lowercase;
  letter-spacing: 0.04em;
  font-weight: 700;
  color: var(--text-muted);
}
.title-main {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.title-icon {
  color: var(--text-muted);
}
.help-btn {
  color: var(--text-muted);
}
.zone-content {
  padding: 14px;
  display: grid;
  gap: 12px;
}
.help-popover-inner {
  width: fit-content;
  max-width: min(640px, 92vw);
  min-width: min(200px, 92vw);
  max-height: min(70vh, 560px);
  overflow: auto;
}
.help-content :deep(img),
.help-content :deep(table) {
  max-width: 100%;
}
.help-content :deep(h1),
.help-content :deep(h2),
.help-content :deep(h3) {
  margin: 0.5em 0;
  color: var(--text-primary);
}
.help-content :deep(p),
.help-content :deep(li) {
  color: var(--text-secondary);
}
.help-content :deep(code) {
  background: color-mix(in srgb, var(--surface-bg) 85%, var(--surface-contrast));
  padding: 0 4px;
  border-radius: 4px;
}
</style>
