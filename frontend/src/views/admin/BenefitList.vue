<template>
  <div>
    <div class="page-header">
      <div>
        <h2 class="section-title">🎁 阶梯福利管理</h2>
        <p class="section-subtitle">设置黑胶众筹不同金额阶梯的解锁福利与专属权益</p>
      </div>
      <button class="btn btn-gold" @click="openCreateModal">➕ 新增福利</button>
    </div>

    <div class="card filter-bar">
      <div class="filter-group">
        <label>黑胶项目</label>
        <select v-model="filterVinylId" class="form-input">
          <option :value="''">全部项目</option>
          <option v-for="v in vinylList" :key="v.id" :value="v.id">{{ v.title }}</option>
        </select>
      </div>
      <div class="filter-group">
        <label>解锁状态</label>
        <select v-model="filterUnlocked" class="form-input">
          <option :value="''">全部</option>
          <option value="true">已解锁</option>
          <option value="false">未解锁</option>
        </select>
      </div>
      <button class="btn btn-ghost" @click="loadBenefits">🔄 刷新</button>
    </div>

    <div class="card" v-if="benefits.length">
      <table class="data-table">
        <thead>
          <tr>
            <th>黑胶项目</th>
            <th>解锁比例</th>
            <th>福利类型</th>
            <th>福利名称</th>
            <th>内容</th>
            <th>状态</th>
            <th>解锁时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="b in benefits" :key="b.id">
            <td class="td-strong">{{ b.vinylRecord?.title || '—' }}</td>
            <td>
              <span :class="['threshold-tag', b.isUnlocked ? 'unlocked' : '']">
                {{ b.thresholdPercent }}%
              </span>
            </td>
            <td>
              <span :class="['type-tag', b.type]">
                {{ typeIcon(b.type) }} {{ typeLabel(b.type) }}
              </span>
            </td>
            <td class="td-strong">{{ b.title }}</td>
            <td class="td-content">
              <div v-if="b.contentUrl" class="content-row">
                <span class="content-label">链接：</span>
                <a :href="b.contentUrl" target="_blank" class="content-link">{{ truncate(b.contentUrl, 28) }}</a>
              </div>
              <div v-if="b.contentText" class="content-row">
                <span class="content-label">文本：</span>
                <span>{{ truncate(b.contentText, 30) }}</span>
              </div>
              <span v-if="!b.contentUrl && !b.contentText" class="muted">未设置内容</span>
            </td>
            <td>
              <span :class="['badge', b.isUnlocked ? 'badge-success' : 'badge-muted']">
                {{ b.isUnlocked ? '✅ 已解锁' : '🔒 未解锁' }}
              </span>
            </td>
            <td class="muted">{{ b.unlockedAt ? formatDate(b.unlockedAt) : '—' }}</td>
            <td class="td-actions">
              <button class="btn-text" @click="openEditModal(b)">编辑</button>
              <button class="btn-text danger" @click="handleDelete(b)">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="empty">
      <div class="empty-icon">🎁</div>
      <div>暂无福利数据，请先创建福利阶梯</div>
    </div>

    <div v-if="modalVisible" class="modal-mask" @click.self="closeModal">
      <div class="modal-dialog">
        <div class="modal-header">
          <h3>{{ editing ? '编辑福利' : '新增福利' }}</h3>
          <button class="modal-close" @click="closeModal">×</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">黑胶项目 *</label>
              <select v-model="form.vinylRecordId" class="form-input" :disabled="submitting">
                <option v-for="v in vinylList" :key="v.id" :value="v.id">{{ v.title }}</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">解锁比例 (%) *</label>
              <input type="number" class="form-input" v-model.number="form.thresholdPercent" min="1" max="100" step="1" :disabled="submitting" placeholder="50" />
            </div>
            <div class="form-group">
              <label class="form-label">福利类型 *</label>
              <select v-model="form.type" class="form-input" :disabled="submitting">
                <option value="DOWNLOAD_LINK">💾 下载链接</option>
                <option value="LYRIC_SHEET">📜 歌词/乐谱</option>
                <option value="BEHIND_SCENES">🎬 幕后花絮</option>
                <option value="EARLY_ACCESS">⏰ 提前体验</option>
                <option value="PHYSICAL_GIFT">🎁 实体周边</option>
                <option value="OTHER">✨ 其他权益</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">排序</label>
              <input type="number" class="form-input" v-model.number="form.sortOrder" min="0" step="1" :disabled="submitting" placeholder="0" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">福利名称 *</label>
            <input type="text" class="form-input" v-model="form.title" :disabled="submitting" placeholder="如：高清伴奏带下载" />
          </div>
          <div class="form-group">
            <label class="form-label">福利描述</label>
            <textarea class="form-input" rows="2" v-model="form.description" :disabled="submitting" placeholder="简要描述福利内容"></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">下载/查看链接</label>
            <input type="url" class="form-input" v-model="form.contentUrl" :disabled="submitting" placeholder="https://..." />
          </div>
          <div class="form-group">
            <label class="form-label">文字内容</label>
            <textarea class="form-input" rows="2" v-model="form.contentText" :disabled="submitting" placeholder="福利内文字内容，如兑换码、解锁说明等"></textarea>
          </div>
          <div class="form-group checkbox-row">
            <label>
              <input type="checkbox" v-model="form.unlocked" :disabled="submitting" />
              立即手动解锁（强制开放福利）
            </label>
          </div>
          <div class="form-tip" v-if="formError">
            ⚠️ {{ formError }}
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" :disabled="submitting" @click="closeModal">取消</button>
          <button class="btn btn-gold" :disabled="submitting" @click="submitForm">
            <template v-if="submitting">
              <span class="btn-spinner"></span> 保存中...
            </template>
            <template v-else>{{ editing ? '保存修改' : '创建福利' }}</template>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { benefitApi, vinylApi, useToast } from '@/api';

