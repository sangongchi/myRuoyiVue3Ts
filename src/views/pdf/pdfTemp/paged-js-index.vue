<template>
  <div class="pdf-container">
    <el-button type="primary" size="small" @click="clearCache" class="clear-cache-btn">清除缓存并重新生成</el-button>
    <!-- PDF 渲染容器 -->
    <div id="pdfCon"></div>

    <!-- 加载状态 -->
    <div v-if="isLoading" class="pdf-loading-overlay">
      <div class="loading-content">
        <el-icon class="is-loading" :size="50">
          <Loading />
        </el-icon>
        <p class="loading-text">{{ progressText }}</p>
        <el-progress
          :percentage="isLoading ? 50 : 100"
          :indeterminate="true"
          :stroke-width="6"
          class="loading-progress"
        />
        <el-button type="primary" size="small" @click="clearCache" class="clear-cache-btn">
          清除缓存并重新生成
        </el-button>
      </div>
    </div>

    <!-- 预览前的原始内容容器（隐藏） -->
    <div style="display: none">
      <div ref="pdfContentRef">
        <!-- 页眉元素 -->
        <div class="running-header">
          <div class="header-content">PDF页头/标题</div>
        </div>

        <!-- 页脚元素 -->
        <div class="running-footer-left">
          <div class="footer-content">参考序列：GRCh37/hg19</div>
        </div>

        <!-- 长图分页容器 -->
        <div class="long-image-section" v-if="imagePages.length > 0">
          <div
            v-for="(page, index) in imagePages"
            :key="index"
            class="image-page-container"
            :style="{
              backgroundImage: `url(${imageUrl})`,
              backgroundPosition: `0 -${page.offset}px`,
              height: page.height + 'px'
            }"
          ></div>
        </div>

        <!-- 图片加载失败的提示 -->
        <div v-else class="image-load-fallback">
          <el-empty description="长图加载失败或暂无图片" />
        </div>

        <!-- 其他内容 -->
        <ul class="long_content_list">
          <li class="item" v-for="(_, i) in Array(300).fill('')" :key="i">
            {{ `124 -  ${i}` }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, nextTick } from 'vue'
import * as Paged from 'pagedjs'
import { ElMessage, ElIcon, ElProgress } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
// 导入 pagedjs 样式文件
import pagedjsStyles from './pagedjs-styles.css?inline'
// 导入缓存管理器
import { pdfCacheManager } from './pdf-cache'
// ✅ 正确导入图片（Vite 会处理）
import testImage from './test.png'

const pdfContentRef = ref<HTMLElement | null>(null)
const isPreveiwed = ref<boolean>(false) // ✅ 补回缺失的变量定义
const isLoading = ref<boolean>(false)
const progressText = ref<string>('')

// 长图相关 - 使用导入的图片
const imageUrl = ref(testImage)
const imagePages = ref<Array<{ offset: number; height: number }>>([])

onMounted(async () => {
  await nextTick()
  try {
    await pdfCacheManager.init()
    console.log('[PDF] 缓存系统已初始化')
  } catch (error) {
    console.warn('[PDF] 缓存系统初始化失败:', error)
  }

  if (pdfContentRef.value && document.getElementById('pdfCon')) {
    // 先处理长图分页
    await processLongImage()
    // 再生成 PDF
    await generatePDFPreview()
  } else {
    console.error('❌ PDF 容器元素未找到')
  }
})

/**
 * 处理长图，计算分页信息
 */
