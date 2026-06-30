<template>
  <div class="canvas-area">
    <div class="canvas-toolbar">
      <span style="font-weight: 500">画布</span>
      <div class="zoom-ctrl">
        <button @click="store.zoomOut()">-</button>
        <span class="zoom-val">{{ Math.round(store.zoom * 100) }}%</span>
        <button @click="store.zoomIn()">+</button>
        <button class="zoom-reset" @click="store.zoomReset()">重置</button>
      </div>
      <span style="font-size: 12px; margin-left: 8px">组件: {{ store.components.length }}</span>
    </div>

    <div class="canvas-scroll" @dragover.prevent @drop="onDrop">
      <div
        class="canvas-paper"
        :style="{ transform: 'scale(' + store.zoom + ')' }"
        :class="{ dragging: store.isDragging }"
      >
        <div v-if="store.components.length === 0" class="canvas-empty">
          <svg viewBox="0 0 56 56" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="6" y="4" width="44" height="48" rx="4" />
            <path d="M18 18h20M18 26h16M18 34h12" />
          </svg>
          <p>从左侧拖入组件开始设计</p>
        </div>

        <div id="sort-container">
          <div
            v-for="(comp, index) in store.components"
            :key="comp.id"
            class="report-comp"
            :class="{ sel: store.selectedId === comp.id }"
            :data-id="comp.id"
            @click.stop="store.selectComp(comp.id)"
          >
            <div class="comp-actions">
              <button @click.stop="store.moveUp(index)" :disabled="index === 0" title="上移">&#9650;</button>
              <button @click.stop="store.moveDown(index)" :disabled="index === store.components.length - 1" title="下移">&#9660;</button>
              <button @click.stop="store.duplicateComp(comp.id)" title="复制">&#9112;</button>
              <button class="del" @click.stop="store.deleteComp(comp.id)" title="删除">&#10005;</button>
            </div>

            <!-- 标题 -->
            <div v-if="comp.type === 'heading'" class="ch" :style="compStyle(comp)">{{ (comp.props as any).text }}</div>

            <!-- 副标题 -->
            <div v-else-if="comp.type === 'subheading'" class="csh" :style="compStyle(comp)">{{ (comp.props as any).text }}</div>

            <!-- 正文 -->
            <div v-else-if="comp.type === 'text'" class="ct" :style="compStyle(comp)">{{ (comp.props as any).text }}</div>

            <!-- 分割线 -->
            <div v-else-if="comp.type === 'divider'" class="cd"><hr :style="dividerStyle(comp)" /></div>

            <!-- 图片 -->
            <div v-else-if="comp.type === 'image'" class="ci" :style="{ textAlign: (comp.style as any).align || 'center' }">
              <img
                v-if="(comp.props as any).src"
                :src="(comp.props as any).src"
                :style="{ width: (comp.props as any).width + '%', borderRadius: ((comp.style as any).radius || 8) + 'px' }"
              />
              <div v-else class="ph">{{ (comp.props as any).alt || '图片' }}</div>
            </div>

            <!-- 表格 -->
            <div v-else-if="comp.type === 'table'" class="ctable" :style="tableWrapStyle(comp)">
              <table :style="tableInlineStyle(comp)">
                <thead>
                  <tr>
                    <th
                      v-for="hdr in (comp.props as any).headers"
                      :key="hdr"
                      :style="thStyle(comp)"
                    >
                      {{ hdr }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(row, ri) in (comp.props as any).rows"
                    :key="ri"
                    :class="{ striped: (comp.style as any).striped !== false && ri % 2 === 1 }"
                    :style="rowStyle(comp, ri)"
                  >
                    <td v-for="(cell, ci) in row" :key="ci" :style="tdStyle(comp)">
                      {{ cell }}
                    </td>
                  </tr>
                </tbody>
              </table>
              <!-- API 数据源指示 -->
              <div v-if="tableDsType(comp) === 'api'" class="ds-badge">
                <span class="ds-dot"></span> 接口数据
                <span v-if="(comp.props as any).dataSource?.loading" class="ds-loading">加载中...</span>
                <span v-else-if="(comp.props as any).dataSource?.error" class="ds-err-badge">错误</span>
              </div>
            </div>

            <!-- 图表 -->
            <div v-else-if="comp.type === 'chart'" class="cc" :style="chartWrapStyle(comp)">
              <div class="ccont" :id="'chart-' + comp.id" :style="{ height: ((comp.style as any).chartHeight || 280) + 'px' }"></div>
              <!-- API 数据源指示 -->
              <div v-if="chartDsType(comp) === 'api'" class="ds-badge">
                <span class="ds-dot"></span> 接口数据
              </div>
            </div>

            <!-- 分页符 -->
            <div v-else-if="comp.type === 'pagebreak'" class="cpb">
              <div style="border: 1px dashed var(--accent); padding: 4px; text-align: center; font-size: 11px; color: var(--accent); border-radius: 4px">
                --- 分页符 ---
              </div>
            </div>

            <!-- 间距 -->
            <div v-else-if="comp.type === 'spacer'" class="csp">
              <div class="sp-block" :style="{ height: ((comp.props as any).height || 40) + 'px' }"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, nextTick, watch } from 'vue'
