import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isPublicRoute =
    pathname === '/login' ||
    pathname === '/mqct' ||
    pathname.startsWith('/mqct/') ||
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico'

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })

          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (pathname === '/') {
    return NextResponse.redirect(
      new URL(user ? '/admin' : '/login', request.url)
    )
  }

  if (!user && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (!user) {
    return response
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('must_change_password, is_active')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.is_active === false && pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const isPrimeiroAcesso = pathname === '/primeiro-acesso'

  if (
    profile?.must_change_password === true &&
    !isPrimeiroAcesso &&
    !pathname.startsWith('/auth/') &&
    !pathname.startsWith('/logout')
  ) {
    return NextResponse.redirect(new URL('/primeiro-acesso', request.url))
  }

  if (profile?.must_change_password === false && isPrimeiroAcesso) {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  if (pathname === '/login') {
    return NextResponse.redirect(
      new URL(
        profile?.must_change_password ? '/primeiro-acesso' : '/admin',
        request.url
      )
    )
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
