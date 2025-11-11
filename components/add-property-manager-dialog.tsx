'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { addPropertyManager } from '@/lib/actions/property-managers'
import { Plus } from 'lucide-react'

export function AddPropertyManagerDialog() {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await addPropertyManager(formData)

    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Success',
        description: 'Property manager added successfully',
      })
      setOpen(false)
      router.refresh()
    }

    setIsLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="premium-button bg-white text-black hover:bg-white/90">
          <Plus className="mr-2 h-4 w-4" />
          Add Property Manager
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-card bg-black/95 border-white/20">
        <DialogHeader>
          <DialogTitle className="luxury-heading text-xl tracking-widest text-white">Add Property Manager</DialogTitle>
          <DialogDescription className="text-white/70">
            Add a new property manager to the system
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-white/90 uppercase tracking-wide text-sm">Name *</Label>
            <Input
              id="name"
              name="name"
              placeholder="John Doe"
              required
              disabled={isLoading}
              className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white/90 uppercase tracking-wide text-sm">Email *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="john@example.com"
              required
              disabled={isLoading}
              className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-white/90 uppercase tracking-wide text-sm">Phone</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="+1 (555) 123-4567"
              disabled={isLoading}
              className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
              className="border-white/30 hover:bg-white/10 hover:border-white/50 text-white"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="premium-button bg-white text-black hover:bg-white/90">
              {isLoading ? 'Adding...' : 'Add Manager'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
