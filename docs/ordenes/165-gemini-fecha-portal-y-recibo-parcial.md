# Orden165 - Gemini: fecha civil del portal y recibo automatico fallido

**PARA GEMINI.** Lo programa Gemini (regla del dueño, 15/10/2026). Arrancar desde `main` actualizado,
rama nueva, UNA sola propuesta con los dos bloques. Claude revisa y fusiona; Codex audita.

**NO CONTRASTADO CON LA TANDA PRIVADA DE CLAUDE.** Su HEAD se desconoce.
Main confirmado: `ce1ac07d1bb16c24dd73e2d26ac55038028a2472`, publicado segun
health. No habia PR abierta. Comparar primero con cualquier entrega activa.
Claude y Gemini programan; Codex SOLO audita. Lo de contrato/plata lo revisa
Claude. Una sola tanda. No cambiar condiciones comerciales ni tocar datos reales.

## P2 - El resumen del contrato del cliente muestra un dia menos

- Archivo real: `src/app/portal/[fiestaId]/contrato/page.tsx`.
- Simbolo: `formatDate`, usado en `ClientContractPage` para
  `summary.fechaEvento`, bajo Fecha del Evento.
- Productor real: `getContractSigningSummary` en
  `src/app/actions/fiesta/documentos.actions.ts`, devuelve
  `fiesta.configuracion.fechaEvento` sin cambiar su formato civil.
- Blob del consumidor: `9c72a1385a385ae225c8099be749ae4e742061de`.

Reproduccion ejecutada: fecha `2027-08-08`, zona `America/Montevideo`.
La accion real de resumen y el componente React real muestran
`07 de agosto de 2027`; esperado `08 de agosto de 2027`.
Datos/autorizacion con dobles; NO navegador Next ni cuenta real.
La extraccion AST de la funcion original confirma la misma salida.

Corregir dia civil sin depender de la zona del navegador para YYYY-MM-DD.
Reutilizar criterio existente de diaCalendario/papel si encaja; distinguir
fecha civil de instante con hora. No cambiar fecha persistida ni mover fiestas.
Probar Uruguay y UTC, fechas civiles, timestamps validos y valores vacios.
El test del recibo impreso YA corregido no cubre este otro consumidor del portal;
no rehacer aquel arreglo ni cambiar sus expectativas.

Evidencia: `128-contrato-fecha-funcion.json`,
`128-contrato-fecha-ui-observado.json`, `128-contrato-fecha-ui-jest.json`.
Sonda ejecutada: `docs/evidencias/128-contrato-fecha-ui.test.tsx`,1FAIL real.

## P2 - Si falla el recibo automatico, el contrato responde exito sin aviso

- Accion real: `uploadPhysicalContract` -> `dejarLaFiestaContratada` en
  `src/app/actions/fiesta/documentos.actions.ts`.
- Blob: `69e57eecb5b1a0b8b48b9c8573a698565666c941`.
- Consumidor real: `ContratoServicioContent/handlePhysicalUpload` en
  `src/app/(app)/fiestas/nueva/gestion-documental/contrato-servicio/page.tsx`.
  Blob: `ef9daac05f1e72a51bd7c63f8b040711ea24e022`.

Reproduccion ejecutada con accion real y dobles de storage/base/permisos:
`registerBookingDeposit` devuelve `{success:false,error:...}`. El contrato
se guarda como Contratada, sin invoiceIds, pero devuelve solamente
`{success:true}`. La pantalla solo ve ese exito y no conoce el recibo pendiente.
Control positivo con recibo exitoso: guarda el enlace al recibo y pasa.

Informar el resultado parcial del paso automatico tanto si devuelve error
como si tira excepcion, y mostrarlo sin perderlo tras loadData/recarga.
NO se exige descontratar ni deshacer el papel: mantener la politica comercial
vigente. Si es necesaria una decision sobre bloqueo de contratacion, preguntar
al dueno, no inventarla. No crear cobros, asumir otro metodo de pago, cambiar
senas ni repetir facturas para silenciar la sonda. No convertir el documento
fisico ya registrado en un error que invite a duplicar la carga completa.

Evidencia: `128-contrato-recibo-parcial-observado.json` y
`128-contrato-recibo-parcial-jest.json` (1control PASS,1FAIL de aviso parcial).
Sonda: `docs/evidencias/128-contrato-recibo-parcial.test.ts`.

## Validacion

