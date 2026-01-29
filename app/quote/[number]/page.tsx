'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import {
  FileText,
  Calendar,
  User,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Download,
  Plane,
  Ship,
  Car,
  MapPin,
  Users,
  ArrowLeft,
} from 'lucide-react'
import Link from 'next/link'
import { Logo } from '@/components/logo'
import { getQuoteByNumber, acceptQuote, declineQuote, QuoteWithItems, QuoteStatus } from '@/lib/actions/quotes'
import { formatCurrency } from '@/lib/utils'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

const statusConfig: Record<QuoteStatus, { label: string; color: string; icon: any }> = {
  draft: { label: 'Draft', color: 'bg-gray-500/20 text-gray-300 border-gray-500/30', icon: FileText },
  sent: { label: 'Pending Response', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30', icon: Clock },
  viewed: { label: 'Pending Response', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30', icon: Clock },
  accepted: { label: 'Accepted', color: 'bg-green-500/20 text-green-300 border-green-500/30', icon: CheckCircle },
  declined: { label: 'Declined', color: 'bg-red-500/20 text-red-300 border-red-500/30', icon: XCircle },
  expired: { label: 'Expired', color: 'bg-orange-500/20 text-orange-300 border-orange-500/30', icon: AlertCircle },
}

export default function QuoteViewPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const quoteNumber = params?.number as string
  const { toast } = useToast()
  const [quote, setQuote] = useState<QuoteWithItems | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Get back URL from search params
  const from = searchParams.get('from')
  const clientId = searchParams.get('clientId')
  const backUrl = from === 'client' && clientId ? `/admin/client/${clientId}` : null
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false)
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState<{ itemIndex: number; imageIndex: number } | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const pdfPreviewRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function loadQuote() {
      if (!quoteNumber) return

      const { data, error } = await getQuoteByNumber(quoteNumber)
      if (error) {
        setError(error)
      } else {
        setQuote(data)
      }
      setIsLoading(false)
    }

    loadQuote()
  }, [quoteNumber])

  const handleAccept = async () => {
    if (!quote) return
    setIsSubmitting(true)

    const result = await acceptQuote(quote.quote_number)

    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Quote Accepted',
        description: 'We will be in touch shortly to finalize your booking.',
      })
      setQuote({ ...quote, status: 'accepted' })
    }

    setIsSubmitting(false)
    setAcceptDialogOpen(false)
  }

  const handleDecline = async () => {
    if (!quote) return
    setIsSubmitting(true)

    const result = await declineQuote(quote.quote_number)

    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Quote Declined',
        description: 'Thank you for letting us know.',
      })
      setQuote({ ...quote, status: 'declined' })
    }

    setIsSubmitting(false)
    setDeclineDialogOpen(false)
  }

  // Helper function to convert oklch/oklab colors to hex
  const convertToHex = (color: string): string => {
    if (!color) return '#000000'
    if (color.startsWith('#')) return color
    if (color.includes('oklch') || color.includes('oklab')) {
      // Map common oklch/oklab values to hex equivalents
      // Whites and near-whites
      if (color.includes('0.985') || color.includes('0.99') || color.includes('0.98')) return '#ffffff'
      if (color.includes('0.967') || color.includes('0.97') || color.includes('0.96')) return '#f3f4f6'
      if (color.includes('0.928') || color.includes('0.93') || color.includes('0.92')) return '#e5e7eb'
      // Grays
      if (color.includes('0.872') || color.includes('0.87') || color.includes('0.86')) return '#d1d5db'
      if (color.includes('0.704') || color.includes('0.70') || color.includes('0.71')) return '#9ca3af'
      if (color.includes('0.556') || color.includes('0.55') || color.includes('0.56') || color.includes('0.54')) return '#6b7280'
      if (color.includes('0.446') || color.includes('0.45') || color.includes('0.44')) return '#4b5563'
      if (color.includes('0.37') || color.includes('0.38') || color.includes('0.36')) return '#374151'
      if (color.includes('0.21') || color.includes('0.22') || color.includes('0.20')) return '#1f2937'
      if (color.includes('0.129') || color.includes('0.13') || color.includes('0.14') || color.includes('0.15')) return '#111827'
      // Blues
      if (color.includes('0.588') && color.includes('250')) return '#3b82f6'
      if (color.includes('0.59') || color.includes('0.58')) return '#3b82f6'
      // Greens (for car mode indicators)
      if (color.includes('142') || color.includes('145') || color.includes('140')) return '#22c55e' // green-500
      if (color.includes('0.64') && color.includes('14')) return '#22c55e' // green-500
      if (color.includes('0.72') && color.includes('14')) return '#4ade80' // green-400
      // Reds
      if (color.includes('0.63') && color.includes('25')) return '#ef4444' // red-500
      if (color.includes('0.50') && color.includes('25')) return '#dc2626' // red-600
      // Default fallbacks based on lightness
      const match = color.match(/oklch\s*\(\s*([\d.]+)/)
      if (match) {
        const lightness = parseFloat(match[1])
        if (lightness > 0.9) return '#ffffff'
        if (lightness > 0.8) return '#e5e7eb'
        if (lightness > 0.7) return '#d1d5db'
        if (lightness > 0.6) return '#9ca3af'
        if (lightness > 0.5) return '#6b7280'
        if (lightness > 0.4) return '#4b5563'
        if (lightness > 0.3) return '#374151'
        if (lightness > 0.2) return '#1f2937'
        return '#111827'
      }
      return '#000000'
    }
    if (color.startsWith('rgba') || color.startsWith('rgb')) return color
    if (color === 'transparent') return 'transparent'
    return color
  }

  const handleDownloadPDF = async () => {
    if (!quote || !pdfPreviewRef.current) return

    setIsDownloading(true)

    try {
      // Find the preview element (yacht, car, or jet)
      const yachtElement = pdfPreviewRef.current.querySelector('[data-preview="yacht"]') as HTMLElement
      const carElement = pdfPreviewRef.current.querySelector('[data-preview="car"]') as HTMLElement
      const jetElement = pdfPreviewRef.current.querySelector('[data-preview="jet"]') as HTMLElement

      const previewElement = yachtElement || carElement || jetElement

      if (!previewElement) {
        throw new Error('Could not find preview element')
      }

      // Store original styles and set fixed width for consistent PDF
      const originalStyle = previewElement.style.cssText
      const isYacht = !!yachtElement
      const isCar = !!carElement
      const previewWidth = (isYacht || isCar) ? '595px' : '420px'

      previewElement.style.width = previewWidth
      previewElement.style.minWidth = previewWidth
      previewElement.style.maxWidth = previewWidth

      // Wait for re-render with fixed width
      await new Promise(resolve => setTimeout(resolve, 100))

      // Preload the header image with CORS
      const headerImageUrl = isYacht
        ? 'https://res.cloudinary.com/dku1gnuat/image/upload/v1767891666/yacht_header01_vwasld.png'
        : 'https://res.cloudinary.com/dku1gnuat/image/upload/v1767797886/quoteCover_qmol4g.jpg'
      await new Promise<void>((resolve) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => resolve()
        img.onerror = () => resolve()
        img.src = headerImageUrl
      })

      const ticketElement = previewElement

      // Wait for images to load
      const images = ticketElement.querySelectorAll('img')
      await Promise.all(
        Array.from(images).map((img) => {
          if (img.complete) return Promise.resolve()
          return new Promise((resolve) => {
            img.onload = resolve
            img.onerror = resolve
          })
        })
      )

      // Store original styles to restore later
      const originalStyles: Map<HTMLElement, string> = new Map()

      // Apply inline hex colors to ALL elements
      const allElements = ticketElement.querySelectorAll('*')
      allElements.forEach((el) => {
        if (el instanceof HTMLElement) {
          originalStyles.set(el, el.style.cssText)
          const computed = window.getComputedStyle(el)
          const bgColor = computed.backgroundColor
          if (bgColor) el.style.backgroundColor = convertToHex(bgColor)
          const textColor = computed.color
          if (textColor) el.style.color = convertToHex(textColor)
          const borderColor = computed.borderColor
          if (borderColor) el.style.borderColor = convertToHex(borderColor)
        }
      })

      originalStyles.set(ticketElement, ticketElement.style.cssText)
      const rootComputed = window.getComputedStyle(ticketElement)
      ticketElement.style.backgroundColor = convertToHex(rootComputed.backgroundColor)
      ticketElement.style.color = convertToHex(rootComputed.color)

      // Fix object-fit for html2canvas (it doesn't support object-fit CSS)
      const allImgs = ticketElement.querySelectorAll('img')
      allImgs.forEach((img) => {
        if (img instanceof HTMLImageElement) {
          const computed = window.getComputedStyle(img)
          const objectFit = computed.objectFit

          if (!originalStyles.has(img)) {
            originalStyles.set(img, img.style.cssText)
          }

          // Handle different image types separately
          const isHeaderBg = img.alt === 'Header'
          const isLogo = img.alt === 'Cadiz & Lluis'
          const isInteriorImage = img.alt === 'Aircraft Interior' || img.alt === 'Car Interior' || img.alt === 'Yacht Interior' || img.alt === 'Yacht' || img.alt === 'Car' || img.alt === 'Aircraft Exterior'

          if (isHeaderBg || isInteriorImage) {
            // Simulate object-fit cover for these images
            const parent = img.parentElement
            if (parent) {
              const parentRect = parent.getBoundingClientRect()
              const imgNaturalWidth = img.naturalWidth || img.width
              const imgNaturalHeight = img.naturalHeight || img.height

              if (imgNaturalWidth && imgNaturalHeight && parentRect.width > 0 && parentRect.height > 0) {
                const parentAspect = parentRect.width / parentRect.height
                const imgAspect = imgNaturalWidth / imgNaturalHeight

                // Calculate dimensions to cover the container while maintaining aspect ratio
                let newWidth, newHeight

                if (imgAspect > parentAspect) {
                  // Image is wider than container - fit by height, crop sides
                  newHeight = parentRect.height
                  newWidth = newHeight * imgAspect
                } else {
                  // Image is taller than container - fit by width, crop top/bottom
                  newWidth = parentRect.width
                  newHeight = newWidth / imgAspect
                }

                // Center the image
                const offsetX = (parentRect.width - newWidth) / 2
                const offsetY = (parentRect.height - newHeight) / 2

                img.style.position = 'absolute'
                img.style.width = newWidth + 'px'
                img.style.height = newHeight + 'px'
                img.style.left = offsetX + 'px'
                img.style.top = offsetY + 'px'
                img.style.maxWidth = 'none'
                img.style.maxHeight = 'none'
                img.style.objectFit = 'none'

                // Ensure parent has position relative and overflow hidden
                parent.style.position = 'relative'
                parent.style.overflow = 'hidden'
              }
            }
          } else if (isLogo) {
            // Logo: maintain aspect ratio using natural dimensions
            const naturalWidth = img.naturalWidth
            const naturalHeight = img.naturalHeight

            if (naturalWidth && naturalHeight) {
              const aspectRatio = naturalWidth / naturalHeight
              const targetWidth = 120 // desired width in px
              const targetHeight = targetWidth / aspectRatio

              img.style.width = targetWidth + 'px'
              img.style.height = targetHeight + 'px'
              img.style.maxWidth = 'none'
              img.style.maxHeight = 'none'
              img.style.minWidth = 'auto'
              img.style.minHeight = 'auto'
            }
          }
        }
      })

      // Fix badge alignment
      const badges = ticketElement.querySelectorAll('.rounded-full')
      badges.forEach((badge) => {
        if (badge instanceof HTMLElement) {
          originalStyles.set(badge, badge.style.cssText)

          const spans = badge.querySelectorAll('span')
          spans.forEach((span) => {
            if (span instanceof HTMLElement) {
              originalStyles.set(span, span.style.cssText)
              span.style.position = 'relative'
              span.style.top = '-5px'
            }
          })

          const svgs = badge.querySelectorAll('svg')
          svgs.forEach((svg) => {
            if (svg instanceof SVGElement) {
              const svgEl = svg as unknown as HTMLElement
              originalStyles.set(svgEl, svgEl.style.cssText)
              svg.style.position = 'relative'
              svg.style.top = '0px'
            }
          })
        }
      })

      // Fix text alignment in boarding pass and card sections for html2canvas
      // Move ALL text elements up by 4px for proper PDF rendering
      const allTextElements = ticketElement.querySelectorAll('p, span')
      allTextElements.forEach((el) => {
        if (el instanceof HTMLElement) {
          originalStyles.set(el, el.style.cssText)
          el.style.position = 'relative'
          el.style.top = '-4px'
        }
      })

      // Fix passenger count badge text
      const passengerCountElements = ticketElement.querySelectorAll('.passenger-count')
      passengerCountElements.forEach((el) => {
        if (el instanceof HTMLElement) {
          el.style.top = '-6px'
        }
      })

      // Fix display name badge text
      const displayNameElements = ticketElement.querySelectorAll('.display-name')
      displayNameElements.forEach((el) => {
        if (el instanceof HTMLElement) {
          el.style.top = '-8px'
        }
      })

      // Fix display name arrow icon
      const displayNameArrowElements = ticketElement.querySelectorAll('.display-name-arrow')
      displayNameArrowElements.forEach((el) => {
        if (el instanceof HTMLElement) {
          el.style.top = '-8px'
        }
      })

      // Fix aircraft specs bar text alignment
      const aircraftSpecsBars = ticketElement.querySelectorAll('.aircraft-specs-bar')
      aircraftSpecsBars.forEach((bar) => {
        if (bar instanceof HTMLElement) {
          const allTextInBar = bar.querySelectorAll('*')
          allTextInBar.forEach((el) => {
            if (el instanceof HTMLElement && (el.tagName === 'H3' || el.tagName === 'P' || el.tagName === 'SPAN')) {
              el.style.position = 'relative'
              el.style.top = '-7px'
            }
          })
        }
      })

      // Capture with html2canvas
      const canvas = await html2canvas(ticketElement, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        imageTimeout: 15000,
        onclone: (clonedDoc) => {
          // Convert any remaining oklch colors in the cloned document
          const allClonedElements = clonedDoc.querySelectorAll('*')
          allClonedElements.forEach((el) => {
            if (el instanceof HTMLElement) {
              const computed = window.getComputedStyle(el)
              if (computed.backgroundColor?.includes('oklch')) {
                el.style.backgroundColor = convertToHex(computed.backgroundColor)
              }
              if (computed.color?.includes('oklch')) {
                el.style.color = convertToHex(computed.color)
              }
              if (computed.borderColor?.includes('oklch')) {
                el.style.borderColor = convertToHex(computed.borderColor)
              }
            }
          })
        },
      })

      // Restore original styles
      originalStyles.forEach((originalStyle, el) => {
        el.style.cssText = originalStyle
      })

      // Restore original preview width
      previewElement.style.cssText = originalStyle

      // Create PDF
      const imgWidth = canvas.width
      const imgHeight = canvas.height
      const pdfWidth = (isYacht || isCar) ? 210 : 106 // A4 width for yacht/car, custom for jet
      const pdfHeight = (imgHeight / imgWidth) * pdfWidth

      const pdf = new jsPDF({
        orientation: pdfHeight > pdfWidth ? 'portrait' : 'landscape',
        unit: 'mm',
        format: [pdfWidth, pdfHeight],
      })

      const imgData = canvas.toDataURL('image/png')
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(`${quote.quote_number}.pdf`)

      toast({
        title: 'PDF Downloaded',
        description: `Quote ${quote.quote_number} has been downloaded.`,
      })
    } catch (error) {
      console.error('PDF generation error:', error)
      toast({
        title: 'Error',
        description: 'Failed to generate PDF. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsDownloading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen marble-bg flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          <span className="text-white text-lg">Loading quote...</span>
        </div>
      </div>
    )
  }

  if (error || !quote) {
    return (
      <div className="min-h-screen marble-bg flex items-center justify-center">
        <Card className="bg-card/50 border-border/30 backdrop-blur-sm p-8 text-center max-w-md">
          <FileText className="h-16 w-16 text-white/40 mx-auto mb-4" />
          <h2 className="text-2xl text-white mb-2">Quote Not Found</h2>
          <p className="text-white/70 mb-4">{error || 'The quote you\'re looking for doesn\'t exist'}</p>
        </Card>
      </div>
    )
  }

  const config = statusConfig[quote.status]
  const StatusIcon = config.icon
  const isExpired = quote.status === 'expired' ||
    ((quote.status === 'sent' || quote.status === 'viewed') && new Date(quote.expiration_date) < new Date())
  const canRespond = (quote.status === 'sent' || quote.status === 'viewed') && !isExpired

  return (
    <div className="min-h-screen marble-bg">
      {/* Header */}
      <header className="border-b border-white/20 backdrop-blur-md sticky top-0 z-50 glass-card-accent">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {backUrl && (
                <Link href={backUrl}>
                  <Button variant="ghost" size="sm" className="text-white hover:text-white/80 mr-2">
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>
                </Link>
              )}
              <div className="shimmer">
                <Logo />
              </div>
              <div className="flex flex-col">
                <div className="luxury-heading text-lg tracking-widest text-white">
                  LUXURY LIVING
                </div>
                <div className="text-[10px] tracking-[0.2em] text-white/70 uppercase font-semibold">
                  Cadiz & Lluis
                </div>
              </div>
            </div>
            <Button
              onClick={handleDownloadPDF}
              variant="outline"
              size="sm"
              disabled={isDownloading}
              className="bg-white/10 text-white border-white/20 hover:bg-white/20"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Quote Header */}
        <Card className="glass-card-accent elevated-card border border-white/20 mb-8">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h1 className="luxury-heading text-3xl sm:text-4xl text-white tracking-wide mb-2">
                  Service Quote
                </h1>
                <p className="text-white/60 font-mono text-lg">{quote.quote_number}</p>
              </div>
              <Badge className={`${config.color} border text-base px-4 py-2`}>
                <StatusIcon className="h-4 w-4 mr-2" />
                {isExpired ? 'Expired' : config.label}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-white/60 mt-0.5" />
                  <div>
                    <p className="text-white/60 text-sm uppercase tracking-wider mb-1">Prepared For</p>
                    <p className="text-white font-medium">{quote.client_name}</p>
                    <p className="text-white/70">{quote.client_email}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-white/60 mt-0.5" />
                  <div>
                    <p className="text-white/60 text-sm uppercase tracking-wider mb-1">Valid Until</p>
                    <p className={`font-medium ${isExpired ? 'text-red-400' : 'text-white'}`}>
                      {formatDate(quote.expiration_date)}
                      {isExpired && ' (Expired)'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Service Items */}
        <div className="space-y-6 mb-8">
          {quote.service_items
            .filter(item => !quote.pdf_customization?.hidden_service_items?.includes(item.id))
            .map((item, itemIndex) => {
            const override = quote.pdf_customization?.service_overrides?.[item.id]
            const details = override?.details || []
            const headerIcon = quote.pdf_customization?.header_icon || 'plane'
            const displayName = override?.display_name || item.service_name
            const displayDescription = override?.display_description || item.description || ''
            const displayImages = override?.display_images?.length ? override.display_images : item.images || []

            // Jet-specific fields from override
            const jetModel = override?.jet_model || ''
            const passengersOverride = override?.passengers || ''
            const flightTime = override?.flight_time || ''
            const servicesList = override?.services_list || []

            // Extract common details from details array (fallback)
            const dateDetail = details.find(d => d.label === 'Date')?.value || ''
            const departureCode = details.find(d => d.label === 'Departure Code')?.value || quote.pdf_customization?.route?.departure_code || ''
            const departureDetail = details.find(d => d.label === 'Departure')?.value || quote.pdf_customization?.route?.departure_city || ''
            const arrivalCode = details.find(d => d.label === 'Arrival Code')?.value || quote.pdf_customization?.route?.arrival_code || ''
            const arrivalDetail = details.find(d => d.label === 'Arrival')?.value || quote.pdf_customization?.route?.arrival_city || ''
            const duration = details.find(d => d.label === 'Duration')?.value || flightTime || ''
            const passengers = details.find(d => d.label === 'Passengers')?.value || passengersOverride || ''
            const departureMarina = details.find(d => d.label === 'Departure Marina')?.value || override?.departure_city || ''
            const destination = details.find(d => d.label === 'Destination')?.value || override?.arrival_city || ''
            const guests = details.find(d => d.label === 'Guests')?.value || passengersOverride || ''
            const pickup = details.find(d => d.label === 'Pickup')?.value || override?.departure_city || ''
            const dropoff = details.find(d => d.label === 'Dropoff')?.value || override?.arrival_city || ''

            return (
              <Card key={item.id} className="glass-card-accent elevated-card border border-white/20 overflow-hidden">
                <CardContent className="p-0">
                  {/* Item Images */}
                  {displayImages && displayImages.length > 0 && (
                    <div className="relative">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1">
                        {displayImages.slice(0, 4).map((imageUrl, imgIndex) => (
                          <div
                            key={imgIndex}
                            className="aspect-[4/3] cursor-pointer relative overflow-hidden"
                            onClick={() => setSelectedImageIndex({ itemIndex, imageIndex: imgIndex })}
                          >
                            <img
                              src={imageUrl}
                              alt={`${displayName} photo ${imgIndex + 1}`}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                            />
                            {imgIndex === 3 && displayImages.length > 4 && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                <span className="text-white text-lg font-semibold">+{displayImages.length - 4}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Item Details */}
                  <div className="p-6">
                    <div className="flex justify-between items-start gap-4 mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-white mb-2">{displayName}</h3>
                        {displayDescription && (
                          <p className="text-white/70 whitespace-pre-wrap">{displayDescription}</p>
                        )}
                      </div>
                      <p className="text-white text-2xl font-bold">{formatCurrency(override?.price_override ?? item.price)}</p>
                    </div>

                    {/* Date */}
                    {dateDetail && (
                      <div className="flex items-center gap-2 mb-4 text-white/60">
                        <Calendar className="h-4 w-4" />
                        <span>{dateDetail}</span>
                      </div>
                    )}

                    {/* Plane Mode - Flight Route */}
                    {headerIcon === 'plane' && (departureCode || arrivalCode) && (
                      <div className="bg-white/5 rounded-xl p-4 mb-4 border border-white/10">
                        <div className="flex items-center justify-between">
                          <div className="text-center">
                            <p className="text-3xl font-bold text-white">{departureCode || '---'}</p>
                            <p className="text-sm text-white/60">{departureDetail || 'Departure'}</p>
                          </div>
                          <div className="flex-1 px-4">
                            <div className="flex flex-col items-center">
                              {duration && <p className="text-xs text-white/50 mb-2">{duration}</p>}
                              <div className="flex items-center w-full">
                                <div className="w-2 h-2 rounded-full bg-white/40"></div>
                                <div className="flex-1 border-t-2 border-dashed border-white/20 mx-2 relative">
                                  <Plane className="h-4 w-4 text-white/60 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-transparent" />
                                </div>
                                <div className="w-2 h-2 rounded-full bg-white"></div>
                              </div>
                            </div>
                          </div>
                          <div className="text-center">
                            <p className="text-3xl font-bold text-white">{arrivalCode || '---'}</p>
                            <p className="text-sm text-white/60">{arrivalDetail || 'Arrival'}</p>
                          </div>
                        </div>
                        {(passengers || flightTime) && (
                          <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-white/10">
                            {passengers && (
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-white/60" />
                                <span className="text-white/80">{passengers} Passengers</span>
                              </div>
                            )}
                            {flightTime && (
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-white/60" />
                                <span className="text-white/80">{flightTime}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Jet Model & Services */}
                    {headerIcon === 'plane' && (jetModel || servicesList.length > 0) && (
                      <div className="bg-white/5 rounded-xl p-4 mb-4 border border-white/10">
                        {jetModel && (
                          <div className="mb-3">
                            <p className="text-xs text-white/50 uppercase tracking-wider mb-1">Aircraft Model</p>
                            <p className="text-white font-medium">{jetModel}</p>
                          </div>
                        )}
                        {servicesList.length > 0 && (
                          <div>
                            <p className="text-xs text-white/50 uppercase tracking-wider mb-2">Services Included</p>
                            <div className="space-y-1">
                              {servicesList.filter(s => s).map((service, sIdx) => (
                                <p key={sIdx} className="text-white/80 text-sm">• {service}</p>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Yacht Mode - Route */}
                    {headerIcon === 'yacht' && (departureMarina || destination) && (
                      <div className="bg-white/5 rounded-xl p-4 mb-4 border border-white/10">
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col items-center">
                            <div className="w-3 h-3 rounded-full bg-blue-400 border-2 border-white/20"></div>
                            <div className="w-0.5 h-12 bg-white/20"></div>
                            <div className="w-3 h-3 rounded-full bg-white border-2 border-white/20"></div>
                          </div>
                          <div className="flex-1 space-y-6">
                            {departureMarina && (
                              <div>
                                <p className="text-xs text-white/50 uppercase tracking-wider">Departure Marina</p>
                                <p className="text-white font-medium">{departureMarina}</p>
                              </div>
                            )}
                            {destination && (
                              <div>
                                <p className="text-xs text-white/50 uppercase tracking-wider">Destination</p>
                                <p className="text-white font-medium">{destination}</p>
                              </div>
                            )}
                          </div>
                        </div>
                        {guests && (
                          <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-white/10">
                            <Users className="h-4 w-4 text-white/60" />
                            <span className="text-white/80">{guests} Guests</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Car Mode - Route */}
                    {headerIcon === 'car' && (pickup || dropoff) && (
                      <div className="bg-white/5 rounded-xl p-4 mb-4 border border-white/10">
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col items-center">
                            <div className="w-3 h-3 rounded-full bg-green-400 border-2 border-white/20"></div>
                            <div className="w-0.5 h-12 bg-white/20"></div>
                            <div className="w-3 h-3 rounded-full bg-white border-2 border-white/20"></div>
                          </div>
                          <div className="flex-1 space-y-6">
                            {pickup && (
                              <div>
                                <p className="text-xs text-white/50 uppercase tracking-wider">Pickup</p>
                                <p className="text-white font-medium uppercase">{pickup}</p>
                              </div>
                            )}
                            {dropoff && (
                              <div>
                                <p className="text-xs text-white/50 uppercase tracking-wider">Dropoff</p>
                                <p className="text-white font-medium uppercase">{dropoff}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Other Details Grid */}
                    {details.filter(d => {
                      if (!d.value || d.label === 'Date') return false
                      if (headerIcon === 'plane' && ['Departure Code', 'Departure', 'Arrival Code', 'Arrival', 'Duration', 'Passengers'].includes(d.label)) return false
                      if (headerIcon === 'yacht' && ['Departure Marina', 'Destination', 'Guests'].includes(d.label)) return false
                      if (headerIcon === 'car' && ['Pickup', 'Dropoff'].includes(d.label)) return false
                      return true
                    }).length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {details
                          .filter(d => {
                            if (!d.value || d.label === 'Date') return false
                            if (headerIcon === 'plane' && ['Departure Code', 'Departure', 'Arrival Code', 'Arrival', 'Duration', 'Passengers'].includes(d.label)) return false
                            if (headerIcon === 'yacht' && ['Departure Marina', 'Destination', 'Guests'].includes(d.label)) return false
                            if (headerIcon === 'car' && ['Pickup', 'Dropoff'].includes(d.label)) return false
                            return true
                          })
                          .map((detail, idx) => (
                            <div key={idx} className="bg-white/5 rounded-lg p-3 border border-white/10">
                              <p className="text-xs text-white/50 uppercase tracking-wider mb-1">{detail.label}</p>
                              <p className="text-white font-medium">{detail.value}</p>
                            </div>
                          ))
                        }
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Notes */}
        {quote.notes && (
          <Card className="glass-card-accent elevated-card border border-white/20 mb-8">
            <CardContent className="p-6">
              <h3 className="text-white/60 text-sm uppercase tracking-wider mb-3">Notes</h3>
              <p className="text-white/80 whitespace-pre-wrap">{quote.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Response Buttons */}
        {canRespond && (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => setDeclineDialogOpen(true)}
              variant="outline"
              size="lg"
              className="border-white/30 hover:bg-red-500/10 hover:border-red-500/50 text-white px-8"
            >
              <ThumbsDown className="h-5 w-5 mr-2" />
              Decline Quote
            </Button>
            <Button
              onClick={() => setAcceptDialogOpen(true)}
              size="lg"
              className="btn-luxury px-8"
            >
              <ThumbsUp className="h-5 w-5 mr-2" />
              Accept Quote
            </Button>
          </div>
        )}

        {/* Already Responded */}
        {quote.status === 'accepted' && (
          <Card className="glass-card-accent border-green-500/30 bg-green-500/10">
            <CardContent className="p-6 text-center">
              <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-3" />
              <h3 className="text-xl font-semibold text-white mb-2">Quote Accepted</h3>
              <p className="text-white/70">
                {quote.converted_to_invoice_id
                  ? 'This quote has been converted to an invoice. You should receive the invoice shortly.'
                  : 'Thank you! We will be in touch shortly to finalize the details.'}
              </p>
            </CardContent>
          </Card>
        )}

        {quote.status === 'declined' && (
          <Card className="glass-card-accent border-red-500/30 bg-red-500/10">
            <CardContent className="p-6 text-center">
              <XCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
              <h3 className="text-xl font-semibold text-white mb-2">Quote Declined</h3>
              <p className="text-white/70">
                Thank you for letting us know. Feel free to contact us if you change your mind.
              </p>
            </CardContent>
          </Card>
        )}

        {isExpired && quote.status !== 'accepted' && quote.status !== 'declined' && (
          <Card className="glass-card-accent border-orange-500/30 bg-orange-500/10">
            <CardContent className="p-6 text-center">
              <AlertCircle className="h-12 w-12 text-orange-400 mx-auto mb-3" />
              <h3 className="text-xl font-semibold text-white mb-2">Quote Expired</h3>
              <p className="text-white/70">
                This quote has expired. Please contact us for an updated quote.
              </p>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Accept Dialog */}
      <AlertDialog open={acceptDialogOpen} onOpenChange={setAcceptDialogOpen}>
        <AlertDialogContent className="glass-card-accent border-white/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Accept Quote</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              Are you sure you want to accept this quote for {formatCurrency(quote.total)}?
              Our team will contact you to finalize the booking details.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/20 text-white hover:bg-white/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAccept}
              disabled={isSubmitting}
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Accept Quote'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Decline Dialog */}
      <AlertDialog open={declineDialogOpen} onOpenChange={setDeclineDialogOpen}>
        <AlertDialogContent className="glass-card-accent border-white/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Decline Quote</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              Are you sure you want to decline this quote? You can always request a new quote later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/20 text-white hover:bg-white/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDecline}
              disabled={isSubmitting}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Decline Quote'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Image Lightbox */}
      {selectedImageIndex && quote.service_items[selectedImageIndex.itemIndex] && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setSelectedImageIndex(null)}
        >
          <button
            onClick={(e) => {
              e.stopPropagation()
              const item = quote.service_items[selectedImageIndex.itemIndex]
              const prevIndex = selectedImageIndex.imageIndex === 0
                ? item.images.length - 1
                : selectedImageIndex.imageIndex - 1
              setSelectedImageIndex({ ...selectedImageIndex, imageIndex: prevIndex })
            }}
            className="absolute left-4 p-2 text-white/70 hover:text-white"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>

          <img
            src={quote.service_items[selectedImageIndex.itemIndex].images[selectedImageIndex.imageIndex]}
            alt="Full size"
            className="max-w-[90vw] max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          <button
            onClick={(e) => {
              e.stopPropagation()
              const item = quote.service_items[selectedImageIndex.itemIndex]
              const nextIndex = selectedImageIndex.imageIndex === item.images.length - 1
                ? 0
                : selectedImageIndex.imageIndex + 1
              setSelectedImageIndex({ ...selectedImageIndex, imageIndex: nextIndex })
            }}
            className="absolute right-4 p-2 text-white/70 hover:text-white"
          >
            <ChevronRight className="h-8 w-8" />
          </button>

          <button
            onClick={() => setSelectedImageIndex(null)}
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white"
          >
            <XCircle className="h-8 w-8" />
          </button>
        </div>
      )}

      {/* Hidden PDF Preview for Download */}
      <div ref={pdfPreviewRef} className="fixed left-[-9999px] top-0">
        {quote.pdf_customization?.header_icon === 'yacht' ? (
          /* ========== YACHT PREVIEW ========== */
          <div data-preview="yacht" className="max-w-[595px] mx-auto bg-white shadow-lg overflow-hidden" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
            {/* Hero Section with Logo */}
            <div className="relative" style={{ height: '280px', overflow: 'hidden' }}>
              <img
                src="https://res.cloudinary.com/dku1gnuat/image/upload/v1767891666/yacht_header01_vwasld.png"
                alt="Header"
                crossOrigin="anonymous"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
              <div className="absolute flex items-center justify-center" style={{ top: 0, left: 0, right: 0, bottom: '70px' }}>
                <div className="text-center">
                  <img
                    src="/logo/CL Balck LOGO .png"
                    alt="Cadiz & Lluis"
                    style={{ width: '120px', height: '120px', objectFit: 'contain', margin: '0 auto' }}
                  />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0" style={{ backgroundColor: '#1a2332', padding: '16px 20px', textAlign: 'center' }}>
                <p style={{ fontSize: '14px', fontWeight: 700, color: 'white', letterSpacing: '1.8px' }}>PRIVATE YACHT PROPOSAL</p>
              </div>
            </div>

            {/* Client Info and Date */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '32px 50px 26px' }}>
              <div>
                <div style={{ backgroundColor: '#1a1a1a', padding: '8px 14px', borderTopLeftRadius: '4px', borderTopRightRadius: '8px', borderBottomLeftRadius: '4px', borderBottomRightRadius: '4px', marginBottom: '10px', display: 'inline-block' }}>
                  <p style={{ fontSize: '10px', color: 'white', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Prepared for:</p>
                </div>
                <p style={{ fontSize: '16px', fontWeight: 600, color: '#1a1a1a', marginBottom: '4px' }}>{quote.client_name}</p>
                <p style={{ fontSize: '11px', color: '#6b7280' }}>{quote.client_email}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ backgroundColor: '#1a1a1a', padding: '8px 14px', borderTopLeftRadius: '4px', borderTopRightRadius: '8px', borderBottomLeftRadius: '4px', borderBottomRightRadius: '4px', marginBottom: '10px', display: 'inline-block' }}>
                  <p style={{ fontSize: '10px', color: 'white', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Date:</p>
                </div>
                <p style={{ fontSize: '16px', fontWeight: 600, color: '#1a1a1a', marginBottom: '4px' }}>
                  {new Date(quote.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
                <p style={{ fontSize: '11px', color: '#6b7280' }}>{quote.quote_number}</p>
              </div>
            </div>

            {/* Dotted Line */}
            <div style={{ borderBottom: '1px dashed #d1d5db', margin: '10px 50px' }}></div>

            {/* Loop through yacht service items (max 5, excluding hidden) */}
            {quote.service_items && quote.service_items.length > 0 && quote.service_items
              .filter(item => !quote.pdf_customization?.hidden_service_items?.includes(item.id))
              .slice(0, 5).map((item, idx) => {
              if (!item) return null
              const override = quote.pdf_customization?.service_overrides?.[item.id] || {}
              const images = item.images || []
              const displayImages = (override.display_images && override.display_images.length > 0)
                ? override.display_images.slice(0, 2)
                : images.slice(0, 2)
              const displayName = override.display_name || item.service_name || 'Yacht Charter'
              const displayDescription = override.display_description || ''
              const passengers = override.passengers || '15'
              const duration = override.flight_time || '8h'
              const servicesList = override.services_list || ['Crew & amenities', 'Catering & beverages']
              // Get route for this yacht
              const yachtDeparture = override.departure_city || quote.pdf_customization?.route?.departure_city || 'MIAMI'
              const yachtDestination = override.arrival_city || quote.pdf_customization?.route?.arrival_city || 'BAHAMAS'

              return (
                <div key={item.id} style={{ marginTop: idx > 0 ? '30px' : '0' }}>
                  {/* Yacht Name */}
                  <div style={{ backgroundColor: '#1a2332', padding: '30px 50px', textAlign: 'center' }}>
                    <p style={{ fontSize: '20px', fontWeight: 700, color: 'white', lineHeight: '1.2', letterSpacing: '1.8px' }}>{displayName}</p>
                  </div>

                  {/* Main Yacht Image */}
                  {displayImages[0] && (
                    <img
                      src={displayImages[0]}
                      alt="Yacht"
                      style={{ width: '100%', height: '300px', objectFit: 'cover', display: 'block' }}
                    />
                  )}

                  {/* Description Banner with Chevron Bottom */}
                  {displayDescription && (
                    <div style={{ position: 'relative' }}>
                      <div style={{
                        backgroundColor: '#1a2332',
                        padding: '18px 60px',
                        textAlign: 'center',
                        clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 30px) 100%, 30px 100%, 0 calc(100% - 20px))',
                        WebkitClipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 30px) 100%, 30px 100%, 0 calc(100% - 20px))'
                      }}>
                        <p style={{ fontSize: '13px', color: 'white' }}>{displayDescription}</p>
                      </div>
                    </div>
                  )}

                  {/* Details Section with Two Columns */}
                  <div style={{ display: 'flex', padding: '40px 50px', gap: '28px' }}>
                    {/* Left Column - Details and Price */}
                    <div style={{ flex: 1 }}>
                      <div style={{ marginBottom: '24px' }}>
                        <p style={{ fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '7px' }}>ROUTE</p>
                        <p style={{ fontSize: '18px', fontWeight: 600, color: '#1a1a1a' }}>{yachtDeparture} → {yachtDestination}</p>
                      </div>
                      <div style={{ marginBottom: '24px' }}>
                        <p style={{ fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '7px' }}>PASSENGERS</p>
                        <p style={{ fontSize: '18px', fontWeight: 600, color: '#1a1a1a' }}>{passengers}</p>
                      </div>
                      <div style={{ marginBottom: '24px' }}>
                        <p style={{ fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '7px' }}>DURATION</p>
                        <p style={{ fontSize: '18px', fontWeight: 600, color: '#1a1a1a' }}>{duration}</p>
                      </div>
                      <div style={{ marginBottom: '28px' }}>
                        <p style={{ fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>SERVICES</p>
                        {servicesList.filter(s => s).map((service, serviceIdx) => (
                          <p key={serviceIdx} style={{ fontSize: '12px', color: '#1a1a1a', marginBottom: '5px' }}>· {service}</p>
                        ))}
                      </div>

                      {/* Price in Left Column */}
                      <div style={{ marginTop: '24px' }}>
                        <p style={{ fontSize: '36px', fontWeight: 700, color: '#1a1a1a', marginBottom: '6px' }}>
                          {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(override.price_override ?? item.price)}
                        </p>
                        <p style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px' }}>PRICE</p>
                      </div>
                    </div>

                    {/* Right Column - Secondary Image and Additional Text */}
                    <div style={{ width: '280px' }}>
                      {displayImages[1] && (
                        <img
                          src={displayImages[1]}
                          alt="Yacht Interior"
                          style={{ width: '100%', height: '200px', objectFit: 'cover', display: 'block', marginBottom: '24px' }}
                        />
                      )}
                    </div>
                  </div>

                  {/* Separator between yachts */}
                  {idx < Math.min(quote.service_items.length, 5) - 1 && (
                    <div style={{ borderBottom: '1px solid #e5e7eb', margin: '20px 50px' }}></div>
                  )}
                </div>
              )
            })}

            {/* Separator before notes */}
            <div style={{ borderBottom: '1px solid #e5e7eb', margin: '20px 50px' }}></div>

            {/* Notes Section */}
            {(quote.pdf_customization?.custom_notes || quote.notes) && (
              <div style={{ padding: '18px 40px' }}>
                <p style={{ fontSize: '8px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>NOTES:</p>
                <p style={{ fontSize: '10px', color: '#6b7280', lineHeight: '1.5' }}>{quote.pdf_customization?.custom_notes || quote.notes}</p>
              </div>
            )}

            {/* Footer */}
            <div style={{ backgroundColor: '#1a2332', padding: '36px 50px', textAlign: 'center' }}>
              <p style={{ fontSize: '20px', fontWeight: 700, color: 'white', letterSpacing: '2.8px', marginBottom: '7px' }}>CADIZ & LLUIS</p>
              <p style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '20px' }}>LUXURY LIVING</p>
              <p style={{ fontSize: '12px', color: 'white', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
                QUOTE VALID UNTIL {new Date(quote.expiration_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()}
              </p>
              <p style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.7)' }}>
                {quote.manager_email || 'brody@cadizlluis.com'} · www.cadizlluis.com
              </p>
            </div>
          </div>
        ) : quote.pdf_customization?.header_icon === 'car' ? (
          /* ========== CAR PREVIEW ========== */
          <div data-preview="car" className="max-w-[595px] mx-auto bg-white shadow-lg overflow-hidden" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
            {/* Hero Section with Logo */}
            <div className="relative" style={{ height: '280px', overflow: 'hidden' }}>
              <img
                src="https://res.cloudinary.com/dku1gnuat/image/upload/v1767891667/carss_1_q4pubs.png"
                alt="Header"
                crossOrigin="anonymous"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
              <div className="absolute flex items-center justify-center" style={{ top: 0, left: 0, right: 0, bottom: '70px' }}>
                <div className="text-center">
                  <img
                    src="/logo/CL Balck LOGO .png"
                    alt="Cadiz & Lluis"
                    style={{ width: '120px', height: '120px', objectFit: 'contain', margin: '0 auto' }}
                  />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0" style={{ backgroundColor: '#1a2332', padding: '16px 20px', textAlign: 'center' }}>
                <p style={{ fontSize: '14px', fontWeight: 700, color: 'white', letterSpacing: '1.8px', textTransform: 'uppercase' }}>CARS RENTAL PROPOSAL</p>
              </div>
            </div>

            {/* Client Info and Date */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '28px 40px 22px' }}>
              <div>
                <div style={{ backgroundColor: '#1a1a1a', padding: '4px 10px', marginBottom: '8px', display: 'inline-block' }}>
                  <p style={{ fontSize: '8px', color: 'white', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600 }}>PREPARED FOR:</p>
                </div>
                <p style={{ fontSize: '14px', fontWeight: 600, color: '#1a1a1a', marginBottom: '3px' }}>{quote.client_name}</p>
                <p style={{ fontSize: '9px', color: '#6b7280' }}>{quote.client_email}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ backgroundColor: '#1a1a1a', padding: '4px 10px', marginBottom: '8px', display: 'inline-block' }}>
                  <p style={{ fontSize: '8px', color: 'white', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600 }}>EXCLUSIVE RATES</p>
                </div>
                <p style={{ fontSize: '14px', fontWeight: 600, color: '#1a1a1a', marginBottom: '3px' }}>
                  {new Date(quote.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
                <p style={{ fontSize: '9px', color: '#6b7280' }}>{quote.quote_number}</p>
              </div>
            </div>

            {/* Loop through car service items (max 5, excluding hidden) */}
            {quote.service_items && quote.service_items.length > 0 && quote.service_items
              .filter(item => !quote.pdf_customization?.hidden_service_items?.includes(item.id))
              .slice(0, 5).map((item, idx) => {
              if (!item) return null
              const override = quote.pdf_customization?.service_overrides?.[item.id] || {}
              const images = item.images || []
              const displayImages = (override.display_images && override.display_images.length > 0)
                ? override.display_images.slice(0, 2)
                : images.slice(0, 2)
              const displayName = override.display_name || item.service_name || 'Luxury Car'
              const carModel = override.jet_model || '' // reusing jet_model field
              const displayDescription = override.display_description || ''
              const passengers = override.passengers || '4'
              const duration = override.flight_time || '5 days'
              // Get route for this car
              const carPickup = override.departure_city || quote.pdf_customization?.route?.departure_city || 'AIRPORT'
              const carDropoff = override.arrival_city || quote.pdf_customization?.route?.arrival_city || 'HOTEL'

              return (
                <div key={item.id} style={{ marginTop: idx > 0 ? '40px' : '0' }}>
                  {/* Car Name Header */}
                  <div style={{ backgroundColor: '#1a2332', padding: '20px 50px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '20px', fontWeight: 700, color: 'white', lineHeight: '1.2', marginBottom: '2px' }}>{displayName}</p>
                      {carModel && <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.65)' }}>{carModel}</p>}
                    </div>
                    <p style={{ fontSize: '12px', color: 'white', fontWeight: 600 }}>{passengers} Passengers</p>
                  </div>

                  {/* Main Car Image */}
                  {displayImages[0] && (
                    <div style={{ height: '280px' }}>
                      <img
                        src={displayImages[0]}
                        alt="Car"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                    </div>
                  )}

                  {/* Content Section: Details + Description on Left, Image + Price on Right */}
                  <div style={{ display: 'flex', padding: '35px 50px', gap: '35px' }}>
                    {/* Left Column - Details and Description */}
                    <div style={{ flex: 1 }}>
                      <div style={{ marginBottom: '18px' }}>
                        <p style={{ fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>ROUTE</p>
                        <p style={{ fontSize: '16px', fontWeight: 600, color: '#1a1a1a' }}>{carPickup} → {carDropoff}</p>
                      </div>
                      <div style={{ marginBottom: '18px' }}>
                        <p style={{ fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>PASSENGERS</p>
                        <p style={{ fontSize: '16px', fontWeight: 600, color: '#1a1a1a' }}>{passengers}</p>
                      </div>
                      <div style={{ marginBottom: '18px' }}>
                        <p style={{ fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>DURATION</p>
                        <p style={{ fontSize: '16px', fontWeight: 600, color: '#1a1a1a' }}>{duration}</p>
                      </div>

                      {/* Description */}
                      {displayDescription && (
                        <p style={{ fontSize: '10px', color: '#1a1a1a', lineHeight: '1.65', marginTop: '20px', textAlign: 'left' }}>{displayDescription}</p>
                      )}
                    </div>

                    {/* Right Column - Image and Price */}
                    <div style={{ width: '220px' }}>
                      {displayImages[1] && (
                        <img
                          src={displayImages[1]}
                          alt="Car Interior"
                          style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block', marginBottom: '20px' }}
                        />
                      )}

                      {/* Price Box */}
                      <div style={{ backgroundColor: '#f9fafb', padding: '20px', textAlign: 'center' }}>
                        <p style={{ fontSize: '32px', fontWeight: 700, color: '#1a1a1a', marginBottom: '4px' }}>
                          {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(override.price_override ?? item.price)}
                        </p>
                        <p style={{ fontSize: '9px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.8px' }}>TOTAL</p>
                      </div>
                    </div>
                  </div>

                  {/* Separator between cars */}
                  {idx < Math.min(quote.service_items.length, 5) - 1 && (
                    <div style={{ borderBottom: '1px solid #e5e7eb', margin: '20px 50px' }}></div>
                  )}
                </div>
              )
            })}

            {/* Separator */}
            <div style={{ borderBottom: '1px solid #e5e7eb', margin: '20px 40px' }}></div>

            {/* Notes Section */}
            {quote.notes && (
              <div style={{ padding: '18px 40px' }}>
                <p style={{ fontSize: '8px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>NOTES:</p>
                <p style={{ fontSize: '10px', color: '#6b7280', lineHeight: '1.5' }}>{quote.notes}</p>
              </div>
            )}

            {/* Footer */}
            <div style={{ backgroundColor: '#1a2332', padding: '28px 40px', textAlign: 'center' }}>
              <p style={{ fontSize: '18px', fontWeight: 700, color: 'white', letterSpacing: '2.5px', marginBottom: '5px' }}>CADIZ & LLUIS</p>
              <p style={{ fontSize: '9px', color: 'rgba(255, 255, 255, 0.6)', letterSpacing: '1.8px', textTransform: 'uppercase', marginBottom: '16px' }}>LUXURY LIVING</p>
              <p style={{ fontSize: '10px', color: 'white', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '10px' }}>
                QUOTE VALID UNTIL {new Date(quote.expiration_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()}
              </p>
              <p style={{ fontSize: '9px', color: 'rgba(255, 255, 255, 0.7)' }}>
                {quote.manager_email || 'brody@cadizlluis.com'} · www.cadizlluis.com
              </p>
            </div>
          </div>
        ) : (
          /* ========== JET/DEFAULT PREVIEW ========== */
          <div data-preview="jet" className="max-w-[420px] mx-auto bg-white shadow-lg overflow-hidden" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
            {/* Header Image with Logo */}
            <div className="header-image-container relative" style={{ width: '100%', height: '220px', overflow: 'hidden' }}>
              <img
                src="https://res.cloudinary.com/dku1gnuat/image/upload/v1767797886/quoteCover_qmol4g.jpg"
                alt="Header"
                crossOrigin="anonymous"
                style={{ width: '100%', height: '220px', objectFit: 'cover', display: 'block' }}
              />
              {/* Logo Overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <img
                    src="/logo/CL Balck LOGO .png"
                    alt="Cadiz & Lluis"
                    className="h-16 w-auto object-contain"
                  />
                </div>
              </div>
            </div>

          {/* Title Section */}
          <div className="bg-white py-6 text-center">
            {/* Line separator */}
            <div className="w-32 h-0.5 bg-gray-800 mx-auto mb-4"></div>
            <h1 className="text-xl font-semibold text-gray-900 tracking-[0.2em] uppercase">
              {quote.pdf_customization?.header_icon === 'plane' ? 'PRIVATE JET PROPOSAL' :
               quote.pdf_customization?.header_icon === 'yacht' ? 'YACHT CHARTER PROPOSAL' :
               quote.pdf_customization?.header_icon === 'car' ? 'LUXURY CAR SERVICE' :
               quote.pdf_customization?.header_title || 'SERVICE PROPOSAL'}
            </h1>
          </div>

          {/* Boarding Pass Header */}
          {quote.pdf_customization?.header_icon === 'plane' && (
            <div className="bg-gray-800 px-5 py-3">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-widest">
                <span className="text-white font-medium">Boarding Pass · Private Charter</span>
                <span className="text-white">Exclusive Rates</span>
              </div>
            </div>
          )}

          {/* Client Info & Route Section */}
          <div className="bg-white px-5 py-4 border-b border-gray-100">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-1">Prepared for:</p>
                <p className="text-sm font-semibold text-gray-900">{quote.client_name}</p>
                <p className="text-xs text-gray-500">{quote.client_email}</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-1">Date:</p>
                <p className="text-sm font-semibold text-gray-900">
                  {new Date(quote.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
                <p className="text-xs text-gray-500">{quote.quote_number}</p>
              </div>
            </div>

            {/* Route Display */}
            {quote.pdf_customization?.header_icon === 'plane' && quote.pdf_customization?.route && (
              <div className="flex items-center justify-center gap-4 py-4">
                <div className="text-center">
                  <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-1">From</p>
                  <p className="text-2xl font-bold text-gray-900">{quote.pdf_customization.route.departure_code || '---'}</p>
                  <p className="text-[10px] text-gray-500 mt-1">{quote.pdf_customization.route.departure_city || 'Departure'}</p>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-8 border-t-2 border-dashed border-gray-300"></div>
                  <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
                  </svg>
                  <div className="w-8 border-t-2 border-dashed border-gray-300"></div>
                </div>
                <div className="text-center">
                  <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-1">To</p>
                  <p className="text-2xl font-bold text-gray-900">{quote.pdf_customization.route.arrival_code || '---'}</p>
                  <p className="text-[10px] text-gray-500 mt-1">{quote.pdf_customization.route.arrival_city || 'Arrival'}</p>
                </div>
              </div>
            )}
          </div>

          {/* Aircraft Options (excluding hidden) */}
          {quote.service_items
            .filter(item => !quote.pdf_customization?.hidden_service_items?.includes(item.id))
            .map((item, index) => {
            const override = quote.pdf_customization?.service_overrides?.[item.id]
            const displayImages = override?.display_images?.slice(0, 2) || item.images?.slice(0, 2) || []
            const displayName = override?.display_name || item.service_name
            const jetModel = override?.jet_model || ''
            const passengers = override?.passengers || ''
            const flightTime = override?.flight_time || ''
            const servicesList = override?.services_list || []

            return (
              <div key={item.id} className="bg-white">
                {/* Dotted Separator (except for first item) */}
                {index > 0 && (
                  <div className="py-6 px-8">
                    <div className="border-t border-dashed border-gray-300"></div>
                  </div>
                )}

                {/* Option Header */}
                <div className="px-5 py-4">
                  <p className="text-[10px] text-gray-800 tracking-widest text-center font-medium">
                    · {String(index + 1).padStart(2, '0')} PRIVATE ROUTE·
                  </p>
                </div>

                {/* Aircraft Name & Specs - Dark Background */}
                <div className="aircraft-specs-bar bg-gray-800 px-5 py-3 flex justify-between items-center">
                  <div>
                    <h3 className="text-base font-bold text-white">{displayName}</h3>
                    {jetModel && <p className="text-xs text-gray-400 uppercase">{jetModel}</p>}
                  </div>
                  <div className="text-right text-[10px] text-gray-300">
                    {passengers && <span>{passengers} Passengers</span>}
                    {passengers && flightTime && <span className="mx-1">·</span>}
                    {flightTime && <span>{flightTime} Flight Time</span>}
                  </div>
                </div>

                {/* Main Aircraft Image */}
                {displayImages[0] && (
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={displayImages[0]}
                      alt="Aircraft Exterior"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Details Section - Two Column Layout */}
                <div className="flex">
                  {/* Left Column - Aircraft Info */}
                  <div className="flex-1 p-5 border-r border-gray-100">
                    <div className="mb-4">
                      <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-1">Aircraft</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {displayName} {jetModel}
                      </p>
                    </div>

                    {servicesList.length > 0 && (
                      <div className="mb-4">
                        <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-2">Services</p>
                        <div className="space-y-1">
                          {servicesList.filter(s => s).map((service, sIdx) => (
                            <p key={sIdx} className="text-xs text-gray-600">· {service}</p>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="pt-4 border-t border-gray-100">
                      <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-1">Total</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(override?.price_override ?? item.price)}
                      </p>
                    </div>
                  </div>

                  {/* Right Column - Interior Image */}
                  {displayImages[1] && (
                    <div className="w-40 overflow-hidden">
                      <img
                        src={displayImages[1]}
                        alt="Aircraft Interior"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {/* Services Note */}
          <div className="bg-white px-8 py-6">
            <div className="border-t border-dashed border-gray-300 mb-4"></div>
            <p className="text-[11px] text-gray-500 uppercase tracking-wider text-center font-medium">
              All services are customized to your private aviation experience
            </p>
            <div className="border-t border-dashed border-gray-300 mt-4"></div>
          </div>

          {/* Notes Section */}
          {(quote.pdf_customization?.custom_notes || quote.notes) && (
            <div className="bg-white px-5 py-4 border-b border-gray-100">
              <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-2">Notes:</p>
              <p className="text-xs text-gray-600 whitespace-pre-wrap">{quote.pdf_customization?.custom_notes || quote.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="bg-gray-900 px-5 py-6 text-center">
            <p className="text-lg font-bold text-white tracking-[0.2em] mb-1">CADIZ & LLUIS</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-4">Luxury Living</p>
            <p className="text-[10px] text-white uppercase tracking-wider mb-2">
              Quote valid until {new Date(quote.expiration_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
            <p className="text-[10px] text-gray-500">
              {quote.manager_email || 'info@cadizlluis.com'} · www.cadizlluis.com
            </p>
          </div>
        </div>
        )}
      </div>
    </div>
  )
}
