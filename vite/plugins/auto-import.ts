import AutoImport from 'unplugin-auto-import/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
export default function createAutoImport() {
  return AutoImport({
    imports: ['vue', 'vue-router', 'pinia'],
    resolvers: [ElementPlusResolver()],
    dts: 'types/auto-imports.d.ts',
    // 解决eslint报错问题
    eslintrc: {
      // 这里先设置成true然后npm run dev 运行之后会生成 .eslintrc-auto-import.json 文件之后，在改为false
      enabled: true,
      filepath: './.eslintrc-auto-import.json', // 生成的文件路径
      globalsPropValue: true
    }
  })
}
