import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminSidebar } from '@/components/admin-sidebar'
import { MobileHeader } from '@/components/mobile-header'
import { Toaster } from '@/components/ui/toaster'
import { isSuperAdmin } from '@/lib/auth/roles'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if user is super admin
  const isSuper = await isSuperAdmin()

  return (
    <div className="min-h-screen marble-bg flex flex-col md:flex-row">
      {/* Mobile header */}
      <MobileHeader user={user} isSuperAdmin={isSuper} />

      <AdminSidebar user={user} isSuperAdmin={isSuper} />
      <main className="flex-1 py-6 md:py-10 px-4 md:px-8 animate-fade-in overflow-auto">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
      <Toaster />
    </div>
  )
}
