"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Contact, Search, Phone, Mail, Building2, Home, Trash2, ChevronDown, ChevronUp } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

interface Property {
  id: string
  address: string
  images: string[]
}

interface ListingAgent {
  id: string
  name: string
  phone: string | null
  email: string | null
  broker_name: string | null
  notes: string | null
  created_at: string
  property_count?: number
  properties?: Property[]
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<ListingAgent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [loadingPropertiesId, setLoadingPropertiesId] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadAgents()
  }, [])

  const loadAgents = async () => {
    setIsLoading(true)
    const supabase = createClient()

    const { data: agentsData, error } = await supabase
      .from('listing_agents')
      .select('*')
      .order('name')

    if (error) {
      console.error('Error loading agents:', error)
      toast({
        title: 'Error',
        description: 'Failed to load agents',
        variant: 'destructive',
      })
      setIsLoading(false)
      return
    }

    // Get property counts for each agent
    const { data: propertyCounts } = await supabase
      .from('properties')
      .select('listing_agent_id')
      .not('listing_agent_id', 'is', null)

    const countMap: Record<string, number> = {}
    propertyCounts?.forEach(p => {
      if (p.listing_agent_id) {
        countMap[p.listing_agent_id] = (countMap[p.listing_agent_id] || 0) + 1
      }
    })

    const agentsWithCounts = (agentsData || []).map(agent => ({
      ...agent,
      property_count: countMap[agent.id] || 0
    }))

    setAgents(agentsWithCounts)
    setIsLoading(false)
  }

  const loadAgentProperties = async (agentId: string) => {
    if (expandedId === agentId) {
      setExpandedId(null)
      return
    }

    setLoadingPropertiesId(agentId)
    const supabase = createClient()

    const { data: properties, error } = await supabase
      .from('properties')
      .select('id, address, images')
      .eq('listing_agent_id', agentId)
      .order('address')

    if (error) {
      console.error('Error loading properties:', error)
      toast({
        title: 'Error',
        description: 'Failed to load properties',
        variant: 'destructive',
      })
      setLoadingPropertiesId(null)
      return
    }

    setAgents(prev => prev.map(agent =>
      agent.id === agentId
        ? { ...agent, properties: properties || [] }
        : agent
    ))
    setExpandedId(agentId)
    setLoadingPropertiesId(null)
  }

  const filteredAgents = useMemo(() => {
    if (!searchQuery.trim()) {
      return agents
    }

    const query = searchQuery.toLowerCase()
    return agents.filter(agent => {
      if (agent.name?.toLowerCase().includes(query)) return true
      if (agent.phone?.toLowerCase().includes(query)) return true
      if (agent.email?.toLowerCase().includes(query)) return true
      if (agent.broker_name?.toLowerCase().includes(query)) return true
      return false
    })
  }, [agents, searchQuery])

  const handleDelete = async (agentId: string) => {
    if (!confirm('Are you sure you want to delete this agent? Properties will keep their agent info but will no longer be linked.')) {
      return
    }

    setDeletingId(agentId)
    const supabase = createClient()

    await supabase
      .from('properties')
      .update({ listing_agent_id: null })
      .eq('listing_agent_id', agentId)

    const { error } = await supabase
      .from('listing_agents')
      .delete()
      .eq('id', agentId)

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete agent',
        variant: 'destructive',
      })
    } else {
      setAgents(prev => prev.filter(a => a.id !== agentId))
      toast({
        title: 'Success',
        description: 'Agent deleted',
      })
    }
    setDeletingId(null)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1">
          <h1 className="luxury-heading text-2xl sm:text-3xl md:text-4xl font-bold tracking-[0.1em] mb-1 text-white">
            Listing Agents
          </h1>
          <p className="text-white/70 text-sm sm:text-base">
            Contacts auto-collected from Zillow scrapes
          </p>
        </div>
        <Badge variant="outline" className="text-sm px-4 py-2 bg-white/10 border-white/30 justify-center">
          <Contact className="h-3 w-3 mr-2" />
          {filteredAgents.length} {filteredAgents.length === 1 ? 'Agent' : 'Agents'}
        </Badge>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50" />
        <Input
          type="text"
          placeholder="Search by name, phone, email, or brokerage..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-10 h-11 bg-white/5 border-white/30 focus:border-white text-white placeholder:text-white/50 text-sm"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white"
          >
            <span className="text-xl">&times;</span>
          </button>
        )}
      </div>

      {/* Agents List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="skeleton h-10 w-10 rounded-full mb-4"></div>
          <span className="text-white/70">Loading agents...</span>
        </div>
      ) : agents.length === 0 ? (
        <Card className="glass-card-accent p-12 text-center">
          <Contact className="h-16 w-16 text-white/40 mx-auto mb-6" />
          <h3 className="luxury-heading text-2xl font-semibold mb-3 tracking-[0.1em]">No Agents Yet</h3>
          <p className="text-white/70 mb-6">Agent contacts will appear here when you scrape properties from Zillow</p>
        </Card>
      ) : filteredAgents.length === 0 ? (
        <Card className="glass-card-accent p-12 text-center">
          <Search className="h-16 w-16 text-white/40 mx-auto mb-6" />
          <h3 className="luxury-heading text-2xl font-semibold mb-3 tracking-[0.1em]">No Results</h3>
          <p className="text-white/70 mb-6">No agents match "{searchQuery}"</p>
          <Button
            onClick={() => setSearchQuery("")}
            variant="outline"
            className="border-white/40 hover:bg-white/10 text-white"
          >
            Clear Search
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAgents.map((agent) => (
            <Card key={agent.id} className="glass-card-accent elevated-card overflow-hidden">
              {/* Agent Header - Clickable */}
              <div
                className="p-5 cursor-pointer hover:bg-white/5"
                onClick={() => agent.property_count && agent.property_count > 0 ? loadAgentProperties(agent.id) : null}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-white/10 rounded-lg">
                      <Contact className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-lg">{agent.name}</h3>
                      {agent.broker_name && (
                        <p className="text-white/60 text-sm flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {agent.broker_name}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(agent.id)
                      }}
                      disabled={deletingId === agent.id}
                      className="text-white/50 hover:text-red-400 hover:bg-red-500/10 h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 mb-4">
                  {agent.phone && (
                    <a
                      href={`tel:${agent.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-2 text-sm text-white/80 hover:text-white"
                    >
                      <Phone className="h-4 w-4 text-white/50" />
                      {agent.phone}
                    </a>
                  )}
                  {agent.email && (
                    <a
                      href={`mailto:${agent.email}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-2 text-sm text-white/80 hover:text-white"
                    >
                      <Mail className="h-4 w-4 text-white/50" />
                      {agent.email}
                    </a>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                  <div className="flex items-center gap-1.5 text-white/60 text-sm">
                    <Home className="h-4 w-4" />
                    {agent.property_count} {agent.property_count === 1 ? 'property' : 'properties'}
                  </div>
                  {agent.property_count && agent.property_count > 0 ? (
                    <div className="flex items-center gap-1 text-white/60 text-sm">
                      {loadingPropertiesId === agent.id ? (
                        <span>Loading...</span>
                      ) : (
                        <>
                          <span>View properties</span>
                          {expandedId === agent.id ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Properties List - Expandable */}
              {expandedId === agent.id && agent.properties && (
                <div className="border-t border-white/10 bg-white/5 p-4">
                  <h4 className="text-sm font-semibold text-white/70 uppercase tracking-wide mb-3">
                    Properties by {agent.name}
                  </h4>
                  <div className="space-y-2">
                    {agent.properties.map((property) => (
                      <Link
                        key={property.id}
                        href={`/admin/properties/${property.id}/edit`}
                        className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10"
                      >
                        {property.images && property.images[0] ? (
                          <img
                            src={property.images[0]}
                            alt={property.address}
                            className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                            <Home className="h-5 w-5 text-white/40" />
                          </div>
                        )}
                        <span className="text-white text-sm flex-1 truncate">
                          {property.address || 'Address not available'}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
