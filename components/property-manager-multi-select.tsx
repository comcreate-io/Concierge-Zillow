'use client'

import { useState, useEffect } from 'react'
import { Check, ChevronsUpDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'

export type PropertyManager = {
  id: string
  name: string
  email: string
}

interface PropertyManagerMultiSelectProps {
  managers: PropertyManager[]
  selectedManagerIds: string[]
  onSelectionChange: (managerIds: string[]) => void
}

export function PropertyManagerMultiSelect({
  managers,
  selectedManagerIds,
  onSelectionChange,
}: PropertyManagerMultiSelectProps) {
  const [open, setOpen] = useState(false)

  const selectedManagers = managers.filter(m => selectedManagerIds.includes(m.id))

  const toggleManager = (managerId: string) => {
    console.log('Toggling manager:', managerId)
    const newSelection = selectedManagerIds.includes(managerId)
      ? selectedManagerIds.filter(id => id !== managerId)
      : [...selectedManagerIds, managerId]

    console.log('New selection:', newSelection)
    onSelectionChange(newSelection)
  }

  const removeManager = (managerId: string) => {
    onSelectionChange(selectedManagerIds.filter(id => id !== managerId))
  }

  useEffect(() => {
    console.log('PropertyManagerMultiSelect loaded with managers:', managers.length)
  }, [managers])

  if (managers.length === 0) {
    return (
      <div className="text-sm text-muted-foreground p-3 border rounded-md bg-muted/30">
        No property managers available. Please add property managers first.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-12 bg-white/5 border-white/20 hover:bg-white/10 hover:border-white/30 text-white"
            type="button"
          >
            {selectedManagers.length === 0 ? (
              <span className="text-white/60">Select property managers...</span>
            ) : (
              <span className="text-white font-medium">{selectedManagers.length} manager{selectedManagers.length > 1 ? 's' : ''} selected</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-70" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0 bg-card/95 backdrop-blur-xl border-white/20 shadow-2xl" align="start" sideOffset={8}>
          <Command className="bg-transparent">
            <CommandInput placeholder="Search managers..." className="border-b border-white/10 bg-transparent text-white placeholder:text-white/50" />
            <CommandList className="bg-transparent">
              <CommandEmpty className="text-white/70 py-6 text-center">No managers found.</CommandEmpty>
              <CommandGroup className="bg-transparent p-2">
                {managers.map((manager) => (
                  <CommandItem
                    key={manager.id}
                    value={manager.name}
                    onSelect={() => {
                      toggleManager(manager.id)
                    }}
                    className="cursor-pointer rounded-lg hover:bg-white/10 data-[selected]:bg-white/10 px-3 py-3 mb-1"
                  >
                    <Check
                      className={cn(
                        "mr-3 h-5 w-5 flex-shrink-0 text-white",
                        selectedManagerIds.includes(manager.id) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col flex-1">
                      <span className="font-semibold text-white tracking-wide">{manager.name}</span>
                      <span className="text-xs text-white/60 tracking-wide">{manager.email}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected managers badges */}
      {selectedManagers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedManagers.map((manager) => (
            <Badge
              key={manager.id}
              variant="secondary"
              className="pl-4 pr-2 py-2 gap-2 bg-white/10 text-white border-white/20 hover:bg-white/15 transition-all"
            >
              <span className="font-medium tracking-wide">{manager.name}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0.5 hover:bg-white/20 rounded"
                onClick={() => removeManager(manager.id)}
                type="button"
              >
                <X className="h-3.5 w-3.5 text-white/80" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
