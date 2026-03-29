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

  const { data: agent, error: agentError } = await supabase
    .from('agents')
    .select(`id, name, description, provider, platform, external_url, categories(id, name)`)
    .eq('id', id)
    .single()

  if (agentError || !agent) redirect('/admin')

  let assistantId: string | null = null
  const { data: extra } = await supabase
    .from('agents')
    .select('assistant_id')
    .eq('id', id)
    .single()
  if (extra?.assistant_id) assistantId = extra.assistant_id

  // Registra acesso sem bloquear a renderização
  void (async () => {
    try {
      await supabase.from('agent_access_logs').insert({
        agent_id: agent.id,
        user_id: user.id,
        source: 'portal',
      })
    } catch { /* ignora */ }
  })()

  return (
    <AgentePage
      agent={{
        id: String(agent.id),
        name: String(agent.name || ''),
        description: agent.description ? String(agent.description) : null,
        provider: String(agent.provider || ''),
        platform: String(agent.platform || ''),
        external_url: String(agent.external_url || ''),
        assistant_id: assistantId,
        categories: agent.categories ?? null,
      }}
      userEmail={String(user.email || '')}
    />
  )
}
