import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Nunca interceptar API routes e logout
  if (pathname.startsWith('/api/') || pathname.startsWith('/logout')) {
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

  // Tenta getSession primeiro (lê cookie local, mais rápido)
  // Se falhar, tenta getUser (valida com servidor)
  let isLoggedIn = false
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      isLoggedIn = true
    } else {
      // Fallback: tenta getUser
      const { data: { user } } = await supabase.auth.getUser()
      isLoggedIn = !!user
    }
  } catch {
    isLoggedIn = false
  }

  // Rota raiz
  if (pathname === '/') {
    return NextResponse.redirect(new URL(isLoggedIn ? '/admin' : '/login', request.url))
  }

  // Já logado tentando acessar /login
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
