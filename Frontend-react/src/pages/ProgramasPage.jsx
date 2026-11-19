import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuthContext.jsx'
import { callApi } from '../services/api.js'

const RESOURCE_B = '/api/ENTITYB'
const RESOURCE_A = '/api/ENTITYA'

export default function ProgramasPage() {
  const { token, logout } = useAuth()
  const navigate = useNavigate()

  const [rows, setRows] = useState(null)
  const [entityAOptions, setEntityAOptions] = useState([])
  const [nombreB, setNombreB] = useState('')
  const [selectedIds, setSelectedIds] = useState([])
  const [editId, setEditId] = useState(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null) // { text, kind }

  function handleErr(err) {
    setMsg({ text: err.message, kind: 'err' })
    if (err.status === 401) {
      logout()
      navigate('/login', { replace: true })
    }
  }

  async function loadOptions() {
    try {
      const data = await callApi(RESOURCE_A, {}, token)
      setEntityAOptions(Array.isArray(data) ? data : [])
    } catch (err) {
      handleErr(err)
    }
  }

  async function load() {
    setBusy(true)
    try {
      const data = await callApi(RESOURCE_B, {}, token)
      setRows(data)
      setMsg(null)
      await loadOptions()
    } catch (err) {
      handleErr(err)
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function resetForm() {
    setNombreB('')
    setSelectedIds([])
    setEditId(null)
  }

  function toggleId(id) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  async function handleEdit(id) {
    setBusy(true)
    setMsg(null)
    try {
      // El listado no incluye entityAIds → consultar el detalle.
      const entity = await callApi(`${RESOURCE_B}/${id}`, {}, token)
      setEditId(entity.id)
      setNombreB(entity.nombreB || '')
      setSelectedIds(entity.entityAIds || [])
    } catch (err) {
      handleErr(err)
    } finally {
      setBusy(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (busy) return
    const nombre = nombreB.trim()
    if (!nombre) {
      setMsg({ text: 'El campo nombreB es obligatorio.', kind: 'err' })
      return
    }
    setBusy(true)
    setMsg(null)
    try {
      const body = { nombreB: nombre, entityAIds: selectedIds }
      if (editId != null) {
        await callApi(`${RESOURCE_B}/${editId}`, { method: 'PUT', body }, token)
        setMsg({ text: 'ENTITY-B actualizada correctamente.', kind: 'ok' })
      } else {
        await callApi(RESOURCE_B, { method: 'POST', body }, token)
        setMsg({ text: 'ENTITY-B creada correctamente.', kind: 'ok' })
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
    if (!window.confirm(`¿Eliminar ENTITY-B #${id}?`)) return
    setBusy(true)
    setMsg(null)
    try {
      await callApi(`${RESOURCE_B}/${id}`, { method: 'DELETE' }, token)
      setMsg({ text: 'ENTITY-B eliminada correctamente.', kind: 'ok' })
      if (editId === id) resetForm()
      await load()
    } catch (err) {
      handleErr(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="container">
      <section className="card">
        <h2>Crear / editar ENTITY-B</h2>
        <form onSubmit={handleSubmit}>
          <label>
            {editId != null ? `nombreB (editando #${editId})` : 'nombreB'}
            <input
              id="nombreB"
              value={nombreB}
              onChange={(e) => setNombreB(e.target.value)}
              required
              disabled={busy}
            />
          </label>
          <label>
            Entidades A asociadas (Feign)
            <div className="row">
              {entityAOptions.length === 0 && (
                <span className="meta">Sin opciones de ENTITYA disponibles.</span>
              )}
              {entityAOptions.map((entityA) => (
                <label key={entityA.id} className="check">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(entityA.id)}
                    onChange={() => toggleId(entityA.id)}
                    disabled={busy}
                  />
                  #{entityA.id} {entityA.nombreA}
                </label>
              ))}
            </div>
          </label>
          {msg && <p className={`msg show ${msg.kind}`}>{msg.text}</p>}
          <div className="row">
            <button className="btn primary" type="submit" disabled={busy}>
              {busy ? 'Guardando…' : editId != null ? 'Guardar cambios' : 'Crear ENTITY-B'}
            </button>
            {editId != null && (
              <button className="btn secondary" type="button" onClick={resetForm} disabled={busy}>
                Cancelar edición
              </button>
            )}
            <button className="btn secondary" type="button" onClick={load} disabled={busy}>
              Recargar lista
            </button>
          </div>
        </form>
      </section>

      <section className="card">
        <h2>Tabla ENTITY-B</h2>
        {rows === null && <p className="meta">Cargando…</p>}
        {Array.isArray(rows) && rows.length === 0 && (
          <p className="meta">No hay registros de ENTITY-B.</p>
        )}
        {Array.isArray(rows) && rows.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre B</th>
                <th>Nombre A (Feign)</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((entity) => (
                <tr key={entity.id}>
                  <td>{entity.id}</td>
                  <td>{entity.nombreB}</td>
                  <td>{entity.nombreA || 'Sin relación'}</td>
                  <td>
                    <div className="row">
                      <button
                        className="btn secondary"
                        type="button"
                        disabled={busy}
                        onClick={() => handleEdit(entity.id)}
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
        <div className="row">
          <a className="btn secondary" href="/dashboard">← Volver al dashboard</a>
        </div>
      </section>
    </main>
  )
}
