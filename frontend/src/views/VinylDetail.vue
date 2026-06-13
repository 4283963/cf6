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

          <div class="stock-info" v-if="typeof detail.stock === 'number'">
            <span :class="['stock-tag', stockLevel]">
              <span class="stock-icon">{{ stockIcon }}</span>
              <span>限量发行 {{ detail.initialStock || detail.stock }} 张</span>
              <span class="stock-divider">·</span>
              <span class="stock-remain">
                剩余 <strong>{{ detail.stock }}</strong> 张
              </span>
              <span
                v-if="detail.initialStock > 0"
                class="stock-progress-wrapper">
                <span class="stock-progress-bar">
                  <span
                    class="stock-progress-inner"
                    :style="{ width: stockPercent + '%' }"></span>
                </span>
              </span>
            </span>
            <span class="stock-warn" v-if="detail.stock > 0 && detail.stock <= 10">
              ⚠️ 库存紧张，仅剩 {{ detail.stock }} 张，拼手速！
            </span>
          </div>

          <div class="buy-section">
            <div class="buy-price">
              <span class="price-label">单价</span>
              <span class="price-value">¥{{ formatNumber(detail.unitPrice) }}</span>
            </div>
            <div class="buy-qty">
              <button
                class="qty-btn"
                :disabled="quantity <= 1"
                @click="quantity = Math.max(1, quantity - 1)">−</button>
              <input
                class="qty-input"
                type="number"
                v-model.number="quantity"
                :min="1"
                :max="maxBuyQty"
                @change="clampQty"
              />
              <button
                class="qty-btn"
                :disabled="detail.stock != null && quantity >= maxBuyQty"
                @click="incrementQty">+</button>
            </div>
            <div class="buy-total">
              <span class="total-label">合计</span>
              <span class="total-value">¥{{ formatNumber(detail.unitPrice * quantity) }}</span>
            </div>
            <button
              class="btn btn-gold btn-block"
              :disabled="buyBtnDisabled"
              @click="handleBuy"
            >
              <template v-if="submitting">
                <span class="btn-spinner"></span>
              </template>
              <template v-else>{{ buyBtnText }}</template>
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

          <div v-if="benefits.length" class="benefits-preview mt-24">
            <div class="benefits-header">
              <h3 class="benefits-title">🎁 众筹阶梯福利</h3>
              <span class="benefits-sub">
                已解锁 <b>{{ unlockedCount }}</b> / {{ benefits.length }}
              </span>
            </div>
            <div class="benefits-list">
              <div
                v-for="(b, idx) in benefits"
                :key="b.id"
                :class="['benefit-card', b.isUnlocked ? 'unlocked' : 'locked']"
              >
                <div class="benefit-threshold">
                  <div class="threshold-pct">{{ b.thresholdPercent }}%</div>
                  <div class="threshold-line" v-if="idx < benefits.length - 1"></div>
                </div>
                <div class="benefit-body">
                  <div class="benefit-top">
                    <span class="benefit-icon">{{ benefitIcon(b.type) }}</span>
                    <span class="benefit-title">{{ b.title }}</span>
                    <span :class="['benefit-state', b.isUnlocked ? 'state-unlocked' : 'state-locked']">
                      {{ b.isUnlocked ? '✅ 已解锁' : '🔒 未解锁' }}
                    </span>
                  </div>
                  <p v-if="b.description" class="benefit-desc">{{ b.description }}</p>
                  <div v-if="b.isUnlocked && (b.contentUrl || b.contentText)" class="benefit-content">
                    <a v-if="b.contentUrl" :href="b.contentUrl" target="_blank" class="benefit-link">
                      📎 点击领取 / 下载
                    </a>
                    <p v-if="b.contentText" class="benefit-text">{{ b.contentText }}</p>
                  </div>
                  <div v-else-if="!b.isUnlocked" class="benefit-hint">
                    众筹进度达到 <b>{{ b.thresholdPercent }}%</b> 后解锁，立即下单加速解锁吧！
                  </div>
                </div>
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

    <EngravingWheel
      :visible="wheelVisible"
      :vinylRecordId="detail?.id"
      :orderId="lastOrder?.id"
      :orderEngravingNumber="lastOrder?.engravingNumber"
      @close="wheelVisible = false"
      @locked="onEngravingLocked"
    />
  </div>
</template>

