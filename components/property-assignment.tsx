'use client'

import { useState } from 'react'
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
import { useToast } from '@/hooks/use-toast'
import {
  assignPropertyToManager,
  unassignPropertyFromManager,
  type Property,
} from '@/lib/actions/properties'
import { Search, Home, Plus, X, BedDouble, Bath, Maximize } from 'lucide-react'

export function PropertyAssignment({
  managerId,
  allProperties,
  assignedProperties,
}: {
  managerId: string
  allProperties: Property[]
  assignedProperties: Property[]
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [isAssigning, setIsAssigning] = useState<string | null>(null)

  const assignedIds = new Set(assignedProperties.map((p) => p.id))
  const availableProperties = allProperties.filter((p) => !assignedIds.has(p.id))

  const filteredAvailable = availableProperties.filter((p) =>
    p.address?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAssign = async (propertyId: string) => {
    setIsAssigning(propertyId)
    const result = await assignPropertyToManager(propertyId, managerId)

    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Success',
        description: 'Property assigned successfully',
      })
      router.refresh()
    }

    setIsAssigning(null)
  }

  const handleUnassign = async (propertyId: string) => {
    setIsAssigning(propertyId)
    const result = await unassignPropertyFromManager(propertyId, managerId)

    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Success',
        description: 'Property unassigned successfully',
      })
      router.refresh()
    }

    setIsAssigning(null)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Assigned Properties */}
      <Card>
        <CardHeader>
          <CardTitle>Assigned Properties</CardTitle>
          <CardDescription>
            {assignedProperties.length} {assignedProperties.length === 1 ? 'property' : 'properties'} currently managed
          </CardDescription>
        </CardHeader>
        <CardContent>
          {assignedProperties.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No properties assigned yet
            </div>
          ) : (
            <div className="space-y-3">
              {assignedProperties.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  action={
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUnassign(property.id)}
                      disabled={isAssigning === property.id}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  }
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Properties */}
      <Card>
        <CardHeader>
          <CardTitle>Available Properties</CardTitle>
          <CardDescription>
            Assign properties to this manager
          </CardDescription>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredAvailable.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? 'No properties found' : 'All properties are assigned'}
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {filteredAvailable.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  action={
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAssign(property.id)}
                      disabled={isAssigning === property.id}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  }
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function PropertyCard({
  property,
  action,
}: {
  property: Property
  action: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border p-3 hover:bg-accent/50 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p className="font-medium truncate">{property.address || 'No address'}</p>
            <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
              {property.bedrooms && (
                <div className="flex items-center gap-1">
                  <BedDouble className="h-3 w-3" />
                  <span>{property.bedrooms} bed</span>
                </div>
              )}
              {property.bathrooms && (
                <div className="flex items-center gap-1">
                  <Bath className="h-3 w-3" />
                  <span>{property.bathrooms} bath</span>
                </div>
              )}
              {property.area && (
                <div className="flex items-center gap-1">
                  <Maximize className="h-3 w-3" />
                  <span>{property.area}</span>
                </div>
              )}
            </div>
            {property.monthly_rent && (
              <Badge variant="secondary" className="mt-2">
                ${property.monthly_rent}/mo
              </Badge>
            )}
          </div>
          {action}
        </div>
      </div>
    </div>
  )
}
