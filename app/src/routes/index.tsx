import { createFileRoute, Link } from '@tanstack/react-router'
import { FiberHero } from '@/components/FiberHero'
import { ModuleTimeline } from '@/components/ModuleTimeline'
import { FeatureCards } from '@/components/FeatureCards'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <>
      <FiberHero />
      <ModuleTimeline />
      <FeatureCards />

      {/* 核心引用 */}
      <section className="home-quote">
        <blockquote>
          <p>
            React Fiber 的本质，是把更新从"不可拆分的一整块渲染工作"，
            改造成"可分段推进、可中断、可恢复、可按优先级取舍，
            但最终仍要一致提交"的内部工作系统。
          </p>
        </blockquote>
      </section>

      {/* 底部 CTA */}
      <div className="home-cta">
        <Link to="/learn/overview" className="cta-link">
          从总览开始 →
        </Link>
      </div>
    </>
  )
}
