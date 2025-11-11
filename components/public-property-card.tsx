'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Home, MapPin, BedDouble, Bath, Maximize, ExternalLink } from 'lucide-react'
import Link from 'next/link'

type Property = {
  id: string
  address: string | null
  monthly_rent: string | null
  bedrooms: string | null
  bathrooms: string | null
  area: string | null
  zillow_url: string
  images: any
}

export function PublicPropertyCard({ property }: { property: Property }) {
  const firstImage = Array.isArray(property.images) && property.images.length > 0
    ? property.images[0]
    : null

  return (
    <Card className="overflow-hidden glass-card premium-card group animate-fade-in">
      {/* Property Image */}
      <div className="h-56 bg-background/30 relative premium-image">
        {firstImage ? (
          <img
            src={firstImage}
            alt={property.address || 'Property'}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-background to-card">
            <Home className="h-20 w-20 text-white/30" />
          </div>
        )}
        {/* Gradient Overlay for Better Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        {property.monthly_rent && (
          <div className="absolute top-5 right-5">
            <Badge className="bg-white text-background text-lg px-4 py-2 font-bold tracking-wide shadow-xl">
              ${parseFloat(property.monthly_rent.replace(/[^0-9.-]+/g, '')).toLocaleString('en-US')}/mo
            </Badge>
          </div>
        )}
      </div>

      {/* Property Details */}
      <CardContent className="p-6 space-y-5">
        <div className="min-h-[60px]">
          <div className="flex items-start gap-3 mb-3">
            <MapPin className="h-5 w-5 text-white/70 flex-shrink-0 mt-1" />
            <h3 className="text-lg font-semibold text-white line-clamp-2 tracking-wide leading-relaxed min-h-[3.25rem]">
              {property.address || 'Address not available'}
            </h3>
          </div>
        </div>

        {/* Property Stats */}
        <div className="grid grid-cols-3 gap-3">
          {property.bedrooms && (
            <div className="text-center p-3 bg-white/5 rounded-lg backdrop-blur-sm border border-white/10 transition-all hover:bg-white/10 hover:border-white/20">
              <BedDouble className="h-5 w-5 mx-auto mb-2 text-white/80" />
              <p className="text-lg font-bold text-white">{property.bedrooms}</p>
              <p className="text-[10px] text-white/70 uppercase tracking-widest mt-1">Beds</p>
            </div>
          )}
          {property.bathrooms && (
            <div className="text-center p-3 bg-white/5 rounded-lg backdrop-blur-sm border border-white/10 transition-all hover:bg-white/10 hover:border-white/20">
              <Bath className="h-5 w-5 mx-auto mb-2 text-white/80" />
              <p className="text-lg font-bold text-white">{property.bathrooms}</p>
              <p className="text-[10px] text-white/70 uppercase tracking-widest mt-1">Baths</p>
            </div>
          )}
          {property.area && (
            <div className="text-center p-3 bg-white/5 rounded-lg backdrop-blur-sm border border-white/10 transition-all hover:bg-white/10 hover:border-white/20">
              <Maximize className="h-5 w-5 mx-auto mb-2 text-white/80" />
              <p className="text-lg font-bold text-white">{parseFloat(property.area.replace(/[^0-9.-]+/g, '')).toLocaleString('en-US')}</p>
              <p className="text-[10px] text-white/70 uppercase tracking-widest mt-1">Sq Ft</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button asChild className="flex-1 bg-white text-background hover:bg-white/95 premium-button font-semibold tracking-wide" variant="default">
            <Link href={`/property/${property.id}`}>
              View Details
            </Link>
          </Button>
          {property.zillow_url && (
            <Button asChild variant="outline" size="icon" className="border-white/30 text-white hover:bg-white/10 hover:border-white/50">
              <a href={property.zillow_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
