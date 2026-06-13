<template>
  <div>
    <div class="page-header">
      <div>
        <h2 class="section-title">发起黑胶众筹</h2>
        <p class="section-subtitle">创建一张新的黑胶唱片众筹预售项目</p>
      </div>
    </div>

    <div class="card">
      <form @submit.prevent="handleSubmit">
        <h3 class="form-section-title">📀 基本信息</h3>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">唱片标题 *</label>
            <input class="form-input" v-model="form.title" placeholder="如：晴天 · 珍藏版黑胶" required />
          </div>
          <div class="form-group">
            <label class="form-label">音乐人 *</label>
            <select class="form-select" v-model="form.musicianId" required>
              <option value="">请选择音乐人</option>
              <option v-for="m in musicians" :key="m.id" :value="m.id">{{ m.name }} - {{ m.studioName }}</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">目标金额 (元) *</label>
            <input class="form-input" type="number" v-model.number="form.targetAmount" min="1" step="0.01" placeholder="100000" required />
          </div>
          <div class="form-group">
            <label class="form-label">单价 (元) *</label>
            <input class="form-input" type="number" v-model.number="form.unitPrice" min="1" step="0.01" placeholder="299" required />
          </div>
          <div class="form-group">
            <label class="form-label">截止日期</label>
            <input class="form-input" type="date" v-model="form.deadline" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">项目介绍</label>
          <textarea class="form-textarea" v-model="form.description" placeholder="介绍这张黑胶唱片的故事、制作工艺、包含曲目等..."></textarea>
        </div>

        <h3 class="form-section-title mt-32">🎵 版权与分账设置</h3>
        <div class="form-group">
          <label class="checkbox-group">
            <input type="checkbox" v-model="linkWork" />
            <span>同时创建关联版权作品并设置分账比例</span>
          </label>
        </div>

        <div v-if="linkWork">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">作品名称</label>
              <input class="form-input" v-model="form.workInfo.title" placeholder="默认与唱片标题相同" />
            </div>
            <div class="form-group">
              <label class="form-label">ISRC 编码</label>
              <input class="form-input" v-model="form.workInfo.isrc" placeholder="CN-A01-03-00001" />
            </div>
            <div class="form-group">
              <label class="form-label">时长 (秒)</label>
              <input class="form-input" type="number" v-model.number="form.workInfo.duration" placeholder="269" />
            </div>
          </div>

          <h4 class="form-subtitle">分账比例设置（总和必须等于100%）</h4>
          <div class="shares-form">
            <div v-for="(share, idx) in form.shares" :key="idx" class="share-form-row">
              <select class="form-select" v-model="share.role">
                <option value="LYRICIST">作词</option>
                <option value="COMPOSER">作曲</option>
                <option value="ARRANGER">编曲</option>
                <option value="LEAD_VOCAL">主唱</option>
              </select>
              <select class="form-select" v-model="share.musicianId">
                <option value="">选择音乐人</option>
                <option v-for="m in musicians" :key="m.id" :value="m.id">{{ m.name }}</option>
              </select>
              <input class="form-input" type="number" v-model.number="share.percentage" min="0" max="100" step="0.01" placeholder="%" />
              <button type="button" class="btn btn-ghost btn-sm" @click="removeShare(idx)" v-if="form.shares.length > 1">删除</button>
            </div>
            <button type="button" class="btn btn-ghost btn-sm" @click="addShare">➕ 添加分账方</button>
          </div>

          <div class="shares-total" :class="{ error: Math.abs(totalPercent - 100) > 0.01 }">
            当前分账总和: <b>{{ totalPercent.toFixed(2) }}%</b>
            <span v-if="Math.abs(totalPercent - 100) > 0.01">（需要等于 100%）</span>
            <span v-else>✅ 比例设置正确</span>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-ghost" @click="$router.back()">取消</button>
          <button type="submit" class="btn btn-gold" :disabled="submitting">
            {{ submitting ? '提交中...' : '🚀 发起众筹' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, computed, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { vinylApi, musicianApi, useToast } from '@/api';

const router = useRouter();
const toast = useToast();

const musicians = ref([]);
const linkWork = ref(true);
const submitting = ref(false);

const form = reactive({
  title: '',
  description: '',
  targetAmount: null,
  unitPrice: null,
  deadline: '',
  musicianId: '',
  coverImage: '',
  workInfo: {
    title: '',
    isrc: '',
    duration: null
  },
  shares: [
    { role: 'LYRICIST', musicianId: '', percentage: 25 },
    { role: 'COMPOSER', musicianId: '', percentage: 35 },
    { role: 'ARRANGER', musicianId: '', percentage: 20 },
    { role: 'LEAD_VOCAL', musicianId: '', percentage: 20 }
  ]
});

const totalPercent = computed(() => {
  return form.shares.reduce((s, r) => s + (parseFloat(r.percentage) || 0), 0);
});

const addShare = () => {
  form.shares.push({ role: 'LYRICIST', musicianId: '', percentage: 0 });
};

const removeShare = (idx) => {
  form.shares.splice(idx, 1);
};

const fetchMusicians = async () => {
  try {
    const res = await musicianApi.list();
    if (res.success) {
      musicians.value = res.data || [];
    }
  } catch (e) {
    console.error(e);
  }
};

const handleSubmit = async () => {
  if (linkWork.value && Math.abs(totalPercent.value - 100) > 0.01) {
    toast.show('分账比例总和必须等于100%', 'error');
    return;
  }
  if (linkWork.value && form.shares.some(s => !s.musicianId)) {
    toast.show('请为每个分账方选择音乐人', 'error');
    return;
  }

  submitting.value = true;
  try {
    const payload = {
      title: form.title,
      description: form.description,
      targetAmount: form.targetAmount,
      unitPrice: form.unitPrice,
      deadline: form.deadline || null,
      musicianId: parseInt(form.musicianId),
      coverImage: form.coverImage || null,
      workInfo: linkWork.value ? form.workInfo : null,
      shares: linkWork.value ? form.shares.map(s => ({ ...s, musicianId: parseInt(s.musicianId) })) : null
    };

    const res = await vinylApi.create(payload);
    if (res.success) {
      toast.show('众筹项目创建成功！', 'success');
      router.push('/admin/vinyl');
    } else {
      toast.show(res.message || '创建失败', 'error');
    }
  } catch (e) {
    toast.show(e.message || '创建失败', 'error');
  } finally {
    submitting.value = false;
  }
};

onMounted(() => {
  fetchMusicians();
});
</script>

<style scoped>
.mt-32 { margin-top: 32px; }

.form-section-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid var(--color-border);
}

.form-subtitle {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
  margin: 20px 0 12px;
}

.checkbox-group {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: var(--color-text);
}

.shares-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
}

.share-form-row {
  display: grid;
  grid-template-columns: 1fr 1.5fr 120px auto;
  gap: 10px;
  align-items: center;
}

.shares-total {
  padding: 12px 16px;
  background: rgba(16, 185, 129, 0.08);
  border-radius: var(--radius-md);
  font-size: 14px;
  color: var(--color-success);
  margin-bottom: 24px;
}

.shares-total.error {
  background: rgba(239, 68, 68, 0.08);
  color: #ef4444;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px dashed var(--color-border);
}
</style>
