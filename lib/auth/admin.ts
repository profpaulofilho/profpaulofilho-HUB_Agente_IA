import { redirect } from 'next/navigation'
import { createClient } from '../supabase/server'

export async function requireAdmin() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role, is_active, must_change_password')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError || !profile) {
    redirect('/login')
  }

  if (profile.must_change_password) {
    redirect('/primeiro-acesso')
  }

  if (!profile.is_active || profile.role !== 'admin') {
    redirect('/dashboard')
  }

  return { supabase, user, profile }
}
