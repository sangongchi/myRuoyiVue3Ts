<template>
  <router-view />
</template>

<script setup lang="ts">
import useSettingsStore from '@/store/modules/settings'
import { handleThemeStyle } from '@/utils/theme'

// 修改页面缩放变量
function setZoomFactor(scale: number) {
  document.documentElement.style.setProperty('--zoom-factor', scale + '')
  document.body.style.zoom = scale + ''
}

onMounted(async () => {
  await nextTick()
  // 初始化主题样式
  handleThemeStyle(useSettingsStore().themeColor)

  const screenWidth = window.screen.width
  console.log('screenWidth', screenWidth)
  // 这里可以根据屏幕分辨率进行一些适配操作，仅针对电脑端，排除手机的情况
  if (!/Mobi|Android|iPhone/i.test(navigator.userAgent)) {
    if (screenWidth < 1400) {
      setZoomFactor(0.8)
    } else if (screenWidth < 1280) {
      setZoomFactor(0.7)
    }
  } else {
    setZoomFactor(1)
  }
})
</script>
