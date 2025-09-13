import {
  presetWind3,
  defineConfig,
  presetAttributify,
  presetIcons,
  presetTypography,
  presetWebFonts,
  transformerDirectives,
  transformerVariantGroup
} from 'unocss'

export default defineConfig({
  shortcuts: {
    'flex-center':'flex justify-center items-center',
    'shadow-bottom':'shadow-[0_1px_3px_0_rgba(0,0,0,0.12),0_0_3px_0_rgba(0,0,0,0.04)]',
    "shadow-right":'shadow-[2px_0_6px_rgba(0,21,41,0.35)]'
  },
  presets: [
    presetWind3,
    presetAttributify(),
    presetIcons(),
    presetTypography(),
    presetWebFonts({
      fonts: {}
    })
  ],
  transformers: [transformerDirectives(), transformerVariantGroup()]
})