import Sortable from 'sortablejs'
import * as echarts from 'echarts'
import type { CompType, ReportComponent } from '../types'
import { useReportBuilderStore } from '../store'
import { textStyle, dividerStyle as dividerStyleFn, layoutCss } from '../utils'

const store = useReportBuilderStore()

// ── 样式计算 ──
function compStyle(comp: ReportComponent): Record<string, string> {
  const ts = textStyle(comp)
  const ls = layoutCss(comp.style as any)
  // 把 layoutCss 的值拆成对象
  const extra: Record<string, string> = {}
  if (ls) {
    ls.split(';').forEach((pair) => {
      const [k, v] = pair.split(':').map((s) => s.trim())
      if (k && v) extra[k] = v
    })
  }
  // 文本样式优先，布局样式补充
  return { ...ts, ...extra }
}

function tableWrapStyle(comp: ReportComponent): Record<string, string> {
  const s = comp.style as any
  return {
    paddingTop: (s.paddingTop || 8) + 'px',
    paddingRight: (s.paddingRight || 24) + 'px',
    paddingBottom: (s.paddingBottom || 8) + 'px',
    paddingLeft: (s.paddingLeft || 24) + 'px',
    marginTop: (s.marginTop || 0) + 'px',
    marginBottom: (s.marginBottom || 0) + 'px',
    borderRadius: (s.borderRadius || 0) + 'px',
    overflow: 'hidden',
  }
}

function tableInlineStyle(comp: ReportComponent): Record<string, string> {
  const s = comp.style as any
  return {
    fontSize: (s.tableFontSize || 13) + 'px',
  }
}

function thStyle(comp: ReportComponent): Record<string, string> {
  const s = comp.style as any
  return {
    background: s.thBg || '#4f6ef7',
    color: s.thColor || '#ffffff',
    borderColor: s.borderColor || '#e2e5ec',
    textAlign: s.headerAlign || 'center',
    padding: s.cellPadding || '8px 12px',
  }
}

function tdStyle(comp: ReportComponent): Record<string, string> {
  const s = comp.style as any
  return {
    borderColor: s.borderColor || '#e2e5ec',
    textAlign: s.cellAlign || 'left',
    padding: s.cellPadding || '8px 12px',
  }
}

function rowStyle(comp: ReportComponent, ri: number): Record<string, string> {
  const s = comp.style as any
  if (s.striped !== false && ri % 2 === 1) {
    return { background: s.stripeBg || '#f8f9fb' }
  }
  return {}
}

function chartWrapStyle(comp: ReportComponent): Record<string, string> {
  const s = comp.style as any
  return {
    paddingTop: (s.paddingTop || 12) + 'px',
    paddingRight: (s.paddingRight || 24) + 'px',
    paddingBottom: (s.paddingBottom || 12) + 'px',
    paddingLeft: (s.paddingLeft || 24) + 'px',
    background: s.chartBg || '#ffffff',
    borderRadius: (s.borderRadius || 0) + 'px',
  }
}

function tableDsType(comp: ReportComponent): string {
  return (comp.props as any).dataSource?.type || 'manual'
}

function chartDsType(comp: ReportComponent): string {
  return (comp.props as any).dataSource?.type || 'manual'
}

// ── 图表实例管理 ──
const chartInsts: Record<string, echarts.ECharts> = {}

