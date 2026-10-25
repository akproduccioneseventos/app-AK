# PARA GEMINI - Orden 194: lo que se confirmó de tu auditoría del 20 de octubre

**Una sola propuesta con todos los bloques, y la misma propuesta que las órdenes 188 a 193.** Si un
bloque se traba, entregá el resto igual y avisá cuál faltó. Antes de decir "terminé", pasá
`docs/ANTES-DE-ENTREGAR.md` entero (sumamos la 55 y la 56).

**Arrancá de la rama `claude/app-debug-stabilize-m70e6z`, no de `main`.** Los números de línea son
aproximados (`~`): el código se movió desde tu informe.

## Qué se confirmó

Tu informe está en `docs/auditorias/auditoria-mundial-gemini-2026-10-20.md`. Lo revisó Claude uno por
uno contra el código:

- **Ciertos: 36 de 45.**
- **Ya pedidos en otra orden:** el 19 y el 22 (orden 183) y el 24(c) (`changePassword`, orden 193).
- **Descartados**, no los toques:
  - 16: `src/lib/auth/equipo-de-la-fiesta.ts` ya busca el empleado por email.
  - 27: `src/lib/auth/permisos-por-enlace.ts` no nombra cocina ni recepción.
  - 32: "Servicios retirados" no filtra por el Club Uruguay.
  - 34: el presupuesto siempre guarda la fecha con hora.
  - 41: esas acciones no tienen quien las llame; la confirmación usa `submitPublicRsvp`.
  - 44: el recorte deja pasar id y nombre del invitado, y el audio vacío no se monta.
  - 7: el guardado ya compara versiones (`ChoqueAlGuardar`).

## Bloque 1 — URGENTE: el despertador no llega a la app (hallazgo 1)

- **El problema:** `functions/src/index.ts` ~68 llama cada 15 minutos a `/api/cron-despachador` con
  `Authorization: Bearer CRON_SECRET`. `src/middleware.ts` ~46-51 manda a `/login` todo lo que no tiene
  cookie y no figura en `src/lib/auth/public-paths.ts`. Esa ruta no figura, así que **ninguna tarea
  automática corre si nadie abre la app**.
- **Agregá a `PUBLIC_EXACT_PATHS`:** `/api/cron-despachador` y `/api/despertar`.
- **Agregá a `PUBLIC_PATH_PREFIXES`:** `/api/cron`, para las once rutas de `src/app/api/cron/*`.
- **Antes, comprobá ruta por ruta** que cada una rechace con 401 si falta
  `CRON_SECRET`/`TAREAS_SECRET`. La que no lo haga, **se lo agregás**, y si no podés, no la hacés
  pública.
- **Prueba nueva, `src/__tests__/el-despertador-pasa-la-puerta.test.ts`.** Que recorra
  `src/app/api/**/route.ts` y, por cada ruta que nombra `CRON_SECRET`, `TAREAS_SECRET` o
  `X-Hub-Signature`, compruebe:
  - que `isPublicPath(ruta)` dé verdadero;
  - que el manejador sin clave devuelva 401.

  Rompela a propósito sacando una ruta de la lista y fijate que se ponga roja.

## Bloque 2 — permisos y quién entra (hallazgos 2, 5, 15, 18, 20, 21, 23, 24, 26, 28)

- **15. El ingreso con Google arma la sesión sin `perfil`.**
  - Dónde: `src/app/actions/simple-auth.ts` ~910.
  - Que guarde `perfil` igual que `src/app/actions/auth.ts` ~502-508.
  - Que el rol por omisión deje de ser `'admin'`: cuenta guardada sin rol → `perfilDesdeRolViejo(undefined)`.
  - La cuenta nueva sigue siendo `dueno`, como hoy (~895).
- **18. Permisos decididos por el rol y no por el perfil.**
  - `role !== 'admin'` → `puede(sesion.user, PERMISOS.X)` con el permiso del área.
  - Dónde: `src/app/actions/auth.ts` ~778, 820, 869, 892, 911; `invoices.ts` ~583, 628;
    `presupuestos.ts` ~597, 1337; `crm.ts` ~332, 371.
  - Borrar facturas y presupuestos: `CONTABILIDAD`.
  - Usuarios: `ADMINISTRACION`.