async function processLongImage() {
  return new Promise<void>(resolve => {
    const img = new Image()
    // ✅ 添加跨域支持（如果需要）
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      console.log('[长图加载成功]', {
        宽度: img.naturalWidth,
        高度: img.naturalHeight,
        路径: imageUrl.value
      })
      // ✅ 修正：严格对应 pagedjs-styles.css 中的 margin 设置
      // A4 总高 297mm, margin-top: 30mm, margin-bottom: 15mm (根据你的最新设置)
      const A4Height = 297
      const A4Width = 210
      const marginTop = 30
      const marginBottom = 15
      const pageHeightMm = A4Height - marginTop - marginBottom // 结果应为 252mm

      // ✅ 修正：使用高精度转换系数
      const pxPerMm = 96 / 25.4
      // 按照缩放比例计算图片可展示的高度
      const scale = img.naturalWidth / ((A4Width - 40) * pxPerMm)
      const totalHeightPx = Math.ceil(img.naturalHeight / scale)
      // ✅ 关键：向下取整，防止因为 0.x 像素的误差导致 Paged.js 认为这一页放不下而挤出第二个空壳
      const pageHeightPx = Math.floor(pageHeightMm * pxPerMm)

      if (totalHeightPx <= 0) {
        ElMessage.error('图片高度异常')
        resolve()
        return
      }
      imagePages.value = []
      let currentOffset = 0
      while (currentOffset < totalHeightPx) {
        const remainingHeight = totalHeightPx - currentOffset
        // 如果剩余高度非常小（比如小于 50px），直接合并到上一页，避免生成一个几乎空白的页面
        if (remainingHeight < 50 && imagePages.value.length > 0) {
          const lastPage = imagePages.value[imagePages.value.length - 1]
          lastPage.height += remainingHeight
          break
        }
        const heightPx = Math.min(pageHeightPx, remainingHeight)
        imagePages.value.push({
          offset: currentOffset,
          height: heightPx // 直接使用像素值
        })
        currentOffset += heightPx
      }
      console.log(`[长图处理] 可用高度: ${pageHeightMm}mm (${pageHeightPx}px), 分为 ${imagePages.value.length} 页`)
      resolve()
    }

    img.onerror = error => {
      console.error('[长图加载失败]', {
        路径: imageUrl.value,
        错误: error
      })
      ElMessage.warning('长图加载失败，将跳过图片分页')
      // 即使失败也继续，避免阻塞整个流程
      resolve()
    }

    // 设置图片源
    img.src = imageUrl.value

    // 超时保护（大图片可能需要更长时间）
    setTimeout(() => {
      if (!img.complete) {
        console.warn('[长图加载超时]', imageUrl.value)
        img.src = '' // 取消加载
        resolve()
      }
    }, 30000) // 30秒超时（适合大图片）
  })
}

async function generatePDFPreview() {
  if (!pdfContentRef.value || !document.getElementById('pdfCon')) return

  isLoading.value = true
  progressText.value = '正在检查缓存...'

  try {
    // ✅ 关键：在开始新渲染或加载缓存前，先清理旧的渲染结果
    const container = document.getElementById('pdfCon')
    if (container) {
      container.innerHTML = ''
      container.classList.remove('pagedjs_finish')
    }

    const tempContainer = document.createElement('div')
    tempContainer.innerHTML = pdfContentRef.value.innerHTML
    const contentElement = tempContainer as Element

    if (!contentElement) {
      throw new Error('内容为空')
    }

    // ✅ 保存原始 HTML（未渲染的）用于缓存
    const originalHtml = contentElement.outerHTML
    const cacheKey = pdfCacheManager.generateCacheKey(originalHtml, pagedjsStyles)
    const cached = await pdfCacheManager.get(cacheKey)

    if (cached) {
      console.log('[PDF] 使用缓存，共', cached.totalPages, '页')
      progressText.value = `从缓存加载 (${cached.totalPages} 页)`
      renderCachedPDF(cached.html, cached.originalHtml || originalHtml)
      return
    }

    console.log('[PDF] 缓存未命中，开始渲染...')
    progressText.value = '正在渲染 PDF...'
    await renderDirectly(contentElement, cacheKey, originalHtml)
  } catch (error: any) {
    console.error('❌ PDF 预览生成失败:', error)
    ElMessage.error('PDF 预览生成失败: ' + error.message)
    isLoading.value = false
  }
}

