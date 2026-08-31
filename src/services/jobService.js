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

async function getSimilarJobs(jobId, params = {}) {
  const response = await api.get(`/jobs/${jobId}/similar`, { params })

  return response.data.data.jobs
}

async function getMyJobs(params = {}) {
  const response = await api.get('/jobs/my/list', { params })

  return response.data.data
}

async function getMyJob(jobId) {
  const response = await api.get(`/jobs/my/${jobId}`)

  return response.data.data.job
}

async function updateMyJob(jobId, payload) {
  const response = await api.patch(`/jobs/my/${jobId}`, payload)

  return response.data.data.job
}

async function closeJob(jobId) {
  const response = await api.post(`/jobs/my/${jobId}/close`)

  return response.data.data.job
}

async function reopenJob(jobId) {
  const response = await api.post(`/jobs/my/${jobId}/reopen`)

  return response.data.data.job
}

async function deleteMyJob(jobId) {
  await api.delete(`/jobs/my/${jobId}`)
}

async function submitProposal(jobId, payload) {
  const response = await api.post(`/jobs/${jobId}/proposals`, payload)

  return response.data.data.proposal
}

async function uploadProposalAttachment(file) {
  const formData = new FormData()
  formData.append('attachment', file)

  const response = await api.post('/uploads', formData)

  return response.data.data.attachment
}

async function getMyProposals(params = {}) {
  const response = await api.get('/proposals/mine', { params })

  return response.data.data
}

async function getMyProposalForJob(jobId) {
  const response = await api.get(`/proposals/mine/${jobId}`)

  return response.data.data.proposal
}

async function updateProposal(proposalId, payload) {
  const response = await api.patch(`/proposals/${proposalId}`, payload)

  return response.data.data.proposal
}

async function withdrawProposal(proposalId) {
  const response = await api.post(`/proposals/${proposalId}/withdraw`)

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
  getSimilarJobs,
  getMyJobs,
  getMyJob,
  updateMyJob,
  closeJob,
  reopenJob,
  deleteMyJob,
  submitProposal,
  uploadProposalAttachment,
  getMyProposals,
  getMyProposalForJob,
  updateProposal,
  withdrawProposal,
  getJobProposals,
  updateProposalStatus,
  acceptProposal,
}
