import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rotas que nunca precisam de auth
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/logout') ||
    pathname === '/mqct' ||
    pathname.startsWith('/mqct/')
  ) {
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

  // Verificar autenticação lendo o cookie local (sem chamada de rede)
  // Tokens Supabase duram 1h — getSession() é suficiente para o middleware
  const { data: { session } } = await supabase.auth.getSession()
  const isLoggedIn = !!session

  // Rota raiz — redireciona conforme estado
  if (pathname === '/') {
    return NextResponse.redirect(new URL(isLoggedIn ? '/admin' : '/login', request.url))
  }

  // Logado tentando acessar /login — manda para /admin
  if (isLoggedIn && pathname === '/login') {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  // Não logado em qualquer rota protegida
  if (!isLoggedIn && pathname !== '/login') {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
