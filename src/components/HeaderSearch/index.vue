<template>
  <div :class="{ show: show }" class="header-search">
    <svg-icon class-name="search-icon" icon-class="search" @click.stop="click" />
    <el-select
      v-show="show"
      ref="headerSearchSelectRef"
      v-model="search"
      :remote-method="querySearch"
      filterable
      default-first-option
      remote
      placeholder="Search"
      class="header-search-select w-100px! ml-6px"
      @change="change"
    >
      <el-option
        v-for="option in options"
        :key="option.item.path"
        :value="option.item"
        :label="option.item.title.join(' > ')"
      />
    </el-select>
  </div>
</template>

<script setup lang="ts">
import Fuse from 'fuse.js'
import { getNormalPath } from '@/utils/ruoyi'
import { isHttp } from '@/utils/validate'
import usePermissionStore from '@/store/modules/permission'
import { ref, computed, onMounted, watchEffect, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'

const search = ref('')
const options = ref<any[]>([])
const searchPool = ref<any[]>([])
const show = ref(false)
const fuse = ref<any>(undefined)
const headerSearchSelectRef = ref<any>(null)
const router = useRouter()
const routes = computed(() => usePermissionStore().routes)

function click() {
  show.value = !show.value
  if (show.value) {
    console.log('headerSearchSelectRef',headerSearchSelectRef.value)
    headerSearchSelectRef.value && headerSearchSelectRef.value.focus()
  }
}
function change(val: any) {
  const path = val.path
  if (isHttp(path)) {
    // http(s):// 路径新窗口打开
    const pindex = path.indexOf('http')
    window.open(path.substr(pindex, path.length), '_blank')
  } else {
    router.push(path)
  }

  search.value = ''
  options.value = []
  nextTick(() => {
    show.value = false
  })
}
function initFuse(list: any) {
  fuse.value = new Fuse(list, {
    shouldSort: true,
    threshold: 0.4,
    location: 0,
    distance: 100,
    minMatchCharLength: 1,
    keys: [
      {
        name: 'title',
        weight: 0.7
      },
      {
        name: 'path',
        weight: 0.3
      }
    ]
  } as any)
}
// Filter out the routes that can be displayed in the sidebar
// And generate the internationalized title
function generateRoutes(routes: any[], basePath = '', prefixTitle = []) {
  let res: any[] = []

  for (const r of routes) {
    // skip hidden router
    if (r.hidden) {
      continue
    }
    const p = r.path.length > 0 && r.path[0] === '/' ? r.path : '/' + r.path
    const data: any = {
      path: !isHttp(r.path) ? getNormalPath(basePath + p) : r.path,
      title: [...prefixTitle]
    }

    if (r.meta && r.meta.title) {
      data.title = [...data.title, r.meta.title]

      if (r.redirect !== 'noRedirect') {
        // only push the routes with title
        // special case: need to exclude parent router without redirect
        res.push(data)
      }
    }

    // recursive child routes
    if (r.children) {
      const tempRoutes = generateRoutes(r.children, data.path, data.title)
      if (tempRoutes.length >= 1) {
        res = [...res, ...tempRoutes]
      }
    }
  }
  return res
}
function querySearch(query: any) {
  if (query !== '') {
    options.value = fuse.value.search(query)
  } else {
    options.value = []
  }
}

onMounted(() => {
  searchPool.value = generateRoutes(routes.value)
})

watchEffect(() => {
  searchPool.value = generateRoutes(routes.value)
})

watch(searchPool, list => {
  initFuse(list)
})
</script>

<style lang="scss" scoped>
.header-search {
  font-size: 0 !important;

  .search-icon {
    cursor: pointer;
    font-size: 18px;
    vertical-align: middle;
  }

  .header-search-select {
    font-size: 18px;
  }
}
</style>
