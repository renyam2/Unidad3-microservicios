import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuthContext.jsx'

const SECCIONES = [
  { id: 'divisiones', to: '/divisiones', title: 'Divisiones', desc: 'Administrar divisiones (microservicio A)' },
  { id: 'programas', to: '/programas', title: 'Programas Educativos', desc: 'Administrar programas educativos (microservicio B)' },
]

export default function DashboardPage() {
  const { token, payload } = useAuth()
  const exp = payload?.exp ? new Date(payload.exp * 1000) : null

  return (
    <main className="container">
      <section className="card">
        <h2>Sesión</h2>
        {payload?.sub && <p>Usuario: {payload.sub}</p>}
        {exp && <p>Expira el {exp.toLocaleString()}</p>}
      </section>

      <div className="cards">
        {SECCIONES.map((s) => (
          <article key={s.id} className="card">
            <h2>{s.title}</h2>
            <p>{s.desc}</p>
            <Link className="btn" to={s.to}>Abrir</Link>
          </article>
        ))}
      </div>
    </main>
  )
}
