/* ============================================================
   js/auth.js — Elian (login, token, sesión, logout)
   Extraído del index.html actual (Fase 5 — Ariadna).
   Exponido en: window.App.auth
   ============================================================ */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const TOKEN_KEY = "u3_access_token";

  /* CONFIG: usa el CONFIG global (index.html / config.js);
     si aún no existe, usa un CONFIG temporal. */
  const CONFIG = (typeof window.CONFIG !== "undefined" && window.CONFIG)
    ? window.CONFIG
    : {
        AUTH_URL: "http://localhost:8083",
        API_URL: "http://localhost:8083",
        CLIENT_ID: "frontend",
        CLIENT_SECRET: "frontend-secret",
        SCOPE: "read"
      };

  /* ---------------- TOKEN (sessionStorage) ---------------- */
  function getToken() {
    try { return sessionStorage.getItem(TOKEN_KEY); } catch (e) { return null; }
  }
  function setToken(t) {
    try { sessionStorage.setItem(TOKEN_KEY, t); } catch (e) {}
  }
  function clearToken() {
    try { sessionStorage.removeItem(TOKEN_KEY); } catch (e) {}
  }

  /* ---------------- DECODIFICAR JWT ---------------- */
  function decodeJwt(token) {
    try {
      const part = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
      return JSON.parse(decodeURIComponent(escape(atob(part))));
    } catch (e) { return null; }
  }

  /* ---------------- UI de sesión ---------------- */
  let tokenVisible = false;
  function maskToken(t) {
    return t.slice(0, 10) + "••••••••••••••••••••••••••••••  (token oculto)";
  }

  /* Hook de UI: stub hasta que Daniel mergee ui.js.
     Si App.ui.showMsg existe, lo usa; si no, avisa por consola. */
  function notify(text, kind) {
    const ui = window.App && window.App.ui;
    if (ui && typeof ui.showMsg === "function") {
      const el = $("dataMsg") || $("loginMsg");
      if (el) { ui.showMsg(el, text, kind); return; }
    }
    console.warn("[auth] (" + kind + ")", text);
  }

  /* Pill "Sesión activa/Sin sesión", mostrar/ocultar token,
     payload del token y fecha de expiración. */
  function refreshSessionUI() {
    const pill = $("sessionPill");
    if (!pill) return; /* el markup de Ariadna aún no existe */
    const token = getToken();
    if (!token) {
      pill.textContent = "Sin sesión";
      pill.className = "pill";
      $("tokenCard").classList.add("hidden");
      return;
    }
    const payload = decodeJwt(token);
    pill.textContent = "Sesión activa";
    pill.className = "pill on";
    $("tokenCard").classList.remove("hidden");
    $("tokenBox").value = tokenVisible ? token : maskToken(token);
    $("toggleToken").textContent = tokenVisible ? "Ocultar token" : "Mostrar token";
    $("tokenPayload").textContent = payload ? JSON.stringify(payload, null, 2) : "(no se pudo decodificar)";
    if (payload && payload.exp) {
      const exp = new Date(payload.exp * 1000);
      const expired = exp.getTime() < Date.now();
      $("tokenMeta").textContent = (expired ? "EXPIRADO el " : "Expira el ") + exp.toLocaleString();
    } else {
      $("tokenMeta").textContent = "";
    }
  }

  /* Botón "Mostrar token / Ocultar token" */
  const toggle = $("toggleToken");
  if (toggle) {
    toggle.addEventListener("click", () => {
      tokenVisible = !tokenVisible;
      refreshSessionUI();
    });
  }

  /* ---------------- LOGIN ---------------- */
  /* POST /oauth2/token (grant password) → access_token */
  async function login(username, password) {
    const authUrl = CONFIG.AUTH_URL || CONFIG.API_URL;
    const body = new URLSearchParams({
      grant_type: "password",
      username: username.trim(),
      password: password,
      scope: CONFIG.SCOPE,
      client_id: CONFIG.CLIENT_ID,
      client_secret: CONFIG.CLIENT_SECRET
    });
    let res;
    try {
      res = await fetch(authUrl + "/oauth2/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body
      });
    } catch (e) {
      notify("No se pudo conectar con " + authUrl + ". Revisa que el AuthServer esté arriba y que permita CORS para este origen (" + location.origin + ").", "err");
      throw new Error("Sin conexión con " + authUrl);
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.access_token) {
      notify("Login fallido (" + res.status + "): " + (data.error_description || data.error || "credenciales incorrectas"), "err");
      throw new Error("Login fallido (" + res.status + ")");
    }
    setToken(data.access_token);
    notify("Login correcto. Token recibido (expira en " + (data.expires_in || "?") + " s).", "ok");
    refreshSessionUI();
    return data;
  }

  /* ---------------- LOGOUT ---------------- */
  function logout() {
    clearToken();
    tokenVisible = false;
    refreshSessionUI();
  }

  /* ---------------- MANEJO DE 401 ---------------- */
  /* Si el token expira o da 401: notificar (App.ui.showMsg)
     y forzar re-login. (Lógica movida del load() del index.html) */
  function handle401(r) {
    const sentToken = !!(r && r.sentToken);
    const payload = getToken() ? decodeJwt(getToken()) : null;
    const expired = payload && payload.exp && payload.exp * 1000 < Date.now();
    let msg;
    if (!sentToken) {
      msg = "401 No autorizado: la petición se envió sin token.";
    } else if (expired) {
      msg = "401 No autorizado: el token expiró. Vuelve a iniciar sesión.";
      clearToken();
      refreshSessionUI(); /* forzar re-login */
    } else {
      msg = "401 No autorizado: el token no fue aceptado (inválido o emitido por otro AuthServer).";
    }
    notify(msg, "warn");
  }

  /* ---------------- REGISTRO EN window.App ---------------- */
  window.App = window.App || {};
  window.App.auth = {
    login,
    getToken,
    setToken,
    clearToken,
    decodeJwt,
    logout,
    refreshSessionUI,
    handle401
  };

  /* Inicialización: pintar el estado de sesión al cargar */
  refreshSessionUI();
})();
