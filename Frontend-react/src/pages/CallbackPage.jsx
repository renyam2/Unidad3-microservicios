import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuthContext.jsx'

export default function CallbackPage() {
  const { callback } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState(null)

  useEffect(() => {
    callback()
      .then(() => navigate('/dashboard', { replace: true }))
      .catch((err) => {
        setError(err.message)
      })
  }, [callback, navigate])

  return (
    <main className="container">
      <section className="card">
        <h2>Completando sesión…</h2>
        {error && <p className="msg err">{error}</p>}
      </section>
    </main>
  )
}
