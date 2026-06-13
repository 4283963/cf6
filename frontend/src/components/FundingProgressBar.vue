<template>
  <div class="funding-progress-bar">
    <div class="progress-top">
      <div class="progress-stat">
        <span class="progress-amount">¥{{ formatNumber(currentAmount) }}</span>
        <span class="progress-label">已筹</span>
      </div>
      <div class="progress-stat right">
        <span class="progress-percent">{{ progressPercent }}%</span>
        <span class="progress-label">完成度</span>
      </div>
    </div>
    <div class="progress-track">
      <div
        class="progress-fill"
        :class="{ complete: progressPercent >= 100 }"
        :style="{ width: `${Math.min(progressPercent, 100)}%` }"
      >
        <div class="progress-glow"></div>
      </div>
    </div>
    <div class="progress-bottom">
      <div class="progress-stat small">
        <span class="progress-value">¥{{ formatNumber(targetAmount) }}</span>
        <span class="progress-label">目标金额</span>
      </div>
      <div class="progress-stat small" v-if="supporterCount != null">
        <span class="progress-value">{{ supporterCount }}</span>
        <span class="progress-label">支持者</span>
      </div>
      <div class="progress-stat small right">
        <span class="progress-value">¥{{ formatNumber(unitPrice) }}</span>
        <span class="progress-label">单价</span>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  currentAmount: { type: [Number, String], required: true },
  targetAmount: { type: [Number, String], required: true },
  unitPrice: { type: [Number, String], default: 0 },
  supporterCount: { type: [Number, String], default: null }
});

const progressPercent = computed(() => {
  const current = parseFloat(props.currentAmount) || 0;
  const target = parseFloat(props.targetAmount) || 0;
  if (target <= 0) return 0;
  return Math.min(100, Math.round((current / target) * 10000) / 100);
});

const formatNumber = (num) => {
  const n = parseFloat(num) || 0;
  return n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};
</script>

<style scoped>
.funding-progress-bar {
  background: linear-gradient(135deg, #fafbfc 0%, #f0f2f8 100%);
  border-radius: 12px;
  padding: 18px 20px;
  border: 1px solid var(--color-border);
}

.progress-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 12px;
}

.progress-stat {
  display: flex;
  flex-direction: column;
}

.progress-stat.right {
  align-items: flex-end;
}

.progress-amount {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-primary);
  background: linear-gradient(135deg, #e94560, #d4af37);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.progress-percent {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-accent);
}

.progress-label {
  font-size: 12px;
  color: var(--color-muted);
  margin-top: 2px;
}

.progress-track {
  width: 100%;
  height: 12px;
  background: rgba(200, 200, 220, 0.3);
  border-radius: 999px;
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #e94560 0%, #d4af37 100%);
  border-radius: 999px;
  position: relative;
  transition: width 0.8s cubic-bezier(0.22, 1, 0.36, 1);
  min-width: 0;
}

.progress-fill.complete {
  background: linear-gradient(90deg, #10b981 0%, #059669 100%);
}

.progress-glow {
  position: absolute;
  top: 0;
  right: 0;
  width: 40px;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.progress-bottom {
  display: flex;
  justify-content: space-between;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px dashed rgba(200, 200, 220, 0.5);
}

.progress-stat.small .progress-value {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text);
}

.progress-stat.small .progress-label {
  font-size: 11px;
}
</style>
