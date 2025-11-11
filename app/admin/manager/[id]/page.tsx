import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { PropertyAssignment } from '@/components/property-assignment'
import { ManagerUrlDisplay } from '@/components/manager-url-display'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeft, Mail, Phone, ExternalLink } from 'lucide-react'

export default async function ManagerPropertiesPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()

  // Fetch property manager
  const { data: manager, error: managerError } = await supabase
    .from('property_managers')
    .select('*')
    .eq('id', params.id)
    .single()

  if (managerError || !manager) {
    notFound()
  }

  // Fetch all properties
  const { data: allProperties, error: propertiesError } = await supabase
    .from('properties')
    .select('*')
    .order('created_at', { ascending: false })

  // Fetch properties assigned to this manager via junction table
  const { data: assignments, error: assignmentsError } = await supabase
    .from('property_manager_assignments')
    .select('property_id, properties(*)')
    .eq('manager_id', params.id)

  const assignedProperties = (assignments?.map((a: any) => a.properties).filter(Boolean) || []) as any[]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/managers">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{manager.name}</h1>
          <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span>{manager.email}</span>
            </div>
            {manager.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>{manager.phone}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Public Portfolio URL */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            Public Portfolio URL
          </CardTitle>
          <CardDescription>
            Share this URL to let others view this property manager's portfolio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ManagerUrlDisplay managerId={params.id} />
          <div className="mt-3">
            <Link href={`/manager/${params.id}`} target="_blank">
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                Preview Public Page
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <PropertyAssignment
        managerId={params.id}
        allProperties={allProperties || []}
        assignedProperties={assignedProperties || []}
      />
    </div>
  )
}
