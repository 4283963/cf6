<template>
  <div class="container">
    <div v-if="loading" class="empty">
      <div class="empty-icon">⏳</div>
      <div>加载中...</div>
    </div>
    <div v-else-if="detail">
      <div class="detail-grid">
        <div class="detail-cover">
          <div v-if="detail.coverImage" class="cover-full">
            <img :src="detail.coverImage" :alt="detail.title" />
          </div>
          <div v-else class="cover-full placeholder">
            <div class="big-disc">
              <div class="big-disc-inner"></div>
              <div class="big-disc-label">💿</div>
            </div>
          </div>
        </div>
        <div class="detail-main">
          <div class="detail-header">
            <span :class="`badge ${detail.status === 'SUCCESS' ? 'badge-success' : 'badge-warning'}`">
              {{ detail.status === 'SUCCESS' ? '众筹成功' : '众筹中' }}
            </span>
            <span class="badge badge-gold" v-if="detail.deadline">
              距离截止 {{ daysLeft }} 天
            </span>
          </div>
          <h1 class="detail-title">{{ detail.title }}</h1>
          <div class="detail-artist">
            <span class="artist-name">{{ detail.musician?.name }}</span>
            <span class="artist-studio">{{ detail.musician?.studioName }}</span>
          </div>

          <FundingProgressBar
            :currentAmount="detail.currentAmount"
            :targetAmount="detail.targetAmount"
            :unitPrice="detail.unitPrice"
            :supporterCount="detail.supporterCount"
            class="mt-24"
          />

          <div class="buy-section">
            <div class="buy-price">
              <span class="price-label">单价</span>
              <span class="price-value">¥{{ formatNumber(detail.unitPrice) }}</span>
            </div>
            <div class="buy-qty">
              <button class="qty-btn" @click="quantity = Math.max(1, quantity - 1)">−</button>
              <input class="qty-input" type="number" v-model.number="quantity" min="1" />
              <button class="qty-btn" @click="quantity++">+</button>
            </div>
            <div class="buy-total">
              <span class="total-label">合计</span>
              <span class="total-value">¥{{ formatNumber(detail.unitPrice * quantity) }}</span>
            </div>
            <button
              class="btn btn-gold btn-block"
              :disabled="submitting || detail.status !== 'FUNDING'"
              @click="handleBuy"
            >
              {{ submitting ? '下单中...' : detail.status === 'FUNDING' ? '立即支持' : '众筹已结束' }}
            </button>
          </div>

          <div v-if="detail.work?.shares?.length" class="shares-preview">
            <h3 class="shares-title">🎵 版权分账设置</h3>
            <div class="shares-list">
              <div v-for="share in detail.work.shares" :key="share.id" class="share-item">
                <span class="share-role">{{ roleLabel(share.role) }}</span>
                <span class="share-name">{{ share.musician?.name }}</span>
                <span class="share-percent">{{ share.percentage }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card mt-24">
        <h3 class="section-title">项目介绍</h3>
        <p class="description">{{ detail.description || '暂无介绍' }}</p>
      </div>

      <div v-if="detail.orders?.length" class="card mt-20">
        <h3 class="section-title">最近支持者</h3>
        <table>
          <thead>
            <tr>
              <th>粉丝</th>
              <th>数量</th>
              <th>金额</th>
              <th>时间</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in detail.orders" :key="order.id">
              <td>{{ order.fan?.nickname }}</td>
              <td>{{ order.quantity }} 张</td>
              <td>¥{{ formatNumber(order.totalAmount) }}</td>
              <td>{{ formatDate(order.createdAt) }}</td>
              <td><span class="badge badge-success">已支付</span></td>
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
import { vinylApi, orderApi, useToast } from '@/api';
import FundingProgressBar from '@/components/FundingProgressBar.vue';

const route = useRoute();
const toast = useToast();

const loading = ref(true);
const detail = ref(null);
const quantity = ref(1);
const submitting = ref(false);

const daysLeft = computed(() => {
  if (!detail.value?.deadline) return 0;
  const d = new Date(detail.value.deadline).getTime() - Date.now();
  return Math.max(0, Math.ceil(d / (24 * 3600 * 1000)));
});

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

const roleLabel = (r) => {
  return { LYRICIST: '作词', COMPOSER: '作曲', ARRANGER: '编曲', LEAD_VOCAL: '主唱' }[r] || r;
};

const fetchDetail = async () => {
  try {
    const res = await vinylApi.detail(route.params.id);
    if (res.success) {
      detail.value = res.data;
    }
  } catch (e) {
    toast.show(e.message || '加载失败', 'error');
  } finally {
    loading.value = false;
  }
};

const handleBuy = async () => {
  if (submitting.value) return;
  submitting.value = true;
  try {
    const res = await orderApi.create({
      vinylRecordId: detail.value.id,
      quantity: quantity.value,
      nickname: '音乐爱好者',
      phone: '',
      email: '',
      address: ''
    });
    if (res.success) {
      toast.show('支持成功！感谢您的参与 💿', 'success');
      quantity.value = 1;
      fetchDetail();
    } else {
      toast.show(res.message || '下单失败', 'error');
    }
  } catch (e) {
    toast.show(e.message || '下单失败', 'error');
  } finally {
    submitting.value = false;
  }
};

onMounted(() => {
  fetchDetail();
});
</script>

<style scoped>
.mt-20 { margin-top: 20px; }
.mt-24 { margin-top: 24px; }

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 32px;
  margin-bottom: 24px;
}

