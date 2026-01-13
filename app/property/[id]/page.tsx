"use client"

import { useState, useEffect } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  Home,
  MapPin,
  Bed,
  Bath,
  Square,
  Calendar,
  Share2,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  User
} from "lucide-react"
import { Instagram, Facebook, Linkedin, Twitter } from "lucide-react"
import { Logo } from "@/components/logo"
import Link from "next/link"
import ReactMarkdown from "react-markdown"
import { getPropertyById, Property as SupabaseProperty } from "@/lib/supabase"
import { createClient } from "@/lib/supabase/client"
import { formatCurrency, formatNumber, formatPropertyValue, isValidPropertyValue, formatPhoneNumber } from "@/lib/utils"

interface PropertyManager {
  id: string
  name: string
  last_name?: string
  title?: string
  email: string
  phone?: string
  profile_picture_url?: string
  instagram_url?: string
  facebook_url?: string
  linkedin_url?: string
  twitter_url?: string
}

interface Property {
  id: string
  address: string
  bedrooms: string
  bathrooms: string
  area: string
  zillow_url: string
  images: string[]
  description: string | null
  scraped_at: string | null
  created_at: string | null
  managers?: PropertyManager[]
  // Pricing display options
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

export default function PropertyListingPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const propertyId = params?.id as string
  const clientId = searchParams?.get('client') || null
  const [property, setProperty] = useState<Property | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const { toast } = useToast()

