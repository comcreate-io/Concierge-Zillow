import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  // Get all property managers
  const { data: managers, error } = await supabase
    .from('property_managers')
    .select('id, name, last_name, email')
    .order('name')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(managers)
}
