import BLOG from '@/blog.config'
import { getQueryParam, getQueryVariable, isBrowser } from '../lib/utils'
import dynamic from 'next/dynamic'
import getConfig from 'next/config'
import * as ThemeComponents from '@theme-components'
// 所有主题在next.config.js中扫描
export const { THEMES = [] } = getConfig().publicRuntimeConfig

/**
 * 加载全局布局
 * @param {*} themeQuery
 * @returns
 */
export const getGlobalLayoutByTheme = (themeQuery) => {
  if (themeQuery !== BLOG.THEME) {
    return dynamic(() => import(`@/themes/${themeQuery}`).then(m => m[m.getLayoutNameByPath(-1)]), { ssr: true })
  } else {
    return ThemeComponents[ThemeComponents.getLayoutNameByPath('-1')]
  }
}

/**
 * 加载主题文件
 * 如果是
 * @param {*} router
 * @returns
 */
export const getLayoutByTheme = ({ router, theme }) => {
  const themeQuery = getQueryParam(router.asPath, 'theme') || theme
  if (themeQuery !== BLOG.THEME) {
    return dynamic(() => import(`@/themes/${themeQuery}`).then(m => {
      setTimeout(() => {
        checkThemeDOM()
      }, 500);
      return m[m.getLayoutNameByPath(router.pathname)]
    }), { ssr: true })
  } else {
    setTimeout(() => {
      checkThemeDOM()
    }, 100);
    return ThemeComponents[ThemeComponents.getLayoutNameByPath(router.pathname)]
  }
}

/**
 * 切换主题时的特殊处理
 */
const checkThemeDOM = () => {
  if (isBrowser) {
    const elements = document.querySelectorAll('[id^="theme-"]')
    if (elements?.length > 1) {
      elements[elements.length - 1].scrollIntoView()
      // 删除前面的元素，只保留最后一个元素
      for (let i = 0; i < elements.length - 1; i++) {
        elements[i].parentNode.removeChild(elements[i])
      }
    }
  }
}

/**
 * 初始化主题 , 优先级 query > cookies > systemPrefer
 * @param isDarkMode
 * @param updateDarkMode 更改主题ChangeState函数
 * @description 读取cookie中存的用户主题
 */
export const initDarkMode = (updateDarkMode) => {
  // 查看用户设备浏览器是否深色模型
  let newDarkMode = isPreferDark()

  // 查看cookie中是否用户强制设置深色模式
  const cookieDarkMode = loadDarkModeFromLocalStorage()
  if (cookieDarkMode) {
    newDarkMode = JSON.parse(cookieDarkMode)
  }

  // url查询条件中是否深色模式
  const queryMode = getQueryVariable('mode')
  if (queryMode) {
    newDarkMode = queryMode === 'dark'
  }

  updateDarkMode(newDarkMode)
  saveDarkModeToLocalStorage(newDarkMode)
  document.getElementsByTagName('html')[0].setAttribute('class', newDarkMode ? 'dark' : 'light')
}

/**
 * 是否优先深色模式， 根据系统深色模式以及当前时间判断
 * @returns {*}
 */
export function isPreferDark() {
  if (BLOG.APPEARANCE === 'dark') {
    return true
  }
  if (BLOG.APPEARANCE === 'auto') {
    // 系统深色模式或时间是夜间时，强行置为夜间模式
    const date = new Date()
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches
    return prefersDarkMode || (BLOG.APPEARANCE_DARK_TIME && (date.getHours() >= BLOG.APPEARANCE_DARK_TIME[0] || date.getHours() < BLOG.APPEARANCE_DARK_TIME[1]))
  }
  return false
}

/**
 * 读取深色模式
 * @returns {*}
 */
export const loadDarkModeFromLocalStorage = () => {
  return localStorage.getItem('darkMode')
}

/**
   * 保存深色模式
   * @param newTheme
   */
export const saveDarkModeToLocalStorage = (newTheme) => {
  localStorage.setItem('darkMode', newTheme)
}
