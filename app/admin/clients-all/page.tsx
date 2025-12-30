import { getAllClientsSystem, getCurrentManagerProfile, getAllClients } from '@/lib/actions/clients'
import { AllClientsList } from '@/components/all-clients-list'

export default async function AllClientsPage() {
  const [allClientsResult, managerResult, myClientsResult] = await Promise.all([
    getAllClientsSystem(),
    getCurrentManagerProfile(),
    getAllClients() // Get my clients to know which ones I already have
  ])

  if (allClientsResult.error) {
    console.error('Error fetching all clients:', allClientsResult.error)
  }

  // Get IDs of clients I already have access to (owned + shared)
  const myClientIds = new Set(myClientsResult.data?.map(c => c.id) || [])

  return (
    <div className="space-y-4 sm:space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
        <div>
          <h1 className="luxury-heading text-2xl sm:text-3xl md:text-4xl font-bold tracking-[0.1em] sm:tracking-widest text-white">All Clients</h1>
          <p className="text-white/70 mt-1 sm:mt-2 tracking-wide text-sm sm:text-base">View all clients across the team</p>
        </div>
      </div>

      <AllClientsList
        clients={allClientsResult.data || []}
        currentManagerId={managerResult.data?.id}
        myClientIds={myClientIds}
      />
    </div>
  )
}
