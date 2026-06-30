import type { CompType, PaletteItem, ReportComponent, LayoutStyle } from './types'
import { createDefaultDataSource } from './api'

// ── 工具函数 ──
export function uid(): string {
  return 'c' + Date.now() + '_' + Math.random().toString(36).substring(2, 8)
}

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

export function escapeHtml(s: string | undefined): string {
  if (!s) return ''
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// ── 默认通用布局 ──
export function defaultLayout(): LayoutStyle {
  return {
    paddingTop: 0,
    paddingRight: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    marginTop: 0,
    marginRight: 0,
    marginBottom: 0,
    marginLeft: 0,
    borderRadius: 0,
    borderWidth: 0,
    borderStyle: 'none',
    borderColor: '#e2e5ec',
    background: 'transparent',
    boxShadow: 'none',
  }
}

// ── 通用布局样式 → CSS 字符串 ──
export function layoutCss(style: Record<string, any>): string {
  const s = { ...defaultLayout(), ...(style || {}) }
  const parts: string[] = []
  if (s.paddingTop || s.paddingRight || s.paddingBottom || s.paddingLeft) {
    parts.push(`padding:${s.paddingTop}px ${s.paddingRight}px ${s.paddingBottom}px ${s.paddingLeft}px`)
  }
  if (s.marginTop || s.marginRight || s.marginBottom || s.marginLeft) {
    parts.push(`margin:${s.marginTop}px ${s.marginRight}px ${s.marginBottom}px ${s.marginLeft}px`)
  }
  if (s.borderRadius) parts.push(`border-radius:${s.borderRadius}px`)
  if (s.borderWidth && s.borderStyle !== 'none') {
    parts.push(`border:${s.borderWidth}px ${s.borderStyle} ${s.borderColor}`)
  }
  if (s.background && s.background !== 'transparent') parts.push(`background:${s.background}`)
  if (s.boxShadow && s.boxShadow !== 'none') parts.push(`box-shadow:${s.boxShadow}`)
  return parts.join(';')
}

// ── 调色板定义 ──
export const PALETTE: PaletteItem[] = [
  { type: 'heading', label: '标题', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16M4 12h10"/></svg>' },
  { type: 'subheading', label: '副标题', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h10"/></svg>' },
  { type: 'text', label: '正文', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 10h14M4 14h12M4 18h10"/></svg>' },
  { type: 'table', label: '表格', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></svg>' },
  { type: 'chart', label: '图表', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>' },
  { type: 'image', label: '图片', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>' },
  { type: 'divider', label: '分割线', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12h16"/></svg>' },
  { type: 'spacer', label: '间距', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 8h16M4 16h16" stroke-dasharray="3 2"/></svg>' },
  { type: 'pagebreak', label: '分页符', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2" stroke-dasharray="4 2"/></svg>' },
]

// ── 创建组件实例 ──
export function makeComp(type: CompType): ReportComponent {
  const id = uid()
  const base = defaultLayout()
  const c: ReportComponent = { id, type, props: {}, style: {} }

  switch (type) {
    case 'heading':
      c.props = { text: '报告标题' }
      c.style = { ...base, paddingTop: 20, paddingRight: 24, paddingBottom: 12, paddingLeft: 24, fontSize: 22, fontWeight: '700', color: '#1a1d23', background: '#ffffff', align: 'left', lineHeight: 1.4, letterSpacing: 0, textDecoration: 'none' }
      break
    case 'subheading':
      c.props = { text: '章节副标题' }
      c.style = { ...base, paddingTop: 12, paddingRight: 24, paddingBottom: 8, paddingLeft: 24, fontSize: 16, fontWeight: '600', color: '#1a1d23', background: '#ffffff', align: 'left', lineHeight: 1.4, letterSpacing: 0, textDecoration: 'none' }
      break
    case 'text':
      c.props = { text: '这是正文内容，支持多行输入。可详细描述数据背景、分析结论与建议。' }
      c.style = { ...base, paddingTop: 8, paddingRight: 24, paddingBottom: 8, paddingLeft: 24, fontSize: 14, fontWeight: '400', color: '#1a1d23', background: '#ffffff', align: 'left', lineHeight: 1.8, letterSpacing: 0, textDecoration: 'none' }
      break
    case 'divider':
      c.style = { ...base, height: 1, borderStyle: 'solid', color: '#e2e5ec' }
      break
    case 'image':
      c.props = { src: '', alt: '图片说明', width: 100 }
      c.style = { ...base, align: 'center', radius: 8 }
      break
    case 'table':
      c.props = {
        headers: ['项目', '数值', '占比', '趋势'],
        rows: [
          ['项目A', '128', '32%', '↑'],
          ['项目B', '96', '24%', '↓'],
          ['项目C', '84', '21%', '→'],
          ['项目D', '92', '23%', '↑'],
        ],
        dataSource: createDefaultDataSource('manual'),
      }
      c.style = { ...base, paddingTop: 8, paddingRight: 24, paddingBottom: 8, paddingLeft: 24, tableFontSize: 13, thBg: '#4f6ef7', thColor: '#ffffff', borderColor: '#e2e5ec', striped: true, stripeBg: '#f8f9fb', hoverBg: '#eef1fe', headerAlign: 'center', cellAlign: 'left', cellPadding: '8px 12px' }
      break
    case 'chart':
      c.props = { chartType: 'bar', title: '数据分析', _cats: 'Q1,Q2,Q3,Q4', _vals: '120,200,150,180', dataSource: createDefaultDataSource('manual') }
      c.style = { ...base, paddingTop: 12, paddingRight: 24, paddingBottom: 12, paddingLeft: 24, chartHeight: 280, chartBg: '#ffffff', showLegend: true, legendPosition: 'top' }
      break
    case 'pagebreak':
      c.style = { ...base }
      break
    case 'spacer':
      c.props = { height: 40 }
      c.style = { ...base }
      break
  }
  return c
}

// ── 样式 helpers ──
export function textStyle(comp: ReportComponent): Record<string, string> {
  const s = comp.style as any
  return {
    fontSize: (s.fontSize || 14) + 'px',
    fontWeight: String(s.fontWeight || 400),
    color: s.color || '#1a1d23',
    background: s.background && s.background !== 'transparent' ? s.background : 'transparent',
    textAlign: s.align || 'left',
    lineHeight: String(s.lineHeight || 1.6),
    letterSpacing: (s.letterSpacing || 0) + 'px',
    textDecoration: s.textDecoration || 'none',
    paddingTop: (s.paddingTop || 0) + 'px',
    paddingRight: (s.paddingRight || 0) + 'px',
    paddingBottom: (s.paddingBottom || 0) + 'px',
    paddingLeft: (s.paddingLeft || 0) + 'px',
    marginTop: (s.marginTop || 0) + 'px',
    marginRight: (s.marginRight || 0) + 'px',
    marginBottom: (s.marginBottom || 0) + 'px',
    marginLeft: (s.marginLeft || 0) + 'px',
    borderRadius: (s.borderRadius || 0) + 'px',
  }
}

export function dividerStyle(comp: ReportComponent): Record<string, string> {
  const s = comp.style as any
  return {
    height: (s.height || 1) + 'px',
    borderStyle: s.borderStyle || 'solid',
    background: s.color || '#e2e5ec',
    border: 'none',
    marginTop: (s.marginTop || 0) + 'px',
    marginBottom: (s.marginBottom || 0) + 'px',
    marginLeft: (s.marginLeft || 0) + 'px',
    marginRight: (s.marginRight || 0) + 'px',
  }
}

// ── 生成完整报告 HTML ──
export function genHtml(components: ReportComponent[], chartImages: Record<string, string> = {}): string {
  const parts: string[] = []

  parts.push('<!DOCTYPE html>')
  parts.push('<html lang="zh-CN"><head><meta charset="UTF-8"><title>报告单</title><style>')
  parts.push('*{margin:0;padding:0;box-sizing:border-box}')
  parts.push('body{font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;color:#1a1d23;line-height:1.6}')
  parts.push('.report{max-width:794px;margin:0 auto;padding:30px 40px}')
  parts.push('.ch{font-size:22px;font-weight:700;line-height:1.4}')
  parts.push('.csh{font-size:16px;font-weight:600;line-height:1.4}')
  parts.push('.ct{font-size:14px;line-height:1.8}')
  parts.push('.cd{margin:12px 0}')
  parts.push('.cd hr{border:none;height:1px;background:#e2e5ec}')
  parts.push('.ci{margin:12px 0;text-align:center}')
  parts.push('.ci img{max-width:100%;border-radius:8px}')
  parts.push('.ctable{margin:12px 0}')
  parts.push('.ctable table{width:100%;border-collapse:collapse;font-size:13px}')
  parts.push('.ctable th,.ctable td{border:1px solid #e2e5ec;padding:8px 12px}')
  parts.push('.ctable th{background:#4f6ef7;color:#fff;font-weight:600}')
  parts.push('.ctable tr.striped{background:#f8f9fb}')
  parts.push('.ctable tr:hover{background:#eef1fe}')
  parts.push('.cc{margin:12px 0}')
  parts.push('.cc img{max-width:100%;display:block;margin:0 auto}')
  parts.push('.cpb{page-break-after:always;margin:16px 0}')
  parts.push('.csp{margin:0}')
  parts.push('@media print{.report{padding:20px}.cpb{page-break-after:always}}')
  parts.push('</style></head><body><div class="report">')

  for (const comp of components) {
    const s = comp.style as any
    const p = comp.props as any
    const ls = layoutCss(s)

    switch (comp.type) {
      case 'heading':
        parts.push(`<div class="ch" style="font-size:${s.fontSize || 22}px;font-weight:${s.fontWeight || 700};color:${s.color || '#1a1d23'};text-align:${s.align || 'left'};line-height:${s.lineHeight || 1.4};letter-spacing:${s.letterSpacing || 0}px;text-decoration:${s.textDecoration || 'none'};${ls}">${escapeHtml(p.text)}</div>`)
        break
      case 'subheading':
        parts.push(`<div class="csh" style="font-size:${s.fontSize || 16}px;font-weight:${s.fontWeight || 600};color:${s.color || '#1a1d23'};text-align:${s.align || 'left'};line-height:${s.lineHeight || 1.4};letter-spacing:${s.letterSpacing || 0}px;text-decoration:${s.textDecoration || 'none'};${ls}">${escapeHtml(p.text)}</div>`)
        break
      case 'text':
        parts.push(`<div class="ct" style="font-size:${s.fontSize || 14}px;font-weight:${s.fontWeight || 400};color:${s.color || '#1a1d23'};text-align:${s.align || 'left'};line-height:${s.lineHeight || 1.8};letter-spacing:${s.letterSpacing || 0}px;text-decoration:${s.textDecoration || 'none'};${ls}">${escapeHtml(p.text)}</div>`)
        break
      case 'divider':
        parts.push(`<div class="cd"><hr style="height:${s.height || 1}px;border-style:${s.borderStyle || 'solid'};background:${s.color || '#e2e5ec'};${ls}"></div>`)
        break
      case 'image':
        if (p.src) {
          parts.push(`<div class="ci" style="text-align:${s.align || 'center'};${ls}"><img src="${escapeHtml(p.src)}" style="width:${p.width || 100}%;border-radius:${s.radius || 8}px"></div>`)
        } else {
          parts.push(`<div class="ci" style="color:#999;font-size:12px;${ls}">[${escapeHtml(p.alt || '图片')}]</div>`)
        }
        break
      case 'table': {
        const thBg = s.thBg || '#4f6ef7'
        const thColor = s.thColor || '#ffffff'
        const bColor = s.borderColor || '#e2e5ec'
        const striped = s.striped !== false
        const stripeBg = s.stripeBg || '#f8f9fb'
        const cellPad = s.cellPadding || '8px 12px'
        const hAlign = s.headerAlign || 'center'
        const cAlign = s.cellAlign || 'left'
        parts.push(`<div class="ctable" style="${ls}">`)
        parts.push(`<table style="font-size:${s.tableFontSize || 13}px">`)
        parts.push('<thead><tr>')
        for (const h of (p.headers || [])) {
          parts.push(`<th style="background:${thBg};color:${thColor};border-color:${bColor};text-align:${hAlign};padding:${cellPad}">${escapeHtml(h)}</th>`)
        }
        parts.push('</tr></thead><tbody>')
        for (let ri = 0; ri < (p.rows || []).length; ri++) {
          const row = p.rows[ri]
          const rowStyle = striped && ri % 2 === 1 ? `background:${stripeBg};` : ''
          parts.push(`<tr style="${rowStyle}">`)
          for (const cell of row) {
            parts.push(`<td style="border-color:${bColor};text-align:${cAlign};padding:${cellPad}">${escapeHtml(cell)}</td>`)
          }
          parts.push('</tr>')
        }
        parts.push('</tbody></table></div>')
        break
      }
      case 'chart':
        if (chartImages[comp.id]) {
          parts.push(`<div class="cc" style="${ls}"><img src="${chartImages[comp.id]}" alt="${escapeHtml(p.title || '图表')}"></div>`)
        }
        break
      case 'pagebreak':
        parts.push('<div class="cpb"></div>')
        break
      case 'spacer':
        parts.push(`<div class="csp" style="height:${p.height || 40}px;${ls}"></div>`)
        break
    }
  }

  parts.push('</div></body></html>')
  return parts.join('\n')
}

// ── 导出 HTML 文件 ──
export function exportHTML(components: ReportComponent[], chartImages: Record<string, string>) {
  const blob = new Blob([genHtml(components, chartImages)], { type: 'text/html;charset=utf-8' })
  saveAs(blob, `报告单_${todayStr()}.html`)
}

// ── 导出 Word (方案 A) ──
export function exportWord(components: ReportComponent[], chartImages: Record<string, string>) {
  const html = genHtml(components, chartImages)
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
  const bodyContent = bodyMatch ? bodyMatch[1] : html

  let wordHtml = '<!DOCTYPE html>\n'
  wordHtml += '<html xmlns:o="urn:schemas-microsoft-com:office:office"\n'
  wordHtml += '      xmlns:w="urn:schemas-microsoft-com:office:word"\n'
  wordHtml += '      xmlns="http://www.w3.org/TR/REC-html40">\n'
  wordHtml += '<head>\n<meta charset="utf-8">\n<title>报告单</title>\n'
  wordHtml += '<style>\n'
  wordHtml += '  body { font-family: Calibri, "Microsoft YaHei", sans-serif; }\n'
  wordHtml += '  .report { padding: 20pt; }\n'
  wordHtml += '  .ch { font-size: 22pt; font-weight: bold; margin: 16pt 0 8pt; }\n'
  wordHtml += '  .csh { font-size: 16pt; font-weight: bold; margin: 12pt 0 6pt; }\n'
  wordHtml += '  .ct { font-size: 14pt; margin: 6pt 0; line-height: 1.8; }\n'
  wordHtml += '  .cd { margin: 8pt 0; }\n'
  wordHtml += '  .cd hr { border: none; border-top: 1pt solid #e2e5ec; }\n'
  wordHtml += '  .ctable { margin: 8pt 0; }\n'
  wordHtml += '  .ctable table { width: 100%; border-collapse: collapse; font-size: 13pt; }\n'
  wordHtml += '  .ctable th, .ctable td { border: 1pt solid #e2e5ec; padding: 6pt 10pt; text-align: left; }\n'
  wordHtml += '  .ctable th { background: #4f6ef7; color: #fff; font-weight: bold; }\n'
  wordHtml += '  .ctable tr.striped { background: #f8f9fb; }\n'
  wordHtml += '  .ci { margin: 8pt 0; text-align: center; }\n'
  wordHtml += '  .cc { margin: 8pt 0; text-align: center; }\n'
  wordHtml += '  .cc img { max-width: 100%; }\n'
  wordHtml += '  .csp { margin: 0; }\n'
  wordHtml += '  <!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]-->\n'
  wordHtml += '</style>\n</head>\n<body>\n' + bodyContent + '\n</body>\n</html>'

  if (typeof (window as any).htmlDocx !== 'undefined' && (window as any).htmlDocx.asBlob) {
    const blob = (window as any).htmlDocx.asBlob(wordHtml)
    saveAs(blob, `报告单_${todayStr()}.docx`)
  } else {
    const blob = new Blob([wordHtml], { type: 'application/msword;charset=utf-8' })
    saveAs(blob, `报告单_${todayStr()}.doc`)
  }
}

// ── 导出 PDF（打印方式） ──
export function exportPDF(components: ReportComponent[], chartImages: Record<string, string>) {
  const w = window.open('', '_blank')
  if (!w) return
  w.document.write(genHtml(components, chartImages))
  w.document.close()
  w.onload = () => setTimeout(() => w.print(), 500)
}
