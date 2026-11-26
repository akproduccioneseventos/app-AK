# Orden 371 — Robot, vuelta 16 (seis especialistas): estaciones de otra fiesta, costos que ve el operador, IA que no pasa por el tope, avisos que se repiten y fechas que se corren

**Para Gemini. Va en la MISMA propuesta que la 350 y la 355 a la 370 (rama `gemini/orden-346`).** Si un bloque se traba,
entregá el resto y avisá cuál faltó. Antes de decir "terminé", leé `docs/ANTES-DE-ENTREGAR.md`. **Los bloques 2 y 3 son plata y
permisos: Claude los revisa línea por línea.**

## Por qué
Quinta vuelta de los seis especialistas (26/11/2026). Cada punto lo confirmó Claude abriendo el archivo. Sin hallazgos: fechas del
simulador y reloj de la promoción, cuenta regresiva, deudas del asistente, atadura de los tokens de estación a su fiesta y módulo,
escrituras de insumos y menús, firma digital y contrato en papel, plan de pagos, recordatorio a confirmados (con id fijo), caras en el
navegador, CRM, catálogo y galería. **Descartado:** el tope de publicidad cuenta lo comprometido y no lo gastado, decisión anotada en
YA-RESUELTO.

## Bloque 1 — Fechas que se corren un día (pregunta 70)
1. `src/app/(app)/calendario/page.tsx` ~406: al editar una cita de las 23:30, `fecha.toISOString().slice(0, 10)` muestra el día siguiente y
   al guardar (~440) **la cita se mueve un día** sin que nadie la toque. Usá la fecha de Uruguay (`hoyEnUruguay(fecha)`).
2. `src/components/fiestas/panels/fotografia.tsx` ~147-151: la entrega estimada de fotos sale un día antes (`new Date("2027-08-08")` es la
   noche anterior en Uruguay). Armala con `parseUruguayDate` y sumale los días.
3. `src/app/(app)/customers/page.tsx` ~191-197: `new Date(fechaEvento)` + `setHours(0,0,0,0)`: el día de la fiesta, el cliente deja de
   figurar "Actual". Compará días de Uruguay.

## Bloque 2 — La IA pasa por el tope, y una consulta se cuenta una vez
1. `src/lib/social-fiesta/content-safety-ai.ts` ~65 llama a Google Vision directo (`vision.googleapis.com`) desde la moderación de fotos
   (`social-gallery.ts` ~688, `entretenimiento.actions.ts` ~341, `barra-tecnologica.actions.ts` ~1222). No mira el tope ni registra el gasto.
   Que pase por el cerebro (`src/ai/cerebro.ts`) o, como mínimo, por `reservarConsumoIA` con un nombre propio (`'revision-fotos'`). Si no hay
   tope, la foto va a pendiente, como ya pasa cuando Vision falla. Sumá `vision.googleapis` a lo que frena
   `src/__tests__/toda-la-ia-pasa-por-el-cerebro.test.ts`.
2. `src/ai/flows/multiagent-flow.ts` ~550-557: llama a `chatWithMarketingAgent` (que ya registra `'agente-marketing'`,
   `src/ai/flows/marketing-agent-flow.ts` ~109) y después registra `'multiagente'` otra vez. Una consulta suma dos veces y la IA se corta antes.
   Sacá el segundo registro en esa rama.

## Bloque 3 — Quién maneja las estaciones y quién ve los costos
1. `hasEntertainmentGuestAccess` (`src/lib/auth/entertainment-token.ts` ~142) da por buena **cualquier sesión** (`if (await hasAppSession()) return true;`)
   sin mirar la fiesta. Con eso alguien del equipo de otra fiesta sube fotos a esta (`uploadEntretenimientoMedia`,
   `src/app/actions/fiesta/entretenimiento.actions.ts` ~284 y ~414-428, que guarda con `publicRsvp: true`) y maneja la sesión de la estación
   (`src/app/actions/fiesta/sesion-entretenimiento.ts` ~151, ~213, ~325). Con sesión, que se pida que sea **del equipo de esa fiesta**
   (`requireEventPermission` con `PERMISOS.NOCHE` u `ORGANIZACION`, `src/lib/auth/event-access.ts`). Revisá también la línea ~103.
