import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('[API Error]', error);
    const message = error.response?.data?.message || error.message || '请求失败';
    return Promise.reject(new Error(message));
  }
);

export const useToast = () => {
  const show = (msg, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  };
  return { show };
};

export const vinylApi = {
  list: (params) => api.get('/vinyl', { params }),
  detail: (id) => api.get(`/vinyl/${id}`),
  create: (data) => api.post('/vinyl', data)
};

export const orderApi = {
  list: (params) => api.get('/orders', { params }),
  create: (data) => api.post('/orders', data),
  getEngravingNumbers: (vinylRecordId) => api.get(`/orders/engraving/${vinylRecordId}`),
  lockEngravingNumber: (data) => api.post('/orders/engraving/lock', data)
};

export const benefitApi = {
  list: (params) => api.get('/benefits', { params }),
  listByVinyl: (vinylRecordId) => api.get(`/benefits/vinyl/${vinylRecordId}`),
  listByOrder: (orderId) => api.get(`/benefits/order/${orderId}`),
  create: (data) => api.post('/benefits', data),
  update: (id, data) => api.put(`/benefits/${id}`, data),
  remove: (id) => api.delete(`/benefits/${id}`)
};

export const revenueApi = {
  addStream: (data) => api.post('/revenue/streams', data),
  settle: (workId) => api.post(`/revenue/settle/${workId}`),
  getWorkRevenue: (workId) => api.get(`/revenue/works/${workId}`)
};

export const musicianApi = {
  list: () => api.get('/musicians'),
  create: (data) => api.post('/musicians', data),
  getWorks: (id) => api.get(`/musicians/${id}/works`)
};

export default api;
