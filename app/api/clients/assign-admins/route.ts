import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { isSuperAdmin } from '@/lib/auth/roles'

export async function POST(request: Request) {
  try {
    // Check if user is super admin
    const isSuper = await isSuperAdmin()
    if (!isSuper) {
      return NextResponse.json({ error: 'Unauthorized: Super admin access required' }, { status: 403 })
    }

    const { clientId, managerIds } = await request.json()

    if (!clientId || !Array.isArray(managerIds)) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 })
    }

    const supabase = await createClient()

    // Get the client to find the owner
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('manager_id')
      .eq('id', clientId)
      .single()

    if (clientError || !client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const ownerId = client.manager_id

    // Get current user (super admin doing the assignment)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { data: currentManager } = await supabase
      .from('property_managers')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    if (!currentManager) {
      return NextResponse.json({ error: 'Manager profile not found' }, { status: 404 })
    }

    // Get existing shares for this client
    const { data: existingShares } = await supabase
      .from('client_shares')
      .select('shared_with_manager_id')
      .eq('client_id', clientId)

    const existingManagerIds = new Set(existingShares?.map(s => s.shared_with_manager_id) || [])

    // Determine which shares to add and which to remove
    const selectedManagerIds = new Set(managerIds.filter(id => id !== ownerId)) // Don't create shares for owner
    const toAdd = Array.from(selectedManagerIds).filter(id => !existingManagerIds.has(id))
    const toRemove = Array.from(existingManagerIds).filter(id => !selectedManagerIds.has(id))

    // Remove shares that should no longer exist
    if (toRemove.length > 0) {
      const { error: deleteError } = await supabase
        .from('client_shares')
        .delete()
        .eq('client_id', clientId)
        .in('shared_with_manager_id', toRemove)

      if (deleteError) {
        console.error('Error removing shares:', deleteError)
        return NextResponse.json({ error: 'Failed to remove some assignments' }, { status: 500 })
      }
    }

    // Add new shares
    if (toAdd.length > 0) {
      const newShares = toAdd.map(managerId => ({
        client_id: clientId,
        shared_with_manager_id: managerId,
        shared_by_manager_id: currentManager.id, // Super admin who is making the assignment
      }))

      const { error: insertError } = await supabase
        .from('client_shares')
        .insert(newShares)

      if (insertError) {
        console.error('Error adding shares:', insertError)
        return NextResponse.json({ error: 'Failed to add some assignments' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in assign-admins API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
