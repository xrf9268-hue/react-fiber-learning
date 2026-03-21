---
layout: home
title: React Fiber 深入学习
---

<FiberHero />
<ModuleTimeline />

<div class="home-features">
  <div class="features-header">
    <span class="section-label">APPROACH</span>
    <h2 class="section-title">学习方法</h2>
  </div>

  <div class="feature-grid">
    <div class="feature-card">
      <div class="feature-icon concept">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 6v6l4 2"/>
        </svg>
      </div>
      <h3>概念优先</h3>
      <p>先建立稳定心智模型，不是一上来就陷入整仓源码考古</p>
    </div>
    <div class="feature-card">
      <div class="feature-icon evidence">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M9 11l3 3L22 4"/>
          <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
        </svg>
      </div>
      <h3>证据导向</h3>
      <p>每个结论都可回查 React v18.2.0 官方源码证据</p>
    </div>
    <div class="feature-card">
      <div class="feature-icon minimal">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M4 6h16M4 12h10M4 18h6"/>
        </svg>
      </div>
      <h3>最小必要</h3>
      <p>只追踪最少但关键的源码入口，拒绝无目的的全量阅读</p>
    </div>
  </div>
</div>

<div class="home-quote">
  <blockquote>
    <p>React Fiber 的本质，是把更新从"不可拆分的一整块渲染工作"，改造成"可分段推进、可中断、可恢复、可按优先级取舍，但最终仍要一致提交"的内部工作系统。</p>
  </blockquote>
</div>

<div class="home-cta">
  <a href="/guide/" class="cta-link">
    从总览开始 →
  </a>
</div>

<style>
.home-features {
  max-width: 900px;
  margin: 0 auto;
  padding: 4rem 2rem;
}

.features-header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.features-header .section-label {
  display: inline-block;
  font-family: var(--fiber-font-mono);
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--fiber-blue);
  background: rgba(97, 218, 251, 0.08);
  padding: 4px 14px;
  border-radius: 999px;
  margin-bottom: 0.8rem;
}

.features-header .section-title {
  font-family: var(--fiber-font-heading);
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--fiber-text);
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
}

@media (max-width: 640px) {
  .feature-grid {
    grid-template-columns: 1fr;
  }
}

.feature-card {
  padding: 1.8rem;
  background: var(--fiber-bg-card);
  border: 1px solid var(--fiber-border);
  border-radius: var(--fiber-radius);
  transition: border-color 0.25s ease, transform 0.25s ease;
}

.feature-card:hover {
  border-color: var(--fiber-border-glow);
  transform: translateY(-2px);
}

.feature-card h3 {
  font-family: var(--fiber-font-heading);
  font-size: 1.15rem;
  color: var(--fiber-text);
  margin: 1rem 0 0.5rem;
}

.feature-card p {
  font-size: 0.9rem;
  color: var(--fiber-text-3);
  line-height: 1.6;
  margin: 0;
}

.feature-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
}

.feature-icon.concept {
  background: rgba(97, 218, 251, 0.1);
  color: var(--fiber-blue);
}
.feature-icon.evidence {
  background: rgba(74, 222, 128, 0.1);
  color: var(--fiber-green);
}
.feature-icon.minimal {
  background: rgba(167, 139, 250, 0.1);
  color: var(--fiber-purple);
}

.home-quote {
  max-width: 720px;
  margin: 0 auto;
  padding: 2rem 2rem 3rem;
}

.home-quote blockquote {
  border-left: 3px solid var(--fiber-blue);
  padding: 1.5rem 2rem;
  background: rgba(97, 218, 251, 0.04);
  border-radius: 0 var(--fiber-radius) var(--fiber-radius) 0;
  margin: 0;
}

.home-quote blockquote p {
  font-family: var(--fiber-font-heading);
  font-size: 1.05rem;
  line-height: 1.8;
  color: var(--fiber-text-2);
  margin: 0;
  font-style: italic;
}

.home-cta {
  text-align: center;
  padding: 1rem 2rem 5rem;
}

.cta-link {
  font-family: var(--fiber-font-heading);
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--fiber-blue);
  text-decoration: none;
  padding: 12px 32px;
  border: 1px solid rgba(97, 218, 251, 0.25);
  border-radius: 999px;
  transition: all 0.25s ease;
}

.cta-link:hover {
  background: rgba(97, 218, 251, 0.08);
  border-color: var(--fiber-blue);
  transform: translateY(-2px);
}
</style>
