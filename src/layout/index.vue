<template>
  <div :class="classObj" class="app-wrapper" :style="{ '--current-color': themeColor }">
    <div v-if="device === 'mobile' && sidebar.opened" class="drawer-bg" @click="handleClickOutside" />
    <Sidebar v-if="!sidebar.hide && !isRouterTop" class="sidebar-container" />

    <div
      :class="{ hasTagsView: needTagsView, sidebarHide: sidebar.hide, 'none-side': isRouterTop }"
      class="main-container"
    >
      <!-- fixed-header 和app-main 中间不能增加别的元素，不然会影响appmain中相邻兄弟元素样式的设置效果 -->
      <div :class="{ 'fixed-header': fixedHeader }">
        <navbar @setLayout="setLayout" />
        <tags-view v-if="needTagsView" />
      </div>
      <app-main class="" />
      <settings ref="settingRef" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useWindowSize } from '@vueuse/core'
import Sidebar from './components/Sidebar/index.vue'
import { AppMain, Navbar, Settings, TagsView } from './components'

import useAppStore from '@/store/modules/app'
import useSettingsStore from '@/store/modules/settings'
import { computed, watchEffect, ref } from 'vue'

const settingsStore = useSettingsStore()
const themeColor = computed(() => settingsStore.themeColor)
const sidebar = computed(() => useAppStore().sidebar)
const device = computed(() => useAppStore().device)
const needTagsView = computed(() => settingsStore.tagsView)
const fixedHeader = computed(() => settingsStore.fixedHeader)
const isRouterTop = computed(() => settingsStore.isRouterTop)

const classObj = computed(() => ({
  hideSidebar: !sidebar.value.opened,
  openSidebar: sidebar.value.opened,
  withoutAnimation: sidebar.value.withoutAnimation,
  mobile: device.value === 'mobile'
}))

const { width } = useWindowSize()
// 宽度小于600设置设备为手机模式
const WIDTH = 600

watchEffect(() => {
  if (device.value === 'mobile' && sidebar.value.opened) {
    useAppStore().closeSideBar({ withoutAnimation: false })
  }
  if (width.value - 1 < WIDTH) {
    useAppStore().toggleDevice('mobile')
    useAppStore().closeSideBar({ withoutAnimation: true })
  } else {
    useAppStore().toggleDevice('desktop')
  }
})

function handleClickOutside() {
  useAppStore().closeSideBar({ withoutAnimation: false })
}

const settingRef = ref<any>(null)
function setLayout() {
  settingRef.value?.openSetting()
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/mixin.scss';
@import '@/assets/styles/variables.module.scss';

.app-wrapper {
  @include clearfix;
  position: relative;
  height: 100%;
  width: 100%;

  &.mobile.openSidebar {
    position: fixed;
    top: 0;
  }
}

.drawer-bg {
  background: #000;
  opacity: 0.3;
  width: 100%;
  top: 0;
  height: 100%;
  position: absolute;
  z-index: 999;
}

.fixed-header {
  // position: fixed;
  // top: 0;
  // right: 0;
  // z-index: 9;
  // width: calc(100% - #{$base-sidebar-width});
  width: 100%;
  transition: width 0.28s;
  background-color: var(--el-menu-bg-color);
}
</style>
