<template>
  <div>
    <VivliostylePreview :document-content="htmlContent" :page-size="{ width: '148mm', height: '210mm' }" />
  </div>
</template>

<script setup>
import VivliostylePreview from './components/VivliostylePreview.vue'

// 示例HTML内容（可替换为API获取）
const htmlContent = ref(`
  <html>
  <head>
    <style>
      @page { size: A5; margin: 1cm; }
      body { font-family: 'Segoe UI', sans-serif; }
      h1 { break-before: page; }
    </style>
  </head>
  <body>
    ${Array.from(
      { length: 5 },
      (_, i) => `
      <h1>章节 ${i + 1}</h1>
      <p>${'这是示例段落内容 '.repeat(30)}</p>
    `
    ).join('')}
  </body>
  </html>
`)


</script>
