import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Rotas públicas — sem autenticação
const PUBLIC_PATHS = ['/login', '/mqct']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/api/') || pathname.startsWith('/logout')) {
    return NextResponse.next()
  }

  // Página pública MQCT e subpaths
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

  let isLoggedIn = false
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      isLoggedIn = true
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      isLoggedIn = !!user
    }
  } catch {
    isLoggedIn = false
  }

  if (pathname === '/') {
    return NextResponse.redirect(new URL(isLoggedIn ? '/admin' : '/login', request.url))
  }

  if (isLoggedIn && pathname === '/login') {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

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
