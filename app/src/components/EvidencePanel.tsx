import { useState, type ReactNode } from 'react'

interface EvidencePanelProps {
  children: ReactNode
}

export function EvidencePanel({ children }: EvidencePanelProps) {
  const [open, setOpen] = useState(false)

  return (
    <section className="evidence-panel">
      <button
        className="evidence-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="evidence-toggle-icon">{open ? '▼' : '▶'}</span>
        <span>证据回查</span>
      </button>
      {open && (
        <div className="evidence-content">
          {children}
        </div>
      )}
    </section>
  )
}
