import api from './api'

async function getClientServiceOrders({ status, page = 1, limit = 8 } = {}) {
  const params = {
    role: 'client',
    sourceType: 'service',
    page,
    limit,
    ...(status ? { status } : {}),
  }

  const response = await api.get('/contracts', { params })

  return response.data.data
}

async function getContracts({ status, page = 1, limit = 12 } = {}) {
  const response = await api.get('/contracts', {
    params: { page, limit, ...(status ? { status } : {}) },
  })
  return response.data.data
}

async function getContractWorkspace(contractId) {
  const response = await api.get(`/contracts/${contractId}/workspace`)
  return response.data.data
}

async function getContractActivity(contractId) {
  const response = await api.get(`/contracts/${contractId}/activity`)
  return response.data.data
}

async function getContractMessages(contractId, { page = 1, limit = 50 } = {}) {
  const response = await api.get(`/contracts/${contractId}/messages`, { params: { page, limit } })
  return response.data.data
}

async function sendContractMessage(contractId, payload) {
  const response = await api.post(`/contracts/${contractId}/messages`, payload)
  return response.data.data
}

async function addContractMilestone(contractId, payload) {
  const response = await api.post(`/contracts/${contractId}/milestones`, payload)
  return response.data.data
}

async function updateContractMilestone(contractId, milestoneId, payload) {
  const response = await api.patch(`/contracts/${contractId}/milestones/${milestoneId}`, payload)
  return response.data.data
}

async function fundMilestone(contractId, milestoneId, idempotencyKey) {
  const response = await api.post(
    `/contracts/${contractId}/milestones/${milestoneId}/fund`,
    {},
    { headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined },
  )
  return response.data.data
}

async function startMilestone(contractId, milestoneId) {
  const response = await api.post(`/contracts/${contractId}/milestones/${milestoneId}/start`)
  return response.data.data
}

async function deliverMilestone(contractId, milestoneId, payload) {
  const response = await api.post(`/contracts/${contractId}/milestones/${milestoneId}/deliveries`, payload)
  return response.data.data
}

async function requestMilestoneRevision(contractId, milestoneId, note) {
  const response = await api.post(`/contracts/${contractId}/milestones/${milestoneId}/request-revision`, { note })
  return response.data.data
}

async function approveMilestone(contractId, milestoneId, idempotencyKey) {
  const response = await api.post(
    `/contracts/${contractId}/milestones/${milestoneId}/approve`,
    {},
    { headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined },
  )
  return response.data.data
}

async function cancelContract(contractId, reason, idempotencyKey) {
  const response = await api.post(
    `/contracts/${contractId}/cancel`,
    { reason },
    { headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined },
  )
  return response.data.data
}

async function createContractReview(contractId, payload) {
  const response = await api.post(`/contracts/${contractId}/reviews`, payload)
  return response.data.data
}

export {
  addContractMilestone,
  approveMilestone,
  cancelContract,
  createContractReview,
  deliverMilestone,
  fundMilestone,
  getClientServiceOrders,
  getContracts,
  getContractActivity,
  getContractMessages,
  getContractWorkspace,
  requestMilestoneRevision,
  sendContractMessage,
  startMilestone,
  updateContractMilestone,
}
