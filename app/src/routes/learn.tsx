import { createFileRoute } from '@tanstack/react-router'
import { SidebarLayout } from '@/components/SidebarLayout'
import type { SidebarSection } from '@/components/Sidebar'
import { modules } from '@/data/modules'

export const Route = createFileRoute('/learn')({
  component: LearnLayout,
})

const sections: SidebarSection[] = [
  {
    title: '学习路径',
    items: [
      { label: '总览', href: '/learn/overview' },
      { label: '阅读顺序', href: '/learn/reading-order' },
      ...modules.map((m) => ({
        label: `${m.num} ${m.shortTitle}`,
        href: `/learn/${m.slug}`,
        color: m.color,
      })),
    ],
  },
]

function LearnLayout() {
  return <SidebarLayout sections={sections} />
}
