import axios from 'axios'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

export const api = axios.create({
  baseURL: API_BASE_URL,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

export const authApi = {
  register: (payload) => api.post('/api/users/register', payload),
  login: (payload) => api.post('/api/users/login', payload),
}

export const moodApi = {
  addMood: (payload) => api.post('/api/mood/add', payload),
  getMoodByUser: (userId) => api.get(`/api/mood/user/${userId}`),
  getAnalytics: (userId) => api.get(`/api/mood/analytics/${userId}`),
}

export const userApi = {
  setTrustedContact: (userId, email) =>
    api.put(`/api/users/${userId}/trusted-contact?email=${encodeURIComponent(email)}`),
}

export const crisisApi = {
  checkCrisisStatus: (userId) => api.get(`/api/crisis/check/${userId}`),
}

export const activityApi = {
  logActivity: (payload) => api.post('/api/activity/log', payload),
}

export const wellnessApi = {
  getDashboard: (userId) => api.get(`/api/wellness/dashboard/${userId}`),
}

export const safetyPlanApi = {
  getSafetyPlan: (userId) => api.get(`/api/safety-plan/user/${userId}`),
  saveSafetyPlan: (userId, payload) => api.put(`/api/safety-plan/user/${userId}`, payload),
}

export const resourcesApi = {
  getIndiaResources: () => api.get('/api/resources/india'),
  getGroundingSteps: () => api.get('/api/resources/grounding'),
}
