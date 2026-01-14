import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getAllClients } from '@/lib/actions/clients'
import { AllPropertiesCentralized } from '@/components/all-properties-centralized'

export default async function AllPropertiesCentralizedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get all properties
  const { data: properties, error: propertiesError } = await supabase
    .from('properties')
    .select('*')
    .order('address', { ascending: true })

  if (propertiesError) {
    console.error('Error fetching properties:', propertiesError)
  }

  // Get all clients for the logged-in manager
  const { data: clients, error: clientsError } = await getAllClients()

  if (clientsError) {
    console.error('Error fetching clients:', clientsError)
  }

  // Get all client property assignments
  const { data: assignments, error: assignmentsError } = await supabase
    .from('client_property_assignments')
    .select('client_id, property_id, show_monthly_rent_to_client, show_nightly_rate_to_client, show_purchase_price_to_client')

  if (assignmentsError) {
    console.error('Error fetching assignments:', assignmentsError)
  }

  return (
    <AllPropertiesCentralized
      properties={properties || []}
      clients={clients || []}
      assignments={assignments || []}
    />
  )
}
