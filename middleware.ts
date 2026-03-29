import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Nunca interceptar API routes nem logout
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

  // Usa getSession() no middleware — mais confiável para verificar
  // se há uma sessão ativa sem depender de chamada externa à API
  const { data: { session } } = await supabase.auth.getSession()
  const isLoggedIn = !!session

  // Rota raiz
  if (pathname === '/') {
    return NextResponse.redirect(
      new URL(isLoggedIn ? '/admin' : '/login', request.url)
    )
  }

  // Logado tentando acessar /login → vai para /admin
  if (isLoggedIn && pathname === '/login') {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  // Não logado em rota protegida → vai para /login (sem ?next para evitar loops)
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
