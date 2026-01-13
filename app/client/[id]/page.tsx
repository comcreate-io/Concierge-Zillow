import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { PublicPropertyCard } from '@/components/public-property-card'
import { Logo } from '@/components/logo'
import { Mail, Phone, Home, XCircle } from 'lucide-react'
import { Instagram, Facebook, Linkedin, Twitter } from 'lucide-react'
import { formatPhoneNumber } from '@/lib/utils'
import { trackClientAccess } from '@/lib/actions/clients'

export default async function ClientPublicPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // Check if id is a UUID or a slug
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

  // Fetch client with their manager (support both UUID and slug)
  const query = supabase
    .from('clients')
    .select('*, property_managers(*)')

  if (isUUID) {
    query.eq('id', id)
  } else {
    query.eq('slug', id)
  }

  const { data: client, error: clientError } = await query.single()

  if (clientError || !client) {
    notFound()
  }

  // Track that the client accessed their page (async, don't await)
  trackClientAccess(client.id)

  const manager = client.property_managers as any | null

  // Fetch properties assigned to this client (with client-specific pricing visibility)
  const { data: assignments, error: assignmentsError } = await supabase
    .from('client_property_assignments')
    .select(`
      property_id,
      position,
      show_monthly_rent_to_client,
      show_nightly_rate_to_client,
      show_purchase_price_to_client,
      properties(*)
    `)
    .eq('client_id', client.id)
    .order('position', { ascending: true, nullsFirst: false })

  // Merge assignment pricing options with property data
  // Override property's show_* fields based on client-specific settings
  const propertyList = (assignments?.map((a: any) => {
    const prop = a.properties
    if (!prop) return null

    // Only show pricing if both the property has it enabled AND the client assignment allows it
    return {
      ...prop,
      // Override show_* based on client-specific settings
      show_monthly_rent: prop.show_monthly_rent && (a.show_monthly_rent_to_client ?? true),
      show_nightly_rate: prop.show_nightly_rate && (a.show_nightly_rate_to_client ?? true),
      show_purchase_price: prop.show_purchase_price && (a.show_purchase_price_to_client ?? true),
    }
  }).filter(Boolean) || []) as any[]

  // Function to categorize property by state/region
  const categorizeProperty = (address: string): string => {
    if (!address) return 'OTHER'
    const upperAddress = address.toUpperCase()

    // Check for California
    if (upperAddress.includes(', CA') || upperAddress.includes(' CA ') ||
        upperAddress.includes('CALIFORNIA') || upperAddress.endsWith(' CA')) {
      return 'CA'
    }

    // Check for New York
    if (upperAddress.includes(', NY') || upperAddress.includes(' NY ') ||
        upperAddress.includes('NEW YORK') || upperAddress.endsWith(' NY')) {
      return 'NYC'
    }

    // Check for Miami/Florida
    if (upperAddress.includes(', FL') || upperAddress.includes(' FL ') ||
        upperAddress.includes('FLORIDA') || upperAddress.includes('MIAMI') ||
        upperAddress.endsWith(' FL')) {
      return 'MIA'
    }

    // Check for international (no US state pattern or contains country names)
    const usStates = ['AL', 'AK', 'AZ', 'AR', 'CO', 'CT', 'DE', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC']
    const hasUSState = usStates.some(state =>
      upperAddress.includes(`, ${state}`) || upperAddress.includes(` ${state} `) || upperAddress.endsWith(` ${state}`)
    )

    if (!hasUSState) {
      return 'INTL'
    }

    return 'OTHER'
  }

  // Group properties by region
  const groupedProperties = propertyList.reduce((acc: Record<string, any[]>, property) => {
    const category = categorizeProperty(property.address || '')
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(property)
    return acc
  }, {})

  // Define display order and labels
  const regionOrder = ['CA', 'NYC', 'MIA', 'INTL', 'OTHER']
  const regionLabels: Record<string, string> = {
    'CA': 'California',
    'NYC': 'New York',
    'MIA': 'Miami',
    'INTL': 'International',
    'OTHER': 'Other Locations'
  }

  const isClosed = client.status === 'closed'
  const managerFullName = manager?.last_name ? `${manager.name} ${manager.last_name}` : manager?.name

  return (
    <div className="min-h-screen marble-bg">
      {/* Closed Banner */}
      {isClosed && (
        <div className="bg-red-900/80 border-b border-red-700/50 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center justify-center gap-3 text-white">
              <XCircle className="h-5 w-5 sm:h-6 sm:w-6" />
              <span className="text-sm sm:text-base font-semibold tracking-wide uppercase">
                This Portfolio Has Been Closed
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Compact Elegant Header */}
      <header className="relative border-b border-white/[0.08] backdrop-blur-xl bg-gradient-to-b from-black/40 to-black/20">
        {/* Subtle gradient accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-6 sm:py-10">
          {/* Combined Header - Logo, Brand & Client */}
          <div className="flex flex-col items-center text-center animate-fade-in">
            {/* Logo and Brand Row */}
            <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="scale-75 sm:scale-90">
                <Logo />
              </div>
              <div className="h-8 sm:h-10 w-px bg-white/10" />
              <div className="text-left">
                <div className="text-[10px] sm:text-xs tracking-[0.2em] sm:tracking-[0.25em] text-white/70 font-light">
                  LUXURY CONCIERGE
                </div>
                <div className="text-[8px] sm:text-[10px] tracking-[0.15em] text-white/40 uppercase">
                  Cadiz & Lluis
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="w-16 sm:w-24 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-4 sm:mb-6" />

            {/* Client Name */}
            <p className="text-white/40 text-[9px] sm:text-xs tracking-[0.2em] uppercase mb-1 sm:mb-2 font-light">
              Portfolio for
            </p>
            <h1 className="text-xl sm:text-4xl md:text-5xl font-extralight text-white tracking-[0.08em] sm:tracking-[0.15em] mb-2 sm:mb-3">
              {client.name}
            </h1>

            {/* Manager & Count Row */}
            <div className="flex items-center gap-3 sm:gap-4 text-white/50">
              {manager?.name && (
                <>
                  <span className="text-[10px] sm:text-xs tracking-[0.1em] font-light">
                    by {managerFullName}
                  </span>
                  <span className="w-px h-3 bg-white/20" />
                </>
              )}
              <span className="text-[10px] sm:text-xs tracking-[0.1em]">
                {propertyList.length} {propertyList.length === 1 ? 'Property' : 'Properties'}
              </span>
              {isClosed && (
                <>
                  <span className="w-px h-3 bg-white/20" />
                  <span className="text-red-400/80 text-[10px] sm:text-xs tracking-[0.08em] uppercase font-medium">
                    Closed
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-8 sm:py-20">

        {/* Contact Card - Mobile Optimized */}
        {manager && (manager.email || manager.phone) && (
          <div className="mb-10 sm:mb-24 animate-fade-in-delay-2">
            <div className="relative">
              {/* Background glow effect - hidden on mobile for performance */}
              <div className="hidden sm:block absolute inset-0 bg-gradient-to-r from-white/[0.02] via-white/[0.05] to-white/[0.02] rounded-2xl blur-xl" />

              <div className="relative rounded-xl sm:rounded-2xl border border-white/[0.08] bg-black/30 backdrop-blur-md overflow-hidden">
                {/* Top accent line */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                <div className="p-5 sm:p-10">
                  {/* Title - Centered on mobile */}
                  <div className="text-center sm:text-left mb-5 sm:mb-0 sm:hidden">
                    <p className="text-white/40 text-[9px] tracking-[0.25em] uppercase mb-1">Get in Touch</p>
                    <h2 className="text-white text-base tracking-[0.08em] font-light">
                      Contact Your Agent
                    </h2>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 sm:gap-8">
                    {/* Title - Desktop only */}
                    <div className="hidden sm:block">
                      <p className="text-white/40 text-[10px] tracking-[0.3em] uppercase mb-2">Get in Touch</p>
                      <h2 className="text-white text-lg sm:text-xl tracking-[0.1em] font-light">
                        Contact Your Agent
                      </h2>
                    </div>

                    {/* Contact Methods - Full width buttons on mobile */}
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-10">
                      {manager.email && (
                        <a
                          href={`mailto:${manager.email}`}
                          className="group flex items-center gap-3 sm:gap-4 p-3 sm:p-0 rounded-xl sm:rounded-none bg-white/[0.03] sm:bg-transparent border border-white/[0.06] sm:border-0 active:bg-white/[0.08] sm:active:bg-transparent transition-all duration-300"
                        >
                          <div className="p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-white/[0.05] border border-white/[0.08] group-hover:border-white/20 group-hover:bg-white/[0.08] transition-all duration-300">
                            <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-white/70 group-hover:text-white transition-colors" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[9px] sm:text-[10px] text-white/40 uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-0.5 sm:mb-1">Email</p>
                            <span className="text-white/90 text-sm font-light tracking-wide group-hover:text-white transition-colors block truncate">
                              {manager.email}
                            </span>
                          </div>
                        </a>
                      )}
                      {manager.phone && (
                        <a
                          href={`tel:${manager.phone}`}
                          className="group flex items-center gap-3 sm:gap-4 p-3 sm:p-0 rounded-xl sm:rounded-none bg-white/[0.03] sm:bg-transparent border border-white/[0.06] sm:border-0 active:bg-white/[0.08] sm:active:bg-transparent transition-all duration-300"
                        >
                          <div className="p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-white/[0.05] border border-white/[0.08] group-hover:border-white/20 group-hover:bg-white/[0.08] transition-all duration-300">
                            <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-white/70 group-hover:text-white transition-colors" />
                          </div>
                          <div>
                            <p className="text-[9px] sm:text-[10px] text-white/40 uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-0.5 sm:mb-1">Phone</p>
                            <span className="text-white/90 text-sm font-light tracking-wide group-hover:text-white transition-colors">
                              {formatPhoneNumber(manager.phone)}
                            </span>
                          </div>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Properties List */}
        {propertyList.length === 0 ? (
          <Card className="glass-card animate-fade-in border-white/[0.08]">
            <CardContent className="p-10 sm:p-24 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/[0.03] border border-white/[0.08] mb-6 sm:mb-8">
                <Home className="h-8 w-8 sm:h-10 sm:w-10 text-white/30" />
              </div>
              <h3 className="text-xl sm:text-3xl font-extralight text-white mb-3 sm:mb-4 tracking-[0.08em] sm:tracking-[0.1em]">
                Properties Coming Soon
              </h3>
              <p className="text-white/50 text-sm sm:text-base tracking-wide font-light max-w-md mx-auto">
                Your personalized collection is being carefully curated. Check back soon for exclusive listings.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-12 sm:space-y-28">
            {regionOrder.map((region, regionIndex) => {
              const properties = groupedProperties[region]
              if (!properties || properties.length === 0) return null

              return (
                <section key={region} className="animate-fade-in" style={{ animationDelay: `${regionIndex * 0.1}s` }}>
                  {/* Elegant Section Header - Mobile Optimized */}
                  <div className="mb-6 sm:mb-14">
                    <div className="flex items-center gap-3 sm:gap-6 mb-2 sm:mb-4">
                      <span className="w-4 sm:w-12 h-px bg-gradient-to-r from-white/30 to-transparent" />
                      <h2 className="text-xl sm:text-3xl md:text-4xl font-extralight text-white tracking-[0.1em] sm:tracking-[0.2em]">
                        {regionLabels[region]}
                      </h2>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-6 pl-7 sm:pl-18">
                      <span className="text-white/40 text-[10px] sm:text-xs tracking-[0.15em] sm:tracking-[0.2em] uppercase">
                        {properties.length} {properties.length === 1 ? 'Listing' : 'Listings'}
                      </span>
                      <span className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent" />
                    </div>
                  </div>

                  {/* Property Grid - Single column on mobile */}
                  <div className="grid gap-5 sm:gap-10 md:grid-cols-2 lg:grid-cols-3">
                    {properties.map((property: any, index: number) => (
                      <div
                        key={property.id}
                        className="animate-fade-in"
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <PublicPropertyCard property={property} clientId={id} />
                      </div>
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        )}
      </main>

      {/* Elegant Footer - Mobile Optimized */}
      <footer className="mt-12 sm:mt-32 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-10 sm:py-16">
          {manager && (
            <div className="flex flex-col items-center text-center">
              {/* Agent Info */}
              <div className="mb-6 sm:mb-8">
                <p className="text-white/30 text-[9px] sm:text-[10px] tracking-[0.25em] sm:tracking-[0.35em] uppercase mb-2 sm:mb-3">Your Personal Agent</p>
                <h3 className="text-white text-lg sm:text-2xl tracking-[0.1em] sm:tracking-[0.15em] font-extralight mb-0.5 sm:mb-1">
                  {managerFullName}
                </h3>
                {manager.title && (
                  <p className="text-white/40 text-xs sm:text-sm tracking-[0.08em] sm:tracking-[0.1em] font-light">{manager.title}</p>
                )}
              </div>

              {/* Contact Links - Stacked on mobile */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-x-8 sm:gap-y-3 text-sm mb-6 sm:mb-8">
                {manager.email && (
                  <a
                    href={`mailto:${manager.email}`}
                    className="text-white/50 hover:text-white/90 active:text-white transition-colors duration-300 tracking-wide font-light text-xs sm:text-sm py-1"
                  >
                    {manager.email}
                  </a>
                )}
                {manager.email && manager.phone && (
                  <span className="hidden sm:block w-px h-4 bg-white/20" />
                )}
                {manager.phone && (
                  <a
                    href={`tel:${manager.phone}`}
                    className="text-white/50 hover:text-white/90 active:text-white transition-colors duration-300 tracking-wide font-light text-xs sm:text-sm py-1"
                  >
                    {formatPhoneNumber(manager.phone)}
                  </a>
                )}
              </div>

              {/* Social Media Links - Larger touch targets on mobile */}
              {(manager.instagram_url || manager.facebook_url || manager.linkedin_url || manager.twitter_url) && (
                <div className="flex items-center gap-4 sm:gap-6">
                  {manager.instagram_url && (
                    <a
                      href={manager.instagram_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 sm:p-2.5 rounded-full border border-white/[0.08] bg-white/[0.02] text-white/40 hover:text-white active:text-white hover:border-white/20 active:border-white/20 hover:bg-white/[0.05] active:bg-white/[0.08] transition-all duration-300"
                      aria-label="Instagram"
                    >
                      <Instagram className="h-4 w-4" />
                    </a>
                  )}
                  {manager.facebook_url && (
                    <a
                      href={manager.facebook_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 sm:p-2.5 rounded-full border border-white/[0.08] bg-white/[0.02] text-white/40 hover:text-white active:text-white hover:border-white/20 active:border-white/20 hover:bg-white/[0.05] active:bg-white/[0.08] transition-all duration-300"
                      aria-label="Facebook"
                    >
                      <Facebook className="h-4 w-4" />
                    </a>
                  )}
                  {manager.linkedin_url && (
                    <a
                      href={manager.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 sm:p-2.5 rounded-full border border-white/[0.08] bg-white/[0.02] text-white/40 hover:text-white active:text-white hover:border-white/20 active:border-white/20 hover:bg-white/[0.05] active:bg-white/[0.08] transition-all duration-300"
                      aria-label="LinkedIn"
                    >
                      <Linkedin className="h-4 w-4" />
                    </a>
                  )}
                  {manager.twitter_url && (
                    <a
                      href={manager.twitter_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 sm:p-2.5 rounded-full border border-white/[0.08] bg-white/[0.02] text-white/40 hover:text-white active:text-white hover:border-white/20 active:border-white/20 hover:bg-white/[0.05] active:bg-white/[0.08] transition-all duration-300"
                      aria-label="Twitter"
                    >
                      <Twitter className="h-4 w-4" />
                    </a>
                  )}
                </div>
              )}

              {/* Bottom brand mark */}
              <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-white/[0.04] w-full max-w-xs">
                <p className="text-white/20 text-[9px] sm:text-[10px] tracking-[0.25em] sm:tracking-[0.3em] uppercase">
                  Luxury Concierge
                </p>
              </div>
            </div>
          )}
        </div>
      </footer>
    </div>
  )
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  // Check if id is a UUID or a slug
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

  const query = supabase
    .from('clients')
    .select('name, property_managers(name, last_name)')

  if (isUUID) {
    query.eq('id', id)
  } else {
    query.eq('slug', id)
  }

  const { data: client } = await query.single()

  if (!client) {
    return {
      title: 'Property Portfolio',
      description: 'Exclusive property portfolio',
    }
  }

  const manager = client.property_managers as any
  const managerFullName = manager
    ? (manager.last_name ? `${manager.name} ${manager.last_name}` : manager.name)
    : 'Your Agent'

  return {
    title: `${client.name}'s Properties - Curated by ${managerFullName}`,
    description: `Exclusive property portfolio curated for ${client.name} by ${managerFullName}`,
  }
}
