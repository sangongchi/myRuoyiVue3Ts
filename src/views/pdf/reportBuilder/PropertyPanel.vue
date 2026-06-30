<template>
  <div class="props">
    <div class="props-header">属性面板</div>

    <div class="props-body" v-if="store.selectedComp">
      <!-- ═══════════ 通用布局配置（所有组件都有） ═══════════ -->
      <div class="pgroup">
        <div class="pgroup-t" @click="toggleSection('layout')">
          布局与间距
          <span class="toggle-icon">{{ expandedSections.layout ? '▾' : '▸' }}</span>
        </div>
        <div v-show="expandedSections.layout" class="pgroup-body">
          <!-- 四向 padding -->
          <div class="pfield">
            <label>内边距 Padding</label>
            <div class="quad-input">
              <div class="quad-item">
                <span class="quad-label">上</span>
                <input type="number" v-model.number="(store.selectedComp.style as any).paddingTop" min="0" max="100" />
              </div>
              <div class="quad-item">
                <span class="quad-label">右</span>
                <input type="number" v-model.number="(store.selectedComp.style as any).paddingRight" min="0" max="100" />
              </div>
              <div class="quad-item">
                <span class="quad-label">下</span>
                <input type="number" v-model.number="(store.selectedComp.style as any).paddingBottom" min="0" max="100" />
              </div>
              <div class="quad-item">
                <span class="quad-label">左</span>
                <input type="number" v-model.number="(store.selectedComp.style as any).paddingLeft" min="0" max="100" />
              </div>
            </div>
          </div>
          <!-- 四向 margin -->
          <div class="pfield">
            <label>外边距 Margin</label>
            <div class="quad-input">
              <div class="quad-item">
                <span class="quad-label">上</span>
                <input type="number" v-model.number="(store.selectedComp.style as any).marginTop" min="0" max="100" />
              </div>
              <div class="quad-item">
                <span class="quad-label">右</span>
                <input type="number" v-model.number="(store.selectedComp.style as any).marginRight" min="0" max="100" />
              </div>
              <div class="quad-item">
                <span class="quad-label">下</span>
                <input type="number" v-model.number="(store.selectedComp.style as any).marginBottom" min="0" max="100" />
              </div>
              <div class="quad-item">
                <span class="quad-label">左</span>
                <input type="number" v-model.number="(store.selectedComp.style as any).marginLeft" min="0" max="100" />
              </div>
            </div>
          </div>
          <!-- 边框与圆角 -->
          <div class="prow">
            <div class="pfield">
              <label>圆角 (px)</label>
              <input type="number" v-model.number="(store.selectedComp.style as any).borderRadius" min="0" max="50" />
            </div>
            <div class="pfield">
              <label>边框宽度</label>
              <input type="number" v-model.number="(store.selectedComp.style as any).borderWidth" min="0" max="6" />
            </div>
          </div>
          <div class="prow" v-if="(store.selectedComp.style as any).borderWidth > 0">
            <div class="pfield">
              <label>边框样式</label>
              <select v-model="(store.selectedComp.style as any).borderStyle">
                <option value="none">无</option>
                <option value="solid">实线</option>
                <option value="dashed">虚线</option>
                <option value="dotted">点线</option>
              </select>
            </div>
            <div class="pfield">
              <label>边框颜色</label>
              <input type="color" v-model="(store.selectedComp.style as any).borderColor" />
            </div>
          </div>
          <!-- 背景 -->
          <div class="prow">
            <div class="pfield">
              <label>背景色</label>
              <div class="color-field">
                <input type="color" v-model="(store.selectedComp.style as any).background" />
                <input type="text" v-model="(store.selectedComp.style as any).background" class="color-text" placeholder="transparent" />
              </div>
            </div>
          </div>
          <!-- 阴影 -->
          <div class="pfield">
            <label>盒阴影</label>
            <select v-model="(store.selectedComp.style as any).boxShadow">
              <option value="none">无</option>
              <option value="0 2px 8px rgba(0,0,0,0.06)">轻微</option>
              <option value="0 4px 16px rgba(0,0,0,0.1)">中等</option>
              <option value="0 8px 30px rgba(0,0,0,0.15)">较重</option>
              <option value="0 0 0 2px rgba(79,110,247,0.2)">蓝色轮廓</option>
            </select>
          </div>
        </div>
      </div>

      <!-- ═══════════ 文本类组件 ═══════════ -->
      <div class="pgroup" v-if="isTextType">
        <div class="pgroup-t" @click="toggleSection('text')">
          {{ textLabel }}
          <span class="toggle-icon">{{ expandedSections.text ? '▾' : '▸' }}</span>
        </div>
        <div v-show="expandedSections.text" class="pgroup-body">
          <div class="pfield">
            <label>内容</label>
            <textarea v-model="(store.selectedComp.props as any).text" rows="3"></textarea>
          </div>
          <div class="pfield">
            <label>字体大小 (px)</label>
            <input type="number" v-model.number="(store.selectedComp.style as any).fontSize" min="10" max="72" />
          </div>
          <div class="pfield">
            <label>字体粗细</label>
            <select v-model="(store.selectedComp.style as any).fontWeight">
              <option value="300">Light (300)</option>
              <option value="400">Regular (400)</option>
              <option value="500">Medium (500)</option>
              <option value="600">SemiBold (600)</option>
              <option value="700">Bold (700)</option>
            </select>
          </div>
          <div class="prow">
            <div class="pfield">
              <label>文字颜色</label>
              <input type="color" v-model="(store.selectedComp.style as any).color" />
            </div>
            <div class="pfield">
              <label>对齐方式</label>
              <select v-model="(store.selectedComp.style as any).align">
                <option value="left">左对齐</option>
                <option value="center">居中</option>
                <option value="right">右对齐</option>
              </select>
            </div>
          </div>
          <div class="prow">
            <div class="pfield">
              <label>行高</label>
              <input type="number" v-model.number="(store.selectedComp.style as any).lineHeight" min="1" max="3" step="0.1" />
            </div>
            <div class="pfield">
              <label>字间距 (px)</label>
              <input type="number" v-model.number="(store.selectedComp.style as any).letterSpacing" min="0" max="10" step="0.5" />
            </div>
          </div>
          <div class="pfield">
            <label>文字装饰</label>
            <select v-model="(store.selectedComp.style as any).textDecoration">
              <option value="none">无</option>
              <option value="underline">下划线</option>
              <option value="line-through">删除线</option>
              <option value="overline">上划线</option>
            </select>
          </div>
        </div>
      </div>

      <!-- ═══════════ 分割线 ═══════════ -->
      <div class="pgroup" v-if="store.selectedComp.type === 'divider'">
        <div class="pgroup-t" @click="toggleSection('divider')">
          分割线
          <span class="toggle-icon">{{ expandedSections.divider ? '▾' : '▸' }}</span>
        </div>
        <div v-show="expandedSections.divider" class="pgroup-body">
          <div class="pfield">
            <label>线条样式</label>
            <select v-model="(store.selectedComp.style as any).borderStyle">
              <option value="solid">实线</option>
              <option value="dashed">虚线</option>
              <option value="dotted">点线</option>
              <option value="double">双线</option>
            </select>
          </div>
          <div class="prow">
            <div class="pfield">
              <label>粗细 (px)</label>
              <input type="number" v-model.number="(store.selectedComp.style as any).height" min="1" max="6" />
            </div>
            <div class="pfield">
              <label>颜色</label>
              <input type="color" v-model="(store.selectedComp.style as any).color" />
            </div>
          </div>
        </div>
      </div>

      <!-- ═══════════ 图片 ═══════════ -->
      <div class="pgroup" v-if="store.selectedComp.type === 'image'">
        <div class="pgroup-t" @click="toggleSection('image')">
          图片设置
          <span class="toggle-icon">{{ expandedSections.image ? '▾' : '▸' }}</span>
        </div>
        <div v-show="expandedSections.image" class="pgroup-body">
          <div class="pfield">
            <label>图片链接</label>
            <input type="text" v-model="(store.selectedComp.props as any).src" placeholder="https://..." />
          </div>
          <div class="pfield">
            <label>替代文字</label>
            <input type="text" v-model="(store.selectedComp.props as any).alt" />
          </div>
          <div class="prow">
            <div class="pfield">
              <label>宽度 (%)</label>
              <input type="number" v-model.number="(store.selectedComp.props as any).width" min="10" max="100" />
            </div>
            <div class="pfield">
              <label>圆角 (px)</label>
              <input type="number" v-model.number="(store.selectedComp.style as any).radius" min="0" max="30" />
            </div>
          </div>
          <div class="pfield">
            <label>对齐</label>
            <select v-model="(store.selectedComp.style as any).align">
              <option value="left">左</option>
              <option value="center">中</option>
              <option value="right">右</option>
            </select>
          </div>
        </div>
      </div>

      <!-- ═══════════ 表格 ═══════════ -->
      <template v-if="store.selectedComp.type === 'table'">
        <div class="pgroup">
          <div class="pgroup-t" @click="toggleSection('tableData')">
            表格数据
            <span class="toggle-icon">{{ expandedSections.tableData ? '▾' : '▸' }}</span>
          </div>
          <div v-show="expandedSections.tableData" class="pgroup-body">
            <!-- 数据源切换 -->
            <div class="pfield">
              <label>数据来源</label>
              <div class="ds-tabs">
                <button
                  :class="['ds-tab', { active: dsType === 'manual' }]"
                  @click="setDataSourceType('manual')"
                >手动输入</button>
                <button
                  :class="['ds-tab', { active: dsType === 'api' }]"
                  @click="setDataSourceType('api')"
                >接口获取</button>
              </div>
            </div>

            <!-- 手动输入模式 -->
            <template v-if="dsType === 'manual'">
              <div class="pfield">
                <label>表头（逗号分隔）</label>
                <input type="text" :value="store.tmpTableHeaders" @input="store.onTableHeadersInput(($event.target as HTMLInputElement).value)" />
              </div>
              <div class="pfield">
                <label>数据行（逗号分隔列，分号分隔行）</label>
                <textarea :value="store.tmpTableRows" @input="store.onTableRowsInput(($event.target as HTMLTextAreaElement).value)" rows="5"></textarea>
              </div>
            </template>

            <!-- API 接口模式 -->
            <template v-if="dsType === 'api'">
              <div class="pfield">
                <label>接口地址</label>
                <input type="text" v-model="dsApiUrl" placeholder="/api/report/table" />
              </div>
              <div class="pfield">
                <label>请求方法</label>
                <select v-model="dsApiMethod">
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                </select>
              </div>
              <div class="pfield">
                <label>请求参数 (JSON)</label>
                <textarea v-model="dsApiParamsText" rows="3" placeholder='{"type": "monthly"}'></textarea>
              </div>
              <div class="pfield">
                <label>数据路径</label>
                <input type="text" v-model="dsApiDataPath" placeholder="data.rows / data.list" />
              </div>
              <div class="prow">
                <div class="pfield">
                  <label>自动刷新 (秒)</label>
                  <input type="number" v-model.number="dsRefreshInterval" min="0" max="3600" />
                </div>
              </div>
              <el-button
                type="primary"
                size="small"
                style="width: 100%; margin-top: 4px"
                :loading="dsLoading"
                @click="handleFetchTableData"
              >
                {{ dsLoading ? '加载中...' : '获取数据' }}
              </el-button>
              <div v-if="dsError" class="ds-error">{{ dsError }}</div>
              <div v-if="dsLastFetchAt" class="ds-info">上次加载: {{ new Date(dsLastFetchAt).toLocaleTimeString() }}</div>
            </template>
          </div>
        </div>

        <!-- 表格样式 -->
        <div class="pgroup">
          <div class="pgroup-t" @click="toggleSection('tableStyle')">
            表格样式
            <span class="toggle-icon">{{ expandedSections.tableStyle ? '▾' : '▸' }}</span>
          </div>
          <div v-show="expandedSections.tableStyle" class="pgroup-body">
            <div class="prow">
              <div class="pfield">
                <label>字号 (px)</label>
                <input type="number" v-model.number="(store.selectedComp.style as any).tableFontSize" min="10" max="24" />
              </div>
              <div class="pfield">
                <label>单元格内距</label>
                <input type="text" v-model="(store.selectedComp.style as any).cellPadding" placeholder="8px 12px" />
              </div>
            </div>
            <div class="prow">
              <div class="pfield">
                <label>表头背景</label>
                <input type="color" v-model="(store.selectedComp.style as any).thBg" />
              </div>
              <div class="pfield">
                <label>表头文字</label>
                <input type="color" v-model="(store.selectedComp.style as any).thColor" />
              </div>
            </div>
            <div class="prow">
              <div class="pfield">
                <label>边框颜色</label>
                <input type="color" v-model="(store.selectedComp.style as any).borderColor" />
              </div>
              <div class="pfield">
                <label>斑马纹背景</label>
                <input type="color" v-model="(store.selectedComp.style as any).stripeBg" />
              </div>
            </div>
            <div class="prow">
              <div class="pfield">
                <label>表头对齐</label>
                <select v-model="(store.selectedComp.style as any).headerAlign">
                  <option value="left">左</option>
                  <option value="center">中</option>
                  <option value="right">右</option>
                </select>
              </div>
              <div class="pfield">
                <label>单元格对齐</label>
                <select v-model="(store.selectedComp.style as any).cellAlign">
                  <option value="left">左</option>
                  <option value="center">中</option>
                  <option value="right">右</option>
                </select>
              </div>
            </div>
            <div class="pfield">
              <label>功能</label>
              <div class="check-row">
                <label class="check-label">
                  <input type="checkbox" v-model="(store.selectedComp.style as any).striped" /> 斑马纹
                </label>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- ═══════════ 图表 ═══════════ -->
      <template v-if="store.selectedComp.type === 'chart'">
        <div class="pgroup">
          <div class="pgroup-t" @click="toggleSection('chartConfig')">
            图表设置
            <span class="toggle-icon">{{ expandedSections.chartConfig ? '▾' : '▸' }}</span>
          </div>
          <div v-show="expandedSections.chartConfig" class="pgroup-body">
            <div class="prow">
              <div class="pfield">
                <label>图表类型</label>
                <select v-model="(store.selectedComp.props as any).chartType">
                  <option value="bar">柱状图</option>
                  <option value="line">折线图</option>
                  <option value="pie">饼图</option>
                </select>
              </div>
              <div class="pfield">
                <label>图表高度 (px)</label>
                <input type="number" v-model.number="(store.selectedComp.style as any).chartHeight" min="150" max="600" />
              </div>
            </div>
            <div class="pfield">
              <label>图表标题</label>
              <input type="text" v-model="(store.selectedComp.props as any).title" />
            </div>
            <div class="prow">
              <div class="pfield">
                <label>显示图例</label>
                <select v-model="(store.selectedComp.style as any).showLegend">
                  <option :value="true">显示</option>
                  <option :value="false">隐藏</option>
                </select>
              </div>
              <div class="pfield">
                <label>图例位置</label>
                <select v-model="(store.selectedComp.style as any).legendPosition">
                  <option value="top">上</option>
                  <option value="bottom">下</option>
                  <option value="left">左</option>
                  <option value="right">右</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- 图表数据源 -->
        <div class="pgroup">
          <div class="pgroup-t" @click="toggleSection('chartData')">
            图表数据
            <span class="toggle-icon">{{ expandedSections.chartData ? '▾' : '▸' }}</span>
          </div>
          <div v-show="expandedSections.chartData" class="pgroup-body">
            <!-- 数据源切换 -->
            <div class="pfield">
              <label>数据来源</label>
              <div class="ds-tabs">
                <button
                  :class="['ds-tab', { active: chartDsType === 'manual' }]"
                  @click="setChartDataSourceType('manual')"
                >手动输入</button>
                <button
                  :class="['ds-tab', { active: chartDsType === 'api' }]"
                  @click="setChartDataSourceType('api')"
                >接口获取</button>
              </div>
            </div>

            <!-- 手动输入 -->
            <template v-if="chartDsType === 'manual'">
              <div class="pfield">
                <label>分类（逗号分隔）</label>
                <input type="text" :value="store.tmpChartCats" @input="store.onChartCatsInput(($event.target as HTMLInputElement).value)" />
              </div>
              <div class="pfield">
                <label>数值（逗号分隔）</label>
                <input type="text" :value="store.tmpChartVals" @input="store.onChartValsInput(($event.target as HTMLInputElement).value)" />
              </div>
            </template>

            <!-- API 模式 -->
            <template v-if="chartDsType === 'api'">
              <div class="pfield">
                <label>接口地址</label>
                <input type="text" v-model="chartDsApiUrl" placeholder="/api/report/chart" />
              </div>
              <div class="pfield">
                <label>请求方法</label>
                <select v-model="chartDsApiMethod">
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                </select>
              </div>
              <div class="pfield">
                <label>请求参数 (JSON)</label>
                <textarea v-model="chartDsApiParamsText" rows="3" placeholder='{"year": 2026}'></textarea>
              </div>
              <div class="pfield">
                <label>数据路径</label>
                <input type="text" v-model="chartDsApiDataPath" placeholder="data.categories / data.list" />
              </div>
              <el-button
                type="primary"
                size="small"
                style="width: 100%; margin-top: 4px"
                :loading="chartDsLoading"
                @click="handleFetchChartData"
              >
                {{ chartDsLoading ? '加载中...' : '获取数据' }}
              </el-button>
              <div v-if="chartDsError" class="ds-error">{{ chartDsError }}</div>
            </template>
          </div>
        </div>
      </template>

      <!-- ═══════════ 间距 ═══════════ -->
      <div class="pgroup" v-if="store.selectedComp.type === 'spacer'">
        <div class="pgroup-t">间距</div>
        <div class="pgroup-body">
          <div class="pfield">
            <label>高度 (px)</label>
            <input type="number" v-model.number="(store.selectedComp.props as any).height" min="4" max="200" />
          </div>
        </div>
      </div>

      <!-- 删除按钮 -->
      <div style="margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--border)">
        <el-button type="danger" style="width: 100%" @click="store.deleteComp(store.selectedComp!.id)">删除此组件</el-button>
      </div>
    </div>

    <!-- 未选中 -->
    <div v-else class="no-sel">
      <svg viewBox="0 0 44 44" fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="4" y="4" width="36" height="36" rx="4" />
        <path d="M14 18h16M14 26h12" />
      </svg>
      <p>点击画布组件<br />编辑其属性</p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, reactive, watch } from 'vue'