const toast = useToast();

const benefits = ref([]);
const vinylList = ref([]);
const filterVinylId = ref('');
const filterUnlocked = ref('');
const loading = ref(false);
const modalVisible = ref(false);
const editing = ref(false);
const editingId = ref(null);
const submitting = ref(false);
const formError = ref('');

const form = reactive({
  vinylRecordId: '',
  title: '',
  description: '',
  type: 'DOWNLOAD_LINK',
  thresholdPercent: 50,
  contentUrl: '',
  contentText: '',
  sortOrder: 0,
  unlocked: false
});

const typeIcon = (t) => ({
  DOWNLOAD_LINK: '💾', LYRIC_SHEET: '📜', BEHIND_SCENES: '🎬',
  EARLY_ACCESS: '⏰', PHYSICAL_GIFT: '🎁', OTHER: '✨'
})[t] || '🎁';

const typeLabel = (t) => ({
  DOWNLOAD_LINK: '下载链接', LYRIC_SHEET: '歌词/乐谱', BEHIND_SCENES: '幕后花絮',
  EARLY_ACCESS: '提前体验', PHYSICAL_GIFT: '实体周边', OTHER: '其他权益'
})[t] || t;

const truncate = (str, len) => {
  if (!str) return '';
  return str.length > len ? str.slice(0, len) + '...' : str;
};

const formatDate = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
  });
};

const loadVinylList = async () => {
  try {
    const res = await vinylApi.list();
    if (res.success) {
      vinylList.value = res.data || [];
      if (vinylList.value.length && !form.vinylRecordId) {
        form.vinylRecordId = vinylList.value[0].id;
      }
    }
  } catch (e) {
    console.error(e);
  }
};

const loadBenefits = async () => {
  try {
    loading.value = true;
    const params = {};
    if (filterVinylId.value) params.vinylRecordId = filterVinylId.value;
    if (filterUnlocked.value !== '') params.unlocked = filterUnlocked.value;
    const res = await benefitApi.list(params);
    if (res.success) {
      benefits.value = (res.data || []).map(b => ({
        ...b,
        isUnlocked: b.unlocked,
        thresholdPercent: parseFloat(b.thresholdPercent)
      }));
    }
  } catch (e) {
    toast.show(e.message || '加载失败', 'error');
  } finally {
    loading.value = false;
  }
};

const resetForm = () => {
  form.vinylRecordId = vinylList.value[0]?.id || '';
  form.title = '';
  form.description = '';
  form.type = 'DOWNLOAD_LINK';
  form.thresholdPercent = 50;
  form.contentUrl = '';
  form.contentText = '';
  form.sortOrder = 0;
  form.unlocked = false;
  formError.value = '';
  editing.value = false;
  editingId.value = null;
};

const openCreateModal = () => {
  resetForm();
  modalVisible.value = true;
};

