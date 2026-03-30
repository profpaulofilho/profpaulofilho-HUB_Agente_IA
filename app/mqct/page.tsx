import { createClient } from '../../lib/supabase/server'
import Link from 'next/link'

// Agentes excluídos da página pública
const EXCLUDED = ['claude', 'assis', 'organização de ucs', 'organizacao de ucs', 'planta smart']

function isExcluded(name: string) {
  const n = name.toLowerCase()
  return EXCLUDED.some(e => n.includes(e))
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
    <main style={{ minHeight: '100vh', background: '#05080f', position: 'relative', overflow: 'hidden' }}>
      <style>{`
        @keyframes gridShift { 0%{background-position:0 0} 100%{background-position:40px 40px} }
        @keyframes orbPulse { 0%,100%{opacity:.15;transform:scale(1)} 50%{opacity:.28;transform:scale(1.08)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .agent-card:hover { background: rgba(37,99,235,0.1) !important; border-color: rgba(37,99,235,0.35) !important; transform: translateY(-2px); }
        .agent-card { transition: all 0.2s; }
        .open-btn:hover { background: #3b82f6 !important; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(37,99,235,0.4) !important; }
      `}</style>

      {/* Background */}
      <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(37,99,235,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(37,99,235,0.05) 1px,transparent 1px)', backgroundSize:'40px 40px', animation:'gridShift 25s linear infinite', pointerEvents:'none' }} />
      <div style={{ position:'absolute', width:500, height:500, borderRadius:'50%', background:'#1d4ed8', filter:'blur(130px)', opacity:.12, top:-150, right:-100, animation:'orbPulse 8s ease-in-out infinite', pointerEvents:'none' }} />
      <div style={{ position:'absolute', width:350, height:350, borderRadius:'50%', background:'#7c3aed', filter:'blur(100px)', opacity:.1, bottom:-80, left:-60, animation:'orbPulse 10s ease-in-out infinite 3s', pointerEvents:'none' }} />

      <div style={{ position:'relative', zIndex:10, maxWidth:1200, margin:'0 auto', padding:'32px 24px' }}>

        {/* HEADER */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:40, flexWrap:'wrap', gap:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            <img src="/senai-logo.png" alt="SENAI" style={{ height:44 }} />
            <div style={{ width:1, height:32, background:'rgba(255,255,255,0.1)' }} />
            <div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:'1px' }}>Portal de Agentes</div>
              <div style={{ fontSize:16, fontWeight:700, color:'#f1f5f9' }}>Agentes IA · SENAI Bahia</div>
            </div>
          </div>
          <Link href="/login" style={{ padding:'9px 18px', borderRadius:10, fontSize:12, fontWeight:700, background:'rgba(37,99,235,0.15)', border:'1px solid rgba(37,99,235,0.3)', color:'#93c5fd' }}>
            Área restrita →
          </Link>
        </div>

        {/* HERO */}
        <div style={{ textAlign:'center', marginBottom:52, animation:'fadeUp 0.6s ease forwards' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:7, background:'rgba(37,99,235,0.12)', border:'1px solid rgba(37,99,235,0.25)', borderRadius:20, padding:'5px 14px', marginBottom:20 }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background:'#22c55e', boxShadow:'0 0 6px #22c55e' }} />
            <span style={{ fontSize:11, fontWeight:700, color:'#60a5fa', textTransform:'uppercase', letterSpacing:'0.8px' }}>Acesso livre</span>
          </div>
          <h1 style={{ margin:'0 0 14px', fontSize:42, fontWeight:800, color:'#fff', letterSpacing:'-1.5px', lineHeight:1.1 }}>
            Agentes de <span style={{ color:'#60a5fa' }}>Inteligência Artificial</span>
          </h1>
          <p style={{ margin:'0 auto', fontSize:16, color:'rgba(255,255,255,0.45)', maxWidth:580, lineHeight:1.75, fontWeight:300 }}>
            Ferramentas de IA especializadas para os especialistas do SENAI Bahia. Clique em qualquer agente para acessá-lo.
          </p>
        </div>

        {/* CATEGORIES + AGENTS */}
        {grouped.map((cat: any, ci: number) => (
          <div key={cat.id} style={{ marginBottom:40, animation:`fadeUp 0.6s ease ${ci * 0.1}s forwards`, opacity:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:18 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#60a5fa', textTransform:'uppercase', letterSpacing:'1px' }}>{cat.name}</div>
              <div style={{ flex:1, height:1, background:'rgba(37,99,235,0.2)' }} />
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.25)' }}>{cat.agents.length} agente(s)</div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:12 }}>
              {cat.agents.map((agent: any) => (
                <a
                  key={agent.id}
                  href={agent.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="agent-card"
                  style={{
                    display:'flex', alignItems:'center', gap:14,
                    padding:'16px 18px', borderRadius:14,
                    background:'rgba(255,255,255,0.03)',
                    border:'1px solid rgba(255,255,255,0.08)',
                    cursor:'pointer', textDecoration:'none',
                  }}
                >
                  <div style={{ width:40, height:40, borderRadius:10, background:'rgba(37,99,235,0.15)', border:'1px solid rgba(37,99,235,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>
                    🤖
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:'#f1f5f9', marginBottom:3, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{agent.name}</div>
                    {agent.description && (
                      <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', lineHeight:1.4, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' as any }}>{agent.description}</div>
                    )}
                    <div style={{ display:'flex', gap:5, marginTop:6, flexWrap:'wrap' }}>
                      <span style={{ fontSize:9, fontWeight:700, background:'rgba(37,99,235,0.15)', border:'1px solid rgba(37,99,235,0.2)', color:'#93c5fd', borderRadius:20, padding:'2px 7px' }}>{agent.provider}</span>
                      <span style={{ fontSize:9, fontWeight:600, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.4)', borderRadius:20, padding:'2px 7px' }}>{agent.platform}</span>
                    </div>
                  </div>
                  <div style={{ fontSize:16, color:'rgba(37,99,235,0.6)', flexShrink:0 }}>↗</div>
                </a>
              ))}
            </div>
          </div>
        ))}

        <footer style={{ textAlign:'center', padding:'32px 0 16px', color:'rgba(255,255,255,0.15)', fontSize:11 }}>
          Desenvolvido por <span style={{ color:'rgba(255,255,255,0.3)', fontWeight:600 }}>Paulo da Silva Filho</span> · Especialista de TI · SENAI Bahia · GEP · 2026
        </footer>
      </div>
    </main>
  )
}
