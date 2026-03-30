import { createClient } from '../../lib/supabase/server'
import Link from 'next/link'

// Excluídos da página pública
const EXCLUDED = ['claude', 'assis', 'organização de ucs', 'organizacao de ucs']

function isExcluded(name: string) {
  const n = name.toLowerCase()
  return EXCLUDED.some(e => n.includes(e))
}

function isGPT(provider: string, platform: string) {
  return (platform||'').toLowerCase().includes('gpt') || (provider||'').toLowerCase().includes('openai')
}

function getCat(c: any): string {
  if (!c) return ''
  if (Array.isArray(c)) return c[0]?.name || ''
  return c.name || ''
}

// Extrai cursos do nome do agente (separados por , · & e / ou vírgula)
function extractCourses(name: string): string[] {
  // Remove prefixo "IA - " ou "IA – "
  const clean = name.replace(/^IA\s*[-–]\s*/i, '').trim()
  // Divide por separadores comuns
  const parts = clean.split(/[,·&]|\be\b|\//).map((s: string) => s.trim()).filter(Boolean)
  if (parts.length <= 1) return []
  return parts
}

export default async function MQCTPage() {
  const supabase = await createClient()

  const { data: agents } = await supabase
    .from('agents')
    .select(`id, name, description, provider, platform, external_url, categories(id, name, slug)`)
    .eq('is_active', true)
    .order('name')

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order')

  const publicAgents = (agents || []).filter((a: any) => !isExcluded(a.name))

  const grouped = (categories || []).map((cat: any) => ({
    ...cat,
    agents: publicAgents.filter((a: any) => {
      const c = Array.isArray(a.categories) ? a.categories[0] : a.categories
      return c?.id === cat.id
    }),
  })).filter((g: any) => g.agents.length > 0)

  return (
    <main style={{ minHeight:'100vh', background:'#05080f', position:'relative', overflow:'hidden' }}>
      <style>{`
        @keyframes gridShift{0%{background-position:0 0}100%{background-position:40px 40px}}
        @keyframes orbPulse{0%,100%{opacity:.12;transform:scale(1)}50%{opacity:.22;transform:scale(1.06)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        .agent-card:hover{background:rgba(37,99,235,0.12)!important;border-color:rgba(37,99,235,0.4)!important;transform:translateY(-2px);}
        .agent-card{transition:all 0.2s;}
        .open-btn:hover{filter:brightness(1.15);transform:translateY(-1px);}
        .open-btn{transition:all 0.15s;}
        .login-link:hover{background:rgba(255,255,255,0.08)!important;}
        .courses-tooltip{opacity:0;transition:opacity 0.18s,transform 0.18s;transform:translateX(-50%) translateY(4px);}
        .avatar-wrap:hover .courses-tooltip{opacity:1;transform:translateX(-50%) translateY(0);}
      `}</style>

      {/* Background */}
      <div style={{position:'absolute',inset:0,backgroundImage:'linear-gradient(rgba(37,99,235,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(37,99,235,0.05) 1px,transparent 1px)',backgroundSize:'40px 40px',animation:'gridShift 25s linear infinite',pointerEvents:'none'}}/>
      <div style={{position:'absolute',width:500,height:500,borderRadius:'50%',background:'#1d4ed8',filter:'blur(130px)',opacity:.1,top:-150,right:-80,animation:'orbPulse 9s ease-in-out infinite',pointerEvents:'none'}}/>
      <div style={{position:'absolute',width:380,height:380,borderRadius:'50%',background:'#7c3aed',filter:'blur(110px)',opacity:.08,bottom:-80,left:-60,animation:'orbPulse 11s ease-in-out infinite 3s',pointerEvents:'none'}}/>

      <div style={{position:'relative',zIndex:10,maxWidth:1200,margin:'0 auto',padding:'28px 24px'}}>

        {/* HEADER */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:36,flexWrap:'wrap',gap:14}}>
          <div style={{display:'flex',alignItems:'center',gap:14}}>
            <img src="/senai-logo.png" alt="SENAI" style={{height:42}}/>
            <div style={{width:1,height:30,background:'rgba(255,255,255,0.1)'}}/>
            <div>
              <div style={{fontSize:10,color:'rgba(255,255,255,0.3)',textTransform:'uppercase',letterSpacing:'1px'}}>Portal de Agentes</div>
              <div style={{fontSize:15,fontWeight:700,color:'#f1f5f9'}}>Hub de Agentes IA · SENAI Bahia</div>
            </div>
          </div>
          <Link href="/login" className="login-link" style={{padding:'9px 18px',borderRadius:10,fontSize:12,fontWeight:700,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',color:'rgba(255,255,255,0.5)',transition:'background 0.2s'}}>
            Área restrita →
          </Link>
        </div>

        {/* HERO */}
        <div style={{textAlign:'center',marginBottom:48,animation:'fadeUp 0.6s ease forwards'}}>
          <div style={{display:'inline-flex',alignItems:'center',gap:7,background:'rgba(37,99,235,0.12)',border:'1px solid rgba(37,99,235,0.25)',borderRadius:20,padding:'5px 14px',marginBottom:18}}>
            <div style={{width:6,height:6,borderRadius:'50%',background:'#22c55e',boxShadow:'0 0 6px #22c55e'}}/>
            <span style={{fontSize:11,fontWeight:700,color:'#60a5fa',textTransform:'uppercase',letterSpacing:'0.8px'}}>Acesso livre · Sem login</span>
          </div>
          <h1 style={{margin:'0 0 12px',fontSize:40,fontWeight:800,color:'#fff',letterSpacing:'-1.5px',lineHeight:1.1}}>
            Agentes de <span style={{background:'linear-gradient(135deg,#60a5fa,#a78bfa)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Inteligência Artificial</span>
          </h1>
          <p style={{margin:'0 auto',fontSize:15,color:'rgba(255,255,255,0.4)',maxWidth:540,lineHeight:1.75,fontWeight:300}}>
            Ferramentas de IA especializadas para os especialistas e docentes do SENAI Bahia.
          </p>
        </div>

        {/* CATEGORIES + AGENTS */}
        {grouped.map((cat: any, ci: number) => (
          <div key={cat.id} style={{marginBottom:36,animation:`fadeUp 0.6s ease ${0.1 + ci*0.08}s both`}}>
            {/* Category header */}
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
              <div style={{fontSize:10,fontWeight:700,color:'#60a5fa',textTransform:'uppercase',letterSpacing:'1px',whiteSpace:'nowrap'}}>{cat.name}</div>
              <div style={{flex:1,height:1,background:'linear-gradient(90deg,rgba(37,99,235,0.3),transparent)'}}/>
              <div style={{fontSize:10,color:'rgba(255,255,255,0.2)',whiteSpace:'nowrap'}}>{cat.agents.length} agente{cat.agents.length !== 1 ? 's' : ''}</div>
            </div>

            {/* Agents grid — igual aos cards de destaque do admin */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(360px,1fr))',gap:14}}>
              {cat.agents.map((agent: any) => {
                const gpt = isGPT(agent.provider, agent.platform)
                const btnBg = gpt
                  ? 'linear-gradient(135deg,#1d4ed8,#3b82f6)'
                  : 'linear-gradient(135deg,#7c3aed,#8b5cf6)'
                const btnShadow = gpt
                  ? '0 4px 14px rgba(37,99,235,0.4)'
                  : '0 4px 14px rgba(124,58,237,0.4)'

                return (
                  <div key={agent.id} className="agent-card" style={{
                    background:'rgba(255,255,255,0.04)',
                    border:'1px solid rgba(255,255,255,0.09)',
                    borderRadius:18,padding:'20px',
                    display:'flex',gap:16,alignItems:'flex-start',
                  }}>
                    {/* Avatar + Tooltip */}
                    <div style={{position:'relative',flexShrink:0}} className="avatar-wrap">
                      <div style={{width:52,height:52,borderRadius:14,background:gpt?'rgba(37,99,235,0.18)':'rgba(124,58,237,0.18)',border:`1px solid ${gpt?'rgba(37,99,235,0.3)':'rgba(124,58,237,0.3)'}`,display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',boxShadow:`0 4px 14px ${gpt?'rgba(37,99,235,0.2)':'rgba(124,58,237,0.2)'}`}}>
                        {gpt
                          ? <img src="/gpt-icon.png" alt="GPT" style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:14}}/>
                          : <span style={{fontSize:24}}>🤖</span>
                        }
                      </div>
                      {/* Tooltip com cursos */}
                      {extractCourses(agent.name).length > 0 && (
                        <div className="courses-tooltip" style={{
                          position:'absolute',bottom:'calc(100% + 8px)',left:'50%',
                          transform:'translateX(-50%)',
                          background:'rgba(10,12,22,0.97)',
                          border:'1px solid rgba(99,102,241,0.3)',
                          borderRadius:12,padding:'10px 13px',
                          minWidth:180,maxWidth:240,
                          pointerEvents:'none',zIndex:50,
                          boxShadow:'0 8px 24px rgba(0,0,0,0.5)',
                        }}>
                          <div style={{fontSize:9,fontWeight:700,color:'#818cf8',textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:7}}>Cursos atendidos</div>
                          {extractCourses(agent.name).map((curso: string, ci: number) => (
                            <div key={ci} style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}>
                              <div style={{width:4,height:4,borderRadius:'50%',background:'#60a5fa',flexShrink:0}}/>
                              <span style={{fontSize:11,color:'rgba(255,255,255,0.7)',lineHeight:1.4}}>{curso}</span>
                            </div>
                          ))}
                          {/* Arrow */}
                          <div style={{position:'absolute',bottom:-5,left:'50%',transform:'translateX(-50%)',width:8,height:8,background:'rgba(10,12,22,0.97)',border:'1px solid rgba(99,102,241,0.3)',borderTop:'none',borderLeft:'none',rotate:'45deg'}}/>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:15,fontWeight:700,color:'#f1f5f9',marginBottom:4,lineHeight:1.3}}>{agent.name}</div>
                      {agent.description && (
                        <div style={{fontSize:12,color:'rgba(255,255,255,0.4)',lineHeight:1.55,marginBottom:10,overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical' as any}}>{agent.description}</div>
                      )}
                      <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                        <span style={{fontSize:10,fontWeight:700,background:gpt?'rgba(37,99,235,0.12)':'rgba(124,58,237,0.12)',border:`1px solid ${gpt?'rgba(37,99,235,0.25)':'rgba(124,58,237,0.25)'}`,color:gpt?'#93c5fd':'#c4b5fd',borderRadius:20,padding:'2px 9px'}}>{agent.provider}</span>
                        <span style={{fontSize:10,fontWeight:600,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',color:'rgba(255,255,255,0.4)',borderRadius:20,padding:'2px 9px'}}>{agent.platform}</span>
                      </div>
                    </div>

                    {/* Button */}
                    <a href={agent.external_url} target="_blank" rel="noopener noreferrer" className="open-btn" style={{
                      padding:'9px 16px',borderRadius:10,
                      background:btnBg,color:'#fff',
                      fontSize:12,fontWeight:700,flexShrink:0,
                      boxShadow:btnShadow,whiteSpace:'nowrap',
                    }}>
                      Abrir ↗
                    </a>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        <footer style={{textAlign:'center',padding:'28px 0 8px',color:'rgba(255,255,255,0.15)',fontSize:11}}>
          Desenvolvido por <span style={{color:'rgba(255,255,255,0.3)',fontWeight:600}}>Paulo da Silva Filho</span> · Especialista de TI · SENAI Bahia · GEP · 2026
        </footer>
      </div>
    </main>
  )
}
