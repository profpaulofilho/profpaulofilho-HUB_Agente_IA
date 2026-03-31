import { type NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rotas públicas — deixa passar sempre
  if (
    pathname === '/login' ||
    pathname === '/mqct' ||
    pathname.startsWith('/mqct/') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/logout') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/public/')
  ) {
    return NextResponse.next()
  }

  // Verifica cookie de sessão do Supabase
  const cookies = request.cookies
  const hasSession = cookies.getAll().some(c =>
    c.name.startsWith('sb-') && c.name.endsWith('-auth-token')
  )

  // Rota raiz
  if (pathname === '/') {
    return NextResponse.redirect(new URL(hasSession ? '/admin' : '/login', request.url))
  }

  // Não autenticado — manda para login
  if (!hasSession) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
