import { redirect } from 'next/navigation'
import { requireAuthenticatedUser } from './user'

type RequireAdminOptions = {
  allowPendingPasswordChange?: boolean
}

export async function requireAdmin(options: RequireAdminOptions = {}) {
  const ctx = await requireAuthenticatedUser(options)

  if (ctx.profile.role !== 'admin') {
    redirect('/dashboard')
  }

  return ctx
}
