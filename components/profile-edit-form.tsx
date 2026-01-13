'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Save, User, Briefcase, Phone } from 'lucide-react'
import { Instagram, Facebook, Linkedin, Twitter } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'

interface ProfileEditFormProps {
  managerId: string
  initialData: {
    name: string
    last_name: string | null
    title: string | null
    phone: string | null
    instagram_url: string | null
    facebook_url: string | null
    linkedin_url: string | null
    twitter_url: string | null
  }
}

export function ProfileEditForm({ managerId, initialData }: ProfileEditFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: initialData.name || '',
    last_name: initialData.last_name || '',
    title: initialData.title || '',
    phone: initialData.phone || '',
    instagram_url: initialData.instagram_url || '',
    facebook_url: initialData.facebook_url || '',
    linkedin_url: initialData.linkedin_url || '',
    twitter_url: initialData.twitter_url || '',
  })

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Error',
        description: 'First name is required',
        variant: 'destructive',
      })
      return
    }

    setIsSaving(true)

    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('property_managers')
        .update({
          name: formData.name.trim(),
          last_name: formData.last_name.trim() || null,
          title: formData.title.trim() || null,
          phone: formData.phone.trim() || null,
          instagram_url: formData.instagram_url.trim() || null,
          facebook_url: formData.facebook_url.trim() || null,
          linkedin_url: formData.linkedin_url.trim() || null,
          twitter_url: formData.twitter_url.trim() || null,
        })
        .eq('id', managerId)

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      })
      router.refresh()
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className="glass-card border-white/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <User className="h-5 w-5" />
          Profile Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-white">
              First Name <span className="text-red-400">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="John"
              className="bg-white/5 border-white/30 text-white placeholder:text-white/40"
              disabled={isSaving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="last_name" className="text-white">
              Last Name
            </Label>
            <Input
              id="last_name"
              value={formData.last_name}
              onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
              placeholder="Doe"
              className="bg-white/5 border-white/30 text-white placeholder:text-white/40"
              disabled={isSaving}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="title" className="text-white flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Title / Role
          </Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="e.g., Senior Property Manager, Real Estate Agent"
            className="bg-white/5 border-white/30 text-white placeholder:text-white/40"
            disabled={isSaving}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="text-white flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Phone Number
          </Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            placeholder="+1 (555) 123-4567"
            className="bg-white/5 border-white/30 text-white placeholder:text-white/40"
            disabled={isSaving}
          />
        </div>

        {/* Social Media Section */}
        <div className="pt-6 border-t border-white/10">
          <h3 className="text-white font-medium mb-4 flex items-center gap-2">
            Social Media Links
            <span className="text-white/50 text-sm font-normal">(displayed on client portal)</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="instagram_url" className="text-white flex items-center gap-2">
                <Instagram className="h-4 w-4" />
                Instagram
              </Label>
              <Input
                id="instagram_url"
                value={formData.instagram_url}
                onChange={(e) => setFormData(prev => ({ ...prev, instagram_url: e.target.value }))}
                placeholder="https://instagram.com/username"
                className="bg-white/5 border-white/30 text-white placeholder:text-white/40"
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="facebook_url" className="text-white flex items-center gap-2">
                <Facebook className="h-4 w-4" />
                Facebook
              </Label>
              <Input
                id="facebook_url"
                value={formData.facebook_url}
                onChange={(e) => setFormData(prev => ({ ...prev, facebook_url: e.target.value }))}
                placeholder="https://facebook.com/username"
                className="bg-white/5 border-white/30 text-white placeholder:text-white/40"
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkedin_url" className="text-white flex items-center gap-2">
                <Linkedin className="h-4 w-4" />
                LinkedIn
              </Label>
              <Input
                id="linkedin_url"
                value={formData.linkedin_url}
                onChange={(e) => setFormData(prev => ({ ...prev, linkedin_url: e.target.value }))}
                placeholder="https://linkedin.com/in/username"
                className="bg-white/5 border-white/30 text-white placeholder:text-white/40"
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="twitter_url" className="text-white flex items-center gap-2">
                <Twitter className="h-4 w-4" />
                Twitter / X
              </Label>
              <Input
                id="twitter_url"
                value={formData.twitter_url}
                onChange={(e) => setFormData(prev => ({ ...prev, twitter_url: e.target.value }))}
                placeholder="https://twitter.com/username"
                className="bg-white/5 border-white/30 text-white placeholder:text-white/40"
                disabled={isSaving}
              />
            </div>
          </div>
        </div>

        <div className="pt-4">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-white text-black hover:bg-white/90"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
