(function () {
  "use strict";

  window.App = window.App || {};

  // Mostrar mensajes al usuario
function showMsg(element, text, kind = "ok") {
  if (typeof element === "string") {
    element = document.getElementById(element);
  }

  if (!element) return;

  const types = ["ok", "err", "warn", "info"];
  const type = types.includes(kind) ? kind : "info";

  element.textContent = String(text ?? "");
  element.className = "msg show " + type;
  element.hidden = false;

  element.setAttribute(
    "role",
    type === "err" ? "alert" : "status"
  );
}

  // Limpiar mensajes
  function clearMessage(element) {
    if (typeof element === "string") {
      element = document.getElementById(element);
    }

    if (!element) return;

    element.textContent = "";
    element.className = "msg";
    element.removeAttribute("role");
  }

  // Mostrar indicador HTTP
  function renderBadge(status) {
    const badge = document.createElement("span");

    const code = Number(status);

    badge.className = "status-badge";

    if (code >= 200 && code < 300) {
      badge.classList.add("status-success");
    } else if (code >= 400) {
      badge.classList.add("status-error");
    } else {
      badge.classList.add("status-info");
    }

    badge.textContent = String(status);

    return badge;
  }

  // Mostrar una tabla de registros
  function renderTable(container, rows, columns) {
    if (typeof container === "string") {
      container = document.getElementById(container);
    }

    if (!container) return;

    container.replaceChildren();

    if (!Array.isArray(rows) || rows.length === 0) {
      const empty = document.createElement("p");
      empty.textContent = "No hay registros disponibles.";
      empty.className = "meta";
      container.appendChild(empty);
      return;
    }

    if (!Array.isArray(columns) || !columns.length) {
      columns = Object.keys(rows[0]).map(key => ({
        key,
        label: key
      }));
    }

    const table = document.createElement("table");
    const thead = document.createElement("thead");
    const tbody = document.createElement("tbody");

    const headerRow = document.createElement("tr");

    columns.forEach(column => {
      const th = document.createElement("th");
      th.textContent = column.label || column.key;
      headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);

    rows.forEach(row => {
      const tr = document.createElement("tr");

      columns.forEach(column => {
        const td = document.createElement("td");
        const value = row[column.key];

        td.textContent =
          value === null || value === undefined
            ? "—"
            : Array.isArray(value)
              ? value.join(", ")
              : String(value);

        tr.appendChild(td);
      });

      tbody.appendChild(tr);
    });

    table.appendChild(thead);
    table.appendChild(tbody);
    container.appendChild(table);
  }

  // Mostrar estado de carga
  function showLoading(element, loading = true) {
    if (typeof element === "string") {
      element = document.getElementById(element);
    }

    if (!element) return;

    if (loading) {
      element.dataset.originalText =
        element.textContent || "";

      element.textContent = "Cargando...";
      element.disabled = true;
    } else {
      element.textContent =
        element.dataset.originalText || "Continuar";

      element.disabled = false;
      delete element.dataset.originalText;
    }
  }

  // Confirmación antes de eliminar
  function confirmDelete(name = "este registro") {
    return window.confirm(
      "¿Estás seguro de eliminar " + name + "?"
    );
  }


  // Generar notificaciones HTTP para React
  function httpNotice(status, message) {
    const code = Number(status);

    const validCode =
      Number.isInteger(code) &&
      code >= 100 &&
      code <= 599;

    return {
      status: validCode ? code : null,
      text: String(message ?? ""),
      kind:
        validCode && code >= 200 && code < 300
          ? "ok"
          : "err"
    };
  }

  // Publicar funciones para los otros módulos
  
  window.App.ui = {
    showMsg,
    clearMessage,
    renderTable,
    renderBadge,
    showLoading,
    confirmDelete,
    httpNotice
  };


  console.log("[UI] Módulo de interfaz cargado");
})();
