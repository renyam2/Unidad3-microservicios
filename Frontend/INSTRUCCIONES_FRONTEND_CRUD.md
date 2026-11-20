# Frontend CRUD — Instrucciones de trabajo para el equipo (6 integrantes)

## 1. Objetivo

Extender el frontend actual (login + listado) para soportar **CRUD completo**
(crear, leer, editar, eliminar) sobre `ENTITYA` y `ENTITYB`, dividiendo el
trabajo entre los **6 integrantes** de forma que puedan trabajar en paralelo
sin pisarse los archivos.

## 2. Estado actual

`Frontend/index.html` es un único archivo (HTML + CSS + JS vanilla, sin build).
Ya implementa (Fase 5 — Ariadna):

- Login OAuth2 (`POST /oauth2/token`, grant `password`)
- Almacenamiento del token en `sessionStorage`
- Decodificación del payload JWT y detección de expiración
- Listado de `ENTITYA` / `ENTITYB` vía Gateway
- Detección de 401 (sin token / expirado / inválido)

**Falta:** crear, editar y eliminar registros, y separar el código en módulos
para trabajo en equipo.

## 3. Estructura final del frontend

Para trabajar en paralelo, el `index.html` monolítico se divide en módulos:

```
Frontend/
├── index.html          ← Ariadna (estructura y markup)
├── css/
│   └── styles.css      ← Fernanda (estilos)
└── js/
    ├── config.js       ← Ariadna (CONFIG: URLs, client_id/secret, scope)
    ├── auth.js         ← Elian (login, token, sesión, logout)
    ├── api.js          ← Fernanda (callApi con Bearer, manejo de errores)
    ├── ui.js           ← Daniel (renderTable, mensajes, badges, pill de sesión)
    ├── crud-a.js       ← Nuvia (CRUD de ENTITYA)
    └── crud-b.js       ← Aldair (CRUD de ENTITYB)
```

Reglas de integración:

- Cada módulo expone sus funciones en un objeto global:
  `window.App = { config, auth, api, ui, crudA, crudB }`.
- `index.html` carga los scripts en este orden:
  `config.js → auth.js → api.js → ui.js → crud-a.js → crud-b.js`.
- Nadie modifica un archivo que no le corresponde; si necesita un cambio en
  otro módulo, se coordina por el canal del equipo (o se abre issue).
- `config.js` es la ÚNICA fuente de URLs: nadie hardcodea puertos en sus
  módulos.

## 4. División de trabajo por integrante

### Ariadna — Estructura y configuración (`index.html`, `js/config.js`)
*(Dueña del frontend — Fase 5 del plan original)*
- Migrar el markup actual a `index.html` y enlazar `css/styles.css` y los
  6 scripts.
- Crear las tarjetas (cards) nuevas:
  - Card "Crear ENTITYA" (campo `nombreA` + botón Crear)
  - Card "Tabla ENTITYA" (botones Editar / Eliminar por fila)
  - Card "Crear ENTITYB" (campo `nombreB` + selección de uno o más ENTITYA
    en checkboxes + botón Crear)
  - Card "Tabla ENTITYB" (botones Editar / Eliminar por fila)
- Definir `js/config.js`:
  ```js
  const CONFIG = {
    API_URL: "http://localhost:8080",   // Gateway (router de todo)
    CLIENT_ID: "frontend",
    CLIENT_SECRET: "frontend-secret",
    SCOPE: "read"
  };
  ```
- Entregable: página que carga sin errores de consola aunque los demás
  módulos aún no existan (usar stubs temporales).

### Elian — Autenticación (`js/auth.js`)
*(Domina el AuthServer — Fase 1 del plan original)*
- Extraer del `index.html` actual toda la lógica de sesión:
  - `login(username, password)` → `POST /oauth2/token`
  - `getToken() / setToken() / clearToken()` (sessionStorage)
  - `decodeJwt(token)`
  - `logout()`
  - `refreshSessionUI()` (pill "Sesión activa/Sin sesión", mostrar/ocultar
    token, fecha de expiración)
- Ajuste importante: si el token **expira o da 401**, llamar a
  `App.ui.showMsg(...)` y forzar re-login (ya existe esa lógica; moverla aquí).
- Entregable: login funcional desde el `index.html` de Ariadna.

