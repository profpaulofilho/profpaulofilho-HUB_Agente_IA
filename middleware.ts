import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rotas públicas — nunca interceptar
  if (
    pathname === '/login' ||
    pathname === '/mqct' ||
    pathname.startsWith('/mqct/') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/logout')
  ) {
    return NextResponse.next()
  }

  // Verifica qualquer cookie do Supabase — rápido, sem chamar API
  const allCookies = request.cookies.getAll()
  const hasSupabaseCookie = allCookies.some(c => c.name.includes('auth-token') || c.name.startsWith('sb-'))

  // Se não tem cookie nenhum do Supabase, manda pro login direto
  if (!hasSupabaseCookie) {
    if (pathname === '/') return NextResponse.redirect(new URL('/login', request.url))
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Tem cookie — deixa passar sem chamar o Supabase
  // A validação real acontece nas pages (server components) que usam getUser()
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
