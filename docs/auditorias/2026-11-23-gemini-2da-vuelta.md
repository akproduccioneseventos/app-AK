# Auditoría profunda de Gemini — 2da vuelta (23/11/2026)

Base: rama `gemini/ordenes-331-332` (`171a3cccf`). 8 auditores económicos en paralelo. 37 críticos, 48 medios, 14 bajos.
Lista de trabajo de la orden 336. Las rutas y líneas son las del informe; confirmar cada una antes de arreglar.

## A. Base de datos, concurrencia, respaldos y `functions/`
Críticos:
1. `readData` devuelve lista vacía sin marca de versión si la lectura de Firestore falla o tarda 3,5 s; un `writeData` con un
   elemento nuevo hace que `decidirGuardado` marque para borrar todo lo demás. `src/lib/data-service.ts` ~190-221,
   `src/lib/marca-de-lectura.ts` ~124-147.
2. `deleteInvoiceInner`: tras 1,5 s cae al camino sin transacción y `forceDeleteDocFromFirestore` puede borrar una factura recién
   cobrada. `src/app/actions/invoices.ts` ~635-725. **Confirmado por Claude.**
3. `saveFiesta` pisa el documento entero con la foto de la pantalla (RSVP o pedidos de barra simultáneos se pierden);
   `preserveFiestaSecrets` lee fuera de la transacción. `fiesta.actions.ts` ~348-446, `src/lib/fiesta/actualizar-fiesta.ts` ~51-76.
4. `syncToFirestore` cae a lotes sueltos de 450 sin transacción y puede dejar la colección a medias. `src/lib/firebase-sync.ts` ~309-426.
Medios y bajos: candados sólo en memoria con 4 instancias (presupuestos ~408-489, invoices ~214-240, crm-leads, cupones);
caché eterna de insumos y menús (`src/lib/insumos/leer-insumos.ts` ~15-38, `menus-catering.ts` ~28-33); `deleteFiesta` deja el
JSON local y una fiesta borrada "resucita" (`fiesta.actions.ts` ~580-606, ~1324-1348); `deleteFromStorage` no entiende las URL
`firebasestorage.googleapis.com/v0/b/.../o/...` (`src/lib/firebase/storage.ts` ~130-160); `/api/backup/upload` sin tope de
tamaño, `.zip` que salta la validación, sin validar forma ni deshacer (`route.ts` ~56-125); reanudar un ajuste de precios
`ambos` choca consigo mismo (`price-adjustments.ts` ~124-165); `functions/src/index.ts` ~13-90: fetch sin tiempo límite y
errores 4xx/5xx registrados como info.

## B. Seguridad (las `/api/**` y las acciones)
Críticos:
1. `getEntretenimientoFiesta` con sólo sesión devuelve la fiesta con `LECTURA_COMPLETA` (claves, sueldos, pagos, tokens).
   `entretenimiento.actions.ts` ~61-75. **Confirmado por Claude.**
2. Transmisión en vivo sin autenticar: `getActiveLiveStreamForScreen`, `submitScreenLiveStreamAnswer`,
   `pushLiveStreamIceCandidate`. `src/app/actions/social-live-stream.ts` ~136-282. **Confirmado por Claude.**
3. `updateListaDeCargaOperativa` sólo mira `verifySession().success`. `carga-operativa.actions.ts` ~294-335.
4. `saveSocialPost`: el `id` sin sanear va a `path.join` + `fs.writeFile`. `social-media.ts` ~117-141.
5. `deleteAllVideoVidaPhotos`, `deleteBuzonMessage` y las descargas ZIP (`/api/buzon/.../download`,
   `/api/fiestas/.../download-recuerdos`, `/api/social-gallery/.../download`, `/api/video-vida-photos/.../download`) sólo piden
   sesión. `video-vida.actions.ts` ~254-275, `buzon.ts` ~284-314.
6. El portal del cliente puede cambiar `modulosContratados`, `configuracion` (`fechaEvento`, `invitadosEstimados`) y
   `clientPortalSettings`: `CAMPOS_DEL_EQUIPO` no los protege. `fiesta.actions.ts` ~330-338, ~501-507.
7. El auditor pasa: firma digital (`documentos.actions.ts` ~220-230, `src/lib/security/portal-session.ts` ~61-66); redes
   (`comentarios-redes.ts` ~39-175 sin `exigirQueNoSalgaAfuera()`); clave maestra (`simple-auth.ts` ~527-616).