2. `getPermisoDelAfiche` (`entretenimiento.actions.ts` ~188-190) pide sólo sesión y entrega un permiso de invitado para cualquier fiesta: que
   pida el permiso de esa fiesta.
3. El operador (`src/lib/auth/perfiles.ts` ~62-63, "Nada de plata") recibe costos: `getInsumos`/`getInsumoById` (`src/app/actions/insumos.ts`
   ~27-50) y `getMenus`/`getMenuById` (`src/app/actions/menus-catering.ts` ~127-184) devuelven costo de compra, costo por plato y margen a
   quien tiene ORGANIZACION. Para quien no tiene INSUMOS ni CONTABILIDAD, que salgan **sin** `costoUnitario`, `totalDishCost`,
   `profitMargin` ni costos de ingredientes (las cantidades y los nombres sí, para la lista de compras).

## Bloque 4 — Lo que se manda dos veces o no se avisa (pregunta 247)
1. **Fotos por WhatsApp.** `src/app/actions/social-gallery.ts` ~2224-2237: si Meta contesta `{ success: false, delivery: 'uncertain' }`
   (`src/lib/whatsapp/meta-sender.ts` ~175-184, que dice "no reintentes"), no se anota y el invitado lo recibe otra vez en la tanda siguiente.
   `'uncertain'` se anota como enviado (`fotoIds`, `enviadoAt` y `ultimoWhatsappFotosAt`, ~2265). Y si el guardado de después falla
   (~2258-2274), se reintenta ese guardado antes de terminar, para que no vuelva a salir.
2. **Pedido de la barra sin señal.** `src/app/evento/barra/[fiestaId]/page.tsx` ~641-655: al volver la señal reenvía con `flushOfflineQueue`
   y descarta el resultado; si el servidor lo rechaza (sin stock), el invitado sigue viendo "se enviará solo" (~736) y el barman no lo ve. Que
   avise "Tu pedido de X no llegó: elegí otro", y que el reenvío también corra al abrir la página.
3. **Cancelación desde el portal.** `src/app/actions/fiesta/portal.actions.ts` ~1938-1946: con la cancelación ya guardada, el
   `createNotification` interno va sin `try`; si tira, el cliente ve "Error" y al reintentar le dice "ya estaba" sin darle el documento. El aviso
   va en su propio `try/catch` y la respuesta sigue siendo `success: true` con el documento.

## Bloque 5 — Tareas que no leyeron y documentos que se pisan (preguntas 210 y 244)
1. `src/lib/invitaciones/recordatorio-no-abiertas.ts` ~175-177: con la base caída, `readData` devuelve `[]`, la tarea dice "no hay fiestas" y
   `corrio: true`, y la ruta la marca (`src/app/api/cron/recordar-invitacion-no-abierta/route.ts` ~22-23). Como el recordatorio es de un solo
   día, **no sale nunca**. Usá `esLecturaFallida` y devolvé `corrio: false` con el motivo.
2. `src/app/actions/seo-posicionamiento.ts` ~140-142: guardar el código de Search Console lee `settings.json` con `.catch(() => ({}))` y lo
   reescribe entero: con una lectura fallida borra Analytics, Maps y el WhatsApp. Usá `updateDataPartial` (que ya frena la lectura fallida).
3. `src/app/actions/social-admin.ts` ~74-87: si la lectura falla devuelve los valores por defecto y el guardado los escribe encima de la
   configuración real. Que la lectura fallida se diga en pantalla y que el guardado use `updateDataPartial`.
4. `compartirMencionEnHistoriaAction` (`src/app/actions/presencia-digital.ts` ~567-576) lee y reescribe `social-story-mentions.json` entero; el
   aviso de Meta agrega con `mutateGenericJsonArray` (`src/app/api/meta/webhook/route.ts` ~143). Una mención que llega en el medio se borra.
   Usá `mutateGenericJsonArray`.

