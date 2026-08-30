import api from './api'

async function getCategories() {
  const response = await api.get('/categories', {
    params: { limit: 100 },
  })

  return response.data.data.categories
}

async function getSkills(category) {
  const response = await api.get('/skills', {
    params: { category },
  })

  return response.data.skills
}

async function createJob(job) {
  const response = await api.post('/jobs', job)

  return response.data.data.job
}

async function publishJob(jobId) {
  const response = await api.post(`/jobs/my/${jobId}/publish`)

  return response.data.data.job
}

async function getJobs(params = {}) {
  const response = await api.get('/jobs', { params })

  return response.data.data
}

async function getJob(jobId) {
  const response = await api.get(`/jobs/${jobId}`)

  return response.data.data.job
}

async function getMyJobs(params = {}) {
  const response = await api.get('/jobs/my/list', { params })

  return response.data.data
}

async function getMyJob(jobId) {
  const response = await api.get(`/jobs/my/${jobId}`)

  return response.data.data.job
}

async function submitProposal(jobId, payload) {
  const response = await api.post(`/jobs/${jobId}/proposals`, payload)

  return response.data.data.proposal
}

async function getMyProposals(params = {}) {
  const response = await api.get('/proposals/mine', { params })

  return response.data.data
}

async function getMyProposalForJob(jobId) {
  const response = await api.get(`/proposals/mine/${jobId}`)

  return response.data.data.proposal
}

async function getJobProposals(jobId, params = {}) {
  const response = await api.get(`/jobs/${jobId}/proposals`, { params })

  return response.data.data
}

async function updateProposalStatus(proposalId, payload) {
  const response = await api.patch(`/proposals/${proposalId}/status`, payload)

  return response.data.data.proposal
}

async function acceptProposal(proposalId) {
  const response = await api.post(`/proposals/${proposalId}/accept`)

  return response.data.data
}

export {
  getCategories,
  getSkills,
  createJob,
  publishJob,
  getJobs,
  getJob,
  getMyJobs,
  getMyJob,
  submitProposal,
  getMyProposals,
  getMyProposalForJob,
  getJobProposals,
  updateProposalStatus,
  acceptProposal,
}