  useEffect(() => {
    async function loadProperty() {
      if (!propertyId) return

      setIsLoading(true)
      const data = await getPropertyById(propertyId)

      if (data) {
        let showMonthlyRent = (data as any).show_monthly_rent || false
        let showNightlyRate = (data as any).show_nightly_rate || false
        let showPurchasePrice = (data as any).show_purchase_price || false

        // If client ID is provided, fetch client-specific pricing visibility and client's manager
        let clientManager: PropertyManager | null = null
        if (clientId) {
          const supabase = createClient()

          // Check if clientId is a UUID or a slug
          const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clientId)

          // Fetch client first (support both UUID and slug)
          const clientQuery = supabase
            .from('clients')
            .select('id, manager_id')

          if (isUUID) {
            clientQuery.eq('id', clientId)
          } else {
            clientQuery.eq('slug', clientId)
          }

          const { data: clientData } = await clientQuery.single()

          // Get the actual client UUID for assignment lookup
          const actualClientId = clientData?.id || clientId

          // Now fetch assignment using actual client UUID
          const { data: assignment } = await supabase
            .from('client_property_assignments')
            .select('show_monthly_rent_to_client, show_nightly_rate_to_client, show_purchase_price_to_client')
            .eq('client_id', actualClientId)
            .eq('property_id', propertyId)
            .single()

          if (assignment) {
            // Only show pricing if both the property has it enabled AND the client assignment allows it
            showMonthlyRent = showMonthlyRent && (assignment.show_monthly_rent_to_client ?? true)
            showNightlyRate = showNightlyRate && (assignment.show_nightly_rate_to_client ?? true)
            showPurchasePrice = showPurchasePrice && (assignment.show_purchase_price_to_client ?? true)
          }

          // Fetch manager separately using manager_id
          if (clientData?.manager_id) {
            const { data: managerData } = await supabase
              .from('property_managers')
              .select('id, name, last_name, title, email, phone, profile_picture_url, instagram_url, facebook_url, linkedin_url, twitter_url')
              .eq('id', clientData.manager_id)
              .single()

            if (managerData) {
              clientManager = managerData as PropertyManager
            }
          }
        }

        setProperty({
          id: data.id,
          address: data.address || "Address not available",
          bedrooms: data.bedrooms || "0",
          bathrooms: data.bathrooms || "0",
          area: data.area || "0",
          zillow_url: data.zillow_url,
          images: Array.isArray(data.images) ? data.images : [],
          description: data.description || null,
          scraped_at: data.scraped_at,
          created_at: data.created_at,
          // Use client's manager if available, otherwise fall back to property's managers
          managers: clientManager ? [clientManager] : ((data as any).managers || []),
          // Pricing display options (with client-specific overrides applied)
          show_monthly_rent: showMonthlyRent,
          custom_monthly_rent: (data as any).custom_monthly_rent || null,
          show_nightly_rate: showNightlyRate,
          custom_nightly_rate: (data as any).custom_nightly_rate || null,
          show_purchase_price: showPurchasePrice,
          custom_purchase_price: (data as any).custom_purchase_price || null,
          // Field visibility toggles
          show_bedrooms: (data as any).show_bedrooms ?? true,
          show_bathrooms: (data as any).show_bathrooms ?? true,
          show_area: (data as any).show_area ?? true,
          show_address: (data as any).show_address ?? true,
          show_images: (data as any).show_images ?? true,
          // Custom labels
          label_bedrooms: (data as any).label_bedrooms || 'Bedrooms',
          label_bathrooms: (data as any).label_bathrooms || 'Bathrooms',
          label_area: (data as any).label_area || 'Square Feet',
          label_monthly_rent: (data as any).label_monthly_rent || 'Monthly Rent',
          label_nightly_rate: (data as any).label_nightly_rate || 'Nightly Rate',
          label_purchase_price: (data as any).label_purchase_price || 'Purchase Price',
          // Custom notes
          custom_notes: (data as any).custom_notes || null,
        })
      }
      setIsLoading(false)
    }

    loadProperty()
  }, [propertyId, clientId])

  const handleShare = async () => {
    if (!property) return

    // Build pricing text for share
    let pricingText = ''
    if (property.show_monthly_rent && property.custom_monthly_rent) {
      pricingText = `${formatCurrency(property.custom_monthly_rent)}/month`
    } else if (property.show_nightly_rate && property.custom_nightly_rate) {
      pricingText = `${formatCurrency(property.custom_nightly_rate)}/night`
    } else if (property.show_purchase_price && property.custom_purchase_price) {
      pricingText = formatCurrency(property.custom_purchase_price)
    }

    const shareData = {
      title: `${property.address} - Luxury Property`,
      text: `Check out this luxury property: ${property.bedrooms} bed, ${property.bathrooms} bath, ${formatNumber(property.area)} sq ft${pricingText ? ` - ${pricingText}` : ''}`,
      url: window.location.href,
    }

    try {
      // Try using Web Share API (mobile/modern browsers)
      if (navigator.share) {
        await navigator.share(shareData)
        toast({
          title: 'Shared successfully',
          description: 'Property link has been shared',
        })
      } else {
        // Fallback: Copy to clipboard
        await navigator.clipboard.writeText(window.location.href)
        toast({
          title: 'Link copied!',
          description: 'Property URL has been copied to clipboard',
        })
      }
    } catch (error) {
      // User cancelled or error occurred
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Error sharing:', error)
        toast({
          title: 'Unable to share',
          description: 'Please try copying the URL manually',
          variant: 'destructive',
        })
      }
    }
  }

  const nextImage = () => {
    if (!property) return
    setCurrentImageIndex((prev) => (prev + 1) % property.images.length)
  }

  const prevImage = () => {
    if (!property) return
    setCurrentImageIndex((prev) => (prev - 1 + property.images.length) % property.images.length)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen marble-bg flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          <span className="text-white text-lg">Loading property...</span>
        </div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="min-h-screen marble-bg flex items-center justify-center">
        <Card className="bg-card/50 border-border/30 backdrop-blur-sm p-8 text-center max-w-md">
          <Home className="h-16 w-16 text-white/40 mx-auto mb-4" />
          <h2 className="text-2xl text-white mb-2">Property Not Found</h2>
          <p className="text-white/70 mb-4">The property you're looking for doesn't exist</p>
          <Link href={clientId ? `/client/${clientId}` : '/'}>
            <Button className="bg-white text-background hover:bg-white/90">
              Back to Properties
            </Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen marble-bg">
      {/* Elegant Header */}
      <header className="sticky top-0 z-50 backdrop-blur-2xl bg-gradient-to-b from-black/70 via-black/50 to-black/40 border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Brand Section */}
            <Link href={clientId ? `/client/${clientId}` : '/'} className="flex items-center gap-2.5 sm:gap-3 group">
              <div className="scale-[0.6] sm:scale-75 flex-shrink-0 -ml-2 sm:-ml-1 transition-transform group-hover:scale-[0.62] sm:group-hover:scale-[0.77]">
                <Logo />
              </div>
              <div className="h-6 sm:h-8 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent" />
              <div className="flex flex-col">
                <span className="text-[9px] sm:text-[11px] tracking-[0.15em] sm:tracking-[0.2em] text-white/80 font-light">
                  LUXURY CONCIERGE
                </span>
                <span className="text-[7px] sm:text-[9px] tracking-[0.1em] text-white/40 font-light">
                  CADIZ & LLUIS
                </span>
              </div>
            </Link>

            {/* Action Buttons */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Link href={clientId ? `/client/${clientId}` : '/'}>
                <button className="flex items-center justify-center h-9 w-9 sm:h-9 sm:w-auto sm:px-4 rounded-full sm:rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/60 hover:text-white hover:bg-white/[0.06] hover:border-white/[0.12] active:bg-white/[0.08] transition-all duration-200">
                  <ChevronLeft className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                  <span className="hidden sm:inline ml-1 text-[11px] tracking-wide font-light">Back</span>
                </button>
              </Link>
              <button
                onClick={handleShare}
                className="flex items-center justify-center h-9 w-9 sm:h-9 sm:w-auto sm:px-4 rounded-full sm:rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/60 hover:text-white hover:bg-white/[0.06] hover:border-white/[0.12] active:bg-white/[0.08] transition-all duration-200"
              >
                <Share2 className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                <span className="hidden sm:inline ml-1 text-[11px] tracking-wide font-light">Share</span>
              </button>
            </div>
          </div>
        </div>
        {/* Subtle bottom glow line */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-10">

        {/* Hero Section - Address & Price */}
        <div className="mb-4 sm:mb-10 animate-fade-in">
          <div className="text-center mb-4 sm:mb-8">
            {property.show_address !== false ? (
              <h1 className="text-lg sm:text-3xl md:text-4xl font-extralight text-white tracking-[0.03em] sm:tracking-[0.1em] mb-2 leading-snug">
                {property.address}
              </h1>
            ) : (
              <h1 className="text-lg sm:text-3xl md:text-4xl font-extralight text-white tracking-[0.03em] sm:tracking-[0.1em] mb-2">
                Luxury Property
              </h1>
            )}

            {/* Pricing inline */}
            {(property.show_monthly_rent || property.show_nightly_rate || property.show_purchase_price) && (
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-6 mt-3 sm:mt-4">
                {property.show_monthly_rent && property.custom_monthly_rent && (
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg sm:text-2xl md:text-3xl font-light text-white">
                      {formatCurrency(property.custom_monthly_rent)}
                    </span>
                    <span className="text-[9px] sm:text-xs text-white/50 uppercase tracking-wider">/mo</span>
                  </div>
                )}
                {property.show_nightly_rate && property.custom_nightly_rate && (
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg sm:text-2xl md:text-3xl font-light text-white">
                      {formatCurrency(property.custom_nightly_rate)}
                    </span>
                    <span className="text-[9px] sm:text-xs text-white/50 uppercase tracking-wider">/night</span>
                  </div>
                )}
                {property.show_purchase_price && property.custom_purchase_price && (
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg sm:text-2xl md:text-3xl font-light text-white">
                      {formatCurrency(property.custom_purchase_price)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Property Stats - Compact on mobile */}
          {(() => {
            const showBedrooms = property.show_bedrooms !== false
            const showBathrooms = property.show_bathrooms !== false
            const showArea = property.show_area !== false
            const visibleStats = [showBedrooms, showBathrooms, showArea].filter(Boolean).length

            if (visibleStats === 0) return null

            return (
              <div className="flex items-center justify-center gap-3 sm:gap-8 py-3 sm:py-4 border-y border-white/[0.06]">
                {showBedrooms && (
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Bed className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-white/40" />
                    <span className="text-white text-xs sm:text-base font-light">{formatPropertyValue(property.bedrooms)}</span>
                    <span className="text-white/40 text-[10px] sm:text-sm">{property.label_bedrooms || 'Beds'}</span>
                  </div>
                )}
                {showBedrooms && (showBathrooms || showArea) && (
                  <span className="w-px h-3 sm:h-4 bg-white/10" />
                )}
                {showBathrooms && (
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Bath className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-white/40" />
                    <span className="text-white text-xs sm:text-base font-light">{formatPropertyValue(property.bathrooms)}</span>
                    <span className="text-white/40 text-[10px] sm:text-sm">{property.label_bathrooms || 'Baths'}</span>
                  </div>
                )}
                {showBathrooms && showArea && (
                  <span className="w-px h-3 sm:h-4 bg-white/10" />
                )}
                {showArea && (
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Square className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-white/40" />
                    <span className="text-white text-xs sm:text-base font-light">{formatPropertyValue(property.area, formatNumber)}</span>
                    <span className="text-white/40 text-[10px] sm:text-sm">{property.label_area || 'Sq Ft'}</span>
                  </div>
                )}
              </div>
            )
          })()}
        </div>

        {/* Property Images Gallery */}
        {property.show_images !== false && property.images.length > 0 && (
          <div className="mb-6 sm:mb-12 animate-fade-in">
            <div className="rounded-xl sm:rounded-2xl overflow-hidden border border-white/[0.06] bg-black/20">
              <div className="relative group/gallery">
                {/* Main Image */}
                <div className="aspect-[4/3] sm:aspect-[16/9] relative overflow-hidden">
                  <img
                    src={property.images[currentImageIndex]}
                    alt={`${property.address} - Image ${currentImageIndex + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                  {/* Subtle gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

                  {/* Navigation Arrows - Larger touch targets on mobile */}
                  {property.images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-black/50 active:bg-black/70 backdrop-blur-sm text-white rounded-full p-3 sm:p-3 transition-all z-10 border border-white/10"
                      >
                        <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-black/50 active:bg-black/70 backdrop-blur-sm text-white rounded-full p-3 sm:p-3 transition-all z-10 border border-white/10"
                      >
                        <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
                      </button>
                    </>
                  )}

                  {/* Image indicator dots */}
                  {property.images.length > 1 && (
                    <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 sm:gap-2">
                      {property.images.slice(0, 5).map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`h-2 rounded-full transition-all duration-300 ${
                            index === currentImageIndex
                              ? 'bg-white w-5 sm:w-6'
                              : 'bg-white/50 active:bg-white/80 w-2'
                          }`}
                          aria-label={`Go to image ${index + 1}`}
                        />
                      ))}
                      {property.images.length > 5 && (
                        <span className="text-white/60 text-[10px] sm:text-xs ml-1">+{property.images.length - 5}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Thumbnail Strip - Hidden on mobile for cleaner look */}
                {property.images.length > 1 && (
                  <div className="hidden sm:block p-3 sm:p-4 bg-black/30 border-t border-white/[0.06]">
                    <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-1">
                      {property.images.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`flex-shrink-0 w-16 h-12 sm:w-20 sm:h-14 rounded-lg overflow-hidden transition-all duration-300 ${
                            index === currentImageIndex
                              ? 'ring-2 ring-white ring-offset-1 ring-offset-black/50 opacity-100'
                              : 'opacity-50 hover:opacity-80'
                          }`}
                        >
                          <img
                            src={image}
                            alt={`Thumbnail ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Contact Section - Moved up for visibility */}
        {property.managers && property.managers.length > 0 && (() => {
          const manager = property.managers[0]
          const fullName = manager.last_name ? `${manager.name} ${manager.last_name}` : manager.name
          const hasSocialLinks = manager.instagram_url || manager.facebook_url || manager.linkedin_url || manager.twitter_url

          return (
            <div className="mb-6 sm:mb-12 animate-fade-in">
              <div className="rounded-lg sm:rounded-xl border border-white/[0.06] bg-black/20 p-4 sm:p-6">
                <div className="flex items-center gap-3 sm:gap-5">
                  {/* Profile Picture */}
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-white/[0.05] border border-white/[0.08] flex items-center justify-center flex-shrink-0">
                    {manager.profile_picture_url ? (
                      <img
                        src={manager.profile_picture_url}
                        alt={fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="h-6 w-6 sm:h-8 sm:w-8 text-white/30" />
                    )}
                  </div>

                  {/* Contact Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white/40 text-[9px] sm:text-[10px] uppercase tracking-[0.15em] mb-0.5">Your Agent</p>
                    <h3 className="text-sm sm:text-base font-light text-white tracking-wide truncate">
                      {fullName}
                    </h3>
                    {manager.title && (
                      <p className="text-white/40 text-[10px] sm:text-xs font-light truncate">{manager.title}</p>
                    )}
                  </div>

                  {/* Quick Contact Buttons */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {manager.phone && (
                      <a
                        href={`tel:${manager.phone}`}
                        className="p-2.5 sm:p-2 rounded-full border border-white/[0.08] bg-white/[0.03] text-white/60 active:text-white active:bg-white/[0.08] transition-all"
                        aria-label="Call"
                      >
                        <Phone className="h-4 w-4" />
                      </a>
                    )}
                    {manager.email && (
                      <a
                        href={`mailto:${manager.email}`}
                        className="p-2.5 sm:p-2 rounded-full border border-white/[0.08] bg-white/[0.03] text-white/60 active:text-white active:bg-white/[0.08] transition-all"
                        aria-label="Email"
                      >
                        <Mail className="h-4 w-4" />
                      </a>
                    )}
                    {hasSocialLinks && manager.instagram_url && (
                      <a
                        href={manager.instagram_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 sm:p-2 rounded-full border border-white/[0.08] bg-white/[0.03] text-white/60 active:text-white active:bg-white/[0.08] transition-all hidden sm:flex"
                        aria-label="Instagram"
                      >
                        <Instagram className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })()}

        {/* Property Description */}
        {property.description && (
          <div className="mb-6 sm:mb-12 animate-fade-in">
            <div className="mb-3 sm:mb-6">
              <div className="flex items-center gap-2 sm:gap-4">
                <span className="w-4 sm:w-10 h-px bg-gradient-to-r from-white/30 to-transparent" />
                <h2 className="text-base sm:text-xl font-extralight text-white tracking-[0.08em] sm:tracking-[0.1em]">About This Property</h2>
              </div>
            </div>
            <div className="rounded-lg sm:rounded-xl border border-white/[0.06] bg-black/20 p-4 sm:p-8">
              <div className="prose-property text-[13px] sm:text-base font-light leading-relaxed">
                <ReactMarkdown>
                  {property.description}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        )}

        {/* Custom Notes from Admin */}
        {property.custom_notes && (
          <div className="mb-6 sm:mb-12 animate-fade-in">
            <div className="mb-3 sm:mb-6">
              <div className="flex items-center gap-2 sm:gap-4">
                <span className="w-4 sm:w-10 h-px bg-gradient-to-r from-blue-400/50 to-transparent" />
                <h2 className="text-base sm:text-xl font-extralight text-white tracking-[0.08em] sm:tracking-[0.1em]">Important Information</h2>
              </div>
            </div>
            <div className="rounded-lg sm:rounded-xl border border-blue-400/20 bg-blue-500/5 p-4 sm:p-8">
              <div className="text-[13px] sm:text-base text-white/90 font-light whitespace-pre-wrap leading-relaxed">
                {property.custom_notes}
              </div>
            </div>
          </div>
        )}

        {/* Location Map */}
        {property.show_address !== false && (
          <div className="mb-6 sm:mb-12 animate-fade-in">
            <div className="mb-3 sm:mb-6">
              <div className="flex items-center gap-2 sm:gap-4">
                <span className="w-4 sm:w-10 h-px bg-gradient-to-r from-white/30 to-transparent" />
                <h2 className="text-base sm:text-xl font-extralight text-white tracking-[0.08em] sm:tracking-[0.1em]">Location</h2>
              </div>
            </div>
            <div className="rounded-xl overflow-hidden border border-white/[0.06]">
              <iframe
                width="100%"
                height="250"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://www.google.com/maps?q=${encodeURIComponent(property.address)}&output=embed`}
                className="w-full sm:h-[350px]"
              ></iframe>
            </div>
            <div className="mt-2 sm:mt-3 flex items-center gap-2 text-white/50 text-[11px] sm:text-sm">
              <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="font-light truncate">{property.address}</span>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}
