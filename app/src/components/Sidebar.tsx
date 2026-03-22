import { Link, useRouterState } from '@tanstack/react-router'

export interface SidebarItem {
  label: string
  href: string
  color?: string
}

export interface SidebarSection {
  title: string
  items: SidebarItem[]
}

interface SidebarProps {
  sections: SidebarSection[]
}

export function Sidebar({ sections }: SidebarProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  return (
    <aside className="sidebar" role="navigation" aria-label="侧边导航">
      {sections.map((section) => (
        <div key={section.title} className="sidebar-section">
          <h3 className="sidebar-section-title">{section.title}</h3>
          <ul className="sidebar-list">
            {section.items.map((item) => {
              const active = pathname === item.href
              return (
                <li key={item.href}>
                  <Link
                    to={item.href}
                    className={`sidebar-link${active ? ' sidebar-link--active' : ''}`}
                    style={active && item.color ? { color: item.color } : undefined}
                  >
                    {item.color && (
                      <span
                        className="sidebar-dot"
                        style={{ background: item.color }}
                      />
                    )}
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </aside>
  )
}
