import { redirect } from 'next/navigation'
import { createClient } from '../../../lib/supabase/server'
import AgentePage from './AgentePage'

export default async function AgenteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  let supabase: any
  try {
    const { createClient: create } = await import('../../../lib/supabase/server')
    supabase = await create()
  } catch {
    redirect('/login')
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: agent, error: agentError } = await supabase
    .from('agents')
    .select(`id, name, description, provider, platform, external_url, categories(id, name)`)
    .eq('id', id)
    .single()

  if (agentError || !agent) redirect('/admin')

  // Busca assistant_id — ignora se coluna não existir
  let assistantId: string | null = null
  try {
    const { data: extra } = await supabase
      .from('agents')
      .select('assistant_id')
      .eq('id', id)
      .single()
    if (extra?.assistant_id) assistantId = extra.assistant_id
  } catch { /* coluna não existe */ }

  // Registra acesso sem await para não bloquear renderização
  supabase.from('agent_access_logs').insert({
    agent_id: agent.id,
    user_id: user.id,
    source: 'portal',
  }).catch(() => {})

  const agentData = {
    id: agent.id,
    name: agent.name || '',
    description: agent.description || null,
    provider: agent.provider || '',
    platform: agent.platform || '',
    external_url: agent.external_url || '',
    assistant_id: assistantId,
    categories: agent.categories || null,
  }

  return <AgentePage agent={agentData} userEmail={user.email || ''} />
}
