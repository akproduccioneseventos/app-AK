# Orden168 - Gemini: barrido de las formas que encontró Codex en 129 y 130

**PARA GEMINI.** Lo programa Gemini (regla del dueño, 15/10/2026). Arrancar desde `main` actualizado,
rama nueva, UNA sola propuesta con todos los bloques; si uno se traba, entregar el resto y avisar
cuál faltó. Claude revisa con lupa lo de plata y permisos, verifica y fusiona; Codex audita.
NO repetir lo que ya está en las órdenes 165, 166 y 167. Leer antes `docs/ANTES-DE-ENTREGAR.md`.
No tocar ninguna línea de permisos (`require*`): lo frena `src/__tests__/el-candado-de-la-plata.test.ts`.

Origen: barrido de Claude (15/10/2026) con las preguntas 9, 36, 50 y 58 de `docs/COMO-AUDITAR.md` sobre
toda la app, después de las auditorías 129 y 130. Cada caso se verificó abriendo el código.

## Bloque 1 - PRIORIDAD: lecturas que fallan y deciden plata o permisos

Regla para los tres: si la lectura falla, NO seguir como si estuviera vacía; cortar con un error claro
(o, donde se indica, no hacer la acción) y decirlo en pantalla.

1. `src/app/actions/crm.ts` ~línea 339 (borrar prospecto): `readData('presupuestos.json', []).catch(() => [])`.
   Si falla, hoy no detecta el presupuesto firmado y deja borrar el prospecto. Cambiar: si la lectura falla,
   devolver `{ success:false, error:'No pudimos comprobar si este prospecto ya firmó. Probá de nuevo.' }`
   y NO borrar.
2. `src/app/actions/invoices.ts` ~línea 904: `getScheduledMessages(internalToken).catch(() => [])` antes de
   `calcularAvisosPendientes`. Si falla, puede preparar avisos de cobro repetidos. Cambiar: si falla, no
   preparar avisos esa vez y devolver/anotar el motivo (la tarea vuelve a intentar en la próxima vuelta).
3. `src/app/actions/simple-auth.ts` líneas ~708, 726, 763, 801 (recuperación de clave):
   `getAuthDoc().catch(() => null)` y después `getActiveLockMessage(config?.recoveryLockedUntil, …)`. Si la
   lectura falla, el freno por intentos se saltea. Cambiar: si falla, responder
   "No pudimos verificar el acceso ahora. Probá en unos minutos." y NO seguir con la recuperación.
   NO tocar las líneas ~627, 856 y 917 (sólo leen el mail de recuperación; ahí el vacío no abre nada).

## Bloque 2 - Pantallas que muestran "no hay nada" cuando falló la lectura (pregunta 50)

Patrón: separar "vacío comprobado" de "no se pudo leer"; en el segundo, cartel "No pudimos cargar X.
Reintentar." con botón que vuelve a leer. No esconder secciones ni mostrar 0.
- `src/app/video-vida/page.tsx` ~19 (`getFiestas(false)`) → hoy dice "No hay fiestas activas".
- `src/app/(app)/mi-dia/page.tsx` ~47 (`getFiestas(false)`) → hoy queda en 0 con cartel de vacío.
- `src/app/(app)/fiestas/[id]/centro/page.tsx` ~118-119 (`getEmpleados`, `getRoles`) → hoy "Sin asignar"/"Sin rol".
- `src/app/evento/album/[fiestaId]/page.tsx` ~128 (`getDedications`) → hoy "Mensajes (0)".
- `src/app/(app)/playbooks/page.tsx` ~57 (`getPlaybookAplicaciones`) → si falla, deja aplicar el playbook
  otra vez: con la lectura caída, deshabilitar "Aplicar" y avisar.
- `src/app/portal/c/[accessKey]/page.tsx` ~194 (`getServiciosEmpresaPublicos`) → selector vacío sin aviso.
- Acciones que devuelven `success` con lista vacía si la lectura falló: devolver además
  `lecturaIncompleta: true` (o `success:false` donde la pantalla ya maneja error) y que su pantalla lo diga:
  `src/app/actions/dashboard.ts` ~122 (notificaciones no leídas), `alertas.actions.ts` ~20 y ~35 (activos),
  `fiesta/screen-mode.actions.ts` ~610-613 (participantes), `commercial-intelligence.ts` ~72-73,
  `post-event-intelligence.ts` ~66, `fiesta/fiesta.actions.ts` ~1453 (presupuestos para revisar fiestas:
  hoy da falsa alarma "sin presupuesto").
