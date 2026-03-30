import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '../../../lib/supabase/server'

export default async function GerenciarAgentesPage() {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) redirect('/login')

  const { data: agents, error } = await supabase
    .from('agents')
    .select(`id, name, provider, platform, external_url, is_active,
      categories(id, name)`)
    .order('name')

  const { data: categories } = await supabase
    .from('categories').select('*').order('sort_order')

  const inp: React.CSSProperties = {
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#f1f5f9', fontFamily: 'inherit',
  }

  return (
    <main style={{ minHeight: '100vh', background: '#05080f', padding: '24px' }}>
      <style>{`
        
        * { font-family: 'Sora', sans-serif; }
        .agent-row:hover { background: rgba(37,99,235,0.08) !important; border-color: rgba(37,99,235,0.3) !important; }
        .nav-btn:hover { background: rgba(255,255,255,0.1) !important; }
        input:focus, select:focus { outline: none; border-color: rgba(37,99,235,0.5) !important; }
      `}</style>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* TOPBAR */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src="/senai-logo.png" alt="SENAI" style={{ height: 34 }} />
            <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.1)' }} />
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Gerenciar agentes</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link href="/admin/agentes/novo" className="nav-btn" style={{
              padding: '8px 16px', borderRadius: 10, fontSize: 12, fontWeight: 700,
              background: 'linear-gradient(135deg,#1d4ed8,#3b82f6)', color: '#fff',
              border: 'none', transition: 'opacity 0.2s',
            }}>+ Novo agente</Link>
            <Link href="/admin" className="nav-btn" style={{
              padding: '8px 16px', borderRadius: 10, fontSize: 12, fontWeight: 600,
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.7)', transition: 'background 0.2s',
            }}>← Voltar ao admin</Link>
          </div>
        </div>

        {/* HEADER CARD */}
        <div style={{
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20, padding: '22px 24px', marginBottom: 16,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>
            Administração
          </div>
          <h1 style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
            Gerenciar agentes
          </h1>
          <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
            {agents?.length || 0} agente(s) cadastrado(s) · {categories?.length || 0} categoria(s)
          </p>
        </div>

        {error && (
          <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, color: '#fca5a5', fontSize: 13, marginBottom: 16 }}>
            Erro ao carregar agentes: {error.message}
          </div>
        )}

        {/* AGENT LIST */}
        <div style={{ display: 'grid', gap: 10 }}>
          {(agents || []).map((agent: any) => {
            const cat = Array.isArray(agent.categories) ? agent.categories[0] : agent.categories
            return (
              <div key={agent.id} className="agent-row" style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16,
                padding: '16px 20px', background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14,
                transition: 'background 0.2s, border-color 0.2s', flexWrap: 'wrap',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#f1f5f9' }}>{agent.name}</h3>

                    <span style={{ fontSize: 10, fontWeight: 600, background: agent.is_active ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', border: `1px solid ${agent.is_active ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`, color: agent.is_active ? '#86efac' : '#fca5a5', borderRadius: 20, padding: '2px 8px' }}>
                      {agent.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 10, fontWeight: 600, background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.2)', color: '#93c5fd', borderRadius: 20, padding: '2px 8px' }}>{agent.provider}</span>
                    <span style={{ fontSize: 10, fontWeight: 600, background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.2)', color: '#c4b5fd', borderRadius: 20, padding: '2px 8px' }}>{agent.platform}</span>
                    {cat && <span style={{ fontSize: 10, fontWeight: 600, background: 'rgba(8,145,178,0.15)', border: '1px solid rgba(8,145,178,0.2)', color: '#67e8f9', borderRadius: 20, padding: '2px 8px' }}>{cat.name}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <Link href={`/agentes/${agent.id}`} style={{
                    padding: '8px 14px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                    background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.25)',
                    color: '#93c5fd',
                  }}>Abrir →</Link>
                  <a href={agent.external_url} target="_blank" rel="noopener noreferrer" style={{
                    padding: '8px 14px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.5)',
                  }}>↗ Externo</a>
                </div>
              </div>
            )
          })}
          {(!agents || agents.length === 0) && (
            <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.25)', fontSize: 14 }}>
              Nenhum agente cadastrado ainda.{' '}
              <Link href="/admin/agentes/novo" style={{ color: '#60a5fa', fontWeight: 600 }}>Cadastrar primeiro agente →</Link>
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center', padding: '24px 0', fontSize: 11, color: 'rgba(255,255,255,0.15)' }}>
          Desenvolvido por Paulo da Silva Filho · Especialista de TI · SENAI Bahia · GEP · 2026
        </div>
      </div>
    </main>
  )
}
