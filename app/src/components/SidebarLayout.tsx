import { Outlet } from '@tanstack/react-router'
import { Sidebar } from '@/components/Sidebar'
import type { SidebarSection } from '@/components/Sidebar'
import { PageTransition } from '@/components/PageTransition'

interface SidebarLayoutProps {
  sections: SidebarSection[]
}

export function SidebarLayout({ sections }: SidebarLayoutProps) {
  return (
    <div className="layout-with-sidebar">
      <Sidebar sections={sections} />
      <main className="content-area">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>
    </div>
  )
}
