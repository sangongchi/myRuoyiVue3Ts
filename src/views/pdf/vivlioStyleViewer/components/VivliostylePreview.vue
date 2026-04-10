<template>
  <div class="preview-container">
    <!-- 分页控制栏 -->
    <div class="controls">
      <button @click="goPrevPage" :disabled="currentPage <= 1">← 上一页</button>
      <span>第 {{ currentPage }} 页 / 共 {{ totalPages || '?' }} 页</span>
      <button @click="goNextPage" :disabled="currentPage >= totalPages">下一页 →</button>
    </div>

    <!-- Vivliostyle 预览容器 -->
    <div ref="viewerContainer" class="viewer-wrapper"></div>
  </div>
</template>

<script setup lang="ts">
// ✅ 修正：Vivliostyle Viewer 不支持 ES Module 导入
// 需要通过动态加载 script 标签的方式引入
const props = defineProps({
  // 文档URL或HTML内容
  documentContent: {
    type: String,
    required: true
  },
  // 页面尺寸配置
  pageSize: {
    type: Object,
    default: () => ({ width: '210mm', height: '297mm' })
  }
})

const viewerContainer = ref<HTMLElement | null>(null)
const currentPage = ref(1)
const totalPages = ref(0)
let viewer: any = null
let vivliostyleLoaded = false

// 动态加载 Vivliostyle Viewer 脚本
const loadVivliostyleScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (vivliostyleLoaded && (window as any).vivliostyle) {
      resolve()
      return
    }

    const script = document.createElement('script')
    script.src = '/node_modules/@vivliostyle/viewer/lib/js/vivliostyle-viewer.js'
    script.onload = () => {
      vivliostyleLoaded = true
      resolve()
    }
    script.onerror = () => {
      reject(new Error('Failed to load Vivliostyle Viewer script'))
    }
    document.head.appendChild(script)
  })
}

// 初始化Vivliostyle
const initViewer = async () => {
  if (!viewerContainer.value) return

  try {
    // 确保脚本已加载
    await loadVivliostyleScript()

    const vivliostyle = (window as any).vivliostyle
    if (!vivliostyle || !vivliostyle.Viewer) {
      throw new Error('Vivliostyle Viewer not available')
    }

    viewer = new vivliostyle.Viewer({
      element: viewerContainer.value,
      pageSize: props.pageSize
    })

    // 加载文档内容
    await viewer.loadDocument(props.documentContent)

    // 获取总页数
    viewer.on('ready', () => {
      totalPages.value = viewer!.totalPageCount
    })

    // 监听页面变化
    viewer.on('pagechange', (ev: any) => {
      currentPage.value = ev.pageNumber
    })
  } catch (error) {
    console.error('❌ 初始化 Vivliostyle Viewer 失败:', error)
  }
}

// 翻页控制
const goPrevPage = () => {
  viewer?.goToPage(currentPage.value - 1)
}

const goNextPage = () => {
  viewer?.goToPage(currentPage.value + 1)
}

// 响应式更新文档
watch(
  () => props.documentContent,
  () => {
    viewer?.loadDocument(props.documentContent)
  }
)

onMounted(initViewer)
onBeforeUnmount(() => {
  viewer?.destroy()
})
</script>