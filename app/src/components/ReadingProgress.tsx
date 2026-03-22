import { useEffect, useRef } from 'react'

interface ReadingProgressProps {
  /** 渐变终点色，默认 React 蓝 */
  color?: string
}

export function ReadingProgress({ color = '#61dafb' }: ReadingProgressProps) {
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let rafId: number

    function update() {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const pct = docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0
      if (barRef.current) {
        barRef.current.style.transform = `scaleX(${pct})`
      }
    }

    function onScroll() {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(update)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    update()

    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(rafId)
    }
  }, [])

  return (
    <div
      ref={barRef}
      className="reading-progress"
      style={{
        transform: 'scaleX(0)',
        background: `linear-gradient(90deg, #61dafb, ${color})`,
      }}
    />
  )
}
