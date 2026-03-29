import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '../../lib/supabase/server'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) redirect('/login')

  const { data: agents } = await supabase
    .from('agents')
    .select(`id, name, provider, platform, external_url, description, assistant_id,
      categories (id, name, description)`)
    .eq('is_active', true).order('name')

  const { data: categories } = await supabase
    .from('categories').select('*').order('sort_order')

  const startOfMonth = new Date()
  startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0)

  const { data: logs } = await supabase
    .from('agent_access_logs')
    .select(`user_id, agent_id, accessed_at, agents (id, name, categories (id, name))`)
    .gte('accessed_at', startOfMonth.toISOString())

  const totalAgents = agents?.length || 0
  const totalCategories = categories?.length || 0
  const providers = new Set((agents || []).map((a: any) => a.provider))
  const totalMonthAccess = logs?.length || 0
  const activeUsersMonth = new Set((logs || []).map((log: any) => log.user_id)).size

  const usageMap = new Map<string, number>()
  for (const log of logs || []) {
    const name = Array.isArray((log as any).agents) ? (log as any).agents[0]?.name : (log as any).agents?.name
    if (name) usageMap.set(name, (usageMap.get(name) || 0) + 1)
  }
  const topAgents = Array.from(usageMap.entries()).map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total).slice(0, 5)
  const maxBar = topAgents[0]?.total || 1

  const catUsageMap = new Map<string, number>()
  for (const log of logs || []) {
    const a = Array.isArray((log as any).agents) ? (log as any).agents[0] : (log as any).agents
    const c = Array.isArray(a?.categories) ? a?.categories[0] : a?.categories
    if (c?.name) catUsageMap.set(c.name, (catUsageMap.get(c.name) || 0) + 1)
  }
  const topCategories = Array.from(catUsageMap.entries()).map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total)

  const groupedAgents = categories?.map((category: any) => ({
    ...category,
    agents: (agents || []).filter((agent: any) => {
      const cat = Array.isArray(agent.categories) ? agent.categories[0] : agent.categories
      return cat?.id === category.id
    }),
  })) || []

  // Agentes em destaque: Assis (tem assistant_id) e Claude Descritivo
  const featuredAgents = (agents || []).filter((a: any) =>
    a.assistant_id || a.name.toLowerCase().includes('claude') || a.name.toLowerCase().includes('gerador de descritivo')
  )
  const regularAgents = (agents || []).filter((a: any) =>
    !featuredAgents.find((f: any) => f.id === a.id)
  )

  const S = {
    page: { minHeight: '100vh', background: '#05080f', padding: '20px 24px' } as React.CSSProperties,
    card: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20 } as React.CSSProperties,
    cardPad: { padding: '22px 24px' } as React.CSSProperties,
    h2: { margin: '0 0 4px', fontSize: 20, fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.3px' } as React.CSSProperties,
    sub: { margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.35)', fontWeight: 300 } as React.CSSProperties,
  }

  return (
    <main style={S.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800&family=JetBrains+Mono:wght@500&display=swap');
        * { font-family: 'Sora', sans-serif; }
        .agent-row:hover { background: rgba(37,99,235,0.08) !important; border-color: rgba(37,99,235,0.3) !important; }
        .nav-btn:hover { background: rgba(255,255,255,0.1) !important; }
        .open-btn:hover { background: #3b82f6 !important; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(37,99,235,0.4) !important; }
        .ext-btn:hover { opacity: 0.8 !important; transform: translateY(-1px); }
        .feat-card:hover { border-color: rgba(37,99,235,0.5) !important; background: rgba(37,99,235,0.12) !important; }
        .feat-card-claude:hover { border-color: rgba(168,85,247,0.5) !important; background: rgba(168,85,247,0.12) !important; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%,100%{opacity:0.6} 50%{opacity:1} }
        .anim { animation: fadeUp 0.5s ease forwards; }
      `}</style>

      <div style={{ maxWidth: 1360, margin: '0 auto' }}>
        {/* TOPBAR */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <img src="/senai-logo.png" alt="SENAI" style={{ height: 36 }} />
            <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.1)' }} />
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 300 }}>Hub de Agentes IA</span>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[{ href: '/admin/agentes', label: 'Gerenciar agentes' }, { href: '/usuarios', label: 'Usuários' }].map(b => (
              <Link key={b.href} href={b.href} className="nav-btn" style={{ padding: '8px 16px', borderRadius: 10, fontSize: 12, fontWeight: 600, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', transition: 'background 0.2s' }}>{b.label}</Link>
            ))}
            <Link href="/logout" style={{ padding: '8px 16px', borderRadius: 10, fontSize: 12, fontWeight: 600, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>Sair</Link>
          </div>
        </div>

        {/* HERO */}
        <div className="anim" style={{ ...S.card, ...S.cardPad, marginBottom: 16, background: 'linear-gradient(135deg, rgba(29,78,216,0.25) 0%, rgba(124,58,237,0.15) 100%)', border: '1px solid rgba(37,99,235,0.25)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Área administrativa · SENAI Bahia</p>
            <h1 style={{ margin: '0 0 6px', fontSize: 28, fontWeight: 800, color: '#fff', letterSpacing: '-0.8px' }}>Hub de Agentes de IA</h1>
            <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.45)', fontWeight: 300 }}>Logado como <span style={{ color: '#93c5fd' }}>{user.email}</span></p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e', marginTop: 4 }} />
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>Sistema operacional</span>
          </div>
        </div>

        {/* METRICS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 16 }}>
          {[
            { label: 'Agentes', value: totalAgents, icon: '🤖', color: '#60a5fa' },
            { label: 'Categorias', value: totalCategories, icon: '📁', color: '#a78bfa' },
            { label: 'Provedores', value: providers.size, icon: '⚙️', color: '#34d399' },
            { label: 'Acessos no mês', value: totalMonthAccess, icon: '📊', color: '#f472b6' },
            { label: 'Usuários ativos', value: activeUsersMonth, icon: '👥', color: '#fb923c' },
          ].map(m => (
            <div key={m.label} style={{ ...S.card, ...S.cardPad, textAlign: 'center' }}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>{m.icon}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: m.color, fontFamily: "'JetBrains Mono',monospace", letterSpacing: '-1px' }}>{m.value}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>{m.label}</div>
            </div>
          ))}
        </div>

        {/* ⭐ AGENTES EM DESTAQUE */}
        {featuredAgents.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '1px' }}>⭐ Agentes em destaque</div>
              <div style={{ flex: 1, height: 1, background: 'rgba(251,191,36,0.15)' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: 14 }}>
              {featuredAgents.map((agent: any) => {
                const isAssis = !!agent.assistant_id
                const isClaude = agent.provider?.toLowerCase().includes('anthropic') || agent.platform?.toLowerCase().includes('claude')
                return (
                  <div key={agent.id} className={isClaude ? 'feat-card-claude' : 'feat-card'} style={{
                    background: isAssis ? 'rgba(37,99,235,0.08)' : 'rgba(124,58,237,0.08)',
                    border: `1px solid ${isAssis ? 'rgba(37,99,235,0.3)' : 'rgba(124,58,237,0.3)'}`,
                    borderRadius: 20, padding: '20px 22px',
                    transition: 'background 0.2s, border-color 0.2s',
                    position: 'relative', overflow: 'hidden',
                  }}>
                    {/* Glow de fundo */}
                    <div style={{ position: 'absolute', top: -40, right: -40, width: 120, height: 120, borderRadius: '50%', background: isAssis ? 'rgba(37,99,235,0.15)' : 'rgba(124,58,237,0.15)', filter: 'blur(40px)', pointerEvents: 'none' }} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flex: 1 }}>
                        {/* Avatar */}
                        <div style={{ width: 52, height: 52, borderRadius: '50%', overflow: 'hidden', background: isAssis ? 'rgba(37,99,235,0.2)' : 'rgba(124,58,237,0.2)', border: `2px solid ${isAssis ? 'rgba(37,99,235,0.4)' : 'rgba(124,58,237,0.4)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 0 20px ${isAssis ? 'rgba(37,99,235,0.3)' : 'rgba(124,58,237,0.3)'}` }}>
                          {isAssis
                            ? <img src="/assis-icon.png" alt="Assis" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <span style={{ fontSize: 24 }}>🤖</span>
                          }
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#fff' }}>{agent.name}</h3>
                            {isAssis && (
                              <span style={{ fontSize: 10, fontWeight: 700, background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#86efac', borderRadius: 20, padding: '2px 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                                Base de conhecimento ativa
                              </span>
                            )}
                          </div>
                          <p style={{ margin: '0 0 10px', fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{agent.description}</p>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 10, fontWeight: 600, background: isAssis ? 'rgba(37,99,235,0.2)' : 'rgba(124,58,237,0.2)', border: `1px solid ${isAssis ? 'rgba(37,99,235,0.3)' : 'rgba(124,58,237,0.3)'}`, color: isAssis ? '#93c5fd' : '#c4b5fd', borderRadius: 20, padding: '3px 10px' }}>{agent.provider}</span>
                            <span style={{ fontSize: 10, fontWeight: 600, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', borderRadius: 20, padding: '3px 10px' }}>{agent.platform}</span>
                          </div>
                        </div>
                      </div>

                      {/* Botão de ação */}
                      {isAssis ? (
                        <Link href={`/agentes/${agent.id}`} style={{
                          padding: '10px 20px', borderRadius: 12, flexShrink: 0,
                          background: 'linear-gradient(135deg,#1d4ed8,#3b82f6)',
                          color: '#fff', fontSize: 12, fontWeight: 700,
                          boxShadow: '0 4px 16px rgba(37,99,235,0.4)',
                          display: 'flex', alignItems: 'center', gap: 6,
                          whiteSpace: 'nowrap',
                        }}>
                          💬 Conversar
                        </Link>
                      ) : (
                        <a href={agent.external_url} target="_blank" rel="noopener noreferrer" style={{
                          padding: '10px 20px', borderRadius: 12, flexShrink: 0,
                          background: 'linear-gradient(135deg,#7c3aed,#8b5cf6)',
                          color: '#fff', fontSize: 12, fontWeight: 700,
                          boxShadow: '0 4px 16px rgba(124,58,237,0.4)',
                          display: 'flex', alignItems: 'center', gap: 6,
                          whiteSpace: 'nowrap',
                        }}>
                          ↗ Abrir
                        </a>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* CHARTS ROW */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 16, marginBottom: 16 }}>
          <div style={{ ...S.card, ...S.cardPad }}>
            <h2 style={S.h2}>Agentes mais usados</h2>
            <p style={{ ...S.sub, marginBottom: 20 }}>Ranking do mês atual</p>
            {topAgents.length > 0 ? (
              <div style={{ display: 'grid', gap: 14 }}>
                {topAgents.map((item, i) => (
                  <div key={item.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontFamily: "'JetBrains Mono',monospace" }}>#{i + 1}</span>
                        {item.name}
                      </span>
                      <span style={{ fontSize: 13, color: '#60a5fa', fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" }}>{item.total}</span>
                    </div>
                    <div style={{ width: '100%', height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.06)' }}>
                      <div style={{ width: `${(item.total / maxBar) * 100}%`, height: '100%', borderRadius: 4, background: 'linear-gradient(90deg,#1d4ed8,#60a5fa)' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>Nenhum acesso registrado ainda.</div>}
          </div>
          <div style={{ ...S.card, ...S.cardPad }}>
            <h2 style={S.h2}>Resumo</h2>
            <p style={{ ...S.sub, marginBottom: 20 }}>Visão rápida</p>
            <div style={{ display: 'grid', gap: 10 }}>
              {[
                { label: 'Usuário logado', value: user.email || '-' },
                { label: 'Líder do mês', value: topAgents[0]?.name || 'Sem dados' },
                { label: 'Acessos do líder', value: `${topAgents[0]?.total || 0} acesso(s)` },
                { label: 'Categoria top', value: topCategories[0]?.name || 'Sem dados' },
              ].map(r => (
                <div key={r.label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{r.label}</div>
                  <div style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 600 }}>{r.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* TODOS OS OUTROS AGENTES — abre externo direto */}
        {groupedAgents.map((cat: any) => {
          const catRegularAgents = cat.agents.filter((a: any) => regularAgents.find((r: any) => r.id === a.id))
          if (catRegularAgents.length === 0) return null
          return (
            <div key={cat.id} id={`cat-${cat.slug}`} style={{ ...S.card, ...S.cardPad, marginBottom: 14 }}>
              <div style={{ marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ fontSize: 11, color: '#60a5fa', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Categoria</div>
                <h2 style={{ margin: '0 0 3px', fontSize: 20, fontWeight: 800, color: '#fff' }}>{cat.name}</h2>
                <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{cat.description || 'Agentes disponíveis.'}</p>
              </div>
              <div style={{ display: 'grid', gap: 8 }}>
                {catRegularAgents.map((agent: any) => (
                  <div key={agent.id} className="agent-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, padding: '14px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', transition: 'background 0.2s, border-color 0.2s' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>{agent.name}</h3>
                      {agent.description && <p style={{ margin: '0 0 6px', fontSize: 11, color: 'rgba(255,255,255,0.35)', lineHeight: 1.4 }}>{agent.description}</p>}
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 10, fontWeight: 600, background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.18)', color: '#93c5fd', borderRadius: 20, padding: '2px 8px' }}>{agent.provider}</span>
                        <span style={{ fontSize: 10, fontWeight: 600, background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.18)', color: '#c4b5fd', borderRadius: 20, padding: '2px 8px' }}>{agent.platform}</span>
                      </div>
                    </div>
                    {/* Abre direto no externo */}
                    <a href={agent.external_url} target="_blank" rel="noopener noreferrer" className="open-btn" style={{ padding: '9px 18px', borderRadius: 10, background: '#2563eb', color: '#fff', fontSize: 12, fontWeight: 700, flexShrink: 0, boxShadow: '0 4px 14px rgba(37,99,235,0.3)', transition: 'background 0.2s, transform 0.15s, box-shadow 0.2s' }}>
                      Abrir ↗
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        <footer style={{ textAlign: 'center', padding: '24px 0', color: 'rgba(255,255,255,0.18)', fontSize: 12 }}>
          Desenvolvido por <span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>Paulo da Silva Filho</span> · Especialista de TI · SENAI Bahia · GEP · 2026
        </footer>
      </div>
    </main>
  )
}