### Fernanda — Capa de API y estilos (`js/api.js`, `css/styles.css`)
*(Domina el Gateway: rutas, CORS, propagación — Fase 4 del plan original)*
- `js/api.js`:
  - `callApi(path, { method = "GET", body, useToken = true })`
    → `fetch` con header `Authorization: Bearer <token>` cuando corresponde.
  - Devolver `{ status, ok, data, sentToken }`.
  - Manejo de errores: 401 (expirado → `App.auth.logout()`), 400/404/500
    (mostrar cuerpo del error), red/CORS (mensaje con el origen).
- `css/styles.css`:
  - Migrar los estilos actuales del `<style>` del `index.html`.
  - Agregar estilos para: filas de tabla con botones (Editar, Eliminar),
    formularios de creación, confirmaciones de borrado, estados de carga
    (botones deshabilitados), mensajes ok/err/warn.
- Entregable: `App.api.callApi` testeable desde la consola y hoja de
  estilos completa.

### Nuvia — CRUD de ENTITYA (`js/crud-a.js`)
*(Domina MS-A — Fase 2 del plan original)*
Endpoints (todos vía Gateway `http://localhost:8080`):

| Acción | Método | Ruta | Body |
|---|---|---|---|
| Listar | GET | `/api/ENTITYA` | — |
| Crear | POST | `/api/ENTITYA` | `{ "nombreA": "..." }` |
| Editar | PUT | `/api/ENTITYA/{id}` | `{ "nombreA": "..." }` |
| Eliminar | DELETE | `/api/ENTITYA/{id}` | — |

Implementar:
- `list()` → pintar tabla con `App.ui.renderTable` + columna de acciones.
- `create(nombreA)` → POST, validar respuesta, re-listar, mostrar mensaje ok/err.
- `update(id, nombreA)` → PUT con el nombre editado desde la fila (input inline
  o modal), re-listar.
- `remove(id)` → `confirm()` antes de DELETE, re-listar.
- Botones deshabilitados mientras hay peticiones en vuelo.
- Entregable: CRUD completo de ENTITYA usable desde el navegador.

### Aldair — CRUD de ENTITYB (`js/crud-b.js`)
*(Domina MS-B + Feign — Fase 3 del plan original)*

| Acción | Método | Ruta | Body |
|---|---|---|---|
| Listar | GET | `/api/ENTITYB` | — |
| Crear | POST | `/api/ENTITYB` | `{ "nombreB": "...", "entityAIds": [1, 2] }` |
| Editar | PUT | `/api/ENTITYB/{id}` | `{ "nombreB": "...", "entityAIds": [...] }` |
| Eliminar | DELETE | `/api/ENTITYB/{id}` | — |

Implementar:
- Lo mismo que Nuvia, **más** la selección de `entityAIds`:
  - Al abrir el formulario de creación/edición, llamar `App.crudA.list()`
    (o `App.api.callApi("/api/ENTITYA")`) y pintar los ENTITYA como
    checkboxes con su `id` y `nombreA`.
  - Validar que haya al menos un ENTITYA seleccionado antes de enviar.
  - En la tabla, pintar `entityAIds` como lista de ids (el `renderTable`
    de Daniel ya soporta arrays con `v.join(", ")`).
- Entregable: CRUD completo de ENTITYB, incluyendo el vínculo con ENTITYA.

### Daniel — UI compartida, integración y pruebas (`js/ui.js`, integración)
*(Integración end-to-end y reporte — Fase 6 del plan original)*
- `js/ui.js`:
  - `renderTable(rows)` (migrado del index.html actual).
  - `renderResult(label, path, r)` (badge de estado HTTP + tabla o `<pre>`).
  - `showMsg(el, text, kind)` / `hideMsg(el)`.
  - `withLoading(btn, fn)` → helper que deshabilita un botón durante el `await`.
- **Integrador**: ensamblar los 6 módulos en `index.html`, resolver
  conflictos de nombres, asegurar el orden de carga y que `App.*` esté
  completo.
- **Pruebas de aceptación** (ver sección 7) y capturas de pantalla.
- Entregable: frontend completo funcionando end-to-end + evidencia.

