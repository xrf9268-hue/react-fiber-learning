const features = [
  {
    title: '概念优先',
    desc: '先建立清晰的心智模型，再看源码验证。不陷入细节迷宫。',
    icon: '🧠',
  },
  {
    title: '证据导向',
    desc: '每个论点都有官方源码出处，配套证据笔记可折叠展开。',
    icon: '🔍',
  },
  {
    title: '最小必要',
    desc: '只覆盖理解 Fiber 架构必需的源码路径，不贪多求全。',
    icon: '🎯',
  },
] as const

export function FeatureCards() {
  return (
    <section className="features-section">
      <div className="features-grid">
        {features.map((f) => (
          <div key={f.title} className="feature-card">
            <span className="feature-icon">{f.icon}</span>
            <h3 className="feature-title">{f.title}</h3>
            <p className="feature-desc">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