const openEditModal = (b) => {
  editing.value = true;
  editingId.value = b.id;
  form.vinylRecordId = b.vinylRecordId;
  form.title = b.title;
  form.description = b.description || '';
  form.type = b.type;
  form.thresholdPercent = b.thresholdPercent;
  form.contentUrl = b.contentUrl || '';
  form.contentText = b.contentText || '';
  form.sortOrder = b.sortOrder;
  form.unlocked = b.unlocked;
  formError.value = '';
  modalVisible.value = true;
};

const closeModal = () => {
  if (submitting.value) return;
  modalVisible.value = false;
};

const submitForm = async () => {
  if (!form.vinylRecordId) { formError.value = '请选择黑胶项目'; return; }
  if (!form.title?.trim()) { formError.value = '请输入福利名称'; return; }
  const t = parseFloat(form.thresholdPercent);
  if (Number.isNaN(t) || t < 1 || t > 100) { formError.value = '解锁比例必须在 1-100 之间'; return; }
  formError.value = '';

  submitting.value = true;
  try {
    const payload = {
      vinylRecordId: form.vinylRecordId,
      title: form.title.trim(),
      description: form.description || null,
      type: form.type,
      thresholdPercent: t,
      contentUrl: form.contentUrl || null,
      contentText: form.contentText || null,
      sortOrder: form.sortOrder,
      unlocked: !!form.unlocked
    };
    let res;
    if (editing.value) {
      res = await benefitApi.update(editingId.value, payload);
    } else {
      res = await benefitApi.create(payload);
    }
    if (res.success) {
      toast.show(editing.value ? '福利更新成功' : '福利创建成功', 'success');
      closeModal();
      loadBenefits();
    } else {
      formError.value = res.message || '保存失败';
    }
  } catch (e) {
    toast.show(e.message || '保存失败', 'error');
  } finally {
    submitting.value = false;
  }
};

const handleDelete = async (b) => {
  if (!confirm(`确定删除福利「${b.title}」吗？`)) return;
  try {
    const res = await benefitApi.remove(b.id);
    if (res.success) {
      toast.show('删除成功', 'success');
      loadBenefits();
    } else {
      toast.show(res.message || '删除失败', 'error');
    }
  } catch (e) {
    toast.show(e.message || '删除失败', 'error');
  }
};

onMounted(() => {
  loadVinylList().then(loadBenefits);
});
</script>

<style scoped>
.filter-bar {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  flex-wrap: wrap;
}
.filter-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 180px;
}
.filter-group label {
  font-size: 12px;
  color: var(--color-muted);
  font-weight: 500;
}
.td-strong { font-weight: 600; color: var(--color-primary); }
.td-content { font-size: 13px; color: var(--color-text); max-width: 320px; }
.content-row { display: flex; gap: 4px; margin-top: 2px; font-size: 12px; }
.content-row:first-child { margin-top: 0; }
.content-label { color: var(--color-muted); flex-shrink: 0; }
.content-link { color: var(--color-accent); text-decoration: none; }
.content-link:hover { text-decoration: underline; }
.muted { color: var(--color-muted); }

.threshold-tag {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
  background: #e5e7eb;
  color: #4b5563;
}
.threshold-tag.unlocked {
  background: linear-gradient(135deg, #d4af37, #e94560);
  color: #fff;
}
.type-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  background: rgba(79, 70, 229, 0.1);
  color: #4338ca;
}
.type-tag.DOWNLOAD_LINK { background: rgba(16, 185, 129, 0.12); color: #059669; }
.type-tag.LYRIC_SHEET { background: rgba(245, 158, 11, 0.12); color: #d97706; }
.type-tag.BEHIND_SCENES { background: rgba(236, 72, 153, 0.12); color: #db2777; }
.type-tag.PHYSICAL_GIFT { background: rgba(239, 68, 68, 0.12); color: #dc2626; }
.type-tag.OTHER { background: rgba(107, 114, 128, 0.15); color: #4b5563; }

.checkbox-row label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 14px;
}
.form-tip {
  margin-top: 12px;
  padding: 10px 12px;
  background: rgba(239, 68, 68, 0.08);
  color: #dc2626;
  border-radius: 8px;
  font-size: 13px;
}

.btn-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  margin-right: 6px;
  vertical-align: -2px;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 900px) {
  .filter-group { min-width: 45%; }
  .td-content { max-width: 200px; }
}
</style>