import { useReportBuilderStore } from '../store'
import { createDefaultDataSource } from '../api'
import type { DataSourceConfig } from '../types'

const store = useReportBuilderStore()

// ── 折叠面板状态 ──
const expandedSections = reactive<Record<string, boolean>>({
  layout: false,
  text: true,
  divider: true,
  image: true,
  tableData: true,
  tableStyle: true,
  chartConfig: true,
  chartData: true,
})

function toggleSection(key: string) {
  expandedSections[key] = !expandedSections[key]
}

// ── 文本类判断 ──
const isTextType = computed(() => {
  const t = store.selectedComp?.type
  return t === 'heading' || t === 'subheading' || t === 'text'
})

const textLabel = computed(() => {
  const t = store.selectedComp?.type
  if (t === 'heading') return '标题'
  if (t === 'subheading') return '副标题'
  return '正文'
})

// ═══════════ 表格数据源 ═══════════
const dsType = computed({
  get: () => getTableDs().type || 'manual',
  set: (v) => { if (store.selectedComp) (store.selectedComp.props as any).dataSource.type = v },
})

const dsApiUrl = computed({
  get: () => getTableDs().apiUrl || '',
  set: (v) => { if (store.selectedComp) (store.selectedComp.props as any).dataSource.apiUrl = v },
})

