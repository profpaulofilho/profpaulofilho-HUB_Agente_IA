'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'
import Link from 'next/link'

function useTopAgents() {
  const [data, setData] = useState<{name:string,total:number}[]>([])
  useEffect(() => {
    const supabase = createClient()
    const startOfMonth = new Date()
    startOfMonth.setDate(1); startOfMonth.setHours(0,0,0,0)
    async function load() {
      try {
        const { data: logs } = await supabase
          .from('agent_access_logs')
          .select('agents(name)')
          .gte('accessed_at', startOfMonth.toISOString())
        if (!logs) return
        const map = new Map<string,number>()
        logs.forEach((log: any) => {
          const name = Array.isArray(log.agents) ? log.agents[0]?.name : log.agents?.name
          if (name) map.set(name, (map.get(name)||0)+1)
        })
        const sorted = Array.from(map.entries())
          .map(([name,total]) => ({name: name.replace(/^IA\s*[-–]\s*/,''), total}))
          .sort((a,b) => b.total - a.total).slice(0,5)
        setData(sorted)
      } catch { /* sem dados */ }
    }
    load()
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
  const COLORS = ['#3b82f6','#a78bfa','#34d399','#f472b6','#fbbf24']

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError('E-mail ou senha inválidos.'); setLoading(false); return }
    // Aguarda sessão ser persistida antes de redirecionar
    await new Promise(r => setTimeout(r, 300))
    window.location.href = '/admin'
  }

  return (
    <main style={{
      minHeight: '100vh',
      background: '#030712',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <style>{`
        @keyframes drift { 0%{transform:translate(0,0) scale(1)} 50%{transform:translate(30px,-20px) scale(1.05)} 100%{transform:translate(0,0) scale(1)} }
        @keyframes drift2 { 0%{transform:translate(0,0)} 50%{transform:translate(-25px,15px)} 100%{transform:translate(0,0)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.25} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes barIn { from{width:0} to{width:var(--w)} }
        .form-input:focus { border-color:rgba(99,102,241,0.7) !important; background:rgba(99,102,241,0.08) !important; outline:none; }
        .btn-primary:hover:not(:disabled) { filter:brightness(1.12); transform:translateY(-1px); }
        .btn-primary:active { transform:scale(0.99); }
        .mqct-link:hover { border-color:rgba(99,102,241,0.6) !important; background:rgba(99,102,241,0.12) !important; }
        .mqct-link { transition: all 0.2s; }
      `}</style>

      {/* Deep space background orbs */}
      <div style={{position:'absolute',width:700,height:700,borderRadius:'50%',background:'radial-gradient(circle,#1e1b4b,transparent 70%)',top:-200,left:-100,animation:'drift 18s ease-in-out infinite',pointerEvents:'none'}}/>
      <div style={{position:'absolute',width:600,height:600,borderRadius:'50%',background:'radial-gradient(circle,#0f172a,transparent 70%)',bottom:-150,right:-100,animation:'drift2 22s ease-in-out infinite',pointerEvents:'none'}}/>
      <div style={{position:'absolute',inset:0,backgroundImage:'radial-gradient(rgba(99,102,241,0.06) 1px,transparent 1px)',backgroundSize:'28px 28px',pointerEvents:'none'}}/>
      {/* Accent glow lines */}
      <div style={{position:'absolute',top:0,left:0,right:0,height:1,background:'linear-gradient(90deg,transparent,rgba(99,102,241,0.4),transparent)',pointerEvents:'none'}}/>

      {/* ── TOP NAV ── */}
      <nav style={{position:'relative',zIndex:20,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'20px 40px'}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <img src="/senai-logo.png" alt="SENAI" style={{height:36}}/>
          <div style={{width:1,height:24,background:'rgba(255,255,255,0.1)'}}/>
          <div style={{fontSize:11,color:'rgba(255,255,255,0.35)',letterSpacing:'0.5px'}}>Portal Interno · Bahia · 2026</div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <div style={{width:6,height:6,borderRadius:'50%',background:'#22c55e',boxShadow:'0 0 8px #22c55e',animation:'blink 2s ease-in-out infinite'}}/>
          <span style={{fontSize:11,color:'rgba(255,255,255,0.35)',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.8px'}}>Sistema ativo</span>
        </div>
      </nav>

      {/* ── MAIN LAYOUT: 3 colunas ── */}
      <div style={{
        position:'relative',zIndex:10,
        flex:1,
        display:'grid',
        gridTemplateColumns:'1fr 520px 380px',
        gap:0,
        minHeight:0,
        padding:'0 40px 40px',
        alignItems:'center',
      }}>

        {/* COL 1 — Hero */}
        <div style={{paddingRight:40,animation:'fadeUp 0.6s ease forwards'}}>
          <div style={{
            display:'inline-flex',alignItems:'center',gap:8,
            background:'rgba(99,102,241,0.1)',border:'1px solid rgba(99,102,241,0.3)',
            borderRadius:20,padding:'6px 14px',marginBottom:20,
          }}>
            <span style={{fontSize:16}}>🤖</span>
            <span style={{fontSize:11,fontWeight:700,color:'#a5b4fc',textTransform:'uppercase',letterSpacing:'1px'}}>Hub de Agentes IA</span>
          </div>

          <h1 style={{fontSize:48,fontWeight:800,color:'#fff',lineHeight:1.08,letterSpacing:'-2px',margin:'0 0 18px'}}>
            Inteligência<br/>
            <span style={{background:'linear-gradient(135deg,#818cf8,#c084fc)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
              Artificial
            </span><br/>
            para o SENAI
          </h1>

          <p style={{fontSize:14,color:'rgba(255,255,255,0.4)',lineHeight:1.8,maxWidth:340,margin:'0 0 32px',fontWeight:300}}>
            Plataforma centralizada de agentes de IA para os especialistas do SENAI Bahia — tudo num só lugar.
          </p>

          {/* Mini stats */}
          <div style={{display:'flex',gap:24}}>
            {[['9+','Agentes'],['2','Categorias'],['100+','Acessos']].map(([n,l])=>(
              <div key={l}>
                <div style={{fontSize:24,fontWeight:800,color:'#818cf8',letterSpacing:'-1px',fontFamily:'monospace'}}>{n}</div>
                <div style={{fontSize:10,color:'rgba(255,255,255,0.3)',textTransform:'uppercase',letterSpacing:'0.8px'}}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* COL 2 — Card MQCT + Gráfico */}
        <div style={{padding:'0 20px',animation:'fadeUp 0.7s ease 0.1s both'}}>

          {/* Card MQCT — destaque principal */}
          <Link href="/mqct" className="mqct-link" style={{
            display:'block',
            background:'linear-gradient(135deg,rgba(99,102,241,0.15) 0%,rgba(168,85,247,0.1) 100%)',
            border:'1px solid rgba(99,102,241,0.35)',
            borderRadius:20,padding:'24px',marginBottom:16,
            textDecoration:'none',position:'relative',overflow:'hidden',
          }}>
            {/* Shimmer accent */}
            <div style={{position:'absolute',top:0,left:0,right:0,height:1,background:'linear-gradient(90deg,transparent,rgba(99,102,241,0.6),transparent)'}}/>

            <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:14}}>
              <div style={{width:52,height:52,borderRadius:14,background:'linear-gradient(135deg,#4f46e5,#7c3aed)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,boxShadow:'0 8px 20px rgba(79,70,229,0.4)'}}>
                🧠
              </div>
              <div style={{display:'flex',alignItems:'center',gap:6,background:'rgba(34,197,94,0.12)',border:'1px solid rgba(34,197,94,0.25)',borderRadius:20,padding:'4px 10px'}}>
                <div style={{width:5,height:5,borderRadius:'50%',background:'#22c55e',boxShadow:'0 0 6px #22c55e'}}/>
                <span style={{fontSize:10,fontWeight:700,color:'#86efac',letterSpacing:'0.5px'}}>ACESSO LIVRE</span>
              </div>
            </div>

            <div style={{fontSize:20,fontWeight:800,color:'#fff',marginBottom:8,letterSpacing:'-0.5px'}}>
              Agentes IA MQCT
            </div>
            <div style={{fontSize:13,color:'rgba(255,255,255,0.5)',lineHeight:1.6,marginBottom:18}}>
              Acesse os agentes de IA dos cursos técnicos do SENAI Bahia diretamente, sem precisar de login.
            </div>

            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div style={{display:'flex',gap:6}}>
                {['GPT','Claude','Gemini'].map(t=>(
                  <span key={t} style={{fontSize:10,fontWeight:600,background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:20,padding:'3px 8px',color:'rgba(255,255,255,0.5)'}}>{t}</span>
                ))}
              </div>
              <div style={{fontSize:20,color:'#818cf8'}}>→</div>
            </div>
          </Link>

          {/* Gráfico Top 5 */}
          <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:16,padding:'18px 20px'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:'#f1f5f9'}}>Top 5 mais usados</div>
                <div style={{fontSize:10,color:'rgba(255,255,255,0.3)',marginTop:2}}>Acessos no mês</div>
              </div>
              <span style={{fontSize:10,color:'rgba(255,255,255,0.2)',background:'rgba(255,255,255,0.05)',borderRadius:20,padding:'3px 8px'}}>Este mês</span>
            </div>

            {topAgents.length === 0 ? (
              <div style={{textAlign:'center',padding:'16px 0',fontSize:12,color:'rgba(255,255,255,0.2)'}}>Sem dados ainda</div>
            ) : (
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                {topAgents.map((item,i)=>(
                  <div key={item.name}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}>
                      <div style={{display:'flex',alignItems:'center',gap:7}}>
                        <div style={{width:6,height:6,borderRadius:'50%',background:COLORS[i],flexShrink:0}}/>
                        <span style={{fontSize:11,color:'rgba(255,255,255,0.6)',maxWidth:260,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.name}</span>
                      </div>
                      <span style={{fontSize:11,fontWeight:700,color:COLORS[i],fontFamily:'monospace'}}>{item.total}</span>
                    </div>
                    <div style={{height:5,borderRadius:3,background:'rgba(255,255,255,0.06)',overflow:'hidden'}}>
                      <div style={{
                        height:'100%',borderRadius:3,
                        background:`linear-gradient(90deg,${COLORS[i]},${COLORS[i]}88)`,
                        width:`${(item.total/maxBar)*100}%`,
                        transition:'width 1s ease',
                      }}/>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* COL 3 — Login form */}
        <div style={{
          background:'rgba(255,255,255,0.02)',
          backdropFilter:'blur(32px)',
          WebkitBackdropFilter:'blur(32px)',
          border:'1px solid rgba(255,255,255,0.08)',
          borderRadius:24,
          padding:'36px 32px',
          animation:'fadeUp 0.7s ease 0.2s both',
          position:'relative',overflow:'hidden',
        }}>
          <div style={{position:'absolute',top:0,left:0,right:0,height:1,background:'linear-gradient(90deg,transparent,rgba(99,102,241,0.5),transparent)'}}/>

          <div style={{marginBottom:28}}>
            <div style={{fontSize:11,fontWeight:700,color:'#818cf8',textTransform:'uppercase',letterSpacing:'1px',marginBottom:8}}>Acesso restrito</div>
            <h2 style={{fontSize:26,fontWeight:800,color:'#fff',letterSpacing:'-0.5px',margin:'0 0 6px'}}>Entrar no sistema</h2>
            <p style={{fontSize:12,color:'rgba(255,255,255,0.3)',margin:0}}>Use suas credenciais institucionais</p>
          </div>

          <form onSubmit={handleLogin} style={{display:'flex',flexDirection:'column',gap:14}}>
            <div>
              <label style={{fontSize:10,fontWeight:700,color:'rgba(255,255,255,0.4)',textTransform:'uppercase',letterSpacing:'0.8px',display:'block',marginBottom:7}}>E-mail</label>
              <input className="form-input" type="email" required placeholder="nome@senai.br"
                value={email} onChange={e=>setEmail(e.target.value)}
                style={{width:'100%',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,padding:'11px 14px',fontSize:13,color:'#fff',boxSizing:'border-box',transition:'all 0.2s'}}/>
            </div>
            <div>
              <label style={{fontSize:10,fontWeight:700,color:'rgba(255,255,255,0.4)',textTransform:'uppercase',letterSpacing:'0.8px',display:'block',marginBottom:7}}>Senha</label>
              <input className="form-input" type="password" required placeholder="••••••••"
                value={password} onChange={e=>setPassword(e.target.value)}
                style={{width:'100%',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,padding:'11px 14px',fontSize:13,color:'#fff',boxSizing:'border-box',transition:'all 0.2s'}}/>
            </div>

            {error && (
              <div style={{padding:'10px 14px',background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:10,fontSize:12,color:'#fca5a5'}}>{error}</div>
            )}

            <button type="submit" className="btn-primary" disabled={loading} style={{
              marginTop:6,width:'100%',
              background:'linear-gradient(135deg,#4f46e5,#7c3aed)',
              color:'#fff',border:'none',borderRadius:10,
              padding:'13px',fontSize:14,fontWeight:700,
              cursor:loading?'not-allowed':'pointer',
              opacity:loading?0.7:1,
              boxShadow:'0 8px 24px rgba(79,70,229,0.4)',
              transition:'all 0.2s',letterSpacing:'0.3px',
            }}>
              {loading ? 'Entrando...' : 'Entrar no Hub →'}
            </button>
          </form>

          <div style={{marginTop:24,paddingTop:20,borderTop:'1px solid rgba(255,255,255,0.06)'}}>
            <div style={{background:'rgba(0,0,0,0.3)',borderRadius:10,padding:'10px 14px',fontFamily:'monospace',fontSize:10,lineHeight:1.9,color:'rgba(255,255,255,0.35)'}}>
              <span style={{color:'#4ade80'}}>✓</span> supabase <span style={{color:'rgba(255,255,255,0.2)'}}>conectado</span><br/>
              <span style={{color:'#4ade80'}}>✓</span> openai &nbsp;&nbsp;<span style={{color:'rgba(255,255,255,0.2)'}}>operacional</span><br/>
              <span style={{color:'#4ade80'}}>✓</span> agents &nbsp;&nbsp;<span style={{color:'rgba(255,255,255,0.2)'}}>ativos</span>
              <span style={{display:'inline-block',width:6,height:10,background:'#4ade80',verticalAlign:'middle',marginLeft:4,animation:'blink 1s step-end infinite'}}/>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{position:'relative',zIndex:10,textAlign:'center',padding:'0 0 20px',fontSize:10,color:'rgba(255,255,255,0.15)'}}>
        Desenvolvido por <span style={{color:'rgba(255,255,255,0.3)',fontWeight:600}}>Paulo da Silva Filho</span> · Especialista de TI · SENAI Bahia · GEP · 2026
      </div>
    </main>
  )
}