// paged js 转换pdf形式预览html，并缓存起来
async function renderDirectly(contentElement: Element, cacheKey: string, originalHtml: string) {
  const previewer = new Paged.Previewer()
  const cssBlob = new Blob([pagedjsStyles], { type: 'text/css' })
  const cssUrl = URL.createObjectURL(cssBlob)

  try {
    const flow = await previewer.preview(contentElement, [cssUrl], document.getElementById('pdfCon'))

    console.log('✅ PDF 预览生成成功，总页数:', flow.total)

    const container = document.getElementById('pdfCon')
    if (container) {
      // ✅ 关键：同时缓存渲染后的 HTML 和原始 HTML
      await pdfCacheManager.set(cacheKey, container.innerHTML, originalHtml, flow.total)
    }

    isPreveiwed.value = true
    isLoading.value = false
    URL.revokeObjectURL(cssUrl)
  } catch (error) {
    URL.revokeObjectURL(cssUrl)
    throw error
  }
}

function renderCachedPDF(renderedHtml: string, originalHtml: string) {
  const container = document.getElementById('pdfCon')
  if (container) {
    console.log('[PDF Cache] 开始还原缓存内容...')

    // ✅ 1. 彻底清空容器，移除所有旧的事件监听和 Paged.js 痕迹
    while (container.firstChild) {
      container.removeChild(container.firstChild)
    }

    // ✅ 2. 确保全局样式已注入到 <head> 中（而不是容器内）
    let styleEl = document.getElementById('pagedjs-cached-styles') as HTMLStyleElement
    if (!styleEl) {
      styleEl = document.createElement('style')
      styleEl.id = 'pagedjs-cached-styles'
      styleEl.textContent = pagedjsStyles
      document.head.appendChild(styleEl)
    } else {
      // 如果样式已存在，强制刷新一下内容以防万一
      styleEl.textContent = pagedjsStyles
    }

    // ✅ 3. 使用原始 HTML 重新渲染（而不是直接使用渲染后的 HTML）
    // 这样可以确保 Paged.js 能够正确处理分页逻辑
    container.innerHTML = originalHtml

    // ✅ 4. 强制触发浏览器重排 (Reflow)，确保 DOM 立即渲染
    void container.offsetHeight

    // ✅ 5. 标记渲染完成状态
    container.classList.add('pagedjs_finish')
    isPreveiwed.value = true
    isLoading.value = false

    console.log('[PDF Cache] 缓存内容还原完成，DOM 节点数:', container.children.length)
  } else {
    console.error('[PDF Cache] 找不到 #pdfCon 容器')
  }
}

async function clearCache() {
  try {
    await pdfCacheManager.clear()
    ElMessage.success('PDF 缓存已清空')
    window.location.reload()
  } catch (error) {
    console.error('清除缓存失败:', error)
    ElMessage.error('清除缓存失败')
  }
}

defineExpose({
  clearCache,
  regenerate: generatePDFPreview
})
</script>

<style lang="scss">
.pdf-container {
  width: 100%;
  height: 100%;
  overflow: auto;
  position: relative;
}

.pdf-loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;

  .loading-content {
    text-align: center;
    padding: 40px;

    .loading-text {
      margin: 20px 0;
      font-size: 16px;
      color: #606266;
      font-weight: 500;
    }

    .loading-progress {
      width: 300px;
      margin: 20px auto;
    }

    .clear-cache-btn {
      margin-top: 20px;
    }
  }
}

.pagedjs_pages {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 20px 0;

  .pagedjs_page {
    border: 1px solid #ccc;
    border-radius: 6px;
    box-shadow: 0 0 8px rgba(0, 0, 0, 0.1);
    background: white;
  }
}

/* 长图分页样式 */
.long-image-section {
  margin: 0;
  padding: 0;
  width: 100%;
}

.image-page-container {
  width: 100%;
  height: 100%; /* ✅ 关键：让容器填满 Paged.js 分配给它的整个页面空间 */
  background-repeat: no-repeat;
  background-size: 100% auto;

  /* 移除所有边距，防止撑破页面 */
  margin: 0;
  padding: 0;
  box-sizing: border-box;

  /* ✅ 关键：禁止 Paged.js 对这个容器进行二次分割 */
  break-inside: avoid;
  page-break-inside: avoid;
}

/* 图片加载失败占位 */
.image-load-fallback {
  padding: 40px;
  text-align: center;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  margin: 20px 0;
}

.long_content_list {
  color: gray;
  white-space: pre-wrap;
  word-break: break-all;

  .item {
    text-align: left;
  }
}
</style>
