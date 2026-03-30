'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

type Message = { role: 'user' | 'assistant'; content: string }
type Agent = {
  id: string
  name: string
  description: string | null
  provider: string
  platform: string
  external_url: string
  assistant_id?: string | null
  categories: any
}

function getCat(c: any): string {
  if (!c) return ''
  if (Array.isArray(c)) return c[0]?.name || ''
  return c.name || ''
}
function isGPT(a: Agent) {
  return (a.platform || '').toLowerCase().includes('gpt') || (a.provider || '').toLowerCase().includes('openai')
}
function isClaude(a: Agent) {
  return (a.platform || '').toLowerCase().includes('claude') || (a.provider || '').toLowerCase().includes('anthropic')
}
function isAssis(a: Agent) {
  return (a.name || '').toLowerCase().includes('assis')
}

function Markdown({ text }: { text: string }) {
  const lines = text.split('\n')
  return (
    <div style={{ fontSize: 13, lineHeight: 1.7, color: '#e2e8f0' }}>
      {lines.map((line, i) => {
        if (line.startsWith('### ')) return <h3 key={i} style={{ margin: '10px 0 4px', fontSize: 13, fontWeight: 700, color: '#93c5fd' }}>{line.slice(4)}</h3>
        if (line.startsWith('## ')) return <h2 key={i} style={{ margin: '12px 0 4px', fontSize: 14, fontWeight: 700, color: '#60a5fa' }}>{line.slice(3)}</h2>
        if (line.startsWith('# ')) return <h1 key={i} style={{ margin: '14px 0 6px', fontSize: 15, fontWeight: 800, color: '#60a5fa' }}>{line.slice(2)}</h1>
        if (/^[-*•] /.test(line)) return <div key={i} style={{ paddingLeft: 16, margin: '2px 0' }}>• {fmt(line.slice(2))}</div>
        if (/^\d+\. /.test(line)) return <div key={i} style={{ paddingLeft: 16, margin: '2px 0' }}>{line}</div>
        if (line.trim() === '') return <div key={i} style={{ height: 8 }} />
        return <p key={i} style={{ margin: '2px 0' }}>{fmt(line)}</p>
      })}
    </div>
  )
}

function fmt(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>
    if (part.startsWith('*') && part.endsWith('*')) return <em key={i}>{part.slice(1, -1)}</em>
    if (part.startsWith('`') && part.endsWith('`')) return <code key={i} style={{ background: 'rgba(255,255,255,0.1)', padding: '1px 5px', borderRadius: 4, fontFamily: 'monospace', fontSize: 12 }}>{part.slice(1, -1)}</code>
    return part
  })
}

function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 4, padding: '4px 2px' }}>
      {[0, 0.2, 0.4].map((d, i) => (
        <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: '#60a5fa', animation: `tdot 1.2s ease-in-out ${d}s infinite` }} />
      ))}
    </div>
  )
}

