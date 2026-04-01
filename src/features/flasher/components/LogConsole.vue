<script setup lang="ts">
import { NIcon, NTag } from "naive-ui";
import { useI18n } from "vue-i18n";
import type { LogEntry, LogLevel } from "@/features/flasher/types/log";
import { getLogLevelPresentation } from "@/features/flasher/presentation/logLevelPresentation";

function levelLabelKey(level: LogLevel): string {
  return getLogLevelPresentation(level).i18nKey;
}

defineProps<{ logs: LogEntry[] }>();

const { t } = useI18n();

const formatTime = (iso: string): string => {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  const ms = String(d.getMilliseconds()).padStart(3, "0");
  return `${hh}:${mm}:${ss}.${ms}`;
};

const formatContext = (ctx: unknown): string => {
  if (ctx === undefined) return "";
  try {
    const s = JSON.stringify(ctx);
    return s.length > 600 ? `${s.slice(0, 600)}…` : s;
  } catch {
    return String(ctx);
  }
};
</script>

<template>
  <div class="console">
    <article
      v-for="entry in logs"
      :key="entry.id"
      class="line"
    >
      <div class="meta-col">
        <span class="ts">{{ formatTime(entry.timestamp) }}</span>
        <NTag
          class="lvl-tag"
          :data-level="entry.level"
          size="small"
          :bordered="false"
        >
          <span class="lvl-inner">
            <NIcon
              :component="getLogLevelPresentation(entry.level).icon"
              :size="10"
            />
            {{ t(levelLabelKey(entry.level)) }}
          </span>
        </NTag>
      </div>
      <div class="msg-col">
        <div class="msg">
          {{ entry.message }}
        </div>
        <div
          v-if="entry.context !== undefined"
          class="ctx"
        >
          <pre class="ctx-body">{{ formatContext(entry.context) }}</pre>
        </div>
      </div>
    </article>
    <div
      v-if="logs.length === 0"
      class="empty"
    >
      {{ t("log.empty") }}
    </div>
  </div>
</template>

<style scoped>
.console {
  margin: 0;
  background: var(--log-surface-bg);
  color: var(--log-text-primary);
  border-radius: 10px;
  min-height: 220px;
  max-height: calc(100vh - 140px);
  padding: 6px 4px;
  font-size: 12px;
  line-height: 1.5;
  text-align: left;
  align-content: start;
  overflow: auto;
  display: grid;
  gap: 8px;
}
.line {
  display: grid;
  grid-template-columns: fit-content(76px) 1fr;
  gap: 5px;
  border: 1px solid var(--log-border);
  border-radius: 10px;
  padding: 5px 5px;
  background: var(--log-card-bg);
}
.meta-col {
  display: grid;
  gap: 2px;
  align-content: start;
  justify-items: start;
  min-width: 0;
}
.ts {
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
  font-size: 9px;
}
.lvl-tag :deep(.n-tag__content) {
  font-weight: 700;
  letter-spacing: 0.01em;
  font-size: 9px;
}
.lvl-inner {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}
.lvl-tag {
  --n-height: 14px;
  --n-padding: 0 4px;
}
.lvl-tag[data-level="trace"] { background: var(--trace-500); color: #ffffff; }
.lvl-tag[data-level="debug"] { background: var(--debug-500); color: #ffffff; }
.lvl-tag[data-level="info"] { background: var(--info-500); color: #ffffff; }
.lvl-tag[data-level="warning"] { background: var(--warning-500); color: #ffffff; }
.lvl-tag[data-level="error"] { background: var(--error-500); color: #ffffff; }
.msg-col {
  min-width: 0;
  display: grid;
  gap: 4px;
}
.msg {
  color: var(--log-text-primary);
  white-space: pre-wrap;
  word-break: break-word;
}
.ctx-body {
  margin: 0;
  font-size: 10px;
  line-height: 1.35;
  color: var(--text-secondary);
  white-space: pre-wrap;
  word-break: break-word;
}
.empty {
  color: var(--text-muted);
}
</style>
