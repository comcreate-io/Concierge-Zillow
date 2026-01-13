// Script to update existing property addresses to include city and state
// Run with: npx tsx scripts/update-property-addresses.ts

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://esdkkyekfnpmwifyohac.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzZGtreWVrZm5wbXdpZnlvaGFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1NTExNTksImV4cCI6MjA3ODEyNzE1OX0.pLBFkoQJ42hS_8bTXjqfwYPrMyLzq_GiIpEdAu4itj4'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// US State abbreviations
const US_STATES: Record<string, string> = {
  'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas',
  'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
  'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho',
  'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas',
  'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
  'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi',
  'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada',
  'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York',
  'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma',
  'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
  'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah',
  'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia',
  'WI': 'Wisconsin', 'WY': 'Wyoming', 'DC': 'District of Columbia'
}

function parseAddressFromZillowUrl(url: string): { street: string; city: string; state: string; zipcode: string } | null {
  if (!url) return null

  try {
    // Extract the address part from URL like:
    // https://www.zillow.com/homedetails/3448-Copley-Ave-San-Diego-CA-92116/2096949152_zpid/
    const match = url.match(/homedetails\/([^/]+)\//)
    if (!match) return null

    const addressPart = match[1]
    // Split by hyphens: 3448-Copley-Ave-San-Diego-CA-92116
    const parts = addressPart.split('-')

    if (parts.length < 4) return null

    // Find the state abbreviation (2 uppercase letters)
    let stateIndex = -1
    for (let i = parts.length - 1; i >= 0; i--) {
      if (parts[i].length === 2 && US_STATES[parts[i].toUpperCase()]) {
        stateIndex = i
        break
      }
    }

    if (stateIndex === -1) return null

    // Zipcode is after state
    const zipcode = parts[stateIndex + 1] || ''
    const state = parts[stateIndex].toUpperCase()

    // Find where the city starts (usually after street name)
    // Street number is first, then street name words, then city words, then state
    // This is tricky - we'll try to find common street suffixes
    const streetSuffixes = ['Ave', 'St', 'Rd', 'Dr', 'Ln', 'Blvd', 'Way', 'Ct', 'Pl', 'Cir', 'Ter', 'Pkwy', 'Hwy']

    let streetEndIndex = -1
    for (let i = 0; i < stateIndex; i++) {
      const part = parts[i]
      if (streetSuffixes.some(suffix => part.toLowerCase() === suffix.toLowerCase())) {
        streetEndIndex = i
        break
      }
    }

    if (streetEndIndex === -1) {
      // Fallback: assume first 3 parts are street, rest is city
      streetEndIndex = Math.min(2, stateIndex - 2)
    }

    const streetParts = parts.slice(0, streetEndIndex + 1)
    const cityParts = parts.slice(streetEndIndex + 1, stateIndex)

    const street = streetParts.join(' ')
    const city = cityParts.join(' ')

    return { street, city, state, zipcode }
  } catch (e) {
    console.error('Error parsing URL:', url, e)
    return null
  }
}

function buildFullAddress(parsed: { street: string; city: string; state: string; zipcode: string }): string {
  const parts = [parsed.street]
  if (parsed.city) parts.push(parsed.city)
  if (parsed.state && parsed.zipcode) {
    parts.push(`${parsed.state} ${parsed.zipcode}`)
  } else if (parsed.state) {
    parts.push(parsed.state)
  }
  return parts.join(', ')
}

async function updatePropertyAddresses() {
  console.log('Fetching properties...')

  const { data: properties, error } = await supabase
    .from('properties')
    .select('id, address, zillow_url')

  if (error) {
    console.error('Error fetching properties:', error)
    return
  }

  console.log(`Found ${properties?.length || 0} properties`)

  let updated = 0
  let skipped = 0

  for (const property of properties || []) {
    // Skip if address already has a state
    if (property.address) {
      const hasState = Object.keys(US_STATES).some(state =>
        property.address.includes(`, ${state} `) || property.address.includes(`, ${state},`) || property.address.endsWith(` ${state}`)
      )
      if (hasState) {
        console.log(`Skipping ${property.address} - already has state`)
        skipped++
        continue
      }
    }

    if (!property.zillow_url) {
      console.log(`Skipping property ${property.id} - no Zillow URL`)
      skipped++
      continue
    }

    const parsed = parseAddressFromZillowUrl(property.zillow_url)
    if (!parsed) {
      console.log(`Could not parse URL: ${property.zillow_url}`)
      skipped++
      continue
    }

    const newAddress = buildFullAddress(parsed)
    console.log(`Updating: "${property.address}" -> "${newAddress}"`)

    const { error: updateError } = await supabase
      .from('properties')
      .update({ address: newAddress })
      .eq('id', property.id)

    if (updateError) {
      console.error(`Error updating property ${property.id}:`, updateError)
    } else {
      updated++
    }
  }

  console.log(`\nDone! Updated: ${updated}, Skipped: ${skipped}`)
}

updatePropertyAddresses()
