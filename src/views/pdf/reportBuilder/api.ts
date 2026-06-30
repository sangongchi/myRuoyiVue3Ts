/**
 * 报告生成器 — API 服务层
 * 封装表格/图表的后端数据获取逻辑
 */
import request from '@/utils/request'
import type { DataSourceConfig } from './types'

/**
 * 从嵌套对象中按路径取值
 * @example getNestedValue({ data: { list: [1,2] } }, 'data.list') => [1,2]
 */
function getNestedValue(obj: any, path: string): any {
  if (!path) return obj
  return path.split('.').reduce((acc, key) => {
    if (acc == null) return undefined
    return acc[key]
  }, obj)
}

/**
 * 从接口获取数据
 * @param config 数据源配置
 * @returns 解析后的数据
 */
export async function fetchApiData(config: DataSourceConfig): Promise<any> {
  if (!config.apiUrl) {
    throw new Error('未配置接口地址')
  }

  const response = await request({
    url: config.apiUrl,
    method: config.apiMethod || 'GET',
    [config.apiMethod === 'POST' ? 'data' : 'params']: config.apiParams || {},
  })

  // 若依统一响应格式：{ code: 200, msg: '...', data: {...} }
  const resData = response?.data ?? response

  // 按路径提取数据
  if (config.apiDataPath) {
    return getNestedValue(resData, config.apiDataPath)
  }

  return resData
}

/**
 * 将接口返回的表格数据转为 { headers, rows } 格式
 * 支持两种常见后端结构:
 *  1. { headers: ['列1','列2'], rows: [['v1','v2'],...] }
 *  2. [{ col1: 'v1', col2: 'v2' }, ...] → 自动推导 headers
 */
export function normalizeTableData(raw: any): { headers: string[]; rows: string[][] } {
  if (!raw) return { headers: [], rows: [] }

  // 结构1：已有 headers + rows
  if (raw.headers && raw.rows) {
    return {
      headers: raw.headers.map(String),
      rows: raw.rows.map((r: any[]) => r.map(String)),
    }
  }

  // 结构2：对象数组
  if (Array.isArray(raw) && raw.length > 0 && typeof raw[0] === 'object') {
    const headers = Object.keys(raw[0])
    const rows = raw.map((item: Record<string, any>) => headers.map((h) => String(item[h] ?? '')))
    return { headers, rows }
  }

  // 结构3：二维数组
  if (Array.isArray(raw) && Array.isArray(raw[0])) {
    const [headerRow, ...dataRows] = raw
    return {
      headers: headerRow.map(String),
      rows: dataRows.map((r: any[]) => r.map(String)),
    }
  }

  return { headers: [], rows: [] }
}

/**
 * 将接口返回的图表数据转为 { categories, values } 格式
 * 支持多种结构:
 *  1. { categories: ['Q1','Q2'], values: [120, 200] }
 *  2. [{ name: 'Q1', value: 120 }, ...]
 *  3. { xAxis: ['Q1','Q2'], series: [120, 200] }
 */
export function normalizeChartData(raw: any): { categories: string[]; values: number[] } {
  if (!raw) return { categories: [], values: [] }

  // 结构1
  if (raw.categories && raw.values) {
    return {
      categories: raw.categories.map(String),
      values: raw.values.map(Number),
    }
  }

  // 结构3
  if (raw.xAxis && raw.series) {
    return {
      categories: raw.xAxis.map(String),
      values: raw.series.map(Number),
    }
  }

  // 结构2：对象数组
  if (Array.isArray(raw) && raw.length > 0 && typeof raw[0] === 'object') {
    const nameKey = raw[0].name !== undefined ? 'name' : Object.keys(raw[0])[0]
    const valKey = raw[0].value !== undefined ? 'value' : Object.keys(raw[0]).find((k) => k !== nameKey) || 'value'
    return {
      categories: raw.map((item: any) => String(item[nameKey] ?? '')),
      values: raw.map((item: any) => Number(item[valKey] ?? 0)),
    }
  }

  return { categories: [], values: [] }
}

/**
 * 创建默认数据源配置
 */
export function createDefaultDataSource(type: 'manual' | 'api' = 'manual'): DataSourceConfig {
  return {
    type,
    apiUrl: '',
    apiMethod: 'GET',
    apiParams: {},
    apiDataPath: '',
    refreshInterval: 0,
    lastFetchAt: 0,
    loading: false,
    error: '',
  }
}
