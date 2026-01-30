'use client'

import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { QuoteWithItems, PDFCustomization, ServiceOverride, updateQuotePDFCustomization, addServiceItemToQuote, deleteServiceItemFromQuote } from '@/lib/actions/quotes'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  RotateCcw,
  Save,
  Download,
  Plus,
  Trash2,
  ImageIcon,
  FileText,
  Eye,
  Settings,
  Loader2,
  X,
  ChevronDown,
  ChevronUp,
  Upload,
  Plane,
  Car,
  Ship,
  User,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

interface QuotePDFBuilderDialogProps {
  quote: QuoteWithItems
  isOpen: boolean
  onClose: () => void
  onSave?: (customization: PDFCustomization) => void
  isAdmin?: boolean
}

interface ServiceOverrideState extends ServiceOverride {
  expanded?: boolean
}

export function QuotePDFBuilderDialog({
  quote,
  isOpen,
  onClose,
  onSave,
  isAdmin = false,
}: QuotePDFBuilderDialogProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [activeTab, setActiveTab] = useState('settings')
  const [uploadingServiceId, setUploadingServiceId] = useState<string | null>(null)
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})
  const previewRef = useRef<HTMLDivElement>(null)

  // Header customization
  const [headerTitle, setHeaderTitle] = useState('')
  const [headerSubtitle, setHeaderSubtitle] = useState('')
  const [headerIcon, setHeaderIcon] = useState<'plane' | 'car' | 'yacht' | 'none'>('plane')

  // Route info (for jet quotes)
  const [departureCode, setDepartureCode] = useState('')
  const [departureCity, setDepartureCity] = useState('')
  const [arrivalCode, setArrivalCode] = useState('')
  const [arrivalCity, setArrivalCity] = useState('')

  // Service overrides - keyed by service item ID
  const [serviceOverrides, setServiceOverrides] = useState<{ [key: string]: ServiceOverrideState }>({})

  // Footer customization
  const [customNotes, setCustomNotes] = useState('')
  const [customTerms, setCustomTerms] = useState('')

  // Hidden service items (admin only) - stores IDs of items to exclude from PDF
  const [hiddenServiceItems, setHiddenServiceItems] = useState<Set<string>>(new Set())

  // Add new service item state
  const [showAddServiceForm, setShowAddServiceForm] = useState(false)
  const [isAddingService, setIsAddingService] = useState(false)
  const [newServiceName, setNewServiceName] = useState('')
  const [newServicePrice, setNewServicePrice] = useState<number>(0)
  const [newServiceDescription, setNewServiceDescription] = useState('')
  const [newServiceModel, setNewServiceModel] = useState('')
  const [newServicePassengers, setNewServicePassengers] = useState('')
  const [newServiceFlightTime, setNewServiceFlightTime] = useState('')
  const [newServiceImages, setNewServiceImages] = useState<string[]>([])
  const [newServiceUploadingImages, setNewServiceUploadingImages] = useState(false)
  const [newServiceServicesList, setNewServiceServicesList] = useState<string[]>(['Crew & in-flight refreshments', 'VIP handling & concierge coordination'])
  const newServiceFileInputRef = useRef<HTMLInputElement | null>(null)
  const [localQuote, setLocalQuote] = useState(quote)

  // Sync localQuote when quote prop changes
  useEffect(() => {
    setLocalQuote(quote)
  }, [quote])

  // Initialize state from existing customization
  useEffect(() => {
    if (isOpen && localQuote) {
      const existing = localQuote.pdf_customization
      setHeaderTitle(existing?.header_title || '')
      setHeaderSubtitle(existing?.header_subtitle || '')
      setHeaderIcon(existing?.header_icon || 'plane')
      setCustomNotes(existing?.custom_notes || localQuote.notes || '')
      setCustomTerms(existing?.custom_terms || '')

      // Initialize route info
      setDepartureCode(existing?.route?.departure_code || '')
      setDepartureCity(existing?.route?.departure_city || '')
      setArrivalCode(existing?.route?.arrival_code || '')
      setArrivalCity(existing?.route?.arrival_city || '')

      // Initialize hidden service items
      setHiddenServiceItems(new Set(existing?.hidden_service_items || []))

      // Initialize service overrides
      const overrides: { [key: string]: ServiceOverrideState } = {}
      localQuote.service_items.forEach((item, index) => {
        const existingOverride = existing?.service_overrides?.[item.id]
        overrides[item.id] = {
          display_name: existingOverride?.display_name || item.service_name,
          display_description: existingOverride?.display_description || item.description || '',
          display_images: existingOverride?.display_images || item.images?.slice(0, 2) || [],
          details: existingOverride?.details || [],
          // Jet-specific fields
          jet_model: existingOverride?.jet_model || '',
          passengers: existingOverride?.passengers || '',
          flight_time: existingOverride?.flight_time || '',
          services_list: existingOverride?.services_list || (headerIcon === 'yacht' ? ['Crew & amenities', 'Catering & beverages'] : ['Crew & in-flight refreshments', 'VIP handling & concierge coordination']),
          price_override: existingOverride?.price_override,
          expanded: index === 0, // First item expanded by default
        }
      })
      setServiceOverrides(overrides)

      // Reset add service form
      setShowAddServiceForm(false)
      setNewServiceName('')
      setNewServicePrice(0)
      setNewServiceDescription('')
    }
  }, [isOpen, localQuote])

  // Build current customization object
  const buildCustomization = (): PDFCustomization => {
    const serviceOverridesClean: { [key: string]: ServiceOverride } = {}

    Object.entries(serviceOverrides).forEach(([id, override]) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { expanded, ...cleanOverride } = override
      serviceOverridesClean[id] = cleanOverride
    })

    return {
      header_title: headerTitle || undefined,
      header_subtitle: headerSubtitle || undefined,
      header_icon: headerIcon,
      route: (departureCode || departureCity || arrivalCode || arrivalCity) ? {
        departure_code: departureCode || undefined,
        departure_city: departureCity || undefined,
        arrival_code: arrivalCode || undefined,
        arrival_city: arrivalCity || undefined,
      } : undefined,
      service_overrides: Object.keys(serviceOverridesClean).length > 0 ? serviceOverridesClean : undefined,
      hidden_service_items: hiddenServiceItems.size > 0 ? Array.from(hiddenServiceItems) : undefined,
      custom_notes: customNotes || undefined,
      custom_terms: customTerms || undefined,
    }
  }

  const handleSave = async () => {
    setIsSaving(true)

    try {
      const customization = buildCustomization()

      const result = await updateQuotePDFCustomization(localQuote.id, customization)

      if (result.error) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Success',
          description: 'PDF customization saved successfully',
        })
        onSave?.(customization)
        router.refresh()
        onClose()
      }
    } catch (error) {
      console.error('Error saving customization:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save customization. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    setHeaderTitle('')
    setHeaderSubtitle('')
    setHeaderIcon('plane')
    setDepartureCode('')
    setDepartureCity('')
    setArrivalCode('')
    setArrivalCity('')
    setCustomNotes(localQuote.notes || '')
    setCustomTerms('')
    setHiddenServiceItems(new Set())

    const overrides: { [key: string]: ServiceOverrideState } = {}
    localQuote.service_items.forEach((item, index) => {
      overrides[item.id] = {
        display_name: item.service_name,
        display_description: item.description || '',
        display_images: item.images?.slice(0, 2) || [],
        details: [],
        jet_model: '',
        passengers: '',
        flight_time: '',
        services_list: headerIcon === 'yacht' ? ['Crew & amenities', 'Catering & beverages'] : ['Crew & in-flight refreshments', 'VIP handling & concierge coordination'],
        price_override: undefined,
        expanded: index === 0,
      }
    })
    setServiceOverrides(overrides)

    toast({
      title: 'Reset',
      description: 'Customization reset to defaults',
    })
  }

  // Helper to update services list
  const updateServicesList = (serviceId: string, index: number, value: string) => {
    setServiceOverrides(prev => {
      const currentList = [...(prev[serviceId]?.services_list || [])]
      currentList[index] = value
      return {
        ...prev,
        [serviceId]: {
          ...prev[serviceId],
          services_list: currentList,
        }
      }
    })
  }

  const addServiceItem = (serviceId: string) => {
    setServiceOverrides(prev => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        services_list: [...(prev[serviceId]?.services_list || []), ''],
      }
    }))
  }

  const removeServiceItem = (serviceId: string, index: number) => {
    setServiceOverrides(prev => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        services_list: prev[serviceId]?.services_list?.filter((_, i) => i !== index) || [],
      }
    }))
  }

  // Handler to add a new quote service item
  const handleAddNewServiceItem = async () => {
    if (!newServiceName.trim()) {
      toast({
        title: 'Error',
        description: 'Service name is required',
        variant: 'destructive',
      })
      return
    }

    if (newServicePrice <= 0) {
      toast({
        title: 'Error',
        description: 'Price must be greater than 0',
        variant: 'destructive',
      })
      return
    }

    setIsAddingService(true)

    try {
      const result = await addServiceItemToQuote(localQuote.id, {
        service_name: newServiceName.trim(),
        description: newServiceDescription.trim() || undefined,
        price: newServicePrice,
        images: newServiceImages,
      })

      if (result.error) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        })
        return
      }

      if (result.data) {
        // Add the new item to localQuote
        const newItem = result.data
        setLocalQuote(prev => ({
          ...prev,
          service_items: [...prev.service_items, newItem],
          subtotal: prev.subtotal + newServicePrice,
          total: prev.total + newServicePrice,
        }))

        // Initialize override for the new item with form values
        setServiceOverrides(prev => ({
          ...prev,
          [newItem.id]: {
            display_name: newItem.service_name,
            display_description: newItem.description || '',
            display_images: newServiceImages,
            details: [],
            jet_model: newServiceModel.trim() || '',
            passengers: newServicePassengers.trim() || '',
            flight_time: newServiceFlightTime.trim() || '',
            services_list: newServiceServicesList.filter(s => s.trim() !== ''),
            price_override: undefined,
            expanded: true,
          }
        }))

        // Reset form
        setNewServiceName('')
        setNewServicePrice(0)
        setNewServiceDescription('')
        setNewServiceModel('')
        setNewServicePassengers('')
        setNewServiceFlightTime('')
        setNewServiceImages([])
        setNewServiceServicesList(['Crew & in-flight refreshments', 'VIP handling & concierge coordination'])
        setShowAddServiceForm(false)

        toast({
          title: 'Success',
          description: 'Aircraft option added successfully',
        })

        router.refresh()
      }
    } catch (error) {
      console.error('Error adding service item:', error)
      toast({
        title: 'Error',
        description: 'Failed to add service item',
        variant: 'destructive',
      })
    } finally {
      setIsAddingService(false)
    }
  }

  // Handler to upload images for new service (uses Cloudinary directly)
  const handleNewServiceImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    setNewServiceUploadingImages(true)

    try {
      const uploadPromises = Array.from(files).slice(0, 2 - newServiceImages.length).map(async (file) => {
        // Validate file type
        const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
        if (!validTypes.includes(file.type)) {
          throw new Error(`Invalid file type: ${file.name}. Please use PNG, JPEG, or WEBP.`)
        }

        // Validate file size (max 25MB)
        if (file.size > 25 * 1024 * 1024) {
          throw new Error(`File too large: ${file.name}. Max size is 25MB.`)
        }

        // Upload to Cloudinary
        const formData = new FormData()
        formData.append('file', file)
        formData.append('upload_preset', 'concierge')
        formData.append('folder', 'concierge')

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/dku1gnuat/image/upload`,
          {
            method: 'POST',
            body: formData,
          }
        )

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`)
        }

        const data = await response.json()
        return data.secure_url
      })

      const uploadedUrls = await Promise.all(uploadPromises)
      setNewServiceImages(prev => [...prev, ...uploadedUrls].slice(0, 2))

      toast({
        title: 'Images uploaded',
        description: `${uploadedUrls.length} image(s) uploaded successfully`,
      })
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload images',
        variant: 'destructive',
      })
    } finally {
      setNewServiceUploadingImages(false)
      if (newServiceFileInputRef.current) {
        newServiceFileInputRef.current.value = ''
      }
    }
  }

  // Handler to delete a quote service item
  const handleDeleteServiceItem = async (serviceItemId: string) => {
    const item = localQuote.service_items.find(i => i.id === serviceItemId)
    if (!item) return

    // Don't allow deleting the last item
    if (localQuote.service_items.length === 1) {
      toast({
        title: 'Error',
        description: 'Cannot delete the last service item',
        variant: 'destructive',
      })
      return
    }

    try {
      const result = await deleteServiceItemFromQuote(localQuote.id, serviceItemId)

      if (result.error) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        })
        return
      }

      // Remove item from localQuote
      setLocalQuote(prev => ({
        ...prev,
        service_items: prev.service_items.filter(i => i.id !== serviceItemId),
        subtotal: Math.max(0, prev.subtotal - item.price),
        total: Math.max(0, prev.total - item.price),
      }))

      // Remove from overrides
      setServiceOverrides(prev => {
        const newOverrides = { ...prev }
        delete newOverrides[serviceItemId]
        return newOverrides
      })

      // Remove from hidden items if present
      setHiddenServiceItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(serviceItemId)
        return newSet
      })

      toast({
        title: 'Success',
        description: 'Service item deleted',
      })

      router.refresh()
    } catch (error) {
      console.error('Error deleting service item:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete service item',
        variant: 'destructive',
      })
    }
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
    if (!previewRef.current) {
      toast({
        title: 'Error',
        description: 'Preview not available. Please switch to Preview tab first.',
        variant: 'destructive',
      })
      return
    }

    setIsDownloading(true)

    try {
      // Switch to preview tab if not already there
      if (activeTab !== 'preview') {
        setActiveTab('preview')
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      // Find the preview element (yacht, car, or jet/ticket)
      const yachtElement = previewRef.current.querySelector('[data-preview="yacht"]') as HTMLElement
      const carElement = previewRef.current.querySelector('[data-preview="car"]') as HTMLElement
      const ticketElement = previewRef.current.querySelector('[data-preview="jet"]') as HTMLElement

      const previewElement = yachtElement || carElement || ticketElement

      if (!previewElement) {
        throw new Error('Could not find preview element')
      }

      // Store original styles and set fixed width for consistent PDF on all devices
      const originalStyle = previewElement.style.cssText
      const isYacht = !!yachtElement
      const isCar = !!carElement
      const previewWidth = (isYacht || isCar) ? '595px' : '420px'

      previewElement.style.width = previewWidth
      previewElement.style.minWidth = previewWidth
      previewElement.style.maxWidth = previewWidth

      // Wait for re-render with fixed width
      await new Promise(resolve => setTimeout(resolve, 100))

      // Preload the header image with CORS to ensure it's in browser cache
      const headerImageUrl = isYacht
        ? 'https://res.cloudinary.com/dku1gnuat/image/upload/v1767891666/yacht_header01_vwasld.png'
        : 'https://res.cloudinary.com/dku1gnuat/image/upload/v1767127062/invoiceImage_lcy4qm.png'
      await new Promise<void>((resolve) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => resolve()
        img.onerror = () => resolve()
        img.src = headerImageUrl
      })

      // Wait for all images in the element to load
      const images = previewElement.querySelectorAll('img')
      await Promise.all(
        Array.from(images).map((img) => {
          if (img.complete && img.naturalHeight !== 0) return Promise.resolve()
          return new Promise((resolve) => {
            img.onload = resolve
            img.onerror = resolve
          })
        })
      )

      // Small delay to ensure rendering is complete
      await new Promise(resolve => setTimeout(resolve, 100))

      // Store original styles to restore later
      const originalStyles: Map<HTMLElement, string> = new Map()

      // Apply inline hex colors to ALL elements BEFORE html2canvas processes them
      const allElements = previewElement.querySelectorAll('*')
      allElements.forEach((el) => {
        if (el instanceof HTMLElement) {
          // Save original inline style
          originalStyles.set(el, el.style.cssText)

          const computed = window.getComputedStyle(el)

          // Fix background color
          const bgColor = computed.backgroundColor
          if (bgColor) {
            el.style.backgroundColor = convertToHex(bgColor)
          }

          // Fix text color
          const textColor = computed.color
          if (textColor) {
            el.style.color = convertToHex(textColor)
          }

          // Fix border colors
          const borderColor = computed.borderColor
          if (borderColor) {
            el.style.borderColor = convertToHex(borderColor)
          }
        }

        // Handle SVG elements separately
        if (el instanceof SVGElement) {
          const svgEl = el as SVGElement & { style: CSSStyleDeclaration }
          originalStyles.set(el as unknown as HTMLElement, svgEl.style?.cssText || '')

          const computed = window.getComputedStyle(el)

          // Fix fill color
          const fillColor = computed.fill
          if (fillColor && fillColor !== 'none') {
            svgEl.style.fill = convertToHex(fillColor)
          }

          // Fix stroke color
          const strokeColor = computed.stroke
          if (strokeColor && strokeColor !== 'none') {
            svgEl.style.stroke = convertToHex(strokeColor)
          }

          // Fix color (for currentColor usage)
          const color = computed.color
          if (color) {
            svgEl.style.color = convertToHex(color)
          }
        }
      })

      // Also fix the root element
      originalStyles.set(previewElement, previewElement.style.cssText)
      const rootComputed = window.getComputedStyle(previewElement)
      previewElement.style.backgroundColor = convertToHex(rootComputed.backgroundColor)
      previewElement.style.color = convertToHex(rootComputed.color)

      // Fix object-fit for html2canvas (it doesn't support object-fit CSS)
      const allImages = previewElement.querySelectorAll('img')
      allImages.forEach((img) => {
        if (img instanceof HTMLImageElement) {
          const computed = window.getComputedStyle(img)
          const objectFit = computed.objectFit

          if (!originalStyles.has(img)) {
            originalStyles.set(img, img.style.cssText)
          }

          // Handle different image types separately
          const isHeaderBg = img.alt === 'Header'
          const isLogo = img.alt === 'Cadiz & Lluis'
          const isInteriorImage = img.alt === 'Aircraft Interior' || img.alt === 'Car Interior' || img.alt === 'Yacht Interior' || img.alt === 'Yacht'

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

      // Fix badge alignment for html2canvas - move text up with simple offset
      const badges = previewElement.querySelectorAll('.rounded-full')
      badges.forEach((badge) => {
        if (badge instanceof HTMLElement) {
          // Save original style
          originalStyles.set(badge, badge.style.cssText)

          // Fix text spans inside badges - move UP with negative margin
          const spans = badge.querySelectorAll('span')
          spans.forEach((span) => {
            if (span instanceof HTMLElement) {
              originalStyles.set(span, span.style.cssText)
              span.style.position = 'relative'
              span.style.top = '-5px'
            }
          })

          // Fix SVG icons
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
      const allTextElements = previewElement.querySelectorAll('p, span')
      allTextElements.forEach((el) => {
        if (el instanceof HTMLElement) {
          originalStyles.set(el, el.style.cssText)
          el.style.position = 'relative'
          el.style.top = '-4px'
        }
      })

      // Fix passenger count badge text
      const passengerCountElements = previewElement.querySelectorAll('.passenger-count')
      passengerCountElements.forEach((el) => {
        if (el instanceof HTMLElement) {
          el.style.top = '-6px'
        }
      })

      // Fix display name badge text
      const displayNameElements = previewElement.querySelectorAll('.display-name')
      displayNameElements.forEach((el) => {
        if (el instanceof HTMLElement) {
          el.style.top = '-8px'
        }
      })

      // Fix display name arrow icon
      const displayNameArrowElements = previewElement.querySelectorAll('.display-name-arrow')
      displayNameArrowElements.forEach((el) => {
        if (el instanceof HTMLElement) {
          el.style.top = '-8px'
        }
      })

      // Fix aircraft specs bar text - move up more
      const aircraftSpecsBars = previewElement.querySelectorAll('.aircraft-specs-bar')
      aircraftSpecsBars.forEach((bar) => {
        if (bar instanceof HTMLElement) {
          // Move all text elements including nested ones
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
      const canvas = await html2canvas(previewElement, {
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

      // Restore original preview element style
      previewElement.style.cssText = originalStyle

      // Create PDF with custom page size
      const imgWidth = canvas.width
      const imgHeight = canvas.height
      // Use A4 width for yacht/car (210mm) or narrower width for jet (106mm)
      const pdfWidth = (isYacht || isCar) ? 210 : 106 // mm
      const pdfHeight = (imgHeight / imgWidth) * pdfWidth

      const pdf = new jsPDF({
        orientation: pdfHeight > pdfWidth ? 'portrait' : 'landscape',
        unit: 'mm',
        format: [pdfWidth, pdfHeight],
      })

      const imgData = canvas.toDataURL('image/png')
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(`${localQuote.quote_number}.pdf`)

      toast({
        title: 'PDF Downloaded',
        description: 'Your quote PDF has been saved.',
      })
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate PDF. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsDownloading(false)
    }
  }

  const updateServiceOverride = (serviceId: string, field: keyof ServiceOverrideState, value: any) => {
    setServiceOverrides(prev => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        [field]: value,
      }
    }))
  }

  const addDetail = (serviceId: string) => {
    setServiceOverrides(prev => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        details: [...(prev[serviceId]?.details || []), { label: '', value: '' }],
      }
    }))
  }

  const updateDetail = (serviceId: string, detailIndex: number, field: 'label' | 'value', value: string) => {
    setServiceOverrides(prev => {
      const details = [...(prev[serviceId]?.details || [])]
      details[detailIndex] = { ...details[detailIndex], [field]: value }
      return {
        ...prev,
        [serviceId]: {
          ...prev[serviceId],
          details,
        }
      }
    })
  }

  const removeDetail = (serviceId: string, detailIndex: number) => {
    setServiceOverrides(prev => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        details: prev[serviceId]?.details?.filter((_, i) => i !== detailIndex) || [],
      }
    }))
  }

  const toggleImageSelection = (serviceId: string, imageUrl: string) => {
    setServiceOverrides(prev => {
      const currentImages = prev[serviceId]?.display_images || []
      let newImages: string[]

      if (currentImages.includes(imageUrl)) {
        // Remove image
        newImages = currentImages.filter(img => img !== imageUrl)
      } else {
        // Add image (max 2)
        if (currentImages.length < 2) {
          newImages = [...currentImages, imageUrl]
        } else {
          // Replace the second image
          newImages = [currentImages[0], imageUrl]
        }
      }

      return {
        ...prev,
        [serviceId]: {
          ...prev[serviceId],
          display_images: newImages,
        }
      }
    })
  }

  const toggleServiceExpanded = (serviceId: string) => {
    setServiceOverrides(prev => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        expanded: !prev[serviceId]?.expanded,
      }
    }))
  }

  // Toggle service item visibility (admin only)
  const toggleServiceItemVisibility = (serviceId: string) => {
    setHiddenServiceItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(serviceId)) {
        newSet.delete(serviceId)
      } else {
        newSet.add(serviceId)
      }
      return newSet
    })
  }

  // Handle image upload to Cloudinary
  const handleImageUpload = async (serviceId: string, files: FileList | null) => {
    if (!files || files.length === 0) return

    setUploadingServiceId(serviceId)

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        // Validate file type
        const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
        if (!validTypes.includes(file.type)) {
          throw new Error(`Invalid file type: ${file.name}. Please use PNG, JPEG, or WEBP.`)
        }

        // Validate file size (25MB max)
        if (file.size > 25 * 1024 * 1024) {
          throw new Error(`File too large: ${file.name}. Max size is 25MB.`)
        }

        // Upload to Cloudinary
        const formData = new FormData()
        formData.append('file', file)
        formData.append('upload_preset', 'concierge')
        formData.append('folder', 'concierge')

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/dku1gnuat/image/upload`,
          {
            method: 'POST',
            body: formData,
          }
        )

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`)
        }

        const data = await response.json()
        return data.secure_url
      })

      const uploadedUrls = await Promise.all(uploadPromises)

      // Add uploaded images to the service override
      setServiceOverrides(prev => {
        const currentImages = prev[serviceId]?.display_images || []
        return {
          ...prev,
          [serviceId]: {
            ...prev[serviceId],
            display_images: [...currentImages, ...uploadedUrls],
          }
        }
      })

      toast({
        title: 'Images uploaded',
        description: `Successfully uploaded ${uploadedUrls.length} image(s)`,
      })
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload images',
        variant: 'destructive',
      })
    } finally {
      setUploadingServiceId(null)
      // Reset file input
      if (fileInputRefs.current[serviceId]) {
        fileInputRefs.current[serviceId]!.value = ''
      }
    }
  }

  // Remove an image from service override
  const removeImage = (serviceId: string, imageUrl: string) => {
    setServiceOverrides(prev => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        display_images: prev[serviceId]?.display_images?.filter(img => img !== imageUrl) || [],
      }
    }))
  }

  // Build quote with customization for preview
  const quoteWithCustomization = {
    ...quote,
    pdf_customization: buildCustomization(),
  }

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-card-accent border-white/20 text-white w-[98vw] !max-w-[98vw] h-[98vh] !max-h-[98vh] p-0 flex flex-col">
        <DialogHeader className="space-y-1 sm:space-y-2 pb-3 sm:pb-4 border-b border-white/10 px-4 sm:px-6 pt-4 sm:pt-6">
          <DialogTitle className="luxury-heading text-lg sm:text-2xl md:text-3xl tracking-[0.1em] text-white flex items-center gap-2 sm:gap-3">
            <FileText className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="hidden sm:inline">Customize Quote PDF</span>
            <span className="sm:hidden">Quote PDF</span>
          </DialogTitle>
          <DialogDescription className="text-white/70 text-xs sm:text-sm tracking-wide hidden sm:block">
            Customize the visual layout and content of your quote PDF before sending
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col flex-1 min-h-0">
          <TabsList className="grid grid-cols-2 bg-white/5 border border-white/10 mx-4 sm:mx-6 mt-3 sm:mt-4 w-auto">
            <TabsTrigger value="settings" className="data-[state=active]:bg-white/20 text-white text-xs sm:text-sm py-2">
              <Settings className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Edit Content</span>
            </TabsTrigger>
            <TabsTrigger value="preview" className="data-[state=active]:bg-white/20 text-white text-xs sm:text-sm py-2">
              <Eye className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Live Preview</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="mt-0 overflow-y-auto flex-1 px-4 sm:px-6 py-3 sm:py-4">
            <div className="space-y-4 sm:space-y-6">
              {/* Header & Route Section */}
              <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 glass-card-accent rounded-xl border border-white/10">
                <h3 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                  <Plane className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="hidden sm:inline">Quote Header & Route</span>
                  <span className="sm:hidden">Header & Route</span>
                </h3>

                {/* Service Type Selector */}
                <div className="space-y-2">
                  <Label className="text-white/90 text-xs sm:text-sm">Service Type</Label>
                  <div className="grid grid-cols-4 sm:flex sm:flex-wrap gap-1.5 sm:gap-2">
                    {[
                      { value: 'plane', label: 'Jet', fullLabel: 'Private Jet', icon: Plane },
                      { value: 'yacht', label: 'Yacht', fullLabel: 'Yacht', icon: Ship },
                      { value: 'car', label: 'Car', fullLabel: 'Car Service', icon: Car },
                      { value: 'none', label: 'Other', fullLabel: 'Other', icon: FileText },
                    ].map((option) => {
                      const Icon = option.icon
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setHeaderIcon(option.value as 'plane' | 'car' | 'yacht' | 'none')}
                          className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-2 rounded-lg border transition-all ${
                            headerIcon === option.value
                              ? 'bg-white/20 border-white/40 text-white'
                              : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          <span className="text-[10px] sm:text-sm sm:hidden">{option.label}</span>
                          <span className="text-sm hidden sm:inline">{option.fullLabel}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Route Info - Only for Plane */}
                {headerIcon === 'plane' && (
                  <div className="space-y-3 sm:space-y-4 pt-3 sm:pt-4 border-t border-white/10">
                    <Label className="text-white/90 text-xs sm:text-sm font-semibold">Flight Route</Label>
                    <div className="grid grid-cols-2 gap-2 sm:gap-4">
                      <div className="space-y-1.5 sm:space-y-2">
                        <Label className="text-white/60 text-[10px] sm:text-xs">FROM Code</Label>
                        <Input
                          value={departureCode}
                          onChange={(e) => setDepartureCode(e.target.value.toUpperCase())}
                          placeholder="SCF"
                          maxLength={4}
                          className="bg-white/5 border-white/20 text-white placeholder:text-white/40 text-center text-base sm:text-lg font-bold uppercase"
                        />
                      </div>
                      <div className="space-y-1.5 sm:space-y-2">
                        <Label className="text-white/60 text-[10px] sm:text-xs">FROM City</Label>
                        <Input
                          value={departureCity}
                          onChange={(e) => setDepartureCity(e.target.value)}
                          placeholder="Scottsdale"
                          className="bg-white/5 border-white/20 text-white placeholder:text-white/40 text-sm"
                        />
                      </div>
                      <div className="space-y-1.5 sm:space-y-2">
                        <Label className="text-white/60 text-[10px] sm:text-xs">TO Code</Label>
                        <Input
                          value={arrivalCode}
                          onChange={(e) => setArrivalCode(e.target.value.toUpperCase())}
                          placeholder="LAS"
                          maxLength={4}
                          className="bg-white/5 border-white/20 text-white placeholder:text-white/40 text-center text-base sm:text-lg font-bold uppercase"
                        />
                      </div>
                      <div className="space-y-1.5 sm:space-y-2">
                        <Label className="text-white/60 text-[10px] sm:text-xs">TO City</Label>
                        <Input
                          value={arrivalCity}
                          onChange={(e) => setArrivalCity(e.target.value)}
                          placeholder="Las Vegas"
                          className="bg-white/5 border-white/20 text-white placeholder:text-white/40 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Jet Options Section */}
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base sm:text-lg font-semibold text-white">
                    {headerIcon === 'plane' ? 'Aircraft Options' : 'Service Options'}
                  </h3>
                  {isAdmin && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddServiceForm(true)}
                      className="border-white/30 hover:bg-white/10 text-white text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Service
                    </Button>
                  )}
                </div>

                {localQuote.service_items.map((item, index) => {
                  const override = serviceOverrides[item.id] || {}
                  const isExpanded = override.expanded
                  const isHidden = hiddenServiceItems.has(item.id)

                  return (
                    <div
                      key={item.id}
                      className={`p-3 sm:p-4 glass-card-accent rounded-xl border ${isHidden ? 'border-red-500/30 bg-red-500/5' : 'border-white/10'}`}
                    >
                      {/* Collapsed Header */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleServiceExpanded(item.id)}
                          className="flex-1 flex items-center justify-between text-left gap-2"
                        >
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                            <span className={`text-white text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded shrink-0 ${isHidden ? 'bg-red-500/30' : 'bg-white/20'}`}>
                              {String(index + 1).padStart(2, '0')}
                            </span>
                            <span className={`font-medium text-sm sm:text-base truncate ${isHidden ? 'text-white/40 line-through' : 'text-white'}`}>
                              {override.display_name || item.service_name}
                              {override.jet_model && <span className="text-white/60 ml-1 hidden sm:inline">{override.jet_model}</span>}
                            </span>
                            <span className={`text-xs sm:text-sm shrink-0 ${isHidden ? 'text-white/40 line-through' : 'text-white/70'}`}>{formatCurrency(override.price_override ?? item.price)}</span>
                            {isHidden && <span className="text-red-400 text-[10px] sm:text-xs">(Hidden)</span>}
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5 text-white/50 shrink-0" />
                          ) : (
                            <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-white/50 shrink-0" />
                          )}
                        </button>
                        {/* Admin Delete/Restore Button */}
                        {isAdmin && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleServiceItemVisibility(item.id)}
                            className={`shrink-0 h-8 w-8 ${isHidden
                              ? 'text-green-400 hover:text-green-300 hover:bg-green-500/10'
                              : 'text-red-400 hover:text-red-300 hover:bg-red-500/10'}`}
                            title={isHidden ? 'Restore item' : 'Remove item from PDF'}
                          >
                            {isHidden ? (
                              <RotateCcw className="h-4 w-4" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <div className="mt-3 sm:mt-4 space-y-3 sm:space-y-4 pt-3 sm:pt-4 border-t border-white/10">
                          {/* Aircraft Name & Model (for planes) */}
                          {headerIcon === 'plane' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                              <div className="space-y-1.5 sm:space-y-2 sm:col-span-2">
                                <Label className="text-white/90 text-xs sm:text-sm">Aircraft Name</Label>
                                <Input
                                  value={override.display_name || ''}
                                  onChange={(e) => updateServiceOverride(item.id, 'display_name', e.target.value)}
                                  placeholder="2022 LearJet"
                                  className="bg-white/5 border-white/20 text-white placeholder:text-white/40 text-sm"
                                />
                              </div>
                              <div className="space-y-1.5 sm:space-y-2">
                                <Label className="text-white/90 text-xs sm:text-sm">Model</Label>
                                <Input
                                  value={override.jet_model || ''}
                                  onChange={(e) => updateServiceOverride(item.id, 'jet_model', e.target.value)}
                                  placeholder="45xr"
                                  className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <Label className="text-white/90 text-sm">Display Name</Label>
                              <Input
                                value={override.display_name || ''}
                                onChange={(e) => updateServiceOverride(item.id, 'display_name', e.target.value)}
                                placeholder={item.service_name}
                                className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
                              />
                            </div>
                          )}

                          {/* Passengers & Flight Time (for planes) */}
                          {headerIcon === 'plane' && (
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-white/90 text-sm">Passengers</Label>
                                <Input
                                  value={override.passengers || ''}
                                  onChange={(e) => updateServiceOverride(item.id, 'passengers', e.target.value)}
                                  placeholder="8"
                                  className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-white/90 text-sm">Flight Time</Label>
                                <Input
                                  value={override.flight_time || ''}
                                  onChange={(e) => updateServiceOverride(item.id, 'flight_time', e.target.value)}
                                  placeholder="3h 27m"
                                  className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
                                />
                              </div>
                            </div>
                          )}

                          {/* Images Section */}
                          <div className="space-y-3">
                            <Label className="text-white/90 text-sm flex items-center gap-2">
                              <ImageIcon className="h-4 w-4" />
                              {headerIcon === 'plane' ? 'Aircraft Images (Exterior + Interior)' : 'Images'}
                            </Label>

                            {/* Currently Selected Images */}
                            {override.display_images && override.display_images.length > 0 && (
                              <div className="space-y-2">
                                <p className="text-xs text-white/50">Selected ({override.display_images.length}/2):</p>
                                <div className="flex flex-wrap gap-3">
                                  {override.display_images.map((imageUrl, imgIndex) => (
                                    <div
                                      key={imgIndex}
                                      className="relative w-32 h-24 rounded-lg overflow-hidden border-2 border-white group"
                                    >
                                      <img
                                        src={imageUrl}
                                        alt={imgIndex === 0 ? 'Exterior' : 'Interior'}
                                        className="w-full h-full object-cover"
                                      />
                                      <div className="absolute top-1 left-1 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded">
                                        {headerIcon === 'plane' ? (imgIndex === 0 ? 'Exterior' : 'Interior') : `Image ${imgIndex + 1}`}
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => removeImage(item.id, imageUrl)}
                                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Available Images from Original Item */}
                            {item.images && item.images.length > 0 && (
                              <div className="space-y-2">
                                <p className="text-xs text-white/50">Available images (click to add):</p>
                                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                                  {item.images
                                    .filter(img => !override.display_images?.includes(img))
                                    .map((imageUrl, imgIndex) => (
                                      <button
                                        key={imgIndex}
                                        type="button"
                                        onClick={() => {
                                          const currentImages = override.display_images || []
                                          if (currentImages.length < 2) {
                                            setServiceOverrides(prev => ({
                                              ...prev,
                                              [item.id]: {
                                                ...prev[item.id],
                                                display_images: [...currentImages, imageUrl],
                                              }
                                            }))
                                          } else {
                                            toast({
                                              title: 'Maximum 2 images',
                                              description: 'Remove an image first to add a new one',
                                              variant: 'destructive',
                                            })
                                          }
                                        }}
                                        className="relative aspect-video rounded-lg overflow-hidden border-2 border-white/20 hover:border-white/50 transition-all"
                                      >
                                        <img
                                          src={imageUrl}
                                          alt={`Available ${imgIndex + 1}`}
                                          className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                          <Plus className="h-4 w-4 text-white" />
                                        </div>
                                      </button>
                                    ))}
                                </div>
                              </div>
                            )}

                            {/* Upload New Images */}
                            <div className="flex items-center gap-2">
                              <input
                                type="file"
                                ref={(el) => { fileInputRefs.current[item.id] = el }}
                                accept="image/png,image/jpeg,image/jpg,image/webp"
                                multiple
                                className="hidden"
                                onChange={(e) => handleImageUpload(item.id, e.target.files)}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => fileInputRefs.current[item.id]?.click()}
                                disabled={uploadingServiceId === item.id}
                                className="text-xs border-white/20 text-white/70 hover:bg-white/10"
                              >
                                {uploadingServiceId === item.id ? (
                                  <>
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                    Uploading...
                                  </>
                                ) : (
                                  <>
                                    <Upload className="h-3 w-3 mr-1" />
                                    Upload Images
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>

                          {/* Services List (for planes and yachts) */}
                          {(headerIcon === 'plane' || headerIcon === 'yacht') && (
                            <div className="space-y-3">
                              <Label className="text-white/90 text-sm">Included Services</Label>
                              <div className="space-y-2">
                                {(override.services_list || []).map((service, svcIndex) => (
                                  <div key={svcIndex} className="flex items-center gap-2">
                                    <span className="text-white/50">•</span>
                                    <Input
                                      value={service}
                                      onChange={(e) => updateServicesList(item.id, svcIndex, e.target.value)}
                                      placeholder="Service description..."
                                      className="bg-white/5 border-white/20 text-white placeholder:text-white/40 flex-1"
                                    />
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => removeServiceItem(item.id, svcIndex)}
                                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 w-8"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ))}
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => addServiceItem(item.id)}
                                  className="text-xs border-dashed border-white/30 text-white/70 hover:bg-white/10"
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Add Service
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* Price */}
                          <div className="space-y-2">
                            <Label className="text-white/90 text-sm">
                              Price {!isAdmin && <span className="text-white/40 text-xs">(Read-only)</span>}
                            </Label>
                            <div className="relative">
                              <span className={`absolute left-3 top-1/2 -translate-y-1/2 ${isAdmin ? 'text-white/70' : 'text-white/40'}`}>$</span>
                              <Input
                                type="number"
                                defaultValue={override.price_override ?? item.price}
                                key={`price-${item.id}-${override.price_override ?? item.price}`}
                                onBlur={(e) => {
                                  if (!isAdmin) return
                                  const val = e.target.value
                                  const numVal = parseFloat(val)
                                  updateServiceOverride(item.id, 'price_override', isNaN(numVal) ? 0 : numVal)
                                }}
                                readOnly={!isAdmin}
                                className={`pl-7 ${isAdmin
                                  ? 'bg-white/5 border-white/20 text-white'
                                  : 'bg-white/5 border-white/10 text-white/60 cursor-not-allowed'}`}
                              />
                            </div>
                          </div>

                          {/* Description (for non-plane types) */}
                          {headerIcon !== 'plane' && (
                            <div className="space-y-2">
                              <Label className="text-white/90 text-sm">Description</Label>
                              <Textarea
                                value={override.display_description || ''}
                                onChange={(e) => updateServiceOverride(item.id, 'display_description', e.target.value)}
                                placeholder="Service description..."
                                rows={3}
                                className="bg-white/5 border-white/20 text-white placeholder:text-white/40 resize-none"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}

                              </div>

              {/* Notes Section */}
              <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 glass-card-accent rounded-xl border border-white/10">
                <h3 className="text-base sm:text-lg font-semibold text-white">Notes</h3>
                <div className="space-y-2">
                  <Textarea
                    value={customNotes}
                    onChange={(e) => setCustomNotes(e.target.value)}
                    placeholder="Add any notes for the client..."
                    rows={3}
                    className="bg-white/5 border-white/20 text-white placeholder:text-white/40 resize-none text-sm"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="mt-0 flex-1 min-h-0 px-2 sm:px-6 py-2 sm:py-4">
            <div className="h-full rounded-xl overflow-hidden border border-white/20 bg-white">
              <div ref={previewRef} className="h-full overflow-y-auto p-6" style={{ backgroundColor: '#f8f8f8' }}>
                {/* PDF Preview - Conditional Quote Style */}
                {headerIcon === 'yacht' ? (
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
                        <p style={{ fontSize: '16px', fontWeight: 600, color: '#1a1a1a', marginBottom: '4px' }}>{localQuote.client_name}</p>
                        <p style={{ fontSize: '11px', color: '#6b7280' }}>{localQuote.client_email}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ backgroundColor: '#1a1a1a', padding: '8px 14px', borderTopLeftRadius: '4px', borderTopRightRadius: '8px', borderBottomLeftRadius: '4px', borderBottomRightRadius: '4px', marginBottom: '10px', display: 'inline-block' }}>
                          <p style={{ fontSize: '10px', color: 'white', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Date:</p>
                        </div>
                        <p style={{ fontSize: '16px', fontWeight: 600, color: '#1a1a1a', marginBottom: '4px' }}>
                          {new Date(localQuote.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </p>
                        <p style={{ fontSize: '11px', color: '#6b7280' }}>{localQuote.quote_number}</p>
                      </div>
                    </div>

                    {/* Dotted Line */}
                    <div style={{ borderBottom: '1px dashed #d1d5db', margin: '10px 50px' }}></div>

                    {/* Loop through yacht service items (max 5, excluding hidden) */}
                    {localQuote.service_items && localQuote.service_items.length > 0 && localQuote.service_items.filter(item => !hiddenServiceItems.has(item.id)).slice(0, 5).map((item, idx) => {
                      if (!item) return null

                      const override = serviceOverrides[item.id] || {}
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
                      const yachtDeparture = override.departure_city || departureCity || 'MIAMI'
                      const yachtDestination = override.arrival_city || arrivalCity || 'BAHAMAS'

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
                            {/* Left Column - Details */}
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
                            </div>

                            {/* Right Column - Secondary Image and Price */}
                            <div style={{ width: '280px' }}>
                              {displayImages[1] && (
                                <img
                                  src={displayImages[1]}
                                  alt="Yacht Interior"
                                  style={{ width: '100%', height: '200px', objectFit: 'cover', display: 'block', marginBottom: '0', borderRadius: '8px' }}
                                />
                              )}

                              {/* Price Below Image */}
                              <div style={{
                                marginTop: '16px',
                                textAlign: 'center'
                              }}>
                                <p style={{ fontSize: '28px', fontWeight: 700, color: '#1a1a1a', marginBottom: '4px' }}>
                                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(item.price)}
                                </p>
                                <p style={{ fontSize: '8px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px' }}>PRICE</p>
                              </div>
                            </div>
                          </div>

                          {/* Separator between yachts */}
                          {idx < Math.min(localQuote.service_items.length, 5) - 1 && (
                            <div style={{ borderBottom: '1px solid #e5e7eb', margin: '20px 50px' }}></div>
                          )}
                        </div>
                      )
                    })}

                    {/* Separator before notes */}
                    <div style={{ borderBottom: '1px solid #e5e7eb', margin: '20px 50px' }}></div>

                    {/* Notes Section */}
                    {(customNotes || localQuote.notes) && (
                      <div style={{ padding: '18px 40px' }}>
                        <p style={{ fontSize: '8px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>NOTES:</p>
                        <p style={{ fontSize: '10px', color: '#6b7280', lineHeight: '1.5' }}>{customNotes || localQuote.notes}</p>
                      </div>
                    )}

                    {/* Footer */}
                    <div style={{ backgroundColor: '#1a2332', padding: '36px 50px', textAlign: 'center' }}>
                      <p style={{ fontSize: '20px', fontWeight: 700, color: 'white', letterSpacing: '2.8px', marginBottom: '7px' }}>CADIZ & LLUIS</p>
                      <p style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '20px' }}>LUXURY LIVING</p>
                      <p style={{ fontSize: '12px', color: 'white', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
                        QUOTE VALID UNTIL {new Date(localQuote.expiration_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()}
                      </p>
                      <p style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.7)' }}>
                        {localQuote.manager_email || 'brody@cadizlluis.com'} · www.cadizlluis.com
                      </p>
                    </div>
                  </div>
                ) : headerIcon === 'car' ? (
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
                        <p style={{ fontSize: '14px', fontWeight: 600, color: '#1a1a1a', marginBottom: '3px' }}>{localQuote.client_name}</p>
                        <p style={{ fontSize: '9px', color: '#6b7280' }}>{localQuote.client_email}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ backgroundColor: '#1a1a1a', padding: '4px 10px', marginBottom: '8px', display: 'inline-block' }}>
                          <p style={{ fontSize: '8px', color: 'white', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600 }}>EXCLUSIVE RATES</p>
                        </div>
                        <p style={{ fontSize: '14px', fontWeight: 600, color: '#1a1a1a', marginBottom: '3px' }}>
                          {new Date(localQuote.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </p>
                        <p style={{ fontSize: '9px', color: '#6b7280' }}>{localQuote.quote_number}</p>
                      </div>
                    </div>

                    {/* Loop through car service items (max 5, excluding hidden) */}
                    {localQuote.service_items && localQuote.service_items.length > 0 && localQuote.service_items.filter(item => !hiddenServiceItems.has(item.id)).slice(0, 5).map((item, idx) => {
                      if (!item) return null
                      const override = serviceOverrides[item.id] || {}
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
                      const carPickup = override.departure_city || departureCity || 'AIRPORT'
                      const carDropoff = override.arrival_city || arrivalCity || 'HOTEL'

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
                                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(item.price)}
                                </p>
                                <p style={{ fontSize: '9px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.8px' }}>TOTAL</p>
                              </div>
                            </div>
                          </div>

                          {/* Separator between cars */}
                          {idx < Math.min(localQuote.service_items.length, 5) - 1 && (
                            <div style={{ borderBottom: '1px solid #e5e7eb', margin: '20px 50px' }}></div>
                          )}
                        </div>
                      )
                    })}

                    {/* Separator */}
                    <div style={{ borderBottom: '1px solid #e5e7eb', margin: '20px 40px' }}></div>

                    {/* Notes Section */}
                    {localQuote.notes && (
                      <div style={{ padding: '18px 40px' }}>
                        <p style={{ fontSize: '8px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>NOTES:</p>
                        <p style={{ fontSize: '10px', color: '#6b7280', lineHeight: '1.5' }}>{localQuote.notes}</p>
                      </div>
                    )}

                    {/* Footer */}
                    <div style={{ backgroundColor: '#1a2332', padding: '28px 40px', textAlign: 'center' }}>
                      <p style={{ fontSize: '18px', fontWeight: 700, color: 'white', letterSpacing: '2.5px', marginBottom: '5px' }}>CADIZ & LLUIS</p>
                      <p style={{ fontSize: '9px', color: 'rgba(255, 255, 255, 0.6)', letterSpacing: '1.8px', textTransform: 'uppercase', marginBottom: '16px' }}>LUXURY LIVING</p>
                      <p style={{ fontSize: '10px', color: 'white', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '10px' }}>
                        QUOTE VALID UNTIL {new Date(localQuote.expiration_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()}
                      </p>
                      <p style={{ fontSize: '9px', color: 'rgba(255, 255, 255, 0.7)' }}>
                        {localQuote.manager_email || 'brody@cadizlluis.com'} · www.cadizlluis.com
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
                      {headerIcon === 'plane' ? 'PRIVATE JET PROPOSAL' :
                       headerIcon === 'yacht' ? 'YACHT CHARTER PROPOSAL' :
                       headerIcon === 'car' ? 'LUXURY CAR SERVICE' :
                       headerTitle || 'SERVICE PROPOSAL'}
                    </h1>
                  </div>

                  {/* Boarding Pass Header */}
                  {headerIcon === 'plane' && (
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
                        <p className="text-sm font-semibold text-gray-900">{localQuote.client_name}</p>
                        <p className="text-xs text-gray-500">{localQuote.client_email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-1">Date:</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {new Date(localQuote.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </p>
                        <p className="text-xs text-gray-500">{localQuote.quote_number}</p>
                      </div>
                    </div>

                    {/* Route Display */}
                    {headerIcon === 'plane' && (departureCode || arrivalCode) && (
                      <div className="flex items-center justify-center gap-4 py-4">
                        <div className="text-center">
                          <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-1">From</p>
                          <p className="text-2xl font-bold text-gray-900">{departureCode || '---'}</p>
                          <p className="text-[10px] text-gray-500 mt-1">{departureCity || 'Departure'}</p>
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
                          <p className="text-2xl font-bold text-gray-900">{arrivalCode || '---'}</p>
                          <p className="text-[10px] text-gray-500 mt-1">{arrivalCity || 'Arrival'}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Aircraft Options (excluding hidden) */}
                  {localQuote.service_items.filter(item => !hiddenServiceItems.has(item.id)).map((item, index) => {
                    const override = serviceOverrides[item.id] || {}
                    const displayImages = override.display_images?.slice(0, 2) || item.images?.slice(0, 2) || []
                    const displayName = override.display_name || item.service_name
                    const jetModel = override.jet_model || ''
                    const passengers = override.passengers || ''
                    const flightTime = override.flight_time || ''
                    const servicesList = override.services_list || []

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
                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(override.price_override ?? item.price)}
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
                  {customNotes && (
                    <div className="bg-white px-5 py-4 border-b border-gray-100">
                      <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-2">Notes:</p>
                      <p className="text-xs text-gray-600 whitespace-pre-wrap">{customNotes}</p>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="bg-gray-900 px-5 py-6 text-center">
                    <p className="text-lg font-bold text-white tracking-[0.2em] mb-1">CADIZ & LLUIS</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-4">Luxury Living</p>
                    <p className="text-[10px] text-white uppercase tracking-wider mb-2">
                      Quote valid until {new Date(localQuote.expiration_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      {localQuote.manager_email || 'info@cadizlluis.com'} · www.cadizlluis.com
                    </p>
                  </div>
                </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4 border-t border-white/10">
          <Button
            type="button"
            variant="ghost"
            onClick={handleReset}
            className="text-white/70 hover:text-white hover:bg-white/10 order-last sm:order-first text-xs sm:text-sm"
          >
            <RotateCcw className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Reset to Defaults</span>
            <span className="sm:hidden ml-2">Reset</span>
          </Button>

          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-white/30 hover:bg-white/10 text-white flex-1 sm:flex-none text-xs sm:text-sm"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="border-white/30 hover:bg-white/10 text-white flex-1 sm:flex-none text-xs sm:text-sm"
            >
              {isDownloading ? (
                <Loader2 className="h-4 w-4 animate-spin sm:mr-2" />
              ) : (
                <Download className="h-4 w-4 sm:mr-2" />
              )}
              <span className="hidden sm:inline">{isDownloading ? 'Generating...' : 'Download PDF'}</span>
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="btn-luxury flex-1 sm:flex-none text-xs sm:text-sm"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin sm:mr-2" />
              ) : (
                <Save className="h-4 w-4 sm:mr-2" />
              )}
              <span className="hidden sm:inline">{isSaving ? 'Saving...' : 'Save'}</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Add Service Popup */}
    <Dialog open={showAddServiceForm} onOpenChange={(open) => {
      setShowAddServiceForm(open)
      if (!open) {
        setNewServiceName('')
        setNewServicePrice(0)
        setNewServiceDescription('')
        setNewServiceModel('')
        setNewServicePassengers('')
        setNewServiceFlightTime('')
        setNewServiceImages([])
        setNewServiceServicesList(['Crew & in-flight refreshments', 'VIP handling & concierge coordination'])
      }
    }}>
      <DialogContent className="glass-card-accent border-white/20 text-white max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Plane className="h-5 w-5" />
            Add Aircraft Option
          </DialogTitle>
          <DialogDescription className="text-white/70">
            Add another aircraft option to this quote
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Aircraft Name & Model */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white/90">Aircraft Name *</Label>
              <Input
                value={newServiceName}
                onChange={(e) => setNewServiceName(e.target.value)}
                placeholder="e.g., 2022 LearJet"
                className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white/90">Model</Label>
              <Input
                value={newServiceModel}
                onChange={(e) => setNewServiceModel(e.target.value)}
                placeholder="e.g., 45xr"
                className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
              />
            </div>
          </div>

          {/* Price */}
          <div className="space-y-2">
            <Label className="text-white/90">Price *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50">$</span>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={newServicePrice || ''}
                onChange={(e) => setNewServicePrice(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="pl-7 bg-white/5 border-white/20 text-white placeholder:text-white/40"
              />
            </div>
          </div>

          {/* Passengers & Flight Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white/90">Passengers</Label>
              <Input
                value={newServicePassengers}
                onChange={(e) => setNewServicePassengers(e.target.value)}
                placeholder="e.g., 8"
                className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white/90">Flight Time</Label>
              <Input
                value={newServiceFlightTime}
                onChange={(e) => setNewServiceFlightTime(e.target.value)}
                placeholder="e.g., 3h 27m"
                className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
              />
            </div>
          </div>

          {/* Images */}
          <div className="space-y-2">
            <Label className="text-white/90 flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Aircraft Images (Exterior + Interior)
            </Label>
            {newServiceImages.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {newServiceImages.map((imageUrl, imgIndex) => (
                  <div key={imgIndex} className="relative w-24 h-18 rounded-lg overflow-hidden border border-white/20 group">
                    <img src={imageUrl} alt={imgIndex === 0 ? 'Exterior' : 'Interior'} className="w-full h-full object-cover" />
                    <div className="absolute top-1 left-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">
                      {imgIndex === 0 ? 'Exterior' : 'Interior'}
                    </div>
                    <button
                      type="button"
                      onClick={() => setNewServiceImages(prev => prev.filter((_, i) => i !== imgIndex))}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={newServiceFileInputRef}
                accept="image/png,image/jpeg,image/jpg,image/webp"
                multiple
                className="hidden"
                onChange={(e) => handleNewServiceImageUpload(e.target.files)}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => newServiceFileInputRef.current?.click()}
                disabled={newServiceUploadingImages || newServiceImages.length >= 2}
                className="text-xs border-white/20 text-white/70 hover:bg-white/10"
              >
                {newServiceUploadingImages ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-3 w-3 mr-1" />
                    Upload Images {newServiceImages.length > 0 && `(${newServiceImages.length}/2)`}
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Included Services */}
          <div className="space-y-2">
            <Label className="text-white/90">Included Services</Label>
            <div className="space-y-2">
              {newServiceServicesList.map((service, svcIndex) => (
                <div key={svcIndex} className="flex items-center gap-2">
                  <span className="text-white/50">•</span>
                  <Input
                    value={service}
                    onChange={(e) => {
                      const updated = [...newServiceServicesList]
                      updated[svcIndex] = e.target.value
                      setNewServiceServicesList(updated)
                    }}
                    placeholder="Service description..."
                    className="bg-white/5 border-white/20 text-white placeholder:text-white/40 flex-1 text-sm"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setNewServiceServicesList(prev => prev.filter((_, i) => i !== svcIndex))}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 w-8"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setNewServiceServicesList(prev => [...prev, ''])}
                className="text-white/60 hover:text-white hover:bg-white/10 text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Service
              </Button>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label className="text-white/90">Description (optional)</Label>
            <Textarea
              value={newServiceDescription}
              onChange={(e) => setNewServiceDescription(e.target.value)}
              placeholder="Aircraft details..."
              rows={2}
              className="bg-white/5 border-white/20 text-white placeholder:text-white/40 resize-none"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setShowAddServiceForm(false)
              setNewServiceName('')
              setNewServicePrice(0)
              setNewServiceDescription('')
              setNewServiceModel('')
              setNewServicePassengers('')
              setNewServiceFlightTime('')
              setNewServiceImages([])
              setNewServiceServicesList(['Crew & in-flight refreshments', 'VIP handling & concierge coordination'])
            }}
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleAddNewServiceItem}
            disabled={isAddingService || !newServiceName.trim() || newServicePrice <= 0}
            className="bg-white/20 hover:bg-white/30 text-white"
          >
            {isAddingService ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Add Aircraft
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  )
}

export default QuotePDFBuilderDialog
