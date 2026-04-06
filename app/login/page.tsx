'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function checkSession() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session) {
          router.replace('/admin')
          router.refresh()
          return
        }
      } catch {
        // ignora erro de checagem inicial
      } finally {
        setCheckingSession(false)
      }
    }

    checkSession()
  }, [router, supabase])

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) {
        setError(error.message || 'E-mail ou senha inválidos.')
        return
      }

      if (!data.session) {
        setError('Sessão não criada corretamente.')
        return
      }

      router.replace('/admin')
      router.refresh()
    } catch {
      setError('Não foi possível entrar no sistema. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (checkingSession) {
    return (
      <main
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background:
            'radial-gradient(circle at top left, rgba(59,130,246,0.16), transparent 30%), #030712',
          color: '#fff',
          fontFamily: 'Sora, Segoe UI, sans-serif',
        }}
      >
        <div
          style={{
            padding: '20px 24px',
            borderRadius: 16,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.75)',
            fontSize: 14,
          }}
        >
          Verificando sessão...
        </div>
      </main>
    )
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: '1.2fr 440px',
        background:
          'radial-gradient(circle at top left, rgba(76,29,149,0.22), transparent 28%), radial-gradient(circle at bottom right, rgba(37,99,235,0.18), transparent 25%), #020617',
        color: '#fff',
        fontFamily: 'Sora, Segoe UI, sans-serif',
      }}
    >
      <section
        style={{
          padding: '48px 56px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <div style={{ maxWidth: 620 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 14px',
              borderRadius: 999,
              background: 'rgba(59,130,246,0.10)',
              border: '1px solid rgba(59,130,246,0.22)',
              color: '#93c5fd',
              fontSize: 12,
              fontWeight: 700,
              marginBottom: 22,
            }}
          >
            HUB DE AGENTES IA
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: 58,
              lineHeight: 1.02,
              fontWeight: 800,
              letterSpacing: '-0.03em',
            }}
          >
            Inteligência
            <br />
            <span style={{ color: '#8b5cf6' }}>Artificial</span>
            <br />
            para o SENAI
          </h1>

          <p
            style={{
              marginTop: 22,
              maxWidth: 520,
              fontSize: 18,
              lineHeight: 1.7,
              color: 'rgba(255,255,255,0.55)',
            }}
          >
            Plataforma centralizada de agentes de IA para especialistas e docentes
            do SENAI Bahia.
          </p>

          <div
            style={{
              display: 'flex',
              gap: 28,
              marginTop: 34,
              flexWrap: 'wrap',
            }}
          >
            <div>
              <div style={{ fontSize: 30, fontWeight: 800, color: '#a5b4fc' }}>9+</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>AGENTES</div>
            </div>
            <div>
              <div style={{ fontSize: 30, fontWeight: 800, color: '#a5b4fc' }}>2</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>CATEGORIAS</div>
            </div>
            <div>
              <div style={{ fontSize: 30, fontWeight: 800, color: '#a5b4fc' }}>100+</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>ACESSOS</div>
            </div>
          </div>
        </div>
      </section>

      <section
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 420,
            borderRadius: 24,
            padding: 30,
            background: 'rgba(5,8,15,0.82)',
            border: '1px solid rgba(255,255,255,0.09)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
            backdropFilter: 'blur(18px)',
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#a5b4fc',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 8,
            }}
          >
            Acesso restrito
          </div>

          <h2
            style={{
              margin: '0 0 8px',
              fontSize: 40,
              lineHeight: 1.05,
              fontWeight: 800,
            }}
          >
            Entrar no sistema
          </h2>

          <p
            style={{
              margin: '0 0 26px',
              color: 'rgba(255,255,255,0.45)',
              fontSize: 14,
            }}
          >
            Use suas credenciais institucionais.
          </p>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 16 }}>
              <label
                htmlFor="email"
                style={{
                  display: 'block',
                  marginBottom: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'rgba(255,255,255,0.6)',
                  textTransform: 'uppercase',
                }}
              >
                E-mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seuemail@fieb.org.br"
                autoComplete="email"
                required
                style={{
                  width: '100%',
                  height: 52,
                  borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: 'rgba(255,255,255,0.08)',
                  color: '#fff',
                  padding: '0 16px',
                  outline: 'none',
                  fontSize: 14,
                }}
              />
            </div>

            <div style={{ marginBottom: 18 }}>
              <label
                htmlFor="password"
                style={{
                  display: 'block',
                  marginBottom: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'rgba(255,255,255,0.6)',
                  textTransform: 'uppercase',
                }}
              >
                Senha
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                autoComplete="current-password"
                required
                style={{
                  width: '100%',
                  height: 52,
                  borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: 'rgba(255,255,255,0.08)',
                  color: '#fff',
                  padding: '0 16px',
                  outline: 'none',
                  fontSize: 14,
                }}
              />
            </div>

            {error && (
              <div
                style={{
                  marginBottom: 16,
                  padding: '12px 14px',
                  borderRadius: 12,
                  background: 'rgba(239,68,68,0.12)',
                  border: '1px solid rgba(239,68,68,0.22)',
                  color: '#fca5a5',
                  fontSize: 13,
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                height: 54,
                border: 'none',
                borderRadius: 14,
                cursor: loading ? 'not-allowed' : 'pointer',
                background: loading
                  ? 'rgba(139,92,246,0.45)'
                  : 'linear-gradient(90deg,#4f46e5,#8b5cf6)',
                color: '#fff',
                fontSize: 16,
                fontWeight: 800,
                boxShadow: loading ? 'none' : '0 14px 34px rgba(79,70,229,0.28)',
                transition: 'all 0.2s ease',
              }}
            >
              {loading ? 'Entrando...' : 'Entrar no Hub →'}
            </button>
          </form>

          <div
            style={{
              marginTop: 22,
              paddingTop: 18,
              borderTop: '1px solid rgba(255,255,255,0.06)',
              fontSize: 12,
              color: 'rgba(255,255,255,0.34)',
              display: 'grid',
              gap: 6,
            }}
          >
            <div>✓ Supabase conectado</div>
            <div>✓ OpenAI operacional</div>
            <div>✓ Agentes ativos</div>
          </div>
        </div>
      </section>
    </main>
  )
}
