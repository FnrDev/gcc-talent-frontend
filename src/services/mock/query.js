// Shared helpers that let the mock services reproduce the back-end's query
// behaviour: the same pagination clamping (limit capped at 100, defaults of
// page 1 / limit 20) and the same response envelope. Keeping this identical to
// job.controller.js means pages behave the same before and after the swap.

const NETWORK_DELAY_MS = 220

export function delay(ms = NETWORK_DELAY_MS) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function parsePaging({ page = 1, limit = 20 } = {}) {
  const parsedPage = Number.parseInt(page, 10)
  const parsedLimit = Number.parseInt(limit, 10)

  return {
    page: Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1,
    limit: Number.isInteger(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 100) : 20,
  }
}

// Stands in for Mongo's $text index across title + description.
export function matchesSearch(item, search, extraFields = []) {
  if (typeof search !== 'string' || !search.trim()) return true

  const needle = search.trim().toLowerCase()
  const haystack = [item.title, item.description, ...extraFields].filter(Boolean).join(' ').toLowerCase()

  return needle.split(/\s+/).every((term) => haystack.includes(term))
}

export function paginate(items, { page, limit }) {
  const total = items.length
  const skip = (page - 1) * limit

  return {
    items: items.slice(skip, skip + limit),
    pagination: {
      page,
      limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    },
  }
}

export function byNewest(a, b) {
  return new Date(b.createdAt) - new Date(a.createdAt)
}
