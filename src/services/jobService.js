// MOCK DATA — this module is the only seam between the Jobs pages and the API.
// The back-end endpoints already exist (GET /jobs, GET /jobs/:id); when you are
// ready to use them, replace each function body with the commented api call.
// The params accepted and the shapes returned here are already what the real
// endpoints accept and return, so no component needs to change.
// import api from './api'

import { jobs } from './mock/jobs'
import { byNewest, delay, matchesSearch, paginate, parsePaging } from './mock/query'

const JOB_SORTS = {
  newest: byNewest,
  oldest: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
  budget_high: (a, b) => (b.budgetMax ?? b.budgetMin ?? 0) - (a.budgetMax ?? a.budgetMin ?? 0),
  budget_low: (a, b) => (a.budgetMin ?? a.budgetMax ?? 0) - (b.budgetMin ?? b.budgetMax ?? 0),
  proposals_low: (a, b) => a.proposalsCount - b.proposalsCount,
}

// GET /jobs — filters mirror the query params job.controller.js accepts:
// category, skill, search, budgetType, experienceLevel, page, limit.
async function getJobs(params = {}) {
  // return (await api.get('/jobs', { params })).data
  await delay()

  const { category, skill, search, budgetType, experienceLevel, sort = 'newest' } = params
  const paging = parsePaging(params)

  const filtered = jobs
    .filter((job) => (category ? job.category?._id === category : true))
    .filter((job) => (skill ? job.skills.some((s) => s._id === skill) : true))
    .filter((job) => (budgetType ? job.budgetType === budgetType : true))
    .filter((job) => (experienceLevel ? job.experienceLevel === experienceLevel : true))
    .filter((job) => matchesSearch(job, search, job.skills.map((s) => s.name)))
    .sort(JOB_SORTS[sort] ?? byNewest)

  const { items, pagination } = paginate(filtered, paging)

  return { success: true, data: { jobs: items, pagination } }
}

// GET /jobs/:id
async function getJob(id) {
  // return (await api.get(`/jobs/${id}`)).data
  await delay()

  const job = jobs.find((item) => item._id === id)

  if (!job) {
    const error = new Error('Job not found.')
    error.status = 404
    throw error
  }

  return { success: true, data: { job } }
}

// GET /jobs/:id/similar — not yet implemented server-side; same category,
// excluding the job itself, newest first.
async function getSimilarJobs(id, limit = 6) {
  // return (await api.get(`/jobs/${id}/similar`, { params: { limit } })).data
  await delay(120)

  const job = jobs.find((item) => item._id === id)
  const similar = jobs
    .filter((item) => item._id !== id && item.category?._id === job?.category?._id)
    .sort(byNewest)
    .slice(0, limit)

  return { success: true, data: { jobs: similar } }
}

export { getJobs, getJob, getSimilarJobs }
