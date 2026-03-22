import { createLazyFileRoute } from '@tanstack/react-router'
import { MdxPage } from '@/components/MdxPage'
import Content from '@/content/guide/final-guide.mdx'

export const Route = createLazyFileRoute('/learn/overview')({
  component: () => <MdxPage Content={Content} />,
})
