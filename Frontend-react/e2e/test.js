const puppeteer = require('puppeteer-core')

const BASE = 'http://localhost:5500'
let passed = 0
let failed = 0

function check(name, cond) {
  if (cond) {
    passed++
    console.log(`  OK  ${name}`)
  } else {
    failed++
    console.log(`  FAIL ${name}`)
  }
}

async function waitFor(fn, timeout = 8000) {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    if (await fn()) return true
    await new Promise((r) => setTimeout(r, 250))
  }
  return false
}

async function main() {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium',
    headless: true,
    args: ['--no-sandbox', '--disable-gpu'],
  })
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  page.on('dialog', (d) => d.accept())

  console.log('\n[1] Login')
  await page.goto(BASE + '/login', { waitUntil: 'load' })
  await waitFor(() => page.$('#username'))
  await page.type('#username', 'user')
  await page.type('#password', 'pass123')
  await page.click('button[type=submit]')
  const logged = await waitFor(() => page.url().includes('/dashboard'))
  check('login redirige a /dashboard', logged)
  check('token en sessionStorage', !!(await page.evaluate(() => sessionStorage.getItem('u3_access_token'))))

  console.log('\n[2] Dashboard')
  const dashText = await page.evaluate(() => document.body.innerText)
  check('dashboard muestra estado de sesión', /Sesión activa/.test(dashText))

  console.log('\n[3] Divisiones (CRUD ENTITYA)')
  await page.goto(BASE + '/divisiones', { waitUntil: 'load' })
  const loaded = await waitFor(() =>
    page.evaluate(() => !!document.querySelector('table tbody tr'))
  )
  check('tabla ENTITYA carga registros', loaded)

  // Crear
  await waitFor(() => page.$('#name'))
  await page.type('#name', 'Division E2E React')
  await page.click('button[type=submit]')
  const created = await waitFor(() =>
    page.evaluate(() => document.body.innerText.includes('Division E2E React'))
  )
  check('crear ENTITYA aparece en tabla', created)

  // Editar
  const editBtns = await page.$$('tbody button')
  const lastRow = await page.$('tbody tr:last-child')
  const btns = await lastRow.$$('button')
  await btns[0].click() // Editar
  await page.focus('#name')
  await page.keyboard.down('Control')
  await page.keyboard.press('a')
  await page.keyboard.up('Control')
  await page.keyboard.type('Division E2E Editada')
  await page.click('button[type=submit]')
  const edited = await waitFor(() =>
    page.evaluate(() => document.body.innerText.includes('Division E2E Editada'))
  )
  check('editar ENTITYA refleja cambio', edited)

  // Eliminar
  await page.evaluate(() => {
    const rows = [...document.querySelectorAll('tbody tr')]
    const row = rows.find((r) => r.textContent.includes('Division E2E Editada'))
    const del = [...row.querySelectorAll('button')].find((b) => b.textContent.includes('Eliminar'))
    del.click()
  })
  const removed = await waitFor(async () =>
    !(await page.evaluate(() => document.body.innerText.includes('Division E2E Editada')))
  )
  check('eliminar ENTITYA desaparece de tabla', removed)

  console.log('\n[4] Programas (CRUD ENTITYB + Feign)')
  await page.goto(BASE + '/programas', { waitUntil: 'load' })
  const loadedB = await waitFor(() =>
    page.evaluate(() => !!document.querySelector('table tbody tr'))
  )
  check('tabla ENTITY-B carga registros', loadedB)

  // Crear con checkbox de ENTITYA
  await waitFor(() => page.$('#nombreB'))
  await page.type('#nombreB', 'Programa E2E')
  const checkboxes = await page.$$('input[type=checkbox]')
  check('hay checkboxes de ENTITYA', checkboxes.length > 0)
  await checkboxes[0].click()
  await page.click('button[type=submit]')
  const createdB = await waitFor(() =>
    page.evaluate(() => document.body.innerText.includes('Programa E2E'))
  )
  check('crear ENTITY-B aparece en tabla', createdB)

  // Feign: la última fila debe mostrar un nombreA resuelto (a-uno/a-dos/a-tres)
  const feignOk = await page.evaluate(() => {
    const rows = [...document.querySelectorAll('tbody tr')]
    const row = rows.find((r) => r.textContent.includes('Programa E2E'))
    if (!row) return false
    return /a-uno|a-dos|a-tres/.test(row.textContent)
  })
  check('columna Nombre A (Feign) resuelta en MS-B', feignOk)

  // Editar (usa GET /api/ENTITYB/{id})
  await page.evaluate(() => {
    const rows = [...document.querySelectorAll('tbody tr')]
    const row = rows.find((r) => r.textContent.includes('Programa E2E'))
    const edit = [...row.querySelectorAll('button')].find((b) => b.textContent.includes('Editar'))
    edit.click()
  })
  await waitFor(() =>
    page.evaluate(
      () =>
        !document.querySelector('#nombreB').disabled &&
        document.querySelector('#nombreB').value.length > 0
    )
  )
  await page.focus('#nombreB')
  await page.keyboard.down('Control')
  await page.keyboard.press('a')
  await page.keyboard.up('Control')
  await page.keyboard.type('Programa E2E v2')
  await page.click('button[type=submit]')
  const editedB = await waitFor(() =>
    page.evaluate(() => document.body.innerText.includes('Programa E2E v2'))
  )
  check('editar ENTITY-B refleja cambio', editedB)

  // Eliminar
  await page.evaluate(() => {
    const rows = [...document.querySelectorAll('tbody tr')]
    const row = rows.find((r) => r.textContent.includes('Programa E2E v2'))
    const del = [...row.querySelectorAll('button')].find((b) => b.textContent.includes('Eliminar'))
    del.click()
  })
  const removedB = await waitFor(async () =>
    !(await page.evaluate(() => document.body.innerText.includes('Programa E2E v2')))
  )
  check('eliminar ENTITY-B desaparece de tabla', removedB)

  console.log('\n[5] Cierre de sesión y rutas protegidas')
  await page.goto(BASE + '/dashboard', { waitUntil: 'load' })
  await page.click('button.btn') // Cerrar sesión
  const loggedOut = await waitFor(() => page.url().includes('/login'))
  check('logout redirige a /login', loggedOut)

  await page.goto(BASE + '/divisiones')
  const protectedOk = await waitFor(() => page.url().includes('/login'))
  check('/divisiones sin token redirige a /login', protectedOk)

  const realErrors = errors.filter(
    (e) => !/Failed to load resource/.test(e) && !/favicon/.test(e)
  )
  check('sin errores de JS en consola', realErrors.length === 0)
  if (realErrors.length) console.log('  consola:', realErrors)

  await browser.close()
  console.log(`\nResultado: ${passed} OK, ${failed} FAIL`)
  process.exit(failed ? 1 : 0)
}

main().catch((e) => {
  console.error('Error de prueba:', e.message)
  process.exit(2)
})
