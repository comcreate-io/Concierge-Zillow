"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Home, Sparkles, ArrowLeft, CheckCircle2, Edit3, Link2, DollarSign, Loader2 } from "lucide-react"
import { ImageDropZone } from "@/components/image-drop-zone"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { saveProperty } from "@/lib/supabase"
import { assignPropertyToManagers } from "@/lib/actions/properties"
import { getCurrentManagerProfile } from "@/lib/actions/clients"
import { findOrCreateAgent, linkPropertyToAgent } from "@/lib/agents"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

export default function AddPropertyPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [inputMode, setInputMode] = useState<"scrape" | "manual">("scrape")
  const [url, setUrl] = useState("")
  const [isScraping, setIsScraping] = useState(false)
  const [currentManagerId, setCurrentManagerId] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false)

  const generateAIDescription = async (propertyId: string, propertyData: {
    address?: string
    bedrooms?: string
    bathrooms?: string
    area?: string
  }) => {
    try {
      setIsGeneratingDescription(true)
      const response = await fetch('/api/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          address: propertyData.address,
          bedrooms: propertyData.bedrooms,
          bathrooms: propertyData.bathrooms,
          area: propertyData.area,
        }),
      })

      if (!response.ok) {
        return false
      }

      return true
    } catch (error) {
      console.warn('Error generating AI description:', error)
      return false
    } finally {
      setIsGeneratingDescription(false)
    }
  }

  const [manualData, setManualData] = useState({
    address: "",
    bedrooms: "",
    bathrooms: "",
    area: "",
    zillow_url: "",
    images: [] as string[],
    description: ""
  })

  const [pricingOptions, setPricingOptions] = useState({
    show_monthly_rent: false,
    custom_monthly_rent: "",
    show_nightly_rate: false,
    custom_nightly_rate: "",
    show_purchase_price: false,
    custom_purchase_price: ""
  })

  useEffect(() => {
    async function loadCurrentManager() {
      const { data: managerProfile } = await getCurrentManagerProfile()
      if (managerProfile) {
        setCurrentManagerId(managerProfile.id)
      }
    }
    loadCurrentManager()
  }, [])

  const handleManualSave = async () => {
    if (!manualData.address.trim()) {
      toast({
        title: "Address Required",
        description: "Please enter at least the property address",
        variant: "destructive",
      })
      return
    }

    setIsScraping(true)
    setSuccess(false)

    try {
      const newProperty = {
        address: manualData.address,
        bedrooms: manualData.bedrooms || "",
        bathrooms: manualData.bathrooms || "",
        area: manualData.area || "",
        zillow_url: manualData.zillow_url || "",
        images: manualData.images,
        description: manualData.description || undefined,
        show_monthly_rent: pricingOptions.show_monthly_rent,
        custom_monthly_rent: pricingOptions.custom_monthly_rent ? Number(pricingOptions.custom_monthly_rent) : null,
        show_nightly_rate: pricingOptions.show_nightly_rate,
        custom_nightly_rate: pricingOptions.custom_nightly_rate ? Number(pricingOptions.custom_nightly_rate) : null,
        show_purchase_price: pricingOptions.show_purchase_price,
        custom_purchase_price: pricingOptions.custom_purchase_price ? Number(pricingOptions.custom_purchase_price) : null,
      }

      const savedProperty = await saveProperty(newProperty)

      if (currentManagerId && savedProperty.id) {
        await assignPropertyToManagers(savedProperty.id, [currentManagerId])
      }

      if (!manualData.description && savedProperty.id) {
        await generateAIDescription(savedProperty.id, {
          address: manualData.address,
          bedrooms: manualData.bedrooms,
          bathrooms: manualData.bathrooms,
          area: manualData.area,
        })
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/admin/properties')
      }, 2000)
    } catch (error) {
      console.error('Error saving property:', error)
      toast({
        title: "Failed to Save Property",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive",
      })
    } finally {
      setIsScraping(false)
    }
  }

  const handleScrape = async () => {
    if (!url.trim()) return

    setIsScraping(true)
    setSuccess(false)

    try {
      // Check if URL is a building/complex page (not supported by API)
      const urlLower = url.toLowerCase()
      const isBuildingUrl = urlLower.includes('/apartments/') ||
                           urlLower.includes('/b/') ||
                           (urlLower.includes('zillow.com') && !urlLower.includes('_zpid'))

      if (isBuildingUrl) {
        setIsScraping(false)
        toast({
          title: 'Building URL Detected',
          description: 'This appears to be an apartment building page. The API only supports individual property URLs (ending in _zpid). Please switch to Manual mode or find a specific unit listing.',
          variant: 'destructive',
        })
        return
      }

      const apiKey = process.env.NEXT_PUBLIC_HASDATA_API_KEY
      if (!apiKey) {
        throw new Error('HasData API key is not configured')
      }

      const response = await fetch('https://api.hasdata.com/scrape/zillow/property', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify({
          url: url.trim(),
          scrape_description: true
        })
      })

      if (!response.ok) {
        let errorMessage = 'Unknown error occurred'
        if (response.status === 400) {
          errorMessage = 'Invalid Zillow URL or property not found'
        } else if (response.status === 401 || response.status === 403) {
          errorMessage = 'API authentication failed'
        } else if (response.status === 429) {
          errorMessage = 'Rate limit exceeded. Please wait and try again.'
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      const propertyData = data.property || data

      let address = propertyData.addressRaw || ""
      if (!address && typeof propertyData.address === 'object' && propertyData.address) {
        const addr = propertyData.address
        address = [addr.street, addr.city, `${addr.state} ${addr.zipcode}`].filter(Boolean).join(', ')
      }
      if (!address) address = "Address not available"

      const hasListings = Array.isArray(propertyData.listings) && propertyData.listings.length > 0
      const hasFloorPlans = Array.isArray(propertyData.floorPlans) && propertyData.floorPlans.length > 0
      const isMultiUnit = hasListings || hasFloorPlans
      const unitData = hasListings ? propertyData.listings : (hasFloorPlans ? propertyData.floorPlans : [])

      let rent = "", bedrooms = "", bathrooms = "", area = ""

      if (isMultiUnit && unitData.length > 0) {
        const beds = unitData.map((l: any) => l.bedrooms || l.beds).filter(Boolean).map(Number).filter((n: number) => !isNaN(n))
        const baths = unitData.map((l: any) => l.bathrooms || l.baths).filter(Boolean).map(Number).filter((n: number) => !isNaN(n))
        const areas = unitData.map((l: any) => l.livingArea || l.area).filter(Boolean).map(Number).filter((n: number) => !isNaN(n))

        if (beds.length) bedrooms = Math.min(...beds) === Math.max(...beds) ? beds[0].toString() : `${Math.min(...beds)}-${Math.max(...beds)}`
        if (baths.length) bathrooms = Math.min(...baths) === Math.max(...baths) ? baths[0].toString() : `${Math.min(...baths)}-${Math.max(...baths)}`
        if (areas.length) area = Math.min(...areas) === Math.max(...areas) ? areas[0].toString() : `${Math.min(...areas)}-${Math.max(...areas)}`
      } else {
        bedrooms = (propertyData.bedrooms || propertyData.beds || "").toString()
        bathrooms = (propertyData.bathrooms || propertyData.baths || "").toString()
        area = (propertyData.livingArea || propertyData.area || "").toString()
      }

      const agentName = propertyData.agentName || null
      const agentPhone = propertyData.agentPhoneNumber || null
      const agentEmail = Array.isArray(propertyData.agentEmails) && propertyData.agentEmails.length > 0 ? propertyData.agentEmails[0] : null
      const brokerName = propertyData.brokerName || null

      let zillowImageUrls: string[] = []
      const rawPhotos = propertyData.photos || propertyData.images || []
      if (rawPhotos.length > 0) {
        zillowImageUrls = typeof rawPhotos[0] === 'string' ? rawPhotos : rawPhotos.map((p: any) => p.url || p.href || p.src).filter(Boolean)
      }
      if (propertyData.image && !zillowImageUrls.includes(propertyData.image)) {
        zillowImageUrls.unshift(propertyData.image)
      }

      let cloudinaryImageUrls: string[] = []
      if (zillowImageUrls.length > 0) {
        try {
          const uploadResponse = await fetch('/api/upload-images', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageUrls: zillowImageUrls, propertyAddress: address }),
          })
          if (uploadResponse.ok) {
            const uploadData = await uploadResponse.json()
            cloudinaryImageUrls = uploadData.urls || zillowImageUrls
          } else {
            cloudinaryImageUrls = zillowImageUrls
          }
        } catch {
          cloudinaryImageUrls = zillowImageUrls
        }
      }

      const newProperty = {
        address,
        bedrooms,
        bathrooms,
        area,
        zillow_url: url.trim(),
        images: cloudinaryImageUrls,
        description: propertyData.description || null,
        show_monthly_rent: pricingOptions.show_monthly_rent,
        custom_monthly_rent: pricingOptions.custom_monthly_rent ? Number(pricingOptions.custom_monthly_rent) : null,
        show_nightly_rate: pricingOptions.show_nightly_rate,
        custom_nightly_rate: pricingOptions.custom_nightly_rate ? Number(pricingOptions.custom_nightly_rate) : null,
        show_purchase_price: pricingOptions.show_purchase_price,
        custom_purchase_price: pricingOptions.custom_purchase_price ? Number(pricingOptions.custom_purchase_price) : null,
        agent_name: agentName,
        agent_phone: agentPhone,
        agent_email: agentEmail,
        broker_name: brokerName,
      }

      const savedProperty = await saveProperty(newProperty)

      if (savedProperty.id && agentName && agentPhone) {
        try {
          const agentId = await findOrCreateAgent({ name: agentName, phone: agentPhone, email: agentEmail, broker_name: brokerName })
          if (agentId) await linkPropertyToAgent(savedProperty.id, agentId)
        } catch {}
      }

      if (currentManagerId && savedProperty.id) {
        await assignPropertyToManagers(savedProperty.id, [currentManagerId])
      }

      if (savedProperty.id) {
        await generateAIDescription(savedProperty.id, { address, bedrooms, bathrooms, area })
      }

      setSuccess(true)
      setUrl("")
      setTimeout(() => router.push('/admin/properties'), 2000)
    } catch (error) {
      console.error('Error scraping property:', error)
      toast({
        title: "Failed to Scrape Property",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive",
      })
    } finally {
      setIsScraping(false)
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in pb-24 sm:pb-8">
      {/* Header - Mobile Optimized */}
      <div>
        <Link href="/admin/properties">
          <Button variant="ghost" size="sm" className="mb-3 sm:mb-6 text-white hover:bg-white/10 -ml-2 sm:-ml-4">
            <ArrowLeft className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="text-sm">Back</span>
          </Button>
        </Link>

        <div className="flex items-center gap-3 sm:gap-4">
          <div className="p-2.5 sm:p-4 bg-white/10 rounded-xl sm:rounded-2xl border border-white/30">
            <Sparkles className="h-5 w-5 sm:h-8 sm:w-8 text-white" />
          </div>
          <div>
            <h1 className="luxury-heading text-xl sm:text-3xl md:text-4xl font-bold tracking-[0.1em] sm:tracking-[0.15em] text-white">
              Add Property
            </h1>
            <p className="text-white/70 text-xs sm:text-base mt-0.5 sm:mt-1">
              Scrape from Zillow or enter manually
            </p>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <Card className="glass-card-accent border-white/50">
          <CardContent className="p-4 sm:pt-6">
            <div className="flex items-center gap-3 text-white">
              <CheckCircle2 className="h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0" />
              <div>
                <h3 className="text-base sm:text-xl font-bold">Property Added!</h3>
                <p className="text-white/70 text-sm">Redirecting...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mode Toggle - Prominent on Mobile */}
      <div className="flex gap-2">
        <Button
          variant={inputMode === "scrape" ? "default" : "outline"}
          onClick={() => setInputMode("scrape")}
          className={`flex-1 h-12 ${inputMode === "scrape" ? "btn-luxury" : "border-white/40 hover:bg-white/10 text-white"}`}
          disabled={isScraping}
        >
          <Link2 className="h-4 w-4 mr-2" />
          Scrape Zillow
        </Button>
        <Button
          variant={inputMode === "manual" ? "default" : "outline"}
          onClick={() => setInputMode("manual")}
          className={`flex-1 h-12 ${inputMode === "manual" ? "btn-luxury" : "border-white/40 hover:bg-white/10 text-white"}`}
          disabled={isScraping}
        >
          <Edit3 className="h-4 w-4 mr-2" />
          Manual
        </Button>
      </div>

      {/* Main Form */}
      <Card className="glass-card-accent">
        <CardContent className="p-4 sm:p-6 space-y-5 sm:space-y-6">
          {inputMode === "scrape" ? (
            <div className="space-y-3">
              <label className="text-sm font-semibold text-white flex items-center gap-2">
                <Home className="h-4 w-4" />
                Zillow URL
              </label>
              <Input
                placeholder="https://www.zillow.com/homedetails/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="h-12 bg-white/5 border-white/30 focus:border-white text-sm sm:text-base"
                disabled={isScraping}
              />
              <p className="text-xs text-white/60">
                Paste a Zillow property URL to automatically fetch all details
              </p>
            </div>
          ) : (
            <>
              {/* Address */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-white">
                  Address <span className="text-red-400">*</span>
                </label>
                <Input
                  placeholder="123 Main St, Miami, FL"
                  value={manualData.address}
                  onChange={(e) => setManualData({...manualData, address: e.target.value})}
                  className="h-12 bg-white/5 border-white/30 focus:border-white"
                  disabled={isScraping}
                />
              </div>

              {/* Beds, Baths, SqFt - Stack on mobile */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-semibold text-white">Beds</label>
                  <Input
                    placeholder="3"
                    value={manualData.bedrooms}
                    onChange={(e) => setManualData({...manualData, bedrooms: e.target.value})}
                    className="h-11 sm:h-12 bg-white/5 border-white/30 focus:border-white text-center"
                    disabled={isScraping}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-semibold text-white">Baths</label>
                  <Input
                    placeholder="2"
                    value={manualData.bathrooms}
                    onChange={(e) => setManualData({...manualData, bathrooms: e.target.value})}
                    className="h-11 sm:h-12 bg-white/5 border-white/30 focus:border-white text-center"
                    disabled={isScraping}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-semibold text-white">Sq Ft</label>
                  <Input
                    placeholder="1500"
                    value={manualData.area}
                    onChange={(e) => setManualData({...manualData, area: e.target.value})}
                    className="h-11 sm:h-12 bg-white/5 border-white/30 focus:border-white text-center"
                    disabled={isScraping}
                  />
                </div>
              </div>

              {/* Zillow URL (optional) */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-white/70">Zillow URL (optional)</label>
                <Input
                  placeholder="https://www.zillow.com/..."
                  value={manualData.zillow_url}
                  onChange={(e) => setManualData({...manualData, zillow_url: e.target.value})}
                  className="h-11 sm:h-12 bg-white/5 border-white/30 focus:border-white text-sm"
                  disabled={isScraping}
                />
              </div>

              {/* Images */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-white/70">Images (optional)</label>
                <ImageDropZone
                  images={manualData.images}
                  onImagesChange={(images) => setManualData({...manualData, images})}
                  disabled={isScraping}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-white/70">Description (optional)</label>
                <Textarea
                  placeholder="Property description..."
                  value={manualData.description}
                  onChange={(e) => setManualData({...manualData, description: e.target.value})}
                  className="min-h-[100px] bg-white/5 border-white/30 focus:border-white text-sm resize-none"
                  disabled={isScraping}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Pricing Options - Collapsible on Mobile */}
      <Card className="glass-card-accent">
        <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
          <CardTitle className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
            <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />
            Pricing Options
            <Badge variant="secondary" className="ml-2 bg-white/10 text-white/70 text-xs">Optional</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
          {/* Monthly Rent */}
          <div className="flex items-start gap-3">
            <Checkbox
              id="show_monthly_rent"
              checked={pricingOptions.show_monthly_rent}
              onCheckedChange={(checked) => setPricingOptions(prev => ({ ...prev, show_monthly_rent: !!checked }))}
              className="mt-1 border-white/30 data-[state=checked]:bg-white data-[state=checked]:text-black"
            />
            <div className="flex-1 space-y-2">
              <Label htmlFor="show_monthly_rent" className="text-sm text-white cursor-pointer">Monthly Rent</Label>
              <Input
                type="number"
                placeholder="50000"
                value={pricingOptions.custom_monthly_rent}
                onChange={(e) => setPricingOptions(prev => ({ ...prev, custom_monthly_rent: e.target.value }))}
                className={`h-10 bg-white/5 border-white/30 text-sm ${!pricingOptions.show_monthly_rent ? 'opacity-40' : ''}`}
                disabled={isScraping || !pricingOptions.show_monthly_rent}
              />
            </div>
          </div>

          {/* Nightly Rate */}
          <div className="flex items-start gap-3">
            <Checkbox
              id="show_nightly_rate"
              checked={pricingOptions.show_nightly_rate}
              onCheckedChange={(checked) => setPricingOptions(prev => ({ ...prev, show_nightly_rate: !!checked }))}
              className="mt-1 border-white/30 data-[state=checked]:bg-white data-[state=checked]:text-black"
            />
            <div className="flex-1 space-y-2">
              <Label htmlFor="show_nightly_rate" className="text-sm text-white cursor-pointer">Nightly Rate</Label>
              <Input
                type="number"
                placeholder="1750"
                value={pricingOptions.custom_nightly_rate}
                onChange={(e) => setPricingOptions(prev => ({ ...prev, custom_nightly_rate: e.target.value }))}
                className={`h-10 bg-white/5 border-white/30 text-sm ${!pricingOptions.show_nightly_rate ? 'opacity-40' : ''}`}
                disabled={isScraping || !pricingOptions.show_nightly_rate}
              />
            </div>
          </div>

          {/* Purchase Price */}
          <div className="flex items-start gap-3">
            <Checkbox
              id="show_purchase_price"
              checked={pricingOptions.show_purchase_price}
              onCheckedChange={(checked) => setPricingOptions(prev => ({ ...prev, show_purchase_price: !!checked }))}
              className="mt-1 border-white/30 data-[state=checked]:bg-white data-[state=checked]:text-black"
            />
            <div className="flex-1 space-y-2">
              <Label htmlFor="show_purchase_price" className="text-sm text-white cursor-pointer">Purchase Price</Label>
              <Input
                type="number"
                placeholder="10000000"
                value={pricingOptions.custom_purchase_price}
                onChange={(e) => setPricingOptions(prev => ({ ...prev, custom_purchase_price: e.target.value }))}
                className={`h-10 bg-white/5 border-white/30 text-sm ${!pricingOptions.show_purchase_price ? 'opacity-40' : ''}`}
                disabled={isScraping || !pricingOptions.show_purchase_price}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Desktop Submit Button */}
      <div className="hidden sm:block">
        <Button
          onClick={inputMode === "scrape" ? handleScrape : handleManualSave}
          disabled={
            inputMode === "scrape"
              ? !url.trim() || isScraping || success
              : !manualData.address.trim() || isScraping || success
          }
          size="lg"
          className="btn-luxury w-full py-6 text-base"
        >
          {isScraping ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              {isGeneratingDescription ? "Generating description..." : "Processing..."}
            </>
          ) : success ? (
            <>
              <CheckCircle2 className="h-5 w-5 mr-2" />
              Added Successfully
            </>
          ) : (
            <>
              <Home className="h-5 w-5 mr-2" />
              Add Property
            </>
          )}
        </Button>
      </div>

      {/* Mobile Sticky Submit Button */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 p-4 bg-black/95 backdrop-blur-lg border-t border-white/10 z-50">
        <Button
          onClick={inputMode === "scrape" ? handleScrape : handleManualSave}
          disabled={
            inputMode === "scrape"
              ? !url.trim() || isScraping || success
              : !manualData.address.trim() || isScraping || success
          }
          className="btn-luxury w-full h-12"
        >
          {isScraping ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {isGeneratingDescription ? "Generating..." : "Processing..."}
            </>
          ) : success ? (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Added!
            </>
          ) : (
            <>
              <Home className="h-4 w-4 mr-2" />
              Add Property
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
