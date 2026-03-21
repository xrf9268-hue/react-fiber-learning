import { defineConfig } from 'vitepress'

export default defineConfig({
  lang: 'zh-CN',
  title: 'React Fiber 深入学习',
  description: '一条稳定、可复习、可回查证据的 React Fiber 学习主线',

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    ['link', { href: 'https://fonts.googleapis.com/css2?family=LXGW+WenKai:wght@400;700&family=Noto+Sans+SC:wght@400;500;700&family=JetBrains+Mono:wght@400;500;600&display=swap', rel: 'stylesheet' }],
    ['meta', { property: 'og:title', content: 'React Fiber 深入学习' }],
    ['meta', { property: 'og:description', content: '从"为什么要改"到"遇到阻塞怎么办" — 六个模块串起 React Fiber 完整主线' }],
    ['meta', { property: 'og:url', content: 'https://aixie.de' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
  ],

  themeConfig: {
    logo: '/favicon.svg',
    siteTitle: 'React Fiber 学习',

    nav: [
      { text: '首页', link: '/' },
      { text: '总览', link: '/guide/' },
      {
        text: '学习模块',
        items: [
          { text: 'M1 | 为什么需要 Fiber', link: '/modules/m1' },
          { text: 'M2 | Fiber 节点与树遍历', link: '/modules/m2' },
          { text: 'M3 | 双树与 render/commit', link: '/modules/m3' },
          { text: 'M4 | 一次 setState 全链路', link: '/modules/m4' },
          { text: 'M5 | lanes / priority / scheduler', link: '/modules/m5' },
          { text: 'M6 | Suspense / Offscreen / retry', link: '/modules/m6' },
        ]
      },
      {
        text: '参考',
        items: [
          { text: 'Fiber 字段速查', link: '/reference/fiber-fields' },
          { text: 'Lane 常量表', link: '/reference/lane-constants' },
          { text: '源码映射表', link: '/reference/source-map' },
          { text: '图示总览', link: '/diagrams/' },
        ]
      }
    ],

    sidebar: {
      '/guide/': [
        {
          text: '入门',
          items: [
            { text: '总览', link: '/guide/' },
            { text: '推荐阅读顺序', link: '/guide/reading-order' },
          ]
        }
      ],
      '/modules/': [
        {
          text: '学习模块',
          items: [
            { text: 'M1 | 为什么需要 Fiber', link: '/modules/m1' },
            { text: 'M2 | Fiber 节点与树遍历', link: '/modules/m2' },
            { text: 'M3 | 双树与 render/commit', link: '/modules/m3' },
            { text: 'M4 | 一次 setState 全链路', link: '/modules/m4' },
            { text: 'M5 | lanes / priority / scheduler', link: '/modules/m5' },
            { text: 'M6 | Suspense / Offscreen / retry', link: '/modules/m6' },
          ]
        },
        {
          text: '证据与源码',
          collapsed: true,
          items: [
            { text: 'M1 证据笔记', link: '/evidence/m1' },
            { text: 'M2 证据笔记', link: '/evidence/m2' },
            { text: 'M3 证据笔记', link: '/evidence/m3' },
            { text: 'M4 证据笔记', link: '/evidence/m4' },
            { text: 'M5 证据笔记', link: '/evidence/m5' },
            { text: 'M6 证据笔记', link: '/evidence/m6' },
          ]
        }
      ],
      '/reference/': [
        {
          text: '参考资料',
          items: [
            { text: 'Fiber 字段速查', link: '/reference/fiber-fields' },
            { text: 'Lane 常量表', link: '/reference/lane-constants' },
            { text: '源码映射表', link: '/reference/source-map' },
          ]
        }
      ]
    },

    outline: {
      level: [2, 3],
      label: '本页目录'
    },

    footer: {
      message: '基于 React v18.2.0 源码 | 概念优先，证据导向',
      copyright: 'aixie.de'
    },

    search: {
      provider: 'local',
      options: {
        translations: {
          button: { buttonText: '搜索', buttonAriaLabel: '搜索' },
          modal: {
            noResultsText: '没有找到相关结果',
            resetButtonTitle: '清除',
            footer: { selectText: '选择', navigateText: '导航', closeText: '关闭' }
          }
        }
      }
    },

    docFooter: {
      prev: '上一篇',
      next: '下一篇'
    },

    lastUpdated: {
      text: '最后更新'
    },
  },

  markdown: {
    lineNumbers: true,
    theme: {
      light: 'github-dark',
      dark: 'github-dark'
    }
  }
})
