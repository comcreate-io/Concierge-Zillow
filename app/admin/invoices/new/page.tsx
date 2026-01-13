import { InvoiceForm } from '@/components/invoice-form'
import { getAllClients } from '@/lib/actions/clients'

export default async function NewInvoicePage() {
  const { data: clients } = await getAllClients()

  // Transform clients to the format expected by the form
  const clientOptions = (clients || []).map(client => ({
    id: client.id,
    name: client.name,
    email: client.email,
  }))

  return <InvoiceForm clients={clientOptions} />
}
