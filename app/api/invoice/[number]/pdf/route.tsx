import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { InvoicePDF } from '@/components/invoice-pdf'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { number: string } }
) {
  try {
    const invoiceNumber = params.number
    const supabase = await createClient()

    // Get invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('invoice_number', invoiceNumber)
      .single()

    if (invoiceError || !invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Get line items
    const { data: lineItems, error: lineItemsError } = await supabase
      .from('invoice_line_items')
      .select('*')
      .eq('invoice_id', invoice.id)
      .order('created_at', { ascending: true })

    if (lineItemsError) {
      return NextResponse.json(
        { error: 'Failed to fetch line items' },
        { status: 500 }
      )
    }

    const invoiceWithLineItems = {
      ...invoice,
      line_items: lineItems || [],
    }

    // Generate PDF
    const pdfBuffer = await renderToBuffer(
      <InvoicePDF invoice={invoiceWithLineItems} />
    )

    // Return PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${invoiceNumber}.pdf"`,
      },
    })
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}
