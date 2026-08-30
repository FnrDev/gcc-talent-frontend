// MOCK DATA — there is no Gig domain on the back-end yet. This module defines
// the contract the Services pages consume, so whoever builds GET /gigs can
// match it exactly and this file becomes three api calls.
//
// The gig shape deliberately matches what Contract already expects:
// Contract.source = { type: 'gig', gig, tier } with tier in
// basic | standard | premium (back-end/models/Contract.js).
// import api from './api'

import { gigs } from './mock/gigs'
import { byNewest, delay, matchesSearch, paginate, parsePaging } from './mock/query'

const GIG_SORTS = {
  recommended: (a, b) => b.ratingAvg * b.ratingCount - a.ratingAvg * a.ratingCount,
  newest: byNewest,
  price_low: (a, b) => a.startingPrice - b.startingPrice,
  price_high: (a, b) => b.startingPrice - a.startingPrice,
  rating: (a, b) => b.ratingAvg - a.ratingAvg,
}

// Thresholds are in BHD, matching the prices stored on the packages.
const PRICE_BANDS = {
  under_25: (gig) => gig.startingPrice < 25,
  '25_75': (gig) => gig.startingPrice >= 25 && gig.startingPrice <= 75,
  over_75: (gig) => gig.startingPrice > 75,
}

// GET /gigs
async function getGigs(params = {}) {
  // return (await api.get('/gigs', { params })).data
  await delay()

  const { category, skill, search, priceBand, deliveryDays, sort = 'recommended' } = params
  const paging = parsePaging(params)
  const maxDelivery = Number.parseInt(deliveryDays, 10)

  const filtered = gigs
    .filter((gig) => (category ? gig.category?._id === category : true))
    .filter((gig) => (skill ? gig.skills.some((s) => s._id === skill) : true))
    .filter((gig) => (priceBand && PRICE_BANDS[priceBand] ? PRICE_BANDS[priceBand](gig) : true))
    .filter((gig) => (Number.isInteger(maxDelivery) ? gig.fastestDelivery <= maxDelivery : true))
    .filter((gig) => matchesSearch(gig, search, [gig.seller?.name, ...gig.skills.map((s) => s.name)]))
    .sort(GIG_SORTS[sort] ?? GIG_SORTS.recommended)

  const { items, pagination } = paginate(filtered, paging)

  return { success: true, data: { gigs: items, pagination } }
}

// GET /gigs/:id
async function getGig(id) {
  // return (await api.get(`/gigs/${id}`)).data
  await delay()

  const gig = gigs.find((item) => item._id === id)

  if (!gig) {
    const error = new Error('Service not found.')
    error.status = 404
    throw error
  }

  return { success: true, data: { gig } }
}

// GET /gigs/:id/similar
async function getSimilarGigs(id, limit = 6) {
  // return (await api.get(`/gigs/${id}/similar`, { params: { limit } })).data
  await delay(120)

  const gig = gigs.find((item) => item._id === id)
  const similar = gigs
    .filter((item) => item._id !== id && item.category?._id === gig?.category?._id)
    .sort(GIG_SORTS.recommended)
    .slice(0, limit)

  return { success: true, data: { gigs: similar } }
}

export { getGigs, getGig, getSimilarGigs }
