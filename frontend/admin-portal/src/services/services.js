import api from './api'
import axios from 'axios'

export const authService = {
  async login(email, password) {
    const { data } = await axios.post('/api/v1/auth/login', { email, password }, { withCredentials: true })
    localStorage.setItem('accessToken', data.data.accessToken)
    return data.data.user
  },

  async logout() {
    try { await api.post('/auth/logout') } catch {}
    localStorage.removeItem('accessToken')
  },

  async getMe() {
    const { data } = await api.get('/profile/me')
    return data.data.user
  },

  isAuthenticated() {
    return !!localStorage.getItem('accessToken')
  },
}

export const dashboardService = {
  async getSummary() {
    const { data } = await api.get('/dashboard')
    return data.data
  },
}

export const paymentService = {
  async list(params = {}) {
    const { data } = await api.get('/members/payments', { params })
    return data.data
  },
  async verify(id) {
    const { data } = await api.post(`/members/payments/${id}/verify`)
    return data
  },
  async reject(id) {
    const { data } = await api.post(`/members/payments/${id}/reject`)
    return data
  },
}

export const subscriptionService = {
  async extend(id, extra_days) {
    const { data } = await api.patch(`/members/subscriptions/${id}/extend`, { extra_days })
    return data
  },
}

export const userService = {
  async listUsers(params = {}) {
    const { data } = await api.get('/members/users', { params })
    return data.data   // { members: [...], pagination: {...} }
  },
}

export const planService = {
  async list() {
    const { data } = await api.get('/plans')
    return data.data.plans
  },
  async create(body) {
    const { data } = await api.post('/plans', body)
    return data.data.plan
  },
  async update(id, body) {
    const { data } = await api.patch(`/plans/${id}`, body)
    return data.data.plan
  },
  async remove(id) {
    await api.delete(`/plans/${id}`)
  },
}
