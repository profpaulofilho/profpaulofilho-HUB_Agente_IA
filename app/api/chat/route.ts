import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function POST(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll() {},
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  let body: any
  try { body = await request.json() }
  catch { return NextResponse.json({ error: 'Body inválido' }, { status: 400 }) }

  const { messages, agentName, agentDescription, assistantId, threadId } = body
  if (!messages || !Array.isArray(messages))
    return NextResponse.json({ error: 'Mensagens inválidas' }, { status: 400 })

  const openaiKey = process.env.OPENAI_API_KEY
  if (!openaiKey)
    return NextResponse.json({ error: 'OPENAI_API_KEY não configurada.' }, { status: 500 })

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${openaiKey}`,
    'OpenAI-Beta': 'assistants=v2',
  }

  // Se tem assistantId → usa Assistants API com file search
  if (assistantId) {
    try {
      // 1. Cria ou reutiliza thread
      let currentThreadId = threadId
      if (!currentThreadId) {
        const threadRes = await fetch('https://api.openai.com/v1/threads', {
          method: 'POST', headers,
          body: JSON.stringify({}),
        })
        if (!threadRes.ok) throw new Error('Erro ao criar thread')
        const threadData = await threadRes.json()
        currentThreadId = threadData.id
      }

      // 2. Adiciona a última mensagem do usuário na thread
      const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')
      if (!lastUserMsg) return NextResponse.json({ error: 'Sem mensagem do usuário' }, { status: 400 })

      await fetch(`https://api.openai.com/v1/threads/${currentThreadId}/messages`, {
        method: 'POST', headers,
        body: JSON.stringify({ role: 'user', content: lastUserMsg.content }),
      })

      // 3. Dispara o run
      const runRes = await fetch(`https://api.openai.com/v1/threads/${currentThreadId}/runs`, {
        method: 'POST', headers,
        body: JSON.stringify({ assistant_id: assistantId }),
      })
      if (!runRes.ok) throw new Error('Erro ao criar run')
      const runData = await runRes.json()
      const runId = runData.id

      // 4. Polling até completar (max 30s)
      let status = runData.status
      let attempts = 0
      while (!['completed', 'failed', 'cancelled', 'expired'].includes(status) && attempts < 30) {
        await new Promise(r => setTimeout(r, 1000))
        const pollRes = await fetch(`https://api.openai.com/v1/threads/${currentThreadId}/runs/${runId}`, { headers })
        const pollData = await pollRes.json()
        status = pollData.status
        attempts++
      }

      if (status !== 'completed') {
        return NextResponse.json({ error: `Run finalizado com status: ${status}` }, { status: 502 })
      }

      // 5. Busca mensagens da thread
      const msgsRes = await fetch(
        `https://api.openai.com/v1/threads/${currentThreadId}/messages?order=desc&limit=1`,
        { headers }
      )
      const msgsData = await msgsRes.json()
      const lastMsg = msgsData.data?.[0]
      const content = lastMsg?.content?.[0]?.text?.value || 'Sem resposta.'

      // Remove annotations de citação de arquivo [índice†fonte]
      const cleanContent = content.replace(/【\d+:\d+†[^】]*】/g, '').trim()

      return NextResponse.json({ content: cleanContent, threadId: currentThreadId })

    } catch (e: any) {
      return NextResponse.json({ error: 'Erro Assistants API: ' + (e?.message || 'desconhecido') }, { status: 500 })
    }
  }

  // Sem assistantId → fallback para gpt-4o-mini simples
  const systemPrompt = agentDescription
    ? `Você é ${agentName}. ${agentDescription} Responda sempre em português do Brasil.`
    : `Você é ${agentName}, um assistente do SENAI Bahia. Responda sempre em português do Brasil.`

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
      body: JSON.stringify({
        model: 'gpt-4.1-mini-2025-04-14',
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        max_tokens: 1500,
        temperature: 0.7,
      }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return NextResponse.json({ error: err?.error?.message || `Erro OpenAI: HTTP ${res.status}` }, { status: 502 })
    }
    const data = await res.json()
    return NextResponse.json({ content: data.choices?.[0]?.message?.content || 'Sem resposta.' })
  } catch (e: any) {
    return NextResponse.json({ error: 'Erro interno: ' + (e?.message || 'desconhecido') }, { status: 500 })
  }
}
