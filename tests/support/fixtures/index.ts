import { test as base, expect } from '@playwright/test';
import { PropertyFactory } from './factories/property-factory';
import { ClientFactory } from './factories/client-factory';
import { InvoiceFactory } from './factories/invoice-factory';
import { QuoteFactory } from './factories/quote-factory';
import { SupabaseHelper } from '../helpers/supabase-helper';

/**
 * Extended test fixtures for Concierge-Zillow
 *
 * All factories auto-cleanup after each test.
 * Use these fixtures instead of raw Playwright test.
 */
type TestFixtures = {
  propertyFactory: PropertyFactory;
  clientFactory: ClientFactory;
  invoiceFactory: InvoiceFactory;
  quoteFactory: QuoteFactory;
  supabase: SupabaseHelper;
};

export const test = base.extend<TestFixtures>({
  // Supabase helper for direct DB operations
  supabase: async ({}, use) => {
    const helper = new SupabaseHelper();
    await use(helper);
  },

  // Property factory with auto-cleanup
  propertyFactory: async ({ supabase }, use) => {
    const factory = new PropertyFactory(supabase);
    await use(factory);
    await factory.cleanup();
  },

  // Client factory with auto-cleanup
  clientFactory: async ({ supabase }, use) => {
    const factory = new ClientFactory(supabase);
    await use(factory);
    await factory.cleanup();
  },

  // Invoice factory with auto-cleanup
  invoiceFactory: async ({ supabase }, use) => {
    const factory = new InvoiceFactory(supabase);
    await use(factory);
    await factory.cleanup();
  },

  // Quote factory with auto-cleanup
  quoteFactory: async ({ supabase }, use) => {
    const factory = new QuoteFactory(supabase);
    await use(factory);
    await factory.cleanup();
  },
});

export { expect };
