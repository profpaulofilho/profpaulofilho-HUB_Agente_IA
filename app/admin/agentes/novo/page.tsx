import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '../../../../lib/supabase/server'

async function createAgent(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const name = String(formData.get('name') || '').trim()
  const description = String(formData.get('description') || '').trim()
  const provider = String(formData.get('provider') || '').trim()
  const platform = String(formData.get('platform') || '').trim()
  const external_url = String(formData.get('external_url') || '').trim()
  const category_id = String(formData.get('category_id') || '').trim()
  // is_featured removido — coluna não existe na tabela

  const slug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  if (!name || !provider || !platform || !external_url || !category_id) redirect('/admin/agentes/novo')

  await supabase.from('agents').insert({ name, slug, description, provider, platform, external_url, category_id, is_active: true,  created_by: user.id })
  redirect('/admin')
}

export default async function NovoAgentePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: categories } = await supabase.from('categories').select('id, name').eq('is_active', true).order('sort_order')

  const inp: React.CSSProperties = { width:'100%', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'11px 14px', fontSize:13, color:'#f1f5f9' }
  const lbl: React.CSSProperties = { fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.45)', textTransform:'uppercase', letterSpacing:'0.5px', display:'block', marginBottom:7 }

  return (
    <main style={{ minHeight:'100vh', background:'#05080f', padding:'24px' }}>
      <style>{` * { font-family: 'Sora', sans-serif; } input,textarea,select { outline:none; } input:focus,textarea:focus,select:focus { border-color: rgba(37,99,235,0.5) !important; background: rgba(37,99,235,0.06) !important; }`}</style>
      <div style={{ maxWidth:760, margin:'0 auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <img src="/senai-logo.png" alt="SENAI" style={{ height:30, opacity:1 }} />
          </div>
          <Link href="/admin" style={{ padding:'8px 16px', borderRadius:10, fontSize:12, fontWeight:600, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.7)' }}>← Voltar</Link>
        </div>

        <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:20, padding:'28px 32px' }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#60a5fa', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:8 }}>Cadastro</div>
          <h1 style={{ margin:'0 0 6px', fontSize:26, fontWeight:800, color:'#fff', letterSpacing:'-0.5px' }}>Novo agente</h1>
          <p style={{ margin:'0 0 28px', fontSize:13, color:'rgba(255,255,255,0.35)' }}>Adicione um novo agente ao portal interno do SENAI Bahia.</p>

          <form action={createAgent} style={{ display:'grid', gap:18 }}>
            <div><label style={lbl}>Nome do agente</label><input name="name" required style={inp} placeholder="Ex.: IA - Soldagem e Caldeiraria" /></div>
            <div><label style={lbl}>Descrição</label><textarea name="description" style={{ ...inp, minHeight:90, resize:'vertical' }} placeholder="Descreva o propósito do agente." /></div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              <div><label style={lbl}>Provider</label><input name="provider" required style={inp} placeholder="OpenAI" /></div>
              <div><label style={lbl}>Plataforma</label><input name="platform" required style={inp} placeholder="GPT" /></div>
            </div>
            <div>
              <label style={lbl}>Categoria</label>
              <select name="category_id" required style={inp}>
                <option value="">Selecione</option>
                {(categories || []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div><label style={lbl}>Link externo</label><input name="external_url" required style={inp} placeholder="https://chatgpt.com/g/..." /></div>
            <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', fontSize:13, color:'rgba(255,255,255,0.6)' }}>
              <input type="checkbox" name="is_featured" style={{ accentColor:'#2563eb' }} />
              Marcar como destaque
            </label>
            <button type="submit" style={{ background:'linear-gradient(135deg,#1d4ed8,#3b82f6)', color:'#fff', border:'none', borderRadius:10, padding:'12px', fontWeight:700, fontSize:14, cursor:'pointer', boxShadow:'0 6px 20px rgba(37,99,235,0.3)' }}>
              Salvar agente →
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
