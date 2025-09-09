import { defineStore } from 'pinia'
import defaultSettings from '@/settings'
import { useDynamicTitle } from '@/utils/dynamicTitle'
import type { SettingsState } from '@/types'

const { showSettings, topNav, isRouterTop, tagsView, fixedHeader, sidebarLogo, dynamicTitle } =
  defaultSettings

// 本地存储操作抽象
const getStorageSetting = (): Partial<SettingsState> => {
  try {
    return JSON.parse(localStorage.getItem('layout-setting') || '{}') || {}
  } catch {
    return {}
  }
}

export const useSettingsStore: any = defineStore('settings', () => {
  // 状态声明
  const state = reactive<SettingsState>({
    title: '',
    themeColor: getStorageSetting().themeColor ?? '#409EFF',
    showSettings,
    topNav: getStorageSetting().topNav ?? topNav, // 主路由在顶部，子路由依然在左侧
    isRouterTop: getStorageSetting().isRouterTop ?? isRouterTop,
    tagsView: getStorageSetting().tagsView ?? tagsView,
    fixedHeader: getStorageSetting().fixedHeader ?? fixedHeader,
    sidebarLogo: getStorageSetting().sidebarLogo ?? sidebarLogo,
    dynamicTitle: getStorageSetting().dynamicTitle ?? dynamicTitle
  })

  // 操作方法
  const changeSetting = ({ key, value }: { key: keyof SettingsState; value: SettingsState[keyof SettingsState] }) => {
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
      themeColor: state.themeColor,
      topNav: state.topNav,
      isRouterTop: state.isRouterTop,
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
