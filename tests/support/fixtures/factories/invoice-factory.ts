import { SupabaseHelper } from '../../helpers/supabase-helper';

export type InvoiceStatus = 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue';

export type Invoice = {
  id: string;
  invoice_number: string;
  manager_id: string;
  client_name: string;
  client_email: string;
  due_date: string;
  status: InvoiceStatus;
  subtotal: number;
  tax_rate: number | null;
  tax_amount: number;
  total: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  sent_at: string | null;
  viewed_at: string | null;
  paid_at: string | null;
};

export type InvoiceLineItem = {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  created_at: string;
};

type InvoiceOverrides = Partial<Omit<Invoice, 'id' | 'created_at' | 'updated_at'>>;

type LineItemInput = {
  description: string;
  quantity: number;
  unit_price: number;
};

/**
 * Factory for creating test invoices with auto-cleanup.
 */
export class InvoiceFactory {
  private supabase: SupabaseHelper;
  private createdIds: string[] = [];

  constructor(supabase: SupabaseHelper) {
    this.supabase = supabase;
  }

  /**
   * Generate a unique invoice number.
   */
  private generateInvoiceNumber(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `INV-${year}-TEST-${random}`;
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
   * Create a test invoice with sensible defaults.
   * Requires manager_id to be provided.
   */
  async create(
    managerId: string,
    overrides: Omit<InvoiceOverrides, 'manager_id'> = {},
    lineItems: LineItemInput[] = [{ description: 'Test Service', quantity: 1, unit_price: 100 }]
  ): Promise<Invoice & { line_items: InvoiceLineItem[] }> {
    const timestamp = Date.now();
    const taxRate = overrides.tax_rate ?? 0;
    const { subtotal, taxAmount, total } = this.calculateTotals(lineItems, taxRate);

    // Due date defaults to 30 days from now
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    const defaults = {
      invoice_number: this.generateInvoiceNumber(),
      manager_id: managerId,
      client_name: `Test Client ${timestamp}`,
      client_email: `testclient-${timestamp}@example.com`,
      due_date: dueDate.toISOString().split('T')[0],
      status: 'draft' as InvoiceStatus,
      subtotal,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      total,
      notes: null,
    };

    const invoice = await this.supabase.insert<Invoice>('invoices', {
      ...defaults,
      ...overrides,
    });

    this.createdIds.push(invoice.id);

    // Create line items
    const createdLineItems: InvoiceLineItem[] = [];
    for (const item of lineItems) {
      const lineItem = await this.supabase.insert<InvoiceLineItem>('invoice_line_items', {
        invoice_id: invoice.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.quantity * item.unit_price,
      });
      createdLineItems.push(lineItem);
    }

    return { ...invoice, line_items: createdLineItems };
  }

  /**
   * Create a sent invoice (ready for payment).
   */
  async createSent(
    managerId: string,
    overrides: Omit<InvoiceOverrides, 'manager_id'> = {},
    lineItems?: LineItemInput[]
  ): Promise<Invoice & { line_items: InvoiceLineItem[] }> {
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
   * Create a paid invoice.
   */
  async createPaid(
    managerId: string,
    overrides: Omit<InvoiceOverrides, 'manager_id'> = {},
    lineItems?: LineItemInput[]
  ): Promise<Invoice & { line_items: InvoiceLineItem[] }> {
    return this.create(
      managerId,
      {
        status: 'paid',
        sent_at: new Date().toISOString(),
        viewed_at: new Date().toISOString(),
        paid_at: new Date().toISOString(),
        ...overrides,
      },
      lineItems
    );
  }

  /**
   * Create an overdue invoice.
   */
  async createOverdue(
    managerId: string,
    overrides: Omit<InvoiceOverrides, 'manager_id'> = {},
    lineItems?: LineItemInput[]
  ): Promise<Invoice & { line_items: InvoiceLineItem[] }> {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 7);

    return this.create(
      managerId,
      {
        status: 'overdue',
        sent_at: new Date(pastDate.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        due_date: pastDate.toISOString().split('T')[0],
        ...overrides,
      },
      lineItems
    );
  }

  /**
   * Create a high-value invoice for luxury services.
   */
  async createLuxury(managerId: string): Promise<Invoice & { line_items: InvoiceLineItem[] }> {
    return this.create(
      managerId,
      { tax_rate: 7 },
      [
        { description: 'Luxury Property Management - Monthly Fee', quantity: 1, unit_price: 2500 },
        { description: 'Concierge Services', quantity: 10, unit_price: 150 },
        { description: 'Property Maintenance', quantity: 1, unit_price: 500 },
      ]
    );
  }

  /**
   * Clean up all created invoices.
   */
  async cleanup(): Promise<void> {
    for (const id of this.createdIds) {
      // Delete line items first (foreign key constraint)
      await this.supabase.deleteWhere('invoice_line_items', 'invoice_id', id);
      // Delete invoice
      await this.supabase.delete('invoices', id);
    }
    this.createdIds = [];
  }
}
