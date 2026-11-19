import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuthContext.js'

export default function DivisionesPage() {
  const { token } = useAuth()

  return (
    <main className="container">
      <section className="card">
        <h2>Divisiones (MS-A)</h2>
        <p>CRUD de EntityA — en construcción.</p>
        <Link className="btn" to="/dashboard">← Volver al dashboard</Link>
      </section>
    </main>
  )
}
