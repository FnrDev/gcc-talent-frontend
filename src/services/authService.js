import api from './api'

async function signUp(formData) {
  const response = await api.post('/auth/register', formData)

  return response.data.data.user
}

async function signIn(formData) {
  const response = await api.post('/auth/login', formData)
  const { accessToken, user } = response.data.data

  localStorage.setItem('token', accessToken)

  return user
}

async function getCurrentUser() {
  const response = await api.get('/auth/me')

  return response.data.data.user
}

function logout() {
  localStorage.removeItem('token')
}

export {
  signUp,
  signIn,
  getCurrentUser,
  logout,
}
