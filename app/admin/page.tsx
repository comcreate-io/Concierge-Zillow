"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Home, MapPin, Calendar, ExternalLink, Plus, Pencil, Users, Sparkles } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getProperties, saveProperty, Property as SupabaseProperty } from "@/lib/supabase"
import { PropertyManagerSelect, PropertyManager } from "@/components/property-manager-select"
import { assignPropertyToManagers } from "@/lib/actions/properties"
import { createClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"

interface Property {
  id: string
  address: string
  monthly_rent: string
  bedrooms: string
  bathrooms: string
  area: string
  zillow_url: string
  images: string[]
  scraped_at: string | null
  created_at: string | null
  managers?: PropertyManager[]
}

export default function RealEstateDashboard() {
  const [url, setUrl] = useState("")
  const [isScraping, setIsScraping] = useState(false)
  const [editingProperty, setEditingProperty] = useState<Property | null>(null)
  const [editFormData, setEditFormData] = useState({
    address: "",
    monthly_rent: "",
    bedrooms: "",
    bathrooms: "",
    area: ""
  })
  const [properties, setProperties] = useState<Property[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [propertyManagers, setPropertyManagers] = useState<PropertyManager[]>([])
  const [selectedManagerIds, setSelectedManagerIds] = useState<string[]>([])

  // Fetch properties and property managers on component mount
  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      const supabase = createClient()

      // Load properties
      const data = await getProperties()

      // Load all property managers
      const { data: managers } = await supabase
        .from('property_managers')
        .select('id, name, email')
        .order('name')

      if (managers) {
        setPropertyManagers(managers)
      }

      // Load manager assignments for each property
      const { data: assignments } = await supabase
        .from('property_manager_assignments')
        .select('property_id, manager_id')

      // Map assignments to properties
      const formattedData = data.map((prop: SupabaseProperty) => {
        const propAssignments = assignments?.filter(a => a.property_id === prop.id) || []
        const propManagers = propAssignments
          .map(a => managers?.find(m => m.id === a.manager_id))
          .filter(Boolean) as PropertyManager[]

        return {
          id: prop.id,
          address: prop.address || "Address not available",
          monthly_rent: prop.monthly_rent || "N/A",
          bedrooms: prop.bedrooms || "0",
          bathrooms: prop.bathrooms || "0",
          area: prop.area || "0",
          zillow_url: prop.zillow_url,
          images: Array.isArray(prop.images) ? prop.images : [],
          scraped_at: prop.scraped_at,
          created_at: prop.created_at,
          managers: propManagers
        }
      })
      setProperties(formattedData)

      setIsLoading(false)
    }
    loadData()
  }, [])

  const handleScrape = async () => {
    if (!url.trim()) {
      return
    }

    setIsScraping(true)

    try {
      // Call HasData API to scrape property
      const apiKey = process.env.NEXT_PUBLIC_HASDATA_API_KEY
      const encodedUrl = encodeURIComponent(url.trim())
      const apiUrl = `https://api.hasdata.com/scrape/zillow/property?url=${encodedUrl}`

      console.log('Calling HasData API with URL:', url.trim())

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey || ''
        }
      })

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`)
      }

      const data = await response.json()
      console.log('HasData API response:', JSON.stringify(data, null, 2))

      // Extract property data from API response
      const property = data.property
      if (!property) {
        throw new Error('No property data found in API response')
      }

      // Build full address from address object
      const fullAddress = property.address
        ? `${property.address.street}, ${property.address.city}, ${property.address.state} ${property.address.zipcode}`
        : property.addressRaw || 'Address not available'

      const propertyData = {
        zillow_url: property.url || url.trim(),
        address: fullAddress,
        monthly_rent: property.price?.toString() || null,
        bedrooms: property.beds?.toString() || null,
        bathrooms: property.baths?.toString() || null,
        area: property.area?.toString() || null,
        images: property.photos || []
      }

      console.log('Extracted property data:', propertyData)

      // Save to Supabase
      const savedProperty = await saveProperty(propertyData)

      // Assign to selected property managers
      if (savedProperty && savedProperty.id && selectedManagerIds.length > 0) {
        await assignPropertyToManagers(savedProperty.id, selectedManagerIds)
      }

      setUrl("")
      setSelectedManagerIds([])
      alert(`Property scraped and saved successfully!${selectedManagerIds.length > 0 ? ` Assigned to ${selectedManagerIds.length} manager(s).` : ''}`)

      // Reload properties from database with assignments
      const supabase = createClient()
      const refreshedData = await getProperties()

      const { data: assignments } = await supabase
        .from('property_manager_assignments')
        .select('property_id, manager_id')

      const formattedData = refreshedData.map((prop: SupabaseProperty) => {
        const propAssignments = assignments?.filter(a => a.property_id === prop.id) || []
        const propManagers = propAssignments
          .map(a => propertyManagers?.find(m => m.id === a.manager_id))
          .filter(Boolean) as PropertyManager[]

        return {
          id: prop.id,
          address: prop.address || "Address not available",
          monthly_rent: prop.monthly_rent || "N/A",
          bedrooms: prop.bedrooms || "0",
          bathrooms: prop.bathrooms || "0",
          area: prop.area || "0",
          zillow_url: prop.zillow_url,
          images: Array.isArray(prop.images) ? prop.images : [],
          scraped_at: prop.scraped_at,
          created_at: prop.created_at,
          managers: propManagers
        }
      })
      setProperties(formattedData)
    } catch (error) {
      console.error('Error scraping property:', error)
      alert(`Failed to scrape property: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsScraping(false)
    }
  }

  const handleEdit = (property: Property) => {
    setEditingProperty(property)
    setEditFormData({
      address: property.address,
      monthly_rent: property.monthly_rent,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      area: property.area
    })
  }

  const handleSaveEdit = () => {
    if (!editingProperty) return

    const updatedProperty: Property = {
      ...editingProperty,
      address: editFormData.address,
      monthly_rent: editFormData.monthly_rent,
      bedrooms: editFormData.bedrooms,
      bathrooms: editFormData.bathrooms,
      area: editFormData.area
    }

    setProperties(prev => prev.map(p => p.id === editingProperty.id ? updatedProperty : p))
    setEditingProperty(null)
    setEditFormData({
      address: "",
      monthly_rent: "",
      bedrooms: "",
      bathrooms: "",
      area: ""
    })
  }

  const handleCancelEdit = () => {
    setEditingProperty(null)
    setEditFormData({
      address: "",
      monthly_rent: "",
      bedrooms: "",
      bathrooms: "",
      area: ""
    })
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="luxury-heading text-4xl font-bold tracking-[0.15em] mb-2">Property Management</h1>
          <p className="text-white/70 mt-2 tracking-wide text-base">Add new properties from Zillow and manage your portfolio</p>
        </div>
        <Badge variant="outline" className="text-base px-5 py-2 bg-white/10 border-white/30 backdrop-blur-sm shadow-lg">
          {properties.length} {properties.length === 1 ? 'Property' : 'Properties'}
        </Badge>
      </div>

      <Tabs defaultValue="scrape" className="space-y-8">
        <TabsList className="grid w-full grid-cols-2 h-12 glass-card p-1">
          <TabsTrigger value="scrape" className="uppercase tracking-wider font-semibold data-[state=active]:bg-white/20">
            Add New Property
          </TabsTrigger>
          <TabsTrigger value="properties" className="uppercase tracking-wider font-semibold data-[state=active]:bg-white/20">
            All Properties
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scrape" className="space-y-8">
          <Card className="glass-card premium-card">
            <CardHeader className="pb-6">
              <div className="flex items-center gap-4 mb-2">
                <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
                  <Sparkles className="h-7 w-7 text-white" />
                </div>
                <div>
                  <CardTitle className="luxury-heading text-3xl tracking-[0.15em]">Add New Property</CardTitle>
                  <CardDescription className="mt-2 text-white/70 tracking-wide text-base">
                    Scrape property details from Zillow and assign to managers
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-7">
                <div className="space-y-4">
                  <label className="text-sm font-bold flex items-center gap-2 uppercase tracking-wider text-white/90">
                    <Home className="h-5 w-5" />
                    Zillow Property URL
                  </label>
                  <Input
                    placeholder="https://www.zillow.com/homedetails/..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="h-12 bg-white/5 border-white/20 focus:border-white/40 text-base tracking-wide"
                  />
                  <p className="text-xs text-white/60 flex items-start gap-2 tracking-wide">
                    <span className="text-white/80">•</span>
                    Paste a Zillow property URL to automatically fetch all property details
                  </p>
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-bold flex items-center gap-2 uppercase tracking-wider text-white/90">
                    <Users className="h-5 w-5" />
                    Assign to Property Managers
                    <Badge variant="secondary" className="ml-2 bg-white/10 text-white/90 border-white/20">Optional</Badge>
                  </label>
                  <PropertyManagerSelect
                    managers={propertyManagers}
                    selectedManagerIds={selectedManagerIds}
                    onSelectionChange={setSelectedManagerIds}
                  />
                  <p className="text-xs text-white/60 flex items-start gap-2 tracking-wide">
                    <span className="text-white/80">•</span>
                    Select one or more property managers to assign this property to
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-center pt-8 border-t border-white/10">
                {isScraping && (
                  <div className="flex items-center gap-3 text-white/70">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span className="text-sm tracking-wide">Processing property data...</span>
                  </div>
                )}
                {!isScraping && <div />}
                <Button
                  onClick={handleScrape}
                  disabled={!url.trim() || isScraping}
                  size="lg"
                  className="min-w-[180px] premium-button bg-white text-black hover:bg-white/95 font-bold tracking-wider uppercase"
                >
                  {isScraping ? "Processing..." : (
                    <>
                      <Plus className="h-5 w-5 mr-2" />
                      Add Property
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="properties" className="space-y-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div>
              <span className="ml-4 tracking-wide text-lg">Loading properties...</span>
            </div>
          ) : properties.length === 0 ? (
            <Card className="glass-card p-12 text-center">
              <Home className="h-20 w-20 text-white/40 mx-auto mb-6" />
              <h3 className="luxury-heading text-2xl font-semibold mb-3 tracking-[0.15em]">No Properties Yet</h3>
              <p className="text-white/70 tracking-wide text-lg">Add your first property by entering a Zillow URL above</p>
            </Card>
          ) : (
            <div className="grid gap-8">
              {properties.map((property) => {
                const firstImage = property.images.length > 0 ? property.images[0] : null
                return (
                  <Card key={property.id} className="overflow-hidden glass-card premium-card">
                    <div className="flex flex-col sm:flex-row">
                      <div className="w-full sm:w-64 h-48 bg-background/30 flex items-center justify-center relative premium-image">
                        {firstImage ? (
                          <img
                            src={firstImage}
                            alt={property.address}
                            className="absolute inset-0 w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                              const fallback = e.currentTarget.nextElementSibling as HTMLElement
                              fallback?.classList.remove('hidden')
                            }}
                          />
                        ) : null}
                        <div className={`${firstImage ? 'hidden' : ''}`}>
                          <Home className="h-12 w-12 text-muted-foreground" />
                        </div>
                      </div>
                      <div className="flex-1 p-7">
                        <div className="flex justify-between items-start gap-4 mb-5">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold mb-3 tracking-wide">
                              {property.address}
                            </h3>
                            <div className="flex items-start gap-2 text-white/70 text-sm">
                              <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                              <span className="tracking-wide">{property.address}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-3xl font-bold tracking-wide">
                              ${parseFloat(property.monthly_rent.replace(/[^0-9.-]+/g, '')).toLocaleString('en-US')}
                            </div>
                            <div className="text-sm text-white/70 uppercase tracking-wider mt-1">
                              Monthly Rent
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-5">
                          <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10 backdrop-blur-sm">
                            <div className="text-2xl font-bold">{property.bedrooms || '0'}</div>
                            <div className="text-xs text-white/70 uppercase tracking-widest mt-1">Bedrooms</div>
                          </div>
                          <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10 backdrop-blur-sm">
                            <div className="text-2xl font-bold">{property.bathrooms || '0'}</div>
                            <div className="text-xs text-white/70 uppercase tracking-widest mt-1">Bathrooms</div>
                          </div>
                          <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10 backdrop-blur-sm">
                            <div className="text-2xl font-bold">{parseFloat(property.area.replace(/[^0-9.-]+/g, '')).toLocaleString('en-US')}</div>
                            <div className="text-xs text-white/70 uppercase tracking-widest mt-1">Sq Ft</div>
                          </div>
                        </div>

                        {/* Property Managers */}
                        {property.managers && property.managers.length > 0 && (
                          <div className="flex items-center gap-3 flex-wrap pt-5 border-t border-white/10">
                            <Users className="h-5 w-5 text-white/60 flex-shrink-0" />
                            <span className="text-sm font-semibold text-white/80 uppercase tracking-wider">Managers:</span>
                            {property.managers.map((manager) => (
                              <Badge key={manager.id} variant="secondary" className="bg-white/10 text-white border-white/20">
                                {manager.name}
                              </Badge>
                            ))}
                          </div>
                        )}

                        <div className="flex justify-between items-center pt-5 border-t border-white/10">
                          <div className="flex items-center gap-2 text-sm text-white/70">
                            <Calendar className="h-4 w-4" />
                            <span className="tracking-wide">Scraped: {property.scraped_at ? new Date(property.scraped_at).toLocaleDateString() : 'N/A'}</span>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(property)}
                              className="border-white/30 hover:bg-white/10 hover:border-white/50"
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                            <Button variant="outline" size="sm" asChild className="border-white/30 hover:bg-white/10 hover:border-white/50">
                              <a href={`/property/${property.id}`}>
                                <ExternalLink className="h-4 w-4 mr-2" />
                                View Listing
                              </a>
                            </Button>
                            <Button variant="outline" size="sm" asChild className="border-white/30 hover:bg-white/10 hover:border-white/50">
                              <a href={property.zillow_url} target="_blank" rel="noopener noreferrer">
                                Zillow Source
                              </a>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Property Dialog */}
      <Dialog open={!!editingProperty} onOpenChange={(open) => !open && handleCancelEdit()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Property</DialogTitle>
            <DialogDescription>
              Update property information
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Address
                </label>
                <Input
                  value={editFormData.address}
                  onChange={(e) => setEditFormData({...editFormData, address: e.target.value})}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Monthly Rent</label>
                <Input
                  value={editFormData.monthly_rent}
                  onChange={(e) => setEditFormData({...editFormData, monthly_rent: e.target.value})}
                  placeholder="e.g., 2,500"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Bedrooms</label>
                  <Input
                    value={editFormData.bedrooms}
                    onChange={(e) => setEditFormData({...editFormData, bedrooms: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Bathrooms</label>
                  <Input
                    value={editFormData.bathrooms}
                    onChange={(e) => setEditFormData({...editFormData, bathrooms: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Area</label>
                  <Input
                    value={editFormData.area}
                    onChange={(e) => setEditFormData({...editFormData, area: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancelEdit}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
