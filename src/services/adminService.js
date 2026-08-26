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
  getAdminUsers,
  getAdminUser,
  updateAdminUser,
  deleteAdminUser,
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
