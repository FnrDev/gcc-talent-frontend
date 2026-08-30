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

export { getServices, getService, getSimilarServices }
