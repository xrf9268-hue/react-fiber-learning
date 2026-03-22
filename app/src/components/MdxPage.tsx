import type { ComponentType } from 'react'
import { mdxComponents } from '@/components/MdxComponents'

interface MdxPageProps {
  Content: ComponentType<{ components?: Record<string, ComponentType> }>
}

export function MdxPage({ Content }: MdxPageProps) {
  return (
    <article>
      <Content components={mdxComponents} />
    </article>
  )
}
