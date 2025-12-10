import { SupabaseHelper } from '../../helpers/supabase-helper';

export type Property = {
  id: string;
  address: string | null;
  bedrooms: string | null;
  bathrooms: string | null;
  area: string | null;
  zillow_url: string;
  images: any;
  scraped_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  property_manager_id: string | null;
  show_monthly_rent?: boolean;
  custom_monthly_rent?: number | null;
  show_nightly_rate?: boolean;
  custom_nightly_rate?: number | null;
  show_purchase_price?: boolean;
  custom_purchase_price?: number | null;
  position?: number;
};

type PropertyOverrides = Partial<Omit<Property, 'id' | 'created_at' | 'updated_at'>>;

/**
 * Factory for creating test properties with auto-cleanup.
 */
export class PropertyFactory {
  private supabase: SupabaseHelper;
  private createdIds: string[] = [];

  constructor(supabase: SupabaseHelper) {
    this.supabase = supabase;
  }

  /**
   * Create a test property with sensible defaults.
   */
  async create(overrides: PropertyOverrides = {}): Promise<Property> {
    const timestamp = Date.now();
    const defaults = {
      address: `${timestamp} Test Street, Miami, FL 33139`,
      bedrooms: '3',
      bathrooms: '2',
      area: '1500',
      zillow_url: `https://www.zillow.com/homedetails/test-${timestamp}`,
      images: [],
      show_monthly_rent: true,
      custom_monthly_rent: 5000,
      show_nightly_rate: true,
      custom_nightly_rate: 300,
      show_purchase_price: true,
      custom_purchase_price: 750000,
      show_bedrooms: true,
      show_bathrooms: true,
      show_area: true,
      show_address: true,
      show_images: true,
    };

    const property = await this.supabase.insert<Property>('properties', {
      ...defaults,
      ...overrides,
    });

    this.createdIds.push(property.id);
    return property;
  }

  /**
   * Create multiple properties at once.
   */
  async createMany(count: number, overrides: PropertyOverrides = {}): Promise<Property[]> {
    const properties: Property[] = [];
    for (let i = 0; i < count; i++) {
      const property = await this.create({
        ...overrides,
        address: `${Date.now()}-${i} Test Street, Miami, FL 33139`,
        position: i,
      });
      properties.push(property);
    }
    return properties;
  }

  /**
   * Create a luxury property (high-end defaults).
   */
  async createLuxury(overrides: PropertyOverrides = {}): Promise<Property> {
    return this.create({
      bedrooms: '5',
      bathrooms: '6',
      area: '5000',
      custom_monthly_rent: 25000,
      custom_nightly_rate: 1500,
      custom_purchase_price: 5000000,
      ...overrides,
    });
  }

  /**
   * Assign property to a manager.
   */
  async assignToManager(propertyId: string, managerId: string): Promise<void> {
    await this.supabase.insert('property_manager_assignments', {
      property_id: propertyId,
      manager_id: managerId,
    });
  }

  /**
   * Clean up all created properties.
   */
  async cleanup(): Promise<void> {
    for (const id of this.createdIds) {
      // Delete assignments first (foreign key constraint)
      await this.supabase.deleteWhere('property_manager_assignments', 'property_id', id);
      await this.supabase.deleteWhere('client_property_assignments', 'property_id', id);
      // Delete property
      await this.supabase.delete('properties', id);
    }
    this.createdIds = [];
  }
}
