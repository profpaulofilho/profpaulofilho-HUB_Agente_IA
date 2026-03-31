'use client'

import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        name: 'sb-session',
        lifetime: 60 * 60 * 24 * 7, // 7 dias
        domain: '',
        path: '/',
        sameSite: 'lax',
      },
    }
  )
}
