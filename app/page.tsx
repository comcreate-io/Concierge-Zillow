import { Logo } from '@/components/logo'
import { PublicHeader } from '@/components/public-header'
import { Mail, Phone, ChevronRight, Shield, Clock, Users, Target, Car, Plane, Home, Gem } from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen marble-bg">
      {/* Header */}
      <PublicHeader />

      {/* Hero Section */}
      <section className="relative min-h-[85vh] sm:min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background Layers */}
        <div className="absolute inset-0">
          {/* Base gradient - Deep Slate from brand */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0E1A24] via-black to-black" />

          {/* Subtle geometric pattern overlay */}
          <div className="absolute inset-0 opacity-[0.03]">
            <div className="absolute inset-0" style={{
              backgroundImage: `linear-gradient(45deg, #fff 1px, transparent 1px), linear-gradient(-45deg, #fff 1px, transparent 1px)`,
              backgroundSize: '60px 60px'
            }} />
          </div>

          {/* Elegant radial glow */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-white/[0.015] rounded-full blur-3xl" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center px-4 sm:px-6 max-w-5xl mx-auto py-20 sm:py-24">
          {/* Pre-title */}
          <p className="text-[10px] sm:text-xs tracking-[0.3em] text-[#777784] uppercase mb-8 sm:mb-10 animate-fade-in font-light">
            Cadiz & Lluis
          </p>

          {/* Main Heading - Brand Tagline */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extralight text-white mb-8 sm:mb-10 animate-fade-in tracking-[0.08em] leading-tight">
            Discreet Access to
            <br />
            <span className="text-[#D7D7DD]">Exceptional Experiences</span>
          </h1>

          {/* Decorative line */}
          <div className="flex items-center justify-center gap-4 sm:gap-5 mb-8 sm:mb-10 animate-fade-in">
            <div className="h-px w-16 sm:w-24 bg-gradient-to-r from-transparent to-white/30" />
            <div className="w-1.5 h-1.5 rounded-full bg-white/50" />
            <div className="h-px w-16 sm:w-24 bg-gradient-to-l from-transparent to-white/30" />
          </div>

          {/* Subtitle - Brand Promise */}
          <p className="text-[#777784] text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-12 sm:mb-14 font-light tracking-wide leading-relaxed animate-fade-in px-4">
            Defined by precision and trust
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in">
            <Link href="/properties">
              <button className="inline-flex items-center gap-2 px-8 sm:px-10 py-3.5 sm:py-4 rounded-lg bg-white text-black hover:bg-[#D7D7DD] active:bg-[#777784] transition-all duration-300 text-sm sm:text-base tracking-wide font-medium">
                Explore Properties
                <ChevronRight className="h-4 w-4" />
              </button>
            </Link>
            <a href="mailto:brody@cadizlluis.com">
              <button className="inline-flex items-center gap-2 px-8 sm:px-10 py-3.5 sm:py-4 rounded-lg border border-white/[0.15] bg-white/[0.03] text-white/90 hover:bg-white/[0.08] hover:border-white/[0.25] active:bg-white/[0.1] transition-all duration-300 text-sm sm:text-base tracking-wide font-light">
                Contact Us
              </button>
            </a>
          </div>
        </div>

      </section>

      {/* Core Values Section */}
      <section className="relative py-20 sm:py-28 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Section Header */}
          <div className="text-center mb-16 sm:mb-20">
            <p className="text-[10px] sm:text-xs tracking-[0.25em] text-[#777784] uppercase mb-4 font-light">
              Our Philosophy
            </p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extralight text-white tracking-[0.08em] mb-5">
              THE CONCIERGE STANDARD
            </h2>
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="h-px w-8 sm:w-12 bg-gradient-to-r from-transparent to-white/30" />
              <div className="w-1 h-1 rounded-full bg-white/50" />
              <div className="h-px w-8 sm:w-12 bg-gradient-to-l from-transparent to-white/30" />
            </div>
          </div>

          {/* Values Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {[
              {
                icon: Shield,
                title: 'Discretion',
                description: 'Your privacy is paramount. Every interaction is handled with the utmost confidentiality.'
              },
              {
                icon: Target,
                title: 'Precision',
                description: 'Meticulous attention to detail ensures flawless execution of every request.'
              },
              {
                icon: Users,
                title: 'Trust',
                description: 'Built on integrity and transparency, we become your trusted partner in excellence.'
              },
              {
                icon: Clock,
                title: 'Availability',
                description: 'Around-the-clock service ensures we are always ready when you need us.'
              }
            ].map((value, index) => (
              <div
                key={index}
                className="group p-8 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12] transition-all duration-500"
              >
                <div className="w-12 h-12 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center mb-6 group-hover:bg-white/[0.08] transition-colors">
                  <value.icon className="h-5 w-5 text-white/70" />
                </div>
                <h3 className="text-lg font-light text-white tracking-[0.1em] uppercase mb-3">
                  {value.title}
                </h3>
                <p className="text-sm text-[#777784] font-light leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="relative py-20 sm:py-28 bg-gradient-to-b from-transparent via-[#0E1A24]/30 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Section Header */}
          <div className="text-center mb-16 sm:mb-20">
            <p className="text-[10px] sm:text-xs tracking-[0.25em] text-[#777784] uppercase mb-4 font-light">
              What We Offer
            </p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extralight text-white tracking-[0.08em] mb-5">
              BESPOKE SERVICES
            </h2>
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="h-px w-8 sm:w-12 bg-gradient-to-r from-transparent to-white/30" />
              <div className="w-1 h-1 rounded-full bg-white/50" />
              <div className="h-px w-8 sm:w-12 bg-gradient-to-l from-transparent to-white/30" />
            </div>
            <p className="text-[#777784] text-sm sm:text-base max-w-2xl mx-auto font-light tracking-wide">
              Tailored experiences crafted to exceed your expectations
            </p>
          </div>

          {/* Services Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                icon: Home,
                title: 'Luxury Properties',
                description: 'Access to exclusive residences and premium real estate, curated for discerning clients.',
                link: '/properties'
              },
              {
                icon: Car,
                title: 'Private Mobility',
                description: 'Seamless transportation solutions from chauffeur services to exotic car rentals.',
                link: null
              },
              {
                icon: Plane,
                title: 'Travel & Experiences',
                description: 'Bespoke travel arrangements and curated lifestyle experiences worldwide.',
                link: null
              },
              {
                icon: Gem,
                title: 'Lifestyle Management',
                description: 'Personal assistance for all aspects of luxury living, from events to everyday needs.',
                link: null
              },
              {
                icon: Users,
                title: 'VIP Access',
                description: 'Exclusive entry to private events, members-only venues, and sought-after reservations.',
                link: null
              },
              {
                icon: Shield,
                title: 'Personal Services',
                description: 'Dedicated support for security, privacy, and specialized personal requirements.',
                link: null
              }
            ].map((service, index) => (
              <div
                key={index}
                className="group relative p-8 rounded-xl border border-white/[0.06] bg-black/40 hover:bg-white/[0.03] hover:border-white/[0.12] transition-all duration-500 overflow-hidden"
              >
                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative">
                  <div className="w-14 h-14 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center mb-6 group-hover:bg-white/[0.08] group-hover:border-white/[0.15] transition-all duration-300">
                    <service.icon className="h-6 w-6 text-white/70 group-hover:text-white/90 transition-colors" />
                  </div>
                  <h3 className="text-lg font-light text-white tracking-[0.08em] uppercase mb-3">
                    {service.title}
                  </h3>
                  <p className="text-sm text-[#777784] font-light leading-relaxed mb-4">
                    {service.description}
                  </p>
                  {service.link && (
                    <Link href={service.link} className="inline-flex items-center gap-2 text-xs tracking-[0.1em] text-white/60 hover:text-white transition-colors uppercase">
                      Explore
                      <ChevronRight className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="relative py-20 sm:py-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center">
            <p className="text-[10px] sm:text-xs tracking-[0.25em] text-[#777784] uppercase mb-4 font-light">
              About Us
            </p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extralight text-white tracking-[0.08em] mb-8">
              CADIZ & LLUIS
            </h2>
            <div className="flex items-center justify-center gap-3 mb-10">
              <div className="h-px w-8 sm:w-12 bg-gradient-to-r from-transparent to-white/30" />
              <div className="w-1 h-1 rounded-full bg-white/50" />
              <div className="h-px w-8 sm:w-12 bg-gradient-to-l from-transparent to-white/30" />
            </div>
            <p className="text-[#D7D7DD] text-base sm:text-lg md:text-xl font-light leading-relaxed max-w-3xl mx-auto mb-6">
              We are a boutique concierge firm dedicated to providing discreet, personalized services for individuals who value excellence and privacy.
            </p>
            <p className="text-[#777784] text-sm sm:text-base font-light leading-relaxed max-w-3xl mx-auto">
              With deep expertise in luxury real estate, lifestyle management, and bespoke experiences, we serve as your trusted partner in navigating the world of refined living. Our commitment to discretion, precision, and trust sets the foundation for lasting relationships built on mutual respect and exceptional service.
            </p>
          </div>
        </div>
      </section>

      {/* Contact CTA Section */}
      <section className="relative py-20 sm:py-28 border-t border-white/[0.06] overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: "url('https://res.cloudinary.com/dku1gnuat/image/upload/v1767797886/quoteCover_qmol4g.jpg')" }}
          />
          <div className="absolute inset-0 bg-black/70" />
          <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-[10px] sm:text-xs tracking-[0.25em] text-[#777784] uppercase mb-4 font-light">
            Begin Your Journey
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extralight text-white tracking-[0.08em] mb-6">
            LET US SERVE YOU
          </h2>
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="h-px w-8 sm:w-12 bg-gradient-to-r from-transparent to-white/30" />
            <div className="w-1 h-1 rounded-full bg-white/50" />
            <div className="h-px w-8 sm:w-12 bg-gradient-to-l from-transparent to-white/30" />
          </div>
          <p className="text-[#777784] text-sm sm:text-base font-light leading-relaxed max-w-2xl mx-auto mb-10">
            Experience the difference of having a dedicated team committed to making your life extraordinary. Reach out to discuss how we can assist you.
          </p>

          {/* Contact Options */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-10">
            <a
              href="tel:+18186424050"
              className="flex items-center gap-3 px-6 py-3 rounded-lg border border-white/[0.1] bg-white/[0.03] text-white/80 hover:text-white hover:bg-white/[0.06] hover:border-white/[0.15] transition-all group"
            >
              <Phone className="h-4 w-4 text-white/60 group-hover:text-white/80 transition-colors" />
              <span className="text-sm font-light tracking-wide">+1 (818) 642-4050</span>
            </a>
            <a
              href="mailto:brody@cadizlluis.com"
              className="flex items-center gap-3 px-6 py-3 rounded-lg border border-white/[0.1] bg-white/[0.03] text-white/80 hover:text-white hover:bg-white/[0.06] hover:border-white/[0.15] transition-all group"
            >
              <Mail className="h-4 w-4 text-white/60 group-hover:text-white/80 transition-colors" />
              <span className="text-sm font-light tracking-wide">brody@cadizlluis.com</span>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-white/[0.06]">
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
                  <p className="text-[10px] tracking-[0.1em] text-[#777784] font-light">
                    CADIZ & LLUIS
                  </p>
                </div>
              </div>
              <p className="text-[#777784] text-sm leading-relaxed mb-6 max-w-sm font-light">
                Discreet access to exceptional experiences, defined by precision and trust. Your trusted partner in luxury living.
              </p>

              {/* Contact Info */}
              <div className="space-y-3">
                <a
                  href="tel:+18186424050"
                  className="flex items-center gap-3 text-[#777784] hover:text-white/80 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center group-hover:bg-white/[0.08] transition-colors">
                    <Phone className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-sm font-light">+1 (818) 642-4050</span>
                </a>
                <a
                  href="mailto:brody@cadizlluis.com"
                  className="flex items-center gap-3 text-[#777784] hover:text-white/80 transition-colors group"
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
              <h4 className="text-[10px] text-[#777784] uppercase tracking-[0.15em] mb-5 font-light">Services</h4>
              <ul className="space-y-3">
                {['Luxury Properties', 'Private Mobility', 'Travel Experiences', 'Lifestyle Management'].map((item, i) => (
                  <li key={i}>
                    <span className="text-[#777784] hover:text-white/80 transition-colors text-sm font-light flex items-center gap-2 cursor-default">
                      <span className="w-1 h-1 rounded-full bg-white/30" />
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA Section */}
            <div className="lg:col-span-4">
              <h4 className="text-[10px] text-[#777784] uppercase tracking-[0.15em] mb-5 font-light">Get In Touch</h4>
              <p className="text-[#777784] text-sm font-light leading-relaxed mb-5">
                Ready to experience exceptional service? Contact us today and discover what sets us apart.
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
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-6 text-[#777784] text-xs font-light">
              <span>&copy; {new Date().getFullYear()} Cadiz & Lluis</span>
              <span className="hidden sm:inline text-white/20">|</span>
              <a href="#" className="hover:text-white/60 transition-colors">Privacy Policy</a>
              <span className="hidden sm:inline text-white/20">|</span>
              <a href="#" className="hover:text-white/60 transition-colors">Terms of Service</a>
            </div>
            <p className="text-[10px] text-[#777784] tracking-[0.15em] uppercase font-light">
              Discretion • Precision • Trust
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
