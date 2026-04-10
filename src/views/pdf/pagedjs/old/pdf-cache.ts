/**
 * PDF 预览缓存管理器
 * 使用 IndexedDB 存储分页后的 HTML，避免重复渲染
 */

interface CachedPDF {
  id: string
  html: string // 渲染后的完整 HTML（包含 Paged.js 生成的分页结构）
  cssHash: string
  timestamp: number
  totalPages: number
}

class PDFCacheManager {
  private dbName = 'PDFPreviewCache'
  private storeName = 'previews'
  private db: IDBDatabase | null = null
  private maxCacheSize = 50 // 最大缓存数量
  private cacheTTL = 24 * 60 * 60 * 1000 // 缓存有效期 24 小时

  /**
   * 初始化数据库
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' })
          store.createIndex('timestamp', 'timestamp', { unique: false })
        }
      }
    })
  }

  /**
   * 生成缓存键（基于内容和 CSS 的哈希）
   */
  generateCacheKey(html: string, cssContent: string): string {
    const content = html + cssContent
    let hash = 0
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return `pdf_${Math.abs(hash).toString(16)}`
  }

  /**
   * 获取缓存
   */
  async get(cacheKey: string): Promise<CachedPDF | null> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.get(cacheKey)

      request.onsuccess = () => {
        const cached = request.result
        if (cached) {
          // 检查是否过期
          if (Date.now() - cached.timestamp > this.cacheTTL) {
            this.delete(cacheKey) // 删除过期缓存
            resolve(null)
          } else {
            console.log('[PDF Cache] 命中缓存:', cacheKey)
            resolve(cached)
          }
        } else {
          resolve(null)
        }
      }

      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 设置缓存
   */
  async set(cacheKey: string, html: string, cssHash: string, totalPages: number): Promise<void> {
    if (!this.db) await this.init()

    const cached: CachedPDF = {
      id: cacheKey,
      html,
      cssHash,
      timestamp: Date.now(),
      totalPages
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.put(cached)

      request.onsuccess = async () => {
        console.log('[PDF Cache] 缓存已保存:', cacheKey)
        await this.cleanup() // 清理旧缓存
        resolve()
      }

      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 删除缓存
   */
  async delete(cacheKey: string): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.delete(cacheKey)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 清理过期和超出数量的缓存
   */
  async cleanup(): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const index = store.index('timestamp')
      const request = index.getAll()

      request.onsuccess = () => {
        const items: CachedPDF[] = request.result
        
        // 按时间戳排序
        items.sort((a, b) => a.timestamp - b.timestamp)

        // 删除过期和超出的缓存
        const now = Date.now()
        const toDelete = items.filter(item => 
          now - item.timestamp > this.cacheTTL
        )

        // 如果缓存数量超过限制，删除最旧的
        if (items.length > this.maxCacheSize) {
          const excessCount = items.length - this.maxCacheSize
          toDelete.push(...items.slice(0, excessCount))
        }

        // 执行删除
        toDelete.forEach(item => {
          store.delete(item.id)
        })

        if (toDelete.length > 0) {
          console.log('[PDF Cache] 清理了', toDelete.length, '个过期/多余缓存')
        }

        resolve()
      }

      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 清空所有缓存
   */
  async clear(): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.clear()

      request.onsuccess = () => {
        console.log('[PDF Cache] 所有缓存已清空')
        resolve()
      }

      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 获取缓存统计信息
   */
  async getStats(): Promise<{ count: number; size: number }> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.count()

      request.onsuccess = () => {
        resolve({
          count: request.result,
          size: 0 // IndexedDB 不直接提供大小，需要估算
        })
      }

      request.onerror = () => reject(request.error)
    })
  }
}

// 导出单例
export const pdfCacheManager = new PDFCacheManager()
