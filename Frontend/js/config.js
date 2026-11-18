/* 
   js/config.js  (Ariadna - F5)
   Única fuente de URLs y constantes del frontend.
   Se carga PRIMERO: los demás módulos leen el objeto global CONFIG.
   */
const CONFIG = Object.freeze({
  // Gateway (ver server.port en Gateway/src/main/resources/application.yml)
  AUTH_URL: "http://localhost:8083",
  API_URL: "http://localhost:8083",

  // Cliente OAuth2 registrado en el AuthServer (flujo password).
  // Nota: en producción se recomienda Authorization Code + PKCE para no
  // exponer el client_secret en el navegador.
  CLIENT_ID: "frontend",
  CLIENT_SECRET: "frontend-secret",
  SCOPE: "read",

  // Rutas (se concatenan a AUTH_URL o API_URL)
  ENDPOINTS: Object.freeze({
    TOKEN: "/oauth2/token",
    ENTITY_A: "/api/ENTITYA",
    ENTITY_B: "/api/ENTITYB"
  }),

  // Clave donde se guarda el token en sessionStorage
  TOKEN_KEY: "u3_access_token"
});

// Muestra la URL del Gateway en la interfaz (el script se carga al final del body).
(function () {
  const label = document.getElementById("apiUrlLabel");
  if (label) label.textContent = CONFIG.API_URL;
})();