import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '../../lib/supabase/server'

export default async function UsuariosPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/login')

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles').select('id, full_name, email, role, is_active, created_at')
    .order('created_at', { ascending: false })

  return (
    <main style={{ minHeight:'100vh', background:'#05080f', padding:'24px' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800&display=swap'); * { font-family: 'Sora', sans-serif; }`}</style>
      <div style={{ maxWidth:1100, margin:'0 auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, flexWrap:'wrap', gap:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <img src="/senai-logo.png" alt="SENAI" style={{ height:32, filter:'brightness(0) invert(1)', opacity:.8 }} />
            <span style={{ fontSize:12, color:'rgba(255,255,255,0.35)' }}>Usuários do portal</span>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <Link href="/admin" style={{ padding:'8px 16px', borderRadius:10, fontSize:12, fontWeight:600, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.7)' }}>← Admin</Link>
            <Link href="/logout" style={{ padding:'8px 16px', borderRadius:10, fontSize:12, fontWeight:600, background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', color:'#fca5a5' }}>Sair</Link>
          </div>
        </div>

        <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:20, padding:'22px 24px', marginBottom:16 }}>
          <h1 style={{ margin:'0 0 4px', fontSize:22, fontWeight:800, color:'#f1f5f9' }}>Usuários do portal</h1>
          <p style={{ margin:0, fontSize:12, color:'rgba(255,255,255,0.35)' }}>Usuários com acesso ao Hub de Agentes SENAI Bahia</p>
        </div>

        {profilesError && <div style={{ padding:'12px 16px', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:12, color:'#fca5a5', fontSize:13, marginBottom:16 }}>Erro: {profilesError.message}</div>}

        <div style={{ display:'grid', gap:10 }}>
          {(profiles || []).map((p: any) => (
            <div key={p.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:16, padding:'16px 20px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, flexWrap:'wrap' }}>
              <div>
                <div style={{ fontSize:15, fontWeight:700, color:'#f1f5f9', marginBottom:4 }}>{p.full_name || 'Usuário sem nome'}</div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)' }}>{p.email}</div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.25)', marginTop:4 }}>
                  {p.role} · {p.is_active ? 'Ativo' : 'Inativo'}
                </div>
              </div>
              <span style={{ padding:'4px 12px', borderRadius:20, fontSize:11, fontWeight:600, background:'rgba(37,99,235,0.15)', border:'1px solid rgba(37,99,235,0.2)', color:'#93c5fd' }}>{p.role}</span>
            </div>
          ))}
        </div>

        <div style={{ textAlign:'center', padding:'24px 0', fontSize:12, color:'rgba(255,255,255,0.18)' }}>
          Desenvolvido por <span style={{ color:'rgba(255,255,255,0.35)', fontWeight:600 }}>Paulo da Silva Filho</span> · Especialista de TI · SENAI Bahia · GEP · 2026
        </div>
      </div>
    </main>
  )
}
