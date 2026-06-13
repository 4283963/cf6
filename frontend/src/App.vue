<template>
  <div class="app-root">
    <header class="app-header">
      <div class="container header-inner">
        <router-link to="/" class="logo">
          <span class="logo-icon">💿</span>
          <span class="logo-text">VinylFund</span>
        </router-link>
        <nav class="nav">
          <router-link to="/" class="nav-link" exact-active-class="active">粉丝前台</router-link>
          <router-link to="/admin" class="nav-link" active-class="active">音乐人后台</router-link>
        </nav>
      </div>
    </header>
    <main class="app-main">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
    <footer class="app-footer">
      <div class="container">
        © 2026 VinylFund · 独立音乐人黑胶众筹与版权分账管理平台
      </div>
    </footer>
  </div>
</template>

<script setup>
</script>