.detail-cover {
  position: sticky;
  top: 88px;
  height: fit-content;
}

.cover-full {
  aspect-ratio: 1 / 1;
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-md);
}

.cover-full img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-full.placeholder {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.big-disc {
  width: 70%;
  aspect-ratio: 1 / 1;
  border-radius: 50%;
  background: radial-gradient(circle at center, #2a2a3e 0%, #0f0f1e 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  animation: spin 15s linear infinite;
}

.big-disc::before {
  content: '';
  position: absolute;
  inset: 18%;
  border-radius: 50%;
  background: repeating-radial-gradient(
    circle at center,
    transparent 0,
    transparent 3px,
    rgba(255, 255, 255, 0.03) 3px,
    rgba(255, 255, 255, 0.03) 6px
  );
}

.big-disc-inner {
  width: 38%;
  aspect-ratio: 1 / 1;
  border-radius: 50%;
  background: linear-gradient(135deg, #d4af37, #e94560);
  position: relative;
  z-index: 1;
}

.big-disc-label {
  font-size: 48px;
  position: absolute;
  z-index: 2;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.detail-header {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.detail-title {
  font-size: 32px;
  font-weight: 800;
  color: var(--color-primary);
  margin-bottom: 8px;
  line-height: 1.3;
}

.detail-artist {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 24px;
}

.artist-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-accent);
}

.artist-studio {
  font-size: 14px;
  color: var(--color-muted);
}

.buy-section {
  margin-top: 24px;
  padding: 24px;
  background: linear-gradient(135deg, #fafbfc 0%, #f5f5fa 100%);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  display: grid;
  grid-template-columns: 1fr auto 1fr auto;
  gap: 16px;
  align-items: center;
}

.buy-price, .buy-total {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.price-label, .total-label {
  font-size: 12px;
  color: var(--color-muted);
}

.price-value {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-gold);
}

.total-value {
  font-size: 24px;
  font-weight: 800;
  color: var(--color-accent);
}

.buy-qty {
  display: flex;
  align-items: center;
  gap: 0;
}

.qty-btn {
  width: 40px;
  height: 40px;
  border: 1px solid var(--color-border);
  background: #fff;
  font-size: 18px;
  cursor: pointer;
  color: var(--color-text);
  transition: all 0.15s ease;
}

.qty-btn:first-child {
  border-radius: var(--radius-md) 0 0 var(--radius-md);
}

.qty-btn:last-child {
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
}

.qty-btn:hover {
  background: var(--color-accent);
  color: #fff;
  border-color: var(--color-accent);
}

.qty-input {
  width: 60px;
  height: 40px;
  border: 1px solid var(--color-border);
  border-left: none;
  border-right: none;
  text-align: center;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
  -moz-appearance: textfield;
}

.qty-input::-webkit-outer-spin-button,
.qty-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.shares-preview {
  margin-top: 24px;
  padding: 20px;
  background: var(--color-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.shares-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  color: var(--color-primary);
}

.shares-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px;
}

.share-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--color-bg);
  border-radius: 8px;
  font-size: 13px;
}

.share-role {
  font-weight: 600;
  color: var(--color-accent);
}

.share-name {
  color: var(--color-text);
  flex: 1;
}

.share-percent {
  font-weight: 700;
  color: var(--color-gold);
}

.description {
  color: var(--color-text);
  line-height: 1.8;
  font-size: 15px;
  white-space: pre-wrap;
}

@media (max-width: 900px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
  .detail-cover {
    position: static;
  }
  .buy-section {
    grid-template-columns: 1fr;
  }
}
</style>
