<template>
  <div>
    <div class="page-header">
      <div>
        <h2 class="section-title">音乐人管理</h2>
        <p class="section-subtitle">管理工作室音乐人信息</p>
      </div>
      <button class="btn btn-primary" @click="showAddModal = true">
        ➕ 添加音乐人
      </button>
    </div>

    <div class="card">
      <table>
        <thead>
          <tr>
            <th>音乐人</th>
            <th>工作室</th>
            <th>简介</th>
            <th>黑胶项目</th>
            <th>版权作品</th>
            <th>加入时间</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="m in musicians" :key="m.id">
            <td>
              <div class="musician-cell">
                <div class="musician-avatar">{{ m.name.charAt(0) }}</div>
                <span class="strong">{{ m.name }}</span>
              </div>
            </td>
            <td>{{ m.studioName }}</td>
            <td class="muted">{{ m.bio || '-' }}</td>
            <td>{{ m._count?.vinylRecords || 0 }}</td>
            <td>{{ m._count?.works || 0 }}</td>
            <td>{{ formatDate(m.createdAt) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showAddModal" class="modal-mask" @click.self="showAddModal = false">
      <div class="modal-card">
        <h3 class="section-title mb-20">添加音乐人</h3>
        <form @submit.prevent="handleCreate">
          <div class="form-group">
            <label class="form-label">姓名 *</label>
            <input class="form-input" v-model="newForm.name" placeholder="音乐人姓名" required />
          </div>
          <div class="form-group">
            <label class="form-label">工作室名称 *</label>
            <input class="form-input" v-model="newForm.studioName" placeholder="如：杰威尔音乐" required />
          </div>
          <div class="form-group">
            <label class="form-label">简介</label>
            <textarea class="form-textarea" v-model="newForm.bio" placeholder="音乐人简介"></textarea>
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-ghost" @click="showAddModal = false">取消</button>
            <button type="submit" class="btn btn-primary" :disabled="submitting">
              {{ submitting ? '保存中...' : '保存' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, reactive } from 'vue';
import { musicianApi, useToast } from '@/api';

const toast = useToast();
const musicians = ref([]);
const showAddModal = ref(false);
const submitting = ref(false);

const newForm = reactive({
  name: '',
  studioName: '',
  bio: ''
});

const formatDate = (d) => new Date(d).toLocaleDateString('zh-CN');

const fetchList = async () => {
  try {
    const res = await musicianApi.list();
    if (res.success) musicians.value = res.data || [];
  } catch (e) {
    console.error(e);
  }
};

const handleCreate = async () => {
  submitting.value = true;
  try {
    const res = await musicianApi.create({ ...newForm });
    if (res.success) {
      toast.show('音乐人添加成功！', 'success');
      showAddModal.value = false;
      newForm.name = '';
      newForm.studioName = '';
      newForm.bio = '';
      fetchList();
    } else {
      toast.show(res.message || '添加失败', 'error');
    }
  } catch (e) {
    toast.show(e.message || '添加失败', 'error');
  } finally {
    submitting.value = false;
  }
};

onMounted(() => fetchList());
</script>

<style scoped>
.mb-20 { margin-bottom: 20px; }
.strong { font-weight: 600; }
.muted { color: var(--color-muted); }

.musician-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.musician-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #e94560, #d4af37);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
}

.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-card {
  background: #fff;
  border-radius: var(--radius-lg);
  padding: 32px;
  width: 480px;
  max-width: 92vw;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}
</style>
