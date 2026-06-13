<template>
  <div>
    <div class="grid grid-4 mb-24">
      <div class="stat-card">
        <div class="stat-label">众筹项目</div>
        <div class="stat-value">{{ stats.totalVinyl }}<span class="stat-unit">个</span></div>
      </div>
      <div class="stat-card">
        <div class="stat-label">累计筹款</div>
        <div class="stat-value">¥{{ formatNumber(stats.totalFunded) }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">总订单</div>
        <div class="stat-value">{{ stats.totalOrders }}<span class="stat-unit">笔</span></div>
      </div>
      <div class="stat-card">
        <div class="stat-label">版权收益</div>
        <div class="stat-value">¥{{ formatNumber(stats.totalRevenue) }}</div>
      </div>
    </div>

    <div class="grid grid-2">
      <div class="card">
        <h3 class="section-title mb-16">进行中的众筹</h3>
        <div v-if="activeVinyl.length === 0" class="empty">
          <div class="empty-icon">💿</div>
          <div>暂无进行中的众筹</div>
        </div>
        <div v-else class="vinyl-list">
          <div v-for="v in activeVinyl" :key="v.id" class="vinyl-mini-item">
            <div class="vinyl-mini-info">
              <div class="vinyl-mini-title">{{ v.title }}</div>
              <div class="vinyl-mini-meta">
                已筹 ¥{{ formatNumber(v.currentAmount) }} / ¥{{ formatNumber(v.targetAmount) }}
              </div>
            </div>
            <div class="vinyl-mini-progress">
              <div class="mini-track">
                <div class="mini-fill" :style="{ width: `${Math.min(v.progressPercent, 100)}%` }"></div>
              </div>
              <span class="mini-percent">{{ v.progressPercent }}%</span>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <h3 class="section-title mb-16">版权作品分账概览</h3>
        <div v-if="workRevenueList.length === 0" class="empty">
          <div class="empty-icon">🎵</div>
          <div>暂无版权作品数据</div>
        </div>
        <div v-else class="revenue-list">
          <div
            v-for="w in workRevenueList"
            :key="w.id"
            class="revenue-mini-item"
            @click="$router.push(`/admin/works/${w.id}`)"
          >
            <div class="revenue-mini-info">
              <div class="revenue-mini-title">{{ w.title }}</div>
              <div class="revenue-mini-meta">
                {{ w.shares?.length || 0 }} 位创作者 · {{ totalPlays(w) }} 次播放
              </div>
            </div>
            <div class="revenue-mini-amount">
              ¥{{ formatNumber(totalRevenue(w)) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue';
import { vinylApi, orderApi, musicianApi } from '@/api';

const vinylList = ref([]);
const orders = ref([]);
const works = ref([]);

const activeVinyl = computed(() => vinylList.value.filter(v => v.status === 'FUNDING'));

const workRevenueList = computed(() => {
  return works.value.filter(w => w.streams?.length > 0);
});

const stats = computed(() => {
  const totalVinyl = vinylList.value.length;
  const totalFunded = vinylList.value.reduce((s, v) => s + (parseFloat(v.currentAmount) || 0), 0);
  const totalOrders = orders.value.length;
  const totalRevenue = works.value.reduce((s, w) => s + totalRevenue(w), 0);
  return { totalVinyl, totalFunded, totalOrders, totalRevenue };
});

const totalRevenue = (w) => (w.streams || []).reduce((s, r) => s + parseFloat(r.revenue || 0), 0);
const totalPlays = (w) => (w.streams || []).reduce((s, r) => s + Number(r.playCount || 0), 0).toLocaleString();

const formatNumber = (num) => {
  const n = parseFloat(num) || 0;
  return n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const fetchAll = async () => {
  try {
    const [vRes, oRes, mRes] = await Promise.all([
      vinylApi.list(),
      orderApi.list(),
      musicianApi.list()
    ]);
    if (vRes.success) vinylList.value = vRes.data || [];
    if (oRes.success) orders.value = oRes.data || [];
    if (mRes.success && mRes.data?.length) {
      const workRes = await musicianApi.getWorks(mRes.data[0].id);
      if (workRes.success) works.value = workRes.data || [];
    }
  } catch (e) {
    console.error(e);
  }
};

onMounted(() => {
  fetchAll();
});
</script>

<style scoped>
.mb-16 { margin-bottom: 16px; }
.mb-24 { margin-bottom: 24px; }

.vinyl-list, .revenue-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.vinyl-mini-item {
  padding: 14px 16px;
  background: var(--color-bg);
  border-radius: var(--radius-md);
}

.vinyl-mini-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.vinyl-mini-title {
  font-weight: 600;
  color: var(--color-primary);
}

.vinyl-mini-meta {
  font-size: 12px;
  color: var(--color-muted);
}

.vinyl-mini-progress {
  display: flex;
  align-items: center;
  gap: 10px;
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
}

.mini-percent {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-accent);
  min-width: 40px;
  text-align: right;
}

.revenue-mini-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  background: var(--color-bg);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
}

.revenue-mini-item:hover {
  background: linear-gradient(135deg, rgba(233, 69, 96, 0.05), rgba(212, 175, 55, 0.05));
}

.revenue-mini-title {
  font-weight: 600;
  color: var(--color-primary);
}

.revenue-mini-meta {
  font-size: 12px;
  color: var(--color-muted);
  margin-top: 2px;
}

.revenue-mini-amount {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-accent);
}
</style>
