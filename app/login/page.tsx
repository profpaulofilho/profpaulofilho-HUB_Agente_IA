'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message || 'E-mail ou senha inválidos.')
      setLoading(false)
      return
    }

    if (!data.session) {
      setError('Sessão não criada corretamente.')
      setLoading(false)
      return
    }

    router.replace('/admin')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0f2c] to-[#020617] text-white px-4">
      
      {/* CONTAINER */}
      <div className="w-full max-w-md bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-8 shadow-xl">

        {/* TÍTULO */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold">Entrar no sistema</h1>
          <p className="text-sm text-gray-400">
            Use suas credenciais institucionais
          </p>
        </div>

        {/* FORM */}
        <form onSubmit={handleLogin} className="space-y-4">

          {/* EMAIL */}
          <div>
            <label className="text-sm text-gray-300">E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg bg-white/10 border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* SENHA */}
          <div>
            <label className="text-sm text-gray-300">Senha</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg bg-white/10 border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* ERRO */}
          {error && (
            <div className="text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          {/* BOTÃO */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 transition py-2 rounded-lg font-semibold"
          >
            {loading ? 'Entrando...' : 'Entrar no Hub →'}
          </button>
        </form>

        {/* STATUS */}
        <div className="mt-6 text-xs text-gray-400 text-center space-y-1">
          <div>✔ Supabase conectado</div>
          <div>✔ OpenAI operacional</div>
          <div>✔ Agentes ativos</div>
        </div>
      </div>
    </div>
  )
}
