import { NextResponse } from 'next/server'
import { createClient } from '../../../../lib/supabase/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_APP_URL!))

  const { data: agent } = await supabase.from('agents').select('id, external_url').eq('id', id).single()
  if (!agent) return NextResponse.redirect(new URL('/admin', process.env.NEXT_PUBLIC_APP_URL!))

  await supabase.from('agent_access_logs').insert({ agent_id: agent.id, user_id: user.id, source: 'direct' })
  return NextResponse.redirect(agent.external_url)
}
