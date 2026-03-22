export interface ModuleInfo {
  /** 模块 ID，如 'M1' */
  id: string
  /** 模块编号，如 '01' */
  num: string
  /** URL slug，如 '01-why-fiber' */
  slug: string
  /** 完整标题 */
  title: string
  /** 侧栏用短标题 */
  shortTitle: string
  /** 一句话描述 */
  desc: string
  /** 关键词标签 */
  keyword: string
  /** 模块专属色 */
  color: string
}

export const modules: ModuleInfo[] = [
  {
    id: 'M1',
    num: '01',
    slug: '01-why-fiber',
    title: '为什么 React 需要 Fiber',
    shortTitle: '为什么需要 Fiber',
    desc: '旧同步渲染模型的控制力问题',
    keyword: '问题意识',
    color: '#61dafb',
  },
  {
    id: 'M2',
    num: '02',
    slug: '02-fiber-node',
    title: 'Fiber 节点与树遍历',
    shortTitle: 'Fiber 节点与树遍历',
    desc: '工作单元的结构与遍历骨架',
    keyword: '数据结构',
    color: '#4ade80',
  },
  {
    id: 'M3',
    num: '03',
    slug: '03-dual-tree',
    title: '双树与 render/commit',
    shortTitle: '双树与 render/commit',
    desc: 'current / workInProgress / 提交分离',
    keyword: '双树模型',
    color: '#a78bfa',
  },
  {
    id: 'M4',
    num: '04',
    slug: '04-setstate-trace',
    title: '一次 setState 全链路',
    shortTitle: '一次 setState 全链路',
    desc: '从组件到 root，再到 commit 的完整过程',
    keyword: '动态过程',
    color: '#fb923c',
  },
  {
    id: 'M5',
    num: '05',
    slug: '05-lanes-scheduler',
    title: 'lanes / priority / scheduler',
    shortTitle: 'lanes / priority / scheduler',
    desc: '多条更新并存时的优先级协作',
    keyword: '调度系统',
    color: '#e8d44d',
  },
  {
    id: 'M6',
    num: '06',
    slug: '06-suspense-retry',
    title: 'Suspense / Offscreen / retry',
    shortTitle: 'Suspense / Offscreen / retry',
    desc: '工作卡住时的回退、隐藏与恢复',
    keyword: '异常处理',
    color: '#f87171',
  },
]

/** 单次查找返回当前模块及前后模块 */
export function getModuleContext(slug: string) {
  const index = modules.findIndex((m) => m.slug === slug)
  return {
    current: index >= 0 ? modules[index] : null,
    prev: index > 0 ? modules[index - 1] : null,
    next: index < modules.length - 1 ? modules[index + 1] : null,
  }
}
