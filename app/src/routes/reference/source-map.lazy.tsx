import { createLazyFileRoute } from '@tanstack/react-router'
import { MdxPage } from '@/components/MdxPage'
import Content from '@/content/reference/source-map.mdx'

export const Route = createLazyFileRoute('/reference/source-map')({
  component: () => <MdxPage Content={Content} />,
})
