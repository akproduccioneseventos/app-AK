# Orden 376 — Robot, vuelta 21: el mail que sale solo, permisos del asistente, fechas de noche y listas del portal

**Para Gemini. Va en la MISMA propuesta que la 350 y la 355 a la 375 (rama `gemini/orden-346`).** Si un bloque se traba,
entregá el resto y avisá cuál faltó. Antes de decir "terminé", leé `docs/ANTES-DE-ENTREGAR.md`. Los bloques 1, 2, 3, 6, 7 y
8 tocan plata, permisos o lo que sale para afuera: Claude los revisa línea por línea.

## Por qué
Vuelta 21 del robot (26/11/2026), con los seis especialistas. Las áreas fueron portal e invitado, barra y personal, fiesta y
asistente, comida, plata y contrato. Claude confirmó cada punto en el código.

Salieron sin hallazgos nuevos: el chat del invitado, la voz, la reserva del recordatorio de la mañana y los mensajes del
perseguidor (quedan en la bandeja).

## Bloque 1 — La IA de reuniones no le manda el mail al cliente sola
`src/app/actions/meeting-intelligence.ts` ~343 llama a `syncReunionToGoogleWorkspace(fiestaId, updatedReunion, { sendEmails: true, forceEmail: true })`.
En `src/app/actions/google-workspace-extended.ts` ~381, `forceEmail` salta el control de "ya enviado" y `sendCompanyEmail` le
manda al cliente los acuerdos que escribió la IA (~251).

Esto rompe una regla del dueño: **los mensajes a clientes se preparan; los manda una persona.**

Arreglo:
- Al procesar la reunión, el calendario se sincroniza igual, pero **sin** mail: `sendEmails: false` y sin `forceEmail`.
- El mail queda preparado y la pantalla de la reunión (`src/components/reuniones/MeetingIntelligenceRecorder.tsx`) muestra un
  botón "Mandar resumen al cliente" que lo envía con `sendEmails: true` (sin `forceEmail`).
- Si ya se mandó, el botón dice "Ya se le mandó el [fecha]" y pide confirmar antes de mandar de nuevo.
- Cambiar el texto de ~383 ("Al procesar... Google/Gmail si está conectado") para que diga que el mail se manda con el botón.
- **El escaneo de la pregunta 256 encontró otros tres `forceEmail: true`:** `src/app/actions/agenda.ts` ~212 (cambio de fecha),
  `src/app/actions/fiesta/personal.actions.ts` ~183 (personal) y `src/app/actions/google-workspace.ts` ~442
  (`syncFiestaAndNotifyStaff`). Los avisos **al equipo** pueden seguir saliendo solos. Si alguno le manda mail **al cliente**, va
  con el mismo arreglo: el del cliente queda preparado y sale con el botón. Listá en la entrega qué destinatario tiene cada uno.

## Bloque 2 — El asistente del equipo respeta los permisos de la contabilidad y del comercial
`src/app/actions/multiagent.ts` ~18-31 (`sendMultiAgentMessage`) y ~92-118 (`sendPersistentMultiAgentMessage`) sólo piden
sesión. La ruta `src/app/api/multiagent/message/route.ts` ~112-117 pide CONTABILIDAD para el agente `contable` y CRM para el
`comercial`, y la acción del widget no.

Resultado: una cuenta de personal le pregunta al contable "¿qué cuotas están vencidas?" y recibe la respuesta.

Arreglo: el mismo control en `sendMultiAgentMessage` (que la persistente llama):
- con `agentType === 'contable'` y sin CONTABILIDAD, o `'comercial'` y sin CRM, devuelve
  `{ success: false, error: 'Tu perfil no tiene acceso a ese asistente.' }`;
- el perfil `personal` no usa el asistente del equipo, igual que la ruta.

Mejor una sola función compartida con la ruta que dos copias.

