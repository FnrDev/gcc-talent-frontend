import api from './api'

function getApiErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  const message = error?.response?.data?.message || error?.response?.data?.err

  if (typeof message === 'string' && message.trim()) {
    return message
  }

  if (Array.isArray(message) && message.length > 0) {
    return message.join(' ')
  }

  return fallback
}

async function getAdminStats() {
  const response = await api.get('/admin/stats')
  return response.data
}

async function getAdminAuditLogs(params = {}) {
  const response = await api.get('/admin/audit-logs', { params })
  return response.data
}

async function getAdminUsers(params = {}) {
  const response = await api.get('/admin/users', { params })
  return response.data
}

async function getAdminUser(id) {
  const response = await api.get(`/admin/users/${id}`)
  return response.data
}

async function updateAdminUser(id, updates) {
  const response = await api.patch(`/admin/users/${id}`, updates)
  return response.data
}

async function deleteAdminUser(id) {
  const response = await api.delete(`/admin/users/${id}`)
  return response.data
}

async function getAdminJobs(params = {}) {
  const response = await api.get('/admin/jobs', { params })
  return response.data
}

async function getAdminJob(id) {
  const response = await api.get(`/admin/jobs/${id}`)
  return response.data
}

async function updateAdminJob(id, updates) {
  const response = await api.patch(`/admin/jobs/${id}`, updates)
  return response.data
}

async function deleteAdminJob(id) {
  const response = await api.delete(`/admin/jobs/${id}`)
  return response.data
}

async function getAdminServices(params = {}) {
  const response = await api.get('/admin/services', { params })
  return response.data
}

async function getAdminService(id) {
  const response = await api.get(`/admin/services/${id}`)
  return response.data
}

async function updateAdminService(id, updates) {
  const response = await api.patch(`/admin/services/${id}`, updates)
  return response.data
}

async function deleteAdminService(id) {
  const response = await api.delete(`/admin/services/${id}`)
  return response.data
}

async function getAdminCategories() {
  const response = await api.get('/admin/categories')
  return response.data
}

async function createAdminCategory(category) {
  const response = await api.post('/admin/categories', category)
  return response.data
}

async function updateAdminCategory(id, updates) {
  const response = await api.patch(`/admin/categories/${id}`, updates)
  return response.data
}

async function deleteAdminCategory(id) {
  const response = await api.delete(`/admin/categories/${id}`)
  return response.data
}

async function getAdminSkills(params = {}) {
  const response = await api.get('/admin/skills', { params })
  return response.data
}

async function createAdminSkill(skill) {
  const response = await api.post('/admin/skills', skill)
  return response.data
}

async function updateAdminSkill(id, updates) {
  const response = await api.patch(`/admin/skills/${id}`, updates)
  return response.data
}

async function deleteAdminSkill(id) {
  const response = await api.delete(`/admin/skills/${id}`)
  return response.data
}

export {
  getAdminStats,
  getAdminAuditLogs,
  getAdminUsers,
  getAdminUser,
  updateAdminUser,
  deleteAdminUser,
  getAdminJobs,
  getAdminJob,
  updateAdminJob,
  deleteAdminJob,
  getAdminServices,
  getAdminService,
  updateAdminService,
  deleteAdminService,
  getAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
  getAdminSkills,
  createAdminSkill,
  updateAdminSkill,
  deleteAdminSkill,
  getApiErrorMessage,
}
