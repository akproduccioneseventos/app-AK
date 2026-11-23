# Orden 333 — Auditoría externa del 21/11/2026: lo que quedó confirmado, módulo por módulo

**De dónde sale:** un informe de auditoría de los seis módulos que le llegó al dueño el 21/11. Claude verificó cada
aviso contra la versión principal: de unos 80, **cerca de 60 son ciertos y unos 15 eran falsas alarmas** (entre ellas
los enlaces al simulador viejo, que el auditor miró en una rama a medio hacer; el PIN vacío del portal, ya consultado
al dueño; y las fotos del muro con enlace directo, decisión del dueño). **Lo urgente de permisos y plata ya lo arregló
Claude** (ver el final): no lo toques.

**Cómo se entrega:** **una sola propuesta**, rama nueva desde la principal, **junto con las órdenes 331 y 332** (la
misma propuesta). Si un bloque se traba, entregá el resto y decí cuál faltó. Antes de decir "terminé":
`npm run "publicar?"` completo y `docs/ANTES-DE-ENTREGAR.md`. **Lo que toca plata, permisos o comida lo revisa Claude
línea por línea** (bloques 1 y 2): cada acción de plata lleva su prueba con "alguien sin permiso" (el personal) y
pasa el candado (`src/__tests__/el-candado-de-la-plata.test.ts`).

## Bloque 1 — Plata y contabilidad

1. **El reporte de ganancias cuenta precios de venta como costo.** `src/app/actions/reportes.ts` ~254-257 y ~318-321
   suman `montoEstimado` de todo `gestionCostos.costosItems`. Usá el mismo filtro que ya tiene la ganancia por fiesta:
   `esPrecioDeVentaCopiado` + `costoDeCatalogo` (`src/lib/costos/ganancia-evento.ts` ~116-118). Mejor todavía: que el
   reporte tome el costo de `calcularGananciaDeEvento`, así el P&L y el panel dan el mismo número.
2. **Las fiestas de muestra entran en la plata.** Sacá las de `esFiestaDemo` (`src/lib/events/event-ordering.ts:69`) en
   `reportes.ts` ~91-94, `src/app/actions/dashboard.ts` ~123, `src/app/actions/analytics.ts` ~106,
   `src/app/actions/comparativa-ganancias.ts` ~26 y `src/components/contabilidad/panels/finanzas.tsx` ~72. **Las
   suspendidas se quedan en la contabilidad** (su liquidación es saldo real, `YA-RESUELTO.md` ~3200).
3. **La secretaria ve una ganancia inflada.** Sin el permiso `GANANCIAS`, `recortarFiestaPorPerfil`
   (`src/lib/fiesta/recortar-para-afuera.ts` ~168-170) borra los costos, y `finanzas.tsx` ~150-158 igual muestra
   "Ganancia sobre lo cobrado" y "Ganancia esperada". Sin ese permiso, esas dos tarjetas y el margen **no se muestran**
   (y `analytics.ts` no los devuelve).
4. **"Descargar todo (.zip)" de documentos sale vacío.** `src/app/api/documentos-fiesta/[...parts]/route.ts` ~50-56
   arma una ruta de disco con `doc.fileName`, que es la dirección del depósito (`uploadToStorage`). Si empieza con
   `http`, bajalo con `fetch`; si es `data:`, decodificalo. Si al final no entró ningún archivo, contestá 404 con
   *"No hay documentos para bajar"*, nunca un zip vacío con 200.
5. **"Se cobró" muestra lo presupuestado.** `src/components/contabilidad/panels/comparativa-ganancias.tsx` ~38, ~77,
   ~163 y ~232: el número es `ingreso` (lo presupuestado). Cambiá el rótulo a **"Presupuestado"**; no cambies la cuenta.
6. **Reportes contables:** en `src/app/(app)/empresa/contabilidad/reportes/page.tsx`, el CSV (~166-173) y el correo al
   contador (~130-142) toman el mes de `startDate`, que cambia con el selector aunque no se apriete "Generar". Que usen
   `rangoDelReporte` (el del último "Generar"). Y `formatDate` (~33) lee `AAAA-MM-DD` como fecha local, no UTC.
