import { SupabaseHelper } from '../../helpers/supabase-helper';

export type ClientStatus = 'active' | 'pending' | 'closed';

export type Client = {
  id: string;
  manager_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: ClientStatus;
  slug: string | null;
  last_accessed: string | null;
  created_at: string;
  updated_at: string;
};

type ClientOverrides = Partial<Omit<Client, 'id' | 'created_at' | 'updated_at'>>;

/**
 * Factory for creating test clients with auto-cleanup.
 */
export class ClientFactory {
  private supabase: SupabaseHelper;
  private createdIds: string[] = [];

  constructor(supabase: SupabaseHelper) {
    this.supabase = supabase;
  }

  /**
   * Generate a unique slug.
   */
  private generateSlug(): string {
    return `test-client-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Create a test client with sensible defaults.
   * Requires manager_id to be provided.
   */
  async create(managerId: string, overrides: Omit<ClientOverrides, 'manager_id'> = {}): Promise<Client> {
    const timestamp = Date.now();
    const defaults = {
      manager_id: managerId,
      name: `Test Client ${timestamp}`,
      email: `testclient-${timestamp}@example.com`,
      phone: '+1-555-0100',
      status: 'active' as ClientStatus,
      slug: this.generateSlug(),
    };

    const client = await this.supabase.insert<Client>('clients', {
      ...defaults,
      ...overrides,
    });

    this.createdIds.push(client.id);
    return client;
  }

  /**
   * Create multiple clients at once.
   */
  async createMany(managerId: string, count: number, overrides: Omit<ClientOverrides, 'manager_id'> = {}): Promise<Client[]> {
    const clients: Client[] = [];
    for (let i = 0; i < count; i++) {
      const client = await this.create(managerId, {
        ...overrides,
        name: `Test Client ${Date.now()}-${i}`,
      });
      clients.push(client);
    }
    return clients;
  }

  /**
   * Create a pending client (needs activation).
   */
  async createPending(managerId: string, overrides: Omit<ClientOverrides, 'manager_id'> = {}): Promise<Client> {
    return this.create(managerId, {
      status: 'pending',
      ...overrides,
    });
  }

  /**
   * Assign a property to a client.
   */
  async assignProperty(
    clientId: string,
    propertyId: string,
    options: {
      show_monthly_rent_to_client?: boolean;
      show_nightly_rate_to_client?: boolean;
      show_purchase_price_to_client?: boolean;
      position?: number;
    } = {}
  ): Promise<void> {
    await this.supabase.insert('client_property_assignments', {
      client_id: clientId,
      property_id: propertyId,
      show_monthly_rent_to_client: options.show_monthly_rent_to_client ?? true,
      show_nightly_rate_to_client: options.show_nightly_rate_to_client ?? true,
      show_purchase_price_to_client: options.show_purchase_price_to_client ?? true,
      position: options.position ?? 0,
    });
  }

  /**
   * Share client with another manager.
   */
  async shareWith(clientId: string, sharedByManagerId: string, sharedWithManagerId: string): Promise<void> {
    await this.supabase.insert('client_shares', {
      client_id: clientId,
      shared_by_manager_id: sharedByManagerId,
      shared_with_manager_id: sharedWithManagerId,
    });
  }

  /**
   * Clean up all created clients.
   */
  async cleanup(): Promise<void> {
    for (const id of this.createdIds) {
      // Delete assignments first (foreign key constraints)
      await this.supabase.deleteWhere('client_property_assignments', 'client_id', id);
      await this.supabase.deleteWhere('client_shares', 'client_id', id);
      // Delete client
      await this.supabase.delete('clients', id);
    }
    this.createdIds = [];
  }
}
