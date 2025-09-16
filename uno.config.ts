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
    'shadow-bottom':'shadow-[0_1px_3px_0_var(--shadow-color)]',
    "shadow-right":'shadow-[2px_0_4px_var(--shadow-color)]'
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
