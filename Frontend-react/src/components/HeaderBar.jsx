import { Link } from 'react-router-dom'

export default function HeaderBar({ token, onLogout }) {
  return (
    <header className="app-header">
      <h1>
        <Link to="/dashboard">Unidad 3 · Microservicios</Link>
      </h1>
      <div className="header-right">
        <span className={'pill' + (token ? ' on' : '')}>
          {token ? 'Sesión activa' : 'Sin sesión'}
        </span>
        {token && (
          <button className="btn" onClick={onLogout}>
            Cerrar sesión
          </button>
        )}
      </div>
    </header>
  )
}