const dsApiMethod = computed({
  get: () => getTableDs().apiMethod || 'GET',
  set: (v) => { if (store.selectedComp) (store.selectedComp.props as any).dataSource.apiMethod = v },
})

const dsApiParamsText = computed({
  get: () => {
    const p = getTableDs().apiParams
    return p && Object.keys(p).length > 0 ? JSON.stringify(p, null, 2) : ''
  },
  set: (v) => {
    if (!store.selectedComp) return
    try {
      ;(store.selectedComp.props as any).dataSource.apiParams = v ? JSON.parse(v) : {}
    } catch { /* ignore parse errors while typing */ }
  },
})

const dsApiDataPath = computed({
  get: () => getTableDs().apiDataPath || '',
  set: (v) => { if (store.selectedComp) (store.selectedComp.props as any).dataSource.apiDataPath = v },
})

const dsRefreshInterval = computed({
  get: () => getTableDs().refreshInterval || 0,
  set: (v) => { if (store.selectedComp) (store.selectedComp.props as any).dataSource.refreshInterval = v },
})

const dsLoading = computed(() => getTableDs().loading || false)
const dsError = computed(() => getTableDs().error || '')
const dsLastFetchAt = computed(() => getTableDs().lastFetchAt || 0)

function getTableDs(): DataSourceConfig {
  if (!store.selectedComp || store.selectedComp.type !== 'table') return createDefaultDataSource('manual')
  return (store.selectedComp.props as any).dataSource || createDefaultDataSource('manual')
}

