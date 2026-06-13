<template>
  <div>
    <div class="page-header">
      <div>
        <h2 class="section-title">流媒体收益录入</h2>
        <p class="section-subtitle">录入各流媒体平台的播放量与授权收益</p>
      </div>
    </div>

    <div class="grid grid-2">
      <div class="card">
        <h3 class="form-section-title">➕ 新增收益记录</h3>
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label class="form-label">版权作品 *</label>
            <select class="form-select" v-model="form.workId" required>
              <option value="">请选择作品</option>
              <option v-for="w in works" :key="w.id" :value="w.id">
                {{ w.title }} ({{ w.musician?.name }})
              </option>
            </select>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">平台 *</label>
              <select class="form-select" v-model="form.platform" required>
                <option value="">请选择平台</option>
                <option v-for="p in platforms" :key="p.value" :value="p.value">
                  {{ p.icon }} {{ p.label }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">播放量</label>
              <input class="form-input" type="number" v-model.number="form.playCount" min="0" placeholder="0" />
            </div>
            <div class="form-group">
              <label class="form-label">收益金额 (元) *</label>
              <input class="form-input" type="number" v-model.number="form.revenue" min="0" step="0.01" placeholder="0.00" required />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">统计开始日期</label>
              <input class="form-input" type="date" v-model="form.periodStart" />
            </div>
            <div class="form-group">
              <label class="form-label">统计结束日期</label>
              <input class="form-input" type="date" v-model="form.periodEnd" />
            </div>
          </div>
          <button type="submit" class="btn btn-gold btn-block" :disabled="submitting">
            {{ submitting ? '录入中...' : '💾 录入收益' }}
          </button>
        </form>
      </div>

      <div class="card">
        <h3 class="section-title mb-16">📋 最近录入记录</h3>
        <div v-if="recentRecords.length === 0" class="empty">
          <div class="empty-icon">📝</div>
          <div>暂无录入记录</div>
        </div>
        <div v-else class="recent-list">
          <div v-for="r in recentRecords" :key="r.id" class="recent-item">
            <div class="recent-icon">{{ getPlatformIcon(r.platform) }}</div>
            <div class="recent-info">
              <div class="recent-title">{{ getPlatformLabel(r.platform) }}</div>
              <div class="recent-meta">
                作品: {{ r.work?.title }} · {{ r.playCount?.toLocaleString() || 0 }} 次播放
              </div>
            </div>
            <div class="recent-amount">
              + ¥{{ formatNumber(r.revenue) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, reactive } from 'vue';
import { revenueApi, musicianApi, useToast } from '@/api';

const toast = useToast();
const submitting = ref(false);
const works = ref([]);
const recentRecords = ref([]);

const platforms = [
  { value: 'NETEASE', label: '网易云音乐', icon: '☁️' },
  { value: 'QQ_MUSIC', label: 'QQ音乐', icon: '🎵' },
  { value: 'KUGOU', label: '酷狗音乐', icon: '🎧' },
  { value: 'KUWO', label: '酷我音乐', icon: '🎶' },
  { value: 'BILIBILI', label: '哔哩哔哩', icon: '📺' },
  { value: 'SPOTIFY', label: 'Spotify', icon: '💚' },
  { value: 'OTHER', label: '其他', icon: '🎵' }
];

const form = reactive({
  workId: '',
  platform: '',
  playCount: 0,
  revenue: null,
  periodStart: '',
  periodEnd: ''
});

const getPlatformLabel = (p) => platforms.find(x => x.value === p)?.label || p;
const getPlatformIcon = (p) => platforms.find(x => x.value === p)?.icon || '🎵';

const formatNumber = (n) => {
  const x = parseFloat(n) || 0;
  return x.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const fetchWorks = async () => {
  try {
    const mRes = await musicianApi.list();
    if (mRes.success && mRes.data?.length) {
      const all = [];
      for (const m of mRes.data) {
        const wRes = await musicianApi.getWorks(m.id);
        if (wRes.success) all.push(...(wRes.data || []));
      }
      works.value = all;
    }
  } catch (e) {
    console.error(e);
  }
};

const loadRecent = async () => {
  if (works.value.length === 0) return;
  try {
    const all = [];
    for (const w of works.value.slice(0, 5)) {
      const res = await revenueApi.getWorkRevenue(w.id);
      if (res.success && res.data?.streams) {
        all.push(...res.data.streams.map(s => ({ ...s, work: { title: res.data.title } })));
      }
    }
    all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    recentRecords.value = all.slice(0, 10);
  } catch (e) {
    console.error(e);
  }
};

const handleSubmit = async () => {
  if (!form.workId || !form.platform || form.revenue == null) {
    toast.show('请填写必填项', 'error');
    return;
  }
  submitting.value = true;
  try {
    const payload = {
      workId: parseInt(form.workId),
      platform: form.platform,
      playCount: form.playCount || 0,
      revenue: form.revenue,
      periodStart: form.periodStart || null,
      periodEnd: form.periodEnd || null
    };
    const res = await revenueApi.addStream(payload);
    if (res.success) {
      toast.show('收益录入成功！', 'success');
      form.platform = '';
      form.playCount = 0;
      form.revenue = null;
      form.periodStart = '';
      form.periodEnd = '';
      loadRecent();
    } else {
      toast.show(res.message || '录入失败', 'error');
    }
  } catch (e) {
    toast.show(e.message || '录入失败', 'error');
  } finally {
    submitting.value = false;
  }
};

onMounted(async () => {
  await fetchWorks();
  loadRecent();
});
</script>

<style scoped>
.mb-16 { margin-bottom: 16px; }

.form-section-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: 20px;
}

.recent-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.recent-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: var(--color-bg);
  border-radius: var(--radius-md);
}

.recent-icon {
  font-size: 24px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border-radius: 10px;
  box-shadow: var(--shadow-sm);
}

.recent-info {
  flex: 1;
}

.recent-title {
  font-weight: 600;
  color: var(--color-text);
  font-size: 14px;
}

.recent-meta {
  font-size: 12px;
  color: var(--color-muted);
  margin-top: 2px;
}

.recent-amount {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-success);
}
</style>
