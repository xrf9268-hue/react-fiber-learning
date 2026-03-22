import { createLazyFileRoute } from '@tanstack/react-router'
import { ModulePage } from '@/components/ModulePage'
import Content from '@/content/modules/m4-one-setstate-trace.mdx'
import Evidence from '@/content/evidence/m4-evidence.mdx'

export const Route = createLazyFileRoute('/learn/04-setstate-trace')({
  component: () => <ModulePage slug="04-setstate-trace" Content={Content} Evidence={Evidence} />,
})
