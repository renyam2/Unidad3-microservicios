/* ============================================================
   js/crud-b.js
   CRUD de ENTITY-B + comunicación Feign con MS-A

   Endpoints:
   GET    /api/ENTITYB
   GET    /api/ENTITYB/{id}
   POST   /api/ENTITYB
   PUT    /api/ENTITYB/{id}
   DELETE /api/ENTITYB/{id}

   Autenticación:
   Authorization: Bearer JWT
   ============================================================ */

(function () {
    "use strict";

    // ================= CONFIGURACIÓN =================

    const API_URL =
        (window.CONFIG && window.CONFIG.API_URL) ||
        "http://localhost:8083";

    const RESOURCE = "/api/ENTITYB";

    const $ = (id) => document.getElementById(id);

    // ================= AUTENTICACIÓN =================

    function getToken() {

        if (
            window.App &&
            window.App.auth &&
            typeof window.App.auth.getToken === "function"
        ) {
            return window.App.auth.getToken();
        }

        try {
            return sessionStorage.getItem("u3_access_token");
        } catch (error) {
            return null;
        }
    }

    // ================= MENSAJES =================

    function notify(text, kind = "ok") {

        const message = $("crudBMsg");

        if (!message) return;

        message.textContent = text;
        message.className = "msg show " + kind;
    }

    function clearMessage() {

        const message = $("crudBMsg");

        if (!message) return;

        message.textContent = "";
        message.className = "msg";
    }

    // ================= PETICIONES HTTP =================

    async function request(path, options = {}) {

        const headers = {
            ...(options.headers || {})
        };

        const token = getToken();

        if (token) {
            headers.Authorization = "Bearer " + token;
        }

        if (options.body !== undefined) {
            headers["Content-Type"] = "application/json";
        }

        let response;

        try {

            response = await fetch(API_URL + path, {
                ...options,
                headers
            });

        } catch (error) {

            notify(
                "No se pudo conectar con el Gateway.",
                "err"
            );

            throw error;
        }

        // Leer respuesta, incluso si viene vacía.
        const text = await response.text();

        let data = null;

        if (text) {
            try {
                data = JSON.parse(text);
            } catch (error) {
                data = text;
            }
        }

        // ================= ERRORES HTTP =================

        if (!response.ok) {

            let message =
                "ENTITY-B: operación fallida (" +
                response.status + ").";

            if (response.status === 401) {

                message = token
                    ? "Sesión expirada o token JWT inválido."
                    : "Debes iniciar sesión para acceder a MS-B.";

                if (
                    window.App?.auth &&
                    typeof window.App.auth.handle401 === "function"
                ) {
                    window.App.auth.handle401({
                        status: 401,
                        sentToken: Boolean(token)
                    });
                }

            } else if (response.status === 403) {

                message = "No tienes permisos para esta operación.";

            } else if (response.status === 404) {

                message = "No se encontró el registro solicitado.";

            } else if (response.status === 400) {

                message = "Los datos enviados no son válidos.";

            } else if (response.status >= 500) {

                message =
                    "Error del servidor o comunicación con MS-A.";
            }

            notify(message, "err");

            const operationError = new Error(message);
            operationError.status = response.status;
            operationError.data = data;

            throw operationError;
        }

        return data;
    }

    // ================= VALIDAR IDs DE MS-A =================

    function parseEntityAIds(value) {

        const input = value.trim();

        if (!input) {
            return [];
        }

        const parts = input.split(",");

        const ids = parts.map((part) => {

            const text = part.trim();

            if (!/^[1-9]\d*$/.test(text)) {
                throw new Error(
                    "Los IDs deben ser números enteros positivos."
                );
            }

            const id = Number(text);

            if (!Number.isSafeInteger(id)) {
                throw new Error("ID fuera del rango permitido.");
            }

            return id;
        });

        // Evitar identificadores repetidos.
        return [...new Set(ids)];
    }

    // ================= RENDERIZAR TABLA =================

    function render(rows) {

        const target = $("crudBResults");

        if (!target) return;

        target.innerHTML = "";

        if (!Array.isArray(rows) || rows.length === 0) {

            target.textContent =
                "No hay registros de ENTITY-B.";

            return;
        }

        const table = document.createElement("table");

        const thead = table.createTHead();
        const headerRow = thead.insertRow();

        [
            "ID",
            "Nombre B",
            "Nombre A (Feign)",
            "Acciones"
        ].forEach((title) => {

            const th = document.createElement("th");
            th.textContent = title;
            headerRow.appendChild(th);
        });

        const tbody = table.createTBody();

        rows.forEach((entity) => {

            const row = tbody.insertRow();

            // ID
            row.insertCell().textContent =
                entity.id ?? "";

            // Nombre de ENTITY-B
            row.insertCell().textContent =
                entity.nombreB || "";

            // Nombre obtenido mediante Feign desde MS-A
            row.insertCell().textContent =
                entity.nombreA || "Sin relación";

            // Acciones
            const actions = row.insertCell();

            const edit = document.createElement("button");

            edit.type = "button";
            edit.className = "secondary";
            edit.textContent = "Editar";
            edit.dataset.action = "edit";
            edit.dataset.id = entity.id;

            const remove = document.createElement("button");

            remove.type = "button";
            remove.className = "danger";
            remove.textContent = "Eliminar";
            remove.dataset.action = "delete";
            remove.dataset.id = entity.id;

            actions.append(edit, " ", remove);
        });

        target.appendChild(table);
    }

    // ================= CONSULTAR =================

    async function load() {

        clearMessage();

        const rows = await request(RESOURCE, {
            method: "GET"
        });

        render(rows);

        notify(
            "ENTITY-B: registros cargados correctamente.",
            "ok"
        );

        return rows;
    }

    // ================= CREAR =================

    async function create(nombreB, entityAIds) {

        const entity = await request(RESOURCE, {

            method: "POST",

            body: JSON.stringify({
                nombreB: nombreB.trim(),
                entityAIds
            })
        });

        await load();

        notify(
            "ENTITY-B creada correctamente.",
            "ok"
        );

        return entity;
    }

    // ================= EDITAR =================

    async function update(id, nombreB, entityAIds) {

        const entity = await request(
            RESOURCE + "/" + encodeURIComponent(id),
            {
                method: "PUT",

                body: JSON.stringify({
                    nombreB: nombreB.trim(),
                    entityAIds
                })
            }
        );

        await load();

        notify(
            "ENTITY-B actualizada correctamente.",
            "ok"
        );

        return entity;
    }

    // ================= ELIMINAR =================

    async function remove(id) {

        await request(
            RESOURCE + "/" + encodeURIComponent(id),
            {
                method: "DELETE"
            }
        );

        await load();

        notify(
            "ENTITY-B eliminada correctamente.",
            "ok"
        );
    }

    // ================= OBTENER POR ID =================

    async function getById(id) {

        return request(
            RESOURCE + "/" + encodeURIComponent(id),
            {
                method: "GET"
            }
        );
    }

    // ================= REINICIAR FORMULARIO =================

    function resetForm() {

        const form = $("crudBForm");

        if (!form) return;

        form.reset();

        $("crudBId").value = "";

        $("crudBSubmit").textContent =
            "Crear ENTITY-B";

        $("crudBCancel").classList.add("hidden");
    }

    // ================= EVENTOS =================

    function bind() {

        const form = $("crudBForm");

        if (!form) return;

        // CREAR O ACTUALIZAR
        form.addEventListener("submit", async (event) => {

            event.preventDefault();

            const nombreB =
                $("crudBName").value.trim();

            const id = $("crudBId").value;

            if (!nombreB) {
                notify(
                    "El campo nombreB es obligatorio.",
                    "err"
                );
                return;
            }

            let entityAIds;

            try {

                entityAIds = parseEntityAIds(
                    $("crudBAIds").value
                );

            } catch (error) {

                notify(error.message, "err");
                return;
            }

            const submit = $("crudBSubmit");

            submit.disabled = true;

            try {

                if (id) {
                    await update(id, nombreB, entityAIds);
                } else {
                    await create(nombreB, entityAIds);
                }

                resetForm();

            } catch (error) {
                // request() ya muestra errores HTTP.
            } finally {
                submit.disabled = false;
            }
        });

        // CANCELAR EDICIÓN
        $("crudBCancel").addEventListener(
            "click",
            resetForm
        );

        // ACTUALIZAR LISTA
        $("crudBLoad").addEventListener(
            "click",
            async () => {

                try {
                    await load();
                } catch (error) {
                    // Error mostrado por request().
                }
            }
        );

        // EDITAR Y ELIMINAR
        $("crudBResults").addEventListener(
            "click",
            async (event) => {

                const button =
                    event.target.closest("button[data-action]");

                if (!button) return;

                const id = button.dataset.id;

                // EDITAR
                if (button.dataset.action === "edit") {

                    button.disabled = true;

                    try {

                        // Consultar detalle porque el listado
                        // no contiene entityAIds.
                        const entity = await getById(id);

                        $("crudBId").value = entity.id;

                        $("crudBName").value =
                            entity.nombreB || "";

                        $("crudBAIds").value =
                            (entity.entityAIds || []).join(", ");

                        $("crudBSubmit").textContent =
                            "Guardar cambios";

                        $("crudBCancel")
                            .classList.remove("hidden");

                        $("crudBName").focus();

                        notify(
                            "Editando ENTITY-B #" + id,
                            "ok"
                        );

                    } catch (error) {
                        // request() muestra errores HTTP.
                    } finally {
                        button.disabled = false;
                    }

                    return;
                }

                // ELIMINAR
                if (button.dataset.action === "delete") {

                    const confirmed = window.confirm(
                        "¿Eliminar ENTITY-B #" + id + "?"
                    );

                    if (!confirmed) return;

                    button.disabled = true;

                    try {

                        await remove(id);

                        if ($("crudBId").value === id) {
                            resetForm();
                        }

                    } catch (error) {
                        // request() muestra errores HTTP.
                    } finally {
                        button.disabled = false;
                    }
                }
            }
        );
    }

    // ================= INICIALIZACIÓN =================

    window.App = window.App || {};

    window.App.crudB = {
        create,
        update,
        remove,
        load,
        getById
    };

    bind();

})();
