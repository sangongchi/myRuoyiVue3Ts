<template>
  <div class="merge-pdf">
    <h2>合并 PDF</h2>
    <div class="controls">
      <label class="file-input">
        <input type="file" accept="application/pdf" multiple @change="onFilesChange" />
        <span>选择 PDF 文件（可多选）</span>
      </label>
      <div class="options">
        <label>
          <input type="radio" value="concat" v-model="mode" />
          简单合并（顺序拼接）
        </label>
        <label>
          <input type="radio" value="pack" v-model="mode" />
          填充剩余空白（尽量放入上一页空白区域）
        </label>
      </div>
      <div class="actions">
        <input class="name" v-model="outputName" placeholder="输出文件名，如 merged.pdf" />
        <button :disabled="!files.length || isMerging" @click="mergePdfHandle">
          {{ isMerging ? '合并中…' : '开始合并' }}
        </button>
      </div>
    </div>
    <ul class="file-list" v-if="files.length">
      <li v-for="(f, idx) in files" :key="idx">{{ f.name }}</li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { PDFDocument, PDFPage } from 'pdf-lib'
import { saveAs } from 'file-saver'

type MergeMode = 'concat' | 'pack'

const files = ref<File[]>([])
const mode = ref<MergeMode>('concat')
const isMerging = ref(false)
const outputName = ref('merged.pdf')

function onFilesChange(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files) return
  files.value = Array.from(input.files)
}

async function mergePdfHandle() {
  if (!files.value.length) return
  isMerging.value = true
  try {
    const buffers = (await Promise.all(files.value.map(f => f.arrayBuffer()))).reverse()
    // 顺序拼接不填充上一个pdf
    if (mode.value === 'concat') {
      await mergeConcat(buffers)
    } else {
      await mergePack(buffers)
    }
  } catch (err) {
    console.error(err)
    alert('合并失败，请重试或检查文件。')
  } finally {
    isMerging.value = false
  }
}

async function mergeConcat(buffers: ArrayBuffer[]) {
  const out = await PDFDocument.create()
  for (const buf of buffers) {
    const src = await PDFDocument.load(buf)
    const copied = await out.copyPages(src, src.getPageIndices())
    for (const p of copied) out.addPage(p)
  }
  const bytes = await out.save()
  saveAs(new Blob([bytes], { type: 'application/pdf' }), outputName.value)
}

async function mergePack(buffers: ArrayBuffer[]) {
  const out = await PDFDocument.create()

  let currentPage: PDFPage | null = null
  let pageWidth = 0
  let pageHeight = 0
  let cursorY = 0

  for (const buf of buffers) {
    const src = await PDFDocument.load(buf)
    for (let i = 0; i < src.getPageCount(); i++) {
      const srcPage = src.getPage(i)
      const { width: srcW, height: srcH } = srcPage.getSize()
      console.log(srcW, 'srcW', srcH, 'srcH')
      // 计算剩余可用高度
      console.log(srcPage, 'srcPage')
      // 初始化目标页面尺寸（固定为第一张页面的尺寸）
      if (!currentPage) {
        pageWidth = srcW
        pageHeight = srcH
        currentPage = out.addPage([pageWidth, pageHeight])
        cursorY = pageHeight
      }

      // 将源页嵌入为 XObject，并按宽度与剩余高度自适应缩放
      const embedded = await out.embedPage(srcPage)
      // 首先尝试在当前页剩余空间内缩放
      let scaleByWidth = pageWidth / srcW
      let scaleByHeight = cursorY / srcH
      let scale = Math.min(scaleByWidth, scaleByHeight)

      // 如果当前页放不下（scale太小或负数），新开一页再按宽度缩放
      if (scale <= 0 || cursorY <= 0) {
        currentPage = out.addPage([pageWidth, pageHeight])
        cursorY = pageHeight
        scaleByWidth = pageWidth / srcW
        scaleByHeight = cursorY / srcH
        scale = Math.min(scaleByWidth, scaleByHeight)
      }

      const drawW = srcW * scale
      const drawH = srcH * scale
      const x = (pageWidth - drawW) / 2 // 居中

      currentPage.drawPage(embedded, {
        x,
        y: cursorY - drawH,
        width: drawW,
        height: drawH
      })
      cursorY -= drawH
    }
  }

  const bytes = await out.save()
  saveAs(new Blob([bytes], { type: 'application/pdf' }), outputName.value)
}
</script>
<style lang="scss" scoped>
.merge-pdf {
  padding: 16px;
}
.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}
.file-input input {
  display: none;
}
.file-input span {
  display: inline-block;
  padding: 8px 12px;
  background: #3b82f6;
  color: #fff;
  border-radius: 4px;
  cursor: pointer;
}
.options {
  display: flex;
  gap: 16px;
}
.actions button[disabled] {
  opacity: 0.5;
  cursor: not-allowed;
}
.file-list {
  margin-top: 8px;
}
</style>
