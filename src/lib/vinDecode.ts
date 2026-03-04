const NHTSA_URL = 'https://vpic.nhtsa.dot.gov/api/vehicles/decodevin'

/**
 * Title-case a string: "CHEVROLET" → "Chevrolet", "grand cherokee" → "Grand Cherokee"
 */
function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export interface VinDecodeResult {
  year: string
  make: string
  model: string
  /** Formatted as "Year Make Model" in title case */
  yearMakeModel: string
}

/**
 * Decode a VIN using the free NHTSA vPIC API.
 * Returns year, make, model individually and as a combined title-cased string.
 * Throws on network error or if VIN cannot be decoded.
 */
export async function decodeVin(vin: string): Promise<VinDecodeResult> {
  const cleaned = vin.trim().toUpperCase()
  if (cleaned.length !== 17) {
    throw new Error('VIN must be exactly 17 characters.')
  }

  const res = await fetch(`${NHTSA_URL}/${cleaned}?format=json`)
  if (!res.ok) {
    throw new Error('NHTSA API request failed. Please try again.')
  }

  const json = await res.json()
  const results: { Variable: string; Value: string | null }[] = json.Results ?? []

  const get = (variable: string): string => {
    const entry = results.find((r) => r.Variable === variable)
    return entry?.Value?.trim() || ''
  }

  const year = get('Model Year')
  const make = get('Make')
  const model = get('Model')

  if (!year && !make && !model) {
    throw new Error('Could not decode this VIN. Please check and try again.')
  }

  const titleMake = make ? toTitleCase(make) : ''
  const titleModel = model ? toTitleCase(model) : ''

  return {
    year,
    make: titleMake,
    model: titleModel,
    yearMakeModel: [year, titleMake, titleModel].filter(Boolean).join(' '),
  }
}