- **24(a)(b). Preguntas de seguridad** (`src/app/actions/auth.ts`).
  - `getSecurityQuestions` (~543) sin `requireAppSession`, para que sirva en `/login`. Devuelve **sólo los
    textos de las preguntas** y con `enforcePublicRateLimit` (como en ~281).
  - `resetPasswordWithQuestions` (~590) con `enforcePublicRateLimit` por email y por IP.
  - Si la pantalla de ingreso no la usa, engancharla en "olvidé mi clave".
- **2. Eco de WhatsApp.**
  - `src/app/api/whatsapp/webhook/route.ts` ~163 tiene que pasarle a `atenderAlEquipo`: `isEcho`
    (calculado en ~99), `to` (`value.metadata.display_phone_number`), `type`, `messageId` y el id del
    audio o la foto.
  - Así se prende la protección de `src/lib/asistente/por-whatsapp.ts` ~151-158. Un mensaje del dueño a un
    cliente **nunca** se lee como orden.
  - **No toques `correspondeContestarSolo`.**
- **5. Agenda de la empresa.**
  - `revisarAgendaDeAK` y `limpiarAgendaDeAK` (`src/app/actions/google-workspace.ts` ~625 y ~703) piden
    `ADMINISTRACION`.
  - El `state` de `src/lib/google-workspace.ts` ~69-84 va firmado con `AK_SESSION_SECRET` (HMAC) y se
    rechaza si la firma no coincide.
- **20. Ganancias y sueldos.**
  - `src/app/actions/comparativa-ganancias.ts` ~19 pide `GANANCIAS`, no `CONTABILIDAD`.
  - `getRoles` (`src/app/actions/roles.ts` ~9) saca `sueldoPorEvento` a quien no tiene `SUELDOS`.
- **21. Asignar personal no es tocar sueldos.**
  - `updatePersonal` (`src/app/actions/fiesta/personal.actions.ts` ~20) acepta `ORGANIZACION`.
  - Si quien guarda no tiene `SUELDOS`, el servidor **conserva el `eventSalary` guardado** de cada persona
    (y pone 0 sólo a las nuevas). Nunca lo toma del navegador.
  - `verificarAgendaEmpleado` (`src/app/actions/empleados.ts` ~214) pide `ORGANIZACION`.
- **23. Configuración que dice "falló" habiendo guardado.** En
  `src/app/actions/fiesta/configuracion.actions.ts` ~35, si quien guarda no tiene `CRM` ni
  `CONTABILIDAD`, no se llama a `syncCustomerFromFiestaConfig` y no se muestra error.
- **26. Enlaces del personal.**
  - `src/app/actions/fiesta/carga-operativa.actions.ts` ~75: "cualquier sesión" → `puede(..., ORGANIZACION)`.
  - `getAccesoById` (`accesos-personal.ts` ~58) rechaza el acceso vencido.
  - `marcarLlegadaPersonal` (`personal-fiestas.ts` ~38) se marca con el enlace vigente del propio
    empleado, no con cualquier sesión. Ya figura en `YA-RESUELTO.md` ~1132 como pendiente: borrá esa nota
    al arreglarlo.
- **28. Portal del proveedor.**
  - `getProveedoresPortal` (`src/app/actions/provider-portal.ts` ~40) pide `ORGANIZACION` o
    `CONTABILIDAD` y **no devuelve el `token`** salvo a esos perfiles.
  - Agregá `venceEl` a cada acceso: por omisión, 7 días después de la fiesta.
  - `getProveedorByToken` (~76) rechaza el vencido.

## Bloque 3 — plata y marketing que dicen lo que no pasó (hallazgos 3, 4, 6, 8–14)

