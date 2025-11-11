'use client'

import { useState } from 'react'
import { Check, ChevronDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'

export type PropertyManager = {
  id: string
  name: string
  email: string
}

interface PropertyManagerSelectProps {
  managers: PropertyManager[]
  selectedManagerIds: string[]
  onSelectionChange: (managerIds: string[]) => void
}

export function PropertyManagerSelect({
  managers,
  selectedManagerIds,
  onSelectionChange,
}: PropertyManagerSelectProps) {
  const [isOpen, setIsOpen] = useState(false)

  const selectedManagers = managers.filter(m => selectedManagerIds.includes(m.id))

  const toggleManager = (managerId: string) => {
    const newSelection = selectedManagerIds.includes(managerId)
      ? selectedManagerIds.filter(id => id !== managerId)
      : [...selectedManagerIds, managerId]

    onSelectionChange(newSelection)
  }

  const removeManager = (managerId: string) => {
    onSelectionChange(selectedManagerIds.filter(id => id !== managerId))
  }

  if (managers.length === 0) {
    return (
      <div className="text-sm text-white/60 p-4 border border-white/20 rounded-lg bg-white/5">
        No property managers available. Please add property managers first.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Dropdown Button */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full h-12 bg-white/5 border border-white/20 hover:bg-white/10 hover:border-white/30 text-white rounded-lg px-4 py-3 flex items-center justify-between transition-all focus:outline-none focus:ring-2 focus:ring-white/30"
        >
          {selectedManagers.length === 0 ? (
            <span className="text-white/60">Select property managers...</span>
          ) : (
            <span className="text-white font-medium">
              {selectedManagers.length} manager{selectedManagers.length > 1 ? 's' : ''} selected
            </span>
          )}
          <ChevronDown className={cn(
            "h-4 w-4 transition-transform",
            isOpen && "transform rotate-180"
          )} />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown Content */}
            <div className="absolute z-20 w-full mt-2 bg-black/95 backdrop-blur-xl border border-white/20 rounded-lg shadow-2xl max-h-80 overflow-y-auto">
              <div className="p-2">
                {managers.map((manager) => {
                  const isSelected = selectedManagerIds.includes(manager.id)

                  return (
                    <div
                      key={manager.id}
                      onClick={() => toggleManager(manager.id)}
                      className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-white/10 cursor-pointer transition-colors mb-1"
                    >
                      <div className={cn(
                        "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                        isSelected
                          ? "bg-white border-white"
                          : "border-white/40"
                      )}>
                        {isSelected && (
                          <Check className="h-3.5 w-3.5 text-black" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-white tracking-wide text-sm">
                          {manager.name}
                        </div>
                        <div className="text-xs text-white/60 tracking-wide">
                          {manager.email}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Selected Managers Badges */}
      {selectedManagers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedManagers.map((manager) => (
            <Badge
              key={manager.id}
              variant="secondary"
              className="pl-4 pr-2 py-2 gap-2 bg-white/10 text-white border-white/20 hover:bg-white/15 transition-all"
            >
              <span className="font-medium tracking-wide">{manager.name}</span>
              <button
                type="button"
                className="h-auto p-0.5 hover:bg-white/20 rounded transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  removeManager(manager.id)
                }}
              >
                <X className="h-3.5 w-3.5 text-white/80" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
