import { createLazyFileRoute } from '@tanstack/react-router'
import { MdxPage } from '@/components/MdxPage'
import Content from '@/content/reference/fiber-fields.mdx'

export const Route = createLazyFileRoute('/reference/fiber-fields')({
  component: () => <MdxPage Content={Content} />,
})
