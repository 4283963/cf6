<template>
  <div>
    <div class="page-header">
      <div>
        <h2 class="section-title">版权作品管理</h2>
        <p class="section-subtitle">管理音乐作品与分账设置</p>
      </div>
    </div>

    <div class="grid grid-3 mb-24">
      <div class="stat-card">
        <div class="stat-label">作品总数</div>
        <div class="stat-value">{{ works.length }}<span class="stat-unit">首</span></div>
      </div>
      <div class="stat-card">
        <div class="stat-label">总播放量</div>
        <div class="stat-value">{{ totalPlays.toLocaleString() }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">版权总收益</div>
        <div class="stat-value">¥{{ formatNumber(totalRevenue) }}</div>
      </div>
    </div>

    <div class="card">
      <table>
        <thead>
          <tr>
            <th>作品名称</th>
            <th>ISRC</th>
            <th>音乐人</th>
            <th>播放量</th>
            <th>总收益</th>
            <th>分账方</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="w in works" :key="w.id">
            <td class="strong">{{ w.title }}</td>
            <td class="mono">{{ w.isrc || '-' }}</td>
            <td>{{ w.musician?.name }}</td>
            <td>{{ getPlays(w).toLocaleString() }}</td>
            <td><span class="accent">¥{{ formatNumber(getRevenue(w)) }}</span></td>
            <td>{{ w.shares?.length || 0 }} 人</td>
            <td>{{ formatDate(w.createdAt) }}</td>
            <td>
              <button class="btn btn-ghost btn-sm" @click="$router.push(`/admin/works/${w.id}`)">
                查看分账
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue';
import { musicianApi } from '@/api';

const works = ref([]);
const musicians = ref([]);

const totalPlays = computed(() => works.value.reduce((s, w) => s + getPlays(w), 0));
const totalRevenue = computed(() => works.value.reduce((s, w) => s + getRevenue(w), 0));

const getPlays = (w) => (w.streams || []).reduce((s, r) => s + Number(r.playCount || 0), 0);
const getRevenue = (w) => (w.streams || []).reduce((s, r) => s + parseFloat(r.revenue || 0), 0);

const formatNumber = (num) => {
  const n = parseFloat(num) || 0;
  return n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatDate = (d) => {
  return new Date(d).toLocaleDateString('zh-CN');
};

const fetchAll = async () => {
  try {
    const mRes = await musicianApi.list();
    if (mRes.success) {
      musicians.value = mRes.data || [];
      const allWorks = [];
      for (const m of musicians.value) {
        const wRes = await musicianApi.getWorks(m.id);
        if (wRes.success) allWorks.push(...(wRes.data || []));
      }
      works.value = allWorks;
    }
  } catch (e) {
    console.error(e);
  }
};

onMounted(() => fetchAll());
</script>

<style scoped>
.mb-24 { margin-bottom: 24px; }
.mono { font-family: 'SF Mono', Menlo, monospace; font-size: 13px; }
.strong { font-weight: 600; }
.accent { color: var(--color-accent); font-weight: 600; }
</style>