Medios y bajos: más de 15 acciones con sólo `requireAppSession()` (`ejecutarAccionSecretario`, `syncReunionToGoogleWorkspace`,
`agenda.ts`, `galeria.ts`, `settings.ts` con cuentas bancarias, `getDedications`, `getClientGuestbookMessages`,
`marketing-ads.ts`, `asistente-proactivo.actions.ts`, `notifications.ts`, `mission-control.ts`, `verifyAccesoPersonalToken`);
`roles.ts` ~17-45 devuelve `costoAportesCalculado` y `porcentajeAportesPatronales` (se deduce el sueldo);
`initializePortalSession` sin límite de intentos ni comparación en tiempo constante (`portal.actions.ts` ~237-257); la clave
maestra acepta administradores con `activo: false` (`simple-auth.ts` ~469-484); HTML sin escapar en correos
(`google-workspace.ts`, `google-workspace-extended.ts`); `chequearAvisoAuditor14Dias` sin sesión (`auth.ts` ~1455-1489).

## C. Plata
Críticos:
1. `changeEventDate` pasa la fiesta al año siguiente con `ajusteAnualActivo: false` (se pierde el 15%) y el descuento se aplica
   también a las multas `multa_cambio_fecha_*`. `portal.actions.ts` ~1936-1953, `src/lib/budget/total-tras-cancelar.ts` ~15-17.
2. Un presupuesto `Facturado` se edita o se le borran pagos sin tocar su factura. `presupuestos.ts` ~622-665, ~1042-1058.
3. Simulador paso 3: los platos por defecto no suman al total ni al PDF. `simulador-de-presupuesto/page.tsx` ~1052-1064.
Medios y bajos: `/presupuestos/[id]/ver` calcula el ajuste desde `timestamp`, ignora `totalConDescuento` y valora regalos al
costo (`ver/page.tsx` ~249-305); cupones: guarda el porcentaje en `montoPresupuesto` (`crear/page.tsx` ~516-526) y el servidor
no revalida `montoMinimo` (`cupones.ts` ~263); el reporte de resultados y la rentabilidad usan fórmulas distintas
(`reportes.ts` ~252-339); Club Uruguay distinto en simulador y Sofía desde 2028 (`simulador-de-presupuesto/page.tsx` ~690-694);
pendientes de la orden 333: botones del paso 6, `avisoCrm`/`avisoDeLaSena`, `getNombreMes()`, `?fecha=` corrida un día y
tramos de Activos Fijos.

## D. Planificador, catering, compras y personal
Críticos:
1. `TabHostShell`: con `tab` y `subtab` en la dirección, otro subtab deja `subtab` pegado; "Imprimir / PDF" en Itinerario, Música
   o Decoración lleva a otra solapa. `src/components/ui/tab-host-shell.tsx` ~28-45, `PlanificadorSolapasShell.tsx` ~25-52.
   (Es el bloque 1 de la orden 335.)
2. Cambiar de solapa cancela el autoguardado pendiente sin guardar. `src/hooks/use-auto-save.ts` ~149-155.
3. Hoja de Cocina lee `menuData.secciones` (no existe; los platos están en `menuData.items`).
   `src/components/panels/catering--hoja-de-cocina.tsx` ~68-84.
4. Lista de Compras revienta con un plato sin `ingredients` y con `invitadosAdultos: 0` suma los niños como adultos.
   `src/components/panels/catering--lista-compras.tsx` ~126, ~163-168.
5. Recibos: con dos roles del mismo empleado se pisan los dos sueldos (busca sólo por `empleadoId`).
   `src/components/panels/personal--recibos.tsx` ~361-372.
Medios: "Enlace Utileros" lleva a una página que no existe (`fiesta--en-vivo.tsx` ~175-178); unidades `gr`, `grs`, `mililitros`
y `kg→g` mal convertidas, sin aviso de peso contra volumen (`menus-catering.ts` ~60-79); conteos por fila y no por persona en
celíacos (`fiesta--en-vivo.tsx`, `alergias.tsx`, `hoja-de-cocina.ts`); 5 tarjetas viejas en `/fiestas/nueva` (orden 335 bloque 2);
conflictos de stock y recibos que incluyen fiestas de muestra o suspendidas; 5 vistas del cronograma sin
`ordenarPorHoraDelEvento`.

## E. Entrada fácil, portales, invitaciones y recepción
Críticos:
1. Cinco solapas del portal (Invitados, Menú, Música, Fotos y video, Muro) miran `sessionStorage` y no la sesión: quien entra por
   `/entrar` rebota. `portal--menu.tsx` ~30-31, `portal--confirmar-invitados.tsx` ~55-60, `portal--muro-social.tsx` ~180-185.
