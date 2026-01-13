'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { UserPlus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

type PropertyManager = {
  id: string
  name: string
  last_name: string
  email: string
}

type AssignAdminsDialogProps = {
  clientId: string
  clientName: string
  currentAssignments: string[] // Array of manager IDs who have access
}

export function AssignAdminsDialog({ clientId, clientName, currentAssignments }: AssignAdminsDialogProps) {
  const [open, setOpen] = useState(false)
  const [managers, setManagers] = useState<PropertyManager[]>([])
  const [selectedManagerIds, setSelectedManagerIds] = useState<Set<string>>(new Set(currentAssignments))
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      loadManagers()
      // Reset selections to current assignments when dialog opens
      setSelectedManagerIds(new Set(currentAssignments))
    }
  }, [open, currentAssignments])

  const loadManagers = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/property-managers')
      if (response.ok) {
        const data = await response.json()
        setManagers(data)
      } else {
        toast.error('Failed to load admins')
      }
    } catch (error) {
      console.error('Error loading managers:', error)
      toast.error('Error loading admins')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleManager = (managerId: string) => {
    const newSelected = new Set(selectedManagerIds)
    if (newSelected.has(managerId)) {
      newSelected.delete(managerId)
    } else {
      newSelected.add(managerId)
    }
    setSelectedManagerIds(newSelected)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/clients/assign-admins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId,
          managerIds: Array.from(selectedManagerIds),
        }),
      })

      if (response.ok) {
        toast.success('Admin assignments updated successfully')
        setOpen(false)
        // Refresh the page to show updated data
        window.location.reload()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update assignments')
      }
    } catch (error) {
      console.error('Error saving assignments:', error)
      toast.error('Error updating assignments')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-white/30 hover:bg-white/10 text-white w-full sm:w-auto"
        >
          <UserPlus className="h-3 w-3 mr-1" />
          Assign Admins
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-black/95 border-white/20 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl text-white">Assign Admins to Client</DialogTitle>
          <DialogDescription className="text-white/70">
            Select which admins should have access to <span className="font-semibold text-white">{clientName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-white/50" />
            </div>
          ) : managers.length === 0 ? (
            <p className="text-white/50 text-center py-8">No admins found</p>
          ) : (
            managers.map((manager) => (
              <div
                key={manager.id}
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white/5 transition-colors"
              >
                <Checkbox
                  id={`manager-${manager.id}`}
                  checked={selectedManagerIds.has(manager.id)}
                  onCheckedChange={() => handleToggleManager(manager.id)}
                  className="border-white/30 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                />
                <Label
                  htmlFor={`manager-${manager.id}`}
                  className="flex-1 cursor-pointer text-white"
                >
                  <div className="font-medium">
                    {manager.name} {manager.last_name}
                  </div>
                  <div className="text-sm text-white/60">{manager.email}</div>
                </Label>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={saving}
            className="border-white/30 hover:bg-white/10 text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || loading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Assignments'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
