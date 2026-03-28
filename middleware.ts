import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Nunca interceptar rotas de API nem logout — deixa passar direto
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

  const { data: { user } } = await supabase.auth.getUser()

  // Rota raiz → redireciona conforme estado de auth
  if (pathname === '/') {
    if (user) return NextResponse.redirect(new URL('/admin', request.url))
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Logado tentando acessar /login → manda para /admin (evita loop)
  if (user && pathname === '/login') {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  // Não logado em rota protegida → manda para /login preservando destino
  if (!user && pathname !== '/login') {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: [
    // Exclui: arquivos estáticos, imagens, _next, API routes, logout
    '/((?!_next/static|_next/image|favicon.ico|api/|logout|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