7. **Constancia de cancelación** (`src/components/panels/doc--cancelacion-contrato.tsx`): ~137-141 suma sólo cobros
   de facturas; sumá también los `pagosCliente` del presupuesto que no tienen factura (sin contar dos veces el mismo
   cobro). Y ~192/203-205: **abrir la vista no escribe nada**; `updateContratoFiestaActual(..., 'cancelacion')` se llama
   sólo al tocar "Generar/Guardar".
8. **Activos fijos:** `src/app/actions/activos-fijos.ts` ~48-52 borra a propósito los precios y `tramosDePrecio`, pero
   `src/app/(app)/empresa/activos-fijos/[id]/editar/page.tsx` ~411-425 los sigue ofreciendo. Mirá qué campos guarda el
   servidor para la cantidad (fija y por invitados) y conectá la pantalla a **esos**; sacá de la pantalla lo que el
   servidor no guarda.
9. **Presupuestos y CRM, avisos que se pierden:** `src/app/actions/presupuestos.ts` ~633-665 devolvé `avisoCrm` y que
   la pantalla de edición lo muestre; `src/app/actions/crm.ts` ~823/838/919 devolvé `avisoDeLaSena` y mostralo al
   confirmar el contrato.
10. **El documento del presupuesto dice $5.000 de seña fija:** `src/app/(app)/presupuestos/[id]/ver/page.tsx` ~771 y
    ~1343 pasan `DEFAULT_BOOKING_DEPOSIT_AMOUNT`; pasá la misma seña que ya calcula la página en ~459-464 (la del
    presupuesto y, si no, la de Ajustes). En ~125 la fecha sugerida del cobro con `hoyEnUruguay()`.
11. **`?fecha=` desde la presentación** (`src/app/(app)/presupuestos/nuevo/crear/page.tsx` ~298-301): `new Date("AAAA-MM-DD")`
    corre un día en Uruguay; armá la fecha local (`new Date(a, m-1, d)`).
12. **Costo de las recetas hasta 1000 veces mal** (`src/app/actions/menus-catering.ts` ~70-76): con receta en g/ml y
    catálogo en Unidad/Paquete divide por 1000, y con receta en kg/l y catálogo en g/ml no multiplica. La conversión va
    en los dos sentidos y, si las unidades no se pueden convertir (g contra Unidad), **no se calcula**: se muestra el
    aviso de `avisosDeUnidadesDelMenu` (`src/lib/catering/unidades.ts`, hoy no lo llama ninguna pantalla) en el editor
    de menús.
13. **El simulador no suma los platos que marca solo** (`src/app/simulador-de-presupuesto/page.tsx` ~987-998): al tocar
    "Siguiente" en el paso del menú sin elegir, se marcan principal, entrada e infantil con `setSelected…` pero no pasan
    por `handleGastronomicSelectionChange` (~584), que es lo que los mete en `formData.serviciosSeleccionados`. El
    presupuesto y el PDF salen sin esos platos. Que pasen por ahí. **Del simulador no se toca nada más** (textos, reloj,
    pasos), salvo el punto 14.
14. **Simulador, paso final:** "Sacá servicios que no querés" (~1767) va a `setStep(5)` y "Cambiá de paquete" (~1783) a
    `setStep(4)`.
15. **El CRM junta dos personas distintas con el mismo nombre** (`src/app/actions/crm.ts` ~1116-1131): busca por nombre
    normalizado **o** teléfono. Primero por teléfono; por nombre sólo si ninguno de los dos tiene teléfono, y nunca por
    un nombre genérico ("Cliente", "Invitado").
16. **El mes del tope de gasto de IA:** `claveDelMes` (`src/lib/ai/consumo.ts` ~112-115) usa el mes del servidor y el
    resumen usa Montevideo. Que las dos usen la fecha de Uruguay (`aFechaHoraLocal`/`hoyEnUruguay`).
17. **El "análisis de la competencia" es un texto fijo** (`src/lib/presencia-digital/competencia.ts` ~124-131):
    `geminiCommercialModel` es un nombre, no un objeto, así que nunca llama a la IA y devuelve siempre "Competencia
    analizada con éxito…". Llamá a la IA como lo hacen las otras funciones del mismo directorio (con su reserva de
    consumo, que hoy se toma en ~115 y no se usa) o, si falla, *"No hay análisis esta semana"*. Nunca un texto que
    parezca un análisis.

