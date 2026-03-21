<script setup lang="ts">
import { onMounted, ref, onUnmounted } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)
let animationId: number

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  alpha: number
  hue: number
}

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  let width = 0
  let height = 0
  const particles: Particle[] = []
  const PARTICLE_COUNT = 60

  function resize() {
    width = canvas!.offsetWidth
    height = canvas!.offsetHeight
    canvas!.width = width * window.devicePixelRatio
    canvas!.height = height * window.devicePixelRatio
    ctx!.scale(window.devicePixelRatio, window.devicePixelRatio)
  }

  function initParticles() {
    particles.length = 0
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.5 + 0.1,
        hue: Math.random() > 0.7 ? 270 : 195, // purple or cyan
      })
    }
  }

  function draw() {
    ctx!.clearRect(0, 0, width, height)

    // Draw connections (fiber threads)
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x
        const dy = particles[i].y - particles[j].y
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < 120) {
          const alpha = (1 - dist / 120) * 0.15
          ctx!.beginPath()
          ctx!.moveTo(particles[i].x, particles[i].y)
          ctx!.lineTo(particles[j].x, particles[j].y)
          ctx!.strokeStyle = `hsla(195, 90%, 68%, ${alpha})`
          ctx!.lineWidth = 0.5
          ctx!.stroke()
        }
      }
    }

    // Draw particles
    for (const p of particles) {
      p.x += p.vx
      p.y += p.vy

      if (p.x < 0 || p.x > width) p.vx *= -1
      if (p.y < 0 || p.y > height) p.vy *= -1

      ctx!.beginPath()
      ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx!.fillStyle = `hsla(${p.hue}, 80%, 70%, ${p.alpha})`
      ctx!.fill()

      // Glow
      ctx!.beginPath()
      ctx!.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2)
      const gradient = ctx!.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3)
      gradient.addColorStop(0, `hsla(${p.hue}, 80%, 70%, ${p.alpha * 0.3})`)
      gradient.addColorStop(1, 'transparent')
      ctx!.fillStyle = gradient
      ctx!.fill()
    }

    animationId = requestAnimationFrame(draw)
  }

  resize()
  initParticles()
  draw()

  window.addEventListener('resize', () => {
    resize()
    initParticles()
  })
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
})
</script>

<template>
  <div class="fiber-hero">
    <canvas ref="canvasRef" class="fiber-canvas" />

    <div class="hero-content">
      <div class="hero-badge">
        <span class="badge-dot"></span>
        React v18.2.0 源码学习
      </div>

      <h1 class="hero-title">
        <span class="title-line-1">React Fiber</span>
        <span class="title-line-2">深入学习</span>
      </h1>

      <p class="hero-tagline">
        从"<strong>为什么要改</strong>"到"<strong>遇到阻塞怎么办</strong>"<br />
        六个模块，一条完整主线
      </p>

      <p class="hero-desc">
        把渲染从不可中断的整块工作，改造成可分段推进、可中断、<br class="hide-mobile" />
        可恢复、可按优先级取舍的内部工作系统。
      </p>

      <div class="hero-actions">
        <a href="/guide/" class="action-btn primary">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 2h7l4 4v8a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" stroke-width="1.5"/>
            <path d="M10 2v4h4" stroke="currentColor" stroke-width="1.5"/>
            <path d="M5 9h6M5 12h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          开始阅读
        </a>
        <a href="/modules/m1" class="action-btn secondary">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/>
            <path d="M6.5 5.5l4 2.5-4 2.5V5.5z" fill="currentColor"/>
          </svg>
          从 M1 开始
        </a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fiber-hero {
  position: relative;
  width: 100%;
  min-height: 85vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: linear-gradient(
    170deg,
    var(--fiber-bg-deep) 0%,
    var(--fiber-bg) 40%,
    #0d1530 100%
  );
}

.fiber-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  opacity: 0.6;
}

.hero-content {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 2rem;
  max-width: 720px;
  animation: heroFadeIn 0.8s ease-out;
}

@keyframes heroFadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  border-radius: 999px;
  background: rgba(97, 218, 251, 0.08);
  border: 1px solid rgba(97, 218, 251, 0.15);
  color: var(--fiber-blue);
  font-family: var(--fiber-font-mono);
  font-size: 0.8rem;
  font-weight: 500;
  letter-spacing: 0.03em;
  margin-bottom: 2rem;
  animation: heroFadeIn 0.8s ease-out 0.1s both;
}

.badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--fiber-blue);
  box-shadow: 0 0 8px var(--fiber-blue);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.hero-title {
  font-family: var(--fiber-font-heading);
  line-height: 1.15;
  margin-bottom: 1.5rem;
  animation: heroFadeIn 0.8s ease-out 0.2s both;
}

.title-line-1 {
  display: block;
  font-size: clamp(2.8rem, 7vw, 4.5rem);
  font-weight: 700;
  background: linear-gradient(135deg, var(--fiber-blue) 0%, #93c5fd 50%, var(--fiber-purple) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0 0 30px rgba(97, 218, 251, 0.2));
}

.title-line-2 {
  display: block;
  font-size: clamp(2rem, 5vw, 3.2rem);
  font-weight: 400;
  color: var(--fiber-text);
  margin-top: 0.1em;
}

.hero-tagline {
  font-size: 1.15rem;
  color: var(--fiber-text-2);
  line-height: 1.8;
  margin-bottom: 1rem;
  animation: heroFadeIn 0.8s ease-out 0.3s both;
}

.hero-tagline strong {
  color: var(--fiber-blue);
  font-weight: 600;
}

.hero-desc {
  font-size: 0.95rem;
  color: var(--fiber-text-3);
  line-height: 1.7;
  margin-bottom: 2.5rem;
  animation: heroFadeIn 0.8s ease-out 0.4s both;
}

.hero-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
  animation: heroFadeIn 0.8s ease-out 0.5s both;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 28px;
  border-radius: 999px;
  font-family: var(--fiber-font-body);
  font-size: 0.95rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.25s ease;
  cursor: pointer;
}

.action-btn.primary {
  background: linear-gradient(135deg, var(--fiber-blue) 0%, #3b8bb9 100%);
  color: var(--fiber-bg-deep);
  box-shadow: 0 4px 20px rgba(97, 218, 251, 0.25);
}

.action-btn.primary:hover {
  box-shadow: 0 6px 30px rgba(97, 218, 251, 0.4);
  transform: translateY(-2px);
}

.action-btn.secondary {
  background: rgba(97, 218, 251, 0.08);
  color: var(--fiber-blue);
  border: 1px solid rgba(97, 218, 251, 0.2);
}

.action-btn.secondary:hover {
  background: rgba(97, 218, 251, 0.15);
  border-color: rgba(97, 218, 251, 0.35);
  transform: translateY(-2px);
}

@media (max-width: 640px) {
  .fiber-hero {
    min-height: 75vh;
  }
  .hide-mobile {
    display: none;
  }
  .hero-actions {
    flex-direction: column;
    align-items: center;
  }
}
</style>
