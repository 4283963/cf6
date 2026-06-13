import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue')
  },
  {
    path: '/vinyl/:id',
    name: 'VinylDetail',
    component: () => import('@/views/VinylDetail.vue')
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('@/views/admin/AdminLayout.vue'),
    redirect: '/admin/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: () => import('@/views/admin/Dashboard.vue')
      },
      {
        path: 'vinyl',
        name: 'AdminVinyl',
        component: () => import('@/views/admin/VinylList.vue')
      },
      {
        path: 'vinyl/create',
        name: 'AdminVinylCreate',
        component: () => import('@/views/admin/VinylCreate.vue')
      },
      {
        path: 'orders',
        name: 'AdminOrders',
        component: () => import('@/views/admin/OrderList.vue')
      },
      {
        path: 'works',
        name: 'AdminWorks',
        component: () => import('@/views/admin/WorkList.vue')
      },
      {
        path: 'works/:id',
        name: 'AdminWorkDetail',
        component: () => import('@/views/admin/WorkDetail.vue')
      },
      {
        path: 'revenue',
        name: 'AdminRevenue',
        component: () => import('@/views/admin/RevenueEntry.vue')
      },
      {
        path: 'musicians',
        name: 'AdminMusicians',
        component: () => import('@/views/admin/MusicianList.vue')
      }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
