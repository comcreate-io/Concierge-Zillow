import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ClientPropertyAssignment } from '@/components/client-property-assignment'
import { ClientEditDialog } from '@/components/client-edit-dialog'
import { ShareClientDialog } from '@/components/share-client-dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, Copy, User, Mail, Phone, Share2, Target, FileText, Receipt, DollarSign, Calendar } from 'lucide-react'
import { formatPhoneNumber } from '@/lib/utils'
import { ClientUrlDisplay } from '@/components/client-url-display'
import { getInvoicesByClient } from '@/lib/actions/invoices'
import { getQuotesByClient } from '@/lib/actions/quotes'
import { isSuperAdmin } from '@/lib/auth/roles'

export default async function AdminClientPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // Check if current user is super admin
  const isSuper = await isSuperAdmin()

  // Fetch client with their manager
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('*, property_managers(*)')
    .eq('id', id)
    .single()

  if (clientError || !client) {
    notFound()
  }

  const manager = client.property_managers as any

  // Check if this client is shared with the current user
  const { data: { user } } = await supabase.auth.getUser()
  let isSharedWithMe = false
  let sharedByManager = null
  let currentManagerId = manager.id // Default to client's owner manager

  if (user) {
    // First try to find manager by auth_user_id
    let { data: currentManager } = await supabase
      .from('property_managers')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    // If not found by auth_user_id, try matching by email
    if (!currentManager) {
      const { data: managerByEmail } = await supabase
        .from('property_managers')
        .select('id')
        .eq('email', user.email)
        .single()
      currentManager = managerByEmail
    }

    if (currentManager) {
      currentManagerId = currentManager.id // Use current user's manager for property queries

      if (currentManager.id !== manager.id) {
        // This client doesn't belong to the current manager, check if it's shared
        const { data: shareData } = await supabase
          .from('client_shares')
          .select(`
            id,
            shared_by:property_managers!shared_by_manager_id(id, name, email)
          `)
          .eq('client_id', id)
          .eq('shared_with_manager_id', currentManager.id)
          .single()

        if (shareData) {
          isSharedWithMe = true
          sharedByManager = shareData.shared_by as any
        }
      }
    }
  }

  // Fetch properties assigned to the CURRENT USER's manager (not the client's owner)
  // This ensures newly scraped properties appear in History for the user who scraped them
  const { data: managerAssignments } = await supabase
    .from('property_manager_assignments')
    .select('property_id, properties(*)')
    .eq('manager_id', currentManagerId)

  const managerProperties = (managerAssignments?.map((a: any) => a.properties).filter(Boolean) || []) as any[]

  // Fetch saved property IDs for this manager
  const { data: savedPropertiesData } = await supabase
    .from('saved_properties')
    .select('property_id')
    .eq('manager_id', manager.id)

  const savedPropertyIds = savedPropertiesData?.map((s: any) => s.property_id) || []

  // Fetch properties already assigned to this client (with client-specific pricing visibility)
  const { data: clientAssignments } = await supabase
    .from('client_property_assignments')
    .select(`
      property_id,
      show_monthly_rent_to_client,
      show_nightly_rate_to_client,
      show_purchase_price_to_client,
      properties(*)
    `)
    .eq('client_id', id)

  // Merge assignment pricing options with property data
  const clientProperties = (clientAssignments?.map((a: any) => ({
    ...a.properties,
    // Client-specific pricing visibility
    client_show_monthly_rent: a.show_monthly_rent_to_client ?? true,
    client_show_nightly_rate: a.show_nightly_rate_to_client ?? true,
    client_show_purchase_price: a.show_purchase_price_to_client ?? true,
  })).filter(Boolean) || []) as any[]

  // Get IDs of properties that were scraped specifically for this client (from properties table)
  const scrapedForClientPropertyIds = managerProperties
    .filter((p: any) => p.scraped_for_client_id === id)
    .map((p: any) => p.id)

  // Fetch invoices and quotes for this client (by email)
  const [invoicesResult, quotesResult] = await Promise.all([
    getInvoicesByClient(client.email),
    getQuotesByClient(client.email)
  ])

  const clientInvoices = invoicesResult.data || []
  const clientQuotes = quotesResult.data || []

  return (
    <div className="space-y-4 sm:space-y-8 animate-fade-in">
      {/* Header Section */}
      <div>
        <Link href="/admin/clients">
          <Button variant="ghost" className="mb-4 sm:mb-6 text-white hover:text-white-light hover:bg-white/10 -ml-2 sm:-ml-4 text-sm sm:text-base">
            <ArrowLeft className="h-4 w-4 mr-1 sm:mr-2" />
            Back to Clients
          </Button>
        </Link>

        <Card className="elevated-card overflow-hidden">
          <CardContent className="p-4 sm:p-6 md:p-8">
            {/* Mobile Layout */}
            <div className="sm:hidden">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center border-2 border-white/20 flex-shrink-0">
                  <User className="h-7 w-7 text-white/60" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="luxury-heading text-xl font-bold tracking-wider text-white truncate">
                    {client.name}
                  </h1>
                  {isSharedWithMe && sharedByManager && (
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 border text-[10px] mt-1">
                      <Share2 className="h-2.5 w-2.5 mr-1" />
                      Shared by {sharedByManager.name}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Mobile Action Buttons */}
              <div className="flex gap-2 mb-4">
                <ShareClientDialog
                  clientId={id}
                  clientName={client.name}
                  currentManagerId={manager.id}
                />
                <ClientEditDialog
                  clientId={id}
                  clientName={client.name}
                  clientEmail={client.email}
                  clientPhone={client.phone}
                  clientCriteria={client.criteria}
                  clientSlug={client.slug}
                />
              </div>

              {/* Mobile Contact Info */}
              <div className="flex flex-col gap-2 text-white/80 text-sm">
                {client.email && (
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-white/10 rounded-lg">
                      <Mail className="h-3.5 w-3.5 text-white" />
                    </div>
                    <span className="tracking-wide truncate">{client.email}</span>
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-white/10 rounded-lg">
                      <Phone className="h-3.5 w-3.5 text-white" />
                    </div>
                    <span className="tracking-wide">{formatPhoneNumber(client.phone)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden sm:flex flex-col md:flex-row md:items-start gap-6 md:gap-8">
              {/* Client Avatar */}
              <div className="flex flex-col items-center gap-4">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-white/10 flex items-center justify-center border-2 border-white/20">
                  <User className="h-10 w-10 md:h-12 md:w-12 text-white/60" />
                </div>
              </div>

              {/* Client Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex flex-col gap-3">
                    <h1 className="luxury-heading text-2xl sm:text-3xl md:text-4xl font-bold tracking-[0.15em] text-white">
                      {client.name}
                    </h1>
                    {isSharedWithMe && sharedByManager && (
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 border w-fit">
                        <Share2 className="h-3 w-3 mr-1" />
                        Shared by {sharedByManager.name}
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <ShareClientDialog
                      clientId={id}
                      clientName={client.name}
                      currentManagerId={manager.id}
                    />
                    <ClientEditDialog
                      clientId={id}
                      clientName={client.name}
                      clientEmail={client.email}
                      clientPhone={client.phone}
                      clientCriteria={client.criteria}
                      clientSlug={client.slug}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-3 text-white/80">
                  {client.email && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/10 rounded-lg">
                        <Mail className="h-4 w-4 text-white" />
                      </div>
                      <span className="tracking-wide">{client.email}</span>
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/10 rounded-lg">
                        <Phone className="h-4 w-4 text-white" />
                      </div>
                      <span className="tracking-wide">{formatPhoneNumber(client.phone)}</span>
                    </div>
                  )}
                </div>

                {/* Client Search Criteria - Desktop */}
                {client.criteria && (
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <h3 className="text-white/60 text-sm uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Search Criteria
                    </h3>
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <p className="text-white/90 tracking-wide whitespace-pre-wrap">{client.criteria}</p>
                    </div>
                  </div>
                )}

                {/* Manager Contact Information - Desktop */}
                <div className="mt-6 pt-6 border-t border-white/10">
                  <h3 className="text-white/60 text-sm uppercase tracking-widest mb-4">Manager Contact</h3>
                  <div className="flex flex-col gap-3 text-white/80">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/10 rounded-lg">
                        <User className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <span className="text-white font-medium tracking-wide">
                          {manager.last_name ? `${manager.name} ${manager.last_name}` : manager.name}
                        </span>
                        {manager.title && (
                          <p className="text-white/60 text-sm">{manager.title}</p>
                        )}
                      </div>
                    </div>
                    {manager.email && (
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/10 rounded-lg">
                          <Mail className="h-4 w-4 text-white" />
                        </div>
                        <a href={`mailto:${manager.email}`} className="tracking-wide hover:text-white transition-colors">
                          {manager.email}
                        </a>
                      </div>
                    )}
                    {manager.phone && (
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/10 rounded-lg">
                          <Phone className="h-4 w-4 text-white" />
                        </div>
                        <a href={`tel:${manager.phone}`} className="tracking-wide hover:text-white transition-colors">
                          {formatPhoneNumber(manager.phone)}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Criteria & Manager - shown below the main card content */}
            <div className="sm:hidden mt-4 pt-4 border-t border-white/10 space-y-4">
              {/* Client Search Criteria - Mobile */}
              {client.criteria && (
                <div>
                  <h3 className="text-white/60 text-xs uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <Target className="h-3 w-3" />
                    Search Criteria
                  </h3>
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <p className="text-white/90 text-sm tracking-wide whitespace-pre-wrap">{client.criteria}</p>
                  </div>
                </div>
              )}

              {/* Manager Contact Information - Mobile */}
              <div>
                <h3 className="text-white/60 text-xs uppercase tracking-widest mb-2">Manager Contact</h3>
                <div className="flex flex-col gap-2 text-white/80 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-white/10 rounded-lg">
                      <User className="h-3.5 w-3.5 text-white" />
                    </div>
                    <div>
                      <span className="text-white font-medium tracking-wide">
                        {manager.last_name ? `${manager.name} ${manager.last_name}` : manager.name}
                      </span>
                      {manager.title && (
                        <p className="text-white/60 text-xs">{manager.title}</p>
                      )}
                    </div>
                  </div>
                  {manager.email && (
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-white/10 rounded-lg">
                        <Mail className="h-3.5 w-3.5 text-white" />
                      </div>
                      <a href={`mailto:${manager.email}`} className="tracking-wide hover:text-white transition-colors truncate">
                        {manager.email}
                      </a>
                    </div>
                  )}
                  {manager.phone && (
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-white/10 rounded-lg">
                        <Phone className="h-3.5 w-3.5 text-white" />
                      </div>
                      <a href={`tel:${manager.phone}`} className="tracking-wide hover:text-white transition-colors">
                        {formatPhoneNumber(manager.phone)}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Public Portfolio URL Section */}
      <Card className="elevated-card">
        <CardHeader className="p-4 sm:pb-6 border-b border-white/10">
          <CardTitle className="luxury-heading text-lg sm:text-2xl tracking-wider sm:tracking-[0.15em] flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-white/10 rounded-lg">
              <ExternalLink className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            Client Portfolio URL
          </CardTitle>
          <CardDescription className="mt-2 sm:mt-3 text-white/70 tracking-wide text-xs sm:text-sm">
            Share this URL with {client.name} to view their property portfolio
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:pt-6 space-y-3 sm:space-y-4">
          <ClientUrlDisplay clientId={id} clientSlug={client.slug} />
          <Link href={`/client/${client.slug || id}`} target="_blank" className="block">
            <Button variant="outline" className="w-full sm:w-auto border-white/30 hover:bg-white/10 hover:border-white text-white text-sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              Preview Portfolio
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Property Assignment Section */}
      <div>
        <h2 className="luxury-heading text-xl sm:text-2xl md:text-3xl font-bold tracking-wider sm:tracking-[0.15em] text-white mb-4 sm:mb-6">
          Property Assignment
        </h2>
        <ClientPropertyAssignment
          clientId={id}
          clientName={client.name}
          managerProperties={managerProperties}
          assignedProperties={clientProperties}
          savedPropertyIds={savedPropertyIds}
          scrapedForClientPropertyIds={scrapedForClientPropertyIds}
        />
      </div>

      {/* Invoices Section */}
      {clientInvoices.length > 0 && (
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 mb-4 sm:mb-6">
            <h2 className="luxury-heading text-xl sm:text-2xl md:text-3xl font-bold tracking-wider sm:tracking-[0.15em] text-white flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-white/10 rounded-lg">
                <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              Invoices
              <span className="text-sm sm:text-lg text-white/60 font-normal">({clientInvoices.length})</span>
            </h2>
            {clientInvoices.length > 3 && (
              <Link href="/admin/invoices">
                <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10 text-xs sm:text-sm">
                  See all {clientInvoices.length}
                  <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2 rotate-180" />
                </Button>
              </Link>
            )}
          </div>
          <div className="grid gap-3 sm:gap-4">
            {clientInvoices.slice(0, 3).map((invoice: any) => (
              <Card key={invoice.id} className="elevated-card">
                <CardContent className="p-3 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                        <span className="text-white font-semibold tracking-wide text-sm sm:text-base">
                          #{invoice.invoice_number}
                        </span>
                        <Badge className={`text-[10px] sm:text-xs ${
                          invoice.status === 'paid'
                            ? 'bg-green-500/20 text-green-400 border-green-500/30 border'
                            : invoice.status === 'overdue'
                            ? 'bg-red-500/20 text-red-400 border-red-500/30 border'
                            : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 border'
                        }`}>
                          {invoice.status}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2 sm:gap-4 text-white/70 text-xs sm:text-sm">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span>${invoice.total?.toLocaleString() || '0'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span>Due: {new Date(invoice.due_date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <Link href={invoice.status === 'draft' ? `/admin/invoices/${invoice.id}/edit?from=client&clientId=${id}` : `/invoice/${invoice.invoice_number}?from=client&clientId=${id}`}>
                      <Button variant="outline" size="sm" className="border-white/30 hover:bg-white/10 text-white text-xs sm:text-sm w-full sm:w-auto">
                        {invoice.status === 'draft' ? 'Edit' : 'View'}
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Quotes Section */}
      {clientQuotes.length > 0 && (
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 mb-4 sm:mb-6">
            <h2 className="luxury-heading text-xl sm:text-2xl md:text-3xl font-bold tracking-wider sm:tracking-[0.15em] text-white flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-white/10 rounded-lg">
                <Receipt className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              Quotes
              <span className="text-sm sm:text-lg text-white/60 font-normal">({clientQuotes.length})</span>
            </h2>
            {clientQuotes.length > 3 && (
              <Link href="/admin/quotes">
                <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10 text-xs sm:text-sm">
                  See all {clientQuotes.length}
                  <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2 rotate-180" />
                </Button>
              </Link>
            )}
          </div>
          <div className="grid gap-3 sm:gap-4">
            {clientQuotes.slice(0, 3).map((quote: any) => (
              <Card key={quote.id} className="elevated-card">
                <CardContent className="p-3 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                        <span className="text-white font-semibold tracking-wide text-sm sm:text-base">
                          #{quote.quote_number}
                        </span>
                        <Badge className={`text-[10px] sm:text-xs ${
                          quote.status === 'accepted'
                            ? 'bg-green-500/20 text-green-400 border-green-500/30 border'
                            : quote.status === 'rejected'
                            ? 'bg-red-500/20 text-red-400 border-red-500/30 border'
                            : quote.status === 'expired'
                            ? 'bg-gray-500/20 text-gray-400 border-gray-500/30 border'
                            : 'bg-blue-500/20 text-blue-400 border-blue-500/30 border'
                        }`}>
                          {quote.status}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2 sm:gap-4 text-white/70 text-xs sm:text-sm">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span>${quote.total?.toLocaleString() || '0'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span>Expires: {new Date(quote.expiration_date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <Link href={quote.status === 'draft' ? `/admin/quotes/${quote.id}/edit?from=client&clientId=${id}` : `/quote/${quote.quote_number}?from=client&clientId=${id}`}>
                      <Button variant="outline" size="sm" className="border-white/30 hover:bg-white/10 text-white text-xs sm:text-sm w-full sm:w-auto">
                        {quote.status === 'draft' ? 'Edit' : 'View'}
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
