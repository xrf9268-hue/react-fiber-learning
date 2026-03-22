import { createLazyFileRoute } from '@tanstack/react-router'
import { ModulePage } from '@/components/ModulePage'
import Content from '@/content/modules/m1-why-fiber-exists.mdx'
import Evidence from '@/content/evidence/m1-evidence.mdx'

export const Route = createLazyFileRoute('/learn/01-why-fiber')({
  component: () => <ModulePage slug="01-why-fiber" Content={Content} Evidence={Evidence} />,
})