<script setup>
import { onMounted, ref, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { vinylApi, orderApi, benefitApi, useToast } from '@/api';
import FundingProgressBar from '@/components/FundingProgressBar.vue';
import EngravingWheel from '@/components/EngravingWheel.vue';

const route = useRoute();
const toast = useToast();

const loading = ref(true);
const detail = ref(null);
const quantity = ref(1);
const submitting = ref(false);
const errorTip = ref('');
const benefits = ref([]);
const wheelVisible = ref(false);
const lastOrder = ref(null);

const unlockedCount = computed(() => benefits.value.filter(b => b.isUnlocked).length);

const benefitIcon = (type) => {
  return {
    DOWNLOAD_LINK: '💾',
    LYRIC_SHEET: '📜',
    BEHIND_SCENES: '🎬',
    EARLY_ACCESS: '⏰',
    PHYSICAL_GIFT: '🎁',
    OTHER: '✨'
  }[type] || '🎁';
};

const daysLeft = computed(() => {
  if (!detail.value?.deadline) return 0;
  const d = new Date(detail.value.deadline).getTime() - Date.now();
  return Math.max(0, Math.ceil(d / (24 * 3600 * 1000)));
});

const maxBuyQty = computed(() => {
  const stock = detail.value?.stock;
  if (stock == null) return 999;
  return Math.max(0, stock);
});

const stockPercent = computed(() => {
  const d = detail.value;
  if (!d || !(d.initialStock > 0)) return 0;
  return Math.max(0, Math.round(((d.initialStock - d.stock) / d.initialStock) * 100));
});

const stockLevel = computed(() => {
  const d = detail.value;
  if (!d) return '';
  const remain = d.stock ?? 9999;
  if (remain <= 0) return 'stock-out';
  if (d.initialStock && remain / d.initialStock <= 0.1) return 'stock-urgent';
  if (d.initialStock && remain / d.initialStock <= 0.3) return 'stock-tight';
  return 'stock-normal';
});

const stockIcon = computed(() => {
  const d = detail.value;
  if (!d) return '🎯';
  if (d.stock <= 0) return '🚫';
  if (stockLevel.value === 'stock-urgent') return '🔥';
  if (stockLevel.value === 'stock-tight') return '⏳';
  return '✅';
});

const buyBtnDisabled = computed(() => {
  const d = detail.value;
  if (submitting.value) return true;
  if (!d) return true;
  if (d.status !== 'FUNDING') return true;
  if (d.stock != null && d.stock <= 0) return true;
  if (quantity.value < 1) return true;
  return false;
});

const buyBtnText = computed(() => {
  const d = detail.value;
  if (submitting.value) return '下单中...';
  if (!d) return '';
  if (d.status === 'SUCCESS') return '众筹已结束';
  if (d.stock != null && d.stock <= 0) return '已售罄';
  if (d.status !== 'FUNDING') return '不可购买';
  return '立即支持';
});

watch(() => detail.value, (d) => {
  if (d && quantity.value > maxBuyQty.value && maxBuyQty.value > 0) {
    quantity.value = maxBuyQty.value;
  }
}, { immediate: true });

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

const clampQty = () => {
  const q = parseInt(quantity.value);
  if (q == null || Number.isNaN(q) || q < 1) {
    quantity.value = 1;
  }
  if (maxBuyQty.value > 0 && quantity.value > maxBuyQty.value) {
    quantity.value = maxBuyQty.value;
    toast.show(`最多只能购买 ${maxBuyQty.value} 张`, 'warn');
  }
};

const incrementQty = () => {
  if (maxBuyQty.value > 0 && quantity.value >= maxBuyQty.value) {
    toast.show(`库存仅剩 ${maxBuyQty.value} 张，无法再多啦！`, 'warn');
    return;
  }
  quantity.value += 1;
};

const fetchDetail = async () => {
  try {
    const res = await vinylApi.detail(route.params.id);
    if (res.success) {
      detail.value = res.data;
      errorTip.value = '';
      fetchBenefits();
    }
  } catch (e) {
    toast.show(e.message || '加载失败', 'error');
  } finally {
    loading.value = false;
  }
};

const fetchBenefits = async () => {
  try {
    const res = await benefitApi.listByVinyl(route.params.id);
    if (res.success) {
      benefits.value = res.data || [];
    }
  } catch (e) {
    console.error('获取福利失败', e);
  }
};

const onEngravingLocked = (data) => {
  if (lastOrder.value) {
    lastOrder.value = { ...lastOrder.value, engravingNumber: data?.engravingNumber };
  }
};

const handleBuy = async () => {
  if (submitting.value) return;
  if (quantity.value < 1) {
    toast.show('请输入有效数量', 'warn');
    return;
  }
  if (maxBuyQty.value > 0 && quantity.value > maxBuyQty.value) {
    toast.show(`库存仅剩 ${maxBuyQty.value} 张，请减少购买数量`, 'warn');
    return;
  }
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
      toast.show(`支持成功！感谢您的参与 💿 订单号: ${res.data.order.orderNo}`, 'success');
      quantity.value = 1;
      lastOrder.value = res.data.order;
      fetchDetail();

      const newly = res.data.newlyUnlockedBenefits || [];
      if (newly.length > 0) {
        setTimeout(() => {
          toast.show(`🎉 恭喜！新解锁 ${newly.length} 项福利：${newly.map(b => b.title).join('、')}`, 'success');
        }, 800);
      }

      setTimeout(() => {
        wheelVisible.value = true;
      }, newly.length > 0 ? 1600 : 600);
    } else {
      const code = res.code;
      if (code === 'STOCK_INSUFFICIENT' || code === 'STOCK_RACE_FAIL') {
        toast.show(res.message || '库存不足', 'error');
        fetchDetail();
      } else if (code === 'VERSION_CONFLICT' || code === 'DEADLOCK_FAIL') {
        toast.show(res.message || '系统繁忙，请稍后重试', 'error');
        setTimeout(() => fetchDetail(), 800);
      } else {
        toast.show(res.message || '下单失败', 'error');
      }
    }
  } catch (e) {
    toast.show(e.message || '下单失败，请稍后重试', 'error');
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

.stock-info {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stock-tag {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 500;
  background: var(--color-card);
  border: 1px solid var(--color-border);
  width: fit-content;
  max-width: 100%;
}

.stock-tag.stock-normal {
  background: rgba(16, 185, 129, 0.08);
  border-color: rgba(16, 185, 129, 0.25);
  color: #065f46;
}

.stock-tag.stock-tight {
  background: rgba(245, 158, 11, 0.1);
  border-color: rgba(245, 158, 11, 0.3);
  color: #92400e;
}

.stock-tag.stock-urgent {
  background: rgba(239, 68, 68, 0.08);
  border-color: rgba(239, 68, 68, 0.3);
  color: #991b1b;
  animation: urgent-pulse 2s ease-in-out infinite;
}

.stock-tag.stock-out {
  background: rgba(107, 114, 128, 0.1);
  border-color: rgba(107, 114, 128, 0.3);
  color: #374151;
}

@keyframes urgent-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.35); }
  50% { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
}