- **3. Anuncios.**
  - `src/lib/agentes/motor-agentes.ts` ~389-393 y ~414: sin gasto real, el presupuesto diario es
    `null`, **no 500**. Además se pone `verificado: false`, así el tope frena
    (`tope-de-gasto-publicidad.ts` ~165).
  - `src/lib/marketing/meta-ads-acciones.ts` ~57: sin `META_ADS_ACCESS_TOKEN` devuelve
    `success: false, error: 'Meta Ads no está conectado'`. **Nunca `simulated` con éxito.**
- **4. Envíos de WhatsApp.** Estos cuatro archivos leen la conexión con `getWhatsAppConfig`
  (`src/app/actions/whatsapp.ts` ~45), no sólo `process.env`:
  - `por-whatsapp.ts` ~335;
  - `avisar-al-duenio.ts` ~258;
  - `whatsapp-remarketing.ts` ~87;
  - `recordatorio-no-abiertas.ts` ~120.
- **6. Texto sin escapar.**
  - El TwiML de `src/app/api/whatsapp/webhook/route.ts` ~205 escapa `& < >`.
  - Los mails de `src/app/actions/google-workspace.ts` ~532 y `src/lib/google-workspace.ts` ~564 usan
    `escapeHtml`, como `google-workspace-extended.ts`.
- **8. Métricas inventadas.**
  - `src/lib/presencia-digital/metricas-historicas.ts` ~130-141: sin campañas, **no se inventa**
    `general-meta` con 4500/12400/340.
  - `src/app/actions/presencia-digital.ts` ~128: Google `isConnected` sale de la conexión real.
- **9. Consumo de IA sin IA.** `revision-diaria.ts` ~80-87 no registra consumo de IA si no llama a la IA.
  Si la orden 192 reemplaza ese archivo, aplicá la regla en el nuevo.
- **10. Blog.** `src/lib/blog-ai-generator.ts` pasa por `hayPresupuestoParaIA()` y
  `registrarConsumoIA()`.
- **11. Fotos a Instagram.** `src/app/actions/social-media.ts` ~103-112: el `mediaUrl` que se manda a
  Meta es una dirección **completa y pública**: el dominio más `/api/social-media-assets/...`, y esa
  ruta tiene que figurar en `public-paths.ts`. Si no hay dominio configurado, el posteo queda "Con
  error", no "publicado".
- **12. Comentarios y su conexión.**
  - `comments-backfill.ts` ~605-630 sólo marca `isAutoHidden: true` si `hideCommentOnMeta` devolvió
    verdadero.
  - `meta-history-backfill.ts` ~159 y `comments-backfill.ts` ~122 prueban `pageAccessToken` y después
    `accessToken`, como `social-connections.ts` ~306.
- **13. Horas.**
  - `src/lib/presencia-digital/publicador.ts` ~674: la hora de Uruguay pasa a Greenwich con fecha y hora
    juntas (de 21 a 23 h cae al día siguiente), no con `(hora + 3) % 24`.
  - `clima-de-las-fiestas.ts` ~132 compara el día de Uruguay, con el ayudante que pide la orden 193,
    bloque 3.
- **14. Visitantes.** `src/lib/presencia-digital/google-analytics.ts` ~124-183: el total de visitantes
  sale de una consulta **sin dimensiones**, no de sumar filas.

## Bloque 4 — lo que ve el cliente y el invitado (hallazgos 17, 25, 29–31, 33, 35–40, 42, 43, 45)

- **35. Decoración desde el portal.** `updateDecoracion` (`src/app/actions/fiesta/decoracion.actions.ts`
  ~47) no llama a la acción exportada.
  - Mové el cuerpo de `syncDecoGastosToModule` a una función interna en un archivo con
    `import 'server-only'` (pregunta 54).
  - La acción exportada la sigue envolviendo con sus permisos.
  - `updateDecoracion` llama a la interna. El cliente ve "guardado" cuando se guardó.
- **36. Portal del cliente sin llegadas, fotos ni videos.** `src/lib/client-portal/public-fiesta.ts`:
  - `mapGuest` (~66) suma `checkedIn`;
  - `videoVida` (~157) suma `photosUploaded`;
  - suma `videosParaInvitados`.
  - **Nada de teléfonos, credenciales ni plata.**
