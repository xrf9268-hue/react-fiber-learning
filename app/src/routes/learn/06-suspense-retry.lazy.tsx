import { createLazyFileRoute } from '@tanstack/react-router'
import { ModulePage } from '@/components/ModulePage'
import Content from '@/content/modules/m6-suspense-offscreen-react19.mdx'
import Evidence from '@/content/evidence/m6-evidence.mdx'

export const Route = createLazyFileRoute('/learn/06-suspense-retry')({
  component: () => <ModulePage slug="06-suspense-retry" Content={Content} Evidence={Evidence} />,
})