.stock-icon {
  font-size: 15px;
}

.stock-divider {
  color: inherit;
  opacity: 0.35;
}

.stock-remain strong {
  color: inherit;
  font-weight: 700;
  font-size: 14px;
}

.stock-progress-wrapper {
  display: inline-flex;
  align-items: center;
}

.stock-progress-bar {
  width: 100px;
  height: 6px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.stock-progress-inner {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #10b981 0%, #d4af37 60%, #e94560 100%);
  transition: width 0.4s ease;
}

.stock-warn {
  font-size: 12px;
  color: var(--color-accent);
  font-weight: 500;
}

.qty-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.btn-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.5);
  border-top-color: #fff;
  border-radius: 50%;
  margin-right: 6px;
  vertical-align: -3px;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.benefits-preview {
  padding: 22px;
  background: linear-gradient(135deg, #fff 0%, #fafaf7 100%);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
}
.benefits-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 16px;
}
.benefits-title {
  font-size: 17px;
  font-weight: 700;
  color: var(--color-primary);
  margin: 0;
}
.benefits-sub {
  font-size: 13px;
  color: var(--color-muted);
}
.benefits-sub b { color: var(--color-accent); font-weight: 700; }

.benefits-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  position: relative;
}

.benefit-card {
  display: grid;
  grid-template-columns: 70px 1fr;
  gap: 14px;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid var(--color-border);
  background: #fff;
  transition: all 0.25s ease;
}
.benefit-card.unlocked {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.06) 0%, rgba(212, 175, 55, 0.08) 100%);
  border-color: rgba(212, 175, 55, 0.35);
  box-shadow: 0 4px 12px rgba(212, 175, 55, 0.1);
}
.benefit-card.locked {
  opacity: 0.7;
  background: #f9fafb;
}

.benefit-threshold {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.threshold-pct {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 800;
  background: linear-gradient(135deg, #d4af37, #e94560);
  color: #fff;
  box-shadow: 0 4px 12px rgba(212, 175, 55, 0.35);
  z-index: 2;
}
.benefit-card.locked .threshold-pct {
  background: #e5e7eb;
  color: #6b7280;
  box-shadow: none;
}
.threshold-line {
  position: absolute;
  top: 58px;
  width: 3px;
  height: calc(100% + 14px);
  background: linear-gradient(180deg, #d4af37 0%, #e5e7eb 100%);
  border-radius: 2px;
  z-index: 1;
}
.benefit-card.locked .threshold-line { background: #e5e7eb; }

.benefit-top {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  flex-wrap: wrap;
}
.benefit-icon { font-size: 18px; }
.benefit-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--color-primary);
  flex: 1;
}
.benefit-state {
  font-size: 12px;
  padding: 2px 10px;
  border-radius: 999px;
  font-weight: 600;
}
.state-unlocked {
  background: rgba(16, 185, 129, 0.15);
  color: #059669;
}
.state-locked {
  background: rgba(107, 114, 128, 0.15);
  color: #4b5563;
}
.benefit-desc {
  font-size: 13px;
  color: var(--color-muted);
  margin: 0 0 8px;
  line-height: 1.6;
}
.benefit-content {
  margin-top: 4px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 8px;
}
.benefit-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-accent);
  text-decoration: none;
  padding: 4px 0;
}
.benefit-link:hover { text-decoration: underline; }
.benefit-text {
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--color-text);
  line-height: 1.6;
}
.benefit-hint {
  font-size: 12px;
  color: var(--color-muted);
  margin-top: 4px;
}
.benefit-hint b { color: var(--color-gold); font-weight: 700; }

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
  .stock-progress-bar { width: 72px; }
}
</style>
