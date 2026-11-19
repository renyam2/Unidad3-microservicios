import { useState } from 'react'

export default function LoginForm({ onLogin }) {
  const [user, setUser] = useState('')
  const [pass, setPass] = useState('')
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    try {
      await window.App.auth.login(user, pass)
      onLogin()
    } catch (err) {
      setMsg(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="card" onSubmit={submit}>
      <h2>Iniciar sesión</h2>
      <label>Usuario
        <input value={user} onChange={e => setUser(e.target.value)} autoComplete="username" required />
      </label>
      <label>Contraseña
        <input type="password" value={pass} onChange={e => setPass(e.target.value)} autoComplete="current-password" required />
      </label>
      <button disabled={busy}>{busy ? 'Entrando…' : 'Entrar'}</button>
      {msg && <p className="msg err">{msg}</p>}
    </form>
  )
}