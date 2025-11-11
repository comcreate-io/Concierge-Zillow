'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { User } from '@supabase/supabase-js'
import Link from 'next/link'

export function AdminNav({ user }: { user: User }) {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <nav className="border-b border-white/10 backdrop-blur-md bg-black/40 sticky top-0 z-50 shadow-2xl">
      <div className="container mx-auto flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-8">
          <Link href="/admin" className="luxury-heading text-xl font-bold tracking-[0.15em] hover:text-white/80 transition-colors">
            Admin Dashboard
          </Link>
          <div className="flex gap-6">
            <Link href="/admin" className="text-sm font-medium tracking-wide hover:text-white transition-colors uppercase">
              New Property
            </Link>
            <Link href="/admin/managers" className="text-sm font-medium tracking-wide hover:text-white transition-colors uppercase">
              Property Managers
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-5">
          <span className="text-sm text-white/70 tracking-wide">{user.email}</span>
          <Button variant="outline" size="sm" onClick={handleLogout} className="border-white/30 hover:bg-white/10 hover:border-white/50 tracking-wide">
            Logout
          </Button>
        </div>
      </div>
    </nav>
  )
}
