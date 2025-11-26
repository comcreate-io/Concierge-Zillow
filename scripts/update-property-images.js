// Script to re-scrape images for existing properties and upload to Cloudinary
// Run with: node scripts/update-property-images.js

require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')
const cloudinary = require('cloudinary').v2

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Configure Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const HASDATA_API_KEY = process.env.NEXT_PUBLIC_HASDATA_API_KEY

async function uploadImageToCloudinary(imageUrl, folderPath) {
  try {
    const result = await cloudinary.uploader.upload(imageUrl, {
      folder: folderPath,
      resource_type: 'image',
    })
    return result.secure_url
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error.message)
    return null
  }
}

async function scrapePropertyImages(zillowUrl) {
  try {
    const response = await fetch('https://api.hasdata.com/scrape/zillow/property', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': HASDATA_API_KEY
      },
      body: JSON.stringify({
        url: zillowUrl,
        scrape_description: false
      })
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`)
    }

    const data = await response.json()
    const propertyData = data.property || data
    return propertyData.photos || propertyData.images || []
  } catch (error) {
    console.error('Error scraping:', error.message)
    return []
  }
}

async function updatePropertyImages() {
  console.log('Fetching properties with empty images...')

  // Get all properties
  const { data: properties, error } = await supabase
    .from('properties')
    .select('id, address, zillow_url, images')

  if (error) {
    console.error('Error fetching properties:', error)
    return
  }

  // Filter properties with empty or no images
  const propertiesNeedingImages = properties.filter(p =>
    !p.images || p.images.length === 0
  )

  console.log(`Found ${propertiesNeedingImages.length} properties needing images\n`)

  for (const property of propertiesNeedingImages) {
    console.log(`\n--- Processing: ${property.address} ---`)

    if (!property.zillow_url) {
      console.log('  No Zillow URL, skipping...')
      continue
    }

    // Scrape images from Zillow
    console.log('  Scraping images from Zillow...')
    const zillowImages = await scrapePropertyImages(property.zillow_url)

    if (zillowImages.length === 0) {
      console.log('  No images found on Zillow, skipping...')
      continue
    }

    console.log(`  Found ${zillowImages.length} images`)

    // Create folder name from address
    const folderName = property.address
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 100)
    const folderPath = `Concierge/${folderName}`

    // Upload to Cloudinary
    console.log(`  Uploading to Cloudinary folder: ${folderPath}`)
    const cloudinaryUrls = []

    for (let i = 0; i < zillowImages.length; i++) {
      const url = await uploadImageToCloudinary(zillowImages[i], folderPath)
      if (url) {
        cloudinaryUrls.push(url)
        process.stdout.write(`  Uploaded ${i + 1}/${zillowImages.length}\r`)
      }
    }
    console.log(`\n  Successfully uploaded ${cloudinaryUrls.length} images`)

    // Update property in Supabase
    if (cloudinaryUrls.length > 0) {
      const { error: updateError } = await supabase
        .from('properties')
        .update({ images: cloudinaryUrls })
        .eq('id', property.id)

      if (updateError) {
        console.log(`  ERROR updating Supabase: ${updateError.message}`)
      } else {
        console.log(`  Updated property in Supabase with ${cloudinaryUrls.length} images`)
      }
    }

    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000))
  }

  console.log('\n\nDone!')
}

updatePropertyImages()