## Bloque 2 — Entrar a la app, portal del cliente e invitados (quién ve qué)

1. **El invitado queda atrapado en "Este acceso no es válido".** El hub (`src/app/evento/hub/[fiestaId]/page.tsx` ~101)
   guarda sólo `ak_invitado_fiesta` y `/entrar` (`src/app/entrar/EntrarClient.tsx` ~35-37 y ~153) lo manda al hub sin
   credencial. Guardá también `guestId` y `token` (con `withGuestAccess`, `src/lib/guest-portal/public-event-navigation.ts:27`)
   y usalos al volver. Si no hay credencial válida, borrá lo guardado y quedate en `/entrar`. En la vista de error del
   hub (~131-150), un botón **"Volver a entrar"** que borra lo guardado. (Esto se junta con el bloque 2 de la orden 332.)
2. **El cliente escribe la clave dos veces:** `src/app/portal-cliente/[id]/page.tsx` ~184-185 mira sólo
   `sessionStorage`; si ya hay sesión de portal válida para esa fiesta (`verifyPortalSession`), que entre directo.
3. **El cliente no puede guardar en "Mesas" de su portal:** `src/app/portal/mesas/mesas-del-cliente.tsx` ~125-167 llama
   a `addInvitado` (y a editar/borrar) que piden sesión del equipo (`src/app/actions/fiesta/invitados.actions.ts` ~107).
   Que acepten **también** la sesión de portal **de esa misma fiesta** (`verifyPortalSession(fiestaId)`), sólo para
   sus invitados. Lo revisa Claude.
4. **Tres botones del invitado que llevan a error:** en `src/app/invitacion/[fiestaId]/invitacion-publica-client.tsx`
   "Ver recap" (~197/251) y "Menú digital" (~193, ~150-158) van sin invitado: sin credencial, **no se muestran** (salvo
   que `accesosVivos` traiga la dirección). En `src/app/evento/mi-mesa/[fiestaId]/page.tsx` ~136-141 "Entrar a la fiesta"
   lleva `guestId` sin `token`: pasá el `token` que ya tiene. Lo mismo, encontrado por el barrido: las direcciones que
   arma `src/lib/invitacion/accesos-vivos.ts` ~89/93 (menú digital y recap, sin invitado) y los dos botones de
   `src/app/evento/ar/[fiestaId]/page.tsx` ~149/177 que van al hub sin credencial (que la lleven, si la página la tiene,
   o vayan a la invitación).
5. **RSVP:** `src/app/invitacion/[fiestaId]/rsvp/page.tsx` y `submitPublicRsvp` (`invitados.actions.ts` ~504) respetan
   `rsvpActivo: false` (cartel *"Las confirmaciones están cerradas"*). "Cancelar mi confirmación" (~334) lleva
   `guestId` y `token`: hoy sin ellos puede crear un invitado nuevo.
6. **Recepción:** `src/app/recepcion/[fiestaId]/RecepcionClient.tsx` ~80-98 pone "Presente" y "Guardado sin conexión"
   también cuando el servidor **rechazó** el ingreso. A la cola va sólo si no hubo respuesta (sin red); si el servidor
   dijo que no, se muestra su motivo y no se marca. Y `src/app/evento/actual/checkin/page.tsx` ~58-61 revalida el QR con
   el servidor aunque el invitado ya esté marcado.
7. **"Consulta enviada" sin enviar:** `src/components/panels/portal--faq.tsx` ~62-69 mira `success` antes de decirlo.
8. **`next.config.js` ~296:** `/portal-cliente/:id/decoracion` va a `/portal/:id/decoracion` (exacta).

## Bloque 3 — Planificador, cocina y personal

1. `src/components/fiestas/panels/invitados.tsx` ~696: `<SelectItem value="">` rompe el selector; usá un valor
   (`"sin-mesa"`) y convertilo a vacío al guardar.
2. **El personal externo (DJ, utilero, decorador) va al ingreso:** sus enlaces son `/fiestas/nueva/<x>/pdf?token=…`, y
   `next.config.mjs` ~440-443 los manda a `?tab=pdf`, que `src/app/auth-guard.tsx` ~36-39 no deja pasar con token.
   Que la regla del token de AuthGuard (y del middleware, `src/middleware.ts` ~16) acepte también la solapa `tab=pdf`
   de esas mismas pantallas, con el mismo control del token. Lo revisa Claude (es quién ve qué).