function renderChart(comp: ReportComponent) {
  nextTick(() => {
    const el = document.getElementById('chart-' + comp.id)
    if (!el) {
      setTimeout(() => renderChart(comp), 100)
      return
    }
    try {
      if (chartInsts[comp.id]) chartInsts[comp.id].dispose()
      const chart = echarts.init(el)
      chartInsts[comp.id] = chart

      const p = comp.props as any
      const s = comp.style as any
      const chartType = p.chartType || 'bar'
      const title = p.title || ''
      const cats = (p._cats || '')
        .split(',')
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 0)
      const vals = (p._vals || '')
        .split(',')
        .map((s: string) => parseFloat(s.trim()))
        .filter((n: number) => !isNaN(n))

      const colors = ['#4f6ef7', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']
      const showLegend = s.showLegend !== false
      const legendPos = s.legendPosition || 'top'

      const opt: any = {
        title: { text: title, left: 'center', textStyle: { fontSize: 13, fontWeight: 600 } },
        tooltip: { trigger: 'axis' },
        color: colors,
        grid: { left: '8%', right: '8%', bottom: '12%', top: showLegend ? '20%' : '14%' },
      }

      if (showLegend) {
        opt.legend = {}
        if (legendPos === 'bottom') opt.legend.bottom = 0
        else if (legendPos === 'left') { opt.legend.left = 0; opt.legend.orient = 'vertical' }
        else if (legendPos === 'right') { opt.legend.right = 0; opt.legend.orient = 'vertical' }
        else opt.legend.top = 0
      }

      if (chartType === 'pie') {
        opt.tooltip = { trigger: 'item' }
        opt.series = [
          {
            type: 'pie',
            radius: '50%',
            center: ['50%', '55%'],
            data: cats.map((c: string, i: number) => ({ name: c, value: vals[i] || 0 })),
            label: { formatter: '{b}: {d}%' },
          },
        ]
      } else {
        opt.xAxis = { type: 'category', data: cats, axisLabel: { fontSize: 11 } }
        opt.yAxis = { type: 'value', axisLabel: { fontSize: 11 } }
        opt.series = [
          {
            type: chartType,
            data: vals,
            smooth: chartType === 'line',
            barWidth: chartType === 'bar' ? '40%' : undefined,
            areaStyle: chartType === 'line' ? { opacity: 0.12 } : undefined,
            itemStyle: chartType === 'bar' ? { borderRadius: [4, 4, 0, 0] } : {},
          },
        ]
      }
      chart.setOption(opt)
    } catch (e) {
      console.error('Chart render error:', e)
    }
  })
}

function renderAllCharts() {
  store.components.forEach((c) => {
    if (c.type === 'chart') renderChart(c)
  })
}

// 监听图表类型或数据变化时重新渲染
watch(
  () => store.selectedComp,
  (comp) => {
    if (comp && comp.type === 'chart') {
      nextTick(() => renderChart(comp))
    }
  },
  { deep: true }
)

// ── Sortable 排序 ──
let sortableInst: Sortable | null = null

function initSortable() {
  const el = document.getElementById('sort-container')
  if (!el) return
  if (sortableInst) sortableInst.destroy()
  sortableInst = new Sortable(el, {
    animation: 180,
    handle: '.report-comp',
    ghostClass: 'sortable-ghost',
    chosenClass: 'sortable-chosen',
    dragClass: 'sortable-drag',
    onEnd: (evt) => {
      if (evt.oldIndex === undefined || evt.newIndex === undefined) return
      if (evt.oldIndex === evt.newIndex) return
      store.reorderComponents(evt.oldIndex, evt.newIndex)
    },
  })
}

// ── 拖拽放入画布 ──
function onDrop(evt: DragEvent) {
  evt.preventDefault()
  store.setDragging(false)
  const type = evt.dataTransfer?.getData('text/plain') as CompType
  if (type) {
    store.addComp(type)
    nextTick(() => {
      initSortable()
      if (type === 'chart') {
        const last = store.components[store.components.length - 1]
        if (last) renderChart(last)
      }
    })
  }
}

// ── 获取图表图片数据（供导出使用） ──
function getChartImages(): Record<string, string> {
  const images: Record<string, string> = {}
  for (const comp of store.components) {
    if (comp.type === 'chart' && chartInsts[comp.id]) {
      try {
        images[comp.id] = chartInsts[comp.id].getDataURL({ pixelRatio: 2, backgroundColor: '#fff' })
      } catch (e) {
        console.error(e)
      }
    }
  }
  return images
}

// 暴露给父组件
defineExpose({ getChartImages, renderAllCharts })

onMounted(() => {
  store.initDemoData()
  nextTick(() => {
    initSortable()
    setTimeout(() => renderAllCharts(), 300)
  })
})
</script>

