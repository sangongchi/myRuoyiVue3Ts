import { defineStore } from 'pinia'
import { ref, watch, nextTick } from 'vue'
import type { ReportComponent, CompType, ToastItem, DataSourceConfig } from './types'
import { makeComp, PALETTE } from './utils'
import { fetchApiData, normalizeTableData, normalizeChartData, createDefaultDataSource } from './api'

export const useReportBuilderStore = defineStore('reportBuilder', () => {
  // ── 核心状态 ──
  const components = ref<ReportComponent[]>([])
  const selectedId = ref<string | null>(null)
  const zoom = ref(1)
  const isDragging = ref(false)
  const previewVisible = ref(false)
  const previewHtml = ref('')
  const toasts = ref<ToastItem[]>([])

  // ── 临时编辑状态（表格/图表输入） ──
  const tmpTableHeaders = ref('')
  const tmpTableRows = ref('')
  const tmpChartCats = ref('')
  const tmpChartVals = ref('')

  // ── 选中的组件 ──
  const selectedComp = ref<ReportComponent | null>(null)

  watch(selectedId, (id) => {
    if (!id) { selectedComp.value = null; return }
    const c = components.value.find((x) => x.id === id) || null
    selectedComp.value = c
    if (c && c.type === 'table') {
      const p = c.props as any
      tmpTableHeaders.value = (p.headers || []).join(',')
      tmpTableRows.value = (p.rows || []).map((r: string[]) => r.join(',')).join(';\n')
    }
    if (c && c.type === 'chart') {
      const p = c.props as any
      tmpChartCats.value = p._cats || ''
      tmpChartVals.value = p._vals || ''
    }
  })

  // ── 历史记录（撤销/重做） ──
  const history = ref<string[]>([])
  const historyIdx = ref(-1)

  function saveHistory() {
    const state = JSON.stringify(components.value)
    history.value = history.value.slice(0, historyIdx.value + 1)
    history.value.push(state)
    historyIdx.value = history.value.length - 1
  }

  function undo() {
    if (historyIdx.value <= 0) return
    historyIdx.value--
    components.value = JSON.parse(history.value[historyIdx.value])
    selectedId.value = null
  }

  function redo() {
    if (historyIdx.value >= history.value.length - 1) return
    historyIdx.value++
    components.value = JSON.parse(history.value[historyIdx.value])
    selectedId.value = null
  }

  // ── Toast ──
  function toast(msg: string, type: ToastItem['type'] = 'i') {
    const id = Date.now()
    toasts.value.push({ id, message: msg, type })
    setTimeout(() => {
      toasts.value = toasts.value.filter((t) => t.id !== id)
    }, 3000)
  }

  // ── 组件操作 ──
  function addComp(type: CompType) {
    const c = makeComp(type)
    components.value.push(c)
    selectedId.value = c.id
    saveHistory()
    const item = PALETTE.find((x) => x.type === type)
    toast('已添加: ' + (item ? item.label : type), 's')
  }

  function selectComp(id: string) {
    selectedId.value = id
  }

  function deleteComp(id: string) {
    const idx = components.value.findIndex((c) => c.id === id)
    if (idx < 0) return
    components.value.splice(idx, 1)
    if (selectedId.value === id) selectedId.value = null
    saveHistory()
  }

  function duplicateComp(id: string) {
    const src = components.value.find((c) => c.id === id)
    if (!src) return
    const clone: ReportComponent = JSON.parse(JSON.stringify(src))
    clone.id = 'c' + Date.now() + '_' + Math.random().toString(36).substring(2, 8)
    const idx = components.value.findIndex((c) => c.id === id)
    components.value.splice(idx + 1, 0, clone)
    selectedId.value = clone.id
    saveHistory()
    toast('已复制组件', 's')
  }

  function moveUp(idx: number) {
    if (idx <= 0) return
    const arr = [...components.value]
    ;[arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]]
    components.value = arr
    saveHistory()
  }

  function moveDown(idx: number) {
    if (idx >= components.value.length - 1) return
    const arr = [...components.value]
    ;[arr[idx + 1], arr[idx]] = [arr[idx], arr[idx + 1]]
    components.value = arr
    saveHistory()
  }

  function reorderComponents(oldIndex: number, newIndex: number) {
    const arr = [...components.value]
    const item = arr.splice(oldIndex, 1)[0]
    arr.splice(newIndex, 0, item)
    components.value = arr
    saveHistory()
  }

  function clearAll() {
    if (components.value.length === 0) return
    components.value = []
    selectedId.value = null
    saveHistory()
    toast('画布已清空', 'i')
  }

  // ── Zoom ──
  function zoomIn() { zoom.value = Math.min(2, zoom.value + 0.1) }
  function zoomOut() { zoom.value = Math.max(0.3, zoom.value - 0.1) }
  function zoomReset() { zoom.value = 1 }

  // ── 拖拽状态 ──
  function setDragging(val: boolean) { isDragging.value = val }

  // ── 表格输入处理 ──
  function onTableHeadersInput(val: string) {
    tmpTableHeaders.value = val
    if (selectedComp.value) {
      ;(selectedComp.value.props as any).headers = val.split(',').map((s) => s.trim()).filter((s) => s.length > 0)
    }
  }

  function onTableRowsInput(val: string) {
    tmpTableRows.value = val
    if (selectedComp.value) {
      const cols = ((selectedComp.value.props as any).headers || []).length
      ;(selectedComp.value.props as any).rows = val
        .split(';')
        .map((line) => line.split(',').map((s) => s.trim()).slice(0, cols))
        .filter((r) => r.length > 0)
    }
  }

  // ── 图表输入处理 ──
  function onChartCatsInput(val: string) {
    tmpChartCats.value = val
    if (selectedComp.value) {
      ;(selectedComp.value.props as any)._cats = val
    }
  }

  function onChartValsInput(val: string) {
    tmpChartVals.value = val
    if (selectedComp.value) {
      ;(selectedComp.value.props as any)._vals = val
    }
  }

  // ── API 数据加载 ──
  async function fetchTableData(compId: string) {
    const comp = components.value.find((c) => c.id === compId)
    if (!comp || comp.type !== 'table') return

    const p = comp.props as any
    const ds: DataSourceConfig = p.dataSource || createDefaultDataSource('api')
    if (!ds.apiUrl) {
      toast('请先配置接口地址', 'e')
      return
    }

    ds.loading = true
    ds.error = ''
    try {
      const raw = await fetchApiData(ds)
      const { headers, rows } = normalizeTableData(raw)
      p.headers = headers
      p.rows = rows
      // 同步临时编辑状态
      if (selectedId.value === compId) {
        tmpTableHeaders.value = headers.join(',')
        tmpTableRows.value = rows.map((r: string[]) => r.join(',')).join(';\n')
      }
      ds.lastFetchAt = Date.now()
      toast('表格数据已加载', 's')
    } catch (e: any) {
      ds.error = e.message || '加载失败'
      toast('数据加载失败: ' + (e.message || '未知错误'), 'e')
    } finally {
      ds.loading = false
    }
  }

  async function fetchChartData(compId: string) {
    const comp = components.value.find((c) => c.id === compId)
    if (!comp || comp.type !== 'chart') return

    const p = comp.props as any
    const ds: DataSourceConfig = p.dataSource || createDefaultDataSource('api')
    if (!ds.apiUrl) {
      toast('请先配置接口地址', 'e')
      return
    }

    ds.loading = true
    ds.error = ''
    try {
      const raw = await fetchApiData(ds)
      const { categories, values } = normalizeChartData(raw)
      p._cats = categories.join(',')
      p._vals = values.join(',')
      // 同步临时编辑状态
      if (selectedId.value === compId) {
        tmpChartCats.value = p._cats
        tmpChartVals.value = p._vals
      }
      ds.lastFetchAt = Date.now()
      toast('图表数据已加载', 's')
    } catch (e: any) {
      ds.error = e.message || '加载失败'
      toast('数据加载失败: ' + (e.message || '未知错误'), 'e')
    } finally {
      ds.loading = false
    }
  }

  // ── 初始化示例数据 ──
  function initDemoData() {
    const a = makeComp('heading'); (a.props as any).text = '2026年度项目分析报告'; components.value.push(a)
    const b = makeComp('subheading'); (b.props as any).text = '一、项目概述'; components.value.push(b)
    const c = makeComp('text'); (c.props as any).text = '本报告对2026年度公司各项目进行了全面分析，涵盖项目进度、资源分配、财务状况及风险评估等核心维度。数据截至2026年6月，所有指标均经过财务部门审核确认。'; components.value.push(c)
    components.value.push(makeComp('divider'))
    const e = makeComp('subheading'); (e.props as any).text = '二、核心数据'; components.value.push(e)
    components.value.push(makeComp('table'))
    const g = makeComp('subheading'); (g.props as any).text = '三、趋势分析'; components.value.push(g)
    components.value.push(makeComp('chart'))
    components.value.push(makeComp('divider'))
    const j = makeComp('text'); (j.props as any).text = '综合以上分析，建议下一阶段重点关注项目B的交付风险，并适当增加研发资源投入。具体执行方案将在下次管理层会议中讨论确定。'; components.value.push(j)
    const k = makeComp('spacer'); (k.props as any).height = 20; components.value.push(k)
    const l = makeComp('text'); (l.props as any).text = '报告生成时间：2026年6月12日  |  编制部门：战略分析部'; (l.style as any).fontSize = 12; (l.style as any).color = '#8e94a8'; (l.style as any).align = 'center'; components.value.push(l)

    selectedId.value = null
    saveHistory()
  }

  return {
    components, selectedId, selectedComp, zoom, isDragging,
    previewVisible, previewHtml, toasts,
    tmpTableHeaders, tmpTableRows, tmpChartCats, tmpChartVals,
    history, historyIdx,
    // actions
    saveHistory, undo, redo, toast,
    addComp, selectComp, deleteComp, duplicateComp,
    moveUp, moveDown, reorderComponents, clearAll,
    zoomIn, zoomOut, zoomReset, setDragging,
    onTableHeadersInput, onTableRowsInput, onChartCatsInput, onChartValsInput,
    fetchTableData, fetchChartData,
    initDemoData,
  }
})
