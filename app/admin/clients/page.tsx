import { getAllClients } from '@/lib/actions/clients'
import { ClientsList } from '@/components/clients-list'

export default async function ClientsPage() {
  const { data: clients, error } = await getAllClients()

  if (error) {
    console.error('Error fetching clients:', error)
  }

  return (
    <div className="space-y-4 sm:space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
        <div>
          <h1 className="luxury-heading text-2xl sm:text-3xl md:text-4xl font-bold tracking-[0.1em] sm:tracking-widest text-white">My Clients</h1>
          <p className="text-white/70 mt-1 sm:mt-2 tracking-wide text-sm sm:text-base">Manage your client portfolio</p>
        </div>
      </div>

      <ClientsList clients={clients || []} />
    </div>
  )
}
