# 107 — Devolución de la propuesta 1248 (órdenes 101, 102, 104, 105 y 106)

**Para:** Gemini.
**Escrita por:** Claude, el 1 de octubre de 2026, al revisar `feat/super-asistente-unificado` (03c8b57e1).

Bien hecho: la regla de oro que cuida la plata (`src/lib/asistente/que-puede-hacer-solo.ts`), el
asistente por WhatsApp, la orden 104 completa, el "Asistente AK" sin el ícono de robot, la nitidez de
las fotos del muro y la página "Revisar mis fiestas". **Pero no se puede fusionar: hay un agujero de
permisos, la puerta frena en el segundo paso y faltan bloques enteros.**

## Cómo se entrega

- **Seguí en la misma rama `feat/super-asistente-unificado` y la misma propuesta 1248.**
- `npm run "publicar?"` completo **en tu máquina** antes de avisar, con la última pantalla pegada.
- Pasá por `docs/ANTES-DE-ENTREGAR.md`.

---

## 1. GRAVE — Cualquiera puede marcar invitados como llegados (permisos)

Reescribiste `actualizarFiesta` (`src/lib/fiesta/actualizar-fiesta.ts`) para guardar con
`mutarDocumentoConTransaccion` y **ya no pasa por `saveFiesta`**. `saveFiesta`
(`src/app/actions/fiesta/fiesta.actions.ts` ~l.162) hacía `requireFiestaWriteAccess` y
`preserveFiestaSecrets`. Varias acciones públicas **sólo** estaban protegidas por eso: por ejemplo
`checkInGuest` y `updateGuestExperience` (`src/app/actions/fiesta/invitados.actions.ts` ~l.138 y
~l.321) no tienen guardia propia. Hoy cualquiera con el número de la fiesta marca invitados como
llegados o les cambia datos. Además el parámetro `options.publicRsvp` quedó sin usar.

**Qué hacer:**
- Que la transacción quede, pero **el permiso vuelva**: si `options.publicRsvp` no es `true`, llamar
  `requireFiestaWriteAccess(fiestaId)` **antes** de la transacción.
- Dentro de la transacción, aplicar `preserveFiestaSecrets` igual que hacía `saveFiesta`.
- No leer con `getFiestaById` adentro de la transacción si el documento no existe: devolver error.
- **La prueba** (`src/__tests__/actualizar-fiesta-pide-permiso.test.ts`): sin sesión, `checkInGuest`
  y `updateGuestExperience` **no** escriben; con `publicRsvp: true` (confirmación pública) sí; y los
  secretos de la fiesta (claves del portal) siguen después de guardar. Tiene que ponerse en rojo con
  el código de hoy.

## 2. La puerta frena: "Lo que se dijo es lo que es"

- **Código que nadie llama:** `src/lib/asistente/guardian-plata.ts` (repite la regla de oro: borralo y
  usá sólo `que-puede-hacer-solo.ts`), `PublicPortalProView` y `Paso4Resumen`. O se enganchan o se
  sacan.
- **37 pantallas sin ninguna prueba que mire el resultado**, entre ellas `/fiestas/revisar`,
  `/settings/asistente`, `/admin/carga-historicos`, `/empresa/servicios`, `/fiestas/nueva/plan-pagos`
  y `/fiestas/nueva/invitados/checkin-scanner`. Corré `node scripts/lo-que-se-dijo-es-lo-que-es.mjs`
  para ver la lista entera. **Si tocaste una pantalla sólo por un texto o un formato, volvé ese cambio
  atrás** en vez de escribirle una prueba: no tenías que tocarla. A las que son nuevas o cambian de
  verdad, una prueba que haga algo y mire el resultado.

## 3. Bloques que faltan (o están a medias)

Revisados en tu rama, sin encontrarlos:

- **106, bloque 9** — la página pública `/experiencia` (hay una `/experiencia-ak` vieja: usala si es
  la misma idea y decilo).
- **106, bloque 12** — la página pública `/tecnologia` (está `src/data/tecnologia-ak.ts`, falta la
  página y el script de capturas `npm run tecnologia:capturas`).
- **106, bloque 13** — el estado **"Suspendida"** de la fiesta en `src/types/fiesta.ts` y lo que
  apaga (recordatorios, avisos, invitaciones), y los campos "Quién contrata" / "Agasajada" separados.
- **106, bloque 10** — la barra: la **apertura** ("Recibí la barra"), el aviso de botella por
  terminarse, la pantalla "Tu trago está listo", el informe de la noche, y **las 12 recetas cargadas**
  con sus insumos.
- **106, bloques 7 y 11** — "Ver el salón decorado" y el salón que se arma con una frase y "Recorrer"
  en el configurador de la reunión.
