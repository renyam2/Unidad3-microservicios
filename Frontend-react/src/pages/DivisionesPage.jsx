import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuthContext.jsx'
import { callApi } from '../services/api.js'

const RESOURCE = '/api/ENTITYA'

export default function DivisionesPage() {
  const { token, logout } = useAuth()
  const navigate = useNavigate()

  const [rows, setRows] = useState(null)
  const [name, setName] = useState('')
  const [editId, setEditId] = useState(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null) // { text, kind }


function notifyHttp(status, text) {
  setMsg(window.App.ui.httpNotice(status, text))
}



function handleErr(err) {
  notifyHttp(err.status, err.message)

  if (err.status === 401) {
    logout()
    navigate('/login', { replace: true })
  }
}



async function load(showNotice = false) {
  setBusy(true)

  try {
    const response = await callApi(
      RESOURCE,
      { includeResponse: true },
      token
    )

    setRows(response.data)

    if (showNotice) {
      notifyHttp(
        response.status,
        'Divisiones consultadas correctamente.'
      )
    }

    return true
  } catch (err) {
    handleErr(err)
    return false
  } finally {
    setBusy(false)
  }
}

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function resetForm() {
    setName('')
    setEditId(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (busy) return
    const nombreA = name.trim()
    if (!nombreA) {
      setMsg({ text: 'El campo nombreA es obligatorio.', kind: 'err' })
      return
    }
    setBusy(true)
    setMsg(null)
    try {
      if (editId != null) {
        await callApi(`${RESOURCE}/${editId}`, { method: 'PUT', body: { nombreA } }, token)
        setMsg({ text: 'ENTITYA actualizada correctamente.', kind: 'ok' })
      } else {
        await callApi(RESOURCE, { method: 'POST', body: { nombreA } }, token)
        setMsg({ text: 'ENTITYA creada correctamente.', kind: 'ok' })
      }
      resetForm()
      await load()
    } catch (err) {
      handleErr(err)
    } finally {
      setBusy(false)
    }
  }

  
async function handleRemove(id) {
  if (!window.confirm(`¿Eliminar división #${id}?`)) return

  setBusy(true)
  setMsg(null)

  try {
    const response = await callApi(
      `${RESOURCE}/${id}`,
      {
        method: 'DELETE',
        includeResponse: true
      },
      token
    )

    if (editId === id) resetForm()

    const loaded = await load()

    if (loaded) {
      notifyHttp(
        response.status,
        'División eliminada correctamente.'
      )
    }
  } catch (err) {
    handleErr(err)
  } finally {
    setBusy(false)
  }
}


  return (
    <main className="container">
      <section className="card">
        <h2>Crear / editar ENTITYA</h2>
        <form onSubmit={handleSubmit}>
          <label>
            {editId != null ? `nombreA (editando #${editId})` : 'nombreA'}
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={busy}
            />
          </label>
          
{msg && (
  <p
    className={`msg show ${msg.kind}`}
    role={msg.kind === 'err' ? 'alert' : 'status'}
  >
    {msg.status != null && (
      <strong>HTTP {msg.status} — </strong>
    )}
    {msg.text}
  </p>
)}

          <div className="row">
            <button className="btn primary" type="submit" disabled={busy}>
              {busy ? 'Guardando…' : editId != null ? 'Guardar cambios' : 'Crear ENTITYA'}
            </button>
            {editId != null && (
              <button className="btn secondary" type="button" onClick={resetForm} disabled={busy}>
                Cancelar edición
              </button>
            )}
            <button className="btn secondary" type="button" onClick={() => load(true)} disabled={busy}>
              Recargar lista
            </button>
          </div>
        </form>
      </section>

      <section className="card">
        <h2>Tabla ENTITYA</h2>
        {rows === null && <p className="meta">Cargando…</p>}
        {Array.isArray(rows) && rows.length === 0 && <p className="meta">Sin registros.</p>}
        {Array.isArray(rows) && rows.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((entity) => (
                <tr key={entity.id}>
                  <td>{entity.id}</td>
                  <td>{entity.nombreA}</td>
                  <td>
                    <div className="row">
                      <button
                        className="btn secondary"
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          setEditId(entity.id)
                          setName(entity.nombreA || '')
                        }}
                      >
                        Editar
                      </button>
                      <button
                        className="btn danger"
                        type="button"
                        disabled={busy}
                        onClick={() => handleRemove(entity.id)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <LinkBack />
      </section>
    </main>
  )
}

function LinkBack() {
  return (
    <div className="row">
      <a className="btn secondary" href="/dashboard">← Volver al dashboard</a>
    </div>
  )
}
