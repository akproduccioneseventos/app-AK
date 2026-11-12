# Orden 285 — Lo que encontró el auditor externo: once arreglos (12/11/2026)

**Para Gemini.** Va **en la misma entrega que las 282, 283 y 284** (rama `gemini/orden-283-app-simple`, arrancando de
`claude/app-debug-stabilize-m70e6z`, `git pull`). **Una sola propuesta, sin fusionar.** Si un bloque se traba, entregá
el resto y avisá cuál. Repasá `docs/ANTES-DE-ENTREGAR.md`, sobre todo las preguntas **88 y 89** (nuevas).

El auditor recorrió la app publicada el 12/11/2026 con la fiesta DEMO, un cliente y un invitado de muestra. Claude ubicó
cada hallazgo en el código; las líneas son aproximadas.

## Qué NO se toca

Los importes, el 15% anual, Club Uruguay, la seña, la firma como constancia y el envío humano de mensajes: el auditor
los revisó y están bien. Ningún texto comercial cambia. Las direcciones no cambian.

## Bloque 1 — La hora que va a Google Calendar está corrida tres horas (P1)

**Hoy:** `buildGoogleCalendarUrl` (`src/lib/calendar-links.ts` ~41) arma la hora con `new Date(año, mes, día, h, m)`
(hora del **servidor**, que corre en Greenwich) y la pasa con `toISOString()`, que le pone la **Z**. Una fiesta del
15/10/2026 a las 21:00 sale `dates=20261015T210000Z` y Google la muestra a las 18:00. La usan **el portal del cliente**
(`src/app/portal/c/[accessKey]/PublicPortalClientExperience.tsx` ~488, botón "Sincronizar") y **la invitación de los
invitados** (`src/app/invitacion/[fiestaId]/invitacion-publica-client.tsx` ~1098).

**Qué se hace:** `buildGoogleCalendarUrl` arma la fecha **sin pasar por `Date` local ni `toISOString`**: toma año, mes,
día, hora y minutos del texto (`startDate` `AAAA-MM-DD`, `startTime` `HH:mm`) y escribe la hora **de pared sin Z**
(`20261015T210000`). El final suma las horas con `Date.UTC(...)` sólo para hacer la cuenta (así una fiesta de 21:00 con 5
horas termina `20261016T020000`, al día siguiente). Y suma el parámetro **`ctz: 'America/Montevideo'`**. No toques las
otras funciones de calendario (`google-workspace-urls.ts`, `simulator-agenda.ts`): ésas reciben un instante y están bien.

## Bloque 2 — "Playlist Pantalla" se cae (P1)

**Hoy:** la fiesta DEMO (`src/lib/experience-ak/demo-fiesta-factory.ts` ~350) guarda `screenPlaylist.items` con
`type: 'mural'` y `type: 'redes'`, que no existen. `ScreenPlaylistAdmin` (`src/components/screen/ScreenPlaylistAdmin.tsx`
~21 y ~207) hace `typeIcons[item.type]` y dibuja `<Icon />` con `undefined`: la pantalla entera cae en "¡Ups!".

**Qué se hace:** en el demo, `'muro-fotos'` y `'redes-sociales'`. Y en `ScreenPlaylistAdmin`, un ícono y una etiqueta
de respaldo (`typeIcons[item.type] ?? Image`, `typeLabels[item.type] ?? 'Otro'`), porque una fiesta vieja puede traer un
tipo desconocido y una pantalla no se cae por un renglón.

## Bloque 3 — "Ver Contrato" de la ficha del cliente lleva a un 404 (P1)

**Hoy:** `src/app/(app)/customers/[id]/page.tsx` ~307-323 arma `/api/contracts/${customer.contractFileName}` (y lo mismo
con `budgetFileName` → `/api/budgets/` y `salonContractFileName` → `/api/salon-contracts/`). En un cliente el dato
guardado es una ruta de una computadora (`C:/Users/Usuario/Desktop/documentos/…`), y esas rutas sólo aceptan un nombre
de archivo suelto.

