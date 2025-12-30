import { createClient } from '@/lib/supabase/client'

export interface AgentInfo {
  name: string | null
  phone: string | null
  email: string | null
  broker_name: string | null
}

/**
 * Find or create a listing agent based on phone number (unique identifier)
 * Returns the agent ID if found/created, null otherwise
 */
export async function findOrCreateAgent(agentInfo: AgentInfo): Promise<string | null> {
  // Need at least a name and phone to create an agent
  if (!agentInfo.name || !agentInfo.phone) {
    return null
  }

  const supabase = createClient()

  // First, try to find existing agent by phone
  const { data: existingAgent } = await supabase
    .from('listing_agents')
    .select('id')
    .eq('phone', agentInfo.phone)
    .single()

  if (existingAgent) {
    // Update agent info if we have more data (email, broker)
    if (agentInfo.email || agentInfo.broker_name) {
      await supabase
        .from('listing_agents')
        .update({
          email: agentInfo.email || undefined,
          broker_name: agentInfo.broker_name || undefined,
        })
        .eq('id', existingAgent.id)
    }
    return existingAgent.id
  }

  // Create new agent
  const { data: newAgent, error } = await supabase
    .from('listing_agents')
    .insert({
      name: agentInfo.name,
      phone: agentInfo.phone,
      email: agentInfo.email,
      broker_name: agentInfo.broker_name,
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error creating agent:', error)
    return null
  }

  return newAgent?.id || null
}

/**
 * Link a property to an agent
 */
export async function linkPropertyToAgent(propertyId: string, agentId: string): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase
    .from('properties')
    .update({ listing_agent_id: agentId })
    .eq('id', propertyId)

  if (error) {
    console.error('Error linking property to agent:', error)
    return false
  }

  return true
}
