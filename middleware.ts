import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isPublicRoute =
    pathname === '/' ||
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

  if (!user) {
    if (!isPublicRoute) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return response
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_active, must_change_password')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile?.is_active) {
    if (pathname !== '/login') {
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return response
  }

  if (profile?.must_change_password) {
    if (pathname !== '/primeiro-acesso' && !pathname.startsWith('/logout')) {
      return NextResponse.redirect(new URL('/primeiro-acesso', request.url))
    }
    return response
  }

  if (pathname === '/primeiro-acesso') {
    return NextResponse.redirect(
      new URL(profile?.role === 'admin' ? '/admin' : '/dashboard', request.url)
    )
  }

  if (pathname === '/' || pathname === '/login') {
    return NextResponse.redirect(
      new URL(profile?.role === 'admin' ? '/admin' : '/dashboard', request.url)
    )
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
