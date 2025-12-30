import { QuotesList } from '@/components/quotes-list'
import { getAllQuotesSystem } from '@/lib/actions/quotes'
import { getAllManagers } from '@/lib/actions/clients'

export default async function QuotesPage() {
  const [quotesResult, managersResult] = await Promise.all([
    getAllQuotesSystem(),
    getAllManagers()
  ])

  if (quotesResult.error) {
    console.error('Error fetching quotes:', quotesResult.error)
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="luxury-heading text-2xl sm:text-3xl md:text-4xl font-bold tracking-wider sm:tracking-widest text-white">Quotes</h1>
          <p className="text-white/70 mt-1 sm:mt-2 tracking-wide text-sm sm:text-base">
            View and manage all team quotes
          </p>
        </div>
      </div>

      <QuotesList
        quotes={quotesResult.data || []}
        managers={managersResult.data || []}
        showManagerFilter={true}
      />
    </div>
  )
}