- **106, bloque 2** — el botón "Asistente" con voz en el configurador.
- **106, bloque 8 y 105, bloque 8** — las opciones pagas (voz especializada y llamada telefónica)
  **visibles y apagadas** en Ajustes con su aviso.
- **105, bloque 2** — el "Parte de la mañana" sigue con la voz robótica del navegador
  (`speechSynthesis` en `src/components/mi-dia/ParteDeLaMananaPlayer.tsx`).
- **106, bloque 14** — el video resumen: falta el **video de muestra** en
  `test-results/video-resumen-muestra.webm` adjunto a la entrega.

## 4. El contrato cambió de nuevo (versión del dueño del 1/10/2026)

El texto que va es **`docs/contratos/contrato-base-2026-10-01.txt`** (17 cláusulas, reordenadas y con
cambios de fondo). **Reemplaza** al del 30/09 en `CONTRACT_TEMPLATE` (`src/lib/contract-template.ts`)
y en las cláusulas por omisión (`defaultContractSettings` en `src/types/settings.ts`), con la misma
regla: si el dueño editó las suyas, se ofrece "Usar el contrato revisado" y no se pisa.

Lo que cambió y hay que llevar a la app:
- **Ya no se nombra el monto de la seña** en el contrato: sacá `{{MONTO_SENA}}`.
- Las fechas de los hitos siguen igual (30% al tercio, 50% a la mitad, total 30 días antes): con firma
  1/10/2026 y fiesta 20/11/2027 dan **16/02/2027, 26/04/2027 y 21/10/2027** (así figuran en el
  contrato firmado). Sumá ese caso a la prueba.
- Donde dice "EL/LA CLIENTE", que la app ponga **"LA CLIENTE"** o **"EL CLIENTE"** según el
  tratamiento del cliente (campo nuevo "Sr./Sra." en la ficha del cliente; si no está cargado, "EL/LA
  CLIENTE").

**Las preguntas frecuentes** (`src/data/preguntas-frecuentes-contrato.ts`) se actualizan con estas
respuestas, **tal cual**:

| Pregunta | Respuesta nueva |
|---|---|
| ¿Qué pasa si me atraso con un pago? | No hay recargo automático. Te avisamos y tenés **15 días corridos** para ponerte al día; si no, el contrato se puede dar por terminado y se aplica la penalidad que corresponda. |
| ¿Y si cancelo? | Cancelar todo el evento tiene una penalidad del 30% del presupuesto vigente. Si sacás sólo una parte de los servicios, el 30% se calcula sobre lo que sacás. Lo pagado se descuenta y, si pagaste de más, se devuelve la diferencia dentro de los 30 días. |
| ¿Puedo cambiar la cantidad de invitados? | Hasta 15 días antes: podés bajar hasta un 10% (sólo baja lo que se cobra por persona, no los costos fijos) o subir hasta un 20% según disponibilidad, pagando antes la diferencia al precio que contrataste. Si bajás más del 10%, lo que pase de ese 10% se toma como cancelación parcial. Después de ese día, la cantidad queda como mínima. |
| ¿Puedo cambiar el tipo de menú de algunos invitados? | Sí, hasta 15 días antes. Cada menú (adulto, adolescente, infantil) tiene su precio: si pasás a uno más caro se paga la diferencia y, si pasás a uno más económico, se descuenta. |
| ¿Si agrego un servicio nuevo, a qué precio? | Al precio vigente cuando lo agregás. Si aumentás algo que ya tenías contratado, se mantiene tu precio original (con su promoción) más el ajuste anual. |
| ¿Y si AK no puede cumplir con algo? | Primero se busca una solución, un reemplazo equivalente o una nueva fecha. Si no se llega a un acuerdo, se devuelve lo pagado por ese servicio dentro de los 30 días. |
| ¿Puedo pagar desde otra cuenta o que pague otra persona? | Sí, pero el contrato sigue a tu nombre y los recibos salen a tu nombre. |

El resto de las respuestas sigue igual. La prueba de las preguntas comprueba que "¿Qué pasa si me
atraso con un pago?" dice **15 días** y que ninguna dice "5 días".

```comprobar
archivo: docs/contratos/contrato-base-2026-10-01.txt
no-usa: seña de {{MONTO_SENA}} en src/lib/contract-template.ts
no-usa: tenés 5 días en src/data/preguntas-frecuentes-contrato.ts
prueba: src/__tests__/actualizar-fiesta-pide-permiso.test.ts
usa: requireFiestaWriteAccess en src/lib/fiesta/actualizar-fiesta.ts
no-usa: speechSynthesis en src/components/mi-dia/ParteDeLaMananaPlayer.tsx
```
