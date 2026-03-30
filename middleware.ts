import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // API routes e logout — passar direto
  if (pathname.startsWith('/api/') || pathname.startsWith('/logout')) {
    return NextResponse.next()
  }

  // Página pública MQCT — sem auth
  if (pathname === '/mqct' || pathname.startsWith('/mqct/')) {
    return NextResponse.next()
  }

  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response = NextResponse.next({ request: { headers: request.headers } })
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Verificar sessão — getUser é mais confiável pois renova o token automaticamente
  let isLoggedIn = false
  try {
    const { data: { user } } = await supabase.auth.getUser()
    isLoggedIn = !!user
  } catch {
    // Se getUser falhar, tenta getSession como fallback
    try {
      const { data: { session } } = await supabase.auth.getSession()
      isLoggedIn = !!session
    } catch {
      isLoggedIn = false
    }
  }

  // Rota raiz
  if (pathname === '/') {
    return NextResponse.redirect(new URL(isLoggedIn ? '/admin' : '/login', request.url))
  }

  // Logado tentando acessar /login
  if (isLoggedIn && pathname === '/login') {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  // Não logado em rota protegida
  if (!isLoggedIn && pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/|logout|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
