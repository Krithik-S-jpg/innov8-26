import { createContext, useContext, useMemo, useState } from 'react'
import { jwtDecode } from 'jwt-decode'
import toast from 'react-hot-toast'
import { authApi } from '../services/api'

const AuthContext = createContext(null)

const getDecodedToken = (token) => {
  try {
    return jwtDecode(token)
  } catch {
    return null
  }
}

const getUserFromStorage = () => {
  const token = localStorage.getItem('token')

  if (!token) {
    return null
  }

  const decoded = getDecodedToken(token)

  return {
    token,
    name: localStorage.getItem('name') || decoded?.name || 'MindCare User',
    email: localStorage.getItem('email') || decoded?.email || decoded?.sub || '',
    userId:
      Number(localStorage.getItem('userId')) ||
      Number(decoded?.userId) ||
      Number(decoded?.id) ||
      Number(decoded?.uid) ||
      null,
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getUserFromStorage)
  const loading = false

  const login = async (email, password) => {
    const response = await authApi.login({ email, password })
    const token = response?.data?.split('Token: ')[1]?.trim()

    if (!token) {
      throw new Error('Login response does not include a token.')
    }

    const decoded = getDecodedToken(token)
    const name = decoded?.name || decoded?.username || 'MindCare User'
    const userEmail = decoded?.email || decoded?.sub || email
    const userId = Number(decoded?.userId) || Number(decoded?.id) || Number(decoded?.uid) || null

    localStorage.setItem('token', token)
    localStorage.setItem('name', name)
    localStorage.setItem('email', userEmail)

    if (userId) {
      localStorage.setItem('userId', String(userId))
    }

    const nextUser = {
      token,
      name,
      email: userEmail,
      userId,
    }

    setUser(nextUser)
    toast.success('Signed in successfully.')
    return nextUser
  }

  const register = async (name, email, password) => {
    const response = await authApi.register({ name, email, password })
    toast.success(response.data || 'Account created successfully.')
    return response
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('name')
    localStorage.removeItem('email')
    localStorage.removeItem('userId')
    setUser(null)
    toast.success('Signed out.')
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user?.token),
      login,
      register,
      logout,
    }),
    [user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
