import { AxiosRequestConfig } from 'axios'
export function cancelRequestFun() {
  let penddingRequestMap: any = {}

  const addRequest = (key: string) => {
    cancelRequest(key)
    const controller = new AbortController()
    penddingRequestMap[key] = controller
    return controller.signal
  }

  const cancelRequest = (key: string) => {
    if (penddingRequestMap[key]) {
      penddingRequestMap[key].abort()
      delete penddingRequestMap[key]
    }
  }

  return { penddingRequestMap, addRequest, cancelRequest }
}

function stableStringify(obj: any) {
  if (!obj) return ''
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      return Object.keys(value)
        .sort()
        .reduce((sorted: any, key) => {
          sorted[key] = value[key]
          return sorted
        }, {})
    }
    return value
  })
}

// 生成短哈希
function objectToShortHash(str: string) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0 // 转换为32位整数
  }
  return hash.toString(36).padStart(7, '0').slice(-7)
}

// 将请求url结合params、以及data的数据生成唯一key用于标识取消的请求
export function getReuquetstr({ url, params, data }: AxiosRequestConfig) {
  try {
    const paramsStr = objectToShortHash(stableStringify(params) + stableStringify(data))
    const key = `${url}--${paramsStr}`
    return key
  } catch (e) {
    console.warn('转换请求key出错', e)
    return url||''
  }
}