## 5. API de referencia (vía Gateway, puerto 8080)

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/oauth2/token` | Login (grant `password`) → `{ access_token, expires_in }` |
| GET | `/api/ENTITYA` | Lista ENTITYA |
| POST | `/api/ENTITYA` | Crear ENTITYA — `{ nombreA }` |
| PUT | `/api/ENTITYA/{id}` | Editar ENTITYA — `{ nombreA }` |
| DELETE | `/api/ENTITYA/{id}` | Eliminar ENTITYA |
| GET | `/api/ENTITYB` | Lista ENTITYB |
| POST | `/api/ENTITYB` | Crear ENTITYB — `{ nombreB, entityAIds: [...] }` |
| PUT | `/api/ENTITYB/{id}` | Editar ENTITYB — `{ nombreB, entityAIds: [...] }` |
| DELETE | `/api/ENTITYB/{id}` | Eliminar ENTITYB |

Toda petición a datos lleva `Authorization: Bearer <token>`. Sin token → 401.

## 6. Flujo de trabajo (Git)

1. Rama base: `main` con el `index.html` actual.
2. Cada integrante crea su rama desde `main`:
   - `feature/estructura` (Ariadna)
   - `feature/auth` (Elian)
   - `feature/api-ui` (Fernanda)
   - `feature/crud-a` (Nuvia)
   - `feature/crud-b` (Aldair)
   - `feature/integracion` (Daniel)
3. **Orden de integración** (dependencias):
   1. Ariadna (estructura) → se mergea primero a `main`.
   2. Elian, Fernanda y Daniel en paralelo (no se tocan entre sí) → merge a `main`.
      - **Elian no está bloqueado por Ariadna:** puede extraer la lógica de
        sesión del `index.html` actual (que ya está en `main`) y usar el
        `CONFIG` global que ya existe en ese archivo (o un `CONFIG` temporal
        dentro de `auth.js`). Los hooks de UI (`refreshSessionUI`, `showMsg`)
        se dejan como stubs hasta que Daniel mergee `ui.js`.
   3. Nuvia y Aldair en paralelo (dependen de Ariadna + Fernanda + Daniel) → merge a `main`.
   4. Daniel hace la pasada final de integración y pruebas.
4. Reglas:
   - Commits pequeños y con mensaje descriptivo.
   - No mergear a `main` con errores de consola.
   - Si un módulo depende de otro, usar la versión de `main` actualizada
     (`git pull` antes de empezar el día).
5. Servidor local para probar: `python3 -m http.server 5500` dentro de
   `Frontend/` (el Gateway solo permite CORS desde `http://localhost:5500`).

## 7. Criterios de aceptación (checklist final)

- [ ] Login con `user`/`pass123` obtiene token y muestra "Sesión activa".
- [ ] El token se muestra/oculta y su expiración se ve en la UI.
- [ ] Cerrar sesión borra el token y oculta la tarjeta de token.
- [ ] **Crear** ENTITYA con un `nombreA` → aparece en la tabla (200/201).
- [ ] **Editar** ENTITYA → el nombre cambia en la tabla (200).
- [ ] **Eliminar** ENTITYA → pide confirmación y desaparece de la tabla (200/204).
- [ ] **Crear** ENTITYB eligiendo al menos un ENTITYA → aparece con sus `entityAIds`.
- [ ] **Editar** ENTITYB → cambian `nombreB` y/o `entityAIds`.
- [ ] **Eliminar** ENTITYB → desaparece de la tabla.
- [ ] Sin token (o con token expirado) → 401 con mensaje claro y re-login.
- [ ] Sin backend arriba → mensaje de error de conexión (no pantalla en blanco).
- [ ] Consola del navegador sin errores en todo el flujo.
- [ ] Capturas de pantalla de cada operación (crear, editar, eliminar, 401).

## 8. Cómo ejecutar el sistema completo

```bash
# 1. Eureka (8761)
cd EurekaServer && ./mvnw spring-boot:run

# 2. AuthServer (9000)
cd AuthServer && ./mvnw spring-boot:run

# 3. MS-A (8081)
cd MS-A && ./mvnw spring-boot:run

# 4. MS-B (8082)
cd MS-B && ./mvnw spring-boot:run

# 5. Gateway (8080) — requiere JDK 21+
cd Gateway && JAVA_HOME=/usr/lib/jvm/java-27-openjdk ./mvnw spring-boot:run

# 6. Frontend (5500)
cd Frontend && python3 -m http.server 5500
```

Abrir `http://localhost:5500`.
