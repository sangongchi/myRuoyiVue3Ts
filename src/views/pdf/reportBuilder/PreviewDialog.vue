<template>
  <el-dialog v-model="store.previewVisible" title="报告预览" width="920px" :close-on-click-modal="true" destroy-on-close>
    <div class="preview-body">
      <iframe :srcdoc="store.previewHtml" class="preview-iframe"></iframe>
    </div>
    <template #footer>
      <el-button @click="store.previewVisible = false">关闭</el-button>
      <el-button type="warning" @click="handleExportWord">导出 Word</el-button>
      <el-button type="primary" @click="handleExportPDF">打印 / PDF</el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { useReportBuilderStore } from '../store'
import { exportWord, exportPDF } from '../utils'

const store = useReportBuilderStore()

const emit = defineEmits<{
  (e: 'export-word'): void
  (e: 'export-pdf'): void
}>()

function handleExportWord() {
  emit('export-word')
}

function handleExportPDF() {
  store.previewVisible = false
  emit('export-pdf')
}
</script>

<style scoped>
.preview-body {
  min-height: 400px;
}
.preview-iframe {
  width: 100%;
  height: 65vh;
  border: 1px solid var(--border);
  border-radius: 8px;
}
</style>
