<template>
  <div>
    <div class="page-header">
      <div>
        <h2 class="section-title">版权作品分账明细</h2>
        <p class="section-subtitle">{{ workData?.title || '作品详情' }}</p>
      </div>
      <div class="flex gap-12">
        <button
          class="btn btn-gold"
          :disabled="settling"
          @click="handleSettle"
        >
          {{ settling ? '计算中...' : '💰 执行分账结算' }}
        </button>
        <router-link to="/admin/works" class="btn btn-ghost">返回列表</router-link>
      </div>
    </div>

    <div v-if="loading" class="empty">
      <div class="empty-icon">⏳</div>
      <div>加载中...</div>
    </div>

    <div v-else-if="workData" class="space-y-24">
      <div class="grid grid-4">
        <div class="stat-card">
          <div class="stat-label">总播放量</div>
          <div class="stat-value">{{ workData.totalPlays?.toLocaleString() || 0 }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">总收益</div>
          <div class="stat-value">¥{{ formatNumber(workData.totalRevenue) }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">分账方</div>
          <div class="stat-value">{{ workData.shares?.length || 0 }}<span class="stat-unit">人</span></div>
        </div>
        <div class="stat-card">
          <div class="stat-label">流媒体平台</div>
          <div class="stat-value">{{ Object.keys(workData.platformStats || {}).length }}<span class="stat-unit">个</span></div>
        </div>
      </div>

      <div class="grid grid-2">
        <div class="card">
          <h3 class="section-title mb-16">📊 分账比例饼图</h3>
          <RevenueSharePieChart
            v-if="workData.shares?.length"
            :shares="workData.shares"
            :totalAmount="workData.totalRevenue"
          />
          <div v-else class="empty">
            <div class="empty-icon">📊</div>
            <div>暂无分账数据</div>
          </div>
        </div>

        <div class="card">
          <h3 class="section-title mb-16">📈 各平台收益统计</h3>
          <div v-if="Object.keys(platformDisplay).length === 0" class="empty">
            <div class="empty-icon">📊</div>
            <div>暂无平台数据</div>
          </div>
          <div v-else class="platform-stats">
            <div v-for="item in platformDisplay" :key="item.platform" class="platform-item">
              <div class="platform-info">
                <span class="platform-icon">{{ platformIcons[item.platform] || '🎵' }}</span>
                <span class="platform-name">{{ platformLabels[item.platform] || item.platform }}</span>
              </div>
              <div class="platform-data">
                <div class="platform-plays">{{ item.playCount.toLocaleString() }} 次播放</div>
                <div class="platform-revenue">¥{{ formatNumber(item.revenue) }}</div>
              </div>
              <div class="platform-bar-wrap">
                <div
                  class="platform-bar"
                  :style="{ width: `${item.percent}%` }"
                ></div>
              </div>
              <div class="platform-percent">{{ item.percent.toFixed(1) }}%</div>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <h3 class="section-title mb-16">💸 分账明细</h3>
        <table>
          <thead>
            <tr>
              <th>角色</th>
              <th>音乐人</th>
              <th>分账比例</th>
              <th>应得金额</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in workData.shares" :key="s.id">
              <td>
                <span
                  class="role-badge"
                  :style="{ background: getRoleBg(s.role), color: getRoleColor(s.role) }"
                >
                  {{ s.roleLabel }}
                </span>
              </td>
              <td class="strong">{{ s.musicianName }}</td>
              <td>{{ s.percentage }}%</td>
              <td><span class="accent">¥{{ formatNumber(s.amount) }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="card">
        <h3 class="section-title mb-16">📋 收益流水记录</h3>
        <table>
          <thead>
            <tr>
              <th>平台</th>
              <th>播放量</th>
              <th>收益</th>
              <th>统计周期</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in workData.streams" :key="s.id">
              <td>
                <span class="platform-mini">
                  {{ platformIcons[s.platform] || '🎵' }}
                  {{ platformLabels[s.platform] || s.platform }}
                </span>
              </td>
              <td>{{ s.playCount?.toLocaleString() || 0 }}</td>
              <td>¥{{ formatNumber(s.revenue) }}</td>
              <td>{{ formatDate(s.periodStart) }} ~ {{ formatDate(s.periodEnd) }}</td>
              <td>
                <span :class="`badge ${s.settled ? 'badge-success' : 'badge-warning'}`">
                  {{ s.settled ? '已结算' : '待结算' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { revenueApi, useToast } from '@/api';
import RevenueSharePieChart from '@/components/RevenueSharePieChart.vue';

const route = useRoute();
const toast = useToast();

const loading = ref(true);
const settling = ref(false);
const workData = ref(null);

const platformLabels = {
  NETEASE: '网易云音乐',
  QQ_MUSIC: 'QQ音乐',
  KUGOU: '酷狗音乐',
  KUWO: '酷我音乐',
  BILIBILI: '哔哩哔哩',
  SPOTIFY: 'Spotify',
  OTHER: '其他'
};

const platformIcons = {
  NETEASE: '☁️',
  QQ_MUSIC: '🎵',
  KUGOU: '🎧',
  KUWO: '🎶',
  BILIBILI: '📺',
  SPOTIFY: '💚',
  OTHER: '🎵'
};

const platformDisplay = computed(() => {
  if (!workData.value?.platformStats) return [];
  const maxRevenue = Math.max(...Object.values(workData.value.platformStats).map(s => parseFloat(s.revenue)), 1);
  return Object.entries(workData.value.platformStats).map(([platform, stat]) => ({
    platform,
    playCount: Number(stat.playCount || 0),
    revenue: parseFloat(stat.revenue || 0),
    percent: (parseFloat(stat.revenue || 0) / maxRevenue) * 100
  })).sort((a, b) => b.revenue - a.revenue);
});

const getRoleColor = (r) => {
  const c = { LYRICIST: '#e94560', COMPOSER: '#b8860b', ARRANGER: '#4338ca', LEAD_VOCAL: '#047857' };
  return c[r] || '#666';
};

const getRoleBg = (r) => {
  const c = { LYRICIST: 'rgba(233,69,96,0.12)', COMPOSER: 'rgba(212,175,55,0.15)', ARRANGER: 'rgba(79,70,229,0.12)', LEAD_VOCAL: 'rgba(16,185,129,0.12)' };
  return c[r] || '#f0f0f0';
};

const formatNumber = (n) => {
  const x = parseFloat(n) || 0;
  return x.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatDate = (d) => new Date(d).toLocaleDateString('zh-CN');

const fetchData = async () => {
  try {
    const res = await revenueApi.getWorkRevenue(route.params.id);
    if (res.success) {
      workData.value = res.data;
    }
  } catch (e) {
    toast.show(e.message || '加载失败', 'error');
  } finally {
    loading.value = false;
  }
};

const handleSettle = async () => {
  if (settling.value) return;
  settling.value = true;
  try {
    const res = await revenueApi.settle(route.params.id);
    if (res.success) {
      toast.show('分账结算完成！', 'success');
      fetchData();
    } else {
      toast.show(res.message || '结算失败', 'error');
    }
  } catch (e) {
    toast.show(e.message || '结算失败', 'error');
  } finally {
    settling.value = false;
  }
};

onMounted(() => fetchData());
</script>

<style scoped>
.mb-16 { margin-bottom: 16px; }
.space-y-24 > * + * { margin-top: 24px; }
.flex { display: flex; }
.gap-12 { gap: 12px; }
.strong { font-weight: 600; }
.accent { color: var(--color-accent); font-weight: 700; }

.role-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}

.platform-stats {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.platform-item {
  display: grid;
  grid-template-columns: 180px 140px 1fr 60px;
  gap: 14px;
  align-items: center;
}

.platform-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
}

.platform-icon {
  font-size: 18px;
}

.platform-data {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.platform-plays {
  font-size: 12px;
  color: var(--color-muted);
}

.platform-revenue {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-accent);
}

.platform-bar-wrap {
  height: 8px;
  background: rgba(200, 200, 220, 0.2);
  border-radius: 999px;
  overflow: hidden;
}

.platform-bar {
  height: 100%;
  background: linear-gradient(90deg, #e94560, #d4af37);
  border-radius: 999px;
  transition: width 0.6s ease;
}

.platform-percent {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-muted);
  text-align: right;
}

.platform-mini {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
}
</style>
