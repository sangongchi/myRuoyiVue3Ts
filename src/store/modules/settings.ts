import { defineStore } from 'pinia'
import defaultSettings from '@/settings'
import { useDynamicTitle } from '@/utils/dynamicTitle'
import type { SettingsState } from '@/types'

const {
  sideTheme,
  showSettings,
  topNav,
  tagsView,
  fixedHeader,
  sidebarLogo,
  dynamicTitle
} = defaultSettings

// 本地存储操作抽象
const getStorageSetting = (): Partial<SettingsState> => {
  try {
    return JSON.parse(localStorage.getItem('layout-setting') || '{}') || {}
  } catch {
    return {}
  }
}

export const useSettingsStore = defineStore('settings', () => {
  // 状态声明
  const state = reactive<SettingsState>({
    title: '',
    theme: getStorageSetting().theme || '#409EFF',
    sideTheme: getStorageSetting().sideTheme || sideTheme,
    showSettings,
    topNav: getStorageSetting().topNav ?? topNav,
    tagsView: getStorageSetting().tagsView ?? tagsView,
    fixedHeader: getStorageSetting().fixedHeader ?? fixedHeader,
    sidebarLogo: getStorageSetting().sidebarLogo ?? sidebarLogo,
    dynamicTitle: getStorageSetting().dynamicTitle ?? dynamicTitle
  })

  // 操作方法
  const changeSetting = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    if (key in state) {
      state[key] = value
      persistSettings()
    }
  }

  const setTitle = (title: string) => {
    state.title = title
    useDynamicTitle()
  }

  // 持久化方法
  const persistSettings = () => {
    const persistState = {
      theme: state.theme,
      sideTheme: state.sideTheme,
      topNav: state.topNav,
      tagsView: state.tagsView,
      fixedHeader: state.fixedHeader,
      sidebarLogo: state.sidebarLogo,
      dynamicTitle: state.dynamicTitle
    }
    localStorage.setItem('layout-setting', JSON.stringify(persistState))
  }

  return { 
    ...toRefs(state),
    changeSetting,
    setTitle
  }
})


export default useSettingsStore