<style scoped>
.canvas-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--bg-ter);
  overflow: hidden;
}
.canvas-toolbar {
  height: 42px;
  background: var(--bg-pri);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  padding: 0 16px;
  gap: 12px;
  font-size: 13px;
  color: var(--txt-sec);
}
.zoom-ctrl {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
}
.zoom-ctrl button {
  width: 28px;
  height: 28px;
  border: 1px solid var(--border);
  background: var(--bg-pri);
  border-radius: var(--r-sm);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--txt-sec);
  font-size: 14px;
}
.zoom-ctrl button:hover {
  border-color: var(--accent);
  color: var(--accent);
}
.zoom-reset {
  width: auto !important;
  padding: 0 6px !important;
  font-size: 11px !important;
}
.zoom-val {
  font-weight: 500;
  min-width: 38px;
  text-align: center;
  font-size: 12px;
}
.canvas-scroll {
  flex: 1;
  overflow: auto;
  display: flex;
  justify-content: center;
  padding: 24px;
}
.canvas-paper {
  width: 794px;
  min-height: 1123px;
  background: var(--bg-pri);
  border-radius: var(--r-lg);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  transition: transform 0.2s ease;
  transform-origin: top center;
  position: relative;
}
.canvas-paper.dragging {
  outline: 2px dashed var(--accent);
  outline-offset: -2px;
}
.canvas-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 1123px;
  color: var(--txt-ter);
  gap: 12px;
}
.canvas-empty svg {
  width: 56px;
  height: 56px;
  opacity: 0.25;
}
.canvas-empty p {
  font-size: 14px;
}

/* 组件通用 */
.report-comp {
  position: relative;
  transition: all 0.15s;
  cursor: move;
  border: 1px solid transparent;
}
.report-comp:hover {
  border-color: var(--border);
}
.report-comp.sel {
  border-color: var(--accent) !important;
  background: var(--accent-lt);
}
.comp-actions {
  position: absolute;
  top: -13px;
  right: 6px;
  display: none;
  gap: 2px;
  background: var(--bg-pri);
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  padding: 2px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  z-index: 10;
}
.report-comp:hover .comp-actions,
.report-comp.sel .comp-actions {
  display: flex;
}
.comp-actions button {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--txt-sec);
  font-size: 12px;
}
.comp-actions button:hover {
  background: var(--bg-ter);
  color: var(--txt-pri);
}
.comp-actions .del:hover {
  background: rgba(239, 68, 68, 0.1);
  color: var(--err);
}

/* 各类型组件样式 */
.ch { font-size: 22px; font-weight: 700; line-height: 1.4; }
.csh { font-size: 16px; font-weight: 600; line-height: 1.4; }
.ct { font-size: 14px; line-height: 1.8; }
.cd { padding: 8px 24px; }
.cd hr { border: none; background: var(--border); height: 1px; }
.ci { text-align: center; }
.ci img { max-width: 100%; border-radius: 8px; }
.ci .ph {
  width: 100%;
  height: 140px;
  background: var(--bg-ter);
  border: 1px dashed var(--border);
  border-radius: var(--r-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--txt-ter);
  font-size: 12px;
}
.ctable table { width: 100%; border-collapse: collapse; }
.ctable th, .ctable td { border: 1px solid var(--border); }
.ctable th { font-weight: 600; }
.ctable tr.striped { background: var(--bg-ter); }
.ctable tr:hover { background: var(--accent-lt); }
.cc .ccont { width: 100%; border-radius: var(--r-sm); }
.cpb { padding: 6px 24px; }
.csp .sp-block {
  background: repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(79, 110, 247, 0.05) 5px, rgba(79, 110, 247, 0.05) 10px);
  border: 1px dashed var(--border);
  border-radius: var(--r-sm);
}

/* 数据源徽章 */
.ds-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  padding: 4px 10px;
  background: var(--accent-lt);
  border-radius: var(--r-sm);
  font-size: 11px;
  color: var(--accent);
}
.ds-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent);
  animation: pulse 2s infinite;
}
.ds-loading {
  color: var(--warn);
}
.ds-err-badge {
  color: var(--err);
  font-weight: 600;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

/* Sortable 样式 */
:global(.sortable-ghost) {
  opacity: 0.35;
  border: 2px dashed var(--accent) !important;
  border-radius: var(--r-sm);
}
:global(.sortable-chosen) {
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

@media print {
  .canvas-toolbar,
  .comp-actions {
    display: none !important;
  }
  .canvas-area {
    background: #fff;
  }
  .canvas-scroll {
    padding: 0;
  }
  .canvas-paper {
    box-shadow: none;
  }
  .report-comp {
    break-inside: avoid;
  }
}
</style>
