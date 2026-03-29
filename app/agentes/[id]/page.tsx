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

  // Busca sem assistant_id primeiro
  const { data: agent } = await supabase
    .from('agents')
    .select(`id, name, description, provider, platform, external_url, categories(id, name)`)
    .eq('id', id)
    .single()

  if (!agent) redirect('/admin')

  // Tenta buscar assistant_id separadamente
  let assistantId: string | null = null
  try {
    const { data: extra } = await supabase
      .from('agents')
      .select('assistant_id')
      .eq('id', id)
      .single()
    assistantId = extra?.assistant_id || null
  } catch { /* coluna não existe ainda */ }

  await supabase.from('agent_access_logs').insert({
    agent_id: agent.id, user_id: user.id, source: 'portal',
  })

  return <AgentePage agent={{ ...agent, assistant_id: assistantId } as any} userEmail={user.email || ''} />
}
