import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { apiRequest, clearStoredAuthToken, getStoredAuthToken, storeAuthToken } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const token = getStoredAuthToken()

    if (!token) {
      setLoading(false)
      return () => { active = false }
    }

    apiRequest('/api/auth/me', { token })
      .then((data) => {
        if (active) setUser(data.user)
      })
      .catch((error) => {
        if (error.status === 401) clearStoredAuthToken()
        if (active) setUser(null)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
  }, [])

  const authenticate = useCallback(async (endpoint, credentials) => {
    const data = await apiRequest(`/api/auth/${endpoint}`, {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
    if (typeof data.token !== 'string' || !data.user) {
      throw new Error('The server returned an invalid authentication response.')
    }

    // sessionStorage is accessible to JavaScript, so an XSS vulnerability could expose this token.
    // HttpOnly cookies would provide stronger protection against token theft if the backend is adapted later.
    try {
      storeAuthToken(data.token)
    } catch {
      throw new Error('This browser could not store your session. Enable session storage and try again.')
    }
    setUser(data.user)
    return data.user
  }, [])

  const login = useCallback((credentials) => authenticate('login', credentials), [authenticate])
  const register = useCallback((details) => authenticate('register', details), [authenticate])
  const logout = useCallback(() => {
    clearStoredAuthToken()
    setUser(null)
  }, [])

  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading, login, register, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
