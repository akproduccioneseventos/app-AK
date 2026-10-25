# Auditoría Maestra Total de Gemini (20/10/2026) — Parte 3: los 45 hallazgos

Copia del informe que el dueño pegó en el chat (las partes 1 y 2 son descripción; acá va lo que se
verifica). Cada hallazgo lo confirma o descarta Claude contra el código; el resultado queda al final.

## Bloque 1: Sincronizaciones, APIs, Webhooks, IA y Tareas Automáticas

1. [CRÍTICO] El middleware bloquea las 11 tareas automáticas (`/api/cron/*`) y `/api/marketing/automation` con un 307 a `/login`. Archivos: `src/middleware.ts` ~43-66 y `src/lib/auth/public-paths.ts` ~90-101. Ninguna ruta `/api/cron/*` está en `PUBLIC_EXACT_PATHS` ni en `PUBLIC_PATH_PREFIXES`; el despertador manda `Authorization: Bearer <CRON_SECRET>` sin cookie y lo redirige.
2. [CRÍTICO] Webhook de WhatsApp: los mensajes que manda el dueño (`message_echoes`) se procesan como órdenes. `src/app/api/whatsapp/webhook/route.ts` ~100-166 y `src/lib/asistente/por-whatsapp.ts` ~151-186. Detecta `isEcho` (~100) pero llama a `atenderAlEquipo({ from: phone, text: messageText })` (~163-166) sin pasar `isEcho`, `to`, `type` ni `mediaId`; la protección de ~151-158 no se activa y audios/fotos de boletas no entran al lector (~180-185).
3. [CRÍTICO] El vigilante de Meta Ads inventa presupuesto diario (`spend / 30 || 500`), omite `verificado` y el tope sólo frena si `verificado === false`. `src/lib/agentes/motor-agentes.ts` ~389-424, `src/lib/marketing/tope-de-gasto-publicidad.ts` ~165-237. Además `src/lib/marketing/meta-ads-acciones.ts` ~56-60 devuelve `{ success: true, data: { simulated: true } }` sin token y anota que pausó.
4. [CRÍTICO] Cuatro envíos automáticos de WhatsApp leen sólo `process.env.META_WHATSAPP_TOKEN/PHONE_ID` y no `getWhatsAppConfig()`: `src/lib/asistente/por-whatsapp.ts` ~335, `src/lib/asistente/avisar-al-duenio.ts` ~258, `src/lib/marketing/whatsapp-remarketing.ts` ~87, `src/lib/invitaciones/recordatorio-no-abiertas.ts` ~120.
5. [ALTO] OAuth de Google: `src/app/api/google/oauth/start/route.ts` ~8-18, `callback/route.ts` ~14-47, `src/app/actions/google-workspace.ts` ~87-95: conectar la cuenta corporativa (`?kind=company`) y `revisarAgendaDeAK`/`limpiarAgendaDeAK` (~626, ~693, borran eventos) piden sólo `requireAppSession`, no ADMINISTRACION. El `state` es base64 sin firma.
6. [ALTO] HTML sin escapar en mails (`src/app/actions/google-workspace.ts` ~532-538, `src/lib/google-workspace.ts` ~564-578, `src/app/actions/google-workspace-extended.ts` ~653-661) y `${result.botResponse}` crudo dentro del XML de Twilio (`webhook/route.ts` ~205): un `&` rompe el XML.
7. [ALTO] `src/lib/presencia-digital/publicador.ts` ~184-190 (y ~425, 452, 474, 496): después de esperar a las redes, `writeData(POSTS_FILE, posts)` con la lista leída antes, pisando lo que se guardó mientras tanto.
8. [ALTO] `src/lib/presencia-digital/metricas-historicas.ts` ~130-142: sin campañas inyecta `'general-meta'` con `spend: ... || 4500`, `impressions: 12400`, `clicks: 340`. `src/app/actions/presencia-digital.ts` ~128: Google `isConnected: true` fijo.
9. [MEDIO] `src/lib/presencia-digital/revision-diaria.ts` ~80-104: `registrarConsumoIA('revision-diaria')` y `aiUsed = true` sin llamar a Gemini.
10. [MEDIO] `src/lib/blog-ai-generator.ts` ~129-248: no mira `hayPresupuestoParaIA()` ni registra consumo; crea post de Instagram `status: 'Programado'` sin aprobación con ruta relativa `/media/catalogo-servicios/...`.
11. [MEDIO] `src/app/actions/social-media.ts` ~103-112 `saveSocialPost` guarda la imagen en disco local (`/api/social-media-assets/...`), Meta la rechaza; `src/lib/social-media/meta-publisher.ts` ~161 arma `instagram.com/p/${mediaId}/` con el id numérico.
12. [MEDIO] Sincronizadores: `saveSocialCredentials()` guarda `connection.accessToken`, pero `meta-history-backfill.ts` ~154-172 y `comments-backfill.ts` ~117-129 leen `pageAccessToken`; `other-public-history-backfill.ts` ~228-411 sólo `process.env`. `hideCommentInternal`/`restoreHiddenCommentInternal` (~580-630) marcan éxito aunque Meta falle.
13. [MEDIO] `publicador.ts` ~674 `calcularProximaFechaMejorHorario` hace `(hora + 3) % 24` sin sumar un día (21-23 h quedan 24 h antes). `src/lib/asistente/clima-de-las-fiestas.ts` ~86-137 `new Date(rawFecha)` con fecha suelta: la fiesta de hoy queda sin alerta.
14. [MEDIO] `src/ai/genkit.ts` ~19-25 y `settings.ts` ~645 prueban primero `gemini-3.8-flash` y `gemini-3.6-flash` (404). `src/lib/presencia-digital/google-analytics.ts` ~118-138 suma `activeUsers` desglosado por fuente y página: multiplica visitantes.

