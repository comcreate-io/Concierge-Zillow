import { QuoteForm } from '@/components/quote-form'
import { getAllClients } from '@/lib/actions/clients'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function NewQuotePage() {
  const { data: clients } = await getAllClients()

  // Transform clients to the format expected by the form
  const clientOptions = (clients || []).map(client => ({
    id: client.id,
    name: client.name,
    email: client.email,
  }))

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/quotes"
          className="inline-flex items-center text-white/70 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Quotes
        </Link>
        <h1 className="luxury-heading text-3xl sm:text-4xl font-bold tracking-widest text-white">
          Create Quote
        </h1>
        <p className="text-white/70 mt-2 tracking-wide">
          Create a new quote for luxury services
        </p>
      </div>

      <QuoteForm mode="create" clients={clientOptions} />
    </div>
  )
}
