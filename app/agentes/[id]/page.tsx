import { redirect } from 'next/navigation'
import { createClient } from '../../../lib/supabase/server'
import AgentePage from './AgentePage'

export default async function AgenteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: agent } = await supabase
    .from('agents')
    .select(`id, name, description, provider, platform, external_url, categories(id, name)`)
    .eq('id', id)
    .single()

  if (!agent) redirect('/admin')

  await supabase.from('agent_access_logs').insert({
    agent_id: agent.id, user_id: user.id, source: 'portal',
  })

  return <AgentePage agent={agent as any} userEmail={user.email || ''} />
}
