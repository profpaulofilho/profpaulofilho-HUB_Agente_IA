'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'

type Message = { role: 'user' | 'assistant'; content: string }
type Agent = {
  id: string; name: string; description: string | null
  provider: string; platform: string; external_url: string
  assistant_id?: string | null
  categories: any
}

function getCat(c: any): string {
  if (!c) return ''
  if (Array.isArray(c)) return c[0]?.name || ''
  return c.name || ''
}
function isGPT(a: Agent) {
  return a.platform?.toLowerCase().includes('gpt') || a.provider?.toLowerCase().includes('openai')
}
function isClaude(a: Agent) {
  return a.platform?.toLowerCase().includes('claude') || a.provider?.toLowerCase().includes('anthropic')
}

// Renderiza markdown simples: negrito, itálico, listas, código, quebras de linha
function renderMarkdown(text: string) {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Lista com bullet
    if (/^[\-\*•]\s/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^[\-\*•]\s/.test(lines[i])) {
        items.push(lines[i].replace(/^[\-\*•]\s/, ''))
        i++
      }
      elements.push(
        <ul key={i} style={{ margin: '8px 0', paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {items.map((item, j) => (
            <li key={j} style={{ fontSize: 13, lineHeight: 1.6 }}>{inlineFormat(item)}</li>
          ))}
        </ul>
      )
      continue
    }

    // Lista numerada
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ''))
        i++
      }
      elements.push(
        <ol key={i} style={{ margin: '8px 0', paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {items.map((item, j) => (
            <li key={j} style={{ fontSize: 13, lineHeight: 1.6 }}>{inlineFormat(item)}</li>
          ))}
        </ol>
      )
      continue
    }

    // Título h2/h3
    if (/^###\s/.test(line)) {
      elements.push(<h3 key={i} style={{ margin: '12px 0 4px', fontSize: 13, fontWeight: 700, color: '#93c5fd' }}>{line.replace(/^###\s/, '')}</h3>)
      i++; continue
    }
    if (/^##\s/.test(line)) {
      elements.push(<h2 key={i} style={{ margin: '14px 0 6px', fontSize: 14, fontWeight: 700, color: '#60a5fa' }}>{line.replace(/^##\s/, '')}</h2>)
      i++; continue
    }

    // Linha em branco
    if (line.trim() === '') {
      elements.push(<div key={i} style={{ height: 8 }} />)
      i++; continue
    }

    // Parágrafo normal
    elements.push(<p key={i} style={{ margin: '2px 0', fontSize: 13, lineHeight: 1.7 }}>{inlineFormat(line)}</p>)
    i++
  }
  return elements
}

function inlineFormat(text: string): React.ReactNode {
  // **negrito**, *itálico*, `código`
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={i} style={{ fontWeight: 700 }}>{part.slice(2, -2)}</strong>
    if (part.startsWith('*') && part.endsWith('*'))
      return <em key={i}>{part.slice(1, -1)}</em>
    if (part.startsWith('`') && part.endsWith('`'))
      return <code key={i} style={{ background: 'rgba(255,255,255,0.1)', padding: '1px 5px', borderRadius: 4, fontSize: 12, fontFamily: 'monospace' }}>{part.slice(1, -1)}</code>
    return part
  })
}

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '4px 2px' }}>
      {[0, 0.2, 0.4].map((d, i) => (
        <div key={i} style={{
          width: 7, height: 7, borderRadius: '50%', background: '#60a5fa',
          animation: `bounce 1.2s ease-in-out ${d}s infinite`,
        }} />
      ))}
    </div>
  )
}

