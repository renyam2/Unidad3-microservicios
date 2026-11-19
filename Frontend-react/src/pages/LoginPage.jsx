import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuthContext.js'

export default function LoginPage() {
  const { token, login } = useAuth()

  if (token) {
    // Ya hay sesión: mandar directo al dashboard.
    return <Navigate to="/dashboard" replace />
  }

  return (
    <main className="container">
      <section className="card">
        <h2>Iniciar sesión</h2>
        <p>
          Se redirigirá al AuthServer (OAuth2 · Authorization Code).
          Al completar el login, volverás automáticamente al dashboard.
        </p>
        <button className="btn primary" onClick={login}>
          Continuar con AuthServer
        </button>
      </section>
    </main>
  )
}
