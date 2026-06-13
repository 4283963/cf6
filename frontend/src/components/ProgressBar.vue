<template>
  <div class="progress-wrapper">
    <div class="progress-header">
      <div class="progress-info">
        <span class="progress-current">¥{{ formatNumber(current) }}</span>
        <span class="progress-target"> / 目标 ¥{{ formatNumber(target) }}</span>
      </div>
      <div class="progress-percent">{{ percent }}%</div>
    </div>
    <div class="progress-track">
      <div
        class="progress-bar"
        :style="{ width: `${Math.min(percent, 100)}%` }"
        :class="{ 'progress-complete': percent >= 100 }"
      >
        <div class="progress-shine"></div>
      </div>
    </div>
    <div class="progress-stats" v-if="supporterCount != null">
      <span class="stat-item">
        <span class="stat-emoji">👥</span>
        <span class="stat-num">{{ supporterCount }}</span>
        <span class="stat-label">位支持者</span>
      </span>
      <span class="stat-item" v-if="unitPrice">
        <span class="stat-emoji">💿</span>
        <span class="stat-num">¥{{ unitPrice }}</span>
        <span class="stat-label">单价</span>
      </span>
      <span class="stat-item" v-if="deadline">
        <span class="stat-emoji">⏰</span>
        <span class="stat-num">{{ daysLeft }}</span>
        <span class="stat-label">天剩余</span>
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  current: { type: [Number, String], default: 0 },
  target: { type: [Number, String], default: 0 },
  supporterCount: { type: [Number, String], default: null },
  unitPrice: { type: [Number, String], default: null },
  deadline: { type: [String, Date], default: null }
});

const percent = computed(() => {
  const c = parseFloat(props.current) || 0;
  const t = parseFloat(props.target) || 0;
  if (t <= 0) return 0;
  return Math.min(100, Math.round((c / t) * 10000) / 100);
});

const daysLeft = computed(() => {
  if (!props.deadline) return '-';
  const diff = new Date(props.deadline) - new Date();
  return Math.max(0, Math.ceil(diff / (24 * 3600 * 1000)));
});

function formatNumber(num) {
  const n = parseFloat(num) || 0;
  return n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
</script>

<style scoped>
.progress-wrapper {
  width: 100%;
}

.progress-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 10px;
}

.progress-info {
  font-size: 15px;
}

.progress-current {
  font-weight: 700;
  color: var(--color-accent);
  font-size: 18px;
}

.progress-target {
  color: var(--color-muted);
  font-size: 13px;
}

.progress-percent {
  font-weight: 700;
  color: var(--color-primary);
  font-size: 18px;
}

.progress-track {
  height: 12px;
  background: var(--color-bg);
  border-radius: 999px;
  overflow: hidden;
  position: relative;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #e94560 0%, #d4af37 100%);
  border-radius: 999px;
  position: relative;
  transition: width 0.8s cubic-bezier(0.16, 1, 0.3, 1);
  min-width: 4px;
}

.progress-complete {
  background: linear-gradient(90deg, #10b981 0%, #059669 100%);
}

.progress-shine {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.4) 50%,
    transparent 100%
  );
  animation: shine 2s ease-in-out infinite;
}

@keyframes shine {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.progress-stats {
  display: flex;
  gap: 24px;
  margin-top: 14px;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--color-muted);
}

.stat-emoji {
  font-size: 16px;
}

.stat-num {
  font-weight: 600;
  color: var(--color-text);
  margin: 0 2px;
}
</style>
