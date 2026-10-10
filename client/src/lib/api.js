import { API_URL } from '../config/api'

export async function apiRequest(path, { token, ...options } = {}) {
  const headers = new Headers(options.headers)
  headers.set('Accept', 'application/json')
  if (options.body !== undefined) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

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
