'use client'

import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { User } from '@supabase/supabase-js'
import Link from 'next/link'
import { Home, LogOut, Building2, UserCheck, User as UserIcon, FileText, Sparkles, Users, Contact } from 'lucide-react'
import { cn } from '@/lib/utils'

export function AdminSidebar({ user, isSuperAdmin = false }: { user: User; isSuperAdmin?: boolean }) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const allNavItems = [
    {
      label: 'Profile',
      href: '/admin/profile',
      icon: UserIcon,
      active: pathname === '/admin/profile'
    },
    {
      label: 'My Clients',
      href: '/admin/clients',
      icon: UserCheck,
      active: pathname === '/admin/clients'
    },
    {
      label: 'All Clients',
      href: '/admin/clients-all',
      icon: Users,
      active: pathname === '/admin/clients-all' || pathname.startsWith('/admin/client/'),
      superAdminOnly: true
    },
    {
      label: 'Properties',
      href: '/admin/properties',
      icon: Home,
      active: pathname === '/admin' || pathname === '/admin/properties' || pathname.startsWith('/admin/properties/')
    },
    {
      label: 'Agents',
      href: '/admin/agents',
      icon: Contact,
      active: pathname === '/admin/agents' || pathname.startsWith('/admin/agents/')
    },
    {
      label: 'Invoices',
      href: '/admin/invoices',
      icon: FileText,
      active: pathname === '/admin/invoices' || pathname.startsWith('/admin/invoices/')
    },
    {
      label: 'Quotes',
      href: '/admin/quotes',
      icon: Sparkles,
      active: pathname === '/admin/quotes' || pathname.startsWith('/admin/quotes/')
    }
  ]

  // Filter nav items based on role
  const navItems = allNavItems.filter(item => {
    if (item.superAdminOnly) {
      return isSuperAdmin
    }
    return true
  })

  return (
    <div className="hidden md:flex md:flex-col w-64 h-screen border-r border-white/10 backdrop-blur-md bg-black/40 shadow-xl sticky top-0">
      {/* Logo/Brand Section */}
      <div className="p-6 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-lg border border-white/30">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="luxury-heading text-xl font-bold tracking-[0.15em] text-white">Admin</h2>
            <p className="text-xs text-white/60 tracking-wide">Dashboard</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg",
                item.active
                  ? "bg-white/15 border border-white/40 text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white border border-transparent"
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm font-medium tracking-wide uppercase">
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* User Info and Logout Section */}
      <div className="p-4 border-t border-white/10 space-y-3 flex-shrink-0">
        <div className="px-4 py-3 rounded-lg bg-white/5 border border-white/10">
          <p className="text-xs text-white uppercase tracking-wider mb-1.5 font-semibold">Signed in as</p>
          <p className="text-sm text-white/90 tracking-wide truncate">{user.email}</p>
        </div>
        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full border-white/30 hover:bg-white/10 hover:border-white/50 hover:text-white tracking-wide justify-start"
          size="default"
        >
          <LogOut className="h-4 w-4 mr-3" />
          Logout
        </Button>
      </div>
    </div>
  )
}
