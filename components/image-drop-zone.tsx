'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, X, Loader2, ImageIcon } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ImageDropZoneProps {
  images: string[]
  onImagesChange: (images: string[]) => void
  disabled?: boolean
}

export function ImageDropZone({
  images,
  onImagesChange,
  disabled = false,
}: ImageDropZoneProps) {
  const { toast } = useToast()
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadingCount, setUploadingCount] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadToCloudinary = async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', 'concierge')
      formData.append('folder', 'concierge')

      const response = await fetch(
        'https://api.cloudinary.com/v1_1/dku1gnuat/image/upload',
        {
          method: 'POST',
          body: formData,
        }
      )

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`)
      }

      const data = await response.json()
      return data.secure_url
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error)
      return null
    }
  }

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    if (disabled) return

    const fileArray = Array.from(files)
    const imageFiles = fileArray.filter(file => file.type.startsWith('image/'))

    if (imageFiles.length === 0) {
      toast({
        title: 'Invalid files',
        description: 'Please select image files only (PNG, JPEG, WEBP, GIF)',
        variant: 'destructive',
      })
      return
    }

    setUploadingCount(imageFiles.length)

    const uploadPromises = imageFiles.map(file => uploadToCloudinary(file))
    const results = await Promise.all(uploadPromises)
    const successfulUploads = results.filter((url): url is string => url !== null)

    setUploadingCount(0)

    if (successfulUploads.length > 0) {
      onImagesChange([...images, ...successfulUploads])
      toast({
        title: 'Images uploaded',
        description: `Successfully uploaded ${successfulUploads.length} image(s)`,
      })
    }

    if (successfulUploads.length < imageFiles.length) {
      const failedCount = imageFiles.length - successfulUploads.length
      toast({
        title: 'Some uploads failed',
        description: `${failedCount} image(s) failed to upload`,
        variant: 'destructive',
      })
    }
  }, [images, onImagesChange, disabled, toast])

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setIsDragOver(true)
    }
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    if (disabled) return

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFiles(files)
    }
  }, [disabled, handleFiles])

  const handleClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }, [disabled])

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFiles(files)
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [handleFiles])

  const handleRemoveImage = useCallback((imageUrl: string) => {
    onImagesChange(images.filter(img => img !== imageUrl))
  }, [images, onImagesChange])

  const isUploading = uploadingCount > 0

  return (
    <div className="space-y-3">
      {/* Drop Zone */}
      <div
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-4 sm:p-6 text-center transition-all cursor-pointer
          ${isDragOver
            ? 'border-white bg-white/10'
            : 'border-white/30 hover:border-white/50 hover:bg-white/5 active:bg-white/10'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${isUploading ? 'pointer-events-none' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled || isUploading}
        />

        {isUploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 text-white/60 animate-spin" />
            <p className="text-xs sm:text-sm text-white/60">
              Uploading {uploadingCount} image{uploadingCount > 1 ? 's' : ''}...
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5 sm:gap-2">
            <div className={`p-2 sm:p-3 rounded-full ${isDragOver ? 'bg-white/20' : 'bg-white/10'}`}>
              <Upload className="h-5 w-5 sm:h-6 sm:w-6 text-white/60" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-white font-medium">
                {isDragOver ? 'Drop images here' : 'Tap to add images'}
              </p>
              <p className="text-[10px] sm:text-xs text-white/50 mt-0.5 sm:mt-1 hidden sm:block">
                or drag & drop
              </p>
            </div>
            <p className="text-[10px] sm:text-xs text-white/40">
              PNG, JPEG, WEBP, GIF
            </p>
          </div>
        )}
      </div>

      {/* Image Previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {images.map((img, idx) => (
            <div
              key={idx}
              className="relative aspect-square rounded-lg overflow-hidden bg-white/5 group"
            >
              <img
                src={img}
                alt={`Property ${idx + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = ''
                  e.currentTarget.className = 'hidden'
                }}
              />
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemoveImage(img)
                  }}
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 sm:group-hover:opacity-100 flex items-center justify-center transition-opacity active:opacity-100"
                  aria-label={`Remove image ${idx + 1}`}
                >
                  <X className="h-5 w-5 text-white" />
                </button>
              )}
              {/* Image number badge */}
              <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded">
                {idx + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state for preview area */}
      {images.length === 0 && !isUploading && (
        <div className="flex items-center gap-2 text-white/40 text-xs">
          <ImageIcon className="h-4 w-4" />
          <span>No images added yet</span>
        </div>
      )}
    </div>
  )
}
