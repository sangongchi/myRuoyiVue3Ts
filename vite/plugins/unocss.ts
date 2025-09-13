import UnoCss from '@unocss/vite' // 引入 UnoCSS Vite 插件

export default function createUnoCSS() {
  return UnoCss({
    hmrTopLevelAwait: false // unocss默认是true，低版本浏览器是不支持的，启动后会报错
  })
}
