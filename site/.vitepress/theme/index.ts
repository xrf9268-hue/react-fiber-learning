import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import './custom.css'
import FiberHero from './components/FiberHero.vue'
import ModuleTimeline from './components/ModuleTimeline.vue'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('FiberHero', FiberHero)
    app.component('ModuleTimeline', ModuleTimeline)
  }
} satisfies Theme