## Bloque 2: Roles internos, permisos, contabilidad

15. [CRÍTICO] `src/app/actions/simple-auth.ts` ~909-915 `loginWithGoogleIdToken` crea la sesión sin `perfil`; `src/lib/auth/perfiles.ts` ~110-113 `perfilDe()` cae a `secretaria` para `role: 'user'`.
16. [CRÍTICO] `src/lib/auth/equipo-de-la-fiesta.ts` ~14-25 compara `p.empleadoId === user.userId` o `p.email === user.email`; usuarios `user_...`, empleados `emp_...`, `personalAsignado` no guarda email: nunca coincide.
17. [ALTO] `src/app/actions/fiesta/fiesta.actions.ts` ~98-103 `saveFiesta` de una fiesta nueva llama `requireFiestaWriteAccess(newFiesta.id)`; para operador, `quienEsElEquipo(null)` da false. También `presupuestos.ts` ~1058-1103.
18. [ALTO] `/admin/usuarios` (`src/app/(app)/admin/usuarios/page.tsx` ~399-427) separa "Perfil" y "Rol del sistema"; `auth.ts` ~778-911, `invoices.ts` ~583, `presupuestos.ts` ~597, `crm.ts` ~332 miran `user.role !== 'admin'` en vez de ADMINISTRACION.
19. [CRÍTICO] `fiesta.actions.ts` ~113-189: `getFiestaById`/`getFiestas` entregan la fiesta entera al equipo (sueldos `eventSalary`, `gestionCostos`); `CAMPOS_DE_PLATA_Y_CONTRATO` no protege `gestionCostos` ni `personalAsignado`; `costos.actions.ts` ~18-20 `updateGestionCostos` pide sólo ORGANIZACION.
20. [ALTO] `src/app/actions/comparativa-ganancias.ts` ~19-20 pide CONTABILIDAD en vez de GANANCIAS; `src/app/actions/roles.ts` ~11-16 `getRoles()` sólo sesión y entrega `sueldoPorEvento`.
21. [ALTO] `src/app/actions/fiesta/personal.actions.ts` ~20-21 `updatePersonal` y `src/app/actions/empleados.ts` ~207-215 `verificarAgendaEmpleado` exigen SUELDOS: la secretaria/operador no puede armar el equipo.
22. [ALTO] `presupuestos.ts` ~84-91 `sinCobros` deja `costoTotalEstimado`/`totalConDescuento`; `src/app/actions/dashboard.ts` ~185-198 le muestra al operador "Faltan $X".
23. [ALTO] `src/app/actions/fiesta/configuracion.actions.ts` ~35-39 `updateConfiguracion` llama `syncCustomerFromFiestaConfig` → `saveCustomer` (`customers.ts` ~55) que exige CRM o CONTABILIDAD.
24. [CRÍTICO] `src/app/actions/auth.ts` ~543-688: `getSecurityQuestions` exige sesión (no sirve en /login); `resetPasswordWithQuestions` sin límite de intentos; `changePassword` no verifica que el `userId` sea el de la sesión.
25. [ALTO] `src/app/(app)/presupuestos/[id]/ver/page.tsx` ~702 cae al número de AK si falta el del cliente y no agrega 598; ~685 `shouldShowClientBudgetActions = false` oculta ~996-1101.
26. [ALTO] `src/app/actions/fiesta/carga-operativa.actions.ts` ~71-88 `getCargaOperativaAuthorization` acepta cualquier sesión y no mira `accesoVencido`; `src/app/actions/personal-fiestas.ts` ~34-68 `marcarLlegadaPersonal` ficha con cualquier sesión sin GPS.
27. [MEDIO] `src/lib/auth/permisos-por-enlace.ts` ~13-45 contempla 'cocina' y 'checkin' por enlace, pero `public-paths.ts` ~105-122 bloquea `/fiestas/nueva/catering/hoja-de-cocina` y `/evento/actual/checkin` sin sesión.
28. [MEDIO] `src/app/actions/provider-portal.ts` ~40-85 `getProveedoresPortal` sólo sesión (expone tokens); `getProveedorByToken` no vence.
29. [MEDIO] `src/components/main-nav.tsx` ~82-155 y `src/components/app-shell.tsx` ~407-434 muestran todos los módulos sin filtrar por perfil.

