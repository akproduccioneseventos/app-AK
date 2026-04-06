# 🎭 Guía de Pruebas E2E con Playwright

## ¿Qué son las pruebas E2E?

Las pruebas **End-to-End (E2E)** simulan a un usuario real usando la aplicación.
Playwright controla un browser real (Chromium) y navega por la app como lo haría una persona,
haciendo clic en botones, completando formularios y verificando que los resultados sean correctos.

---

## Requisitos previos

- Node.js 18+
- La app corriendo localmente en `http://localhost:3000`

---

## Variables de entorno

Crea un archivo `.env.test.local` (o exportá las variables en tu shell) con los siguientes valores:

```bash
# URL base de la app (default: http://localhost:3000)
E2E_BASE_URL=http://localhost:3000

# Contraseña de demo para las pruebas autenticadas
E2E_DEMO_PASSWORD=tu_contraseña_aqui
```

> ⚠️ **Nunca commitees credenciales reales.** Usa el archivo `.env.test.local` (está en `.gitignore`).

---

## Cómo correr los tests localmente

### 1. Levantá la app

```bash
# Opción A: servidor de producción (recomendado para tests)
npm run build
npm run start

# Opción B: servidor de desarrollo
npm run dev
```

### 2. Corré los tests E2E

```bash
# Correr todos los tests en modo headless (sin browser visible)
npm run test:e2e

# Correr con la UI interactiva de Playwright (browser visible + inspector)
npm run test:e2e:ui

# Correr en modo debug (paso a paso)
npm run test:e2e:debug

# Correr un archivo específico
npx playwright test e2e/01-smoke.spec.ts

# Correr con browser visible
npx playwright test --headed
```

---

## Estructura de los tests

```
e2e/
├── fixtures.ts              # Fixtures compartidos (authPage con sesión inyectada)
├── helpers/
│   └── auth.ts              # Helpers de autenticación (injectAuthSession, loginAsDemo)
├── 01-smoke.spec.ts         # Smoke test: landing público
├── 02-login.spec.ts         # Tests del flujo de login
├── 03-presupuesto.spec.ts   # Wizard de creación de presupuesto
├── 04-fiesta.spec.ts        # Creación de fiestas / eventos
├── 05-carga-operativa.spec.ts  # Módulo de logística
├── 06-catering.spec.ts      # Módulo de gastronomía
├── 07-decoracion.spec.ts    # Módulo de decoración
└── 08-galeria-landing.spec.ts  # Galería pública en el landing
```

---

## Estrategia de autenticación

La app usa autenticación basada en **sessionStorage** (no Firebase Auth para la UI). El fixture
`authPage` inyecta un token de sesión válido antes de cada navegación usando `addInitScript`,
lo que evita el redirect al login sin pasar por la UI de login.

Para tests que prueban el **flujo de login explícitamente** (como `02-login.spec.ts`),
se usa la función `loginAsDemo()` que navega al formulario y completa las credenciales.

---

## Cómo grabar una traza (trace)

Las trazas se graban automáticamente en el primer retry de un test fallido.
Para grabar manualmente durante un test:

```bash
# Correr con trazas siempre activadas
npx playwright test --trace on

# Ver una traza grabada
npx playwright show-trace test-results/<nombre-del-test>/trace.zip
```

---

## Cómo ver el reporte HTML

Después de correr los tests, se genera un reporte HTML en `playwright-report/`:

```bash
# Correr tests y abrir el reporte automáticamente
npx playwright test && npx playwright show-report

# O abrir el reporte de una corrida anterior
npx playwright show-report
```

El reporte incluye:
- ✅ Tests pasados
- ❌ Tests fallidos con screenshots y trazas
- 📊 Métricas de tiempo

---

## Selectores estables (`data-testid`)

Los tests usan atributos `data-testid` para seleccionar elementos de forma robusta,
sin depender de clases de Tailwind que pueden cambiar.

Elementos con `data-testid` actualmente:

| Componente | `data-testid` |
|---|---|
| Sección Hero (landing) | `hero-section` |
| Botón CTA Hero | `hero-cta-button` |
| Sección Galería | `gallery-section` |
| Sección Videos | `video-section` |
| Sección Servicios | `services-section` |
| Wizard de Presupuesto | `presupuesto-wizard` |
| Botón "Siguiente" en wizard | `btn-siguiente-paso` |
| Botón "Guardar" presupuesto | `btn-guardar-presupuesto` |
| Página de Eventos | `eventos-page` |
| Página Carga Operativa | `carga-operativa-page` |
| Página Catering | `catering-page` |
| Página Decoración | `decoracion-page` |
| Sección Estilos Decoración | `decoracion-estilos` |
| Card de estilo `{id}` | `estilo-card-{id}` |

Para agregar nuevos selectores, añadí el atributo `data-testid="nombre"` al elemento JSX
en el componente correspondiente.

---

## CI / GitHub Actions

El workflow `.github/workflows/e2e.yml` corre automáticamente en cada PR y push a `main`.

### Pasos del workflow:
1. `npm ci` — instala dependencias
2. `npx playwright install --with-deps chromium` — instala el browser
3. `npm run build` — compila la app Next.js
4. `npm run start` — levanta el servidor de producción en background
5. `npx wait-on` — espera hasta que el servidor esté listo
6. `npm run test:e2e` — corre todos los tests E2E

### Artefactos publicados:
- 📋 **playwright-report**: Reporte HTML completo (disponible por 14 días)
- 🔍 **playwright-traces**: Trazas de tests fallidos (disponible por 7 días)

### Secrets de GitHub necesarios:
```
E2E_DEMO_PASSWORD          → contraseña de la app
NEXT_PUBLIC_FIREBASE_*     → variables de entorno Firebase
```

---

## Solución de problemas

### El test falla con "Selector not found"
- Verificá que la app esté corriendo en `E2E_BASE_URL`
- Verificá que el componente tenga el `data-testid` correcto
- Corré con `--headed` para ver qué pasa en el browser

### El test redirige a `/login`
- La sesión no se inyectó correctamente
- Verificá que el fixture `authPage` esté siendo usado en el test
- Revisá que `injectAuthSession` se llame antes de `page.goto()`

### Error de timeout
- Aumentá el timeout en `playwright.config.ts`
- Verificá la velocidad de la app localmente

### Tests flaky (intermitentes)
- Usá `await page.waitForLoadState('networkidle')` para esperar cargas lentas
- Preferí `data-testid` sobre selectores de texto o clases CSS
