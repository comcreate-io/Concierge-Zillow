import { createClient } from '@/lib/supabase/server'

export type UserRole = 'admin' | 'super_admin'

const SUPER_ADMIN_EMAILS = [
  'Brody@cadizlluis.com',
  'Devon@cadizlluis.com'
]

/**
 * Check if the current user is a superior admin
 */
export async function isSuperAdmin(): Promise<boolean> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  // Check by email first (case insensitive)
  const userEmail = user.email?.toLowerCase()
  if (userEmail && SUPER_ADMIN_EMAILS.some(email => email.toLowerCase() === userEmail)) {
    return true
  }

  // Check by role in property_managers table
  const { data: manager } = await supabase
    .from('property_managers')
    .select('role')
    .eq('auth_user_id', user.id)
    .single()

  return manager?.role === 'super_admin'
}

/**
 * Get the current user's role
 */
export async function getCurrentUserRole(): Promise<UserRole | null> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: manager } = await supabase
    .from('property_managers')
    .select('role')
    .eq('auth_user_id', user.id)
    .single()

  return (manager?.role as UserRole) || 'admin'
}

/**
 * Require super admin access - throws error if not authorized
 */
export async function requireSuperAdmin() {
  const isSuper = await isSuperAdmin()
  if (!isSuper) {
    throw new Error('Unauthorized: Super admin access required')
  }
}
