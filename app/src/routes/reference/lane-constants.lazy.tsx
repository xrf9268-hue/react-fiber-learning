import { createLazyFileRoute } from '@tanstack/react-router'
import { MdxPage } from '@/components/MdxPage'
import Content from '@/content/reference/lane-constants.mdx'

export const Route = createLazyFileRoute('/reference/lane-constants')({
  component: () => <MdxPage Content={Content} />,
})
