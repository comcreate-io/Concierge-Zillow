import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PublicPropertyCard } from '@/components/public-property-card'
import { Logo } from '@/components/logo'
import { Home } from 'lucide-react'

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
      <header className="border-b border-border/20 backdrop-blur-sm sticky top-0 z-10 bg-background/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex items-center justify-center">
            {/* Logo and Brand */}
            <div className="flex items-center gap-3 sm:gap-4">
              <Logo />
              <div className="flex flex-col">
                <div className="luxury-heading text-lg sm:text-xl md:text-2xl tracking-widest text-white">
                  LUXURY CONCIERGE
                </div>
                <div className="text-[10px] sm:text-xs tracking-[0.2em] text-white/70 uppercase">
                  Cadiz & Lluis
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="text-center mb-12">
          <h1 className="luxury-heading text-4xl sm:text-5xl md:text-6xl font-bold text-white tracking-widest mb-4">
            LUXURY PROPERTIES
          </h1>
          <p className="text-white/70 text-lg sm:text-xl tracking-wide uppercase max-w-2xl mx-auto">
            Discover our exclusive portfolio of premium properties
          </p>
          <div className="mt-6">
            <Badge variant="secondary" className="bg-white/10 text-white border-white/20 backdrop-blur-sm text-lg px-6 py-3">
              {propertyList.length} {propertyList.length === 1 ? 'Property' : 'Properties'} Available
            </Badge>
          </div>
        </div>

        {/* Properties Grid */}
        {propertyList.length === 0 ? (
          <Card className="bg-card/50 border-border/30 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <Home className="h-16 w-16 text-white/40 mx-auto mb-4" />
              <h3 className="luxury-heading text-xl font-semibold text-white mb-2">No Properties Available</h3>
              <p className="text-white/70">Check back soon for new luxury properties.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {propertyList.map((property) => (
              <PublicPropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-16 border-t border-border/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid md:grid-cols-2 gap-8 text-center">
            <div>
              <h3 className="luxury-heading tracking-widest text-white font-semibold mb-3">LUXURY CONCIERGE</h3>
              <p className="text-white/60 text-sm">
                Your trusted partner in premium property management
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3 uppercase tracking-wide text-sm">Contact</h4>
              <p className="text-white/60 text-sm">
                For inquiries about our properties,<br />
                please contact your property manager
              </p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border/20 text-center">
            <p className="text-white/50 text-sm">
              © {new Date().getFullYear()} Luxury Concierge. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
