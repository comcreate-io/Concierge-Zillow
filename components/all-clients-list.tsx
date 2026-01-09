'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Search,
  Copy,
  ExternalLink,
  User,
  Home,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Edit,
  UserCircle
} from 'lucide-react'
import Link from 'next/link'
import { ClientWithDetails, ClientStatus, updateClientStatus } from '@/lib/actions/clients'
import { formatDistanceToNow } from 'date-fns'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { AssignAdminsDialog } from './assign-admins-dialog'

type Props = {
  clients: ClientWithDetails[]
  currentManagerId?: string
  myClientIds?: Set<string>
}

const statusConfig: Record<ClientStatus, { label: string; icon: typeof CheckCircle; className: string }> = {
  active: {
    label: 'Active',
    icon: CheckCircle,
    className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
  },
  pending: {
    label: 'Pending',
    icon: Loader2,
    className: 'bg-amber-500/20 text-amber-400 border-amber-500/30'
  },
  closed: {
    label: 'Closed',
    icon: XCircle,
    className: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
  }
}

export function AllClientsList({ clients, currentManagerId, myClientIds = new Set() }: Props) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<ClientStatus | 'all'>('all')
  const [managerFilter, setManagerFilter] = useState<string>('all')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Get unique managers from clients
  const managers = useMemo(() => {
    const managerMap = new Map<string, { id: string; name: string; last_name?: string | null }>()
    clients.forEach(client => {
      if (client.property_managers) {
        managerMap.set(client.property_managers.id, {
          id: client.property_managers.id,
          name: client.property_managers.name,
          last_name: client.property_managers.last_name
        })
      }
    })
    return Array.from(managerMap.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [clients])

  const filteredClients = clients.filter(client => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.property_managers?.name?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'all' || client.status === statusFilter
    const matchesManager = managerFilter === 'all' || client.property_managers?.id === managerFilter

    return matchesSearch && matchesStatus && matchesManager
  })

  const copyClientLink = (clientId: string) => {
    const url = `${window.location.origin}/client/${clientId}`
    navigator.clipboard.writeText(url)
    toast.success('Client link copied to clipboard')
  }

  const handleStatusChange = async (clientId: string, newStatus: ClientStatus) => {
    const result = await updateClientStatus(clientId, newStatus)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`Client status updated to ${statusConfig[newStatus].label}`)
      router.refresh()
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch {
      return 'Unknown'
    }
  }

  const getManagerDisplayName = (manager: { name: string; last_name?: string | null } | undefined) => {
    if (!manager) return 'Unknown'
    return manager.last_name ? `${manager.name} ${manager.last_name}` : manager.name
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
          <Input
            placeholder="Search clients, emails, or managers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 sm:h-11 bg-white/5 border-white/20 text-white placeholder:text-white/50 text-sm"
          />
        </div>

        {/* Filter Row */}
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ClientStatus | 'all')}>
            <SelectTrigger className="w-full sm:w-[160px] h-10 sm:h-11 bg-white/5 border-white/20 text-white text-sm">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>

          {/* Manager Filter */}
          <Select value={managerFilter} onValueChange={setManagerFilter}>
            <SelectTrigger className="w-full sm:w-[200px] h-10 sm:h-11 bg-white/5 border-white/20 text-white text-sm">
              <SelectValue placeholder="Filter by manager" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Managers</SelectItem>
              {managers.map(manager => (
                <SelectItem key={manager.id} value={manager.id}>
                  {getManagerDisplayName(manager)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-4 gap-2 sm:gap-4">
        <Card className="glass-card">
          <CardContent className="p-2 sm:p-4 text-center">
            <p className="text-xl sm:text-3xl font-bold text-white">{filteredClients.length}</p>
            <p className="text-[10px] sm:text-xs text-white/70 uppercase tracking-wider mt-0.5 sm:mt-1">Total</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-2 sm:p-4 text-center">
            <p className="text-xl sm:text-3xl font-bold text-emerald-400">{filteredClients.filter(c => c.status === 'active').length}</p>
            <p className="text-[10px] sm:text-xs text-white/70 uppercase tracking-wider mt-0.5 sm:mt-1">Active</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-2 sm:p-4 text-center">
            <p className="text-xl sm:text-3xl font-bold text-amber-400">{filteredClients.filter(c => c.status === 'pending').length}</p>
            <p className="text-[10px] sm:text-xs text-white/70 uppercase tracking-wider mt-0.5 sm:mt-1">Pending</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-2 sm:p-4 text-center">
            <p className="text-xl sm:text-3xl font-bold text-zinc-400">{filteredClients.filter(c => c.status === 'closed').length}</p>
            <p className="text-[10px] sm:text-xs text-white/70 uppercase tracking-wider mt-0.5 sm:mt-1">Closed</p>
          </CardContent>
        </Card>
      </div>

      {/* Clients List */}
      {filteredClients.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="p-8 sm:p-12 text-center">
            <User className="h-12 w-12 sm:h-16 sm:w-16 text-white/30 mx-auto mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">No Clients Found</h3>
            <p className="text-sm sm:text-base text-white/60">
              {searchQuery || statusFilter !== 'all' || managerFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'No clients in the system yet'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2 sm:space-y-3">
          {filteredClients.map((client) => {
            const status = statusConfig[client.status || 'active']
            const StatusIcon = status.icon

            return (
              <Card key={client.id} className="glass-card hover:bg-white/10 transition-all duration-300 group">
                <CardContent className="p-3 sm:p-6">
                  {/* Mobile Layout */}
                  <div className="sm:hidden space-y-3">
                    {/* Clickable Card Area */}
                    <Link href={`/admin/client/${client.id}`} className="block">
                      {/* Header row: Icon, Name, Status */}
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-full bg-white/10 border border-white/20 flex-shrink-0">
                          <User className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-base font-semibold text-white">
                              {client.name}
                            </span>
                            <Badge className={`${status.className} border text-[10px] px-1.5 py-0.5`}>
                              <StatusIcon className="h-2.5 w-2.5 mr-0.5" />
                              {status.label}
                            </Badge>
                          </div>
                          {client.email && (
                            <p className="text-xs text-white/60 truncate mt-0.5">{client.email}</p>
                          )}
                        </div>
                      </div>

                      {/* Metadata */}
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-white/50 pl-9 mt-2">
                        <span className="flex items-center gap-1 text-purple-400/80">
                          <UserCircle className="h-3 w-3" />
                          {getManagerDisplayName(client.property_managers)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Home className="h-3 w-3" />
                          {client.property_count || 0} {(client.property_count || 0) === 1 ? 'property' : 'properties'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {mounted ? formatDate(client.updated_at) : '...'}
                        </span>
                      </div>
                    </Link>

                    {/* Mobile Actions - Outside clickable area */}
                    <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
                      {/* Assign Admins button for mobile */}
                      <AssignAdminsDialog
                        clientId={client.id}
                        clientName={client.name}
                        currentAssignments={client.shared_with_manager_ids || []}
                      />

                      <div className="flex items-center gap-1.5">
                        <Select
                          value={client.status || 'active'}
                          onValueChange={(v) => handleStatusChange(client.id, v as ClientStatus)}
                        >
                          <SelectTrigger className="flex-1 h-8 text-[10px] bg-white/5 border-white/20 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
                          onClick={() => copyClientLink(client.id)}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
                          asChild
                        >
                          <Link href={`/client/${client.id}`} target="_blank">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden sm:flex sm:items-center justify-between gap-4">
                    {/* Client Info */}
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="p-2.5 rounded-full bg-white/10 border border-white/20 flex-shrink-0">
                        <User className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <Link
                            href={`/admin/client/${client.id}`}
                            className="text-lg font-semibold text-white hover:text-white/80 transition-colors truncate"
                          >
                            {client.name}
                          </Link>
                          <Badge className={`${status.className} border text-xs`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {status.label}
                          </Badge>
                          <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 border text-xs">
                            <UserCircle className="h-3 w-3 mr-1" />
                            {getManagerDisplayName(client.property_managers)}
                          </Badge>
                        </div>
                        {client.email && (
                          <p className="text-sm text-white/60 truncate mt-0.5">{client.email}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-white/50">
                          <span className="flex items-center gap-1">
                            <Home className="h-3 w-3" />
                            {client.property_count || 0} {(client.property_count || 0) === 1 ? 'property' : 'properties'}
                          </span>
                          <span className="flex items-center gap-1" title="Last updated">
                            <Clock className="h-3 w-3" />
                            Updated: {mounted ? formatDate(client.updated_at) : 'Loading...'}
                          </span>
                          {client.last_accessed && (
                            <span className="flex items-center gap-1 text-green-400/70" title="Last time client viewed their portfolio">
                              <Clock className="h-3 w-3" />
                              Viewed: {mounted ? formatDate(client.last_accessed) : 'Loading...'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Desktop Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Assign Admins button */}
                      <AssignAdminsDialog
                        clientId={client.id}
                        clientName={client.name}
                        currentAssignments={client.shared_with_manager_ids || []}
                      />

                      <Select
                        value={client.status || 'active'}
                        onValueChange={(v) => handleStatusChange(client.id, v as ClientStatus)}
                      >
                        <SelectTrigger className="w-[120px] h-8 text-xs bg-white/5 border-white/20 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
                        onClick={() => copyClientLink(client.id)}
                        title="Copy Link"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
                        asChild
                        title="Edit"
                      >
                        <Link href={`/admin/client/${client.id}`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
                        asChild
                        title="Preview"
                      >
                        <Link href={`/client/${client.id}`} target="_blank">
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
