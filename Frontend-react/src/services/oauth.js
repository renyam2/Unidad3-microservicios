// Flujo Authorization Code contra el AuthServer.
const AUTH_SERVER = 'http://localhost:9000'   // login (navegación del navegador)
const GATEWAY = 'http://localhost:8083'        // canje del code por el token
const CLIENT_ID = 'frontend'
const CLIENT_SECRET = 'frontend-secret'
const REDIRECT_URI = 'http://localhost:5500/callback' // debe estar registrado en el AuthServer
const SCOPE = 'read'
const TOKEN_KEY = 'u3_access_token'
const STATE_KEY = 'u3_oauth_state'

let redirecting = false
let pending = null

function randomState() {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

// Manda al usuario a la pantalla de login del AuthServer.
export function startLogin() {
  if (redirecting) return
  redirecting = true
  const state = randomState()
  sessionStorage.setItem(STATE_KEY, state)
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: SCOPE,
    state,
  })
  window.location.href = `${AUTH_SERVER}/oauth2/authorize?${params}`
}

// Canjea el code por el token. Solo se ejecuta una vez aunque React
// monte el efecto dos veces (el code es de un solo uso).
export function handleCallback() {
  if (!pending) pending = exchangeCode()
  return pending
}

async function exchangeCode() {
  const params = new URLSearchParams(window.location.search)

  const error = params.get('error')
  if (error) throw new Error(params.get('error_description') || error)

  const code = params.get('code')
  const state = params.get('state')
  if (!code) throw new Error('El servidor no devolvió el código de autorización.')
  if (state !== sessionStorage.getItem(STATE_KEY)) {
    throw new Error('El parámetro state no coincide. Intenta iniciar sesión de nuevo.')
  }
  sessionStorage.removeItem(STATE_KEY)

  const res = await fetch(`${GATEWAY}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || `Error ${res.status} al canjear el código`)
  }

  sessionStorage.setItem(TOKEN_KEY, data.access_token)
  return data.access_token
}