3. `src/app/(app)/empresa/salones/page.tsx` ~618-634: al editar, cargá `gerente` en el formulario.
4. **Suspendidas que ocupan personal y agenda (pregunta 188):** sacá suspendidas (`esFiestaSuspendida`,
   `src/lib/fiesta/revisar-fiestas.ts:38`) y de muestra en `src/app/actions/agenda.ts` ~77,
   `src/lib/personal/proponer-equipo.ts` ~49-58, `src/app/(app)/mi-dia/page.tsx` ~60 y `src/app/(app)/eventos/page.tsx`
   ~128-187.
5. `src/app/(app)/mi-dia/page.tsx` ~67: "hoy" con `hoyEnUruguay()`.
6. **Hoja de cocina:** `src/components/panels/catering--hoja-de-cocina.tsx` ~59-67 también lee el menú asignado
   (`menuAsignadoId`), como la lista de compras; y `src/lib/catering/hoja-de-cocina.ts` ~92-94 cuenta al celíaco vegano
   en los dos grupos (usá `condicionesDelInvitado`).
7. `src/components/fiestas/panels/alergias.tsx` ~250/256/262: las tarjetas cuentan personas (`getGuestPartySize`).
8. **Lista de compras:** `src/components/panels/catering--lista-compras.tsx` ~662-664 muestra al lado del costo
   faltante la **cantidad faltante** (y el stock). `src/lib/compras/compras-del-menu-asignado.ts` ~47: los platos
   infantiles se multiplican por los niños, no por todos.
9. `catering--lista-compras.tsx` ~543: "Configurar Carta de Tragos" lleva a la pantalla donde se arma la carta (buscá
   "Carta de Tragos" en `src/app/(app)/fiestas/`), no a `/fiestas/nueva`.

## Bloque 4 — Estaciones de la fiesta

1. **Espejo Mágico y Vogue sin señal:** `src/app/evento/espejo-magico/[fiestaId]/page.tsx` ~1038-1040/1698-1707 y
   `src/app/evento/bogue/[fiestaId]/page.tsx` ~892-911: cuando la foto queda en cola, cartel *"Guardada sin señal: se
   sube sola cuando vuelva"* en lugar del QR vacío. Y en Vogue `resetLocalState` (~378-397) limpia `qrCodeUrl`: hoy el
   siguiente invitado ve el QR del anterior.
2. `src/app/evento/touchpix/[fiestaId]/page.tsx` ~1213-1215 y ~1302-1304: si la subida falla o no se puede guardar en
   cola, cartel visible. Y `QrModal` (~1326-1370) va fuera del componente de la página.
3. `src/app/evento/control-pantalla/[fiestaId]/page.tsx` ~284-304: la trivia usa las preguntas reales de la fiesta (las
   mismas que `CentroTriviaPanel`/`games.actions.ts`), nunca "Opción 1..4".
4. **Búsqueda por cara:** `src/lib/caras/extractor-facial.ts` ~31 espera 15 segundos, no 1,5. Si los modelos no
   cargan, `src/app/evento/galeria/[fiestaId]/page.tsx` ~62-91 dice *"No pudimos activar la búsqueda por cara; probá de
   nuevo"* y **no** compara por brillo; ~456 nunca busca con un vector inventado (`fill(0.01)`).
5. `src/app/evento/zona-digital/[fiestaId]/page.tsx` ~249: "Subir al muro" lleva `guestId` y `token` como los otros
   enlaces de la página.
6. **Barra:** `src/app/evento/barra/[fiestaId]/stats/page.tsx` ~139-140 muestra el stock real o saca la tarjeta (nunca
   "Stock estable" fijo); `src/app/evento/barra/[fiestaId]/page.tsx` ~644-650/712-721: el pedido sin señal lleva la
   versión elegida (con o sin alcohol).

## Bloque 5 — AK Editor (`herramientas/ak-editor/`)

1. `redes.py` ~227/242 y `video_de_vida.py` ~1061/1091: leer imágenes con `cv2.imdecode(np.fromfile(...))`, como ya
   hace `analizador.py` ~374 (las carpetas con tildes o ñ fallaban en Windows).
