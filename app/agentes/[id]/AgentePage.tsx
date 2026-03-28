'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

type Message = { role: 'user' | 'assistant'; content: string }
type Agent = {
  id: string; name: string; description: string | null
  provider: string; platform: string; external_url: string
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

function ChatWindow({ agent }: { agent: Agent }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function send() {
    const text = input.trim()
    if (!text || loading) return
    const newMsgs: Message[] = [...messages, { role: 'user', content: text }]
    setMessages(newMsgs)
    setInput('')
    setLoading(true)
    setError('')
    if (textareaRef.current) { textareaRef.current.style.height = 'auto' }

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMsgs, agentName: agent.name, agentDescription: agent.description }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'Erro na API')
      }
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.content }])
    } catch (e: any) {
      setError(e.message || 'Erro ao obter resposta. Verifique a configuração da OPENAI_API_KEY.')
    } finally {
      setLoading(false)
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', minHeight:0 }}>
      {/* Messages */}
      <div style={{ flex:1, overflowY:'auto', padding:'20px 24px', display:'flex', flexDirection:'column', gap:14 }}>
        {messages.length === 0 && (
          <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 20px', textAlign:'center' }}>
            <div style={{ width:56, height:56, borderRadius:16, background:'rgba(37,99,235,0.15)', border:'1px solid rgba(37,99,235,0.25)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, marginBottom:14 }}>🤖</div>
            <p style={{ margin:'0 0 6px', fontSize:15, fontWeight:700, color:'#e2e8f0' }}>{agent.name}</p>
            <p style={{ margin:0, fontSize:13, color:'rgba(255,255,255,0.3)', maxWidth:280, lineHeight:1.6 }}>
              {agent.description || 'Agente especializado do SENAI Bahia. Inicie uma conversa abaixo.'}
            </p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{ display:'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth:'80%', padding:'11px 15px',
              borderRadius: m.role === 'user' ? '18px 18px 6px 18px' : '18px 18px 18px 6px',
              background: m.role === 'user'
                ? 'linear-gradient(135deg,#1d4ed8,#2563eb)'
                : 'rgba(255,255,255,0.07)',
              border: m.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.1)',
              color: m.role === 'user' ? '#fff' : '#e2e8f0',
              fontSize:13, lineHeight:1.65, whiteSpace:'pre-wrap', wordBreak:'break-word',
              boxShadow: m.role === 'user' ? '0 4px 14px rgba(37,99,235,0.3)' : 'none',
            }}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display:'flex', justifyContent:'flex-start' }}>
            <div style={{ padding:'12px 16px', borderRadius:'18px 18px 18px 6px', background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display:'flex', gap:4, alignItems:'center' }}>
                {[0,0.2,0.4].map((d, i) => (
                  <span key={i} style={{ width:6, height:6, borderRadius:'50%', background:'#60a5fa', display:'inline-block', animation:`bounce 1s ease-in-out ${d}s infinite` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        {error && (
          <div style={{ padding:'10px 14px', borderRadius:10, background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', color:'#fca5a5', fontSize:12 }}>
            ⚠ {error}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding:'14px 18px', borderTop:'1px solid rgba(255,255,255,0.07)', background:'rgba(0,0,0,0.2)', display:'flex', gap:10, alignItems:'flex-end' }}>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder={`Mensagem para ${agent.name}... (Enter para enviar)`}
          rows={1}
          style={{
            flex:1, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)',
            borderRadius:12, padding:'10px 14px', fontSize:13, color:'#f1f5f9',
            resize:'none', outline:'none', lineHeight:1.5, maxHeight:120, overflowY:'auto',
            fontFamily:'inherit', transition:'border-color 0.2s',
          }}
          onInput={e => {
            const t = e.target as HTMLTextAreaElement
            t.style.height = 'auto'
            t.style.height = Math.min(t.scrollHeight, 120) + 'px'
          }}
          onFocus={e => { e.target.style.borderColor = 'rgba(37,99,235,0.5)' }}
          onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.12)' }}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          style={{
            padding:'10px 18px', borderRadius:12, border:'none',
            background: loading || !input.trim() ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg,#1d4ed8,#3b82f6)',
            color: loading || !input.trim() ? 'rgba(255,255,255,0.25)' : '#fff',
            fontSize:13, fontWeight:700, cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            flexShrink:0, transition:'all 0.2s',
            boxShadow: loading || !input.trim() ? 'none' : '0 4px 14px rgba(37,99,235,0.35)',
          }}
        >
          ↑ Enviar
        </button>
      </div>

      <style>{`@keyframes bounce { 0%,80%,100%{transform:scale(0.8);opacity:0.4} 40%{transform:scale(1.2);opacity:1} }`}</style>
    </div>
  )
}

export default function AgentePage({ agent, userEmail }: { agent: Agent; userEmail: string }) {
  const gpt = isGPT(agent)
  const claude = isClaude(agent)
  const catName = getCat(agent.categories)

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', background:'#05080f', overflow:'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800&display=swap');
        * { font-family: 'Sora', sans-serif; }
        .ext-btn:hover { background: rgba(255,255,255,0.12) !important; }
        .back-btn:hover { background: rgba(255,255,255,0.08) !important; }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
      `}</style>

      {/* TOPBAR */}
      <div style={{
        background:'rgba(5,8,15,0.9)', backdropFilter:'blur(20px)',
        borderBottom:'1px solid rgba(255,255,255,0.07)',
        padding:'12px 24px', display:'flex', alignItems:'center',
        justifyContent:'space-between', gap:12, flexShrink:0, flexWrap:'wrap',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <img src="/senai-logo.png" alt="SENAI" style={{ height:30, opacity:1 }} />
          <div style={{ width:1, height:24, background:'rgba(255,255,255,0.1)' }} />
          <div>
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:'0.5px' }}>{catName}</div>
            <div style={{ fontSize:14, fontWeight:700, color:'#f1f5f9', lineHeight:1.2 }}>{agent.name}</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          <span style={{
            padding:'4px 10px', borderRadius:20, fontSize:10, fontWeight:700,
            background: gpt ? 'rgba(34,197,94,0.12)' : claude ? 'rgba(168,85,247,0.12)' : 'rgba(255,255,255,0.07)',
            color: gpt ? '#86efac' : claude ? '#d8b4fe' : 'rgba(255,255,255,0.5)',
            border: `1px solid ${gpt ? 'rgba(34,197,94,0.2)' : claude ? 'rgba(168,85,247,0.2)' : 'rgba(255,255,255,0.1)'}`,
          }}>
            {agent.provider} · {agent.platform}
          </span>
          <a href={agent.external_url} target="_blank" rel="noopener noreferrer" className="ext-btn" style={{
            padding:'6px 12px', borderRadius:8, fontSize:11, fontWeight:600,
            background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)',
            color:'rgba(255,255,255,0.6)', transition:'background 0.2s',
          }}>↗ Externo</a>
          <Link href="/admin" className="back-btn" style={{
            padding:'6px 12px', borderRadius:8, fontSize:11, fontWeight:700,
            background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)',
            color:'rgba(255,255,255,0.6)', transition:'background 0.2s',
          }}>← Voltar</Link>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ flex:1, minHeight:0, display:'flex', flexDirection:'column' }}>
        {/* Description bar */}
        {agent.description && (
          <div style={{ padding:'10px 24px', background:'rgba(255,255,255,0.02)', borderBottom:'1px solid rgba(255,255,255,0.05)', flexShrink:0 }}>
            <p style={{ margin:0, fontSize:12, color:'rgba(255,255,255,0.4)', lineHeight:1.5 }}>{agent.description}</p>
          </div>
        )}

        {/* GPT → Chat inline */}
        {gpt && (
          <div style={{ flex:1, minHeight:0, display:'flex', flexDirection:'column' }}>
            <ChatWindow agent={agent} />
          </div>
        )}

        {/* Claude → aviso + botão */}
        {claude && (
          <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:40 }}>
            <div style={{ maxWidth:480, textAlign:'center' }}>
              <div style={{
                width:72, height:72, borderRadius:20,
                background:'rgba(168,85,247,0.12)', border:'1px solid rgba(168,85,247,0.25)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:36, margin:'0 auto 20px',
              }}>🤖</div>
              <h2 style={{ margin:'0 0 10px', fontSize:22, fontWeight:700, color:'#f1f5f9' }}>Agente Claude</h2>
              <p style={{ margin:'0 0 28px', fontSize:14, color:'rgba(255,255,255,0.4)', lineHeight:1.7 }}>
                Os agentes da Anthropic (Claude) não permitem incorporação direta por política da plataforma.
                Clique abaixo para abrir numa nova aba.
              </p>
              <a href={agent.external_url} target="_blank" rel="noopener noreferrer" style={{
                display:'inline-block', background:'linear-gradient(135deg,#7c3aed,#8b5cf6)',
                color:'#fff', padding:'13px 28px', borderRadius:12,
                fontWeight:700, fontSize:14,
                boxShadow:'0 8px 24px rgba(124,58,237,0.35)',
              }}>
                Abrir agente Claude ↗
              </a>
            </div>
          </div>
        )}

        {/* Outros */}
        {!gpt && !claude && (
          <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:40 }}>
            <div style={{ maxWidth:440, textAlign:'center' }}>
              <div style={{
                width:72, height:72, borderRadius:20,
                background:'rgba(37,99,235,0.12)', border:'1px solid rgba(37,99,235,0.25)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:36, margin:'0 auto 20px',
              }}>🔗</div>
              <h2 style={{ margin:'0 0 10px', fontSize:22, fontWeight:700, color:'#f1f5f9' }}>Abrir agente externo</h2>
              <p style={{ margin:'0 0 28px', fontSize:14, color:'rgba(255,255,255,0.4)', lineHeight:1.7 }}>
                Este agente usa a plataforma <strong style={{ color:'#93c5fd' }}>{agent.platform}</strong>.
                Clique para acessá-lo.
              </p>
              <a href={agent.external_url} target="_blank" rel="noopener noreferrer" style={{
                display:'inline-block', background:'linear-gradient(135deg,#1d4ed8,#2563eb)',
                color:'#fff', padding:'13px 28px', borderRadius:12,
                fontWeight:700, fontSize:14,
                boxShadow:'0 8px 24px rgba(37,99,235,0.35)',
              }}>
                Abrir agente ↗
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding:'8px 24px', borderTop:'1px solid rgba(255,255,255,0.05)', textAlign:'center', flexShrink:0 }}>
        <span style={{ fontSize:10, color:'rgba(255,255,255,0.15)' }}>
          Desenvolvido por Paulo da Silva Filho · Especialista de TI · SENAI Bahia · GEP · 2026
        </span>
      </div>
    </div>
  )
}