## Bloque 3 — La disponibilidad de decoración no muestra fiestas ajenas
`src/app/actions/fiesta/decoracion.actions.ts` ~441-462, `getDisponibilidadElementosDecoracion`, pide sólo `requireAppSession()` y
devuelve nombre e id de las otras fiestas del mismo día.

Arreglo:
- Pedir el permiso de organización o decoración (`requirePermisoAlguno(PERMISOS.ORGANIZACION, PERMISOS.ADMINISTRACION)`).
- A quien no lo tiene, devolver sólo `nombreItem` con `fiestaNombre: 'Otra fiesta'` y sin `fiestaId`.

## Bloque 4 — Las listas del portal se guardan de a un renglón
1. **Tareas del cliente.** `src/app/portal/c/[accessKey]/PublicPortalView.tsx` ~425-435 manda la lista entera a
   `updateClientChecklist` (`src/app/actions/fiesta/portal.actions.ts` ~393-396), que la reemplaza. Desde dos aparatos, una tilde
   pisa a la otra. Además no mira `success`: si falla, la tilde queda en pantalla.
   Arreglo: usar `updateClientChecklistItem` (por id, como `src/app/portal/page.tsx` ~436-447) y volver atrás con aviso si
   `success` es falso.
2. **Fotos de ideas de decoración.** `src/app/portal/[fiestaId]/decoracion/decoracion-client.tsx` ~385 y ~411 arman la lista desde
   la copia de la pantalla, y `subirIdeasDecoracionCliente` (`portal.actions.ts` ~2358-2365) la reemplaza.
   Arreglo:
   - Agregar y sacar de a una foto, adentro de `updateFiestaData` sobre la lista **actual** (tope 6).
   - Después de guardar, mostrar la lista que devuelve el servidor.

## Bloque 5 — "Briefing Generado" sólo si se guardó
`src/components/fiestas/panels/musica.tsx` ~161-163 no mira el resultado de `updateMusicaFiestaActual` y muestra "está guardado
en la fiesta". Si `res.success` es falso, el cartel dice que el briefing se armó pero no se pudo guardar, con botón para
reintentar.

## Bloque 6 — Los agentes de la noche y el anticipador no dicen "sin novedades" sin haber leído
`src/lib/agentes/motor-agentes.ts`:
- ~559-560 (Operador de la Noche, `readData('insumos.json', [])`) y ~678-681 (anticipador) no miran `esLecturaFallida`;
- ~636-640 y ~718 marcan `sin_novedades` ("sin recetas con stock bajo").

Es la misma forma que la orden 362, bloque 3, para otros tres agentes. Mismo arreglo: con la lectura marcada (en el Operador,
`esLecturaFallida(inventario)`), el agente devuelve falla con el motivo y la corrida no se registra como hecha.

## Bloque 7 — El resumen de la mañana por WhatsApp lleva los avisos de mozos y del anticipador
`src/app/api/cron/asistente-proactivo/route.ts` ~154-159 pasa `{ ...parte, itemsPrincipales: [preventivas..., ...] }`, pero
`src/lib/asistente/resumen-manana-whatsapp.ts` ~55 lee `parte.items ?? parte.itemsPrincipales`. Como `items` viene en `parte`
(`src/lib/automatico/parte-manana.ts` ~259), las preventivas se pierden sin error.

Arreglo:
- La ruta pasa las preventivas en `items` también, o el resumen lee una sola lista.
- Las preventivas van primero.

## Bloque 8 — Dos usos de la IA pasan por el tope
`src/app/actions/meeting-intelligence.ts` ~279 (`analyzeMeetingTranscript`, con audio) y `src/app/actions/sales-pitch-ia.actions.ts`
~15 (`generateSalesPitchFlow`) llaman a la IA sin `hayPresupuestoParaIA` y sin registrar consumo.

Arreglo: que pasen por `src/ai/cerebro.ts`, como manda la decisión del 23/11 y como pide la orden 358 para otros. Sin tope, se
avisa y no se llama.

