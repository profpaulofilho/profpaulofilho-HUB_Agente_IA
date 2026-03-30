'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'
import Link from 'next/link'

// Busca top 5 agentes do Supabase via API pública
function useTopAgents() {
  const [data, setData] = useState<{name:string,total:number}[]>([])
  useEffect(() => {
    const supabase = createClient()
    const startOfMonth = new Date()
    startOfMonth.setDate(1); startOfMonth.setHours(0,0,0,0)
    supabase
      .from('agent_access_logs')
      .select('agents(name)')
      .gte('accessed_at', startOfMonth.toISOString())
      .then(({ data: logs }) => {
        if (!logs) return
        const map = new Map<string,number>()
        logs.forEach((log: any) => {
          const name = Array.isArray(log.agents) ? log.agents[0]?.name : log.agents?.name
          if (name) map.set(name, (map.get(name)||0)+1)
        })
        const sorted = Array.from(map.entries())
          .map(([name,total]) => ({name: name.replace(/^IA\s*[-–]\s*/,''), total}))
          .sort((a,b) => b.total - a.total)
          .slice(0,5)
        setData(sorted)
      })
      .catch(() => {})
  }, [])
  return data
}

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const topAgents = useTopAgents()
  const maxBar = topAgents[0]?.total || 1

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError('E-mail ou senha inválidos.'); setLoading(false); return }
    router.replace('/admin')
  }

  const COLORS = ['#3b82f6','#8b5cf6','#06b6d4','#22c55e','#f59e0b']

  return (
    <main style={{ minHeight:'100vh', background:'#05080f', display:'grid', gridTemplateColumns:'1fr 440px', position:'relative', overflow:'hidden' }}>
      <style>{`
        @keyframes gridShift{0%{background-position:0 0}100%{background-position:40px 40px}}
        @keyframes orbPulse{0%,100%{opacity:.18;transform:scale(1)}50%{opacity:.3;transform:scale(1.08)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0.2}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
        @keyframes barGrow{from{height:0}to{height:var(--h)}}
        .btn-login:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 12px 32px rgba(37,99,235,0.5)!important}
        .form-input:focus{border-color:rgba(37,99,235,0.5)!important;background:rgba(37,99,235,0.06)!important;outline:none}
        .mqct-btn:hover{background:rgba(37,99,235,0.22)!important;border-color:rgba(37,99,235,0.55)!important;transform:translateY(-2px);box-shadow:0 12px 32px rgba(37,99,235,0.25)!important}
        .mqct-btn{transition:all 0.22s!important}
        @media(max-width:860px){.login-left{display:none!important}}
      `}</style>

      {/* Background */}
      <div style={{position:'absolute',inset:0,backgroundImage:'linear-gradient(rgba(37,99,235,0.055) 1px,transparent 1px),linear-gradient(90deg,rgba(37,99,235,0.055) 1px,transparent 1px)',backgroundSize:'40px 40px',animation:'gridShift 25s linear infinite',pointerEvents:'none'}}/>
      <div style={{position:'absolute',width:520,height:520,borderRadius:'50%',background:'#1d4ed8',filter:'blur(130px)',opacity:.16,top:-160,right:400,animation:'orbPulse 8s ease-in-out infinite',pointerEvents:'none'}}/>
      <div style={{position:'absolute',width:360,height:360,borderRadius:'50%',background:'#7c3aed',filter:'blur(110px)',opacity:.12,bottom:-90,left:-70,animation:'orbPulse 10s ease-in-out infinite 3s',pointerEvents:'none'}}/>

      {/* ══════════ LEFT PANEL ══════════ */}
      <div className="login-left" style={{position:'relative',zIndex:10,padding:'40px 44px',display:'flex',flexDirection:'column',gap:28,animation:'fadeUp 0.7s ease forwards'}}>

        {/* Logo + título */}
        <div style={{display:'flex',alignItems:'center',gap:14}}>
          <img src="/senai-logo.png" alt="SENAI" style={{height:46}}/>
          <div style={{width:1,height:34,background:'rgba(255,255,255,0.1)'}}/>
          <div>
            <div style={{fontSize:10,color:'rgba(255,255,255,0.32)',textTransform:'uppercase',letterSpacing:'1px'}}>Portal Interno · Bahia · 2026</div>
            <div style={{fontSize:15,fontWeight:700,color:'#f1f5f9',letterSpacing:'-0.3px'}}>Hub de Agentes de IA</div>
          </div>
        </div>

        {/* Hero text */}
        <div>
          <div style={{display:'inline-flex',alignItems:'center',gap:7,background:'rgba(37,99,235,0.13)',border:'1px solid rgba(37,99,235,0.27)',borderRadius:20,padding:'5px 13px',marginBottom:14,fontSize:10,fontWeight:700,color:'#60a5fa',textTransform:'uppercase',letterSpacing:'0.8px'}}>
            <span style={{width:6,height:6,borderRadius:'50%',background:'#22c55e',boxShadow:'0 0 6px #22c55e',display:'inline-block',animation:'blink 2s ease-in-out infinite'}}/>
            Sistema ativo
          </div>
          <h1 style={{fontSize:34,fontWeight:800,color:'#fff',lineHeight:1.12,letterSpacing:'-1.5px',margin:'0 0 12px'}}>
            Hub de <span style={{color:'#60a5fa'}}>Agentes</span><br/>de Inteligência<br/>Artificial
          </h1>
          <p style={{fontSize:13,color:'rgba(255,255,255,0.42)',lineHeight:1.75,maxWidth:400,fontWeight:300,margin:0}}>
            Plataforma centralizada para acessar, organizar e monitorar os agentes de IA do SENAI Bahia.
          </p>
        </div>

        {/* ── CENTRO: Card MQCT + Gráfico lado a lado ── */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,flex:1,alignContent:'center'}}>

          {/* Card MQCT */}
          <Link href="/mqct" className="mqct-btn" style={{
            display:'flex',flexDirection:'column',justifyContent:'space-between',
            padding:'20px 22px',borderRadius:18,
            background:'rgba(37,99,235,0.1)',border:'1px solid rgba(37,99,235,0.28)',
            boxShadow:'0 6px 20px rgba(37,99,235,0.1)',textDecoration:'none',minHeight:180,
          }}>
            <div>
              <div style={{width:46,height:46,borderRadius:12,background:'linear-gradient(135deg,rgba(37,99,235,0.35),rgba(124,58,237,0.35))',border:'1px solid rgba(37,99,235,0.4)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,marginBottom:12}}>
                🧠
              </div>
              <div style={{fontSize:15,fontWeight:800,color:'#fff',marginBottom:6,letterSpacing:'-0.3px'}}>Agentes IA MQCT</div>
              <div style={{fontSize:12,color:'rgba(255,255,255,0.42)',lineHeight:1.55}}>
                Acesse os agentes de IA dos cursos técnicos do SENAI Bahia sem precisar de login.
              </div>
            </div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:14}}>
              <span style={{fontSize:11,fontWeight:700,color:'#60a5fa',background:'rgba(37,99,235,0.15)',border:'1px solid rgba(37,99,235,0.25)',borderRadius:20,padding:'3px 10px'}}>Acesso livre</span>
              <span style={{fontSize:18,color:'#60a5fa'}}>→</span>
            </div>
          </Link>

          {/* Gráfico de colunas top 5 */}
          <div style={{padding:'18px 20px',borderRadius:18,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',display:'flex',flexDirection:'column',minHeight:180}}>
            <div style={{fontSize:12,fontWeight:700,color:'#f1f5f9',marginBottom:4}}>Top 5 mais usados</div>
            <div style={{fontSize:10,color:'rgba(255,255,255,0.3)',marginBottom:14}}>Acessos no mês atual</div>

            {topAgents.length === 0 ? (
              <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,color:'rgba(255,255,255,0.2)'}}>
                Sem dados ainda
              </div>
            ) : (
              <div style={{flex:1,display:'flex',flexDirection:'column',gap:7,justifyContent:'center'}}>
                {topAgents.map((item, i) => (
                  <div key={item.name} style={{display:'flex',alignItems:'center',gap:8}}>
                    <div style={{width:7,height:7,borderRadius:'50%',background:COLORS[i],flexShrink:0}}/>
                    <div style={{flex:1,fontSize:10,color:'rgba(255,255,255,0.55)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.name}</div>
                    <div style={{width:80,height:6,borderRadius:3,background:'rgba(255,255,255,0.06)',flexShrink:0,overflow:'hidden'}}>
                      <div style={{height:'100%',borderRadius:3,background:COLORS[i],width:`${(item.total/maxBar)*100}%`,transition:'width 0.8s ease'}}/>
                    </div>
                    <div style={{fontSize:10,fontWeight:700,color:COLORS[i],minWidth:18,textAlign:'right',fontFamily:"'JetBrains Mono',monospace"}}>{item.total}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Features em linha */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
          {[
            {icon:'🤖',title:'Agentes IA'},
            {icon:'💬',title:'Chat Inline'},
            {icon:'📊',title:'Métricas'},
            {icon:'⚡',title:'Automação'},
          ].map(f=>(
            <div key={f.title} style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:10,padding:'10px 12px',display:'flex',flexDirection:'column',alignItems:'center',gap:5,textAlign:'center'}}>
              <div style={{fontSize:18}}>{f.icon}</div>
              <div style={{fontSize:10,fontWeight:600,color:'rgba(255,255,255,0.5)'}}>{f.title}</div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{fontSize:10,color:'rgba(255,255,255,0.18)',borderTop:'1px solid rgba(255,255,255,0.06)',paddingTop:14,lineHeight:1.6}}>
          Desenvolvido por <span style={{color:'rgba(255,255,255,0.38)',fontWeight:600}}>Paulo da Silva Filho</span> · Especialista de TI · SENAI Bahia · GEP · 2026
        </div>
      </div>

      {/* ══════════ RIGHT PANEL — Login ══════════ */}
      <div style={{position:'relative',zIndex:10,background:'rgba(255,255,255,0.025)',backdropFilter:'blur(24px)',WebkitBackdropFilter:'blur(24px)',borderLeft:'1px solid rgba(255,255,255,0.07)',padding:'52px 44px',display:'flex',flexDirection:'column',justifyContent:'center',animation:'slideIn 0.5s ease forwards'}}>
        <div style={{marginBottom:32}}>
          <div style={{fontSize:11,fontWeight:700,color:'#60a5fa',textTransform:'uppercase',letterSpacing:'1px',marginBottom:8}}>Acesso restrito</div>
          <h2 style={{fontSize:28,fontWeight:800,color:'#fff',letterSpacing:'-0.5px',lineHeight:1.2,margin:'0 0 8px'}}>Entrar no sistema</h2>
          <p style={{fontSize:13,color:'rgba(255,255,255,0.32)',fontWeight:300,margin:0}}>Utilize suas credenciais institucionais</p>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{marginBottom:16}}>
            <label style={{fontSize:11,fontWeight:700,color:'rgba(255,255,255,0.45)',textTransform:'uppercase',letterSpacing:'0.5px',display:'block',marginBottom:7}}>E-mail</label>
            <input className="form-input" type="email" required placeholder="nome@senai.br" value={email} onChange={e=>setEmail(e.target.value)}
              style={{width:'100%',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,padding:'12px 15px',fontSize:14,color:'#fff',transition:'border-color 0.2s,background 0.2s',boxSizing:'border-box'}}/>
          </div>
          <div style={{marginBottom:6}}>
            <label style={{fontSize:11,fontWeight:700,color:'rgba(255,255,255,0.45)',textTransform:'uppercase',letterSpacing:'0.5px',display:'block',marginBottom:7}}>Senha</label>
            <input className="form-input" type="password" required placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)}
              style={{width:'100%',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,padding:'12px 15px',fontSize:14,color:'#fff',transition:'border-color 0.2s,background 0.2s',boxSizing:'border-box'}}/>
          </div>

          {error && <div style={{margin:'12px 0 0',padding:'10px 14px',background:'rgba(239,68,68,0.12)',border:'1px solid rgba(239,68,68,0.25)',borderRadius:10,fontSize:13,color:'#fca5a5'}}>{error}</div>}

          <button type="submit" className="btn-login" disabled={loading} style={{marginTop:22,width:'100%',background:'linear-gradient(135deg,#1d4ed8,#3b82f6)',color:'#fff',border:'none',borderRadius:10,padding:13,fontSize:14,fontWeight:700,cursor:loading?'not-allowed':'pointer',opacity:loading?0.7:1,boxShadow:'0 8px 24px rgba(37,99,235,0.35)',transition:'transform 0.15s,box-shadow 0.15s,opacity 0.2s',letterSpacing:'0.3px'}}>
            {loading?'Entrando...':'Entrar no Hub →'}
          </button>
        </form>

        <div style={{marginTop:28}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
            <div style={{flex:1,height:1,background:'rgba(255,255,255,0.07)'}}/>
            <span style={{fontSize:10,color:'rgba(255,255,255,0.2)',textTransform:'uppercase',letterSpacing:'1px'}}>Status</span>
            <div style={{flex:1,height:1,background:'rgba(255,255,255,0.07)'}}/>
          </div>
          <div style={{background:'rgba(0,0,0,0.35)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:10,padding:'12px 15px',fontFamily:"'JetBrains Mono',monospace",fontSize:11,lineHeight:1.8,color:'rgba(255,255,255,0.4)'}}>
            <span style={{color:'#4ade80'}}>✓</span> <span style={{color:'#60a5fa'}}>supabase</span> conectado<br/>
            <span style={{color:'#4ade80'}}>✓</span> <span style={{color:'#60a5fa'}}>openai</span>&nbsp;&nbsp; api operacional<br/>
            <span style={{color:'#4ade80'}}>✓</span> <span style={{color:'#60a5fa'}}>agents</span>&nbsp;&nbsp; ativos
            <span style={{display:'inline-block',width:7,height:11,background:'#4ade80',verticalAlign:'middle',marginLeft:4,animation:'blink 1s step-end infinite'}}/>
          </div>
        </div>
      </div>
    </main>
  )
}