**Qué se hace:** una función `enlaceDeDocumentoDelCliente(valor, tipo)` en `src/lib/clientes/enlace-documento.ts` que
devuelve: la dirección `https://…` si lo es; `/api/<tipo>/<nombre>` si es un nombre suelto (sin `/` ni `\` ni `:`); y
`null` si es una ruta de computadora. Con `null`, el botón se muestra **deshabilitado** con el texto "El archivo quedó en
una computadora: volvé a subirlo". Los tres botones la usan.

## Bloque 4 — La ficha del cliente dice "Sin eventos" con presupuesto y fiesta (P2)

**Hoy:** la ficha (`src/app/(app)/customers/[id]/page.tsx` ~109-116) mira **sólo la fiesta "actual"**
(`getFiestaActual`) más el historial, y las une por `configuracion.clienteId`. Una fiesta activa que no es "la actual"
no aparece, y los presupuestos del cliente no se listan.

**Qué se hace:** usar `getFiestas(true)` (`src/app/actions/fiesta-actual.ts:57`) en vez de `getFiestaActual`, y unir
una fiesta con el cliente si `configuracion.clienteId === customerId` **o** si su `presupuestoId` es de un presupuesto
de este cliente. Sumar una sección "Presupuestos" con los presupuestos del cliente (por su `customerId`) que no tengan
fiesta, con estado e importe, y un enlace a `/presupuestos/<id>/ver`. "Sin eventos" sólo si no hay ni fiestas ni
presupuestos. Usá las mismas funciones de lectura que ya usa la pantalla; no cambies qué datos de plata se muestran.

## Bloque 5 — El editor de invitación abierto desde una plantilla se cae (P1)

**Hoy:** en `src/app/(app)/fiestas/nueva/pagina-web/page.tsx` ~266, la vista previa de plantilla guarda la fiesta de
mentira con la clave **`configuración`** (con tilde) en vez de `configuracion`, y la línea ~594 lee
`fiesta.configuracion.nombreEvento` sin `?.`. Resultado: "¡Ups!".

**Qué se hace:** la clave sin tilde, y `fiesta.configuracion?.nombreEvento` en ~594.

## Bloque 6 — "Ver como un invitado" abre un enlace inválido, también en fiestas reales (P2)

**Hoy:** el Centro de fiesta (`src/app/(app)/fiestas/[id]/centro/page.tsx` ~181-184) arma
`/invitacion/<fiesta>/invitado/<invitado>` **sin `?token=`**, y esa página (`src/app/invitacion/[fiestaId]/invitado/[guestId]/page.tsx`
~238) exige el `guestAccessToken` del invitado: siempre dice "Enlace inválido". Además, los invitados del demo
(`makeGuests` en `demo-fiesta-factory.ts` ~84) no tienen `guestAccessToken`.

**Qué se hace:**
- Una acción nueva `enlaceDeInvitadoDeMuestra(fiestaId)` en `src/app/actions/fiesta/vista-de-muestra.actions.ts` que
  **sólo** responde si `perfilDe(session.user)` es `'dueno'` o la sesión es de auditor (los mismos que ven el botón hoy,
  línea ~136); a cualquier otro le devuelve error. Busca el primer invitado **con** `guestAccessToken` y devuelve la
  dirección con `?token=`. Si ninguno tiene, devuelve la del RSVP (`/invitacion/<fiesta>/rsvp`). **No sumes el token a
  lo que el servidor le manda a la pantalla del centro**: la dirección viene de esta acción al tocar el botón.
- El botón "Ver como un invitado" la llama y abre lo que devuelve.
- `makeGuests` les pone un `guestAccessToken` a los invitados del demo.

## Bloque 7 — El portal dice "¡Llegó el gran día!" un mes después de la fiesta (P2)

**Hoy:** en `PublicPortalClientExperience.tsx` ~337, cualquier fecha pasada pone `isOver: true` y ~1109 muestra "¡Llegó el
gran día!". El texto "¡Ya la festejaste!" (`src/lib/portal/cuenta-regresiva.ts`) existe y nunca aparece.

**Qué se hace:** "¡Llegó el gran día!" **sólo si el día de la fiesta es hoy en Uruguay** (comparar
`hoyEnUruguay()` de `src/lib/utils.ts:38` con la fecha del evento). Si ya pasó un día o más, se muestra
`textoDeCuentaRegresiva` ("¡Ya la festejaste!").

## Bloque 8 — Las pestañas de "Evento en Vivo" se pisan en el celular (P2)

**Hoy:** `src/app/(app)/fiestas/nueva/en-vivo/page.tsx` ~245: `TabsList` con `grid w-full grid-cols-4 h-16` y las
pestañas con `whitespace-nowrap` (de `src/components/ui/tabs.tsx`). A 390 px, "Panel de Comando", "Modos", "Logística
Inversa" y "Check-in Invitados" se pisan.

**Qué se hace:** `grid-cols-2 sm:grid-cols-4 h-auto gap-1` en la lista, y en cada pestaña `whitespace-normal leading-tight
min-h-[44px] py-2`. Lo mismo con el botón de aviso de llegada de la protagonista (~258) si se corta: que el texto pase
de renglón.

## Bloque 9 — Títulos casi invisibles en "Evento en Vivo" (P2)

**Hoy:** "Recepción crítica" (~257) y "Checklist de personal" (~273) son `CardTitle` sin color propio sobre un fondo
`slate-900`: toman el color del tema y quedan casi negros sobre azul oscuro.

**Qué se hace:** `text-slate-100` en esos dos títulos, como ya tienen "Lista de invitados" (~533, `text-slate-300`).
Revisá los demás `CardTitle` de la misma pantalla y ponele color a los que no tienen.

## Bloque 10 — El error de la invitación casi no se lee (P2)

**Hoy:** en `src/app/invitacion/[fiestaId]/invitado/[guestId]/page.tsx` ~281 el estado de error tiene `bg-slate-950
text-white`, pero en la captura del auditor **el fondo sale muy claro** y el título blanco no se ve (hay algo de arriba
que pisa el fondo: un `layout` o un estilo general del tramo `invitacion`). Abrilo en el navegador antes de tocar.

**Qué se hace:** que el fondo oscuro se vea de verdad (o, si el fondo tiene que ser claro, título y enlace oscuros), y que
"Ir al inicio" sea un botón visible de 44 px.

## Bloque 11 — Letras raras en lugar de tildes y eñes en el ciclo comercial (P3)

**Hoy:** el texto viene roto desde los datos importados; la pantalla (`src/app/(app)/contabilidad/crm/ciclo-comercial/page.tsx`
~103-106) lo muestra tal cual. Ya existe `cleanMojibakeString` en `src/lib/text/mojibake.ts:86`.

**Qué se hace:** en `src/lib/commercial-lifecycle/commercial-lifecycle.ts` (~153 `partyType` y ~163 `fiestaEstado`),
pasar esos textos (y el nombre que muestra la tarjeta) por `cleanMojibakeString` antes de devolverlos. Sólo para mostrar:
no se guarda nada.

## Bloque 12 — Barrer el resto de la app con la pregunta 118

Buscá en `src/app` y `src/components` los `href={`…`${…}`…`}` y `router.push(`…`${…}`)` que arman la dirección con un
**dato guardado** (un nombre de archivo, una ruta, un token, un id que viene de la base). Para cada uno, mirá qué pide la
pantalla o ruta de destino. Si el dato puede no tener esa forma, aplicá lo mismo que en los bloques 3 y 6: el botón se
deshabilita con el motivo, no lleva a un error. Lo que toque plata, cobros o permisos **no lo arregles**: listalo en
`docs/evidencias/285-enlaces-con-datos-guardados.md` (una línea por caso: archivo, línea, qué pide el destino) y Claude
decide. Esa lista va igual en la entrega, con lo arreglado y lo que no.

## Pruebas

- `src/__tests__/el-calendario-lleva-la-hora-de-uruguay.test.ts`: con `TZ` de Greenwich,
  `buildGoogleCalendarUrl({ startDate: '2026-10-15', startTime: '21:00', durationHours: 5 })` tiene
  `dates=20261015T210000/20261016T020000` y `ctz=America%2FMontevideo`, y **no** tiene `Z`.
- `src/__tests__/la-playlist-no-se-cae-con-un-tipo-desconocido.test.tsx`: `ScreenPlaylistAdmin` con un renglón
  `type: 'mural'` se dibuja sin tirar error; y los tipos del demo están todos en `typeIcons`.
- `src/__tests__/el-documento-del-cliente-no-apunta-a-una-computadora.test.ts`: `enlaceDeDocumentoDelCliente` con
  `C:/Users/x/contrato.pdf` da `null`, con `contrato.pdf` da `/api/contracts/contrato.pdf`, con `https://…` la misma.
- `src/__tests__/el-invitado-de-muestra-abre.test.ts`: `enlaceDeInvitadoDeMuestra` con sesión de dueño devuelve una
  dirección con `?token=` igual al `guestAccessToken` del invitado; con sesión de secretaria y de personal, error; y los
  invitados del demo tienen `guestAccessToken`.
- `src/__tests__/el-portal-no-anuncia-el-gran-dia-despues.test.ts`: con hoy = 12/11/2026 y fiesta el 15/10/2026, el
  texto es "¡Ya la festejaste!"; con la fiesta hoy, "¡Llegó el gran día!". Sacá la decisión a una función en
  `src/lib/portal/cuenta-regresiva.ts` para poder probarla.
- `tests/e2e/en-vivo-se-lee-en-el-celular.spec.ts`: a 390 px, en `/fiestas/nueva/en-vivo?fiestaId=<fiesta de prueba>`
  (helper `tests/e2e/helpers/fiesta-de-prueba.ts`), ninguna pestaña se superpone con la de al lado (sus cajas no se
  cruzan) y el título "Recepción" tiene un color distinto del fondo de su tarjeta.
- `tests/e2e/el-error-de-la-invitacion-se-lee.spec.ts`: abrir `/invitacion/x/invitado/y` sin token y comprobar que el
  color del título no es igual al color de fondo visible y que "Ir al inicio" se ve.

```comprobar
usa: ctz en src/lib/calendar-links.ts
usa: muro-fotos en src/lib/experience-ak/demo-fiesta-factory.ts
archivo: src/lib/clientes/enlace-documento.ts
usa: enlaceDeDocumentoDelCliente en src/app/(app)/customers/[id]/page.tsx
usa: getFiestas en src/app/(app)/customers/[id]/page.tsx
no-usa: configuración: { nombreEvento en src/app/(app)/fiestas/nueva/pagina-web/page.tsx
archivo: src/app/actions/fiesta/vista-de-muestra.actions.ts
usa: enlaceDeInvitadoDeMuestra en src/app/(app)/fiestas/[id]/centro/page.tsx
usa: hoyEnUruguay en src/app/portal/c/[accessKey]/PublicPortalClientExperience.tsx
usa: grid-cols-2 sm:grid-cols-4 en src/app/(app)/fiestas/nueva/en-vivo/page.tsx
usa: cleanMojibakeString en src/lib/commercial-lifecycle/commercial-lifecycle.ts
prueba: src/__tests__/el-calendario-lleva-la-hora-de-uruguay.test.ts
prueba: src/__tests__/la-playlist-no-se-cae-con-un-tipo-desconocido.test.tsx
prueba: src/__tests__/el-documento-del-cliente-no-apunta-a-una-computadora.test.ts
prueba: src/__tests__/el-invitado-de-muestra-abre.test.ts
prueba: src/__tests__/el-portal-no-anuncia-el-gran-dia-despues.test.ts
prueba: tests/e2e/en-vivo-se-lee-en-el-celular.spec.ts
prueba: tests/e2e/el-error-de-la-invitacion-se-lee.spec.ts
archivo: docs/evidencias/285-enlaces-con-datos-guardados.md
```
