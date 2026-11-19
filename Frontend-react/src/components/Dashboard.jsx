import { useState } from 'react'

const SECCIONES = [
  { id: 'divisiones', title: 'Divisiones', desc: 'Administrar divisiones (microservicio A)' },
  { id: 'programas', title: 'Programas Educativos', desc: 'Administrar programas educativos (microservicio B)' },
]

export default function Dashboard({ token, onLogout }) {
  const [open, setOpen] = useState(null)
  const payload = window.App.auth.decodeJwt(token)
  const exp = payload?.exp ? new Date(payload.exp * 1000) : null

  return (
    <>
      <section className="card">
        <h2>Sesión</h2>
        {payload?.sub && <p>Usuario: {payload.sub}</p>}
        {exp && <p>Expira el {exp.toLocaleString()}</p>}
        <button onClick={onLogout}>Cerrar sesión</button>
      </section>

      <div className="cards">
        {SECCIONES.map(s => (
          <article key={s.id} className="card">
            <h2>{s.title}</h2>
            <p>{s.desc}</p>
            <button onClick={() => setOpen(s.id)}>Abrir</button>
          </article>
        ))}
      </div>

      {open === 'divisiones' && (
        <section className="card"><h2>Divisiones</h2><p>CRUD en construcción…</p></section>
      )}
      {open === 'programas' && (
        <section className="card"><h2>Programas Educativos</h2><p>CRUD en construcción…</p></section>
      )}
    </>
  )
}