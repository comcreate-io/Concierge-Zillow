import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { PublicPropertyCard } from '@/components/public-property-card'
import { Logo } from '@/components/logo'
import { PublicHeader } from '@/components/public-header'
import { Home, Mail, Phone, ChevronRight } from 'lucide-react'
import Link from 'next/link'

export default async function HomePage() {
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

      {/* Hero Section */}
      <section className="relative min-h-[50vh] sm:min-h-[60vh] md:min-h-[75vh] flex items-center justify-center overflow-hidden">
        {/* Background Layers */}
        <div className="absolute inset-0">
          {/* Base gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-black via-black/95 to-background" />

          {/* Subtle image overlay */}
          <div className="absolute inset-0 opacity-20">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: "url('https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1920&q=80')" }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/50" />
          </div>

          {/* Subtle radial glow */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-white/[0.02] rounded-full blur-3xl" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center px-4 sm:px-6 max-w-5xl mx-auto py-16 sm:py-20">
          {/* Pre-title */}
          <p className="text-[10px] sm:text-xs tracking-[0.25em] text-white/50 uppercase mb-6 sm:mb-8 animate-fade-in font-light">
            Exclusive Property Collection
          </p>

          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extralight text-white mb-6 sm:mb-8 animate-fade-in tracking-[0.05em] leading-tight">
            LUXURY
            <br />
            <span className="text-white/90">LIVING</span>
          </h1>

          {/* Decorative line */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 mb-6 sm:mb-8 animate-fade-in">
            <div className="h-px w-12 sm:w-16 bg-gradient-to-r from-transparent to-white/40" />
            <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
            <div className="h-px w-12 sm:w-16 bg-gradient-to-l from-transparent to-white/40" />
          </div>

          {/* Subtitle */}
          <p className="text-white/60 text-sm sm:text-base md:text-lg max-w-2xl mx-auto mb-10 sm:mb-12 font-light tracking-wide leading-relaxed animate-fade-in px-4">
            Explore our handpicked selection of premium properties, each offering unparalleled sophistication
          </p>

          {/* CTA Button */}
          <div className="animate-fade-in">
            <Link href="/properties">
              <button className="inline-flex items-center gap-2 px-8 sm:px-10 py-3.5 sm:py-4 rounded-lg border border-white/[0.15] bg-white/[0.03] text-white/90 hover:bg-white/[0.08] hover:border-white/[0.25] active:bg-white/[0.1] transition-all duration-300 text-sm sm:text-base tracking-wide font-light">
                View Properties
                <ChevronRight className="h-4 w-4" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Collection */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20 md:py-28">
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16">
          <p className="text-[10px] sm:text-xs tracking-[0.2em] text-white/40 uppercase mb-4 font-light">
            Featured Properties
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extralight text-white tracking-[0.08em] mb-5">
            EXCEPTIONAL HOMES
          </h2>
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="h-px w-8 sm:w-12 bg-gradient-to-r from-transparent to-white/30" />
            <div className="w-1 h-1 rounded-full bg-white/50" />
            <div className="h-px w-8 sm:w-12 bg-gradient-to-l from-transparent to-white/30" />
          </div>
          <p className="text-white/50 text-sm sm:text-base max-w-2xl mx-auto font-light tracking-wide">
            Each property in our collection represents the pinnacle of luxury living
          </p>
        </div>

        {propertyList.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-12 sm:p-16 md:p-20 text-center">
            <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-8 rounded-full bg-white/[0.05] border border-white/[0.08] flex items-center justify-center">
              <Home className="h-8 w-8 sm:h-10 sm:w-10 text-white/30" />
            </div>
            <h3 className="text-xl sm:text-2xl font-extralight text-white tracking-[0.1em] mb-4">
              Coming Soon
            </h3>
            <p className="text-white/50 text-sm sm:text-base font-light max-w-md mx-auto">
              Our exclusive collection is being curated. Check back soon for extraordinary properties.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
            {propertyList.slice(0, 6).map((property, index) => (
              <div
                key={property.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <PublicPropertyCard property={property} />
              </div>
            ))}
          </div>
        )}

        {propertyList.length > 6 && (
          <div className="text-center mt-12 sm:mt-16">
            <Link href="/properties">
              <button className="inline-flex items-center gap-2 px-8 sm:px-10 py-3.5 rounded-lg border border-white/[0.1] bg-white/[0.03] text-white/80 hover:text-white hover:bg-white/[0.06] hover:border-white/[0.15] transition-all duration-300 text-sm tracking-wide font-light">
                View All Properties
                <ChevronRight className="h-4 w-4" />
              </button>
            </Link>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="relative mt-16 sm:mt-24 border-t border-white/[0.06]">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/40" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          {/* Main Footer Content */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12 mb-12">
            {/* Brand Section */}
            <div className="sm:col-span-2 lg:col-span-5">
              <div className="flex items-center gap-3 mb-5">
                <div className="scale-75">
                  <Logo />
                </div>
                <div className="h-8 w-px bg-gradient-to-b from-transparent via-white/15 to-transparent" />
                <div>
                  <h3 className="text-sm tracking-[0.15em] text-white/90 font-light">
                    LUXURY CONCIERGE
                  </h3>
                  <p className="text-[10px] tracking-[0.1em] text-white/40 font-light">
                    CADIZ & LLUIS
                  </p>
                </div>
              </div>
              <p className="text-white/50 text-sm leading-relaxed mb-6 max-w-sm font-light">
                Your trusted partner in premium property management, delivering exceptional service and exclusive access to the finest properties.
              </p>

              {/* Contact Info */}
              <div className="space-y-3">
                <a
                  href="tel:+18186424050"
                  className="flex items-center gap-3 text-white/50 hover:text-white/80 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center group-hover:bg-white/[0.08] transition-colors">
                    <Phone className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-sm font-light">+1 (818) 642-4050</span>
                </a>
                <a
                  href="mailto:brody@cadizlluis.com"
                  className="flex items-center gap-3 text-white/50 hover:text-white/80 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center group-hover:bg-white/[0.08] transition-colors">
                    <Mail className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-sm font-light">brody@cadizlluis.com</span>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div className="lg:col-span-3">
              <h4 className="text-[10px] text-white/40 uppercase tracking-[0.15em] mb-5 font-light">Properties</h4>
              <ul className="space-y-3">
                {['Featured', 'New Listings', 'Luxury Homes', 'All Properties'].map((item, i) => (
                  <li key={i}>
                    <Link
                      href="/properties"
                      className="text-white/50 hover:text-white/80 transition-colors text-sm font-light flex items-center gap-2"
                    >
                      <span className="w-1 h-1 rounded-full bg-white/30" />
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company Links */}
            <div className="lg:col-span-4">
              <h4 className="text-[10px] text-white/40 uppercase tracking-[0.15em] mb-5 font-light">Get In Touch</h4>
              <p className="text-white/50 text-sm font-light leading-relaxed mb-5">
                Ready to find your perfect luxury property? Contact us today and let our experts guide you.
              </p>
              <a href="mailto:brody@cadizlluis.com">
                <button className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg border border-white/[0.1] bg-white/[0.03] text-white/70 hover:text-white hover:bg-white/[0.06] transition-all text-sm font-light">
                  <Mail className="h-3.5 w-3.5" />
                  Contact Us
                </button>
              </a>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent mb-8" />

          {/* Bottom Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-6 text-white/40 text-xs font-light">
              <span>&copy; {new Date().getFullYear()} Luxury Concierge</span>
              <span className="hidden sm:inline text-white/20">|</span>
              <a href="#" className="hover:text-white/60 transition-colors">Privacy Policy</a>
              <span className="hidden sm:inline text-white/20">|</span>
              <a href="#" className="hover:text-white/60 transition-colors">Terms of Service</a>
            </div>
            <p className="text-[10px] text-white/30 tracking-[0.1em] uppercase font-light">
              Cadiz & Lluis
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
