'use client'

import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { QuoteWithItems, PDFCustomization, ServiceOverride, updateQuotePDFCustomization } from '@/lib/actions/quotes'
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
}

interface ServiceOverrideState extends ServiceOverride {
  expanded?: boolean
}

export function QuotePDFBuilderDialog({
  quote,
  isOpen,
  onClose,
  onSave,
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

  // Service overrides - keyed by service item ID
  const [serviceOverrides, setServiceOverrides] = useState<{ [key: string]: ServiceOverrideState }>({})

  // Footer customization
  const [customNotes, setCustomNotes] = useState('')
  const [customTerms, setCustomTerms] = useState('')

  // Initialize state from existing customization
  useEffect(() => {
    if (isOpen && quote) {
      const existing = quote.pdf_customization
      setHeaderTitle(existing?.header_title || '')
      setHeaderSubtitle(existing?.header_subtitle || '')
      setHeaderIcon(existing?.header_icon || 'plane')
      setCustomNotes(existing?.custom_notes || quote.notes || '')
      setCustomTerms(existing?.custom_terms || '')

      // Initialize service overrides
      const overrides: { [key: string]: ServiceOverrideState } = {}
      quote.service_items.forEach((item, index) => {
        const existingOverride = existing?.service_overrides?.[item.id]
        overrides[item.id] = {
          display_name: existingOverride?.display_name || item.service_name,
          display_description: existingOverride?.display_description || item.description || '',
          display_images: existingOverride?.display_images || item.images?.slice(0, 2) || [],
          details: existingOverride?.details || [],
          expanded: index === 0, // First item expanded by default
        }
      })
      setServiceOverrides(overrides)
    }
  }, [isOpen, quote])

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
      service_overrides: Object.keys(serviceOverridesClean).length > 0 ? serviceOverridesClean : undefined,
      custom_notes: customNotes || undefined,
      custom_terms: customTerms || undefined,
    }
  }

  const handleSave = async () => {
    setIsSaving(true)

    const customization = buildCustomization()

    const result = await updateQuotePDFCustomization(quote.id, customization)

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

    setIsSaving(false)
  }

  const handleReset = () => {
    setHeaderTitle('')
    setHeaderSubtitle('')
    setHeaderIcon('plane')
    setCustomNotes(quote.notes || '')
    setCustomTerms('')

    const overrides: { [key: string]: ServiceOverrideState } = {}
    quote.service_items.forEach((item, index) => {
      overrides[item.id] = {
        display_name: item.service_name,
        display_description: item.description || '',
        display_images: item.images?.slice(0, 2) || [],
        details: [],
        expanded: index === 0,
      }
    })
    setServiceOverrides(overrides)

    toast({
      title: 'Reset',
      description: 'Customization reset to defaults',
    })
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
        // Wait for the tab to switch and render
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      // Find the actual ticket preview element inside the preview container
      const ticketElement = previewRef.current.querySelector('.max-w-\\[400px\\]') as HTMLElement

      if (!ticketElement) {
        throw new Error('Could not find ticket preview element')
      }

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

      // Use browser print to PDF - opens print dialog where user can save as PDF
      // This handles all modern CSS including oklch/oklab colors
      const printWindow = window.open('', '_blank', 'width=500,height=800')

      if (!printWindow) {
        throw new Error('Could not open print window. Please allow popups.')
      }

      // Get all images and convert to base64 for the print window
      const imagePromises = Array.from(ticketElement.querySelectorAll('img')).map(async (img) => {
        try {
          const response = await fetch(img.src)
          const blob = await response.blob()
          return new Promise<{src: string, base64: string}>((resolve) => {
            const reader = new FileReader()
            reader.onloadend = () => {
              resolve({ src: img.src, base64: reader.result as string })
            }
            reader.readAsDataURL(blob)
          })
        } catch {
          return { src: img.src, base64: img.src }
        }
      })

      const imageData = await Promise.all(imagePromises)

      // Clone the HTML content
      let htmlContent = ticketElement.outerHTML

      // Replace image sources with base64
      imageData.forEach(({ src, base64 }) => {
        htmlContent = htmlContent.replace(new RegExp(src.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), base64)
      })

      // Replace Lucide SVG icons with inline SVG (they come as <svg> elements from React)
      // The SVGs should already be in the HTML, but we need to ensure they're styled correctly
      // Add inline styles to SVG elements
      htmlContent = htmlContent.replace(/<svg/g, '<svg style="width: 1.25rem; height: 1.25rem; display: inline-block; vertical-align: middle;"')

      // Write the print document
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${quote.quote_number}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }

            body {
              font-family: 'Inter', system-ui, -apple-system, sans-serif;
              background: #ffffff;
              padding: 20px;
              display: flex;
              justify-content: center;
            }

            .ticket-container {
              max-width: 400px;
              background: #ffffff;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
            }

            /* Tailwind-like utilities */
            .bg-white { background-color: #ffffff; }
            .bg-gray-900 { background-color: #111827; }
            .bg-gray-100 { background-color: #f3f4f6; }
            .bg-black\\/60 { background-color: rgba(0,0,0,0.6); }
            .bg-white\\/95 { background-color: rgba(255,255,255,0.95); }

            .text-white { color: #ffffff; }
            .text-gray-900 { color: #111827; }
            .text-gray-700 { color: #374151; }
            .text-gray-500 { color: #6b7280; }
            .text-gray-400 { color: #9ca3af; }
            .text-gray-300 { color: #d1d5db; }
            .text-blue-500 { color: #3b82f6; }
            .text-white\\/60 { color: rgba(255,255,255,0.6); }
            .text-white\\/50 { color: rgba(255,255,255,0.5); }
            .text-white\\/70 { color: rgba(255,255,255,0.7); }

            .text-xs { font-size: 0.75rem; line-height: 1rem; }
            .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
            .text-xl { font-size: 1.25rem; line-height: 1.75rem; }
            .text-2xl { font-size: 1.5rem; line-height: 2rem; }
            .text-\\[9px\\] { font-size: 9px; }
            .text-\\[10px\\] { font-size: 10px; }

            .font-bold { font-weight: 700; }
            .font-semibold { font-weight: 600; }

            .text-center { text-align: center; }
            .text-left { text-align: left; }
            .text-right { text-align: right; }

            .uppercase { text-transform: uppercase; }
            .tracking-wider { letter-spacing: 0.05em; }
            .tracking-widest { letter-spacing: 0.1em; }

            .p-4 { padding: 1rem; }
            .p-5 { padding: 1.25rem; }
            .px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
            .px-5 { padding-left: 1.25rem; padding-right: 1.25rem; }
            .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
            .py-1\\.5 { padding-top: 0.375rem; padding-bottom: 0.375rem; }
            .py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
            .py-4 { padding-top: 1rem; padding-bottom: 1rem; }
            .px-2\\.5 { padding-left: 0.625rem; padding-right: 0.625rem; }
            .pt-4 { padding-top: 1rem; }

            .mb-1 { margin-bottom: 0.25rem; }
            .mb-3 { margin-bottom: 0.75rem; }
            .mb-4 { margin-bottom: 1rem; }
            .mb-5 { margin-bottom: 1.25rem; }
            .mt-1 { margin-top: 0.25rem; }
            .mx-2 { margin-left: 0.5rem; margin-right: 0.5rem; }

            .gap-1 { gap: 0.25rem; }
            .gap-1\\.5 { gap: 0.375rem; }
            .gap-2 { gap: 0.5rem; }

            .flex { display: flex; }
            .flex-1 { flex: 1 1 0%; }
            .flex-col { flex-direction: column; }
            .items-center { align-items: center; }
            .justify-center { justify-content: center; }
            .justify-between { justify-content: space-between; }

            .w-full { width: 100%; }
            .w-10 { width: 2.5rem; }
            .h-10 { height: 2.5rem; }
            .h-44 { height: 11rem; }
            .h-px { height: 1px; }

            .rounded-full { border-radius: 9999px; }
            .rounded-2xl { border-radius: 1rem; }

            .border-b { border-bottom-width: 1px; border-bottom-style: solid; }
            .border-b-8 { border-bottom-width: 8px; border-bottom-style: solid; }
            .border-t { border-top-width: 1px; border-top-style: solid; }
            .border-gray-100 { border-color: #f3f4f6; }
            .border-gray-200 { border-color: #e5e7eb; }
            .border-white\\/10 { border-color: rgba(255,255,255,0.1); }

            .overflow-hidden { overflow: hidden; }
            .relative { position: relative; }
            .absolute { position: absolute; }
            .top-3 { top: 0.75rem; }
            .left-3 { left: 0.75rem; }
            .bottom-3 { bottom: 0.75rem; }
            .right-3 { right: 0.75rem; }

            .object-cover { object-fit: cover; }
            .object-contain { object-fit: contain; }

            .shadow { box-shadow: 0 1px 3px 0 rgba(0,0,0,0.1); }
            .shadow-lg { box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }

            .backdrop-blur-sm { backdrop-filter: blur(4px); }

            img {
              max-width: 100%;
              height: auto;
            }

            svg {
              width: 1.25rem;
              height: 1.25rem;
              display: inline-block;
              vertical-align: middle;
              stroke: currentColor;
              fill: none;
            }

            .h-5 { height: 1.25rem; }
            .w-5 { width: 1.25rem; }

            @media print {
              body {
                padding: 0;
                background: #ffffff;
              }
              .ticket-container {
                box-shadow: none;
                max-width: 100%;
              }
            }
          </style>
        </head>
        <body>
          <div class="ticket-container">
            ${htmlContent}
          </div>
          <script>
            // Auto-print when loaded
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 500);
            };
          </script>
        </body>
        </html>
      `)

      printWindow.document.close()

      toast({
        title: 'Print Dialog Opened',
        description: 'Select "Save as PDF" in the print dialog to download your quote.',
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

        // Validate file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`File too large: ${file.name}. Max size is 10MB.`)
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-card-accent border-white/20 text-white w-[98vw] !max-w-[98vw] h-[98vh] !max-h-[98vh] p-0 flex flex-col">
        <DialogHeader className="space-y-2 pb-4 border-b border-white/10 px-6 pt-6">
          <DialogTitle className="luxury-heading text-2xl sm:text-3xl tracking-[0.1em] text-white flex items-center gap-3">
            <FileText className="h-6 w-6" />
            Customize Quote PDF
          </DialogTitle>
          <DialogDescription className="text-white/70 text-sm tracking-wide">
            Customize the visual layout and content of your quote PDF before sending
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col flex-1 min-h-0">
          <TabsList className="grid grid-cols-2 bg-white/5 border border-white/10 mx-6 mt-4 w-auto">
            <TabsTrigger value="settings" className="data-[state=active]:bg-white/20 text-white">
              <Settings className="h-4 w-4 mr-2" />
              Edit Content
            </TabsTrigger>
            <TabsTrigger value="preview" className="data-[state=active]:bg-white/20 text-white">
              <Eye className="h-4 w-4 mr-2" />
              Live Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="mt-0 overflow-y-auto flex-1 px-6 py-4">
            <div className="space-y-6">
              {/* Header Section */}
              <div className="space-y-4 p-4 glass-card-accent rounded-xl border border-white/10">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  Header Customization
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white/90 text-sm">Custom Title (optional)</Label>
                    <Input
                      value={headerTitle}
                      onChange={(e) => setHeaderTitle(e.target.value)}
                      placeholder="e.g., Private Jet Charter Proposal"
                      className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/90 text-sm">Subtitle (optional)</Label>
                    <Input
                      value={headerSubtitle}
                      onChange={(e) => setHeaderSubtitle(e.target.value)}
                      placeholder="e.g., Exclusive Rates - Limited Time"
                      className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
                    />
                  </div>
                </div>

                {/* Header Icon Selection */}
                <div className="space-y-2">
                  <Label className="text-white/90 text-sm">Header Icon</Label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: 'plane', label: 'Airplane', icon: Plane },
                      { value: 'car', label: 'Car', icon: Car },
                      { value: 'yacht', label: 'Yacht', icon: Ship },
                      { value: 'none', label: 'No Icon', icon: null },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setHeaderIcon(option.value as 'plane' | 'car' | 'yacht' | 'none')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                          headerIcon === option.value
                            ? 'bg-white text-black border-white'
                            : 'bg-white/5 text-white/70 border-white/20 hover:border-white/40'
                        }`}
                      >
                        {option.icon && <option.icon className="h-4 w-4" />}
                        <span className="text-sm">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Service Items Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Service Options</h3>

                {quote.service_items.map((item, index) => {
                  const override = serviceOverrides[item.id] || {}
                  const isExpanded = override.expanded

                  return (
                    <div
                      key={item.id}
                      className="p-4 glass-card-accent rounded-xl border border-white/10"
                    >
                      {/* Collapsed Header */}
                      <button
                        type="button"
                        onClick={() => toggleServiceExpanded(item.id)}
                        className="w-full flex items-center justify-between text-left"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-white/50 text-sm">Option {index + 1}</span>
                          <span className="text-white font-medium">{override.display_name || item.service_name}</span>
                          <span className="text-white/70">{formatCurrency(item.price)}</span>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-white/50" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-white/50" />
                        )}
                      </button>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <div className="mt-4 space-y-4 pt-4 border-t border-white/10">
                          {/* Display Name */}
                          <div className="space-y-2">
                            <Label className="text-white/90 text-sm">Display Name</Label>
                            <Input
                              value={override.display_name || ''}
                              onChange={(e) => updateServiceOverride(item.id, 'display_name', e.target.value)}
                              placeholder={item.service_name}
                              className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
                            />
                          </div>

                          {/* Description */}
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

                          {/* Image Management Section */}
                          <div className="space-y-3">
                            <Label className="text-white/90 text-sm flex items-center gap-2">
                              <ImageIcon className="h-4 w-4" />
                              PDF Images
                            </Label>

                            {/* Currently Selected Images */}
                            {override.display_images && override.display_images.length > 0 && (
                              <div className="space-y-2">
                                <p className="text-xs text-white/50">Selected for PDF ({override.display_images.length}/2):</p>
                                <div className="flex flex-wrap gap-2">
                                  {override.display_images.map((imageUrl, imgIndex) => (
                                    <div
                                      key={imgIndex}
                                      className="relative w-24 h-24 rounded-lg overflow-hidden border-2 border-white group"
                                    >
                                      <img
                                        src={imageUrl}
                                        alt={`Selected ${imgIndex + 1}`}
                                        className="w-full h-full object-cover"
                                      />
                                      <div className="absolute top-1 left-1 w-5 h-5 bg-white text-black rounded-full flex items-center justify-center text-xs font-bold">
                                        {imgIndex + 1}
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
                                <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
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
                                              title: 'Maximum images reached',
                                              description: 'Remove an image first to add a new one',
                                              variant: 'destructive',
                                            })
                                          }
                                        }}
                                        className="relative aspect-square rounded-lg overflow-hidden border-2 border-white/20 hover:border-white/50 transition-all"
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
                                    Upload New Images
                                  </>
                                )}
                              </Button>
                              {(!override.display_images || override.display_images.length === 0) && (
                                <p className="text-xs text-white/40">No images selected yet</p>
                              )}
                            </div>
                          </div>

                          {/* Custom Details */}
                          <div className="space-y-3">
                            <Label className="text-white/90 text-sm">Trip Details (for ticket-style layout)</Label>

                            {/* Quick Add Buttons */}
                            <div className="flex flex-wrap gap-2">
                              {[
                                { label: 'Date', placeholder: 'Friday, December 26th, 2025' },
                                { label: 'Departure Code', placeholder: 'FXE' },
                                { label: 'Departure', placeholder: 'Fort Lauderdale, FL' },
                                { label: 'Arrival Code', placeholder: 'KASE' },
                                { label: 'Arrival', placeholder: 'Aspen, CO' },
                                { label: 'Duration', placeholder: '3h 34m' },
                                { label: 'Passengers', placeholder: '8' },
                              ].map((quickAdd) => {
                                const exists = override.details?.some(d => d.label === quickAdd.label)
                                if (exists) return null
                                return (
                                  <Button
                                    key={quickAdd.label}
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setServiceOverrides(prev => ({
                                        ...prev,
                                        [item.id]: {
                                          ...prev[item.id],
                                          details: [...(prev[item.id]?.details || []), { label: quickAdd.label, value: '' }],
                                        }
                                      }))
                                    }}
                                    className="text-xs border-white/20 text-white/70 hover:bg-white/10"
                                  >
                                    <Plus className="h-3 w-3 mr-1" />
                                    {quickAdd.label}
                                  </Button>
                                )
                              })}
                              {/* Custom Field Button */}
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setServiceOverrides(prev => ({
                                    ...prev,
                                    [item.id]: {
                                      ...prev[item.id],
                                      details: [...(prev[item.id]?.details || []), { label: '', value: '' }],
                                    }
                                  }))
                                }}
                                className="text-xs border-dashed border-white/30 text-white/70 hover:bg-white/10"
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Custom Field
                              </Button>
                            </div>

                            {override.details && override.details.length > 0 && (
                              <div className="space-y-2">
                                {override.details.map((detail, detailIndex) => {
                                  const isPresetField = ['Date', 'Departure Code', 'Departure', 'Arrival Code', 'Arrival', 'Duration', 'Passengers'].includes(detail.label)

                                  return (
                                    <div key={detailIndex} className="flex items-center gap-2">
                                      {isPresetField ? (
                                        <div className="w-32 text-sm text-white/70">{detail.label}</div>
                                      ) : (
                                        <Input
                                          value={detail.label}
                                          onChange={(e) => updateDetail(item.id, detailIndex, 'label', e.target.value)}
                                          placeholder="Field name..."
                                          className="w-32 bg-white/5 border-white/20 text-white placeholder:text-white/40 text-sm"
                                        />
                                      )}
                                      <Input
                                        value={detail.value}
                                        onChange={(e) => updateDetail(item.id, detailIndex, 'value', e.target.value)}
                                        placeholder={
                                          detail.label === 'Date' ? 'Friday, December 26th, 2025' :
                                          detail.label === 'Departure Code' ? 'FXE' :
                                          detail.label === 'Departure' ? 'Fort Lauderdale, FL' :
                                          detail.label === 'Arrival Code' ? 'KASE' :
                                          detail.label === 'Arrival' ? 'Aspen, CO' :
                                          detail.label === 'Duration' ? '3h 34m' :
                                          detail.label === 'Passengers' ? '8' :
                                          'Enter value...'
                                        }
                                        className="bg-white/5 border-white/20 text-white placeholder:text-white/40 flex-1"
                                      />
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeDetail(item.id, detailIndex)}
                                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  )
                                })}
                              </div>
                            )}

                            {(!override.details || override.details.length === 0) && (
                              <p className="text-white/40 text-sm">Click the buttons above to add trip details for the ticket-style layout.</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Notes Section */}
              <div className="space-y-4 p-4 glass-card-accent rounded-xl border border-white/10">
                <h3 className="text-lg font-semibold text-white">Notes & Terms</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-white/90 text-sm">Custom Notes</Label>
                    <Textarea
                      value={customNotes}
                      onChange={(e) => setCustomNotes(e.target.value)}
                      placeholder="Add any notes for the client..."
                      rows={3}
                      className="bg-white/5 border-white/20 text-white placeholder:text-white/40 resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/90 text-sm">Custom Terms & Conditions (optional)</Label>
                    <Textarea
                      value={customTerms}
                      onChange={(e) => setCustomTerms(e.target.value)}
                      placeholder="Leave empty to use default terms..."
                      rows={3}
                      className="bg-white/5 border-white/20 text-white placeholder:text-white/40 resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="mt-0 flex-1 min-h-0 px-6 py-4">
            <div className="h-full rounded-xl overflow-hidden border border-white/20 bg-white">
              <div ref={previewRef} className="h-full overflow-y-auto p-6" style={{ backgroundColor: '#f8f8f8' }}>
                {/* PDF Preview - Ticket Style */}
                <div className="max-w-[400px] mx-auto bg-white rounded-2xl shadow-lg overflow-hidden" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                  {/* Top Header with Logo - Dark like footer */}
                  <div className="bg-gray-900 px-5 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img
                        src="/logo/CL White LOGO.png"
                        alt="Cadiz & Lluis"
                        className="h-10 w-10 object-contain"
                      />
                      <span className="text-sm font-bold text-white tracking-widest">CADIZ & LLUIS</span>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-white/60 uppercase tracking-wider">{quote.quote_number}</p>
                      <p className="text-[9px] text-white/50">
                        {new Date(quote.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  {/* Title Header - Dark like footer */}
                  <div className="bg-gray-900 p-4 text-center border-t border-white/10">
                    <h1 className="text-xl font-bold text-white flex items-center justify-center gap-2">
                      {headerIcon === 'plane' && <Plane className="h-5 w-5" />}
                      {headerIcon === 'car' && <Car className="h-5 w-5" />}
                      {headerIcon === 'yacht' && <Ship className="h-5 w-5" />}
                      {headerTitle || 'Private Quotes'}
                    </h1>
                    {headerSubtitle && (
                      <p className="text-xs text-white/60 mt-1">{headerSubtitle}</p>
                    )}
                  </div>

                  {/* Client Info */}
                  <div className="bg-white px-5 py-3 border-b border-gray-100">
                    <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-1">Prepared For</p>
                    <p className="text-sm font-semibold text-gray-900">{quote.client_name}</p>
                    <p className="text-xs text-gray-500">{quote.client_email}</p>
                  </div>

                  {/* Service Options - Ticket Style */}
                  {quote.service_items.map((item) => {
                    const override = serviceOverrides[item.id] || {}
                    const displayImages = override.display_images?.slice(0, 2) || item.images?.slice(0, 2) || []
                    const displayName = override.display_name || item.service_name
                    const details = override.details || []

                    // Extract specific details
                    const dateDetail = details.find(d => d.label === 'Date')?.value || ''
                    const departureCode = details.find(d => d.label === 'Departure Code')?.value || 'TBD'
                    const departureDetail = details.find(d => d.label === 'Departure')?.value || ''
                    const arrivalCode = details.find(d => d.label === 'Arrival Code')?.value || 'TBD'
                    const arrivalDetail = details.find(d => d.label === 'Arrival')?.value || ''
                    const duration = details.find(d => d.label === 'Duration')?.value || ''
                    const passengers = details.find(d => d.label === 'Passengers')?.value || ''

                    return (
                      <div key={item.id} className="bg-white border-b-8 border-gray-100">
                        {/* Images Section */}
                        {displayImages.length > 0 && (
                          <div className="relative">
                            {/* Main image */}
                            <div className="relative h-44 overflow-hidden">
                              <img
                                src={displayImages[0]}
                                alt="Main"
                                className="w-full h-full object-cover"
                              />
                              {/* Overlay badge with name */}
                              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
                                <span>→</span> {displayName}
                              </div>
                            </div>

                            {/* Secondary image */}
                            {displayImages[1] && (
                              <div className="relative h-44 overflow-hidden">
                                <img
                                  src={displayImages[1]}
                                  alt="Interior"
                                  className="w-full h-full object-cover"
                                />
                                {/* Passenger count badge */}
                                {passengers && (
                                  <div className="absolute bottom-3 right-3 bg-white/95 text-gray-700 text-xs px-2.5 py-1 rounded-full flex items-center gap-1 shadow">
                                    <span>👤</span> {passengers}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Trip Details - Ticket Style */}
                        <div className="p-5 bg-white">
                          {/* Date */}
                          {dateDetail && (
                            <p className="text-sm text-gray-500 mb-4">{dateDetail}</p>
                          )}

                          {/* Route Section */}
                          <div className="flex items-center justify-between mb-5">
                            {/* From */}
                            <div className="text-left">
                              <p className="text-2xl font-bold text-gray-900">{departureCode}</p>
                              <p className="text-xs text-blue-500">{departureDetail}</p>
                            </div>

                            {/* Duration & Arrow */}
                            <div className="flex-1 px-3">
                              <div className="flex flex-col items-center">
                                <p className="text-xs text-gray-400 mb-1">{duration || '---'}</p>
                                <div className="flex items-center w-full">
                                  <div className="flex-1 h-px bg-gray-200"></div>
                                  <div className="mx-2 text-gray-300">→</div>
                                  <div className="flex-1 h-px bg-gray-200"></div>
                                </div>
                              </div>
                            </div>

                            {/* To */}
                            <div className="text-right">
                              <p className="text-2xl font-bold text-gray-900">{arrivalCode}</p>
                              <p className="text-xs text-blue-500">{arrivalDetail}</p>
                            </div>
                          </div>

                          {/* Price */}
                          <div className="text-right pt-4 border-t border-gray-100">
                            <p className="text-2xl font-bold text-gray-900">
                              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(item.price)}
                            </p>
                            <p className="text-xs text-gray-400">Total</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {/* Footer */}
                  <div className="p-5 bg-gray-900 text-center">
                    <p className="text-sm font-bold text-white tracking-widest mb-1">CADIZ & LLUIS</p>
                    <p className="text-[10px] text-white/60 tracking-wider uppercase mb-3">Luxury Living</p>
                    <p className="text-[10px] text-white/50">
                      Quote valid until {new Date(quote.expiration_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                    <p className="text-[10px] text-white/70 mt-1">
                      brody@cadizlluis.com • www.cadizlluis.com
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-t border-white/10">
          <Button
            type="button"
            variant="ghost"
            onClick={handleReset}
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-white/30 hover:bg-white/10 text-white"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="border-white/30 hover:bg-white/10 text-white"
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
            <Button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="btn-luxury"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Customization
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default QuotePDFBuilderDialog