2. Cliente con varias fiestas: `entrarAlPortalPorTelefono` pisa la sesión en un bucle y queda la de la última.
   `portal.actions.ts` ~215-235.
3. `/portal?fiestaId=` recorta `clientPortalSettings` antes del ingreso y dice "portal deshabilitado". `portal/page.tsx` ~320-324.
Medios y bajos: `/entrar` manda a `/mi-dia` con una sesión vencida sin validarla (`entrar/page.tsx` ~10-18); el teléfono no se
normaliza (`+598`, `099`, `99`) en `entrarAlPortalPorTelefono` (~145-200); `entrarComoInvitado` no excluye fiestas de muestra,
elige el primero ante nombres o celulares repetidos, y con el wifi del salón 20 intentos bloquean la puerta 15 minutos
(`entrar-como-invitado.ts` ~86-248); enlaces sin `withGuestAccess` (recap por WhatsApp en `evento/social/[fiestaId]/page.tsx`
~1390-1403, "Cancelar mi confirmación", "Entrar al muro social", "Buscá tu mesa", "Muro social", "Entrar a la fiesta en vivo");
sin botones a firma, decoración y moodboard en los portales; el escáner `/evento/accesos/[fiestaId]` rechaza los QR sin sesión
de equipo (~99-109); comprobantes `.txt` en disco efímero; `/portal/mesas` divide por cero sin niños.

## F. Estaciones, equipos, sin conexión y app instalable
Críticos:
1. `/evento/inicio` usa `getFiestas(false)` (pide sesión de equipo) y arma enlaces sin `?access=`. `kiosk-setup.tsx` ~96-124.
2. Barra: al tocar Grabar, la limpieza del efecto (`stopCamera` con `[isRecording]`) corta cámara y micrófono.
   `evento/barra/[fiestaId]/page.tsx` ~446-457.
3. Buzón sin señal: se manda `timeCapsuleYears` y el servidor lee `isTimeCapsule`, `unlockYears` y `durationSeconds`.
   `src/lib/offline/offline-sync-manager.ts` ~130-140, `buzon.ts` ~221-233.
4. Espejo Mágico: el consentimiento del invitado anterior queda aceptado (`retake()`), y sin `?kiosk=1` no hay cómo cambiar de
   fiesta. `espejo-magico/[fiestaId]/page.tsx` ~1077-1106.
5. Impresión móvil marca impresa antes de imprimir y no espera la imagen. `impresion/[fiestaId]/page.tsx` ~110-122, ~416-420.
Medios y bajos: IndexedDB sin cerrar y lectura de todo cada 3 s en `SyncStatusIndicator` (`offline-db.ts` ~173-269);
`AudioContext` sin cerrar y `URL.createObjectURL` sin revocar (Fotocabina, Espejo, Touchpix, Muro, 360, Vogue, Video de Vida con
`?t=` sobre una `blob:`); cola sin candado que se traga `QuotaExceededError`; tiempo fijo de 1.000 ms en la cara
(`extractor-facial.ts` ~88-102); fotocabina con fotos por tira fijas; música del álbum que sigue al volver; caras agrupadas sin
dibujar; Touchpix comparte el `?access=` del operador; el modo sin conexión guarda rutas internas.

## G. IA, multiagente, asistentes y tope de gasto
Críticos:
1. `applyFaceSwap` gasta imágenes pagas sin tope, sin registro y sin límite. `touchpix-ai.ts` ~556-665.
2. Multiagente (`sendMultiAgentMessage` → `runMultiAgent`) sin tope ni registro. `multiagent.ts` ~20-66, `multiagent-flow.ts` ~519-590.
3. El operador ve totales de presupuestos por el Asistente (`assistant.ts` ~597) y `leer_presupuesto` del Encargado
   (`encargado.ts` ~180-192) sin `PERMISOS.CONTABILIDAD`.
4. `generate_contract` busca con `.includes` y puede pisar el contrato de otro cliente. `assistant.ts` ~1420-1445,
   `src/lib/assistant/tools/executors.ts` ~603-641.
