'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Home, MapPin, BedDouble, Bath, Maximize, ChevronLeft, ChevronRight } from 'lucide-react'
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

  return (
    <Card className="overflow-hidden elevated-card group animate-fade-in p-0">
      {/* Property Image Gallery */}
      {showImages ? (
        <div className="h-72 bg-background/30 relative luxury-overlay premium-image group/gallery">
          {images.length > 0 ? (
            <>
            <img
              src={images[currentImageIndex]}
              alt={`${property.address || 'Property'} - Image ${currentImageIndex + 1}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
            {/* Navigation Arrows - Always visible on mobile, hover on desktop */}
            {images.length > 1 && (
              <>
                {/* Left Arrow */}
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
                  }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 sm:p-2 transition-all opacity-100 sm:opacity-0 sm:group-hover/gallery:opacity-100"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
                {/* Right Arrow */}
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 sm:p-2 transition-all opacity-100 sm:opacity-0 sm:group-hover/gallery:opacity-100"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
                {/* Image counter indicator */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                  {currentImageIndex + 1} / {images.length}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-background to-card">
            <Home className="h-24 w-24 text-white/20" />
          </div>
        )}
        {/* Flexible Pricing Badge - max 2 prices */}
        {(property.show_monthly_rent || property.show_nightly_rate || property.show_purchase_price) && (() => {
          // Build array of prices to display (max 2)
          const prices: { value: number; label: string; note?: string }[] = []
          if (property.show_monthly_rent && property.custom_monthly_rent) {
            prices.push({ value: property.custom_monthly_rent, label: 'per month' })
          }
          if (property.show_nightly_rate && property.custom_nightly_rate && prices.length < 2) {
            prices.push({ value: property.custom_nightly_rate, label: 'per night', note: 'not including taxes' })
          }
          if (property.show_purchase_price && property.custom_purchase_price && prices.length < 2) {
            prices.push({ value: property.custom_purchase_price, label: 'purchase price' })
          }

          if (prices.length === 0) return null

          return (
            <div className="absolute top-4 right-4 z-10">
              <div className="relative">
                {/* Glow effect background */}
                <div className="absolute inset-0 bg-black/10 blur-lg rounded-lg"></div>
                {/* Main price container */}
                <div className="relative backdrop-blur-sm bg-black/30 border border-white/20 rounded-lg shadow-xl px-3 py-2">
                  <div className="flex flex-col items-end gap-1">
                    {prices.map((price, index) => (
                      <div key={index} className="flex flex-col items-end">
                        <span className="text-lg sm:text-xl font-bold text-white tracking-tight leading-none">
                          {formatCurrency(price.value)}
                        </span>
                        <span className="text-[10px] text-white/70 font-semibold uppercase tracking-wider mt-0.5">
                          {price.label}
                        </span>
                        {price.note && (
                          <span className="text-[9px] text-white/60 italic">
                            {price.note}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )
        })()}
        </div>
      ) : null}

      {/* Property Details - Fully Clickable */}
      <Link
        href={clientId ? `/property/${property.id}?client=${clientId}` : `/property/${property.id}`}
        className="block cursor-pointer"
      >
        <CardContent className="p-7 space-y-6 flex flex-col hover:bg-white/5 transition-colors duration-300">
          {/* Address - respect show_address */}
          {property.show_address !== false && (
            <div className="min-h-[80px] flex items-start">
              <div className="flex items-start gap-2 sm:gap-3">
                <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-white/80 flex-shrink-0 mt-1" />
                <h3 className="text-lg sm:text-xl font-bold text-white line-clamp-2 tracking-wide leading-relaxed group-hover:text-white transition-colors duration-300">
                  {property.address || 'Address not available'}
                </h3>
              </div>
            </div>
          )}

          {/* Property Stats with Enhanced Design - respect visibility toggles */}
          {(() => {
            const showBedrooms = property.show_bedrooms !== false
            const showBathrooms = property.show_bathrooms !== false
            const showArea = property.show_area !== false
            const visibleStats = [showBedrooms, showBathrooms, showArea].filter(Boolean).length

            if (visibleStats === 0) return null

            const gridCols = visibleStats === 3 ? 'grid-cols-3' : visibleStats === 2 ? 'grid-cols-2' : 'grid-cols-1'

            return (
              <div className={`grid ${gridCols} gap-3 sm:gap-4`}>
                {showBedrooms && (
                  <div className="text-center p-3 sm:p-4 glass-card-accent rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl">
                    <BedDouble className="h-6 w-6 mx-auto mb-2 text-white" />
                    <p className="text-2xl font-bold text-white">{formatPropertyValue(property.bedrooms)}</p>
                    <p className="text-[10px] text-white/70 uppercase tracking-widest mt-1.5 font-semibold">
                      {property.label_bedrooms || 'Beds'}
                    </p>
                  </div>
                )}
                {showBathrooms && (
                  <div className="text-center p-3 sm:p-4 glass-card-accent rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl">
                    <Bath className="h-6 w-6 mx-auto mb-2 text-white" />
                    <p className="text-2xl font-bold text-white">{formatPropertyValue(property.bathrooms)}</p>
                    <p className="text-[10px] text-white/70 uppercase tracking-widest mt-1.5 font-semibold">
                      {property.label_bathrooms || 'Baths'}
                    </p>
                  </div>
                )}
                {showArea && (
                  <div className="text-center p-3 sm:p-4 glass-card-accent rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl">
                    <Maximize className="h-6 w-6 mx-auto mb-2 text-white" />
                    <p className="text-2xl font-bold text-white">
                      {formatPropertyValue(property.area, formatNumber)}
                    </p>
                    <p className="text-[10px] text-white/70 uppercase tracking-widest mt-1.5 font-semibold">
                      {property.label_area || 'Sq Ft'}
                    </p>
                  </div>
                )}
              </div>
            )
          })()}

          {/* Price Display - Full Width Card */}
          {(() => {
            const prices: { value: number; label: string }[] = []
            if (property.show_monthly_rent && property.custom_monthly_rent) {
              prices.push({ value: property.custom_monthly_rent, label: 'per month' })
            }
            if (property.show_nightly_rate && property.custom_nightly_rate) {
              prices.push({ value: property.custom_nightly_rate, label: 'per night' })
            }
            if (property.show_purchase_price && property.custom_purchase_price) {
              prices.push({ value: property.custom_purchase_price, label: 'purchase price' })
            }

            return (
              <div className="text-center p-3 glass-card-accent rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
                <div className="flex items-center justify-center gap-4 min-h-[44px]">
                  {prices.length > 0 ? (
                    prices.map((price, index) => (
                      <div key={index} className="flex flex-col items-center">
                        <p className="text-xl font-bold text-white">{formatCurrency(price.value)}</p>
                        <p className="text-[9px] text-white/70 uppercase tracking-widest font-semibold">
                          {price.label}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-white/40 text-sm">Price on request</p>
                  )}
                </div>
              </div>
            )
          })()}

        </CardContent>
      </Link>
    </Card>
  )
}
