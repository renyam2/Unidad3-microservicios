/* ============================================================
   js/crud-a.js — M4: CRUD de ENTITYA
   Usa el token de App.auth cuando está disponible y expone:
   window.App.crudA = { create, update, remove, load }
   ============================================================ */
(function () {
  "use strict";

  const API_URL = (window.CONFIG && window.CONFIG.API_URL) || "http://localhost:8083";
  const RESOURCE = "/api/ENTITYA";
  const $ = (id) => document.getElementById(id);

  function getToken() {
    if (window.App && window.App.auth && typeof window.App.auth.getToken === "function") {
      return window.App.auth.getToken();
    }
    try { return sessionStorage.getItem("u3_access_token"); } catch (e) { return null; }
  }

  function notify(text, kind = "ok") {
  const message = $("crudAMsg") || $("dataMsg");

  if (!message) return;

  if (window.App?.ui?.showMsg) {
    window.App.ui.showMsg(message, text, kind);
  } else {
    message.textContent = text;
    message.className = "msg show " + kind;
  }
}

  async function request(path, options) {
    const headers = Object.assign({}, options && options.headers);
    const token = getToken();
    if (token) headers.Authorization = "Bearer " + token;
    if (options && options.body) headers["Content-Type"] = "application/json";

    let response;
    try {
      response = await fetch(API_URL + path, Object.assign({}, options, { headers }));
    } catch (error) {
      notify("No se pudo conectar con el Gateway.", "err");
      throw error;
    }

    const text = await response.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch (error) { data = text; }
    if (!response.ok) {
      if (response.status === 401 && window.App && window.App.auth &&
          typeof window.App.auth.handle401 === "function") {
        window.App.auth.handle401({ status: response.status, sentToken: !!token });
      } else {
        notify("ENTITYA: la operación falló (" + response.status + ").", "err");
      }
      const operationError = new Error("ENTITYA request failed: " + response.status);
      operationError.status = response.status;
      operationError.data = data;
      throw operationError;
    }
    return data;
  }

  function render(rows) {
    const target = $("crudAResults");
    if (!target) return;
    target.innerHTML = "";
    if (!Array.isArray(rows) || rows.length === 0) {
      target.textContent = "Sin registros.";
      return;
    }

    const table = document.createElement("table");
    table.innerHTML = "<thead><tr><th>ID</th><th>Nombre</th><th>Acciones</th></tr></thead>";
    const body = table.createTBody();
    rows.forEach((entity) => {
      const row = body.insertRow();
      row.insertCell().textContent = entity.id == null ? "" : entity.id;
      row.insertCell().textContent = entity.nombreA || "";
      const actions = row.insertCell();
      const edit = document.createElement("button");
      edit.type = "button";
      edit.className = "secondary";
      edit.textContent = "Editar";
      edit.dataset.action = "edit";
      edit.dataset.id = entity.id;
      edit.dataset.name = entity.nombreA || "";
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

  async function load() {
    const rows = await request(RESOURCE, { method: "GET" });
    render(rows);
    return rows;
  }

  async function create(nombreA) {
    const entity = await request(RESOURCE, {
      method: "POST",
      body: JSON.stringify({ nombreA: nombreA.trim() })
    });
    notify("ENTITYA creada correctamente.", "ok");
    await load();
    return entity;
  }

  async function update(id, nombreA) {
    const entity = await request(RESOURCE + "/" + encodeURIComponent(id), {
      method: "PUT",
      body: JSON.stringify({ nombreA: nombreA.trim() })
    });
    notify("ENTITYA actualizada correctamente.", "ok");
    await load();
    return entity;
  }

  async function remove(id) {
    await request(RESOURCE + "/" + encodeURIComponent(id), { method: "DELETE" });
    notify("ENTITYA eliminada correctamente.", "ok");
    await load();
  }

  function resetForm() {
    const form = $("crudAForm");
    if (!form) return;
    form.reset();
    $("crudAId").value = "";
    $("crudASubmit").textContent = "Crear ENTITYA";
    $("crudACancel").classList.add("hidden");
  }

  function bind() {
    const form = $("crudAForm");
    if (!form) return;
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const name = $("crudAName").value.trim();
      const id = $("crudAId").value;
      if (!name) {
        notify("El campo nombreA es obligatorio.", "err");
        return;
      }
      $("crudASubmit").disabled = true;
      try {
        if (id) await update(id, name);
        else await create(name);
        resetForm();
      } catch (error) {
        // request() already reports the HTTP or connection error.
      } finally {
        $("crudASubmit").disabled = false;
      }
    });

    $("crudACancel").addEventListener("click", resetForm);
    $("crudAResults").addEventListener("click", async (event) => {
      const button = event.target.closest("button[data-action]");
      if (!button) return;
      const id = button.dataset.id;
      if (button.dataset.action === "edit") {
        $("crudAId").value = id;
        $("crudAName").value = button.dataset.name;
        $("crudASubmit").textContent = "Guardar cambios";
        $("crudACancel").classList.remove("hidden");
        $("crudAName").focus();
        return;
      }
      if (button.dataset.action === "delete" &&
          window.confirm("¿Eliminar ENTITYA #" + id + "?")) {
        button.disabled = true;
        try { await remove(id); } catch (error) { /* request() reports the error. */ }
        finally { button.disabled = false; }
      }
    });

    $("crudALoad").addEventListener("click", async () => {
      try { await load(); } catch (error) { /* request() reports the error. */ }
    });
  }

  window.App = window.App || {};
  window.App.crudA = { create, update, remove, load };
  bind();
})();
