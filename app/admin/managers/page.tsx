import { createClient } from '@/lib/supabase/server'
import { PropertyManagerList } from '@/components/property-manager-list'
import { AddPropertyManagerDialog } from '@/components/add-property-manager-dialog'

export default async function PropertyManagersPage() {
  const supabase = await createClient()

  const { data: propertyManagers, error } = await supabase
    .from('property_managers')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching property managers:', error)
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="luxury-heading text-3xl sm:text-4xl font-bold tracking-widest text-white">Property Managers</h1>
          <p className="text-white/70 mt-2 tracking-wide">Manage property managers and their properties</p>
        </div>
        <AddPropertyManagerDialog />
      </div>

      <PropertyManagerList propertyManagers={propertyManagers || []} />
    </div>
  )
}
