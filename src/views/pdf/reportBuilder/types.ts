/** 报告组件类型枚举 */
export type CompType = 'heading' | 'subheading' | 'text' | 'table' | 'chart' | 'image' | 'divider' | 'spacer' | 'pagebreak'

// ── 通用布局样式（所有组件共享） ──
export interface LayoutStyle {
  /** 内边距 - 上 */
  paddingTop: number
  /** 内边距 - 右 */
  paddingRight: number
  /** 内边距 - 下 */
  paddingBottom: number
  /** 内边距 - 左 */
  paddingLeft: number
  /** 外边距 - 上 */
  marginTop: number
  /** 外边距 - 右 */
  marginRight: number
  /** 外边距 - 下 */
  marginBottom: number
  /** 外边距 - 左 */
  marginLeft: number
  /** 圆角 */
  borderRadius: number
  /** 边框宽度 */
  borderWidth: number
  /** 边框样式 */
  borderStyle: string
  /** 边框颜色 */
  borderColor: string
  /** 背景色 */
  background: string
  /** 盒阴影 */
  boxShadow: string
}

/** 文本类组件的额外样式 */
export interface TextStyle extends Partial<LayoutStyle> {
  fontSize: number
  fontWeight: string
  color: string
  background: string
  align: string
  lineHeight: number
  letterSpacing: number
  textDecoration: string
}

/** 分割线样式 */
export interface DividerStyle extends Partial<LayoutStyle> {
  height: number
  borderStyle: string
  color: string
}

/** 图片样式 */
export interface ImageStyle extends Partial<LayoutStyle> {
  align: string
  radius: number
}

/** 表格样式 */
export interface TableStyle extends Partial<LayoutStyle> {
  tableFontSize: number
  thBg: string
  thColor: string
  borderColor: string
  striped: boolean
  stripeBg: string
  hoverBg: string
  headerAlign: string
  cellAlign: string
  cellPadding: string
}

/** 图表样式 */
export interface ChartStyle extends Partial<LayoutStyle> {
  chartHeight: number
  chartBg: string
  showLegend: boolean
  legendPosition: string
}

/** 间距样式 */
export interface SpacerStyle extends Partial<LayoutStyle> {}

// ── 数据源配置 ──
export type DataSourceType = 'manual' | 'api'

export interface DataSourceConfig {
  /** 数据源类型：手动输入 / 接口获取 */
  type: DataSourceType
  /** 接口地址 */
  apiUrl: string
  /** 请求方法 */
  apiMethod: 'GET' | 'POST'
  /** 请求参数（POST body 或 GET query） */
  apiParams: Record<string, any>
  /** 数据路径（如 data.rows / data.list，用点号分隔嵌套） */
  apiDataPath: string
  /** 自动刷新间隔（秒，0=不刷新） */
  refreshInterval: number
  /** 上次加载时间戳 */
  lastFetchAt: number
  /** 加载状态 */
  loading: boolean
  /** 错误信息 */
  error: string
}

// ── 组件 Props ──
export interface HeadingProps { text: string }
export interface SubheadingProps { text: string }
export interface TextProps { text: string }
export interface DividerProps {}
export interface ImageProps { src: string; alt: string; width: number }
export interface TableProps {
  headers: string[]
  rows: string[][]
  /** 数据源配置 */
  dataSource: DataSourceConfig
}
export interface ChartProps {
  chartType: 'bar' | 'line' | 'pie'
  title: string
  _cats: string
  _vals: string
  /** 数据源配置 */
  dataSource: DataSourceConfig
}
export interface PagebreakProps {}
export interface SpacerProps { height: number }

// ── 报告组件统一结构 ──
export interface ReportComponent {
  id: string
  type: CompType
  props: HeadingProps | SubheadingProps | TextProps | DividerProps | ImageProps | TableProps | ChartProps | PagebreakProps | SpacerProps
  style: TextStyle | DividerStyle | ImageStyle | TableStyle | ChartStyle | SpacerStyle | Record<string, any>
}

/** 调色板项 */
export interface PaletteItem {
  type: CompType
  label: string
  icon: string
}

/** Toast 消息 */
export interface ToastItem {
  id: number
  message: string
  type: 's' | 'e' | 'i'
}