function setDataSourceType(type: 'manual' | 'api') {
  if (!store.selectedComp) return
  const ds = (store.selectedComp.props as any).dataSource
  if (!ds) {
    ;(store.selectedComp.props as any).dataSource = createDefaultDataSource(type)
  } else {
    ds.type = type
  }
}

function handleFetchTableData() {
  if (!store.selectedComp) return
  store.fetchTableData(store.selectedComp.id)
}

// ═══════════ 图表数据源 ═══════════
const chartDsType = computed({
  get: () => getChartDs().type || 'manual',
  set: (v) => { if (store.selectedComp) (store.selectedComp.props as any).dataSource.type = v },
})

const chartDsApiUrl = computed({
  get: () => getChartDs().apiUrl || '',
  set: (v) => { if (store.selectedComp) (store.selectedComp.props as any).dataSource.apiUrl = v },
})

const chartDsApiMethod = computed({
  get: () => getChartDs().apiMethod || 'GET',
  set: (v) => { if (store.selectedComp) (store.selectedComp.props as any).dataSource.apiMethod = v },
})

const chartDsApiParamsText = computed({
  get: () => {
    const p = getChartDs().apiParams
    return p && Object.keys(p).length > 0 ? JSON.stringify(p, null, 2) : ''
  },
  set: (v) => {
    if (!store.selectedComp) return
    try {
      ;(store.selectedComp.props as any).dataSource.apiParams = v ? JSON.parse(v) : {}
    } catch { /* ignore */ }
  },
})

