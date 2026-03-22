import type { ComponentType } from 'react'
import { Link } from '@tanstack/react-router'
import { mdxComponents } from '@/components/MdxComponents'
import { ModuleNav } from '@/components/ModuleNav'
import { EvidencePanel } from '@/components/EvidencePanel'
import { getModuleContext } from '@/data/modules'

interface ModulePageProps {
  slug: string
  Content: ComponentType<{ components?: Record<string, ComponentType<any>> }>
  Evidence: ComponentType<{ components?: Record<string, ComponentType<any>> }>
}

export function ModulePage({ slug, Content, Evidence }: ModulePageProps) {
  const { current: mod, prev, next } = getModuleContext(slug)

  if (!mod) {
    return (
      <div className="error-page">
        <h1>模块未找到</h1>
        <p>模块 "{slug}" 不存在。</p>
        <Link to="/learn/overview">返回总览</Link>
      </div>
    )
  }

  return (
    <article>
      <div className="module-header">
        <span className="module-badge" style={{ color: mod.color, background: `${mod.color}1a` }}>
          {mod.id}
        </span>
        <span className="module-keyword">{mod.keyword}</span>
      </div>
      <Content components={mdxComponents} />
      <EvidencePanel>
        <Evidence components={mdxComponents} />
      </EvidencePanel>
      <ModuleNav prev={prev} next={next} />
    </article>
  )
}
