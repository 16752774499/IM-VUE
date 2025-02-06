<script setup>
import { RouterView } from 'vue-router'
</script>

<template>
  <RouterView />
</template>

<style>
/* 重置默认样式 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
  overflow: hidden;
}

#app {
  height: 100%;
  width: 100%;
  margin: 0;
  padding: 0;
  display: flex;
}

/* 移动端适配 */
@media (max-width: 768px) {
  * {
    -webkit-tap-highlight-color: transparent;
  }
}
</style>
