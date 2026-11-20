
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
  const [msg, setMsg] = useState(null)

  // Notificaciones centralizadas mediante ui.js
  function notifyHttp(status, text) {
    const notice = window.App?.ui?.httpNotice?.(status, text)

    setMsg(
      notice || {
        status: status ?? null,
        text,
        kind: Number(status) >= 200 && Number(status) < 300
          ? 'ok'
          : 'err'
      }
    )
  }

  // Manejo de errores HTTP y sesión
  function handleErr(err) {
    notifyHttp(
      err.status ?? null,
      err.message || 'No se pudo completar la operación.'
    )

    if (err.status === 401) {
      logout()
      navigate('/login', { replace: true })
    }
  }

  // Consultar divisiones para las relaciones Feign
  async function loadOptions() {
    const data = await callApi(RESOURCE_A, {}, token)
    setEntityAOptions(Array.isArray(data) ? data : [])
  }

  // Consultar programas educativos
  async function load(showNotice = false) {
    setBusy(true)

    try {
      const response = await callApi(
        RESOURCE_B,
        { includeResponse: true },
        token
      )

      setRows(response.data)

      await loadOptions()

      if (showNotice) {
        notifyHttp(
          response.status,
          'Programas educativos consultados correctamente.'
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
    setNombreB('')
    setSelectedIds([])
    setEditId(null)
  }

  function toggleId(id) {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
    )
  }

  // Editar programa educativo
  async function handleEdit(id) {
    setBusy(true)
    setMsg(null)

    try {
      const response = await callApi(
        `${RESOURCE_B}/${id}`,
        { includeResponse: true },
        token
      )

      const entity = response.data

      setEditId(entity.id)
      setNombreB(entity.nombreB || '')
      setSelectedIds(entity.entityAIds || [])

      notifyHttp(
        response.status,
        'Programa educativo cargado para edición.'
      )
    } catch (err) {
      handleErr(err)
    } finally {
      setBusy(false)
    }
  }

  // Crear o actualizar programa educativo
  async function handleSubmit(e) {
    e.preventDefault()
    if (busy) return

    const nombre = nombreB.trim()

    if (!nombre) {
      notifyHttp(
        null,
        'El nombre del programa educativo es obligatorio.'
      )
      return
    }

    setBusy(true)
    setMsg(null)

    try {
      const body = {
        nombreB: nombre,
        entityAIds: selectedIds
      }

      const editing = editId != null

      const response = editing
        ? await callApi(
            `${RESOURCE_B}/${editId}`,
            {
              method: 'PUT',
              body,
              includeResponse: true
            },
            token
          )
        : await callApi(
            RESOURCE_B,
            {
              method: 'POST',
              body,
              includeResponse: true
            },
            token
          )

      resetForm()

      // Recargar datos sin borrar el aviso
      const loaded = await load()

      if (loaded) {
        notifyHttp(
          response.status,
          editing
            ? 'Programa educativo actualizado correctamente.'
            : 'Programa educativo creado correctamente.'
        )
      }
    } catch (err) {
      handleErr(err)
    } finally {
      setBusy(false)
    }
  }

  // Eliminar programa educativo
  async function handleRemove(id) {
    if (!window.confirm(`¿Eliminar programa educativo #${id}?`)) {
      return
    }

    setBusy(true)
    setMsg(null)

    try {
      const response = await callApi(
        `${RESOURCE_B}/${id}`,
        {
          method: 'DELETE',
          includeResponse: true
        },
        token
      )

      if (editId === id) {
        resetForm()
      }

      const loaded = await load()

      if (loaded) {
        notifyHttp(
          response.status,
          'Programa educativo eliminado correctamente.'
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
        <h2>Crear / editar Programas Educativos</h2>

        <form onSubmit={handleSubmit}>
          <label>
            {editId != null
              ? `Nombre del programa (editando #${editId})`
              : 'Nombre del programa educativo'}

            <input
              id="nombreB"
              value={nombreB}
              onChange={(e) => setNombreB(e.target.value)}
              required
              disabled={busy}
            />
          </label>

          <label>
            Divisiones asociadas (OpenFeign)

            <div className="row">
              {entityAOptions.length === 0 && (
                <span className="meta">
                  No hay divisiones disponibles.
                </span>
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

          {/* Notificaciones HTTP de ui.js */}
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
            <button
              className="btn primary"
              type="submit"
              disabled={busy}
            >
              {busy
                ? 'Guardando…'
                : editId != null
                  ? 'Guardar cambios'
                  : 'Crear Programa Educativo'}
            </button>

            {editId != null && (
              <button
                className="btn secondary"
                type="button"
                onClick={resetForm}
                disabled={busy}
              >
                Cancelar edición
              </button>
            )}

            <button
              className="btn secondary"
              type="button"
              onClick={() => load(true)}
              disabled={busy}
            >
              Recargar lista
            </button>
          </div>
        </form>
      </section>

      <section className="card">
        <h2>Tabla de Programas Educativos</h2>

        {rows === null && (
          <p className="meta">Cargando…</p>
        )}

        {Array.isArray(rows) && rows.length === 0 && (
          <p className="meta">
            No hay programas educativos registrados.
          </p>
        )}

        {Array.isArray(rows) && rows.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Programa Educativo</th>
                <th>División (Feign)</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((entity) => (
                <tr key={entity.id}>
                  <td>{entity.id}</td>
                  <td>{entity.nombreB}</td>
                  <td>
                    {entity.nombreA || 'Sin relación'}
                  </td>
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
          <a
            className="btn secondary"
            href="/dashboard"
          >
            ← Volver al dashboard
          </a>
        </div>
      </section>
    </main>
  )
}
