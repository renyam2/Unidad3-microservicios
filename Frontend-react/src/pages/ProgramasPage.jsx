import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuthContext.js'

export default function ProgramasPage() {
  const { token } = useAuth()

  return (
    <main className="container">
      <section className="card">
        <h2>Programas Educativos (MS-B)</h2>
        <p>CRUD de EntityB — en construcción.</p>
        <Link className="btn" to="/dashboard">← Volver al dashboard</Link>
      </section>
    </main>
  )
}
