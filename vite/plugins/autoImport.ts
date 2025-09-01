import AutoImport from 'unplugin-auto-import/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
export default function createAutoImport() {
  return AutoImport({
    // 自动导入 Vue 相关函数
    imports: ['vue', 'vue-router', '@vueuse/core', 'pinia'],
    resolvers: [ElementPlusResolver()],
    dts: 'types/autoImports.d.ts',
    // 解决eslint报错问题
    eslintrc: {
      // 这里先设置成true然后npm run dev 运行之后会生成 .eslintrcAutoImport.json 文件之后，在改为false
      enabled: false,
      filepath: './.eslintrcAutoImport.json', // 生成的文件路径
      globalsPropValue: true
    }
  })
}
