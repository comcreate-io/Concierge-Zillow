import { createClient } from '@/lib/supabase/server'
import { PublicPropertyCard } from '@/components/public-property-card'
import { PublicHeader } from '@/components/public-header'
import { Logo } from '@/components/logo'
import { Home, ArrowLeft, Mail, Phone } from 'lucide-react'
import Link from 'next/link'

export default async function PropertiesPage() {
  const supabase = await createClient()

  // Fetch all properties
  const { data: properties, error } = await supabase
    .from('properties')
    .select('*')
    .order('created_at', { ascending: false })

  const propertyList = properties || []

  return (
    <div className="min-h-screen marble-bg">
      {/* Header */}
      <PublicHeader />

      {/* Page Hero */}
      <section className="relative py-16 sm:py-20 md:py-28 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-black via-black/95 to-background" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-white/[0.02] rounded-full blur-3xl" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center px-4 sm:px-6 max-w-4xl mx-auto">
          <p className="text-[10px] sm:text-xs tracking-[0.25em] text-white/50 uppercase mb-5 sm:mb-6 font-light animate-fade-in">
            Property Collection
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extralight text-white mb-5 sm:mb-6 animate-fade-in tracking-[0.05em]">
            ALL PROPERTIES
          </h1>

          {/* Decorative line */}
          <div className="flex items-center justify-center gap-3 mb-5 sm:mb-6 animate-fade-in">
            <div className="h-px w-10 sm:w-14 bg-gradient-to-r from-transparent to-white/40" />
            <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
            <div className="h-px w-10 sm:w-14 bg-gradient-to-l from-transparent to-white/40" />
          </div>

          <p className="text-white/60 text-sm sm:text-base md:text-lg max-w-2xl mx-auto mb-8 font-light tracking-wide animate-fade-in">
            Browse our exclusive collection of luxury properties
          </p>

          {/* Property Count */}
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-white/[0.1] bg-white/[0.03] animate-fade-in">
            <Home className="h-4 w-4 text-white/50" />
            <span className="text-sm text-white/70 font-light">
              {propertyList.length} {propertyList.length === 1 ? 'Property' : 'Properties'}
            </span>
          </div>
        </div>
      </section>

      {/* Properties Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 md:py-16">
        {propertyList.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-12 sm:p-16 md:p-20 text-center">
            <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-8 rounded-full bg-white/[0.05] border border-white/[0.08] flex items-center justify-center">
              <Home className="h-8 w-8 sm:h-10 sm:w-10 text-white/30" />
            </div>
            <h3 className="text-xl sm:text-2xl font-extralight text-white tracking-[0.1em] mb-4">
              No Properties Available
            </h3>
            <p className="text-white/50 text-sm sm:text-base font-light mb-8 max-w-md mx-auto">
              Check back soon for new listings
            </p>
            <Link href="/">
              <button className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-white/[0.1] bg-white/[0.03] text-white/80 hover:text-white hover:bg-white/[0.06] transition-all text-sm font-light">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
            {propertyList.map((property, index) => (
              <div
                key={property.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <PublicPropertyCard property={property} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* CTA Section */}
      {propertyList.length > 0 && (
        <section className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-8 sm:p-12 text-center">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extralight text-white tracking-[0.06em] mb-4">
              DIDN&apos;T FIND WHAT YOU&apos;RE LOOKING FOR?
            </h2>
            <p className="text-white/50 text-sm sm:text-base font-light max-w-xl mx-auto mb-8">
              Contact us directly and let us help you find your perfect luxury property
            </p>
            <a href="mailto:brody@cadizlluis.com">
              <button className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg border border-white/[0.15] bg-white/[0.03] text-white/90 hover:bg-white/[0.08] hover:border-white/[0.25] transition-all text-sm font-light">
                <Mail className="h-4 w-4" />
                Contact Us
              </button>
            </a>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="relative mt-12 sm:mt-16 border-t border-white/[0.06]">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/40" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Brand */}
            <div className="flex items-center gap-3">
              <div className="scale-[0.65]">
                <Logo />
              </div>
              <div className="h-7 w-px bg-gradient-to-b from-transparent via-white/15 to-transparent" />
              <div>
                <h3 className="text-xs tracking-[0.15em] text-white/80 font-light">
                  LUXURY CONCIERGE
                </h3>
                <p className="text-[9px] tracking-[0.1em] text-white/40 font-light">
                  CADIZ & LLUIS
                </p>
              </div>
            </div>

            {/* Contact */}
            <div className="flex items-center gap-4 sm:gap-6">
              <a
                href="tel:+18186424050"
                className="flex items-center gap-2 text-white/50 hover:text-white/80 transition-colors"
              >
                <Phone className="h-3.5 w-3.5" />
                <span className="text-xs font-light hidden sm:inline">+1 (818) 642-4050</span>
              </a>
              <a
                href="mailto:brody@cadizlluis.com"
                className="flex items-center gap-2 text-white/50 hover:text-white/80 transition-colors"
              >
                <Mail className="h-3.5 w-3.5" />
                <span className="text-xs font-light hidden sm:inline">brody@cadizlluis.com</span>
              </a>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent my-6 sm:my-8" />

          {/* Copyright */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center">
            <p className="text-white/40 text-xs font-light">
              &copy; {new Date().getFullYear()} Luxury Concierge. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-white/30 text-xs font-light">
              <a href="#" className="hover:text-white/50 transition-colors">Privacy</a>
              <span className="text-white/20">|</span>
              <a href="#" className="hover:text-white/50 transition-colors">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
