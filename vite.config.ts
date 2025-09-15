import { defineConfig, loadEnv } from 'vite'
import createVitePlugins from './vite/plugins'
import path from 'path'

export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd())
  const { VITE_APP_ENV } = env
  return {
    plugins: createVitePlugins(env, command === 'build'),
    // 部署生产环境和开发环境下的URL。
    // 默认情况下，vite 会假设你的应用是被部署在一个域名的根路径上
    // 例如 https://www.ruoyi.vip/。如果应用被部署在一个子路径上，你就需要用这个选项指定这个子路径。例如，如果你的应用被部署在 https://www.ruoyi.vip/admin/，则设置 baseUrl 为 /admin/。
    base: VITE_APP_ENV === 'production' ? '/' : '/',
    server: {
      host: '0.0.0.0',
      open: true,
      proxy: {
        // https://cn.vitejs.dev/config/#server-proxy
        '/dev-api': {
          target: 'http://10.9.4.37:8080',
          changeOrigin: true,
          rewrite: (p: string) => p.replace(/^\/dev-api/, '')
        }
      }
    },
    resolve: {
      alias: {
        // 设置路径
        '~': path.resolve(__dirname, './'),
        // 设置别名
        '@': path.resolve(__dirname, './src')
      }
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id: any) {
            if (id.includes('element-plus/theme')) {
              return 'ele'
            }
          }
        }
      }
    },
    // 预编译(主要针对开发环境)
    optimizeDeps: {
      include: [
        // UI 框架类
        'element-plus',
        '@element-plus/icons-vue',
        // 图表类
        'echarts',        
        // 编辑器类
        '@vueup/vue-quill',
        
        // 工具类
        'crypto-js',
        'jsencrypt',
        'file-saver',
        'fuse.js',
        'es-toolkit',
        // Vue 生态
        'vue',
        'pinia',
        'vue-router'
      ]
    }
  }
})
