import { createLazyFileRoute } from '@tanstack/react-router'
import { ModulePage } from '@/components/ModulePage'
import Content from '@/content/modules/m5-lanes-priority-scheduler-transition.mdx'
import Evidence from '@/content/evidence/m5-evidence.mdx'

export const Route = createLazyFileRoute('/learn/05-lanes-scheduler')({
  component: () => <ModulePage slug="05-lanes-scheduler" Content={Content} Evidence={Evidence} />,
})
