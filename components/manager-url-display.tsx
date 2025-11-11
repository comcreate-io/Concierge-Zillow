'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Copy, Check } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function ManagerUrlDisplay({ managerId }: { managerId: string }) {
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const url = typeof window !== 'undefined'
    ? `${window.location.origin}/manager/${managerId}`
    : `/manager/${managerId}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast({
        title: 'Copied!',
        description: 'Property manager URL copied to clipboard',
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to copy URL',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="flex gap-2">
      <Input
        value={url}
        readOnly
        className="font-mono text-sm"
        onClick={(e) => e.currentTarget.select()}
      />
      <Button
        variant="outline"
        size="icon"
        onClick={handleCopy}
        title="Copy URL"
      >
        {copied ? (
          <Check className="h-4 w-4 text-green-600" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
    </div>
  )
}
