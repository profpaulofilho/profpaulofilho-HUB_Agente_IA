import type { CSSProperties } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '../../lib/supabase/server'

async function updatePassword(formData: FormData) {
  'use server'

  const supabase = await createClient()

  const password = String(formData.get('password') || '').trim()
  const confirmPassword = String(formData.get('confirmPassword') || '').trim()

  if (!password || !confirmPassword) {
    throw new Error('Preencha os dois campos.')
  }

  if (password.length < 6) {
    throw new Error('A senha deve ter pelo menos 6 caracteres.')
  }

  if (password !== confirmPassword) {
    throw new Error('As senhas não coincidem.')
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  const { error: passwordError } = await supabase.auth.updateUser({
    password,
  })

  if (passwordError) {
    throw new Error(passwordError.message)
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      must_change_password: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (profileError) {
    throw new Error(profileError.message)
  }

  redirect('/admin')
}

export default async function PrimeiroAcessoPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('must_change_password')
    .eq('id', user.id)
    .single()

  if (!profile?.must_change_password) {
    redirect('/admin')
  }

  return (
    <main style={{ minHeight: '100vh', background: '#05080f', padding: '24px' }}>
      <div style={{ maxWidth: 520, margin: '60px auto' }}>
        <div style={card}>
          <div style={eyebrow}>Troca obrigatória</div>
          <h1 style={title}>Defina uma nova senha</h1>
          <p style={subtitle}>
            Seu acesso está liberado, mas antes você precisa trocar a senha.
          </p>

          <form action={updatePassword} style={{ display: 'grid', gap: 16, marginTop: 24 }}>
            <div>
              <label style={label}>Nova senha</label>
              <input name="password" type="password" required style={input} />
            </div>

            <div>
              <label style={label}>Confirmar nova senha</label>
              <input name="confirmPassword" type="password" required style={input} />
            </div>

            <button type="submit" style={button}>
              Salvar nova senha
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}

const card: CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 20,
  padding: '28px 32px',
}

const eyebrow: CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: '#60a5fa',
  textTransform: 'uppercase',
  marginBottom: 8,
}

const title: CSSProperties = {
  margin: '0 0 8px',
  fontSize: 28,
  fontWeight: 800,
  color: '#fff',
}

const subtitle: CSSProperties = {
  margin: 0,
  fontSize: 13,
  color: 'rgba(255,255,255,0.45)',
}

const label: CSSProperties = {
  display: 'block',
  marginBottom: 6,
  fontSize: 12,
  fontWeight: 700,
  color: 'rgba(255,255,255,0.6)',
}

const input: CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10,
  padding: '12px 14px',
  fontSize: 14,
  color: '#fff',
}

const button: CSSProperties = {
  background: 'linear-gradient(135deg,#1d4ed8,#3b82f6)',
  color: '#fff',
  border: 'none',
  borderRadius: 10,
  padding: '12px 16px',
  fontWeight: 700,
  fontSize: 14,
  cursor: 'pointer',
}
