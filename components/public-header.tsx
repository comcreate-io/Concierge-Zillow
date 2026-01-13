'use client'

import { useState } from 'react'
import { Logo } from '@/components/logo'
import { Menu, X, Home, Building2, Phone, Mail } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export function PublicHeader() {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const navItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Properties', href: '/properties', icon: Building2 },
  ]

  return (
    <>
      <header className="sticky top-0 z-50 backdrop-blur-2xl bg-gradient-to-b from-black/80 via-black/60 to-black/40 border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Brand Section */}
            <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group">
              <div className="scale-[0.7] sm:scale-85 flex-shrink-0 -ml-2 sm:-ml-1 transition-transform group-hover:scale-[0.72] sm:group-hover:scale-[0.87]">
                <Logo />
              </div>
              <div className="h-7 sm:h-9 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent" />
              <div className="flex flex-col">
                <span className="text-[10px] sm:text-xs tracking-[0.15em] sm:tracking-[0.2em] text-white/90 font-light">
                  LUXURY CONCIERGE
                </span>
                <span className="text-[8px] sm:text-[10px] tracking-[0.1em] text-white/50 font-light">
                  CADIZ & LLUIS
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-5 py-2 rounded-lg text-[11px] uppercase tracking-[0.15em] transition-all duration-200",
                    pathname === item.href
                      ? "text-white bg-white/[0.08] border border-white/[0.1]"
                      : "text-white/60 hover:text-white hover:bg-white/[0.04] border border-transparent"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden flex items-center justify-center h-9 w-9 rounded-full border border-white/[0.08] bg-white/[0.03] text-white/60 hover:text-white hover:bg-white/[0.06] active:bg-white/[0.08] transition-all"
            >
              {isMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
        {/* Subtle bottom glow line */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
      </header>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="md:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
            onClick={() => setIsMenuOpen(false)}
          />

          {/* Sidebar */}
          <div className="md:hidden fixed top-0 left-0 bottom-0 w-72 bg-gradient-to-b from-black/98 to-black/95 backdrop-blur-2xl border-r border-white/[0.06] z-50 shadow-2xl animate-slide-in-left">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="p-5 border-b border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="scale-[0.6] -ml-1">
                    <Logo />
                  </div>
                  <div className="h-6 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent" />
                  <div className="flex flex-col">
                    <span className="text-[9px] tracking-[0.12em] text-white/80 font-light">LUXURY</span>
                    <span className="text-[7px] tracking-[0.1em] text-white/40 font-light">CONCIERGE</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-center h-8 w-8 rounded-full border border-white/[0.08] bg-white/[0.03] text-white/60 active:bg-white/[0.08] transition-all"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Navigation Links */}
              <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
                <p className="text-[9px] text-white/30 uppercase tracking-[0.15em] px-3 mb-3">Navigation</p>
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                        isActive
                          ? "bg-white/[0.08] border border-white/[0.1] text-white"
                          : "text-white/60 active:bg-white/[0.06] border border-transparent"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-[11px] tracking-[0.1em] uppercase font-light">
                        {item.label}
                      </span>
                    </Link>
                  )
                })}
              </nav>

              {/* Contact Section */}
              <div className="p-4 border-t border-white/[0.06]">
                <p className="text-[9px] text-white/30 uppercase tracking-[0.15em] px-3 mb-3">Contact</p>
                <a
                  href="tel:+18186424050"
                  className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-white/50 active:text-white active:bg-white/[0.04] transition-all"
                >
                  <Phone className="h-4 w-4" />
                  <span className="text-xs font-light">+1 (818) 642-4050</span>
                </a>
                <a
                  href="mailto:brody@cadizlluis.com"
                  className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-white/50 active:text-white active:bg-white/[0.04] transition-all"
                >
                  <Mail className="h-4 w-4" />
                  <span className="text-xs font-light">brody@cadizlluis.com</span>
                </a>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
