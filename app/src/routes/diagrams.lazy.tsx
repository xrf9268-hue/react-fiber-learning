import { createLazyFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

const diagrams = [
  { file: 'react-learning-roadmap.svg', title: 'M1-M6 学习路线总图' },
  { file: 'react-old-sync-vs-fiber.svg', title: '旧同步模型 vs Fiber 能力对比' },
  { file: 'react-fiber-node-traversal.svg', title: 'Fiber 节点与遍历骨架' },
  { file: 'react-current-wip-commit.svg', title: 'current / wIP / commit 关系' },
  { file: 'react-setstate-full-path.svg', title: 'setState 从组件到 commit 完整路径' },
  { file: 'react-lanes-assignment.svg', title: 'lanes 分配与状态流转' },
  { file: 'react-scheduler-render-loop.svg', title: 'Scheduler 与 render loop 协作' },
  { file: 'react-suspense-offscreen-ping-retry.svg', title: 'Suspense 挂起/恢复闭环' },
] as const

export const Route = createLazyFileRoute('/diagrams')({
  component: DiagramsPage,
})

function DiagramsPage() {
  const [selected, setSelected] = useState<typeof diagrams[number] | null>(null)

  // 支持 Escape 键关闭 lightbox
  useEffect(() => {
    if (!selected) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setSelected(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selected])

  return (
    <div className="diagrams-page">
      <h1>图表索引</h1>
      <p className="diagrams-subtitle">
        共 {diagrams.length} 张架构图，点击查看大图
      </p>

      <div className="diagrams-grid">
        {diagrams.map((d) => (
          <button
            key={d.file}
            className="diagram-card"
            onClick={() => setSelected(d)}
          >
            <img
              src={`/diagrams/${d.file}`}
              alt={d.title}
              loading="lazy"
              className="diagram-thumb"
            />
            <span className="diagram-title">{d.title}</span>
          </button>
        ))}
      </div>

      {selected && (
        <div
          className="diagram-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={selected.title}
          onClick={() => setSelected(null)}
        >
          <button
            className="diagram-lightbox-close"
            onClick={() => setSelected(null)}
            aria-label="关闭大图"
          >
            &times;
          </button>
          <img
            src={`/diagrams/${selected.file}`}
            alt={selected.title}
            className="diagram-lightbox-img"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
