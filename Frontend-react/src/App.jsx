import { useState } from 'react'
import LoginForm from './components/LoginForm.jsx'
import Dashboard from './components/Dashboard.jsx'

const auth = () => window.App?.auth

export default function App() {
  const [token, setToken] = useState(auth()?.getToken() || null)

  function logout() {
    auth().logout()
    setToken(null)
  }

  return (
    <>
      <header className="app-header">
        <h1>Unidad 3 · Microservicios</h1>
        <span className={'pill' + (token ? ' on' : '')}>
          {token ? 'Sesión activa' : 'Sin sesión'}
        </span>
      </header>
      <main className="container">
        {token
          ? <Dashboard token={token} onLogout={logout} />
          : <LoginForm onLogin={() => setToken(auth().getToken())} />}
      </main>
    </>
  )
}