import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
export default function createComponents() {
  return Components({
    // dts: true, // enabled by default if `typescript` is installed
    dts: 'types/components.d.ts',
    resolvers: [ElementPlusResolver()]
  })
}