NO tocar lo que ya está bien (Codex y Claude lo comprobaron): presupuestos/nuevo, presencia-digital,
evento/social, muro-en-vivo, backup, blog (respaldo fijo a propósito), favoritos locales.

## Bloque 3 - "Elegí una fiesta" cuando lo que falló fue la carga

Mismo arreglo que la orden 167 bloque 4, en cuatro pantallas más: sin `fiestaId` → el cartel de siempre
(no cambiar su texto); con `fiestaId` y error → "No pudimos cargar esta fiesta: <motivo>." y "Reintentar".
- `src/app/(app)/fiestas/nueva/carga-operativa/pdf/page.tsx` ~182
- `src/app/(app)/fiestas/nueva/itinerario/pdf/page.tsx` ~110
- `src/app/(app)/fiestas/nueva/musica/pdf/page.tsx` ~102
- `src/app/(app)/fiestas/nueva/resumen-imprimible/page.tsx` ~177

## Bloque 4 - Hora inventada en el navegador después de guardar

Mostrar la hora que devuelve el servidor, como la orden 166 bloque 5:
- `src/components/centro/EquipoCheckIn.tsx` ~27: `marcarLlegadaPersonal` devuelve sólo un booleano; que
  devuelva la hora guardada (`checkInTimestamp` que quedó) y la pantalla use esa.
- `src/app/acceso-personal/[tokenId]/page.tsx` ~121 y ~139 (`fechaConfirmacionAsistencia`): que
  `responderAsistenciaPersonal` devuelva la fecha guardada y se use esa.
- `src/app/(app)/fiestas/nueva/plan-pagos/page.tsx` ~87 (`approvedAt`): que `approveClientPayment` devuelva
  `approvedAt` y se use ese. NO tocar montos ni el saldo.

## Bloque 5 - Plata: centavos y negativos (pregunta 36)

- `src/app/actions/price-adjustments.ts` ~83: `costoNuevo = Math.round(costoActual * multiplier)` redondea el
  COSTO del insumo a pesos (los costos de insumos llevan centavos a propósito, ver YA-RESUELTO). Cambiar a
  2 decimales (`Math.round(x * 100) / 100`). NO tocar `precioVentaNuevo` (~78): precios de venta en pesos
  enteros es la política vigente.
- Validar en el SERVIDOR importes finitos y `>= 0` (rechazar con mensaje claro, sin redondear):
  `src/app/actions/fiesta/costos.actions.ts` `updateGestionCostos` (~17: cada `montoEstimado` de
  `costos.costosItems`); `src/app/actions/presupuestos.ts` `importarPresupuestoDesdeTexto` (~928, `senaManual`);
  `src/app/actions/approvals.ts` `createAprobacion` (~36, impacto económico); `src/app/actions/social-media.ts`
  (~127, inversión/costo de promoción). En las pantallas correspondientes, `min={0}` y mostrar el error.
- NO tocar: presupuestos y precios de venta en pesos enteros, `financial-guardrails.ts`, Mercado Pago,
  descuentos, cupones ni multas (política comercial; si algo ahí parece mal, se le pregunta al dueño).

## Qué tiene que comprobar la prueba

Jest en `src/__tests__/`, con bases de mentira que devuelven COPIAS:
- Bloque 1: con la lectura rechazada, el prospecto firmado NO se borra; no se preparan avisos de cobro;
  la recuperación de clave no avanza. Con la lectura bien, todo igual que hoy.
- Bloque 2 y 3: con la lectura rechazada, la pantalla muestra el aviso y el reintento, nunca "0"/"no hay"/
  "Elegí una fiesta" cuando había id.
- Bloque 4: tras un reintento, la hora mostrada es la del servidor.
- Bloque 5: costo 6.50 con +10% da 7.15; -1, NaN e Infinity rechazados en las cuatro acciones; 0 aceptado.
Romper cada arreglo a propósito y ver que su prueba falla.

```comprobar
archivo: src/app/actions/crm.ts
usa: getActiveLockMessage en src/app/actions/simple-auth.ts
usa: calcularAvisosPendientes en src/app/actions/invoices.ts
usa: costoNuevo en src/app/actions/price-adjustments.ts
usa: marcarLlegadaPersonal en src/components/centro/EquipoCheckIn.tsx
archivo: src/app/video-vida/page.tsx
archivo: src/app/(app)/fiestas/nueva/carga-operativa/pdf/page.tsx
prueba: src/__tests__/orden-168-lecturas-que-deciden.test.ts
prueba: src/__tests__/orden-168-pantallas-avisan-la-falla.test.tsx
prueba: src/__tests__/orden-168-plata-centavos-y-negativos.test.ts
```
