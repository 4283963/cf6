<template>
  <div class="container">
    <div class="page-header">
      <div>
        <h2 class="section-title">音乐人工作台</h2>
        <p class="section-subtitle">管理黑胶众筹项目、订单与版权分账</p>
      </div>
    </div>
    <div class="admin-layout">
      <aside class="admin-sidebar">
        <div class="admin-sidebar-title">众筹管理</div>
        <router-link to="/admin/dashboard">📊 数据概览</router-link>
        <router-link to="/admin/vinyl">💿 黑胶项目</router-link>
        <router-link to="/admin/vinyl/create">➕ 发起众筹</router-link>
        <router-link to="/admin/orders">📦 订单管理</router-link>
        <div class="admin-sidebar-title">版权管理</div>
        <router-link to="/admin/works">🎵 版权作品</router-link>
        <router-link to="/admin/revenue">💰 收益录入</router-link>
        <div class="admin-sidebar-title">基础数据</div>
        <router-link to="/admin/musicians">👤 音乐人</router-link>
      </aside>
      <div class="admin-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.admin-content {
  min-height: 500px;
}
</style>
