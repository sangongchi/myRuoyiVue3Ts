/* Paged.js Web Worker - 处理分页计算 */

import * as Paged from 'pagedjs'

// 接收主线程消息
self.onmessage = async (e) => {
  const { html, cssContent, id } = e.data
  
  try {
    console.log('[Worker] 开始分页计算...')
    
    // 创建 Previewer
    const previewer = new Paged.Previewer()
    
    // 创建临时 DOM
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = html
    
    // 创建 Blob URL for CSS
    const cssBlob = new Blob([cssContent], { type: 'text/css' })
    const cssUrl = URL.createObjectURL(cssBlob)
    
    // 执行分页
    const flow = await previewer.preview(
      tempDiv.firstElementChild,
      [cssUrl],
      null // Worker 中不需要容器
    )
    
    console.log('[Worker] 分页计算完成，总页数:', flow.total)
    
    // 提取分页后的 HTML
    const pagedHTML = tempDiv.innerHTML
    
    // 清理
    URL.revokeObjectURL(cssUrl)
    
    // 发送结果回主线程
    self.postMessage({
      id,
      success: true,
      html: pagedHTML,
      totalPages: flow.total
    })
    
  } catch (error) {
    console.error('[Worker] 分页计算失败:', error)
    self.postMessage({
      id,
      success: false,
      error: error.message
    })
  }
}
