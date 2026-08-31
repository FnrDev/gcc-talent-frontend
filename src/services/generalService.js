import api from './api'

async function getHome() {
  const response = await api.get('/home')
  return response.data.data
}

async function searchMarketplace(params) {
  const response = await api.get('/search', { params })
  return response.data.data
}

export { getHome, searchMarketplace }
