import { getCurrentManagerProfile } from '@/lib/actions/clients'
import { ProfilePictureUpload } from '@/components/profile-picture-upload'
import { ProfileEditForm } from '@/components/profile-edit-form'
import { Card, CardContent } from '@/components/ui/card'
import { Mail, AlertCircle, Briefcase } from 'lucide-react'

export default async function MyProfilePage() {
  // Get current manager profile
  const { data: managerProfile, error: managerError } = await getCurrentManagerProfile()

  // Show error if manager profile not found
  if (managerError || !managerProfile) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div>
          <h1 className="luxury-heading text-3xl sm:text-4xl font-bold tracking-widest text-white mb-2">My Profile</h1>
          <p className="text-white/70 mt-2 tracking-wide">View and manage your profile information</p>
        </div>

        <Card className="elevated-card overflow-hidden">
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-6" />
            <h3 className="text-2xl font-semibold mb-3 text-white">Profile Not Found</h3>
            <p className="text-white/70 mb-6 max-w-md mx-auto">
              Your account is not linked to a property manager profile.
              Please contact an administrator to set up your profile.
            </p>
            <p className="text-sm text-white/50">
              Error: {managerError || 'Manager profile not found'}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Build full name
  const fullName = managerProfile.last_name
    ? `${managerProfile.name} ${managerProfile.last_name}`
    : managerProfile.name

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Section */}
      <div>
        <h1 className="luxury-heading text-3xl sm:text-4xl font-bold tracking-widest text-white mb-2">My Profile</h1>
        <p className="text-white/70 mt-2 tracking-wide">View and manage your profile information</p>
      </div>

      {/* Profile Overview Card */}
      <Card className="elevated-card overflow-hidden">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row md:items-start gap-8">
            {/* Profile Picture */}
            <div className="flex flex-col items-center gap-4">
              <ProfilePictureUpload
                managerId={managerProfile.id}
                currentPictureUrl={managerProfile.profile_picture_url}
                managerName={fullName}
              />
            </div>

            {/* Manager Info */}
            <div className="flex-1">
              <h2 className="luxury-heading text-2xl sm:text-3xl md:text-4xl font-bold tracking-[0.15em] text-white mb-2">
                {fullName}
              </h2>
              {managerProfile.title && (
                <div className="flex items-center gap-2 text-white/70 mb-4">
                  <Briefcase className="h-4 w-4" />
                  <span className="tracking-wide">{managerProfile.title}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-white/80">
                <div className="p-2 bg-white/10 rounded-lg">
                  <Mail className="h-4 w-4 text-white" />
                </div>
                <span className="tracking-wide">{managerProfile.email}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Form */}
      <ProfileEditForm
        managerId={managerProfile.id}
        initialData={{
          name: managerProfile.name,
          last_name: managerProfile.last_name,
          title: managerProfile.title,
          phone: managerProfile.phone,
          instagram_url: managerProfile.instagram_url,
          facebook_url: managerProfile.facebook_url,
          linkedin_url: managerProfile.linkedin_url,
          twitter_url: managerProfile.twitter_url,
        }}
      />
    </div>
  )
}
