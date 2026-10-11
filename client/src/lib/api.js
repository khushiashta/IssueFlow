import { API_URL } from '../config/api'

const TOKEN_KEY = 'issueflow_token'

export function getStoredAuthToken() {
  try {
    return window.sessionStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function storeAuthToken(token) {
  window.sessionStorage.setItem(TOKEN_KEY, token)
}

export function clearStoredAuthToken() {
  try {
    window.sessionStorage.removeItem(TOKEN_KEY)
  } catch {
    // In-memory auth state is still cleared if browser storage is unavailable.
  }
}

export async function apiRequest(path, { token, ...options } = {}) {
  const headers = new Headers(options.headers)
  headers.set('Accept', 'application/json')
  if (options.body !== undefined) headers.set('Content-Type', 'application/json')
  const authToken = token === undefined ? getStoredAuthToken() : token
  if (authToken) headers.set('Authorization', `Bearer ${authToken}`)

  let response
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers })
  } catch {
    throw new Error('Unable to reach the server. Check your connection and try again.')
  }

  let data = {}
  try {
    data = await response.json()
  } catch {
    // Keep the HTTP error useful even if the server does not return JSON.
  }

  if (!response.ok) {
    const error = new Error(typeof data.message === 'string' ? data.message : 'The request could not be completed.')
    error.status = response.status
    throw error
  }

  return data
}
