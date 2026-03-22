import { useRef, useEffect } from 'react'
import { Link } from '@tanstack/react-router'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  color: string
  radius: number
}

const PARTICLE_COUNT = 60
const CONNECTION_DIST = 120
const CONNECTION_DIST_SQ = CONNECTION_DIST * CONNECTION_DIST
const PARTICLE_VELOCITY = 0.5
const PARTICLE_ALPHA = 0.7
const CONNECTION_ALPHA_SCALE = 0.15
const COLOR_REACT_BLUE = '#61dafb'
const COLOR_PURPLE = '#a78bfa'
const REACT_BASELINE_VERSION = 'React v18.2.0 baseline'

export function FiberHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    const particles: Particle[] = []

    function resize(c: HTMLCanvasElement, context: CanvasRenderingContext2D) {
      c.width = c.offsetWidth * window.devicePixelRatio
      c.height = c.offsetHeight * window.devicePixelRatio
      context.scale(window.devicePixelRatio, window.devicePixelRatio)
    }

    function init(c: HTMLCanvasElement) {
      particles.length = 0
      const w = c.offsetWidth
      const h = c.offsetHeight
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * PARTICLE_VELOCITY,
          vy: (Math.random() - 0.5) * PARTICLE_VELOCITY,
          color: Math.random() < 0.7 ? COLOR_REACT_BLUE : COLOR_PURPLE,
          radius: Math.random() * 1.5 + 1,
        })
      }
    }

    function draw() {
      if (!canvas || !ctx) return
      const w = canvas.offsetWidth
      const h = canvas.offsetHeight
      ctx.clearRect(0, 0, w, h)

      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > w) p.vx *= -1
        if (p.y < 0 || p.y > h) p.vy *= -1
      }

      // 连接线：用平方比较避免多余 sqrt
      ctx.lineWidth = 0.5
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const distSq = dx * dx + dy * dy
          if (distSq < CONNECTION_DIST_SQ) {
            const alpha = (1 - Math.sqrt(distSq) / CONNECTION_DIST) * CONNECTION_ALPHA_SCALE
            ctx.beginPath()
            ctx.strokeStyle = `rgba(97, 218, 251, ${alpha})`
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.stroke()
          }
        }
      }

      ctx.globalAlpha = PARTICLE_ALPHA
      for (const p of particles) {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.fill()
      }
      ctx.globalAlpha = 1

      animId = requestAnimationFrame(draw)
    }

    resize(canvas, ctx)
    init(canvas)
    draw()

    function onResize() {
      resize(canvas!, ctx!)
      init(canvas!)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <section className="hero">
      <canvas
        ref={canvasRef}
        className="hero-canvas"
        aria-hidden="true"
        role="presentation"
      />
      <div className="hero-content">
        <span className="hero-badge">{REACT_BASELINE_VERSION}</span>
        <h1 className="hero-title">React Fiber 深入学习</h1>
        <p className="hero-subtitle">
          六个模块，一条因果链 — 从问题意识到调度系统
        </p>
        <div className="hero-actions">
          <Link to="/learn/overview" className="cta-link">
            开始阅读
          </Link>
          <Link to="/learn/reading-order" className="hero-secondary-link">
            阅读顺序
          </Link>
        </div>
      </div>
    </section>
  )
}