const chartDsApiDataPath = computed({
  get: () => getChartDs().apiDataPath || '',
  set: (v) => { if (store.selectedComp) (store.selectedComp.props as any).dataSource.apiDataPath = v },
})

const chartDsLoading = computed(() => getChartDs().loading || false)
const chartDsError = computed(() => getChartDs().error || '')

function getChartDs(): DataSourceConfig {
  if (!store.selectedComp || store.selectedComp.type !== 'chart') return createDefaultDataSource('manual')
  return (store.selectedComp.props as any).dataSource || createDefaultDataSource('manual')
}

function setChartDataSourceType(type: 'manual' | 'api') {
  if (!store.selectedComp) return
  const ds = (store.selectedComp.props as any).dataSource
  if (!ds) {
    ;(store.selectedComp.props as any).dataSource = createDefaultDataSource(type)
  } else {
    ds.type = type
  }
}

function handleFetchChartData() {
  if (!store.selectedComp) return
  store.fetchChartData(store.selectedComp.id)
}
</script>

<style scoped>
.props {
  width: 320px;
  background: var(--bg-sec);
  border-left: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.props-header {
  padding: 14px 16px;
  font-weight: 600;
  font-size: 12px;
  color: var(--txt-sec);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid var(--border);
}
.props-body {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
}
.pgroup {
  margin-bottom: 14px;
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  overflow: hidden;
}
.pgroup-t {
  padding: 10px 14px;
  font-size: 11px;
  font-weight: 600;
  color: var(--txt-sec);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: var(--bg-pri);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  user-select: none;
  transition: background 0.15s;
}
.pgroup-t:hover {
  background: var(--bg-ter);
}
.toggle-icon {
  font-size: 12px;
  opacity: 0.5;
}
.pgroup-body {
  padding: 12px 14px;
  border-top: 1px solid var(--border);
}
.pfield {
  margin-bottom: 10px;
}
.pfield label {
  display: block;
  font-size: 11px;
  font-weight: 500;
  color: var(--txt-sec);
  margin-bottom: 3px;
}
.pfield input[type='text'],
.pfield input[type='number'],
.pfield textarea,
.pfield select {
  width: 100%;
  padding: 7px 10px;
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  background: var(--bg-pri);
  color: var(--txt-pri);
  font-size: 13px;
  transition: border-color 0.2s;
}
.pfield input:focus,
.pfield textarea:focus,
.pfield select:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(79, 110, 247, 0.1);
}
.pfield textarea {
  resize: vertical;
  min-height: 60px;
}
.pfield input[type='color'] {
  width: 34px;
  height: 34px;
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  padding: 2px;
  cursor: pointer;
}
.prow {
  display: flex;
  gap: 8px;
}
.prow .pfield {
  flex: 1;
  margin-bottom: 0;
}

