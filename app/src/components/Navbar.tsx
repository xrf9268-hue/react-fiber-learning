import { Link, useRouterState } from '@tanstack/react-router'
import { useState } from 'react'

const GITHUB_URL = 'https://github.com/xrf9268-hue/react-fiber-learning'

const navLinks = [
  { label: '学习路径', to: '/learn/overview' },
  { label: '参考资料', to: '/reference/fiber-fields' },
  { label: '图表', to: '/diagrams' },
] as const

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  function isActive(to: string) {
    if (to.startsWith('/learn')) return pathname.startsWith('/learn')
    if (to.startsWith('/reference')) return pathname.startsWith('/reference')
    return pathname === to
  }

  return (
    <nav className="navbar" aria-label="主导航">
      <div className="navbar-inner">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <span className="navbar-logo-dot" />
          <span className="navbar-logo-text">React Fiber 深入学习</span>
        </Link>

        {/* Desktop links */}
        <div className="navbar-links">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`navbar-link${isActive(link.to) ? ' active' : ''}`}
            >
              {link.label}
            </Link>
          ))}
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="navbar-link"
            aria-label="GitHub"
          >
            GitHub
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          className="navbar-hamburger"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          <span className="navbar-hamburger-bar" />
          <span className="navbar-hamburger-bar" />
          <span className="navbar-hamburger-bar" />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="navbar-mobile-menu">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`navbar-mobile-link${isActive(link.to) ? ' active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="navbar-mobile-link"
            onClick={() => setMenuOpen(false)}
          >
            GitHub
          </a>
        </div>
      )}
    </nav>
  )
}
