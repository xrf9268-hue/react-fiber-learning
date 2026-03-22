import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { Navbar } from '@/components/Navbar'
import { ReadingProgress } from '@/components/ReadingProgress'

export const Route = createRootRoute({
  component: RootLayout,
  errorComponent: ErrorFallback,
  notFoundComponent: NotFoundPage,
})

function RootLayout() {
  return (
    <>
      <ReadingProgress />
      <Navbar />
      <Outlet />
    </>
  )
}

function ErrorFallback({ error }: { error: Error }) {
  return (
    <>
      <Navbar />
      <div className="error-page">
        <h1>出错了</h1>
        <p>{error.message || '页面加载失败，请稍后重试。'}</p>
        <Link to="/">返回首页</Link>
      </div>
    </>
  )
}

function NotFoundPage() {
  return (
    <div className="error-page">
      <h1>404 — 页面未找到</h1>
      <p>你访问的页面不存在。</p>
      <Link to="/">返回首页</Link>
    </div>
  )
}
