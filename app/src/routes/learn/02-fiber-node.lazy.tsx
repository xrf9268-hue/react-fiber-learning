import { createLazyFileRoute } from '@tanstack/react-router'
import { ModulePage } from '@/components/ModulePage'
import Content from '@/content/modules/m2-fiber-node-and-traversal.mdx'
import Evidence from '@/content/evidence/m2-evidence.mdx'

export const Route = createLazyFileRoute('/learn/02-fiber-node')({
  component: () => <ModulePage slug="02-fiber-node" Content={Content} Evidence={Evidence} />,
})