- **38. Portal.**
  - `src/app/portal/page.tsx` ~519 no decide "no tiene clave" con `getFiestaById`, que borra
    `accessKey` a propósito. Usá un dato booleano `tieneClave`.
  - `src/app/portal-cliente/[id]/page.tsx` ~218 no guarda en `sessionStorage` la clave inicial antes del
    cambio obligatorio; sí la nueva (~278).
- **39. Mesas del portal.** `src/app/portal/mesas/page.tsx` ~103-121 y ~335-344:
  - con 0 contratados la barra muestra 0%, no `NaN`;
  - el cartel dice "No hay cupos de niños contratados: pedile a AK que los agregue".
- **37. Adenda.** `src/app/actions/fiesta/portal.actions.ts` ~1466: la fecha con el ayudante del día de
  Uruguay, como el recibo (`YA-RESUELTO.md` ~2261).
- **30, 31 y 33. Simuladores.**
  - `src/app/simulador-ak/page.tsx` ~534 guarda el id de los **ítems** del menú elegido, no el id del
    menú. Comprobalo contra `buildAuthoritativeSimulatorServices` (`src/lib/simulator/catalog.ts` ~66).
  - `src/app/simulador-de-presupuesto/page.tsx` ~945 y ~763: cada plato elegido o preseleccionado escribe
    en `formData.serviciosSeleccionados`, como `handleGastronomicSelectionChange` (~558).
  - El enlace de ~866 de `simulador-ak` manda `guests=` con la suma, o el otro lee `adultos` y `ninos`
    (~288). **No toques precios, descuentos ni el reloj.**
- **40, 42 y 43. Enlaces del invitado.**
  - El enlace a confirmar (`src/app/invitacion/[fiestaId]/invitado/[guestId]/page.tsx` ~324-328) lleva
    `guestId` y `token`, y `rsvp/page.tsx` los lee y confirma a esa persona sin buscar por nombre.
  - "Mi mesa" (`src/app/evento/mi-mesa/[fiestaId]/page.tsx` ~136) pasa `guestId` y `token` al hub.
  - `src/app/evento/en-vivo/[fiestaId]/invitados/page.tsx` ~68: con `guestId`, `crmNombre` se llena con
    el nombre del invitado.
- **45. Álbum al disco de todos, otra vez.** `src/app/post-fiesta/[fiestaId]/page.tsx` ~51: sin
  `fiesta.galeriaUrl`, los botones (~79, 135, 153, 171, 189) **no aparecen**, igual que en
  `PostEventMemoryHub.tsx`. Ampliá `src/__tests__/album-profesional-no-manda-al-disco-de-todos.test.ts`
  para que recorra **todo `src/`**, no un archivo.
- **25.** `src/app/(app)/presupuestos/[id]/ver/page.tsx` ~702: sin teléfono del cliente, el botón no
  aparece. **Nunca** cae al número de AK.
- **17.** Crear una fiesta vacía (`fiesta.actions.ts` ~1209) con perfil operador no tira "No autorizado"
  si tiene `ORGANIZACION`.
- **29.** El menú (`src/components/main-nav.tsx` ~82) esconde lo que el perfil no puede abrir. Si la
  orden 182 rehace el menú, hacelo ahí.

## Bloque 5 — barrer la app con las preguntas nuevas

Claude sumó las preguntas **74 a 81** a `docs/COMO-AUDITAR.md`. Pasá cada una por **toda** la app con
la búsqueda que dice. Lo de plata y permisos que no esté en esta orden **listalo, no lo arregles**.

Además:

- **Corré `node scripts/formas-ya-arregladas.mjs`.** Por cada lugar que marca:
  - si es el mismo defecto que su prueba ya prohibió en otro archivo, arreglalo igual que allá;
  - si es inocente, dejalo y anotalo en tu informe.
