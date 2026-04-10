import { redirect } from 'next/navigation'
import { createClient } from '../supabase/server'

type RequireAuthenticatedUserOptions = {
  allowPendingPasswordChange?: boolean
}

export async function requireAuthenticatedUser(
  options: RequireAuthenticatedUserOptions = {}
) {
  const { allowPendingPasswordChange = false } = options
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
    .select('id, full_name, email, role, is_active, must_change_password')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    redirect('/login')
  }

  if (profile.is_active === false) {
    redirect('/login')
  }

  if (profile.must_change_password && !allowPendingPasswordChange) {
    redirect('/primeiro-acesso')
  }

  return { supabase, user, profile }
}
