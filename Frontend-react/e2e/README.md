# Prueba E2E (frontend React)

Requiere: Gateway (:8083), MS-A (:8081), MS-B (:8082), AuthServer (:9000) y el dev server de React corriendo en :5500.

```bash
cd Frontend-react
npm i -D puppeteer-core   # usa /usr/bin/chromium
node e2e/test.js
```

Cubre: login OAuth2 (grant password), dashboard, CRUD ENTITYA,
CRUD ENTITY-B con Feign (nombreA), logout y rutas protegidas.
