import Link from 'next/link'
import { requireAuthenticatedUser } from '../../lib/auth/user'

export default async function DashboardPage() {
  const { supabase, user } = await requireAuthenticatedUser()

  const { data: agents, error } = await supabase
    .from('agents')
    .select(`
      id,
      name,
      provider,
      platform,
      external_url,
      categories (
        name
      )
    `)
    .eq('is_active', true)
    .order('name')

  return (
    <main style={{ minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div
          style={{
            background: '#fff',
            borderRadius: 24,
            padding: 24,
            boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
          }}
        >
          <img
            src="/senai-logo.png"
            alt="SENAI"
            style={{ height: 60, marginBottom: 20 }}
          />

          <h1 style={{ fontSize: 38, margin: 0 }}>Dashboard</h1>
          <p style={{ color: '#4b5563', marginTop: 10 }}>
            Usuário autenticado: {user.email}
          </p>
          <p style={{ color: '#4b5563' }}>
            Agentes cadastrados no Supabase:
          </p>

          {error ? (
            <p style={{ color: '#b91c1c' }}>Erro ao carregar agentes: {error.message}</p>
          ) : null}

          <div style={{ display: 'grid', gap: 16, marginTop: 20 }}>
            {(agents || []).map((agent: any) => (
              <div
                key={agent.id}
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: 18,
                  padding: 18,
                  background: '#f9fafb',
                }}
              >
                <h2 style={{ margin: 0, fontSize: 22 }}>{agent.name}</h2>
                <p style={{ margin: '8px 0 0', color: '#4b5563' }}>
                  {agent.provider} • {agent.platform}
                </p>
                <p style={{ margin: '8px 0 0', color: '#4b5563' }}>
                  Categoria: {Array.isArray(agent.categories) ? agent.categories[0]?.name : agent.categories?.name}
                </p>
                <div style={{ marginTop: 14 }}>
                  <Link
                    href={agent.external_url}
                    target="_blank"
                    style={{
                      display: 'inline-block',
                      background: '#0d47a1',
                      color: '#fff',
                      padding: '12px 16px',
                      borderRadius: 12,
                      fontWeight: 700,
                    }}
                  >
                    Abrir agente
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <footer
            style={{
              marginTop: 40,
              textAlign: 'center',
              color: '#6b7280',
              fontSize: 14,
            }}
          >
            Desenvolvido por Paulo S. Filho - Especialista de TI - GEP - Senai Bahia - 2026
          </footer>
        </div>
      </div>
    </main>
  )
}
