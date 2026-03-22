import { Link } from '@tanstack/react-router'
import type { ModuleInfo } from '@/data/modules'

interface ModuleNavProps {
  prev: ModuleInfo | null
  next: ModuleInfo | null
}

export function ModuleNav({ prev, next }: ModuleNavProps) {
  if (!prev && !next) return null

  return (
    <nav className="module-nav" aria-label="模块导航">
      <div className="module-nav-inner">
        {prev ? (
          <Link to={`/learn/${prev.slug}` as '/learn/01-why-fiber'} className="module-nav-link module-nav-prev">
            <span className="module-nav-label">上一篇</span>
            <span className="module-nav-title" style={{ color: prev.color }}>
              {prev.id} {prev.shortTitle}
            </span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link to={`/learn/${next.slug}` as '/learn/01-why-fiber'} className="module-nav-link module-nav-next">
            <span className="module-nav-label">下一篇</span>
            <span className="module-nav-title" style={{ color: next.color }}>
              {next.id} {next.shortTitle}
            </span>
          </Link>
        ) : (
          <span />
        )}
      </div>
    </nav>
  )
}