2. `redes.py` ~211-270: `ruta_audio` se pega al video con FFmpeg (hoy salen mudos).
3. `app.py` ~173/229/247: si `exportar_ok` es falso, el mensaje dice *"No se pudo armar el video"* y el motivo (hoy dice
   "completada con éxito" igual). Y en `redes.py` la música se pega con `-shortest`, para que el clip dure lo que el video.
4. Reempaquetá con `node scripts/empaquetar-ak-editor.mjs`.

## Bloque 6 — Redes y WhatsApp

1. **Instagram y Messenger no reciben la respuesta del asistente** (decisión del 19/11: el mismo asistente atiende la
   web, Instagram y Messenger). `src/app/api/meta/webhook/route.ts` ~246-270 llama al asistente de
   `src/lib/whatsapp/asistente-de-prospectos.ts` para los directos, y `verificarLeadPidePersona` (~310-312, ~590) mira
   también esos canales: si una persona tomó la charla, el asistente no contesta.
2. `src/app/api/whatsapp/webhook/route.ts` ~256-270: si el control de "contacto personal" no contesta a tiempo, **no se
   contesta ni se guarda** (hoy `.catch(() => ({ bloquear: false }))` deja pasar); se anota para revisar.
3. **Los recordatorios a invitados** (`recordar_invitacion`, `recordatorio_invitados` en
   `src/lib/automatico/al-entrar-a-la-app.ts` ~285-302) salen sólo entre las 9 y las 21 de Uruguay, los dispare quien
   los dispare (hoy una visita de madrugada a la portada los puede disparar a esa hora).

## Bloque 7 — Pruebas que fallan en la máquina del dueño (Windows)

1. `src/__tests__/hydrogen-y-despues-gratis.test.ts` ~12-19: normalizá los saltos de línea (`\r\n`) antes de comparar.
2. `src/__tests__/el-plan-y-el-contrato-dicen-lo-mismo.test.ts` ~42-44 da 99 en vez de 100 días según la hora: armá
   las dos fechas en hora de Uruguay.

## Bloque 8 — Segundo informe del 21/11 (PDF "Auditoría actual de la aplicación AK", AK-01 a AK-10)

Claude lo verificó: **AK-01 es decisión del dueño** (los presupuestos que aparecen al poner el celular quedan, 11/11:
no se toca) y **AK-03 ya lo arregló Claude** (Poner al día cobraba el saldo sin el ajuste anual). Lo demás:

