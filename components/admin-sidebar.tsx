'use client'

import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { User } from '@supabase/supabase-js'
import Link from 'next/link'
import { Home, Users, LogOut, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function AdminSidebar({ user }: { user: User }) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const navItems = [
    {
      label: 'Properties',
      href: '/admin',
      icon: Home,
      active: pathname === '/admin'
    },
    {
      label: 'Managers',
      href: '/admin/managers',
      icon: Users,
      active: pathname === '/admin/managers' || pathname.startsWith('/admin/manager/')
    }
  ]

  return (
    <div className="w-64 min-h-screen border-r border-white/10 backdrop-blur-md bg-black/40 flex flex-col hidden md:flex">
      {/* Logo/Brand Section */}
      <div className="p-4 sm:p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm border border-white/20">
            <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          <div>
            <h2 className="luxury-heading text-lg sm:text-xl font-bold tracking-[0.15em]">Admin</h2>
            <p className="text-xs text-white/60 tracking-wide">Dashboard</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                "hover:bg-white/10 hover:border-white/20",
                item.active
                  ? "bg-white/15 border border-white/30 shadow-lg"
                  : "border border-transparent"
              )}
            >
              <Icon className={cn(
                "h-5 w-5",
                item.active ? "text-white" : "text-white/70"
              )} />
              <span className={cn(
                "text-sm font-medium tracking-wide uppercase",
                item.active ? "text-white" : "text-white/70"
              )}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* User Info and Logout Section */}
      <div className="p-4 border-t border-white/10 space-y-3">
        <div className="px-4 py-2">
          <p className="text-xs text-white/50 uppercase tracking-wider mb-1">Signed in as</p>
          <p className="text-sm text-white/90 tracking-wide truncate">{user.email}</p>
        </div>
        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full border-white/30 hover:bg-white/10 hover:border-white/50 tracking-wide justify-start"
          size="default"
        >
          <LogOut className="h-4 w-4 mr-3" />
          Logout
        </Button>
      </div>
    </div>
  )
}
