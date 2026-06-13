<template>
  <div class="container">
    <section class="hero">
      <div class="hero-content">
        <h1 class="hero-title">
          让音乐与热爱相遇<br/>
          <span class="hero-accent">黑胶众筹 · 版权分账</span>
        </h1>
        <p class="hero-subtitle">
          支持独立音乐人，拥有属于你的限量版黑胶唱片
        </p>
        <div class="hero-stats">
          <div class="hero-stat">
            <span class="hero-stat-num">{{ stats.totalVinyl }}</span>
            <span class="hero-stat-label">众筹项目</span>
          </div>
          <div class="hero-stat">
            <span class="hero-stat-num">¥{{ formatNumber(stats.totalFunded) }}</span>
            <span class="hero-stat-label">累计筹款</span>
          </div>
          <div class="hero-stat">
            <span class="hero-stat-num">{{ stats.totalSupporters }}</span>
            <span class="hero-stat-label">音乐爱好者</span>
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="page-header">
        <div>
          <h2 class="section-title">正在众筹</h2>
          <p class="section-subtitle">发现正在进行的黑胶唱片众筹项目</p>
        </div>
        <div class="filter-tabs">
          <button
            v-for="tab in tabs"
            :key="tab.value"
            :class="`tab-btn ${activeTab === tab.value ? 'active' : ''}`"
            @click="activeTab = tab.value"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>

      <div v-if="filteredList.length === 0" class="empty">
        <div class="empty-icon">🎵</div>
        <div>暂无相关项目</div>
      </div>

      <div v-else class="grid grid-3">
        <VinylCard
          v-for="vinyl in filteredList"
          :key="vinyl.id"
          :vinyl="vinyl"
        />
      </div>
    </section>
  </div>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue';
import { vinylApi } from '@/api';
import VinylCard from '@/components/VinylCard.vue';

const vinylList = ref([]);
const activeTab = ref('all');

const tabs = [
  { label: '全部', value: 'all' },
  { label: '众筹中', value: 'FUNDING' },
  { label: '已成功', value: 'SUCCESS' }
];

const filteredList = computed(() => {
  if (activeTab.value === 'all') return vinylList.value;
  return vinylList.value.filter(v => v.status === activeTab.value);
});

const stats = computed(() => {
  const totalVinyl = vinylList.value.length;
  const totalFunded = vinylList.value.reduce((s, v) => s + (parseFloat(v.currentAmount) || 0), 0);
  const totalSupporters = vinylList.value.reduce((s, v) => s + (v.supporterCount || 0), 0);
  return { totalVinyl, totalFunded, totalSupporters };
});

const formatNumber = (num) => {
  const n = parseFloat(num) || 0;
  return n.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

const fetchList = async () => {
  try {
    const res = await vinylApi.list();
    if (res.success) {
      vinylList.value = res.data || [];
    }
  } catch (e) {
    console.error(e);
  }
};

onMounted(() => {
  fetchList();
});
</script>

<style scoped>
.hero {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: var(--radius-lg);
  padding: 48px 40px;
  margin-bottom: 40px;
  color: #fff;
  position: relative;
  overflow: hidden;
}

.hero::before {
  content: '💿';
  position: absolute;
  right: -40px;
  bottom: -60px;
  font-size: 280px;
  opacity: 0.08;
  animation: spin 20s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.hero-content {
  position: relative;
  z-index: 1;
}

.hero-title {
  font-size: 40px;
  font-weight: 800;
  line-height: 1.3;
  margin-bottom: 16px;
}

.hero-accent {
  background: linear-gradient(90deg, #d4af37, #e94560);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 32px;
  max-width: 520px;
}

.hero-stats {
  display: flex;
  gap: 48px;
}

.hero-stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.hero-stat-num {
  font-size: 28px;
  font-weight: 700;
  background: linear-gradient(90deg, #d4af37, #e94560);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-stat-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
}

.filter-tabs {
  display: flex;
  gap: 4px;
  background: var(--color-card);
  padding: 4px;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}

.tab-btn {
  padding: 8px 18px;
  border: none;
  background: transparent;
  border-radius: var(--radius-sm);
  font-size: 14px;
  color: var(--color-muted);
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-btn:hover {
  color: var(--color-text);
}

.tab-btn.active {
  background: linear-gradient(135deg, #e94560, #d4af37);
  color: #fff;
  font-weight: 500;
}
</style>
