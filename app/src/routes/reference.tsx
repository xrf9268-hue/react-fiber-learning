import { createFileRoute } from '@tanstack/react-router'
import { SidebarLayout } from '@/components/SidebarLayout'
import type { SidebarSection } from '@/components/Sidebar'

export const Route = createFileRoute('/reference')({
  component: ReferenceLayout,
})

const sections: SidebarSection[] = [
  {
    title: '参考资料',
    items: [
      { label: 'Fiber 字段速查', href: '/reference/fiber-fields' },
      { label: 'Lane 常量表', href: '/reference/lane-constants' },
      { label: '源码映射表', href: '/reference/source-map' },
    ],
  },
]

function ReferenceLayout() {
  return <SidebarLayout sections={sections} />
}
