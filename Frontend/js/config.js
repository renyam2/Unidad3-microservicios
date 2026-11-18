// js/config.js — Ariadna (F5). Debe cargarse ANTES de auth.js (auth.js lee window.CONFIG al iniciar).
window.CONFIG = {
  // Prueba primero con el Gateway (fallback que usa auth.js). Si /oauth2/token no responde
  // por el Gateway, cambia AUTH_URL a "http://localhost:9000" (AuthServer directo).
  AUTH_URL: "http://localhost:8083",
  API_URL:  "http://localhost:8083",
  CLIENT_ID: "frontend",
  CLIENT_SECRET: "frontend-secret",
  SCOPE: "read",
  CARDS: [
    { id: "entitya", title: "ENTITYA", desc: "CRUD de MS-A (Nuvia)." },
    { id: "entityb", title: "ENTITYB", desc: "CRUD de MS-B + selección de entityAIds (Aldair)." },
  ],
};