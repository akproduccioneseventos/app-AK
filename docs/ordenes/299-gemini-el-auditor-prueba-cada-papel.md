# Orden 299 — El auditor prueba la app como cliente, invitado y prospecto (13/11/2026)

**Para Gemini.** Va **en la misma propuesta que la 297 y la 298** (rama nueva sobre `origin/main`). Sin fusionar.
Repasá `docs/ANTES-DE-ENTREGAR.md`, preguntas 88 a 107. **Toca permisos: el candado del auditor no se afloja.**

**Pedido del dueño (13/11/2026):** el auditor se queja de que no puede entrar en todos los papeles. Hoy:
- **Invitado:** "Ver como un invitado" ya anda (`enlaceDeInvitadoDeMuestra`, `src/app/actions/fiesta/vista-de-muestra.actions.ts`).
- **Cliente:** `/portal/c/[accessKey]` (`src/app/portal/c/[accessKey]/page.tsx` ~179) sólo abre si la fiesta tiene
  `clientPortalSettings.enabled` y una `accessKey`. El auditor no puede crear una fiesta de prueba: `createDemoFiesta`
  (`src/app/actions/fiesta/fiesta.actions.ts` ~1415) guarda, y el candado (`exigirQueSePuedaGuardar`) lo frena.
- **Prospecto:** el simulador público llega al final y el guardado se rechaza con la sesión de auditor.

## Barrido en toda la app (Claude, 13/11/2026)

- Papeles que el auditor no puede probar: cliente (el portal necesita una fiesta con acceso prendido y él no puede crearla),
  prospecto (el simulador se frena al guardar). Invitado ya anda con `enlaceDeInvitadoDeMuestra`. El portal del
  proveedor y del personal quedan para después: el auditor no los pidió.

## Lo que NO se toca

- El candado: el auditor **sigue sin poder guardar nada** en datos del negocio (`src/lib/auth/solo-lectura.ts`).
- Las fiestas, clientes y presupuestos reales.

## Bloque 1 — Una fiesta de muestra que existe siempre

- Id fijo `fiesta_muestra_auditor`, armada con `buildAkDemoFiesta` (`src/lib/experience-ak/demo-fiesta-factory.ts` ~112),
  con fecha dentro de 30 días, `clientPortalSettings: { enabled: true, accessKey: <fija y aleatoria> }`, y todos sus
  invitados con `guestAccessToken`. Marcada `esMuestra: true` (sumalo al tipo en `src/types/fiesta.ts`).
- **La crea el sistema, no el auditor:** una tarea idempotente en `src/lib/automatico/al-entrar-a-la-app.ts` que, cuando
  entra alguien que **no** es auditor, la crea si no existe.
- **No cuenta en nada de plata ni de ventas:** se excluye de las listas de fiestas del equipo (salvo un filtro "Ver muestra"),
  del CRM, de los totales de cobros, del tablero y de los avisos. Buscá cada lectura de `fiestas.json` que sume o liste y
  filtrá `esMuestra`.

## Bloque 2 — "Probar como" para el auditor

En el panel del auditor (la pantalla de inicio que ve con `perfil === 'auditor'`), una tarjeta **"Probar como"** con tres
botones que abren en otra pestaña:
- **Cliente:** `/portal/c/<accessKey de la muestra>`.
- **Invitado:** el enlace de `enlaceDeInvitadoDeMuestra('fiesta_muestra_auditor')`.
- **Prospecto:** `/simulador-de-presupuesto?muestra=1`.
Visible también para el dueño.

## Bloque 3 — En papel de prospecto, el simulador llega al final sin guardar

Con sesión de auditor (`esSesionDeSoloLectura()` en `src/lib/auth/solo-lectura.ts`), la acción que guarda el presupuesto
público (`src/lib/budget/public-simulator-persistence.ts`) **no guarda y no tira error**: devuelve el resultado armado con
`soloPrueba: true`, y la pantalla final muestra el presupuesto con un cartel **"Prueba del auditor: no se guardó"**. Nada
llega al CRM ni a los presupuestos.

## Bloque 4 — En el portal de la muestra, todo se puede tocar sin guardar

En el portal del cliente y la vista del invitado de `fiesta_muestra_auditor`, las acciones (confirmar asistencia, pedir
cambios, firmar constancia, subir foto) con sesión de auditor responden "Prueba del auditor: no se guardó" en vez de un
error. En una fiesta real, todo sigue igual.

## Pruebas

- `src/__tests__/el-auditor-prueba-cada-papel.test.ts`:
  - con sesión de dueño, la tarea crea `fiesta_muestra_auditor` una sola vez (dos corridas → una fiesta);
  - con sesión de auditor, la tarea **no** escribe;
  - la muestra no aparece en la lista de fiestas, ni en los totales de cobros, ni en el CRM;
  - el guardado del simulador con sesión de auditor devuelve `soloPrueba: true` y no escribe.
- `tests/e2e/el-auditor-prueba-cada-papel.spec.ts`: con sesión de auditor, la tarjeta "Probar como" muestra los tres
  botones y el de cliente abre el portal con el nombre de la fiesta de muestra. **Corrida sola en verde antes de entregar.**

```comprobar
usa: fiesta_muestra_auditor en src/lib/automatico/al-entrar-a-la-app.ts
usa: esMuestra en src/types/fiesta.ts
usa: soloPrueba en src/lib/budget/public-simulator-persistence.ts
prueba: src/__tests__/el-auditor-prueba-cada-papel.test.ts
prueba: tests/e2e/el-auditor-prueba-cada-papel.spec.ts
```
