import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase helper for direct database operations in tests.
 * Uses service role key for full access (bypasses RLS).
 */
export class SupabaseHelper {
  private client;

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error(
        'Missing Supabase environment variables. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.'
      );
    }

    this.client = createSupabaseClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  /**
   * Get the Supabase client for custom queries
   */
  getClient() {
    return this.client;
  }

  /**
   * Insert a record into a table
   */
  async insert<T>(table: string, data: Partial<T>): Promise<T> {
    const { data: result, error } = await this.client
      .from(table)
      .insert(data)
      .select()
      .single();

    if (error) throw new Error(`Failed to insert into ${table}: ${error.message}`);
    return result as T;
  }

  /**
   * Delete a record by ID
   */
  async delete(table: string, id: string): Promise<void> {
    const { error } = await this.client.from(table).delete().eq('id', id);
    if (error) throw new Error(`Failed to delete from ${table}: ${error.message}`);
  }

  /**
   * Delete records matching a condition
   */
  async deleteWhere(table: string, column: string, value: string): Promise<void> {
    const { error } = await this.client.from(table).delete().eq(column, value);
    if (error) throw new Error(`Failed to delete from ${table}: ${error.message}`);
  }

  /**
   * Get a record by ID
   */
  async getById<T>(table: string, id: string): Promise<T | null> {
    const { data, error } = await this.client
      .from(table)
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data as T;
  }

  /**
   * Get records matching a condition
   */
  async getWhere<T>(table: string, column: string, value: string): Promise<T[]> {
    const { data, error } = await this.client
      .from(table)
      .select('*')
      .eq(column, value);

    if (error) throw new Error(`Failed to query ${table}: ${error.message}`);
    return (data || []) as T[];
  }

  /**
   * Update a record by ID
   */
  async update<T>(table: string, id: string, data: Partial<T>): Promise<T> {
    const { data: result, error } = await this.client
      .from(table)
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update ${table}: ${error.message}`);
    return result as T;
  }
}
