<template>
  <el-menu :default-active="activeMenu" mode="horizontal" :ellipsis="false" @select="handleSelect" menu-trigger="click">
    <template v-for="(item, index) in topMenus">
      <el-menu-item v-if="index < Number(visibleNumber)" :key="index" :style="{ '--theme': themeColor }" :index="item.path">
        <svg-icon :icon-class="item.meta?.icon" />
        {{ item.meta?.title }}
      </el-menu-item>
    </template>

    <!-- 顶部菜单超出数量折叠 -->
    <el-sub-menu
      v-if="topMenus.length > Number(visibleNumber)"
      :style="{ '--theme': themeColor }"
      index="more"
      mode="horizontal"
    >
      <template #title>更多菜单</template>
      <div class="col-menu">
        <template v-for="(item, index) in topMenus">
          <el-menu-item
            v-if="index >= Number(visibleNumber)"
            :key="index"
            :index="item.path"
            :style="{ '--theme': themeColor }"
          >
            <svg-icon :icon-class="item.meta?.icon" />
            {{ item.meta?.title }}
          </el-menu-item>
        </template>
      </div>
    </el-sub-menu>
  </el-menu>
</template>

<script setup lang="ts">
import { constantRoutes } from '@/router'
import { isHttp } from '@/utils/validate'
import useAppStore from '@/store/modules/app'
import useSettingsStore from '@/store/modules/settings'
import usePermissionStore from '@/store/modules/permission'
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { RouteRecordRaw, useRoute, useRouter } from 'vue-router'

// 顶部栏初始数
const visibleNumber = ref<number | null>(null)
// 当前激活菜单的 index
const currentIndex = ref(null)
// 隐藏侧边栏路由
const hideList = ['/index', '/user/profile']

const appStore = useAppStore()
const settingsStore = useSettingsStore()
const permissionStore = usePermissionStore()
const route = useRoute()
const router = useRouter()

// 主题颜色
const themeColor = computed(() => settingsStore.themeColor)
// 所有的路由信息
const routers = computed(() => permissionStore.topbarRouters)

// 顶部显示菜单
const topMenus = computed(() => {
  let topMenus: RouteRecordRaw[] = []
  routers.value.map(menu => {
    if (menu.hidden !== true) {
      // 兼容顶部栏一级菜单内部跳转
      if (menu.path === '/') {
        menu.children?.[0] && topMenus.push(menu.children?.[0])
      } else {
        topMenus.push(menu)
      }
    }
  })
  return topMenus
})

// 设置子路由
const childrenMenus = computed(() => {
  let childrenMenus: RouteRecordRaw[] = []
  routers.value.map(router => {
    for (let item in router.children) {
      if (router.children[item as any].parentPath === undefined) {
        if (router.path === '/') {
          router.children[item as any].path = '/' + router.children[item as any].path
        } else {
          if (!isHttp(router.children[item as any].path)) {
            router.children[item as any].path = router.path + '/' + router.children[item as any].path
          }
        }
        router.children[item as any].parentPath = router.path
      }
      childrenMenus.push(router.children[item as any])
    }
  })
  return constantRoutes.concat(childrenMenus)
})

// 默认激活的菜单
const activeMenu = computed(() => {
  const path = route.path
  let activePath = path
  if (path !== undefined && path.lastIndexOf('/') > 0 && hideList.indexOf(path) === -1) {
    const tmpPath = path.substring(1, path.length)
    activePath = '/' + tmpPath.substring(0, tmpPath.indexOf('/'))
    if (!route.meta.link) {
      appStore.toggleSideBarHide(false)
    }
  } else if (!(route as any).children) {
    activePath = path
    appStore.toggleSideBarHide(true)
  }
  activeRoutes(activePath)
  return activePath
})

function setVisibleNumber() {
  const width = document.body.getBoundingClientRect().width / 3
  visibleNumber.value = parseInt(String(width / 100))
}

function handleSelect(key: any, keyPath: any) {
  console.log('key', key, 'keyPath', keyPath)
  currentIndex.value = key
  const route = routers.value.find(item => item.path === key)
  console.log('route-->', route)
  if (isHttp(key)) {
    // http(s):// 路径新窗口打开
    window.open(key, '_blank')
  } else if (!route || !route.children) {
    // 没有子路由路径内部打开
    router.push({ path: key })
    appStore.toggleSideBarHide(true)
  } else {
    // 显示左侧联动菜单
    activeRoutes(key)
    appStore.toggleSideBarHide(false)
    // 主动切换至第一个子路由
    if (route.children && route.children[0].path) {
      router.push({ path: route.children[0].path })
    }
  }
}
function activeRoutes(key: any) {
  let routes: RouteRecordRaw[] = []
  if (childrenMenus.value && childrenMenus.value.length > 0) {
    childrenMenus.value.map(item => {
      if (key === item.parentPath || (key === 'index' && '' === item.path)) {
        routes.push(item)
      }
    })
  }
  if (routes.length > 0) {
    permissionStore.setSidebarRouters(routes)
  } else {
    appStore.toggleSideBarHide(true)
  }
  return routes
}

onMounted(() => {
  window.addEventListener('resize', setVisibleNumber)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', setVisibleNumber)
})

onMounted(() => {
  setVisibleNumber()
})
</script>

<style lang="scss" scoped>
.el-menu--horizontal.el-menu {
  border: none;
}

.el-menu-item {
  float: left;
  display: flex;
  align-items: center;
  padding: 0 8px;
  margin: 0 10px;
  color: var(--el-menu-text-color);

  :deep(.svg-icon) {
    margin-right: 4px;
  }
}

.el-menu-item.is-active,
.el-sub-menu.is-active .el-submenu__title {
  border-bottom: 2px solid var(--el-color-primary);
}

/* sub-menu item */
.el-sub-menu {
  :deep(.el-sub-menu__title) {
    display: flex;
    float: left;
    align-items: center;

    .el-icon {
      position: relative;
      right: auto;
      margin-top: 0;
      top: auto;
    }
  }
}

.col-menu {
  display: flex;
  flex-direction: column;
  :deep(.el-menu-item) {
    &.is-active {
      border: none;
    }
    margin: 0;
  }
}
</style>
