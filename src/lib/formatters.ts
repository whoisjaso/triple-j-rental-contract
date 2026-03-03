/**
 * Format a string of digits as a US phone number: (832) 400-5294
 * Strips all non-digit characters first, then applies formatting.
 */
export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 10)
  if (digits.length === 0) return ''
  if (digits.length <= 3) return `(${digits}`
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
}

/**
 * Format a string of digits as US currency: $3,200
 * Strips all non-digit characters, adds $ prefix and comma grouping.
 */
export function formatCurrency(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (digits.length === 0) return ''
  const num = parseInt(digits, 10)
  return `$${num.toLocaleString('en-US')}`
}
