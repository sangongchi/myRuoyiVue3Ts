<template>
  <div :class="{ 'has-logo': showLogo }">
    <logo ref="logoRef" v-if="showLogo" :collapse="isCollapse" />
    <el-scrollbar wrap-class="scrollbar-wrapper" v-if="mode === 'vertical'">
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        :unique-opened="true"
        :active-text-color="themeColor"
        :collapse-transition="false"
        :mode="mode"
      >
        <sidebar-item
          v-for="(routeItem, index) in sidebarRouters"
          :key="routeItem.path + index"
          :item="routeItem"
          :base-path="routeItem.path"
        />
      </el-menu>
    </el-scrollbar>
    <template v-else>
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        :unique-opened="true"
        :active-text-color="themeColor"
        :collapse-transition="false"
        :mode="mode"
        :style="meunStyle"
      >
        <sidebar-item
          v-for="(routeItem, index) in sidebarRouters"
          :key="routeItem.path + index"
          :item="routeItem"
          :base-path="routeItem.path"
        />
      </el-menu>
    </template>
  </div>
</template>

<script setup lang="ts">
import Logo from './Logo.vue'
import SidebarItem from './SidebarItem.vue'
import useAppStore from '@/store/modules/app'
import useSettingsStore from '@/store/modules/settings'
import usePermissionStore from '@/store/modules/permission'
import { useRoute } from 'vue-router'

const props = defineProps({
  mode: {
    type: String,
    default: 'vertical'
  }
})

const route = useRoute()
const appStore = useAppStore()
const settingsStore = useSettingsStore()
const permissionStore = usePermissionStore()
const logoRef = ref<InstanceType<typeof Logo>>()
const logoWidth = ref(0)

onMounted(() => {
  if (logoRef.value) {
    logoWidth.value = logoRef.value.$el.getBoundingClientRect().width
  }
})

const meunStyle = computed(() => {
  return {
    width: `calc(100% - ${logoWidth.value}px)`
  }
})

const sidebarRouters = computed(() => {
  return permissionStore.sidebarRouters.filter(item => !item.hidden)
})
const showLogo = computed(() => settingsStore.sidebarLogo)
const themeColor = computed(() => settingsStore.themeColor)
const isCollapse = computed(() => {
  return !appStore.sidebar.opened && props.mode !== 'horizontal'
})

const activeMenu = computed(() => {
  const { meta, path } = route
  // if set path, the sidebar will highlight the path you set
  if (meta.activeMenu) {
    return meta.activeMenu
  }
  return path
})
</script>
