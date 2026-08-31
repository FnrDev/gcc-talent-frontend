import api from './api'

async function getPublicProfile(userId) {
  const response = await api.get(`/profile/${userId}`)

  return response.data
}

async function getMyProfile() {
  const response = await api.get('/profile/me')

  return response.data.data
}

async function updateMyProfile(payload) {
  const response = await api.patch('/profile/me', payload)

  return response.data.data
}

async function getProfileSkills() {
  const response = await api.get('/skills')

  return Array.isArray(response.data.skills) ? response.data.skills : []
}

async function uploadPortfolioImage(file) {
  const formData = new FormData()
  formData.append('attachment', file)

  const response = await api.post('/uploads', formData, {
    params: { purpose: 'service-image' },
  })

  return response.data.data.attachment
}

async function createPortfolioItem(payload) {
  const response = await api.post('/profile/me/portfolio', payload)

  return response.data.data.item
}

async function updatePortfolioItem(itemId, payload) {
  const response = await api.patch(`/profile/me/portfolio/${itemId}`, payload)

  return response.data.data.item
}

async function deletePortfolioItem(itemId) {
  const response = await api.delete(`/profile/me/portfolio/${itemId}`)

  return response.data
}

export {
  getPublicProfile,
  getMyProfile,
  updateMyProfile,
  getProfileSkills,
  uploadPortfolioImage,
  createPortfolioItem,
  updatePortfolioItem,
  deletePortfolioItem,
}
