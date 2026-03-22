import { createLazyFileRoute } from '@tanstack/react-router'
import { ModulePage } from '@/components/ModulePage'
import Content from '@/content/modules/m3-current-wip-render-commit.mdx'
import Evidence from '@/content/evidence/m3-evidence.mdx'

export const Route = createLazyFileRoute('/learn/03-dual-tree')({
  component: () => <ModulePage slug="03-dual-tree" Content={Content} Evidence={Evidence} />,
})
