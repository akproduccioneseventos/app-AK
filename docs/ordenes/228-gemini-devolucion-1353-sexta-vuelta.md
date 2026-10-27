# Orden 228 — Devolución de la propuesta 1353 (sexta vuelta, 24/10/2026)

**Para Gemini. Seguí en la misma propuesta 1353**, rama `gemini/ordenes-180-195`. Primero traé y fusioná
`claude/app-debug-stabilize-m70e6z`. Si un bloque se traba, entregá el resto en la misma propuesta y avisá
cuál faltó.

## Qué está bien y no se toca

`d2f49f09f` compila, no tiene acentos rotos, pasa "lo que se dijo" y figura HECHA en las órdenes 220 a 227.
La clase `ak-panel-main` y la separación entre "no se pudo cargar" y "no existe" están bien.

## Bloque 1 — plata y permisos: el PIN del cliente dejó de funcionar (va primero)

En `src/app/actions/fiesta/fiesta.actions.ts`, dentro de `leerFiestaConEstado` (~510), agregaste
`delete (fiesta as any).clientPortalSettings;` en la rama de quien no es del equipo. Pero el cliente **necesita**
ese campo. `cancelServicesOrParty` (`src/app/actions/fiesta/portal.actions.ts` ~1269) y el cambio de fecha (~1578)
comparan el PIN con `fiesta.clientPortalSettings?.clientPassword`. Sin el campo, el PIN guardado pasa a ser `''`:

- el cliente **con su PIN correcto no puede** cancelar ni cambiar la fecha;
- y **con el PIN vacío, sí puede**.

Lo que se le saca a quien no es del equipo ya lo decide `recortarFiestaParaAfuera`. `clientPortalSettings` está
en `CAMPOS_DEL_CLIENTE` a propósito: el cliente lo recibe y los demás no.

- **Sacá esa línea `delete`** y volvé a lo que había: sacarle sólo `accessKey`
  (`fiesta.clientPortalSettings = { ...fiesta.clientPortalSettings, accessKey: undefined as any }`).
- El `delete` para el perfil `personal` en la rama del equipo (~521) queda.
- Prueba nueva, `src/__tests__/el-pin-del-cliente-sigue-pidiendose.test.ts`. Con sesión de portal válida y una fiesta
  con `clientPassword: '1234'`, `cancelServicesOrParty` tiene que dar:
  - con `passwordInput: ''` → `success: false` y "incorrecto";
  - con `'1234'` → pasa el control del PIN.

  Hacé lo mismo para el cambio de fecha. Comprobá que el caso vacío se pone en rojo si volvés a poner el `delete`.

## Bloque 2 — "auditoria-puertas-abiertas" en rojo

`src/__tests__/auditoria-puertas-abiertas.test.ts` frena porque `getFiestaParaPantalla` es una acción nueva
exportada desde un archivo `'use server'` sin `requireAppSession()` en la primera línea.

- **`getFiestaParaPantalla` pide sesión:** su primera línea es `await requireAppSession();`. La usan sólo
  pantallas del panel.
- **`getFiestaById` NO se toca:** la usan pantallas públicas y el portal.
- Si la prueba igual la marca como nueva, porque cambió de forma, mirá cómo la prueba arma su lista de
  "ya existentes". Que reconozca la misma firma: **no la agregues a una lista de excepciones** sin
  escribir el motivo.

## Bloque 3 — la prueba vieja de la orden 224 pide lo de antes

`src/__tests__/factura-ausente-no-queda-cargando.test.tsx`: en carta de tragos, invitados y pantallas tótem, la
prueba rechaza la carga y espera "Fiesta no encontrada". Ahora, bien hecho, sale "No se pudo cargar la fiesta".

- Cambiá esos tres casos para que esperen "No se pudo cargar" con la carga rechazada.
- Sumá a cada uno el caso con `getFiestaParaPantalla` devolviendo `{ fiesta: null, fallo: false }`: ahí
  tiene que salir "Fiesta no encontrada".

## Bloque 4 — tres pruebas de navegador en rojo

Corrida de `d2f49f09f` con `npm run test:e2e:production`:

- `tests/e2e/barra-listo-contraste.spec.ts` (~40): en `/experiencia` y `/tecnologia`, `locator('h1, h2').first()`
  no aparece. Mirá qué título tienen esas pantallas y buscalo por su texto (`getByRole('heading', { name: ... })`).
- `tests/e2e/la-realidad-aumentada-carga-mindar.spec.ts`: no aparece "Esta invitación todavía no tiene realidad
  aumentada". Abrí `/evento/ar/fiesta-sin-realidad-aumentada` y copiá el texto que muestra de verdad en ese caso.
  Si la pantalla se queda en otra cosa (un error o la ruedita), eso es lo que hay que arreglar en la pantalla, no
  en la prueba.
- `tests/e2e/las-pantallas-no-quedan-cargando.spec.ts`: corrélo solo y pegá el resultado.

**Corré las tres solas antes de subir**, y después `npx jest --silent` completo y `npm run "publicar?:rapido"`.
Pegá en la propuesta las últimas líneas de cada uno.

```comprobar
usa: accessKey: undefined as any en src/app/actions/fiesta/fiesta.actions.ts
usa: await requireAppSession() en src/app/actions/fiesta/fiesta.actions.ts
prueba: src/__tests__/el-pin-del-cliente-sigue-pidiendose.test.ts
usa: passwordInput: '' en src/__tests__/el-pin-del-cliente-sigue-pidiendose.test.ts
usa: No se pudo cargar en src/__tests__/factura-ausente-no-queda-cargando.test.tsx
prueba: src/__tests__/auditoria-puertas-abiertas.test.ts
prueba: tests/e2e/barra-listo-contraste.spec.ts
prueba: tests/e2e/la-realidad-aumentada-carga-mindar.spec.ts
```
