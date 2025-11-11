import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminSidebar } from '@/components/admin-sidebar'
import { Toaster } from '@/components/ui/toaster'

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

  return (
    <div className="min-h-screen marble-bg flex flex-col md:flex-row">
      {/* Mobile header */}
      <div className="md:hidden border-b border-white/10 backdrop-blur-md bg-black/40 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="luxury-heading text-lg tracking-widest text-white">Admin Dashboard</h1>
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/70">{user.email}</span>
          </div>
        </div>
      </div>

      <AdminSidebar user={user} />
      <main className="flex-1 py-6 md:py-10 px-4 md:px-8 animate-fade-in overflow-auto">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
      <Toaster />
    </div>
  )
}
