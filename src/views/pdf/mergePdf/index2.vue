<template>
  <div class="pdf-container">
    <h2>PDF 内容提取</h2>

    <div class="controls">
      <label class="file-input">
        <input type="file" accept="application/pdf" @change="onFilesChange" />
        <span>选择 PDF 文件</span>
      </label>

      <div class="options">
        <label>
          <input type="checkbox" v-model="excludeHeaders" />
          排除页头
        </label>
        <label>
          <input type="checkbox" v-model="excludeFooters" />
          排除页脚
        </label>
        <label>
          <input type="checkbox" v-model="asRichText" />
          转换为富文本
        </label>
      </div>

      <el-button @click="extractContent" :disabled="!selectedFile || isProcessing">
        {{ isProcessing ? '处理中...' : '提取内容' }}
      </el-button>
    </div>

    <div class="content-display" v-if="extractedContent">
      <h3>提取的内容：</h3>
      <div class="content-preview" v-html="displayContent"></div>
    </div>

    <div class="debug-info" v-if="debugInfo">
      <h4>调试信息：</h4>
      <pre>{{ debugInfo }}</pre>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import * as pdfjsLib from 'pdfjs-dist'
// 设置 worker

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.mjs'

const selectedFile = ref<File | null>(null)
const extractedContent = ref<string>('')
const debugInfo = ref<string>('')
const isProcessing = ref(false)

const excludeHeaders = ref(false)
const excludeFooters = ref(false)
const asRichText = ref(false)
const styles = ref<any>({})

const displayContent = computed(() => {
  if (!extractedContent.value) return ''

  if (asRichText.value) {
    // 简单的富文本转换
    return extractedContent.value
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
  }

  return extractedContent.value.replace(/\n/g, '<br>')
})

function onFilesChange(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files || input.files.length === 0) return
  selectedFile.value = input.files[0]
  extractedContent.value = ''
  debugInfo.value = ''
}

async function extractContent() {
  if (!selectedFile.value) return

  isProcessing.value = true
  extractedContent.value = ''
  debugInfo.value = ''

  try {
    const arrayBuffer = await selectedFile.value.arrayBuffer()
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise
    console.log(pdf, 'pdf')

    let allContent = ''
    const pageInfo: any[] = []

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum)
      console.log('page', page)
      const textContent = await page.getTextContent()
      console.log('textContent', textContent)
      // styles.value = textContent.styles
      // for (const key in styles.value) {
      //   document.documentElement.style.setProperty(key, styles.value[key])
      // }

      const { width, height } = page.getViewport({ scale: 1 })
      const pageData = {
        pageNum,
        width,
        height,
        items: textContent.items,
        totalItems: textContent.items.length
      }

      pageInfo.push(pageData)

      // 过滤页头和页脚
      const filteredItems = filterHeaderFooter(textContent.items, width, height)

      // 提取文本内容
      const pageText = extractTextFromItems(filteredItems)
      // allContent += `\n--- 第 ${pageNum} 页 ---\n${pageText}\n`
      allContent += `\n${pageText}\n`
    }

    extractedContent.value = allContent.trim()
    debugInfo.value = JSON.stringify(pageInfo, null, 2)
  } catch (error) {
    console.error('PDF 处理错误:', error)
    extractedContent.value = `错误: ${error.message}`
  } finally {
    isProcessing.value = false
  }
}

function filterHeaderFooter(items: any[], pageWidth: number, pageHeight: number) {
  const headerThreshold = pageHeight * 0 // 顶部10%作为页头
  const footerThreshold = pageHeight * 0.9 // 底部10%作为页脚

  return items.filter(item => {
    if (!item.transform) return true

    const y = item.transform[5] // Y坐标

    if (excludeHeaders.value && y > headerThreshold) return false
    if (excludeFooters.value && y < footerThreshold) return false

    return true
  })
}

function extractTextFromItems(items: any[]) {
  let text = ''
  let lastY = -1

  items.forEach(item => {
    if (item.str) {
      // 如果Y坐标变化较大，添加换行
      if (lastY !== -1 && Math.abs(item.transform[5] - lastY) > 5) {
        text += '\n'
      }
      text += item.str + ' '
      lastY = item.transform[5]
    }
  })

  return text.trim()
}
</script>
<style lang="scss" scoped>
.pdf-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px;
  background: #f5f5f5;
  border-radius: 8px;
}

.file-input {
  display: flex;
  align-items: center;
  cursor: pointer;

  input[type='file'] {
    display: none;
  }

  span {
    padding: 8px 16px;
    background: #409eff;
    color: white;
    border-radius: 4px;
    transition: background-color 0.3s;

    &:hover {
      background: #66b1ff;
    }
  }
}

.options {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;

  label {
    display: flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;
  }
}

.content-display {
  margin-top: 20px;

  h3 {
    margin-bottom: 12px;
    color: #333;
  }
}

.content-preview {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 16px;
  min-height: 200px;
  max-height: 500px;
  overflow-y: auto;
  font-family: 'Courier New', monospace;
  line-height: 1.6;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.debug-info {
  margin-top: 20px;

  h4 {
    margin-bottom: 8px;
    color: #666;
  }

  pre {
    background: #f8f8f8;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 12px;
    font-size: 12px;
    max-height: 300px;
    overflow-y: auto;
  }
}

.el-button {
  margin-left: auto;
}
</style>
