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

  // Tenta buscar assistant_id — se der erro (coluna não existe), ignora
  let assistantId: string | null = null
  const { data: extra, error: extraError } = await supabase
    .from('agents')
    .select('assistant_id')
    .eq('id', id)
    .single()

  if (!extraError && extra?.assistant_id) {
    assistantId = extra.assistant_id
  }

  // Registra acesso — ignora erro se tabela não tiver a estrutura esperada
  await supabase.from('agent_access_logs').insert({
    agent_id: agent.id, user_id: user.id, source: 'portal',
  }).then(() => {}).catch(() => {})

  return <AgentePage agent={{ ...agent, assistant_id: assistantId } as any} userEmail={user.email || ''} />
}
