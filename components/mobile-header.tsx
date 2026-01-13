'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { User } from '@supabase/supabase-js'
import { LogOut, Menu, X, Home, Building2, UserCheck, User as UserIcon, FileText, Sparkles, Contact, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

export function MobileHeader({ user, isSuperAdmin = false }: { user: User; isSuperAdmin?: boolean }) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const handleNavigation = (href: string) => {
    setIsMenuOpen(false)
    // Small delay to let menu close animation start
    setTimeout(() => {
      router.push(href)
    }, 50)
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
    <>
      <div className="md:hidden border-b border-white/10 backdrop-blur-md bg-black/40 sticky top-0 z-50 shadow-lg">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <Button
            onClick={() => setIsMenuOpen(true)}
            variant="outline"
            size="sm"
            className="border-white/30 hover:bg-white/10 hover:border-white/50 text-white flex-shrink-0"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0 text-center">
            <h1 className="luxury-heading text-lg tracking-widest text-white">Admin Dashboard</h1>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            size="sm"
            className="border-white/30 hover:bg-white/10 hover:border-white/50 text-white flex-shrink-0"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            onClick={() => setIsMenuOpen(false)}
          />

          {/* Sidebar */}
          <div className="md:hidden fixed top-0 left-0 bottom-0 w-72 bg-black border-r border-white/10 z-[70] shadow-2xl">
            <div className="flex flex-col h-full">
              {/* Logo/Brand Section */}
              <div className="p-6 border-b border-white/10 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/10 rounded-lg border border-white/30">
                      <Building2 className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="luxury-heading text-xl font-bold tracking-[0.15em] text-white">Admin</h2>
                      <p className="text-xs text-white/60 tracking-wide">Dashboard</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsMenuOpen(false)}
                    className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Navigation Links */}
              <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.href}
                      onClick={() => handleNavigation(item.href)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left",
                        item.active
                          ? "bg-white/15 border border-white/40 text-white"
                          : "text-white/70 hover:bg-white/10 hover:text-white border border-transparent"
                      )}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      <span className="text-sm font-medium tracking-wide uppercase">
                        {item.label}
                      </span>
                    </button>
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
          </div>
        </>
      )}
    </>
  )
}
