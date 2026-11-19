import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <main className="container">
      <section className="card">
        <h2>404 — Página no encontrada</h2>
        <p>La ruta que buscaste no existe.</p>
        <Link className="btn" to="/dashboard">Ir al dashboard</Link>
      </section>
    </main>
  )
}
