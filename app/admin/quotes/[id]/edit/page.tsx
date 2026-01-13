import { QuoteForm } from '@/components/quote-form'
import { getQuoteById } from '@/lib/actions/quotes'
import { getAllClients } from '@/lib/actions/clients'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { notFound } from 'next/navigation'

interface EditQuotePageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ from?: string; clientId?: string }>
}

export default async function EditQuotePage({ params, searchParams }: EditQuotePageProps) {
  const { id } = await params
  const { from, clientId } = await searchParams

  const [quoteResult, clientsResult] = await Promise.all([
    getQuoteById(id),
    getAllClients()
  ])

  const { data: quote, error } = quoteResult

  if (error || !quote) {
    notFound()
  }

  if (quote.status !== 'draft') {
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
        </div>
        <div className="p-6 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-300">
          Only draft quotes can be edited. This quote has already been sent.
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
  const backUrl = from === 'client' && clientId ? `/admin/client/${clientId}` : '/admin/quotes'

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={backUrl}
          className="inline-flex items-center text-white/70 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Link>
        <h1 className="luxury-heading text-3xl sm:text-4xl font-bold tracking-widest text-white">
          Edit Quote
        </h1>
        <p className="text-white/70 mt-2 tracking-wide">
          {quote.quote_number} - {quote.client_name}
        </p>
      </div>

      <QuoteForm quote={quote} mode="edit" clients={clientOptions} backUrl={backUrl} />
    </div>
  )
}