/* 四向输入 */
.quad-input {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}
.quad-item {
  display: flex;
  align-items: center;
  gap: 4px;
}
.quad-label {
  font-size: 10px;
  color: var(--txt-ter);
  min-width: 14px;
}
.quad-item input {
  width: 100%;
  padding: 5px 6px;
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  background: var(--bg-pri);
  color: var(--txt-pri);
  font-size: 12px;
}
.quad-item input:focus {
  outline: none;
  border-color: var(--accent);
}

/* 颜色+文本组合 */
.color-field {
  display: flex;
  gap: 6px;
  align-items: center;
}
.color-field input[type='color'] {
  flex-shrink: 0;
}
.color-text {
  flex: 1;
  padding: 5px 8px;
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  background: var(--bg-pri);
  color: var(--txt-pri);
  font-size: 12px;
}

/* 数据源切换 Tab */
.ds-tabs {
  display: flex;
  gap: 4px;
  background: var(--bg-ter);
  border-radius: var(--r-sm);
  padding: 3px;
}
.ds-tab {
  flex: 1;
  padding: 6px 10px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--txt-sec);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}
.ds-tab.active {
  background: var(--bg-pri);
  color: var(--accent);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

/* 复选框行 */
.check-row {
  display: flex;
  gap: 14px;
}
.check-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--txt-sec);
  cursor: pointer;
}

/* 数据源错误/信息 */
.ds-error {
  margin-top: 6px;
  padding: 6px 10px;
  background: rgba(239, 68, 68, 0.08);
  border-radius: var(--r-sm);
  font-size: 12px;
  color: var(--err);
}
.ds-info {
  margin-top: 4px;
  font-size: 11px;
  color: var(--txt-ter);
}

/* 未选中 */
.no-sel {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--txt-ter);
  gap: 8px;
  font-size: 13px;
}
.no-sel svg {
  width: 44px;
  height: 44px;
  opacity: 0.25;
}
</style>
