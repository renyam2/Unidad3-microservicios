import { useState, useCallback } from 'react'
import { loginPassword, handleCallback, TOKEN_KEY } from '../services/oauth.js'

const TOKEN_KEY_LOCAL = TOKEN_KEY || 'u3_access_token'

function readToken() {
  try { return sessionStorage.getItem(TOKEN_KEY_LOCAL) } catch { return null }
}

function decodeJwt(token) {
  try {
    const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(decodeURIComponent(escape(atob(part))))
  } catch { return null }
}

export default function useAuth() {
  const [token, setTokenState] = useState(readToken)
  const [payload, setPayload] = useState(() => (token ? decodeJwt(token) : null))

  const setToken = useCallback((t) => {
    try { sessionStorage.setItem(TOKEN_KEY_LOCAL, t) } catch {}
    setTokenState(t)
    setPayload(t ? decodeJwt(t) : null)
  }, [])

  const logout = useCallback(() => {
    try { sessionStorage.removeItem(TOKEN_KEY_LOCAL) } catch {}
    setTokenState(null)
    setPayload(null)
  }, [])

  // login(username, password) → POST /oauth2/token (grant password) y guarda el token.
  const login = useCallback(async (username, password) => {
    const t = await loginPassword(username, password)
    setToken(t)
    return t
  }, [setToken])

  const callback = useCallback(async () => {
    const t = await handleCallback()
    setToken(t)
    return t
  }, [setToken])

  return { token, payload, login, logout, callback, setToken, decodeJwt }
}
