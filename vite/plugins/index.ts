import vue from '@vitejs/plugin-vue'

import createAutoImport from './autoImport'
import createComponents from './components'
import createSvgIcon from './svgIcon'
import createCompression from './compression'
import createSetupExtend from './setupExtend'
import createUnoCss from './unocss'
import { PluginOption } from 'vite'
import createPages from './vitePluginPages'

export default function createVitePlugins(viteEnv: Record<string, string>, isBuild = false) {
  const vitePlugins: PluginOption[] = [vue()]
  vitePlugins.push(createAutoImport())
  vitePlugins.push(createComponents())
  vitePlugins.push(createSetupExtend())
  vitePlugins.push(createSvgIcon(isBuild))
  vitePlugins.push(createUnoCss())
  vitePlugins.push(createPages())
  isBuild && vitePlugins.push(...createCompression(viteEnv))
  return vitePlugins
}