## Bloque 3: Simuladores, portal del cliente, invitados y noche

30. [CRÍTICO] `src/app/simulador-ak/page.tsx` ~523-539 `handleMenuChoice` guarda el id del menú completo; `src/lib/budget/public-simulator-persistence.ts` ~237-243 lo rechaza y no crea prospecto.
31. [ALTO] `src/app/simulador-de-presupuesto/page.tsx` ~763-820 y ~944-983: platos preseleccionados (Paso 3) y del buscador (Paso 5) no entran a `formData.serviciosSeleccionados`: salen $0 y no se guardan.
32. [MEDIO] mismo archivo ~1291-1362 y ~1868-1895: "Servicios quitados" sólo muestra los del paquete Club Uruguay.
33. [MEDIO] `simulador-ak/page.tsx` ~866 manda `?adultos=&ninos=`, `simulador-de-presupuesto` ~288-290 lee `?guests=`; precio base Club Uruguay 20.000 en Paso 2 vs `precioBasePromo = 16900` fijo (~593-614 vs ~1773-1775).
34. [MEDIO] `src/components/budget/BudgetDocument.tsx` ~38-66, `ver/page.tsx` ~61-94, `estado-de-cuenta/page.tsx` ~33-44: fecha suelta un día antes.
35. [CRÍTICO] `src/app/actions/fiesta/decoracion.actions.ts` ~29-60 y ~142-148: `updateDecoracion` con `allowPortal` llama `syncDecoGastosToModule` (~47) que exige `requireAppSession`: el cliente falla con "No autorizado".
36. [ALTO] `src/lib/client-portal/public-fiesta.ts` ~66-193 `mapGuest` borra `checkedIn`, `checkInTimestamp`, `cancionesDJ`, `mensaje`; `mapFiestaToClientPortal` omite `videosParaInvitados` y `videoVida.photosUploaded`: llegadas en vivo 0, videos sorpresa no aparecen.
37. [ALTO] `src/app/actions/fiesta/portal.actions.ts` ~1094-1097 y ~1416-1419 comparan el PIN sólo con `clientPassword` (vacío → siempre falla); ~1466 fecha un día antes en la adenda.
38. [ALTO] `src/app/portal/page.tsx` ~519 cree que no hay clave porque `getFiestaById` limpia `accessKey`; `src/app/portal-cliente/[id]/page.tsx` ~167-223 guarda la clave inicial en sessionStorage antes del cambio obligatorio.
39. [MEDIO] `src/app/portal/mesas/page.tsx` ~103-121 y ~335-344: con `invitadosAdultos: 0` bloquea el alta y muestra NaN%.
40. [ALTO] `src/app/invitacion/[fiestaId]/invitado/[guestId]/page.tsx` ~605-613 manda `?guestId&token`, `rsvp/page.tsx` ~50-137 no los lee y busca por nombre exacto: duplica invitados.
41. [ALTO] `src/app/invitado/[fiestaId]/[invitadoId]/page.tsx` ~232-360: `updateGuestRsvp`/`updateGuestExperience`/`updateGuestDetails` llaman `updateFiestaData` sin `{ publicRsvp: true }`; `invitados.actions.ts` ~125-318 `addInvitado`/`deleteInvitado` devuelven `updatedFiesta` entera.
42. [ALTO] `src/app/evento/mi-mesa/[fiestaId]/page.tsx` ~136-141 enlaza `/evento/hub/${fiestaId}` sin `guestId`/`token`; el hub lo rebota.
43. [ALTO] `src/app/evento/en-vivo/[fiestaId]/invitados/page.tsx` ~200-204 y ~578-587: con `guestId` bloquea el nombre vacío y la validación exige nombre.
44. [MEDIO] `src/app/evento/actual/mesa/page.tsx` ~38-48 busca al invitado en `getFiestaById()` (invitados vacíos al público); `invitacion-publica-client.tsx` ~659-764 `BackgroundMusicPlayer` con `new Audio("")`.
45. [BAJO] `src/app/post-fiesta/[fiestaId]/page.tsx` ~51-189 e `invitado/[guestId]/page.tsx` ~664-671: sin álbum cargado, los botones van a `https://wfolio.com/my/disk`.
