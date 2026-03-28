'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('E-mail ou senha inválidos. Tente novamente.')
      setLoading(false)
      return
    }

    const next = searchParams.get('next') || '/admin'
    router.replace(next)
  }

  return (
    <main style={{
      minHeight: '100vh',
      background: '#05080f',
      display: 'grid',
      gridTemplateColumns: '1fr 460px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Animated bg grid */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
        @keyframes gridShift { 0%{background-position:0 0} 100%{background-position:40px 40px} }
        @keyframes orbPulse { 0%,100%{opacity:.2;transform:scale(1)} 50%{opacity:.35;transform:scale(1.08)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideIn { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
        .anim-fadeup { animation: fadeUp 0.7s ease forwards; }
        .anim-slideIn { animation: slideIn 0.5s ease forwards; }
        .feat-card:hover { background: rgba(37,99,235,0.12) !important; border-color: rgba(37,99,235,0.3) !important; }
        .btn-login:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 12px 32px rgba(37,99,235,0.5) !important; }
        .btn-login:active { transform: scale(0.99); }
        .form-input:focus { border-color: rgba(37,99,235,0.5) !important; background: rgba(37,99,235,0.06) !important; outline: none; }
        .dot-live { animation: blink 2s ease-in-out infinite; }
        @media (max-width: 768px) {
          .login-layout { grid-template-columns: 1fr !important; }
          .left-panel { display: none !important; }
          .right-panel { border-left: none !important; padding: 40px 28px !important; }
        }
      `}</style>

      {/* Orbs */}
      <div style={{ position:'absolute', width:'500px', height:'500px', borderRadius:'50%', background:'#1d4ed8', filter:'blur(120px)', opacity:.18, top:'-150px', right:'380px', animation:'orbPulse 7s ease-in-out infinite', pointerEvents:'none' }} />
      <div style={{ position:'absolute', width:'350px', height:'350px', borderRadius:'50%', background:'#7c3aed', filter:'blur(100px)', opacity:.14, bottom:'-100px', left:'-80px', animation:'orbPulse 9s ease-in-out infinite 3s', pointerEvents:'none' }} />
      <div style={{ position:'absolute', width:'200px', height:'200px', borderRadius:'50%', background:'#0891b2', filter:'blur(80px)', opacity:.12, top:'40%', left:'38%', animation:'orbPulse 6s ease-in-out infinite 1.5s', pointerEvents:'none' }} />

      {/* Grid bg */}
      <div style={{
        position:'absolute', inset:0, pointerEvents:'none',
        backgroundImage:'linear-gradient(rgba(37,99,235,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(37,99,235,0.06) 1px,transparent 1px)',
        backgroundSize:'40px 40px',
        animation:'gridShift 25s linear infinite',
      }} />

      {/* LEFT PANEL */}
      <div className="left-panel anim-fadeup" style={{
        position:'relative', zIndex:10,
        padding:'48px 44px',
        display:'flex', flexDirection:'column', justifyContent:'center', gap:'32px',
      }}>
        {/* Logo SENAI */}
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <img src="/senai-logo.png" alt="SENAI" style={{ height:48, opacity:1 }} />
          <div style={{ width:1, height:36, background:'rgba(255,255,255,0.12)' }} />
          <span style={{ fontSize:11, color:'rgba(255,255,255,0.35)', fontWeight:400, lineHeight:1.4, maxWidth:110 }}>
            Portal Interno<br/>Bahia · 2026
          </span>
        </div>

        {/* Hero */}
        <div>
          <div style={{
            display:'inline-flex', alignItems:'center', gap:7,
            background:'rgba(37,99,235,0.14)', border:'1px solid rgba(37,99,235,0.28)',
            borderRadius:20, padding:'5px 13px', marginBottom:18,
            fontSize:10, fontWeight:700, color:'#60a5fa',
            textTransform:'uppercase', letterSpacing:'0.8px',
          }}>
            <span className="dot-live" style={{ width:6, height:6, borderRadius:'50%', background:'#22c55e', boxShadow:'0 0 6px #22c55e' }} />
            Sistema ativo
          </div>

          <h1 style={{
            fontSize:38, fontWeight:800, color:'#fff', lineHeight:1.12,
            letterSpacing:'-1.5px', margin:'0 0 14px',
          }}>
            Hub de <span style={{ color:'#60a5fa' }}>Agentes</span><br/>
            de Inteligência<br/>Artificial
          </h1>

          <p style={{ fontSize:14, color:'rgba(255,255,255,0.45)', lineHeight:1.75, maxWidth:420, fontWeight:300 }}>
            Plataforma centralizada para acessar, organizar e monitorar os agentes de IA
            utilizados pelos especialistas do SENAI Bahia.
          </p>
        </div>

        {/* Feature cards */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, maxWidth:460 }}>
          {[
            { icon:'🤖', color:'rgba(37,99,235,0.18)', title:'Agentes IA', desc:'GPT, Claude e outros num só lugar' },
            { icon:'💬', color:'rgba(124,58,237,0.18)', title:'Chat Inline', desc:'Converse com agentes diretamente' },
            { icon:'📊', color:'rgba(8,145,178,0.18)', title:'Métricas', desc:'Uso e acessos em tempo real' },
            { icon:'⚡', color:'rgba(22,163,74,0.18)', title:'Resolução Rápida', desc:'Automação e suporte técnico' },
          ].map((f) => (
            <div key={f.title} className="feat-card" style={{
              background:'rgba(255,255,255,0.04)',
              border:'1px solid rgba(255,255,255,0.08)',
              borderRadius:12, padding:'14px 15px',
              display:'flex', gap:10, alignItems:'flex-start',
              transition:'background 0.2s, border-color 0.2s', cursor:'default',
            }}>
              <div style={{ width:32, height:32, borderRadius:8, background:f.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>
                {f.icon}
              </div>
              <div>
                <div style={{ fontSize:12, fontWeight:700, color:'#e2e8f0', marginBottom:3 }}>{f.title}</div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.38)', lineHeight:1.45 }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div style={{ display:'flex', gap:28 }}>
          {[['9+','Agentes ativos'],['2','Categorias'],['50+','Acessos / mês']].map(([n, l]) => (
            <div key={l}>
              <div style={{ fontSize:22, fontWeight:800, color:'#60a5fa', letterSpacing:'-0.5px', fontFamily:"'JetBrains Mono', monospace" }}>{n}</div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:'0.8px', marginTop:3 }}>{l}</div>
            </div>
          ))}
        </div>

        {/* Dev credit */}
        <div style={{ fontSize:11, color:'rgba(255,255,255,0.2)', borderTop:'1px solid rgba(255,255,255,0.06)', paddingTop:16, lineHeight:1.6 }}>
          Desenvolvido por <span style={{ color:'rgba(255,255,255,0.4)', fontWeight:600 }}>Paulo da Silva Filho</span><br/>
          Especialista de TI · SENAI Bahia · GEP · 2026
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="right-panel anim-slideIn" style={{
        position:'relative', zIndex:10,
        background:'rgba(255,255,255,0.025)',
        backdropFilter:'blur(24px)',
        WebkitBackdropFilter:'blur(24px)',
        borderLeft:'1px solid rgba(255,255,255,0.07)',
        padding:'52px 44px',
        display:'flex', flexDirection:'column', justifyContent:'center',
      }}>
        <div style={{ marginBottom:32 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#60a5fa', textTransform:'uppercase', letterSpacing:'1px', marginBottom:8 }}>
            Acesso restrito
          </div>
          <h2 style={{ fontSize:28, fontWeight:800, color:'#fff', letterSpacing:'-0.5px', lineHeight:1.2, margin:'0 0 8px' }}>
            Entrar no sistema
          </h2>
          <p style={{ fontSize:13, color:'rgba(255,255,255,0.32)', fontWeight:300, margin:0 }}>
            Utilize suas credenciais institucionais
          </p>
        </div>

        <form onSubmit={handleLogin} style={{ display:'grid', gap:0 }}>
          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.45)', textTransform:'uppercase', letterSpacing:'0.5px', display:'block', marginBottom:7 }}>
              E-mail
            </label>
            <input
              className="form-input"
              type="email" required
              placeholder="nome@senai.br"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{
                width:'100%', background:'rgba(255,255,255,0.05)',
                border:'1px solid rgba(255,255,255,0.1)', borderRadius:10,
                padding:'12px 15px', fontSize:14, color:'#fff',
                transition:'border-color 0.2s, background 0.2s',
              }}
            />
          </div>

          <div style={{ marginBottom:6 }}>
            <label style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.45)', textTransform:'uppercase', letterSpacing:'0.5px', display:'block', marginBottom:7 }}>
              Senha
            </label>
            <input
              className="form-input"
              type="password" required
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{
                width:'100%', background:'rgba(255,255,255,0.05)',
                border:'1px solid rgba(255,255,255,0.1)', borderRadius:10,
                padding:'12px 15px', fontSize:14, color:'#fff',
                transition:'border-color 0.2s, background 0.2s',
              }}
            />
          </div>

          {error && (
            <div style={{
              margin:'12px 0 0', padding:'10px 14px',
              background:'rgba(239,68,68,0.12)',
              border:'1px solid rgba(239,68,68,0.25)',
              borderRadius:10, fontSize:13, color:'#fca5a5',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn-login"
            disabled={loading}
            style={{
              marginTop:22, width:'100%',
              background:'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)',
              color:'#fff', border:'none', borderRadius:10,
              padding:'13px', fontSize:14, fontWeight:700,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              boxShadow:'0 8px 24px rgba(37,99,235,0.35)',
              transition:'transform 0.15s, box-shadow 0.15s, opacity 0.2s',
              letterSpacing:'0.3px',
            }}
          >
            {loading ? 'Entrando...' : 'Entrar no Hub →'}
          </button>
        </form>

        {/* System status terminal */}
        <div style={{ marginTop:28 }}>
          <div style={{
            display:'flex', alignItems:'center', gap:8,
            marginBottom:10,
          }}>
            <div style={{ flex:1, height:'1px', background:'rgba(255,255,255,0.07)' }} />
            <span style={{ fontSize:10, color:'rgba(255,255,255,0.2)', textTransform:'uppercase', letterSpacing:'1px' }}>Status</span>
            <div style={{ flex:1, height:'1px', background:'rgba(255,255,255,0.07)' }} />
          </div>
          <div style={{
            background:'rgba(0,0,0,0.35)',
            border:'1px solid rgba(255,255,255,0.07)',
            borderRadius:10, padding:'12px 15px',
            fontFamily:"'JetBrains Mono', monospace",
            fontSize:11, lineHeight:1.8,
            color:'rgba(255,255,255,0.4)',
          }}>
            <span style={{ color:'#4ade80' }}>✓</span> <span style={{ color:'#60a5fa' }}>supabase</span> conectado<br/>
            <span style={{ color:'#4ade80' }}>✓</span> <span style={{ color:'#60a5fa' }}>openai</span>&nbsp;&nbsp; api operacional<br/>
            <span style={{ color:'#4ade80' }}>✓</span> <span style={{ color:'#60a5fa' }}>agents</span>&nbsp;&nbsp; 9 ativos
            <span style={{ display:'inline-block', width:7, height:11, background:'#4ade80', verticalAlign:'middle', marginLeft:4, animation:'blink 1s step-end infinite' }} />
          </div>
        </div>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}