Las769suites/4819tests existentes pasaron en ce1; estas dos sondas nuevas no
formaban parte de ese conjunto. No negar el defecto por el verde anterior.
Conservar las sondas que fallan y convertirlas en regresiones del proyecto,
sin ajustar el esperado para callarlas. En navegador QA actual: fecha visible
correcta para cliente, contrato subido con recibo fallido avisa lo pendiente,
recarga conserva el papel y reintento no duplica. SOLO datos sinteticos.
Claude valida nuevo SHA/compilacion; esta evidencia NO valida el parche futuro.


## Camino exacto (Claude, 15/10/2026) — lo programa GEMINI

Una sola propuesta con los dos bloques. Leer antes `docs/ANTES-DE-ENTREGAR.md`. Nombrar el candado de la
plata (`src/__tests__/el-candado-de-la-plata.test.ts`): no se toca ninguna línea de permisos.

### Bloque 1 — fecha del portal
- `src/app/portal/[fiestaId]/contrato/page.tsx`, `formatDate` (línea ~28): en vez de `new Date(iso)`, usar
  `diaCalendario(iso)` de `src/lib/reportes/rango-de-dias.ts` (ya maneja día suelto, hora con zona de Uruguay
  y medianoche de Greenwich), partir `YYYY-MM-DD` y armar `new Date(anio, mes - 1, dia)` local para el
  `toLocaleDateString('es-UY', { day: '2-digit', month: 'long', year: 'numeric' })`. Vacío o inválido → `'—'`.
- NO tocar `formatearFechaEvento` ni el recibo impreso: ya están bien.

### Bloque 2 — recibo de seña que no sale
- `src/types/fiesta.ts` (~línea 1586, junto a `contratoFirmaInfo`): campo nuevo
  `reciboSenaPendiente?: { motivo: string; fecha: string }`.
- `src/app/actions/fiesta/documentos.actions.ts`, `dejarLaFiestaContratada` (~línea 320): en el bloque
  `if (!hasDeposit)`, si `registerBookingDeposit` devuelve `success:false` (usar su `error`) **o** tira
  excepción (usar `e.message`), guardar `updatedFiesta.reciboSenaPendiente = { motivo, fecha }` **antes**
  de `saveFiesta`, y devolver `{ success: true, reciboPendiente: motivo }`. Si hay recibo (o ya había),
  borrar el campo. Tipos de retorno de `dejarLaFiestaContratada` y `uploadPhysicalContract`:
  agregar `reciboPendiente?: string`. NO deshacer "Contratada", NO crear cobros, NO cambiar montos.
- `src/app/(app)/fiestas/nueva/gestion-documental/contrato-servicio/page.tsx`, `handlePhysicalUpload`
  (~línea 309): si `result.reciboPendiente`, toast destructivo "Contrato cargado, falta el recibo de seña"
  con el motivo y "Generalo desde Facturación"; si no, el toast de siempre. Y un cartel persistente
  (`data-testid="recibo-sena-pendiente"`) arriba del banner de constancia cuando
  `fiesta?.reciboSenaPendiente` exista, así sobrevive a `loadData`/recarga.
- Apagar el aviso cuando el recibo por fin se engancha: `addInvoiceId` en
  `src/app/actions/fiesta/fiesta.actions.ts` (~línea 1275) recibe `opciones?: { esReciboDeSena?: boolean }`
  y, con eso, saca `reciboSenaPendiente` al guardar (también si el id ya estaba). En
  `src/app/actions/invoices.ts` las dos llamadas de `registerBookingDeposit` (~líneas 453 y 560) pasan
  `{ esReciboDeSena: true }`. NO tocar el `requirePermisoAlguno` de esa función.

### Qué tiene que comprobar la prueba
- Pasar las dos sondas de Codex a `src/__tests__/` (mismo esperado, sin aflojarlo): fecha `2027-08-08` en
  zona `America/Montevideo` → "08 de agosto de 2027"; recibo con `{success:false}` **y** con excepción →
  la acción devuelve `reciboPendiente` y la fiesta guardada lleva `reciboSenaPendiente`.
- Que enganchar el recibo de seña con `esReciboDeSena` borre el aviso, y que enganchar otra factura no.
- Romperlas a propósito y ver que fallan. Reemplazar las dos líneas `prueba:` de abajo por las rutas reales.

```comprobar
archivo: src/app/portal/[fiestaId]/contrato/page.tsx
usa: formatDate en src/app/portal/[fiestaId]/contrato/page.tsx
prueba: src/__tests__/contrato-fecha-portal-dia-civil.test.tsx
archivo: src/app/actions/fiesta/documentos.actions.ts
usa: uploadPhysicalContract en src/app/(app)/fiestas/nueva/gestion-documental/contrato-servicio/page.tsx
prueba: src/__tests__/contrato-recibo-parcial-aviso.test.ts
```

