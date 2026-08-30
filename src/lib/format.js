const currencyFormatters = new Map()

// The marketplace prices in Bahraini dinar. BHD subdivides into 1000 fils, so
// Intl would render three decimals by default ("BHD 45.000"); listing prices
// are whole dinar, so both fraction bounds are pinned to zero.
export const DEFAULT_CURRENCY = 'BHD'

export function formatCurrency(amount, currency = DEFAULT_CURRENCY) {
  if (typeof amount !== 'number' || Number.isNaN(amount)) return '—'

  if (!currencyFormatters.has(currency)) {
    currencyFormatters.set(
      currency,
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }),
    )
  }

  return currencyFormatters.get(currency).format(amount)
}

// "BHD 500 – BHD 2,000", "BHD 40/hr", or a single value when only one bound is set.
export function formatBudget({ budgetType, budgetMin, budgetMax, currency = DEFAULT_CURRENCY }) {
  const suffix = budgetType === 'hourly' ? '/hr' : ''

  if (typeof budgetMin === 'number' && typeof budgetMax === 'number' && budgetMin !== budgetMax) {
    return `${formatCurrency(budgetMin, currency)} – ${formatCurrency(budgetMax, currency)}${suffix}`
  }

  const single = budgetMin ?? budgetMax
  return typeof single === 'number' ? `${formatCurrency(single, currency)}${suffix}` : 'Budget not set'
}

const RELATIVE_UNITS = [
  ['year', 31536000],
  ['month', 2592000],
  ['week', 604800],
  ['day', 86400],
  ['hour', 3600],
  ['minute', 60],
]

const relativeFormatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

export function timeAgo(date) {
  if (!date) return ''

  const seconds = (new Date(date) - Date.now()) / 1000
  for (const [unit, secondsPerUnit] of RELATIVE_UNITS) {
    if (Math.abs(seconds) >= secondsPerUnit) {
      return relativeFormatter.format(Math.round(seconds / secondsPerUnit), unit)
    }
  }
  return 'just now'
}

export function formatDate(date) {
  if (!date) return '—'
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(date))
}

export function formatDeliveryDays(days) {
  if (!days) return '—'
  return days === 1 ? '1 day delivery' : `${days} days delivery`
}

export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

export const EXPERIENCE_LABELS = {
  entry: 'Entry level',
  intermediate: 'Intermediate',
  expert: 'Expert',
}

export const BUDGET_TYPE_LABELS = {
  fixed: 'Fixed price',
  hourly: 'Hourly',
}
