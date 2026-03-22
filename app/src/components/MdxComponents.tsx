import type { ComponentPropsWithoutRef } from 'react'

/**
 * MDX 自定义组件映射
 * 仅覆盖需要自定义行为的元素，其余使用默认渲染
 */
export const mdxComponents = {
  a: (props: ComponentPropsWithoutRef<'a'>) => {
    const isExternal = props.href?.startsWith('http')
    return (
      <a
        {...props}
        {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      />
    )
  },
  table: (props: ComponentPropsWithoutRef<'table'>) => (
    <div style={{ overflowX: 'auto' }}>
      <table {...props} />
    </div>
  ),
  img: (props: ComponentPropsWithoutRef<'img'>) => {
    const isSvg = props.src?.endsWith('.svg')
    // SVG 图表路径修正：docs/diagrams/ -> /diagrams/
    const src = props.src?.replace(/^\.\.\/diagrams\//, '/diagrams/')
      .replace(/^docs\/diagrams\//, '/diagrams/') ?? props.src
    return (
      <img
        {...props}
        src={src}
        loading="lazy"
        style={isSvg ? { width: '100%' } : undefined}
      />
    )
  },
}
