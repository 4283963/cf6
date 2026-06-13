<template>
  <router-link :to="`/vinyl/${vinyl.id}`" class="vinyl-card">
    <div class="vinyl-cover">
      <div v-if="vinyl.coverImage" class="cover-img">
        <img :src="vinyl.coverImage" :alt="vinyl.title" />
      </div>
      <div v-else class="cover-placeholder">
        <div class="vinyl-disc">
          <div class="disc-inner"></div>
          <div class="disc-label">💿</div>
        </div>
      </div>
      <div class="vinyl-badge">
        <span :class="`badge ${vinyl.status === 'SUCCESS' ? 'badge-success' : 'badge-gold'}`">
          {{ vinyl.status === 'SUCCESS' ? '众筹成功' : '众筹中' }}
        </span>
      </div>
    </div>
    <div class="vinyl-content">
      <h3 class="vinyl-title">{{ vinyl.title }}</h3>
      <div class="vinyl-musician">
        <span class="musician-name">{{ vinyl.musician?.name }}</span>
        <span class="musician-studio">{{ vinyl.musician?.studioName }}</span>
      </div>
      <div class="vinyl-progress-mini">
        <div class="mini-track">
          <div class="mini-fill" :style="{ width: `${Math.min(vinyl.progressPercent, 100)}%` }"></div>
        </div>
        <span class="mini-percent">{{ vinyl.progressPercent }}%</span>
      </div>
      <div class="vinyl-meta">
        <div class="meta-item">
          <span class="meta-label">已筹</span>
          <span class="meta-value">¥{{ formatNumber(vinyl.currentAmount) }}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">单价</span>
          <span class="meta-value">¥{{ formatNumber(vinyl.unitPrice) }}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">支持</span>
          <span class="meta-value">{{ vinyl.supporterCount }}人</span>
        </div>
      </div>
    </div>
  </router-link>
</template>

<script setup>
defineProps({
  vinyl: { type: Object, required: true }
});

const formatNumber = (num) => {
  const n = parseFloat(num) || 0;
  return n.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};
</script>

<style scoped>
.vinyl-card {
  display: block;
  background: var(--color-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  text-decoration: none;
  color: inherit;
  transition: all 0.3s ease;
}

.vinyl-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
}

.vinyl-cover {
  position: relative;
  aspect-ratio: 1 / 1;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  overflow: hidden;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cover-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.vinyl-disc {
  width: 65%;
  aspect-ratio: 1 / 1;
  border-radius: 50%;
  background: radial-gradient(circle at center, #2a2a3e 0%, #0f0f1e 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  animation: spin 12s linear infinite;
}

.vinyl-disc::before {
  content: '';
  position: absolute;
  inset: 20%;
  border-radius: 50%;
  background: repeating-radial-gradient(
    circle at center,
    transparent 0,
    transparent 2px,
    rgba(255, 255, 255, 0.03) 2px,
    rgba(255, 255, 255, 0.03) 4px
  );
}

.disc-inner {
  width: 35%;
  aspect-ratio: 1 / 1;
  border-radius: 50%;
  background: linear-gradient(135deg, #d4af37, #e94560);
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.disc-label {
  font-size: 24px;
  position: absolute;
  z-index: 2;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.vinyl-badge {
  position: absolute;
  top: 16px;
  right: 16px;
}

.vinyl-content {
  padding: 18px 20px 20px;
}

.vinyl-title {
  font-size: 17px;
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: 6px;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.vinyl-musician {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 14px;
}

.musician-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
}

.musician-studio {
  font-size: 12px;
  color: var(--color-muted);
}

.vinyl-progress-mini {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.mini-track {
  flex: 1;
  height: 6px;
  background: rgba(200, 200, 220, 0.3);
  border-radius: 999px;
  overflow: hidden;
}

.mini-fill {
  height: 100%;
  background: linear-gradient(90deg, #e94560, #d4af37);
  border-radius: 999px;
  transition: width 0.5s ease;
}

.mini-percent {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-accent);
  min-width: 42px;
  text-align: right;
}

.vinyl-meta {
  display: flex;
  justify-content: space-between;
  padding-top: 14px;
  border-top: 1px dashed rgba(200, 200, 220, 0.5);
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.meta-label {
  font-size: 11px;
  color: var(--color-muted);
}

.meta-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-primary);
}
</style>
