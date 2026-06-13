<template>
  <div>
    <div class="page-header">
      <div>
        <h2 class="section-title">黑胶项目管理</h2>
        <p class="section-subtitle">查看和管理所有黑胶唱片众筹项目</p>
      </div>
      <router-link to="/admin/vinyl/create" class="btn btn-primary">
        ➕ 发起新众筹
      </router-link>
    </div>

    <div class="card">
      <table>
        <thead>
          <tr>
            <th>项目名称</th>
            <th>音乐人</th>
            <th>目标金额</th>
            <th>当前进度</th>
            <th>单价</th>
            <th>状态</th>
            <th>支持数</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="v in vinylList" :key="v.id">
            <td class="strong">{{ v.title }}</td>
            <td>{{ v.musician?.name }}</td>
            <td>¥{{ formatNumber(v.targetAmount) }}</td>
            <td style="min-width: 180px;">
              <div class="table-progress">
                <div class="mini-track">
                  <div class="mini-fill" :style="{ width: `${Math.min(v.progressPercent, 100)}%` }"></div>
                </div>
                <span class="mini-percent">{{ v.progressPercent }}%</span>
              </div>
            </td>
            <td>¥{{ formatNumber(v.unitPrice) }}</td>
            <td>
              <span :class="`badge ${v.status === 'SUCCESS' ? 'badge-success' : 'badge-warning'}`">
                {{ v.status === 'SUCCESS' ? '众筹成功' : '众筹中' }}
              </span>
            </td>
            <td>{{ v.supporterCount }} 人</td>
            <td>
              <button class="btn btn-ghost btn-sm" @click="$router.push(`/vinyl/${v.id}`)">
                查看
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { vinylApi } from '@/api';

const vinylList = ref([]);

const formatNumber = (num) => {
  const n = parseFloat(num) || 0;
  return n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const fetchList = async () => {
  try {
    const res = await vinylApi.list();
    if (res.success) vinylList.value = res.data || [];
  } catch (e) {
    console.error(e);
  }
};

onMounted(() => fetchList());
</script>

<style scoped>
.table-progress {
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

.strong {
  font-weight: 600;
}
</style>
