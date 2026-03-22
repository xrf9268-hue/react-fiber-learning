import { Link } from '@tanstack/react-router'
import { modules } from '@/data/modules'
import { useEffect, useRef, useState } from 'react'

export function ModuleTimeline() {
  return (
    <section className="timeline-section">
      <div className="timeline-header">
        <span className="timeline-label">LEARNING PATH</span>
        <h2 className="timeline-title">六个模块，一条因果链</h2>
      </div>
      <div className="timeline">
        <div className="timeline-line" />
        {modules.map((mod, i) => (
          <TimelineCard key={mod.id} mod={mod} index={i} />
        ))}
      </div>
    </section>
  )
}

function TimelineCard({
  mod,
  index,
}: {
  mod: (typeof modules)[number]
  index: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.2 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className="timeline-card"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity 0.5s ${index * 0.1}s, transform 0.5s ${index * 0.1}s`,
      }}
    >
      <div
        className="timeline-dot"
        style={{ background: mod.color, boxShadow: `0 0 8px ${mod.color}60` }}
      />
      <Link to={`/learn/${mod.slug}` as '/learn/01-why-fiber'} className="timeline-card-inner">
        <div className="timeline-card-head">
          <span
            className="module-badge"
            style={{ color: mod.color, background: `${mod.color}1a` }}
          >
            {mod.id}
          </span>
          <span className="module-keyword">{mod.keyword}</span>
        </div>
        <h3 className="timeline-card-title">{mod.title}</h3>
        <p className="timeline-card-desc">{mod.desc}</p>
      </Link>
    </div>
  )
}