- **Lo que el script ya marcó y Claude confirmó** (arreglalo; los otros nueve candidatos son inocentes):
  - `src/app/(app)/settings/feedback/page.tsx` ~267: el botón "Pedir Reseña Google" aparece sólo con
    nota 9 o 10. **Decisión del dueño: a todos por igual.** Sacá la condición `npsScore >= 9`.
  - `src/app/portal-cliente/[id]/confirmar-invitados/page.tsx` ~217: "check-in" cuenta invitaciones,
    no personas. Sumá adultos y niños de cada invitación, como hace la tarjeta de ~207.
  - `src/app/actions/social-media.ts` ~477-504: si falla la lectura de fotos, no digas "No se
    encontraron fotos aprobadas". Decí que no se pudieron leer.
  - Comparación de `new Date('AAAA-MM-DD')` contra `setHours(0,0,0,0)`: usá el día de Uruguay, con el
    ayudante de la orden 193, bloque 3. Va en:
    - `src/app/(app)/eventos/page.tsx` ~116;
    - `src/app/(app)/customers/page.tsx` ~137;
    - `src/lib/readiness-score.ts` ~10;
    - `src/lib/multiagent/diagnostics.ts` ~41.
- **Volvé a barrer las preguntas 3, 24 y 35.** El barrido de la mañana dijo "sin hallazgos" y tu
  auditoría encontró casos.

## Qué NO tocar

- `correspondeContestarSolo`.
- Los precios, el descuento, el reloj del simulador y los textos de venta.
- El QR y la confirmación pública.
- Lo que ya hacen las órdenes 188 a 193: si se cruza, manda la orden más nueva.

## Pruebas (que miren el resultado)

- `src/__tests__/el-despertador-pasa-la-puerta.test.ts` (bloque 1).
- `src/__tests__/auditoria-gemini-20-10-permisos.test.ts`:
  - con sesión de `personal` y de `operador`, cada acción del bloque 2 rechaza;
  - el ingreso con Google de una cuenta `operador` deja una sesión con `perfil: 'operador'`;
  - el eco del dueño a un cliente no ejecuta nada;
  - la sexta respuesta equivocada en las preguntas de seguridad se frena.
- `src/__tests__/auditoria-gemini-20-10-no-miente.test.ts`:
  - sin token de Meta, pausar devuelve `success: false`;
  - sin campañas, no hay `general-meta`;
  - sin IA, no se registra consumo.
- `src/__tests__/el-portal-ve-lo-que-muestra.test.ts`:
  - `mapGuest` trae `checkedIn` y no trae teléfono;
  - la decoración desde el portal devuelve `success: true` sin sesión del equipo.
- `tests/e2e/los-enlaces-del-invitado-llevan-quien-es.spec.ts`:
  - el enlace de confirmar y el de "mi mesa" llevan `guestId`;
  - post-fiesta sin `galeriaUrl` no muestra el botón del álbum.

```comprobar
usa: /api/cron-despachador en src/lib/auth/public-paths.ts
usa: perfilDesdeRolViejo en src/app/actions/simple-auth.ts
usa: messageId en src/app/api/whatsapp/webhook/route.ts
no-usa: wfolio.com/my/disk en src/app/post-fiesta/[fiestaId]/page.tsx
no-usa: || 500 en src/lib/agentes/motor-agentes.ts
usa: checkedIn en src/lib/client-portal/public-fiesta.ts
usa: GANANCIAS en src/app/actions/comparativa-ganancias.ts
archivo: scripts/formas-ya-arregladas.mjs
prueba: src/__tests__/el-despertador-pasa-la-puerta.test.ts
prueba: src/__tests__/auditoria-gemini-20-10-permisos.test.ts
prueba: src/__tests__/auditoria-gemini-20-10-no-miente.test.ts
prueba: src/__tests__/el-portal-ve-lo-que-muestra.test.ts
prueba: tests/e2e/los-enlaces-del-invitado-llevan-quien-es.spec.ts
no-usa: npsScore >= 9 && en src/app/(app)/settings/feedback/page.tsx
```