function ChatWindow({ agent, resolvedAssistantId }: { agent: Agent; resolvedAssistantId: string | null }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [threadId, setThreadId] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function send() {
    const text = input.trim()
    if (!text || loading) return
    const newMsgs: Message[] = [...messages, { role: 'user', content: text }]
    setMessages(newMsgs)
    setInput('')
    setLoading(true)
    setError('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMsgs,
          agentName: agent.name,
          agentDescription: agent.description,
          assistantId: resolvedAssistantId,
          threadId,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Erro HTTP ${res.status}`)
      if (data.threadId) setThreadId(data.threadId)
      setMessages(prev => [...prev, { role: 'assistant', content: data.content }])
    } catch (e: any) {
      setError(e.message || 'Erro ao obter resposta.')
    } finally {
      setLoading(false)
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const avatarEl = isAssis(agent)
    ? <img src="/assis-icon.png" alt="Assis" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    : <span style={{ fontSize: 16 }}>🤖</span>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {messages.length === 0 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 40 }}>
            <div style={{ width: 68, height: 68, borderRadius: '50%', overflow: 'hidden', background: 'rgba(37,99,235,0.15)', border: '2px solid rgba(37,99,235,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, boxShadow: '0 0 24px rgba(37,99,235,0.2)' }}>
              {avatarEl}
            </div>
            <p style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: '#f1f5f9' }}>{agent.name}</p>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: 'rgba(255,255,255,0.4)', maxWidth: 300, lineHeight: 1.6 }}>
              {agent.description || 'Agente especializado do SENAI Bahia.'}
            </p>
            {resolvedAssistantId && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 20, padding: '4px 12px' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e' }} />
                <span style={{ fontSize: 11, color: '#86efac', fontWeight: 600 }}>Base de conhecimento ativa</span>
              </div>
            )}
            <p style={{ margin: '14px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>Digite abaixo para começar</p>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', alignItems: 'flex-end' }}>
            {m.role === 'assistant' && (
              <div style={{ width: 30, height: 30, borderRadius: '50%', overflow: 'hidden', background: 'rgba(37,99,235,0.2)', border: '1px solid rgba(37,99,235,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {avatarEl}
              </div>
            )}
            <div style={{
              maxWidth: '78%', padding: m.role === 'user' ? '10px 14px' : '12px 16px',
              borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
              background: m.role === 'user' ? 'linear-gradient(135deg,#1d4ed8,#2563eb)' : 'rgba(255,255,255,0.07)',
              border: m.role === 'assistant' ? '1px solid rgba(255,255,255,0.1)' : 'none',
              boxShadow: m.role === 'user' ? '0 4px 14px rgba(37,99,235,0.3)' : 'none',
            }}>
              {m.role === 'assistant' ? <Markdown text={m.content} /> : <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: '#fff' }}>{m.content}</p>}
            </div>
            {m.role === 'user' && (
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#1d4ed8,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12, fontWeight: 700, color: '#fff' }}>U</div>
            )}
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', overflow: 'hidden', background: 'rgba(37,99,235,0.2)', border: '1px solid rgba(37,99,235,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {avatarEl}
            </div>
            <div style={{ padding: '12px 16px', borderRadius: '4px 18px 18px 18px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <TypingDots />
            </div>
          </div>
        )}

        {error && (
          <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5', fontSize: 12 }}>
            ⚠ {error}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.2)', flexShrink: 0 }}>
        {resolvedAssistantId && threadId && (
          <div style={{ textAlign: 'right', marginBottom: 6 }}>
            <button onClick={() => { setMessages([]); setThreadId(null); setError('') }}
              style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', background: 'none', border: 'none', cursor: 'pointer' }}>
              ↺ Nova conversa
            </button>
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={`Mensagem para ${agent.name}...`}
            rows={1}
            style={{
              flex: 1, background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12,
              padding: '10px 14px', fontSize: 13, color: '#f1f5f9',
              resize: 'none', lineHeight: 1.5, maxHeight: 130,
              fontFamily: 'inherit', outline: 'none',
            }}
            onInput={e => {
              const t = e.target as HTMLTextAreaElement
              t.style.height = 'auto'
              t.style.height = Math.min(t.scrollHeight, 130) + 'px'
            }}
            onFocus={e => { e.target.style.borderColor = 'rgba(37,99,235,0.5)' }}
            onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.12)' }}
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            style={{
              width: 40, height: 40, borderRadius: 10, border: 'none', flexShrink: 0,
              background: input.trim() && !loading ? 'linear-gradient(135deg,#1d4ed8,#3b82f6)' : 'rgba(255,255,255,0.06)',
              color: input.trim() && !loading ? '#fff' : 'rgba(255,255,255,0.2)',
              fontSize: 18, cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s',
            }}
          >↑</button>
        </div>
        <p style={{ margin: '5px 0 0', fontSize: 10, color: 'rgba(255,255,255,0.18)', textAlign: 'center' }}>
          {resolvedAssistantId ? '🔍 Pesquisando na base de conhecimento do SENAI Bahia' : 'Enter para enviar · Shift+Enter para nova linha'}
        </p>
      </div>
    </div>
  )
}

export default function AgentePage({ agent, userEmail }: { agent: Agent; userEmail: string }) {
  const gpt = isGPT(agent)
  const claude = isClaude(agent)
  const catName = getCat(agent.categories)

  // Busca assistant_id FRESCO do banco via API — sem cache do Next.js
  const [resolvedAssistantId, setResolvedAssistantId] = useState<string | null>(null)
  const [loadingAssistant, setLoadingAssistant] = useState(gpt)

  useEffect(() => {
    if (!gpt) return
    fetch(`/api/agente?id=${agent.id}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(data => {
        setResolvedAssistantId(data.assistant_id || null)
        setLoadingAssistant(false)
      })
      .catch(() => setLoadingAssistant(false))
  }, [agent.id, gpt])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#05080f', overflow: 'hidden' }}>
      <style>{`
        * { box-sizing: border-box; font-family: 'Sora', 'Segoe UI', sans-serif; }
        @keyframes tdot { 0%,80%,100%{transform:translateY(0);opacity:0.4} 40%{transform:translateY(-5px);opacity:1} }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
      `}</style>

      {/* TOPBAR */}
      <div style={{ background: 'rgba(5,8,15,0.95)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexShrink: 0, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', overflow: 'hidden', background: 'rgba(37,99,235,0.2)', border: '1px solid rgba(37,99,235,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {isAssis(agent) ? <img src="/assis-icon.png" alt="Assis" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 16 }}>🤖</span>}
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{catName}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>{agent.name}</div>
          </div>
          {resolvedAssistantId && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 20, padding: '3px 10px' }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 5px #22c55e' }} />
              <span style={{ fontSize: 10, color: '#86efac', fontWeight: 600 }}>Base ativa</span>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: gpt ? 'rgba(34,197,94,0.1)' : 'rgba(168,85,247,0.1)', color: gpt ? '#86efac' : '#d8b4fe', border: `1px solid ${gpt ? 'rgba(34,197,94,0.2)' : 'rgba(168,85,247,0.2)'}` }}>
            {agent.provider} · {agent.platform}
          </span>
          <a href={agent.external_url} target="_blank" rel="noopener noreferrer" style={{ padding: '5px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>↗ Externo</a>
          <Link href="/admin" style={{ padding: '5px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>← Voltar</Link>
        </div>
      </div>

      {agent.description && (
        <div style={{ padding: '8px 20px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
          <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>{agent.description}</p>
        </div>
      )}

      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {gpt && !loadingAssistant && <ChatWindow agent={agent} resolvedAssistantId={resolvedAssistantId} />}
        {gpt && loadingAssistant && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>Carregando agente...</div>
          </div>
        )}
        {claude && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
            <div style={{ maxWidth: 440, textAlign: 'center' }}>
              <div style={{ width: 70, height: 70, borderRadius: 20, background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, margin: '0 auto 18px' }}>🤖</div>
              <h2 style={{ margin: '0 0 10px', fontSize: 20, fontWeight: 700, color: '#f1f5f9' }}>Agente Claude</h2>
              <p style={{ margin: '0 0 24px', fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7 }}>Os agentes da Anthropic não permitem incorporação direta.</p>
              <a href={agent.external_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', background: 'linear-gradient(135deg,#7c3aed,#8b5cf6)', color: '#fff', padding: '12px 26px', borderRadius: 12, fontWeight: 700, fontSize: 14 }}>Abrir agente Claude ↗</a>
            </div>
          </div>
        )}
        {!gpt && !claude && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
            <div style={{ maxWidth: 400, textAlign: 'center' }}>
              <div style={{ width: 70, height: 70, borderRadius: 20, background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, margin: '0 auto 18px' }}>🔗</div>
              <h2 style={{ margin: '0 0 10px', fontSize: 20, fontWeight: 700, color: '#f1f5f9' }}>Abrir agente externo</h2>
              <a href={agent.external_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', background: 'linear-gradient(135deg,#1d4ed8,#2563eb)', color: '#fff', padding: '12px 26px', borderRadius: 12, fontWeight: 700, fontSize: 14 }}>Abrir agente ↗</a>
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: '6px 20px', borderTop: '1px solid rgba(255,255,255,0.04)', textAlign: 'center', flexShrink: 0 }}>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.12)' }}>Desenvolvido por Paulo da Silva Filho · Especialista de TI · SENAI Bahia · GEP · 2026</span>
      </div>
    </div>
  )
}