## Barrido en toda la app
- Respuestas "no sé si llegó" tratadas como fallas (pregunta 247): `grep -rn "delivery" src/lib/whatsapp src/app/actions` y, por cada envío,
  ¿se reintenta lo que Meta pudo haber mandado?
- IA llamada directo: `grep -rnE "googleapis.com/v1|generativelanguage|vision\." src --include=*.ts | grep -v "^src/ai/"`.
- `hasAppSession()` como permiso de una fiesta: `grep -rn "hasAppSession()" src/lib/auth src/app/actions`.
- Lecturas con `.catch(() => ({}))` o `|| {}` seguidas de `writeData`: `grep -rn "catch(() => ({}))" src/app/actions`.
Plata y permisos: se lista y Claude lo revisa.

## Lo que NO hay que hacer
- No cambiar el tope de publicidad (decisión anotada).
- No sacarle a la tablet del salón el acceso del día de la fiesta (`getKioskStationGuestToken`).
- No sacarle al operador lo que necesita para la lista de compras: sólo los costos.

## Qué tiene que comprobar la prueba
- `src/__tests__/la-estacion-no-se-maneja-desde-otra-fiesta.test.ts`: alguien con sesión que no es del equipo de la fiesta B no puede subir a B
  ni cambiar su sesión de estación; uno del equipo de B sí.
- `src/__tests__/el-operador-no-ve-costos.test.ts`: con perfil operador, `getMenus` e `getInsumos` no traen costos ni márgenes; con INSUMOS, sí.
- `src/__tests__/las-fotos-por-whatsapp-no-se-repiten.test.ts`: con Meta respondiendo `uncertain`, la tanda siguiente no reenvía.
- `src/__tests__/la-revision-de-fotos-pasa-por-el-tope.test.ts`: con el tope agotado no se llama a Vision y la foto queda pendiente.
- `src/__tests__/el-recordatorio-no-abiertas-no-corre-a-ciegas.test.ts`: con la lectura de fiestas marcada como fallida, `corrio: false`.
- `src/__tests__/las-fechas-del-equipo-no-se-corren.test.ts`: una cita de las 23:30 del 26/11 se edita y guarda en el 26/11; la entrega de
  fotos de una fiesta del 08/08/2027 con 30 días cae el 07/09/2027.

```comprobar
no-usa: fecha.toISOString().slice(0, 10) en src/app/(app)/calendario/page.tsx
usa: parseUruguayDate en src/components/fiestas/panels/fotografia.tsx
no-usa: eventDate.setHours(0, 0, 0, 0); en src/app/(app)/customers/page.tsx
usa: reservarConsumoIA en src/lib/social-fiesta/content-safety-ai.ts
usa: vision.googleapis en src/__tests__/toda-la-ia-pasa-por-el-cerebro.test.ts
no-usa: if (await hasAppSession()) return true; en src/lib/auth/entertainment-token.ts
usa: requireEventPermission en src/app/actions/fiesta/sesion-entretenimiento.ts
usa: CONTABILIDAD en src/app/actions/menus-catering.ts
usa: uncertain en src/app/actions/social-gallery.ts
usa: esLecturaFallida en src/lib/invitaciones/recordatorio-no-abiertas.ts
usa: updateDataPartial en src/app/actions/seo-posicionamiento.ts
usa: mutateGenericJsonArray en src/app/actions/presencia-digital.ts
prueba: src/__tests__/la-estacion-no-se-maneja-desde-otra-fiesta.test.ts
prueba: src/__tests__/el-operador-no-ve-costos.test.ts
prueba: src/__tests__/las-fotos-por-whatsapp-no-se-repiten.test.ts
prueba: src/__tests__/la-revision-de-fotos-pasa-por-el-tope.test.ts
prueba: src/__tests__/el-recordatorio-no-abiertas-no-corre-a-ciegas.test.ts
prueba: src/__tests__/las-fechas-del-equipo-no-se-corren.test.ts
```
