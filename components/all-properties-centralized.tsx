'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import {
  assignPropertyToClient,
  bulkAssignPropertiesToClient,
  ClientPricingOptions,
  ClientWithDetails,
} from '@/lib/actions/clients'
import {
  Search,
  Home,
  Plus,
  Loader2,
  Users,
  Building2,
  CheckSquare,
  Square,
  UserPlus,
  X,
} from 'lucide-react'
import { formatCurrency, formatNumber } from '@/lib/utils'

type Property = {
  id: string
  address?: string | null
  bedrooms?: string | null
  bathrooms?: string | null
  area?: string | null
  images?: string[] | null
  scraped_for_client_id?: string | null
  show_monthly_rent?: boolean
  custom_monthly_rent?: number | null
  show_nightly_rate?: boolean
  custom_nightly_rate?: number | null
  show_purchase_price?: boolean
  custom_purchase_price?: number | null
}

type Assignment = {
  client_id: string
  property_id: string
  show_monthly_rent_to_client?: boolean
  show_nightly_rate_to_client?: boolean
  show_purchase_price_to_client?: boolean
}

export function AllPropertiesCentralized({
  properties,
  clients,
  assignments,
}: {
  properties: Property[]
  clients: ClientWithDetails[]
  assignments: Assignment[]
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedClient, setSelectedClient] = useState<string | null>(null)
  const [selectedProperties, setSelectedProperties] = useState<Set<string>>(new Set())
  const [isBulkMode, setIsBulkMode] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [propertyForModal, setPropertyForModal] = useState<Property | null>(null)
  const [pendingPricing, setPendingPricing] = useState<ClientPricingOptions>({
    show_monthly_rent_to_client: true,
    show_nightly_rate_to_client: true,
    show_purchase_price_to_client: true,
  })

  // Build a map of property assignments per client
  const assignmentsByProperty = useMemo(() => {
    const map = new Map<string, Set<string>>()
    assignments.forEach((a) => {
      if (!map.has(a.property_id)) {
        map.set(a.property_id, new Set())
      }
      map.get(a.property_id)!.add(a.client_id)
    })
    return map
  }, [assignments])

  // Filter properties based on search (exclude client-specific scraped properties)
  const filteredProperties = useMemo(() => {
    // First, filter out properties scraped for specific clients
    let filtered = properties.filter((p) => !p.scraped_for_client_id)

    if (!searchQuery) return filtered
    const query = searchQuery.toLowerCase()
    return filtered.filter((p) =>
      p.address?.toLowerCase().includes(query) ||
      p.bedrooms?.toString().includes(query) ||
      p.bathrooms?.toString().includes(query)
    )
  }, [properties, searchQuery])

  // Get available properties for selected client (not already assigned)
  const availableForClient = useMemo(() => {
    if (!selectedClient) return filteredProperties
    return filteredProperties.filter((p) => {
      const assignedClients = assignmentsByProperty.get(p.id)
      return !assignedClients || !assignedClients.has(selectedClient)
    })
  }, [filteredProperties, selectedClient, assignmentsByProperty])

  // Get client name by ID
  const getClientName = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId)
    return client?.name || 'Unknown'
  }

  // Toggle bulk mode
  const toggleBulkMode = () => {
    setIsBulkMode(!isBulkMode)
    setSelectedProperties(new Set())
  }

  // Toggle property selection
  const togglePropertySelection = (propertyId: string) => {
    const newSelected = new Set(selectedProperties)
    if (newSelected.has(propertyId)) {
      newSelected.delete(propertyId)
    } else {
      newSelected.add(propertyId)
    }
    setSelectedProperties(newSelected)
  }

  // Select all visible properties
  const selectAll = () => {
    setSelectedProperties(new Set(availableForClient.map((p) => p.id)))
  }

  // Deselect all
  const deselectAll = () => {
    setSelectedProperties(new Set())
  }

  // Handle single property assignment
  const handleStartAssign = (property: Property) => {
    if (!selectedClient) {
      toast({
        title: 'Select a client',
        description: 'Please select a client first to assign properties',
        variant: 'destructive',
      })
      return
    }
    setPendingPricing({
      show_monthly_rent_to_client: !!(property.show_monthly_rent && property.custom_monthly_rent),
      show_nightly_rate_to_client: !!(property.show_nightly_rate && property.custom_nightly_rate),
      show_purchase_price_to_client: !!(property.show_purchase_price && property.custom_purchase_price),
    })
    setPropertyForModal(property)
    setShowAssignModal(true)
  }

  // Confirm single assignment
  const handleConfirmAssign = async () => {
    if (!selectedClient || !propertyForModal) return

    setIsAssigning(true)
    const result = await assignPropertyToClient(selectedClient, propertyForModal.id, pendingPricing)

    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' })
    } else {
      toast({
        title: 'Success',
        description: `Property assigned to ${getClientName(selectedClient)}`,
      })
      router.refresh()
    }

    setIsAssigning(false)
    setShowAssignModal(false)
    setPropertyForModal(null)
  }

  // Handle bulk assignment
  const handleBulkAssign = async () => {
    if (!selectedClient || selectedProperties.size === 0) {
      toast({
        title: 'Select properties',
        description: 'Please select at least one property to assign',
        variant: 'destructive',
      })
      return
    }

    setIsAssigning(true)
    const allPricingEnabled: ClientPricingOptions = {
      show_monthly_rent_to_client: true,
      show_nightly_rate_to_client: true,
      show_purchase_price_to_client: true,
    }

    const propertyIds = Array.from(selectedProperties)
    const result = await bulkAssignPropertiesToClient(selectedClient, propertyIds, allPricingEnabled)

    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' })
    } else {
      toast({
        title: 'Success',
        description: `${result.count} properties assigned to ${getClientName(selectedClient)}`,
      })
      setSelectedProperties(new Set())
      setIsBulkMode(false)
      router.refresh()
    }

    setIsAssigning(false)
  }

  // Render assigned clients badges for a property
  const renderAssignedClients = (propertyId: string) => {
    const assignedClientIds = assignmentsByProperty.get(propertyId)
    if (!assignedClientIds || assignedClientIds.size === 0) return null

    const assignedClients = Array.from(assignedClientIds)
      .map((id) => clients.find((c) => c.id === id))
      .filter(Boolean)

    if (assignedClients.length === 0) return null

    return (
      <div className="flex flex-wrap gap-1 mt-2">
        {assignedClients.slice(0, 3).map((client) => (
          <Badge
            key={client!.id}
            variant="secondary"
            className="bg-blue-500/20 text-blue-400 text-xs"
          >
            {client!.name}
          </Badge>
        ))}
        {assignedClients.length > 3 && (
          <Badge variant="secondary" className="bg-white/10 text-white/60 text-xs">
            +{assignedClients.length - 3} more
          </Badge>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">All Properties</h1>
          <p className="text-white/60 mt-1">
            View all properties and assign them to clients
          </p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 text-white/60">
            <Building2 className="h-5 w-5" />
            <span>{properties.length} properties</span>
          </div>
          <div className="flex items-center gap-2 text-white/60">
            <Users className="h-5 w-5" />
            <span>{clients.length} clients</span>
          </div>
        </div>
      </div>

      {/* Client Selection & Controls */}
      <Card className="glass-card border-white/20">
        <CardHeader className="pb-4">
          <CardTitle className="text-white text-lg">Assign to Client</CardTitle>
          <CardDescription className="text-white/60">
            Select a client to assign properties to
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Client Dropdown */}
            <div className="flex-1">
              <Select
                value={selectedClient || ''}
                onValueChange={(value) => {
                  setSelectedClient(value || null)
                  setSelectedProperties(new Set())
                }}
              >
                <SelectTrigger className="bg-white/5 border-white/30 text-white">
                  <SelectValue placeholder="Select a client..." />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-white/20">
                  {clients.map((client) => (
                    <SelectItem
                      key={client.id}
                      value={client.id}
                      className="text-white hover:bg-white/10 focus:bg-white/10"
                    >
                      <div className="flex items-center gap-2">
                        <span>{client.name}</span>
                        <Badge
                          variant="secondary"
                          className={`text-xs ${
                            client.status === 'active'
                              ? 'bg-green-500/20 text-green-400'
                              : client.status === 'pending'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {client.status}
                        </Badge>
                        {client.property_count !== undefined && (
                          <span className="text-white/40 text-xs">
                            ({client.property_count} properties)
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <Input
                placeholder="Search properties..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/5 border-white/30 text-white placeholder:text-white/40"
              />
            </div>

            {/* Bulk Mode Toggle */}
            <Button
              variant={isBulkMode ? 'default' : 'outline'}
              onClick={toggleBulkMode}
              className={
                isBulkMode
                  ? 'bg-blue-500 hover:bg-blue-600'
                  : 'border-white/30 text-white hover:bg-white/10'
              }
            >
              {isBulkMode ? (
                <>
                  <CheckSquare className="h-4 w-4 mr-2" />
                  Bulk Mode
                </>
              ) : (
                <>
                  <Square className="h-4 w-4 mr-2" />
                  Bulk Select
                </>
              )}
            </Button>
          </div>

          {/* Bulk Actions */}
          {isBulkMode && selectedClient && (
            <div className="flex gap-2 flex-wrap pt-2 border-t border-white/10">
              <Button
                size="sm"
                onClick={handleBulkAssign}
                disabled={isAssigning || selectedProperties.size === 0}
                className="bg-green-500 hover:bg-green-600"
              >
                {isAssigning ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-1" />
                    Assign {selectedProperties.size} to {getClientName(selectedClient)}
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={selectAll}
                className="border-white/30 text-white hover:bg-white/10"
              >
                Select All ({availableForClient.length})
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={deselectAll}
                className="border-white/30 text-white hover:bg-white/10"
              >
                Deselect All
              </Button>
            </div>
          )}

          {/* Status message when client selected */}
          {selectedClient && (
            <div className="text-sm text-white/60 pt-2">
              Showing {availableForClient.length} properties available for {getClientName(selectedClient)}
              {filteredProperties.length !== availableForClient.length && (
                <span className="text-white/40">
                  {' '}
                  ({filteredProperties.length - availableForClient.length} already assigned)
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Properties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {(selectedClient ? availableForClient : filteredProperties).map((property) => {
          const firstImage = property.images && property.images.length > 0 ? property.images[0] : null
          const isSelected = selectedProperties.has(property.id)
          const isAlreadyAssigned = selectedClient && assignmentsByProperty.get(property.id)?.has(selectedClient)

          return (
            <Card
              key={property.id}
              onClick={() => isBulkMode && selectedClient && !isAlreadyAssigned && togglePropertySelection(property.id)}
              className={`glass-card border-white/20 overflow-hidden transition-all ${
                isBulkMode && selectedClient ? 'cursor-pointer hover:border-white/40' : ''
              } ${isSelected ? 'ring-2 ring-blue-500 border-blue-500' : ''}`}
            >
              {/* Property Image */}
              <div className="relative h-40 bg-white/5">
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
                  <div className="w-full h-full flex items-center justify-center">
                    <Home className="h-12 w-12 text-white/20" />
                  </div>
                )}
                {/* Bulk Select Checkbox */}
                {isBulkMode && selectedClient && (
                  <div className="absolute top-2 left-2">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => togglePropertySelection(property.id)}
                      className="h-5 w-5 border-white/50 bg-black/50 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                    />
                  </div>
                )}
                {/* Image count */}
                {property.images && property.images.length > 1 && (
                  <div className="absolute bottom-2 right-2 bg-black/60 px-2 py-1 rounded text-xs text-white">
                    {property.images.length} photos
                  </div>
                )}
              </div>

              <CardContent className="p-4">
                {/* Address */}
                <h3 className="text-white font-medium truncate mb-2">
                  {property.address || 'Unknown Address'}
                </h3>

                {/* Stats */}
                <div className="flex gap-3 text-sm text-white/60 mb-2">
                  {property.bedrooms && <span>{property.bedrooms} bed</span>}
                  {property.bathrooms && <span>{property.bathrooms} bath</span>}
                  {property.area && <span>{formatNumber(Number(property.area))} sqft</span>}
                </div>

                {/* Pricing */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {property.show_monthly_rent && property.custom_monthly_rent && (
                    <Badge variant="secondary" className="bg-green-500/20 text-green-400 text-xs">
                      {formatCurrency(property.custom_monthly_rent)}/mo
                    </Badge>
                  )}
                  {property.show_nightly_rate && property.custom_nightly_rate && (
                    <Badge variant="secondary" className="bg-purple-500/20 text-purple-400 text-xs">
                      {formatCurrency(property.custom_nightly_rate)}/night
                    </Badge>
                  )}
                  {property.show_purchase_price && property.custom_purchase_price && (
                    <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 text-xs">
                      {formatCurrency(property.custom_purchase_price)}
                    </Badge>
                  )}
                </div>

                {/* Assigned Clients */}
                {renderAssignedClients(property.id)}

                {/* Assign Button (single mode) */}
                {!isBulkMode && selectedClient && !isAlreadyAssigned && (
                  <Button
                    size="sm"
                    onClick={() => handleStartAssign(property)}
                    disabled={isAssigning}
                    className="w-full mt-3 bg-white text-black hover:bg-white/90"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Assign to {getClientName(selectedClient)}
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Empty State */}
      {(selectedClient ? availableForClient : filteredProperties).length === 0 && (
        <div className="text-center py-16">
          <Home className="h-16 w-16 mx-auto mb-4 text-white/20" />
          <h3 className="text-xl text-white mb-2">No properties found</h3>
          <p className="text-white/60">
            {searchQuery
              ? 'No properties match your search'
              : selectedClient
              ? `All properties are already assigned to ${getClientName(selectedClient)}`
              : 'No properties available'}
          </p>
        </div>
      )}

      {/* Assignment Modal */}
      {showAssignModal && propertyForModal && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-zinc-900 border border-white/20 rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Assign Property</h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowAssignModal(false)}
                className="text-white/60 hover:text-white hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-white/60 mb-4">
              Assign "{propertyForModal.address}" to {getClientName(selectedClient)}
            </p>

            <div className="space-y-4 mb-6">
              <p className="text-sm text-white/80 font-medium">
                Choose which pricing options to show:
              </p>

              {propertyForModal.show_monthly_rent && propertyForModal.custom_monthly_rent && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="show_monthly_rent"
                    checked={pendingPricing.show_monthly_rent_to_client}
                    onCheckedChange={(checked) =>
                      setPendingPricing((prev) => ({
                        ...prev,
                        show_monthly_rent_to_client: !!checked,
                      }))
                    }
                    className="border-white/30 data-[state=checked]:bg-white data-[state=checked]:text-black"
                  />
                  <Label htmlFor="show_monthly_rent" className="text-white cursor-pointer">
                    Monthly Rent ({formatCurrency(propertyForModal.custom_monthly_rent)})
                  </Label>
                </div>
              )}

              {propertyForModal.show_nightly_rate && propertyForModal.custom_nightly_rate && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="show_nightly_rate"
                    checked={pendingPricing.show_nightly_rate_to_client}
                    onCheckedChange={(checked) =>
                      setPendingPricing((prev) => ({
                        ...prev,
                        show_nightly_rate_to_client: !!checked,
                      }))
                    }
                    className="border-white/30 data-[state=checked]:bg-white data-[state=checked]:text-black"
                  />
                  <Label htmlFor="show_nightly_rate" className="text-white cursor-pointer">
                    Nightly Rate ({formatCurrency(propertyForModal.custom_nightly_rate)})
                  </Label>
                </div>
              )}

              {propertyForModal.show_purchase_price && propertyForModal.custom_purchase_price && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="show_purchase_price"
                    checked={pendingPricing.show_purchase_price_to_client}
                    onCheckedChange={(checked) =>
                      setPendingPricing((prev) => ({
                        ...prev,
                        show_purchase_price_to_client: !!checked,
                      }))
                    }
                    className="border-white/30 data-[state=checked]:bg-white data-[state=checked]:text-black"
                  />
                  <Label htmlFor="show_purchase_price" className="text-white cursor-pointer">
                    Purchase Price ({formatCurrency(propertyForModal.custom_purchase_price)})
                  </Label>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() => setShowAssignModal(false)}
                className="text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmAssign}
                disabled={isAssigning}
                className="bg-white text-black hover:bg-white/90"
              >
                {isAssigning ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Assign Property'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
