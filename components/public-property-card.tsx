'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Home, MapPin, BedDouble, Bath, Maximize, ChevronLeft, ChevronRight, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency, formatNumber, formatPropertyValue, isValidPropertyValue } from '@/lib/utils'
import { useState } from 'react'

type Property = {
  id: string
  address: string | null
  bedrooms: string | null
  bathrooms: string | null
  area: string | null
  zillow_url: string
  images: any
  // Flexible pricing options from property
  show_monthly_rent?: boolean
  custom_monthly_rent?: number | null
  show_nightly_rate?: boolean
  custom_nightly_rate?: number | null
  show_purchase_price?: boolean
  custom_purchase_price?: number | null
  // Field visibility toggles
  show_bedrooms?: boolean
  show_bathrooms?: boolean
  show_area?: boolean
  show_address?: boolean
  show_images?: boolean
  // Custom labels
  label_bedrooms?: string
  label_bathrooms?: string
  label_area?: string
  label_monthly_rent?: string
  label_nightly_rate?: string
  label_purchase_price?: string
  // Custom notes
  custom_notes?: string | null
}

export function PublicPropertyCard({ property, clientId }: { property: Property; clientId?: string }) {
  const images = Array.isArray(property.images) && property.images.length > 0
    ? property.images
    : []
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  // Determine if images should be shown
  const showImages = property.show_images !== false && images.length > 0

  // Build prices array
  const prices: { value: number; label: string; note?: string }[] = []
  if (property.show_monthly_rent && property.custom_monthly_rent) {
    prices.push({ value: property.custom_monthly_rent, label: '/month' })
  }
  if (property.show_nightly_rate && property.custom_nightly_rate) {
    prices.push({ value: property.custom_nightly_rate, label: '/night' })
  }
  if (property.show_purchase_price && property.custom_purchase_price) {
    prices.push({ value: property.custom_purchase_price, label: '' })
  }

  return (
    <Card className="overflow-hidden group p-0 bg-black/40 backdrop-blur-md border border-white/[0.06] rounded-xl sm:rounded-2xl transition-all duration-500 hover:border-white/[0.12] active:border-white/[0.15] hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)]">
      {/* Property Image Gallery */}
      {showImages ? (
        <div className="aspect-[4/3] bg-black/20 relative overflow-hidden group/gallery">
          {images.length > 0 ? (
            <>
              <img
                src={images[currentImageIndex]}
                alt={`${property.address || 'Property'} - Image ${currentImageIndex + 1}`}
                className="w-full h-full object-cover transition-transform duration-700 sm:group-hover:scale-105"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
              {/* Elegant gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />

              {/* Navigation Arrows - Larger touch targets on mobile */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
                    }}
                    className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-10 bg-black/40 hover:bg-black/60 active:bg-black/70 backdrop-blur-sm text-white/80 hover:text-white rounded-full p-2.5 sm:p-2 transition-all duration-300 opacity-100 sm:opacity-0 sm:group-hover/gallery:opacity-100 border border-white/10"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-5 w-5 sm:h-4 sm:w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
                    }}
                    className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 z-10 bg-black/40 hover:bg-black/60 active:bg-black/70 backdrop-blur-sm text-white/80 hover:text-white rounded-full p-2.5 sm:p-2 transition-all duration-300 opacity-100 sm:opacity-0 sm:group-hover/gallery:opacity-100 border border-white/10"
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-5 w-5 sm:h-4 sm:w-4" />
                  </button>
                  {/* Elegant image indicator dots - Larger on mobile */}
                  <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 sm:gap-1.5">
                    {images.slice(0, 5).map((_, index) => (
                      <button
                        key={index}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setCurrentImageIndex(index)
                        }}
                        className={`h-2 sm:h-1.5 rounded-full transition-all duration-300 ${
                          index === currentImageIndex
                            ? 'bg-white w-5 sm:w-4'
                            : 'bg-white/50 hover:bg-white/70 active:bg-white/80 w-2 sm:w-1.5'
                        }`}
                        aria-label={`Go to image ${index + 1}`}
                      />
                    ))}
                    {images.length > 5 && (
                      <span className="text-white/60 text-[10px] ml-1">+{images.length - 5}</span>
                    )}
                  </div>
                </>
              )}

              {/* Price Badge - Better mobile positioning */}
              {prices.length > 0 && (
                <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 z-10">
                  <div className="flex flex-col gap-1">
                    {prices.slice(0, 2).map((price, index) => (
                      <div
                        key={index}
                        className="inline-flex items-baseline gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-black/50 backdrop-blur-md border border-white/10"
                      >
                        <span className="text-base sm:text-lg font-light text-white tracking-tight">
                          {formatCurrency(price.value)}
                        </span>
                        {price.label && (
                          <span className="text-[9px] sm:text-[10px] text-white/60 uppercase tracking-wider">
                            {price.label}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-black/40 to-black/20">
              <Home className="h-12 w-12 sm:h-16 sm:w-16 text-white/10" />
            </div>
          )}
        </div>
      ) : null}

      {/* Property Details */}
      <Link
        href={clientId ? `/property/${property.id}?client=${clientId}` : `/property/${property.id}`}
        className="block active:bg-white/[0.02]"
      >
        <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-5">
          {/* Address */}
          {property.show_address !== false && (
            <div className="flex items-start justify-between gap-2 sm:gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm sm:text-lg font-light text-white leading-relaxed tracking-wide line-clamp-2 group-hover:text-white/90 transition-colors">
                  {property.address || 'Address not available'}
                </h3>
              </div>
              <div className="flex-shrink-0 p-1.5 sm:p-2 rounded-full bg-white/[0.03] border border-white/[0.06] group-hover:bg-white/[0.08] group-active:bg-white/[0.08] group-hover:border-white/[0.12] transition-all duration-300">
                <ArrowUpRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white/40 group-hover:text-white/80 group-active:text-white/80 transition-colors" />
              </div>
            </div>
          )}

          {/* Elegant Divider */}
          <div className="h-px bg-gradient-to-r from-white/[0.08] via-white/[0.04] to-transparent" />

          {/* Property Stats - Wrap on mobile */}
          {(() => {
            const showBedrooms = property.show_bedrooms !== false
            const showBathrooms = property.show_bathrooms !== false
            const showArea = property.show_area !== false
            const visibleStats = [showBedrooms, showBathrooms, showArea].filter(Boolean).length

            if (visibleStats === 0) return null

            return (
              <div className="flex flex-wrap items-center gap-x-4 sm:gap-x-6 gap-y-2">
                {showBedrooms && (
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <BedDouble className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white/40" />
                    <span className="text-white/90 text-xs sm:text-sm font-light">{formatPropertyValue(property.bedrooms)}</span>
                    <span className="text-white/40 text-[10px] sm:text-xs">{property.label_bedrooms || 'Beds'}</span>
                  </div>
                )}
                {showBedrooms && (showBathrooms || showArea) && (
                  <span className="hidden sm:block w-px h-4 bg-white/10" />
                )}
                {showBathrooms && (
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Bath className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white/40" />
                    <span className="text-white/90 text-xs sm:text-sm font-light">{formatPropertyValue(property.bathrooms)}</span>
                    <span className="text-white/40 text-[10px] sm:text-xs">{property.label_bathrooms || 'Baths'}</span>
                  </div>
                )}
                {showBathrooms && showArea && (
                  <span className="hidden sm:block w-px h-4 bg-white/10" />
                )}
                {showArea && (
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Maximize className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white/40" />
                    <span className="text-white/90 text-xs sm:text-sm font-light">{formatPropertyValue(property.area, formatNumber)}</span>
                    <span className="text-white/40 text-[10px] sm:text-xs">{property.label_area || 'Sq Ft'}</span>
                  </div>
                )}
              </div>
            )
          })()}

          {/* Price Display - Only show if no images (prices shown on image otherwise) */}
          {!showImages && prices.length > 0 && (
            <>
              <div className="h-px bg-gradient-to-r from-white/[0.08] via-white/[0.04] to-transparent" />
              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                {prices.map((price, index) => (
                  <div key={index} className="flex items-baseline gap-1">
                    <span className="text-lg sm:text-xl font-light text-white">{formatCurrency(price.value)}</span>
                    {price.label && (
                      <span className="text-[10px] sm:text-xs text-white/50 uppercase tracking-wider">{price.label}</span>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Price on Request - Only show if no prices at all */}
          {prices.length === 0 && (
            <>
              <div className="h-px bg-gradient-to-r from-white/[0.08] via-white/[0.04] to-transparent" />
              <p className="text-white/30 text-xs sm:text-sm tracking-wide">Price on request</p>
            </>
          )}
        </CardContent>
      </Link>
    </Card>
  )
}