## Bloque 9 — Las fechas de la noche en el panel, el contador y el contrato
1. **Panel de cobros.** `src/app/actions/dashboard.ts` ~136-137 usa `startOfToday()` del servidor, que corre en hora de Greenwich.
   De 21 a 24 una factura que vence hoy sale vencida (~188), la reunión de hoy no aparece (~220), y los presupuestos de 30 días se
   cuentan mal (~204 y ~236).
   Arreglo: "hoy" es `hoyEnUruguay()`, que ya está importado en el archivo, y las comparaciones van por día de Uruguay.
2. **Planilla del contador.** `src/lib/contabilidad/resumen-para-el-contador.ts` ~48 y ~50 escriben `fecha.slice(0, 10)`: un
   gasto del 30/11 a las 22:00 sale "2026-12-01". Usar el día de Uruguay (`diaCalendario` de `src/lib/reportes/rango-de-dias.ts`).
3. **Año de la firma.** `src/lib/budget/formal-budget.ts` ~58-60, `getYearFromDate`, toma el año del texto aunque traiga hora:
   una firma del 31/12/2026 a las 22:30 ("2027-01-01T01:30Z") cuenta como 2027 para el ajuste.
   Arreglo:
   - Si el texto trae hora, el año sale del día de Uruguay.
   - Si es "AAAA-MM-DD" solo, se queda como está.

## Bloque 10 — El cierre de barra cuenta los insumos de los tragos sin alcohol
`src/lib/barra/cierre-de-barra.ts` ~28-36, `insumosDeLaBarra`, sólo recorre `recetaIngredientes`. Los pedidos sin alcohol
descuentan de `recetaIngredientesSinAlcohol` (`src/app/actions/fiesta/barra-tecnologica.actions.ts` ~299-304), así que un insumo
que sólo está en la receta sin alcohol (la soda de un "Virgin") nunca aparece como faltante.

Arreglo: recorrer las dos recetas.

## Barrido en toda la app
- Mails o mensajes al cliente que salen sin que una persona toque un botón (pregunta 256): `grep -rn "forceEmail: true\|sendEmails: true" src/app src/lib`.
- Objetos que se pasan con un campo cambiado mientras quien los lee mira otro campo primero (pregunta 255):
  `grep -rn "?? parte.itemsPrincipales\|\.\.\.parte," src`.
- Acciones del servidor que repiten una ruta pero sin sus controles (pregunta 35): por cada `src/app/api/**/route.ts` con
  `puede(user, PERMISOS.`, buscar si la acción que usa la pantalla tiene el mismo control.
- Listas del portal guardadas enteras (pregunta 22): `grep -rn "updateFiestaData(fiestaId, data => ({ ...data, " src/app/actions/fiesta/portal.actions.ts`.
- "Hoy" del servidor (pregunta 70): `grep -rn "startOfToday()" src/app/actions src/lib`.
- Fechas cortadas para un archivo que sale (pregunta 70): `grep -rn "fecha.slice(0, 10)" src/lib/contabilidad src/lib/reportes`.
- Recetas con versión sin alcohol (pregunta 257): `grep -rn "recetaIngredientes" src/lib src/app/actions | grep -v SinAlcohol`.
- Agentes que leen sin mirar la marca (pregunta 210): `grep -n "readData" src/lib/agentes/motor-agentes.ts`.

Plata, cobros y permisos: se listan y Claude los revisa.

## Lo que NO hay que hacer
- No sacar la sincronización con Google Calendar de la reunión: sólo el mail automático.
- No cambiar quién usa el agente central del asistente.
- No cambiar el tope de 6 fotos de ideas.
- No tocar `getYearFromDate` para fechas sin hora.

## Qué tiene que comprobar la prueba
- `src/__tests__/la-reunion-no-manda-mail-sola.test.ts`:
  - Procesar la reunión no llama a `sendCompanyEmail`.
  - Tocar "Mandar resumen" lo llama una vez.
  - Tocarlo de nuevo sin confirmar no lo llama.
