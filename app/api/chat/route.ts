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

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${openaiKey}`,
    'OpenAI-Beta': 'assistants=v2',
  }

  // ── ASSISTANTS API ──────────────────────────────────────────────
  if (assistantId) {
    try {
      // 1. Cria ou reutiliza thread
      let currentThreadId = threadId
      if (!currentThreadId) {
        const threadRes = await fetch('https://api.openai.com/v1/threads', {
          method: 'POST',
          headers,
          body: JSON.stringify({}),
        })
        const threadData = await threadRes.json()
        if (!threadRes.ok) {
          return NextResponse.json({
            error: `Erro ao criar thread: ${threadData?.error?.message || threadRes.status}`
          }, { status: 502 })
        }
        currentThreadId = threadData.id
      }

      // 2. Adiciona mensagem do usuário
      const lastUserMsg = [...messages].reverse().find((m: any) => m.role === 'user')
      if (!lastUserMsg) return NextResponse.json({ error: 'Sem mensagem do usuário' }, { status: 400 })

      const msgRes = await fetch(`https://api.openai.com/v1/threads/${currentThreadId}/messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ role: 'user', content: lastUserMsg.content }),
      })
      if (!msgRes.ok) {
        const msgErr = await msgRes.json()
        return NextResponse.json({
          error: `Erro ao adicionar mensagem: ${msgErr?.error?.message || msgRes.status}`
        }, { status: 502 })
      }

      // 3. Cria run (sem passar model — o Assistant já tem o modelo configurado)
      const runRes = await fetch(`https://api.openai.com/v1/threads/${currentThreadId}/runs`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ assistant_id: assistantId }),
      })
      const runData = await runRes.json()
      if (!runRes.ok) {
        return NextResponse.json({
          error: `Erro ao criar run: ${runData?.error?.message || runRes.status}`
        }, { status: 502 })
      }
      const runId = runData.id

      // 4. Polling até completar (max 60s)
      let status = runData.status
      let attempts = 0
      while (!['completed', 'failed', 'cancelled', 'expired'].includes(status) && attempts < 60) {
        await new Promise(r => setTimeout(r, 1000))
        const pollRes = await fetch(
          `https://api.openai.com/v1/threads/${currentThreadId}/runs/${runId}`,
          { headers }
        )
        const pollData = await pollRes.json()
        status = pollData.status
        attempts++
      }

      if (status !== 'completed') {
        return NextResponse.json({
          error: `Processamento encerrou com status: ${status}. Tente novamente.`
        }, { status: 502 })
      }

      // 5. Busca última mensagem do assistente
      const msgsRes = await fetch(
        `https://api.openai.com/v1/threads/${currentThreadId}/messages?order=desc&limit=1`,
        { headers }
      )
      const msgsData = await msgsRes.json()
      const lastMsg = msgsData.data?.[0]
      const rawContent = lastMsg?.content?.[0]?.text?.value || 'Sem resposta.'

      // Remove anotações de citação de arquivo 【N:N†fonte】
      const content = rawContent.replace(/【\d+:\d+†[^】]*】/g, '').trim()

      return NextResponse.json({ content, threadId: currentThreadId })

    } catch (e: any) {
      return NextResponse.json({
        error: 'Erro interno Assistants API: ' + (e?.message || 'desconhecido')
      }, { status: 500 })
    }
  }

  // ── FALLBACK: Chat Completions simples ──────────────────────────
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
    const data = await res.json()
    if (!res.ok) {
      return NextResponse.json({
        error: data?.error?.message || `Erro OpenAI: HTTP ${res.status}`
      }, { status: 502 })
    }
    return NextResponse.json({ content: data.choices?.[0]?.message?.content || 'Sem resposta.' })
  } catch (e: any) {
    return NextResponse.json({ error: 'Erro interno: ' + (e?.message || 'desconhecido') }, { status: 500 })
  }
}