function ChatWindow({ agent }: { agent: Agent }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [threadId, setThreadId] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const hasAssistant = !!agent.assistant_id

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = useCallback(async () => {
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
          assistantId: agent.assistant_id || null,
          threadId,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro na API')
      if (data.threadId) setThreadId(data.threadId)
      setMessages(prev => [...prev, { role: 'assistant', content: data.content }])
    } catch (e: any) {
      setError(e.message || 'Erro ao obter resposta.')
    } finally {
      setLoading(false)
    }
  }, [input, loading, messages, agent, threadId])

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  // Avatar do agente
  const agentAvatar = agent.name.toLowerCase().includes('assis')
    ? <img src="/assis-icon.png" alt="Assis" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
    : <span style={{ fontSize: 18 }}>🤖</span>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <style>{`
        @keyframes bounce { 0%,80%,100%{transform:translateY(0);opacity:0.4} 40%{transform:translateY(-6px);opacity:1} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .msg-anim { animation: fadeIn 0.3s ease forwards; }
        textarea:focus { outline: none; border-color: rgba(37,99,235,0.6) !important; background: rgba(37,99,235,0.05) !important; }
        .send-btn:hover:not(:disabled) { background: #3b82f6 !important; transform: scale(1.05); }
        .send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
      `}</style>

      {/* Messages area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {messages.length === 0 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', textAlign: 'center' }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%', overflow: 'hidden',
              background: 'rgba(37,99,235,0.15)', border: '2px solid rgba(37,99,235,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 16, boxShadow: '0 0 24px rgba(37,99,235,0.2)',
            }}>
              {agentAvatar}
            </div>
            <p style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: '#f1f5f9' }}>{agent.name}</p>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: 'rgba(255,255,255,0.4)', maxWidth: 320, lineHeight: 1.6 }}>
              {agent.description || 'Agente especializado do SENAI Bahia.'}
            </p>
            {hasAssistant && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 20, padding: '5px 12px' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e' }} />
                <span style={{ fontSize: 11, color: '#86efac', fontWeight: 600 }}>Base de conhecimento ativa</span>
              </div>
            )}
            <p style={{ margin: '16px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>
              Digite sua mensagem abaixo para começar
            </p>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className="msg-anim" style={{ display: 'flex', gap: 10, justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', alignItems: 'flex-end' }}>

            {/* Avatar assistente */}
            {m.role === 'assistant' && (
              <div style={{ width: 32, height: 32, borderRadius: '50%', overflow: 'hidden', background: 'rgba(37,99,235,0.2)', border: '1px solid rgba(37,99,235,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {agentAvatar}
              </div>
            )}

            <div style={{
              maxWidth: '78%',
              padding: m.role === 'user' ? '10px 15px' : '14px 16px',
              borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
              background: m.role === 'user'
                ? 'linear-gradient(135deg, #1d4ed8, #2563eb)'
                : 'rgba(255,255,255,0.06)',
              border: m.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.1)',
              color: '#f1f5f9',
              boxShadow: m.role === 'user' ? '0 4px 14px rgba(37,99,235,0.3)' : 'none',
            }}>
              {m.role === 'assistant'
                ? <div style={{ color: '#e2e8f0' }}>{renderMarkdown(m.content)}</div>
                : <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6 }}>{m.content}</p>
              }
            </div>

            {/* Avatar usuário */}
            {m.role === 'user' && (
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#1d4ed8,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 13, fontWeight: 700, color: '#fff' }}>
                U
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="msg-anim" style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', overflow: 'hidden', background: 'rgba(37,99,235,0.2)', border: '1px solid rgba(37,99,235,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {agentAvatar}
            </div>
            <div style={{ padding: '12px 16px', borderRadius: '4px 18px 18px 18px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <TypingIndicator />
            </div>
          </div>
        )}

        {error && (
          <div style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5', fontSize: 12 }}>
            ⚠ {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.25)', flexShrink: 0 }}>
        {hasAssistant && threadId && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
            <button onClick={() => { setMessages([]); setThreadId(null); setError('') }} style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}>
              ↺ Nova conversa
            </button>
          </div>
        )}
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={`Mensagem para ${agent.name}... (Enter para enviar, Shift+Enter para nova linha)`}
            rows={1}
            style={{
              flex: 1, background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 14, padding: '11px 15px',
              fontSize: 13, color: '#f1f5f9', resize: 'none',
              lineHeight: 1.5, maxHeight: 140, overflowY: 'auto',
              fontFamily: 'inherit', transition: 'border-color 0.2s, background 0.2s',
            }}
            onInput={e => {
              const t = e.target as HTMLTextAreaElement
              t.style.height = 'auto'
              t.style.height = Math.min(t.scrollHeight, 140) + 'px'
            }}
          />
          <button
            className="send-btn"
            onClick={send}
            disabled={loading || !input.trim()}
            style={{
              width: 42, height: 42, borderRadius: 12, border: 'none', flexShrink: 0,
              background: input.trim() && !loading ? 'linear-gradient(135deg,#1d4ed8,#3b82f6)' : 'rgba(255,255,255,0.07)',
              color: input.trim() && !loading ? '#fff' : 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              boxShadow: input.trim() && !loading ? '0 4px 14px rgba(37,99,235,0.35)' : 'none',
              fontSize: 18,
            }}
          >
            ↑
          </button>
        </div>
        <p style={{ margin: '6px 0 0', fontSize: 10, color: 'rgba(255,255,255,0.18)', textAlign: 'center' }}>
          {hasAssistant ? '🔍 Pesquisando na base de conhecimento do SENAI Bahia' : 'IA generativa · respostas podem conter erros'}
        </p>
      </div>
    </div>
  )
}

export default function AgentePage({ agent, userEmail }: { agent: Agent; userEmail: string }) {
  const gpt = isGPT(agent)
  const claude = isClaude(agent)
  const catName = getCat(agent.categories)
  const hasAssistant = !!agent.assistant_id
  const isAssis = agent.name.toLowerCase().includes('assis')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#05080f', overflow: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800&display=swap');
        * { font-family: 'Sora', sans-serif; }
        .ext-btn:hover { background: rgba(255,255,255,0.12) !important; }
        .back-btn:hover { background: rgba(255,255,255,0.08) !important; }
      `}</style>

      {/* TOPBAR */}
      <div style={{
        background: 'rgba(5,8,15,0.95)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        padding: '10px 20px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: 12, flexShrink: 0, flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Ícone do agente */}
          <div style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', background: 'rgba(37,99,235,0.2)', border: '1px solid rgba(37,99,235,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {isAssis
              ? <img src="/assis-icon.png" alt="Assis" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: 18 }}>🤖</span>
            }
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{catName}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>{agent.name}</div>
          </div>
          {hasAssistant && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 20, padding: '3px 10px' }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 5px #22c55e' }} />
              <span style={{ fontSize: 10, color: '#86efac', fontWeight: 600 }}>Base ativa</span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{
            padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700,
            background: gpt ? 'rgba(34,197,94,0.1)' : claude ? 'rgba(168,85,247,0.1)' : 'rgba(255,255,255,0.05)',
            color: gpt ? '#86efac' : claude ? '#d8b4fe' : 'rgba(255,255,255,0.4)',
            border: `1px solid ${gpt ? 'rgba(34,197,94,0.2)' : claude ? 'rgba(168,85,247,0.2)' : 'rgba(255,255,255,0.08)'}`,
          }}>
            {agent.provider} · {agent.platform}
          </span>
          <a href={agent.external_url} target="_blank" rel="noopener noreferrer" className="ext-btn" style={{ padding: '5px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', transition: 'background 0.2s' }}>↗ Externo</a>
          <Link href="/admin" className="back-btn" style={{ padding: '5px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', transition: 'background 0.2s' }}>← Voltar</Link>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {agent.description && (
          <div style={{ padding: '8px 20px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
            <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>{agent.description}</p>
          </div>
        )}

        {/* GPT → Chat inline */}
        {gpt && (
          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <ChatWindow agent={agent} />
          </div>
        )}

        {/* Claude → aviso */}
        {claude && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
            <div style={{ maxWidth: 480, textAlign: 'center' }}>
              <div style={{ width: 72, height: 72, borderRadius: 20, background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, margin: '0 auto 20px' }}>🤖</div>
              <h2 style={{ margin: '0 0 10px', fontSize: 22, fontWeight: 700, color: '#f1f5f9' }}>Agente Claude</h2>
              <p style={{ margin: '0 0 28px', fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7 }}>Os agentes da Anthropic (Claude) não permitem incorporação direta. Clique abaixo para abrir numa nova aba.</p>
              <a href={agent.external_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', background: 'linear-gradient(135deg,#7c3aed,#8b5cf6)', color: '#fff', padding: '13px 28px', borderRadius: 12, fontWeight: 700, fontSize: 14, boxShadow: '0 8px 24px rgba(124,58,237,0.35)' }}>Abrir agente Claude ↗</a>
            </div>
          </div>
        )}

        {/* Outros */}
        {!gpt && !claude && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
            <div style={{ maxWidth: 440, textAlign: 'center' }}>
              <div style={{ width: 72, height: 72, borderRadius: 20, background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, margin: '0 auto 20px' }}>🔗</div>
              <h2 style={{ margin: '0 0 10px', fontSize: 22, fontWeight: 700, color: '#f1f5f9' }}>Abrir agente externo</h2>
              <a href={agent.external_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', background: 'linear-gradient(135deg,#1d4ed8,#2563eb)', color: '#fff', padding: '13px 28px', borderRadius: 12, fontWeight: 700, fontSize: 14 }}>Abrir agente ↗</a>
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: '6px 20px', borderTop: '1px solid rgba(255,255,255,0.04)', textAlign: 'center', flexShrink: 0 }}>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.12)' }}>
          Desenvolvido por Paulo da Silva Filho · Especialista de TI · SENAI Bahia · GEP · 2026
        </span>
      </div>
    </div>
  )
}
