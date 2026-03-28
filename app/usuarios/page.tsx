import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '../../lib/supabase/server'

export default async function UsuariosPage() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect('/login')

  // Busca usuários de auth.users via profiles (pode não existir)
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, is_active, created_at')
    .order('created_at', { ascending: false })

  return (
    <main style={{ minHeight: '100vh', background: '#05080f', padding: '24px' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800&display=swap');
        * { font-family: 'Sora', sans-serif; }
        .nav-btn:hover { background: rgba(255,255,255,0.1) !important; }
      `}</style>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* TOPBAR */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src="/senai-logo.png" alt="SENAI" style={{ height: 34 }} />
            <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.1)' }} />
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Usuários do portal</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link href="/admin" className="nav-btn" style={{
              padding: '8px 16px', borderRadius: 10, fontSize: 12, fontWeight: 600,
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.7)', transition: 'background 0.2s',
            }}>← Admin</Link>
            <Link href="/logout" style={{
              padding: '8px 16px', borderRadius: 10, fontSize: 12, fontWeight: 600,
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5',
            }}>Sair</Link>
          </div>
        </div>

        {/* HEADER */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '22px 24px', marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>Gestão interna</div>
          <h1 style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>Usuários do portal</h1>
          <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>Usuários com acesso ao Hub de Agentes SENAI Bahia</p>
        </div>

        {/* Erro de tabela não encontrada */}
        {profilesError && (
          <div style={{ padding: '16px 20px', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 14, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fcd34d', marginBottom: 6 }}>⚠ Tabela "profiles" não encontrada</div>
            <p style={{ margin: '0 0 10px', fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
              A tabela <code style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 6px', borderRadius: 4 }}>profiles</code> não existe no seu Supabase.
              Para usar esta página, crie a tabela com o SQL abaixo no editor do Supabase:
            </p>
            <pre style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '12px 14px', fontSize: 11, color: '#86efac', overflowX: 'auto', margin: 0 }}>{`create table profiles (
  id uuid references auth.users on delete cascade,
  full_name text,
  email text,
  role text default 'user',
  is_active boolean default true,
  created_at timestamptz default now(),
  primary key (id)
);

-- Popula automaticamente ao criar usuário
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();`}</pre>
          </div>
        )}

        {/* LISTA DE USUÁRIOS */}
        {!profilesError && (
          <div style={{ display: 'grid', gap: 10 }}>
            {(profiles || []).length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.25)', fontSize: 14 }}>
                Nenhum usuário encontrado na tabela profiles.
              </div>
            )}
            {(profiles || []).map((p: any) => (
              <div key={p.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16,
                padding: '16px 20px', background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, flexWrap: 'wrap',
              }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>
                    {p.full_name || 'Usuário sem nome'}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{p.email}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 4 }}>
                    {p.role} · {p.is_active ? 'Ativo' : 'Inativo'} ·{' '}
                    {p.created_at ? new Date(p.created_at).toLocaleDateString('pt-BR') : ''}
                  </div>
                </div>
                <span style={{
                  padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                  background: p.role === 'admin' ? 'rgba(37,99,235,0.15)' : 'rgba(255,255,255,0.06)',
                  border: `1px solid ${p.role === 'admin' ? 'rgba(37,99,235,0.25)' : 'rgba(255,255,255,0.1)'}`,
                  color: p.role === 'admin' ? '#93c5fd' : 'rgba(255,255,255,0.5)',
                }}>{p.role}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ textAlign: 'center', padding: '24px 0', fontSize: 11, color: 'rgba(255,255,255,0.15)' }}>
          Desenvolvido por Paulo da Silva Filho · Especialista de TI · SENAI Bahia · GEP · 2026
        </div>
      </div>
    </main>
  )
}
