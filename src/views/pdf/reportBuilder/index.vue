<template>
  <div class="report-builder">
    <!-- 顶部工具栏 -->
    <div class="top-bar">
      <div class="logo">
        <svg viewBox="0 0 28 28">
          <rect width="28" height="28" rx="7" fill="var(--accent)" />
          <path d="M7 7h14v1.5H7zM7 12h10v1.5H7zM7 17h12v1.5H7z" fill="#fff" />
        </svg>
        <span>报告单生成器</span>
      </div>
      <div class="actions">
        <el-button :icon="RefreshLeft" circle size="small" @click="store.undo()" title="撤销" />
        <el-button :icon="RefreshRight" circle size="small" @click="store.redo()" title="重做" />
        <div class="divider-v"></div>
        <el-button @click="handlePreview">
          <el-icon><View /></el-icon>
          预览
        </el-button>
        <el-button @click="handleExportHTML">
          <el-icon><Upload /></el-icon>
          HTML
        </el-button>
        <el-button type="warning" @click="handleExportWord">
          <el-icon><Document /></el-icon>
          Word
        </el-button>
        <el-button type="primary" @click="handleExportPDF">
          <el-icon><Printer /></el-icon>
          PDF
        </el-button>
        <div class="divider-v"></div>
        <el-button :icon="Delete" circle size="small" @click="store.clearAll()" title="清空" />
        <div class="theme-toggle" @click="toggleTheme"></div>
      </div>
    </div>

    <!-- 主体三栏布局 -->
    <div class="main-layout">
      <ComponentPalette />
      <CanvasArea ref="canvasRef" />
      <PropertyPanel />
    </div>

    <!-- 预览弹窗 -->
    <PreviewDialog @export-word="handleExportWord" @export-pdf="handleExportPDF" />

    <!-- Toast 消息 -->
    <div class="toast-box">
      <div v-for="t in store.toasts" :key="t.id" class="toast" :class="t.type">
        {{ t.message }}
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { RefreshLeft, RefreshRight, View, Upload, Document, Printer, Delete } from '@element-plus/icons-vue'
import ComponentPalette from './ComponentPalette.vue'
import CanvasArea from './CanvasArea.vue'
import PropertyPanel from './PropertyPanel.vue'
import PreviewDialog from './PreviewDialog.vue'
import { useReportBuilderStore } from './store'
import { genHtml, exportHTML, exportWord, exportPDF } from './utils'

const store = useReportBuilderStore()
const canvasRef = ref<InstanceType<typeof CanvasArea> | null>(null)

function getChartImages(): Record<string, string> {
  return canvasRef.value?.getChartImages() || {}
}

function handlePreview() {
  if (store.components.length === 0) {
    store.toast('请先添加组件', 'e')
    return
  }
  store.previewHtml = genHtml(store.components, getChartImages())
  store.previewVisible = true
}

function handleExportHTML() {
  if (store.components.length === 0) {
    store.toast('请先添加组件', 'e')
    return
  }
  exportHTML(store.components, getChartImages())
  store.toast('HTML 已导出', 's')
}

function handleExportWord() {
  if (store.components.length === 0) {
    store.toast('请先添加组件', 'e')
    return
  }
  try {
    exportWord(store.components, getChartImages())
    store.toast('Word 已导出', 's')
  } catch (e: any) {
    store.toast('Word 导出失败: ' + e.message, 'e')
  }
}

function handleExportPDF() {
  if (store.components.length === 0) {
    store.toast('请先添加组件', 'e')
    return
  }
  exportPDF(store.components, getChartImages())
  store.toast('打印窗口已打开，选择"另存为 PDF"即可', 'i')
}

function toggleTheme() {
  const h = document.documentElement
  h.setAttribute('data-theme', h.getAttribute('data-theme') === 'dark' ? 'light' : 'dark')
}
</script>

<!-- 全局 CSS 变量（非 scoped，供子组件继承） -->
<style>
.report-builder {
  --bg-pri: #fff;
  --bg-sec: #f8f9fb;
  --bg-ter: #eef1f5;
  --txt-pri: #1a1d23;
  --txt-sec: #5f6577;
  --txt-ter: #8e94a8;
  --border: #e2e5ec;
  --accent: #4f6ef7;
  --accent-lt: #eef1fe;
  --ok: #22c55e;
  --warn: #f59e0b;
  --err: #ef4444;
  --r-sm: 6px;
  --r-md: 10px;
  --r-lg: 14px;
}
[data-theme='dark'] .report-builder {
  --bg-pri: #12141a;
  --bg-sec: #1a1d25;
  --bg-ter: #22252f;
  --txt-pri: #e4e6ec;
  --txt-sec: #9398a8;
  --txt-ter: #6b7080;
  --border: #2a2d38;
  --accent-lt: #1c2240;
}
</style>

<style scoped>
.report-builder {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--bg-sec);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  color: var(--txt-pri);
}

/* 顶部栏 */
.top-bar {
  height: 56px;
  background: var(--bg-pri);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  z-index: 100;
  flex-shrink: 0;
}
.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
  font-size: 16px;
}
.logo svg {
  width: 28px;
  height: 28px;
}
.actions {
  display: flex;
  align-items: center;
  gap: 6px;
}
.divider-v {
  width: 1px;
  height: 24px;
  background: var(--border);
  margin: 0 4px;
}
.theme-toggle {
  position: relative;
  width: 44px;
  height: 24px;
  border-radius: 12px;
  background: var(--bg-ter);
  border: 1px solid var(--border);
  cursor: pointer;
  transition: all 0.2s;
  margin-left: 4px;
}
.theme-toggle::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--accent);
  transition: all 0.2s;
}
:global([data-theme='dark']) .theme-toggle::after {
  transform: translateX(20px);
}

/* 主布局 */
.main-layout {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* Toast */
.toast-box {
  position: fixed;
  top: 68px;
  right: 16px;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.toast {
  padding: 10px 18px;
  border-radius: var(--r-md);
  background: var(--bg-pri);
  border: 1px solid var(--border);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 8px;
  max-width: 300px;
  animation: slideR 0.3s;
}
.toast.s {
  border-left: 3px solid var(--ok);
}
.toast.e {
  border-left: 3px solid var(--err);
}
.toast.i {
  border-left: 3px solid var(--accent);
}
@keyframes slideR {
  from {
    opacity: 0;
    transform: translateX(24px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>
