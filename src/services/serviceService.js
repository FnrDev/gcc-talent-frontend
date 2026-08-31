import api from './api'

async function getServices(params = {}) {
  return (await api.get('/services', { params })).data
}

async function getService(id) {
  return (await api.get(`/services/${id}`)).data
}

async function getSimilarServices(id, limit = 6) {
  return (await api.get(`/services/${id}/similar`, { params: { limit } })).data
}

async function getServiceReviews(id, { page = 1, limit = 6 } = {}) {
  const response = await api.get(`/services/${id}/reviews`, { params: { page, limit } })
  return response.data.data
}

async function createPackage(payload) {
  const response = await api.post('/packages', payload)

  return response.data.data.package
}

async function uploadServiceImage(file) {
  const formData = new FormData()
  formData.append('attachment', file)

  const response = await api.post('/uploads', formData, {
    params: { purpose: 'service-image' },
  })

  return response.data.data.attachment
}

async function createService(payload) {
  const response = await api.post('/services', payload)

  return response.data.data.service
}

async function createServiceOrder(serviceId, payload, idempotencyKey) {
  const response = await api.post(`/services/${serviceId}/orders`, payload, {
    headers: { 'Idempotency-Key': idempotencyKey },
  })

  return response.data.data
}

export {
  getServices,
  getService,
  getSimilarServices,
  getServiceReviews,
  createPackage,
  uploadServiceImage,
  createService,
  createServiceOrder,
}
