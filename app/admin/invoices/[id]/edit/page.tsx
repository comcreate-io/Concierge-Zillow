import { InvoiceForm } from '@/components/invoice-form'
import { getInvoiceById } from '@/lib/actions/invoices'
import { getAllClients } from '@/lib/actions/clients'
import { notFound } from 'next/navigation'

export default async function EditInvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ from?: string; clientId?: string }>
}) {
  const { id } = await params
  const { from, clientId } = await searchParams

  const [invoiceResult, clientsResult] = await Promise.all([
    getInvoiceById(id),
    getAllClients()
  ])

  const { data: invoice, error } = invoiceResult

  if (error || !invoice) {
    notFound()
  }

  if (invoice.status !== 'draft') {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="glass-card-accent rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Cannot Edit Invoice</h2>
          <p className="text-white/70">
            Only draft invoices can be edited. This invoice has already been sent.
          </p>
        </div>
      </div>
    )
  }

  // Transform clients to the format expected by the form
  const clientOptions = (clientsResult.data || []).map(client => ({
    id: client.id,
    name: client.name,
    email: client.email,
  }))

  // Determine back URL based on where user came from
  const backUrl = from === 'client' && clientId ? `/admin/client/${clientId}` : '/admin/invoices'

  return <InvoiceForm invoice={invoice} clients={clientOptions} backUrl={backUrl} />
}
