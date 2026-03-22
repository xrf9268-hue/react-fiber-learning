import { createLazyFileRoute } from '@tanstack/react-router'
import { MdxPage } from '@/components/MdxPage'
import Content from '@/content/guide/reading-order.mdx'

export const Route = createLazyFileRoute('/learn/reading-order')({
  component: () => <MdxPage Content={Content} />,
})
