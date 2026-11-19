// Capa de API compartida: peticiones al Gateway con Authorization: Bearer <token>.
import { GATEWAY, TOKEN_KEY } from './oauth.js'

export function getToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

/**
 * callApi(path, { method, body }, token)
 * - Envía "Authorization: Bearer <token>" cuando hay token.
 * - 401 → limpia el token y lanza Error (la página decide re-login).
 * - Otros errores HTTP → Error con mensaje legible y `status`.
 * - Fallo de red/CORS → Error de conexión.
 */
export async function callApi(path, { method = 'GET', body } = {}, token = getToken()) {
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  let res
  try {
    res = await fetch(GATEWAY + path, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new Error('No se pudo conectar con el Gateway (¿está arriba?).')
  }

  const text = await res.text()
  let data = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
  }

  if (!res.ok) {
    if (res.status === 401) {
      try {
        sessionStorage.removeItem(TOKEN_KEY)
      } catch {}
      const err = new Error(token ? 'Sesión expirada o token JWT inválido.' : 'Debes iniciar sesión.')
      err.status = 401
      throw err
    }
    const mensajes = {
      400: 'Los datos enviados no son válidos.',
      403: 'No tienes permisos para esta operación.',
      404: 'No se encontró el registro solicitado.',
    }
    const err = new Error(mensajes[res.status] || `La operación falló (${res.status}).`)
    err.status = res.status
    err.data = data
    throw err
  }

  return data
}