1. **AK-02, el simulador se cae si se publicó una versión nueva con la página abierta** (error "Server Action … was not
   found"). En `src/app/simulador-de-presupuesto/page.tsx` (~879 y ~1010, la llamada a `generateBudgetAndLeadFromSimulator`),
   si el error trae "Server Action" o "failed-to-find-server-action": guardá lo cargado en `sessionStorage`, mostrá
   *"Hay una versión nueva de la página. Tocá Recargar y seguís donde estabas"* con botón **Recargar**, y al volver
   recuperá los datos. Mismo `submissionId`: no se crea un prospecto dos veces. **Del simulador no se toca nada más.**
2. **AK-04, factura "Pagada" con saldo pendiente** (plata: lo revisa Claude). `src/app/(app)/invoices/[id]/page.tsx`
   ~139-141/233-259 suma `invoice.payments`; el listado y la edición usan `invoice.status`. El listado y la edición
   muestran **el estado que sale de los pagos** (si el saldo confirmado es mayor que cero, no dice "Pagada"); no se agrega
   ningún pago para que coincida. La edición no deja elegir "Pagada" a mano si el saldo no es cero.
3. **AK-05, "publicaste hace poco" sin fechas:** `src/app/(app)/empresa/presencia-digital/presencia-digital-client.tsx`
   ~860-898 usa lo contrario de `inactivePlatforms.length`. Tres estados: reciente (con fecha), inactivo y *"Sin datos de
   publicaciones"*. Sin fechas no hay verde.
4. **AK-06, "4 de 4 puestos cubiertos" con rol desconocido y nadie confirmado:** `src/components/fiestas/panels/personal.tsx`
   (~530, "Rol Desconocido"): el pie cuenta por separado requeridos, asignados y confirmados, y un rol que no existe no
   cuenta como cubierto.
5. **AK-07, el panel de tareas automáticas:** separar "corrió" de "entregó" (si falta WhatsApp, dice *"Corrió, pero no
   pudo mandar: falta conectar WhatsApp"*), y avisar si la última corrida la disparó una visita a la web y no el
   despertador.
6. **AK-08:** en tableta (820 px) el título largo del evento no se corta: baja de renglón (`break-words`).
7. **AK-09, la cuenta regresiva de la invitación termina 21 horas antes:** `src/components/invitacion/edit/SeccionCuentaRegresiva.tsx`
   y las plantillas que la muestran (`src/components/invitacion/templates/*`): la fecha y la hora del evento se arman en
   hora de Uruguay, no como medianoche UTC.
8. **AK-10, el cronograma dice "AHORA MISMO" en un evento futuro:** `src/app/evento/staff/[fiestaId]/cronograma/page.tsx`
   ~171-177: el bloque "AHORA MISMO" aparece sólo el día del evento; antes, *"Lo primero, el día del evento"*.

## Bloque 9 — Tercer informe del 21/11 (PDF "IA y mecanismos", IA-01 a IA-05)

Claude ya arregló **IA-01** (el asistente leía el presupuesto de otro cliente; y lo mismo, encontrado por el barrido, al
hacer una factura o cambiar una fiesta por nombre en `src/app/actions/assistant.ts`) e **IA-03** (el tope de gasto de IA
tenía agujeros: respuestas profundas, auditor y falla al leer). Lo demás:

1. **IA-02, una pregunta prepara seguimientos:** en `src/app/actions/centro-de-control.ts` (~487, ~598-641, ~733-750),
   `darOrdenPorVozOTexto` toma "¿Cuántos presupuestos tengo?" como orden y llama a `ejecutarPerseguidorPresupuestos`.
   Antes de ejecutar, clasificá: si es una pregunta (empieza con "cuánt", "qué", "cuál", "hay", o termina en "?"), se
   contesta leyendo (la cantidad y de qué período) y **no** se llama al perseguidor ni se toca la bandeja. Sólo una orden
   explícita ("prepará los seguimientos") lo dispara.
2. **IA-04, un error al leer se muestra como "todo bien":** `src/components/settings/panels/ai-assistant.tsx` ~43, ~47-64 y
   ~319-330: si la lectura de fallos falla, cartel neutro *"No se pudo leer el registro de fallos"* (nunca el verde).
   Con la lista vacía leída bien: *"No se registraron fallos hoy"*, no "la IA funcionó con normalidad en todas sus
   funciones".
3. **IA-05, Conexiones confunde configuración con presencia pública:** `src/app/actions/conexiones-estado.actions.ts`
   ~163-189. WhatsApp: si la web ya tiene el botón con `AK_WHATSAPP_NUMBER`, no decir que "los clientes no pueden
   escribirte"; decir *"El botón de la web anda; falta conectar la cuenta para que la app conteste"*. Google: decir
   *"Falta guardar el enlace de tu ficha de Google"* y **sacar el "32% de los clientes"** (es un número inventado).

## Barrido en toda la app (hecho por Claude el 21/11)

- **Pregunta 198 (auditor que pasa como administrador en lo que no es probar):** buscado `esAdministrador(` en
  `src/app/actions` y `src/lib`: cambiar cuentas ajenas, tope de IA y mensajes a clientes eran los tres casos; los
  arregló Claude.
- **Pregunta 199 (enlace a la pantalla del invitado sin su credencial):** el escaneo encontró 11 lugares: los del bloque
  2 (hub desde `/entrar`, recap y menú digital de la invitación pública y de `accesos-vivos.ts`, "Buscá tu mesa") y dos
  más que el informe no traía (los botones de la realidad aumentada). El del muro (`social` ~1400) sí lleva el token. Los enlaces al muro desde las pantallas del equipo y el
  afiche son a propósito (el muro se mira sin credencial).
- **Pregunta 200 (sumas de plata que no sacan las fiestas de muestra):** los cinco archivos del bloque 1, punto 2.
- **Pregunta 201 ("sin conexión" o "enviado" anunciado cuando el servidor dijo que no):** recepción y consultas del
  portal (bloque 2, puntos 6 y 7); Touchpix (bloque 4, punto 2).
- **Pregunta 202 (un control que, si tarda, deja pasar):** un solo caso, el filtro de contactos personales de WhatsApp
  (bloque 6, punto 2).
- **Pregunta 182 (total y detalle de fuentes distintas), por AK-03 y AK-04:** buscado `getBudgetPaymentSummary(` sin el
  ajuste en `src/`: Poner al día era el único que cobraba con el saldo sin ajuste (arreglado); el recibo muestra la base a
  propósito, desglosada. El estado guardado de la factura contra sus pagos va al bloque 8, punto 2.
- **Pregunta 203 (búsqueda con un nombre que puede venir vacío):** el escaneo encontró, además del encargado, tres en
  `src/app/actions/assistant.ts` (factura, alta de cliente y cambio de fiesta). Los arregló Claude; hoy da cero.
- **Pregunta 188 (suspendidas contadas como activas):** volvió en agenda, propuesta de equipo, Mi Día y Eventos (bloque 3).

## Lo que ya arregló Claude (no lo toques)

Preguntas de seguridad de otras cuentas, tope mensual de IA y automatización de marketing (el auditor no los toca);
la llamada de voz del equipo (sesión viva y dentro del tope de gasto); el registro de auditoría (sólo administración);
subir contratos y recibos (pide contabilidad antes de subir); las fotos de un prospecto por Instagram que se tomaban como
mención; el agradecimiento repetido; el archivo de menciones; y que un mensaje nuevo no le saque la charla a la persona.
Lo vigila `src/__tests__/auditoria-externa-21-11-quien-toca-que.test.ts`.

## Qué tiene que comprobar la prueba

Las pruebas van en estos archivos (los nombra el bloque `comprobar`): `src/__tests__/auditoria-21-11-plata.test.ts`
(bloque 1), `src/__tests__/auditoria-21-11-entrar-y-portal.test.ts` (bloque 2),
`src/__tests__/auditoria-21-11-planificador.test.ts` (bloque 3), `src/__tests__/auditoria-21-11-estaciones.test.ts`
(bloque 4) y `tests/e2e/auditoria-21-11-simulador-y-entrar.spec.ts` (navegador). Cada una tiene que **fallar con el
código de hoy**: probala rompiendo el arreglo antes de entregar.

- **Jest (bloque 1, además):** el aviso del CRM al editar un presupuesto y el de la factura de la seña llegan en la
  respuesta (`avisoCrm`, `avisoDeLaSena`); el CSV del reporte usa el mes del último "Generar".
- **Jest (bloque 3):** editar un salón y guardar conserva el gerente; las tarjetas de alergias cuentan personas.
- **Jest (bloque 4, además):** "Subir al muro" de la zona digital lleva `guestId` y `token`.
- **Jest (bloque 1):** el P&L de una fiesta con un renglón `sync_budget_*` sin `costoDeCatalogo` da el mismo costo que
  `calcularGananciaDeEvento`; una fiesta `esMuestra` no suma en P&L, panel ni comparativa; una receta de 200 g contra un
  catálogo en kg da el costo de 0,2 kg, y 1 kg contra catálogo en g, el de 1000 g; dos prospectos "Cliente" con teléfonos
  distintos quedan separados.
- **Jest (bloque 2):** `addInvitado` con sesión de portal de la fiesta A guarda en A y con la de A en la fiesta B, no;
  la recepción con el servidor contestando "no" no marca presente; FAQ con `success:false` no dice "enviada".
- **Navegador:** en el simulador, pasar el menú sin elegir platos y llegar al resumen con los platos en el total;
  `/entrar` con una fiesta guardada sin credencial no cae en "Este acceso no es válido".
- **Jest (bloque 4):** sin modelos de caras, la galería no devuelve resultados por brillo.

```comprobar
usa: esPrecioDeVentaCopiado en src/app/actions/reportes.ts
usa: esFiestaDemo en src/app/actions/reportes.ts
usa: esFiestaDemo en src/app/actions/dashboard.ts
usa: esFiestaDemo en src/app/actions/analytics.ts
usa: esFiestaDemo en src/app/actions/comparativa-ganancias.ts
usa: esFiestaDemo en src/components/contabilidad/panels/finanzas.tsx
usa: GANANCIAS en src/components/contabilidad/panels/finanzas.tsx
usa: No hay documentos para bajar en src/app/api/documentos-fiesta/[...parts]/route.ts
usa: Presupuestado en src/components/contabilidad/panels/comparativa-ganancias.tsx
prueba: src/__tests__/auditoria-21-11-plata.test.ts
usa: pagosCliente en src/components/panels/doc--cancelacion-contrato.tsx
usa: hoyEnUruguay en src/app/(app)/presupuestos/[id]/ver/page.tsx
usa: avisosDeUnidadesDelMenu en src/app/(app)/empresa/menus/[menuId]/editar/page.tsx
prueba: tests/e2e/auditoria-21-11-simulador-y-entrar.spec.ts
usa: hoyEnUruguay en src/lib/ai/consumo.ts
usa: No hay análisis esta semana en src/lib/presencia-digital/competencia.ts
usa: withGuestAccess en src/app/entrar/EntrarClient.tsx
usa: Volver a entrar en src/app/evento/hub/[fiestaId]/page.tsx
usa: verifyPortalSession en src/app/portal-cliente/[id]/page.tsx
usa: verifyPortalSession en src/app/actions/fiesta/invitados.actions.ts
usa: token en src/app/evento/mi-mesa/[fiestaId]/page.tsx
usa: withGuestAccess en src/lib/invitacion/accesos-vivos.ts
usa: withGuestAccess en src/app/evento/ar/[fiestaId]/page.tsx
usa: rsvpActivo en src/app/invitacion/[fiestaId]/rsvp/page.tsx
usa: rsvpActivo en src/app/actions/fiesta/invitados.actions.ts
prueba: src/__tests__/auditoria-21-11-entrar-y-portal.test.ts
usa: /portal/:id/decoracion en next.config.js
usa: sin-mesa en src/components/fiestas/panels/invitados.tsx
usa: tab=pdf en src/app/auth-guard.tsx
prueba: src/__tests__/auditoria-21-11-planificador.test.ts
usa: esFiestaSuspendida en src/app/actions/agenda.ts
usa: esFiestaSuspendida en src/lib/personal/proponer-equipo.ts
usa: esFiestaSuspendida en src/app/(app)/mi-dia/page.tsx
usa: esFiestaSuspendida en src/app/(app)/eventos/page.tsx
usa: menuAsignadoId en src/components/panels/catering--hoja-de-cocina.tsx
usa: getGuestPartySize en src/components/fiestas/panels/alergias.tsx
usa: Guardada sin señal en src/app/evento/espejo-magico/[fiestaId]/page.tsx
usa: Guardada sin señal en src/app/evento/bogue/[fiestaId]/page.tsx
usa: CentroTrivia en src/app/evento/control-pantalla/[fiestaId]/page.tsx
usa: 15000 en src/lib/caras/extractor-facial.ts
prueba: src/__tests__/auditoria-21-11-estaciones.test.ts
usa: imdecode en herramientas/ak-editor/redes.py
usa: imdecode en herramientas/ak-editor/video_de_vida.py
usa: -shortest en herramientas/ak-editor/redes.py
usa: No se pudo armar el video en herramientas/ak-editor/app.py
usa: verificarLeadPidePersona en src/app/api/meta/webhook/route.ts
no-usa: bloquear: false } en src/app/api/whatsapp/webhook/route.ts
usa: hoyEnUruguay en src/lib/automatico/al-entrar-a-la-app.ts
usa: \r\n en src/__tests__/hydrogen-y-despues-gratis.test.ts
usa: Hay una versión nueva de la página en src/app/simulador-de-presupuesto/page.tsx
usa: Sin datos de publicaciones en src/app/(app)/empresa/presencia-digital/presencia-digital-client.tsx
usa: confirmados en src/components/fiestas/panels/personal.tsx
usa: Lo primero, el día del evento en src/app/evento/staff/[fiestaId]/cronograma/page.tsx
usa: hoyEnUruguay en src/components/invitacion/edit/SeccionCuentaRegresiva.tsx
prueba: src/__tests__/la-factura-dice-el-estado-de-sus-pagos.test.ts
prueba: src/__tests__/auditoria-21-11-ia.test.ts
no-usa: funcionó con normalidad en todas sus funciones en src/components/settings/panels/ai-assistant.tsx
no-usa: 32% en src/app/actions/conexiones-estado.actions.ts
```
