import { SupabaseHelper } from '../../helpers/supabase-helper';

export type QuoteStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired' | 'converted';

export type Quote = {
  id: string;
  quote_number: string;
  manager_id: string;
  client_name: string;
  client_email: string;
  valid_until: string;
  status: QuoteStatus;
  subtotal: number;
  tax_rate: number | null;
  tax_amount: number;
  total: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  sent_at: string | null;
  viewed_at: string | null;
  accepted_at: string | null;
  rejected_at: string | null;
  converted_invoice_id: string | null;
};

export type QuoteLineItem = {
  id: string;
  quote_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  created_at: string;
};

type QuoteOverrides = Partial<Omit<Quote, 'id' | 'created_at' | 'updated_at'>>;

type LineItemInput = {
  description: string;
  quantity: number;
  unit_price: number;
};

/**
 * Factory for creating test quotes with auto-cleanup.
 */
export class QuoteFactory {
  private supabase: SupabaseHelper;
  private createdIds: string[] = [];

  constructor(supabase: SupabaseHelper) {
    this.supabase = supabase;
  }

  /**
   * Generate a unique quote number.
   */
  private generateQuoteNumber(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `QT-${year}-TEST-${random}`;
  }

  /**
   * Calculate totals from line items.
   */
  private calculateTotals(lineItems: LineItemInput[], taxRate: number = 0) {
    const subtotal = lineItems.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;
    return { subtotal, taxAmount, total };
  }

  /**
   * Create a test quote with sensible defaults.
   * Requires manager_id to be provided.
   */
  async create(
    managerId: string,
    overrides: Omit<QuoteOverrides, 'manager_id'> = {},
    lineItems: LineItemInput[] = [{ description: 'Test Service', quantity: 1, unit_price: 100 }]
  ): Promise<Quote & { line_items: QuoteLineItem[] }> {
    const timestamp = Date.now();
    const taxRate = overrides.tax_rate ?? 0;
    const { subtotal, taxAmount, total } = this.calculateTotals(lineItems, taxRate);

    // Valid until defaults to 14 days from now
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 14);

    const defaults = {
      quote_number: this.generateQuoteNumber(),
      manager_id: managerId,
      client_name: `Test Client ${timestamp}`,
      client_email: `testclient-${timestamp}@example.com`,
      valid_until: validUntil.toISOString().split('T')[0],
      status: 'draft' as QuoteStatus,
      subtotal,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      total,
      notes: null,
    };

    const quote = await this.supabase.insert<Quote>('quotes', {
      ...defaults,
      ...overrides,
    });

    this.createdIds.push(quote.id);

    // Create line items
    const createdLineItems: QuoteLineItem[] = [];
    for (const item of lineItems) {
      const lineItem = await this.supabase.insert<QuoteLineItem>('quote_line_items', {
        quote_id: quote.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.quantity * item.unit_price,
      });
      createdLineItems.push(lineItem);
    }

    return { ...quote, line_items: createdLineItems };
  }

  /**
   * Create a sent quote (ready for client review).
   */
  async createSent(
    managerId: string,
    overrides: Omit<QuoteOverrides, 'manager_id'> = {},
    lineItems?: LineItemInput[]
  ): Promise<Quote & { line_items: QuoteLineItem[] }> {
    return this.create(
      managerId,
      {
        status: 'sent',
        sent_at: new Date().toISOString(),
        ...overrides,
      },
      lineItems
    );
  }

  /**
   * Create an accepted quote.
   */
  async createAccepted(
    managerId: string,
    overrides: Omit<QuoteOverrides, 'manager_id'> = {},
    lineItems?: LineItemInput[]
  ): Promise<Quote & { line_items: QuoteLineItem[] }> {
    return this.create(
      managerId,
      {
        status: 'accepted',
        sent_at: new Date().toISOString(),
        viewed_at: new Date().toISOString(),
        accepted_at: new Date().toISOString(),
        ...overrides,
      },
      lineItems
    );
  }

  /**
   * Create an expired quote.
   */
  async createExpired(
    managerId: string,
    overrides: Omit<QuoteOverrides, 'manager_id'> = {},
    lineItems?: LineItemInput[]
  ): Promise<Quote & { line_items: QuoteLineItem[] }> {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 7);

    return this.create(
      managerId,
      {
        status: 'expired',
        sent_at: new Date(pastDate.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        valid_until: pastDate.toISOString().split('T')[0],
        ...overrides,
      },
      lineItems
    );
  }

  /**
   * Create a luxury services quote.
   */
  async createLuxury(managerId: string): Promise<Quote & { line_items: QuoteLineItem[] }> {
    return this.create(
      managerId,
      { tax_rate: 7 },
      [
        { description: 'Luxury Property Management - Monthly Fee', quantity: 1, unit_price: 2500 },
        { description: 'Concierge Services Package', quantity: 1, unit_price: 1500 },
        { description: 'Premium Property Staging', quantity: 1, unit_price: 3000 },
      ]
    );
  }

  /**
   * Clean up all created quotes.
   */
  async cleanup(): Promise<void> {
    for (const id of this.createdIds) {
      // Delete line items first (foreign key constraint)
      await this.supabase.deleteWhere('quote_line_items', 'quote_id', id);
      // Delete quote
      await this.supabase.delete('quotes', id);
    }
    this.createdIds = [];
  }
}
