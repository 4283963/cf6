<template>
  <div>
    <div class="page-header">
      <div>
        <h2 class="section-title">订单管理</h2>
        <p class="section-subtitle">查看所有黑胶唱片预售订单</p>
      </div>
    </div>

    <div class="grid grid-3 mb-24">
      <div class="stat-card">
        <div class="stat-label">总订单数</div>
        <div class="stat-value">{{ orders.length }}<span class="stat-unit">笔</span></div>
      </div>
      <div class="stat-card">
        <div class="stat-label">总销量</div>
        <div class="stat-value">{{ totalQuantity }}<span class="stat-unit">张</span></div>
      </div>
      <div class="stat-card">
        <div class="stat-label">总销售额</div>
        <div class="stat-value">¥{{ formatNumber(totalAmount) }}</div>
      </div>
    </div>

    <div class="card">
      <table>
        <thead>
          <tr>
            <th>订单号</th>
            <th>黑胶唱片</th>
            <th>粉丝</th>
            <th>数量</th>
            <th>金额</th>
            <th>状态</th>
            <th>时间</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="o in orders" :key="o.id">
            <td class="mono">{{ o.orderNo }}</td>
            <td class="strong">{{ o.vinylRecord?.title }}</td>
            <td>{{ o.fan?.nickname }}</td>
            <td>{{ o.quantity }} 张</td>
            <td>¥{{ formatNumber(o.totalAmount) }}</td>
            <td><span class="badge badge-success">已支付</span></td>
            <td>{{ formatDate(o.createdAt) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue';
import { orderApi } from '@/api';

const orders = ref([]);

const totalQuantity = computed(() => orders.value.reduce((s, o) => s + o.quantity, 0));
const totalAmount = computed(() => orders.value.reduce((s, o) => s + parseFloat(o.totalAmount || 0), 0));

const formatNumber = (num) => {
  const n = parseFloat(num) || 0;
  return n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatDate = (d) => {
  return new Date(d).toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  });
};

const fetchList = async () => {
  try {
    const res = await orderApi.list();
    if (res.success) orders.value = res.data || [];
  } catch (e) {
    console.error(e);
  }
};

onMounted(() => fetchList());
</script>

<style scoped>
.mb-24 { margin-bottom: 24px; }
.mono { font-family: 'SF Mono', Menlo, monospace; font-size: 13px; }
.strong { font-weight: 600; }
</style>
