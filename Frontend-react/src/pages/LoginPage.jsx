import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuthContext.jsx'

export default function LoginPage() {
  const { token, login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  if (token) {
    // Ya hay sesión: mandar directo al dashboard.
    return <Navigate to="/dashboard" replace />
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (loading) return
    setError(null)
    setLoading(true)
    try {
      // login(username, password) → POST /oauth2/token (grant password)
      await login(username, password)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="container">
      <section className="card">
        <h2>Iniciar sesión</h2>
        <p>
          OAuth2 · grant <code>password</code> (POST /oauth2/token vía Gateway).
        </p>
        <form onSubmit={handleSubmit}>
          <label>
            Usuario
            <input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={loading}
              autoComplete="username"
            />
          </label>
          <label>
            Contraseña
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              autoComplete="current-password"
            />
          </label>
          {error && <p className="msg err show">{error}</p>}
          <div className="row">
            <button className="btn primary" type="submit" disabled={loading}>
              {loading ? 'Iniciando…' : 'Iniciar sesión'}
            </button>
          </div>
        </form>
      </section>
    </main>
  )
}
