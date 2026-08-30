// MOCK DATA — replace the bodies with the commented api calls when the
// back-end taxonomy endpoints are wired up. Signatures and return shapes
// already match GET /categories and GET /skills.
// import api from './api'

import { delay } from './mock/query'
import { categories, skills } from './mock/taxonomy'

async function getCategories() {
  // return (await api.get('/categories')).data
  await delay(80)
  return { success: true, data: { categories } }
}

async function getSkills(params = {}) {
  // return (await api.get('/skills', { params })).data
  await delay(80)
  const filtered = params.category
    ? skills.filter((skill) => skill.category === params.category)
    : skills

  return { success: true, data: { skills: filtered } }
}

export { getCategories, getSkills }
