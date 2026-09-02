import i18n from '@/i18n'

const currencyFormatters = new Map()

// Gulf digital products overwhelmingly use Latin digits, so Arabic keeps the
// `latn` numbering system rather than defaulting to Arabic-Indic (٠١٢٣).
function localeTag() {
  return i18n.language === 'ar' ? 'ar-u-nu-latn' : 'en-US'
}

// The marketplace prices in Bahraini dinar. BHD subdivides into 1000 fils, so
// Intl would render three decimals by default ("BHD 45.000"); listing prices
// are whole dinar, so both fraction bounds are pinned to zero.
export const DEFAULT_CURRENCY = 'BHD'

export function formatCurrency(amount, currency = DEFAULT_CURRENCY) {
  if (typeof amount !== 'number' || Number.isNaN(amount)) return '—'

  const cacheKey = `${localeTag()}:${currency}`
  if (!currencyFormatters.has(cacheKey)) {
    currencyFormatters.set(
      cacheKey,
      new Intl.NumberFormat(localeTag(), {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }),
    )
  }

  return currencyFormatters.get(cacheKey).format(amount)
}

// "BHD 500 – BHD 2,000", "BHD 40/hr", or a single value when only one bound is set.
export function formatBudget({ budgetType, budgetMin, budgetMax, currency = DEFAULT_CURRENCY }) {
  const suffix = budgetType === 'hourly' ? '/hr' : ''

  if (typeof budgetMin === 'number' && typeof budgetMax === 'number' && budgetMin !== budgetMax) {
    return `${formatCurrency(budgetMin, currency)} – ${formatCurrency(budgetMax, currency)}${suffix}`
  }

  const single = budgetMin ?? budgetMax
  return typeof single === 'number'
    ? `${formatCurrency(single, currency)}${suffix}`
    : i18n.t('format.budgetNotSet')
}

const RELATIVE_UNITS = [
  ['year', 31536000],
  ['month', 2592000],
  ['week', 604800],
  ['day', 86400],
  ['hour', 3600],
  ['minute', 60],
]

const relativeFormatters = new Map()

function relativeFormatter() {
  const tag = localeTag()
  if (!relativeFormatters.has(tag)) {
    relativeFormatters.set(tag, new Intl.RelativeTimeFormat(tag, { numeric: 'auto' }))
  }
  return relativeFormatters.get(tag)
}

export function timeAgo(date) {
  if (!date) return ''

  const seconds = (new Date(date) - Date.now()) / 1000
  for (const [unit, secondsPerUnit] of RELATIVE_UNITS) {
    if (Math.abs(seconds) >= secondsPerUnit) {
      return relativeFormatter().format(Math.round(seconds / secondsPerUnit), unit)
    }
  }
  return i18n.t('format.justNow')
}

export function formatDate(date) {
  if (!date) return '—'
  return new Intl.DateTimeFormat(localeTag(), { dateStyle: 'medium' }).format(new Date(date))
}

export function formatDeliveryDays(days) {
  if (!days) return '—'
  return i18n.t('format.dayDelivery', { count: days })
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

const EXPERIENCE_KEYS = {
  entry: 'jobs.entryLevel',
  intermediate: 'jobs.intermediate',
  expert: 'jobs.expert',
}

const BUDGET_TYPE_KEYS = {
  fixed: 'jobs.fixedPrice',
  hourly: 'format.hourly',
}

// Functions rather than constant maps: the label has to be resolved at render
// time, after a language switch, not frozen at module load.
export function experienceLabel(level) {
  return EXPERIENCE_KEYS[level] ? i18n.t(EXPERIENCE_KEYS[level]) : i18n.t('jobs.anyLevel')
}

export function budgetTypeLabel(type) {
  return BUDGET_TYPE_KEYS[type] ? i18n.t(BUDGET_TYPE_KEYS[type]) : ''
}