- `src/__tests__/el-asistente-respeta-contable-y-comercial.test.ts`: una sesión con perfil `personal` o sin CONTABILIDAD que pide
  el agente `contable` por la acción recibe error y no llega a `runMultiAgent`.
- `src/__tests__/la-disponibilidad-no-muestra-fiestas-ajenas.test.ts`: una sesión sin permiso no recibe `fiestaId` ni nombres de
  otras fiestas.
- `src/__tests__/las-listas-del-portal-no-se-pisan.test.ts` (base que devuelve **copias**):
  - Dos tildes desde copias viejas quedan las dos.
  - Dos fotos subidas desde copias viejas quedan las dos.
- `src/__tests__/el-resumen-de-la-manana-lleva-las-preventivas.test.ts`: con una preventiva de faltante de mozos, el texto que
  sale por WhatsApp la incluye.
- `src/__tests__/la-ia-de-reuniones-pasa-por-el-tope.test.ts`: sin presupuesto de IA, `analyzeMeetingTranscript` y
  `generateSalesPitchFlow` no se llaman.
- `src/__tests__/las-fechas-de-la-noche-en-plata.test.ts`, a las 22:00 del 26/11 en Uruguay:
  - El panel no marca vencida una factura con vencimiento 26/11.
  - El CSV dice "2026-11-30" para un gasto del 30/11 a las 22:00.
  - Una firma "2027-01-01T01:30:00Z" da año 2026.
- `src/__tests__/el-cierre-cuenta-lo-sin-alcohol.test.ts`: un trago con soda sólo en la receta sin alcohol hace que la soda
  aparezca en el cierre.

```comprobar
no-usa: { sendEmails: true, forceEmail: true } en src/app/actions/meeting-intelligence.ts
usa: Tu perfil no tiene acceso a ese asistente. en src/app/actions/multiagent.ts
usa: requirePermisoAlguno en src/app/actions/fiesta/decoracion.actions.ts
usa: updateClientChecklistItem en src/app/portal/c/[accessKey]/PublicPortalView.tsx
no-usa: const next = [...ideasPhotos, dataUrl].slice(0, 6); en src/app/portal/[fiestaId]/decoracion/decoracion-client.tsx
no-usa: await updateMusicaFiestaActual(fiestaId, { ...musicaData, briefDj: briefObj }); en src/components/fiestas/panels/musica.tsx
no-usa: const actuales = parte.items ?? parte.itemsPrincipales ?? []; en src/lib/asistente/resumen-manana-whatsapp.ts
usa: hayPresupuestoParaIA en src/app/actions/sales-pitch-ia.actions.ts
usa: hayPresupuestoParaIA en src/app/actions/meeting-intelligence.ts
no-usa: const today = startOfToday(); en src/app/actions/dashboard.ts
no-usa: celda(i.fecha.slice(0, 10)) en src/lib/contabilidad/resumen-para-el-contador.ts
usa: esLecturaFallida(inventario) en src/lib/agentes/motor-agentes.ts
usa: recetaIngredientesSinAlcohol en src/lib/barra/cierre-de-barra.ts
prueba: src/__tests__/la-reunion-no-manda-mail-sola.test.ts
prueba: src/__tests__/el-asistente-respeta-contable-y-comercial.test.ts
prueba: src/__tests__/la-disponibilidad-no-muestra-fiestas-ajenas.test.ts
prueba: src/__tests__/las-listas-del-portal-no-se-pisan.test.ts
prueba: src/__tests__/el-resumen-de-la-manana-lleva-las-preventivas.test.ts
prueba: src/__tests__/la-ia-de-reuniones-pasa-por-el-tope.test.ts
prueba: src/__tests__/las-fechas-de-la-noche-en-plata.test.ts
prueba: src/__tests__/el-cierre-cuenta-lo-sin-alcohol.test.ts
```
