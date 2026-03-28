import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function POST(request: NextRequest) {
  // Verifica auth manualmente sem depender do middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll() {}, // route handlers são read-only para cookies
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const { messages, agentName, agentDescription } = body
  if (!messages || !Array.isArray(messages)) {
    return NextResponse.json({ error: 'Mensagens inválidas' }, { status: 400 })
  }

  const openaiKey = process.env.OPENAI_API_KEY
  if (!openaiKey) {
    return NextResponse.json({
      error: 'OPENAI_API_KEY não configurada no servidor. Adicione esta variável no Render.'
    }, { status: 500 })
  }

  const systemPrompt = agentDescription
    ? `Você é ${agentName}. ${agentDescription} Responda sempre em português do Brasil de forma clara e objetiva.`
    : `Você é ${agentName}, um assistente especializado do SENAI Bahia. Responda sempre em português do Brasil.`

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        max_tokens: 1500,
        temperature: 0.7,
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      const msg = err?.error?.message || `Erro OpenAI: HTTP ${res.status}`
      return NextResponse.json({ error: msg }, { status: 502 })
    }

    const data = await res.json()
    const content = data.choices?.[0]?.message?.content || 'Sem resposta.'
    return NextResponse.json({ content })
  } catch (e: any) {
    return NextResponse.json({ error: 'Erro interno: ' + (e?.message || 'desconhecido') }, { status: 500 })
  }
}