Medios y bajos: seis flujos más sin tope o sin registro (perfil DJ, itinerario IA, asistente clásico, agente de marketing,
`extractContractDataAction`, `analyze-codebase-flow.ts` público); modelos de marketing y comerciales fuera del tope diario;
tres llamadas sin modelo de respaldo ante 429 (`assistant-flow.ts`, `whatsapp-media.ts`, `voz-en-vivo/cliente/route.ts`);
`chatWithGuestBot` recibe la fiesta entera del navegador (`salon-ia.actions.ts` ~103-189) y `chatConAsistenteInvitado` sin token
ni largo máximo (`asistente-virtual.ts` ~426-510); decisiones del álbum con URL de Storage como `fileUri` y moderación que
aprueba con `!== false` (`decisiones.ts` ~69-77, `social-gallery.ts` ~319-325, ~1574); `executeRegistrarPago` con `.includes`
y sin confirmación; precios negativos o fuera de catálogo en el respaldo de `assistant.ts`.

## H. Redes, avisos de Meta y WhatsApp, despertadores, Google y AK Editor
Críticos:
1. Borradores de guion de video y el anuncio de Play Store sin imagen pasan a "Programado", fallan y traban la cola.
   `autogenerador-semanal.ts` ~58-147, `publicador.ts` ~168-178, ~739-805.
2. Aviso de Meta: no llama a `procesarComentarioRedes` en vivo, guarda ids sin `fb_`/`ig_` (duplica), no pasa `esCliente` y
   anota la respuesta antes de saber si salió. `api/meta/webhook/route.ts` ~294-380.
3. Aviso de WhatsApp: pasados 1.200 ms finge `interruptor_apagado` y no guarda el prospecto; `sincronizarEstadoEnCrmLead`
   reescribe la lista sin transacción. `api/whatsapp/webhook/route.ts` ~238-300.
4. Recordatorios a invitados para fiestas suspendidas, archivadas y de muestra. `recordatorio-invitados.ts` ~12-28,
   `recordatorio-no-abiertas.ts` ~164-186.
5. AK Editor: `/api/wfolio/login` llama a `wfolio.abrir_navegador_para_login`, que no existe. `herramientas/ak-editor/app.py` ~1018-1021.
6. AK Editor: subida a Wfolio abre un navegador por foto, no crea la carpeta del álbum, espera fija de 2 s, archivos RAW a un
   `<img>`, y saltea lo ya subido al reanudar. `wfolio.py` ~685-735, ~1746-2019.
Medios: el publicador agenda 24 h antes entre las 21 y las 23 hs de Uruguay (`publicador.ts` ~924-928); despertadores
`asistente-proactivo` y `metricas-de-redes` con días en UTC, "OK" con tareas fallidas y la competencia todos los días sin
guardar; `perseguidor_presupuestos` duplica mensajes cada día (`motor-agentes.ts` ~210-287); `sitemap.ts` publica borradores;
`las-direcciones-viejas-siguen-andando.test.ts` da siempre verde; AK Editor: `fotos.py` ~1332 con `cv2.imread`, servidor de un
solo hilo, ids repetidos en `exportador_filmora.py`, boda en pantalla partida nunca usada.

---

## Falsos positivos y ya resueltos verificados al ejecutar la Orden 336 (23/11/2026)
- **Candado en memoria de `invoices.ts` (`invoicesMutex`):** no permite pisar pagos entre instancias porque `saveInvoiceInner`, `addPaymentToInvoice` y `markInvoiceEmailSent` escriben dentro de transacciones de Firestore y `decidirGuardado`.
- **Seguridad de `saveSocialPost`:** ya exigía `requirePermiso(PERMISOS.CRM)`; el defecto real confirmado y corregido era el `id` sin sanear hacia `path.join`/`fs.writeFile`.
- **`TabHostShell` / 5 tarjetas de impresos / recap WhatsApp con `withGuestAccess` / celíacos en `invitados.tsx` y `hoja-de-cocina.ts`:** ya resueltos previamente (Orden 335 / previas), no se re-tocaron.
- **Buzón `AudioContext` y `revokeObjectURL` (`src/app/evento/buzon/[fiestaId]/page.tsx`):** ya cerraba `audioCtxRef` al desmontar y revocaba sus `blob:` URLs.
- **`chatWithGuestBot`:** puerta pública intencional con rate limit (registrada en `auditoria-puertas-abiertas.test.ts`); se eliminó la lectura de la fiesta enviada desde el navegador.
- **`syncToFirestore` (A.4):** sigue paginando si supera el límite de 450 operaciones de una transacción de Firestore, pero dejó de caer a lotes sueltos sin transacción ante errores reales (sin modificar `readFromFirestore` ni `listCollectionFromFirestore`, tratados aparte en PR #1465).
