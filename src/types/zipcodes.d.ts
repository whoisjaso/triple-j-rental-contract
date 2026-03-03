declare module 'zipcodes' {
  interface ZipLookupResult {
    zip: string
    latitude: number
    longitude: number
    city: string
    state: string
    country: string
  }

  export function lookup(zip: string): ZipLookupResult | undefined
}
