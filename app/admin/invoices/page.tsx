import { getAllInvoicesSystem } from '@/lib/actions/invoices'
import { getAllManagers } from '@/lib/actions/clients'
import { InvoicesList } from '@/components/invoices-list'

export default async function InvoicesPage() {
  const [invoicesResult, managersResult] = await Promise.all([
    getAllInvoicesSystem(),
    getAllManagers()
  ])

  if (invoicesResult.error) {
    console.error('Error fetching invoices:', invoicesResult.error)
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="luxury-heading text-2xl sm:text-3xl md:text-4xl font-bold tracking-wider sm:tracking-widest text-white">Invoices</h1>
          <p className="text-white/70 mt-1 sm:mt-2 tracking-wide text-sm sm:text-base">View and manage all team invoices</p>
        </div>
      </div>

      <InvoicesList
        invoices={invoicesResult.data || []}
        managers={managersResult.data || []}
        showManagerFilter={true}
      />
    </div>
  )
}
