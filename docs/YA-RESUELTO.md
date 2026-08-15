# Ya resuelto — NO lo vuelvas a reportar ni a "arreglar"

**Leé esto ANTES de auditar cualquier cosa.** Vale para Codex, Gemini, Claude y
cualquier ayudante que salga a buscar problemas.

En este proyecto trabajan varias IA en paralelo, en cuentas distintas. Sin esta
lista pasa lo siguiente: una auditoría nueva encuentra "un problema", lo reporta,
alguien lo arregla otra vez, y a veces **deshace** el arreglo bueno con uno peor.
Ya pasó: dos propuestas protegieron el mismo archivo de maneras distintas y al
fusionarse dejaron la pantalla colgada para siempre.

**Regla: si algo de esta lista aparece en tu auditoría, es falso positivo.** Si
creés que igual está mal, no lo arregles: decilo y esperá respuesta.

Quien arregle algo nuevo, **lo agrega acá en la misma tanda**. Si no queda
anotado, la próxima auditoría lo va a volver a encontrar.

---

## Decisiones del dueño (no son errores, no se discuten)

- **Mejoras Tanda 1 — Que la fiesta venda la próxima (15 de agosto de 2026):**
  - **Fotocabina (`evento/fotocabina/[fiestaId]`):** Añadido renglón discreto al finalizar la tanda de fotos en la pantalla del invitado con enlace atribuido al simulador de presupuesto (`campaign: 'fotocabina'`, `refFiestaId`), sin tapar fotos ni botones y visible solo para invitados (no operadores).
  - **Galería interactiva y Muro Social (`evento/galeria` y `evento/social`):** Añadido enlace discreto con atribución al simulador de presupuesto (`campaign: 'galeria'` / `'muro_social'`). Ocultada la barra de contadores cuando `posts.length === 0` y añadido botón de llamado a la acción "Subí tu primera foto".
  - **Atracción de Clientes por Fiesta (`contabilidad/crm/atraccion-fiestas`):** Pantalla en el CRM y acción `getAtraccionFiestasReport` para agrupar prospectos, presupuestos y contratos ganados según el evento del que llegaron (`refFiestaId`), con filtro por año y estado vacío explicativo. Botón de acceso directo en el encabezado del CRM.
  - **Álbum Oficial Público (`evento/album/[fiestaId]` y `/album/[fiestaId]`):** Página pública del álbum con nombre del evento, fecha, grilla de fotos aprobadas en alta definición, modal lightbox a pantalla completa con descarga directa, botón "Compartir álbum" (copia al portapapeles/WhatsApp) y pie comercial discreto con atribución al simulador.

- **Mejoras Tanda 2 — Bloques F al K de la orden maestra (15 de agosto de 2026):**
  - **Bloque F — Ranking de la noche en pantalla gigante (`evento/muro-en-vivo/[fiestaId]`):** Diapositiva rotativa automática en el slideshow cada 6 publicaciones ("⭐ Momento Estelar: La foto más querida de la fiesta") destacando la publicación aprobada con más corazones y el marcador de mesas/grupos más participativos, sin perdedores ni nombres propios, solo festejo colectivo.
  - **Bloque G — Cápsula del tiempo en Buzón de Deseos (`evento/buzon/[fiestaId]` y `actions/buzon.ts`):** Opciones para marcar saludos como cápsula para abrir en 1, 3, 5, 10 o 15 años, con cálculo automático de fecha ISO futura (`unlockDate`), nota de destinatario y persistencia en Firestore.
  - **Bloque H — Pedidos de música para el DJ (`evento/dj/[fiestaId]`, `evento/social/[fiestaId]` y `actions/social-interactive.ts`):** Límite de 3 solicitudes por invitado con aviso claro y panel en vivo para el DJ con ranking ordenado por votos, estados ("Pendiente" / "Sonada") y aviso de control total del DJ.
  - **Bloque I — Pedido por proveedor listo para WhatsApp (`fiestas/nueva/catering/lista-compras`):** Botones "WhatsApp" y "Copiar" en cada tarjeta de proveedor que arman el mensaje formal y educado con datos del evento y lista de insumos/unidades sin tocar fórmulas ni cálculos.
  - **Bloque J — Fotos de fiesta convertidas en posteos (`actions/social-media.ts` y `empresa/redes-sociales`):** Server action `generateDraftPostsFromPartyPhotos` y diálogo en el planificador que generan 4 borradores con copy, etiquetas y fotos aprobadas en estado `Borrador` esperando aprobación (nunca publica automáticamente).
  - **Bloque K — El presupuesto que se explica solo (`lib/budget/budget-narrative.ts` y `components/budget/BudgetDocument.tsx`):** Resumen narrativo fiel y determinista arriba del desglose de ítems que describe los servicios contratados (gastronomía, bebidas, DJ, fotografía/cabina, salón, limpieza de Club Uruguay) sin inventar números ni precios.

- **Lo que le toca a Gemini, Claude no lo programa.** Claude escribe código sólo
  en plata, cobros, comida y permisos; el resto va a una orden en
  `docs/ordenes/`. Programarlo igual le cuesta el doble al dueño.
- **Propuestas grandes, no muchas chicas.** Cada fusión dispara un despliegue y
  se paga. Se junta la tanda entera en una sola propuesta. La documentación
  viaja con el código, nunca en una propuesta aparte. **Vale también para las
  órdenes que una IA le escribe a otra**: una orden de cinco bloques se entrega
  en una sola propuesta con los cinco, no en cinco. El dueño lo tuvo que repetir
  el 10 de agosto de 2026 porque la orden pedía lo contrario que la regla.

- **Reseñas de Google Automáticas:** Solo se envían a los que tienen NPS >= 9, y solo si el enlace está configurado en Ajustes. No se manda más de una vez.
- **Plan de la Noche del Equipo:** Los sueldos y `eventSalary` NO deben filtrarse en la vista `getAccesoPersonalPortalView` bajo ningún concepto. La hora de llegada es simplemente `fiesta.configuracion.horaInicio`.

- **Pantallas de la noche — Resiliencia ante cortes (15 de agosto de 2026):**
  - **Estación de Impresión (`impresion/[fiestaId]`):** Mantiene el estado de error de forma persistente con `hasError`, timestamp de desconexión y `<ReconnectingIndicator />`. No oculta el fallo tras 2 segundos para que el operador no imprima desinformado.
  - **Presentación LED (`presentacion-led`):** Auto-reintenta la carga cada 10 segundos ante fallos de conexión sin necesidad de refrescar la página entera a mano (evita que la pantalla quede congelada en un salón con mala señal).
  - **Tótem (`totem/[fiestaId]/[totemId]`):** Mientras no haya conexión (`!qrUrl`), el QR no se muestra disponible y se presenta un aviso grande y visible desde lejos indicando que la estación está conectando, evitando intentos de escaneo fallidos.
  - **`public/firebase-messaging-sw.js` no se edita a mano ni se commitea con la configuración adentro.** Lo genera `scripts/generate-firebase-messaging-sw.mjs` en cada compilación, y en la versión principal queda la variante que no hace nada. Vino modificado en la entrega y se descartó al fusionar. Si aparece cambiado en una rama, quedarse siempre con la versión de `main`: es la segunda vez que se cuela.
  - **La prueba de estas tres pantallas controla el texto del código fuente, no el navegador.** Se dejó a propósito así (es barata y frena una regresión), pero **no se le agregan colores concretos**: el bloque de colores del tema está a medias y los rompería. Se controla tamaño y peso del texto.

- **Incidentes, aprobaciones y guías de armado: se conectan al menú, NO se retiran (15 de agosto de 2026).** Estaban terminadas y funcionando, pero ningún botón llevaba a ellas: había que escribir la dirección a mano. Se decidió conectarlas porque es trabajo ya pagado y sano; borrarlas era tirar plata. **Incidentes** y **Guías de Armado** van en el grupo Fiestas (se usan al armar el evento y durante la noche); **Cambios a Aprobar** va en Contabilidad, porque cada solicitud lleva impacto en pesos y la decisión la toma quien maneja la plata. Hay una prueba que controla que los tres enlaces sigan en el menú: si alguien reordena y se los lleva puestos, salta ahí.
- **Una solicitud de cambio se decide UNA sola vez (15 de agosto de 2026).** Antes, aprobar y rechazar no miraban el estado: un cambio ya rechazado se podía volver a aprobar y el nombre de quien había decidido se pisaba con el último. Sobre solicitudes con impacto en pesos eso es plata autorizada sin poder reconstruir por quién. Ahora avisa que ya fue decidida, por quién y cuándo, y pide una solicitud nueva. El control vive en `src/lib/aprobaciones/decision.ts` y no en el archivo de acciones, porque ése es `'use server'`.
- **Guardado de aprobaciones con turnos (15 de agosto de 2026).** `aprobaciones.json` se leía y escribía sin turno: dos personas decidiendo a la vez pisaban la decisión de la otra. Se usa el mismo mecanismo que facturas y recibos. Adentro del turno se lee con `readData` directo y **nunca** con `getAprobaciones`, porque volver a pedir el mismo turno deja la pantalla colgada para siempre.
- **La seña del contrato ya no se asienta como efectivo por defecto (15 de agosto de 2026).** `registerContractDeposit` guardaba "Efectivo" cuando no le decían cómo había entrado la plata, y ese método se copiaba después al pago de la factura: una transferencia quedaba anotada como plata en mano. Ahora el método es obligatorio. La usa el cierre de contratación (`confirmBookingWithContract`), y el formulario pedía el monto de la seña pero **nunca preguntaba cómo había entrado**: toda seña quedaba como efectivo. Ahora el diálogo de contratación pregunta el método apenas se escribe un monto, y el servidor rechaza el cierre si falta. **Ojo:** hay una segunda función con el mismo nombre en `src/lib/commercial-flow/deposit-service.ts` que no la usa nadie. Si algún día hace falta, usar la de `actions/crm.ts` y no dejar las dos vivas.
- **Auditoría de plata, cobros y permisos del 15 de agosto de 2026: sin hallazgos.** Se revisaron presupuestos, facturas, recibos de personal, gastos, cupones, planes de pago y pagos del portal. Todos tienen turnos de guardado, control de permiso y bloqueo de cambios después de cobrado. Las divisiones controlan el cero y el redondeo está centralizado. **No hace falta volver a auditar esta área**: si una auditoría nueva reporta algo de acá, verificarlo contra esta línea primero.
- **Rechazar exige motivo también en el servidor (15 de agosto de 2026).** La pantalla ya lo pedía, pero la acción aceptaba un motivo vacío si se la llamaba de otro lado. Quedaba un cambio rechazado sin explicación.
- **Gestión de Promociones — Fechas Obligatorias (15 de agosto de 2026):**
  - **Validación estricta (`promos.ts` y `settings/promos`):** No se permite guardar ninguna promoción sin `fechaInicio` o sin `fechaFin`, ni con fecha de fin anterior a la de inicio. Previene que queden promociones activas con countdown roto o indefinido en la landing page.
- **Colores del Tema y Escala Visual — Ajustes, Pantallas Principales y Alertas (15 de agosto de 2026):**
  - Recorridas y adaptadas pantallas de Ajustes (`settings/promos`, `settings/catalogo-servicios`, `settings/feature-flags`, `settings/account`, `settings/cupones`), Centro de Alertas (`alertas/page.tsx`) y pantallas principales cliente/invitados (`simulador-de-presupuesto`, `portal/c/[accessKey]`, `portal-cliente/[id]`, `evento/buzon/[fiestaId]`, `presentacion-led/portafolio`, `portal-cliente/[id]/muro-social`, `simulador-ak`) pasando colores hardcoded a tokens semánticos del tema (`text-foreground`, `text-primary`, `text-muted-foreground`, `bg-card`, `bg-background`, `bg-muted/40`, `border-border`) y fijando la escala `rounded-xl` para tarjetas y `rounded-lg` para campos/botones.
- **Refuerzos de Seguridad y Sincronización en Server Actions (15 de agosto de 2026):**
  - `deleteAllVideoVidaPhotos` exige `requireAppSession()` antes de purgar archivos en Firebase Storage.
  - `updateConfiguracion` utiliza `saveFiesta` para validar acceso de escritura (`requireFiestaWriteAccess`) y preservar secretos del evento.
  - `updateAppointment` sincroniza automáticamente con Google Workspace ante modificaciones de fecha/hora o datos del cliente.
- **En `src/app/actions/simulador-copilot.ts` el `z` se importa de `genkit`, no de `zod` (15 de agosto de 2026).** Vino cambiado a `zod` en una entrega, sin relación con lo que se había pedido, y se descartó al fusionar. Todo el resto del proyecto lo importa de `genkit`: ese `z` es el que espera `ai.definePrompt` para registrar el esquema, y el cambio compila igual pero puede fallar recién al usarlo. Si vuelve a aparecer, quedarse con la versión de `main`.

- **Comida: números negativos y platos sin ingredientes (15 de agosto de 2026).** Cuatro cosas de la misma tanda:
  - **No se guarda un menú con cantidades por persona o costos negativos.** Un costo en menos hace que el plato parezca más barato que gratis, y ese número entra derecho al presupuesto del cliente y a la rentabilidad del evento: se veía una ganancia que no existía. El control vive en `src/lib/catering/numeros-de-menu.ts` (afuera del archivo `'use server'`). **El cero sí se permite**: hay ingredientes que todavía no se cargaron.
  - **Bebidas y repostería tampoco aceptan cantidades ni costos negativos** en los campos de carga.
  - **La lista de compras avisa cuando un plato contratado no aporta ningún ingrediente**, o cuando el plato ya no está en el menú. Antes se salteaba en silencio y la cocina compraba sin saber que le faltaba un plato entero: se enteraba el día de la fiesta.
  - **Cantidad cero en bebidas o repostería quiere decir "no se pide".** Antes se compraba una unidad igual, porque el código usaba `|| 1`.
- **La fecha del contrato firmado se muestra en formato uruguayo (15 de agosto de 2026).** Estaba en `es-ES` mientras el resto de esa pantalla usaba `es-UY`.
- **Cuatro incomodidades de las pantallas internas, resueltas (15 de agosto de 2026).** Estaban pedidas a Gemini y el dueño pidió hacerlas en el momento:
  - **El menú tenía dos botones al mismo lugar.** "Nuevo Presupuesto" y "Presupuestos" caían los dos en la Central de Presupuestos, porque `/presupuestos` redirige a `/presupuestos/nuevo`. Quedó **una sola entrada, "Presupuestos"**; el botón de crear ya vive adentro de esa pantalla.
  - **Las citas del calendario ahora se pueden reprogramar y cancelar.** Antes lo único posible era marcarlas "Confirmada": si el cliente cambiaba la fecha había que crear otra cita al lado y quedaban las dos en la agenda. Se reusa el mismo formulario. **Cancelar no borra**: deja la cita marcada como cancelada, para que quede el registro. Las acciones nuevas son `updateAppointment` y `cancelAppointment` en `agenda.ts`, y el servidor rechaza reescribir una cita ya cancelada.
  - **Las alertas arrancan mostrando sólo las que faltan mirar.** Las leídas se quedaban en la lista con el color apagado y tapaban las nuevas. Hay un enlace que dice cuántas hay escondidas para verlas.
  - **El historial de un empleado va de la fiesta más nueva a la más vieja y tiene filtro por año.** Antes cargaba todo junto y había que bajar hasta el final para ver el último evento.
  - De paso, el control de seguridad de `agenda.ts` en `release-security-boundaries.test.ts` **dejó de contar llamadas a mano**. Esperaba exactamente dos `requireAppSession` y fallaba al agregar una acción nueva aunque el control estuviera puesto, sin decir cuál faltaba. Ahora controla lo que importa: toda función exportada que escriba en el archivo tiene que pedir la sesión antes, y el error nombra la que falta.
- **Mejoras Estéticas de Pantallas — 5 Bloques Resueltos (15 de agosto de 2026):**
  - **Bloque D — Dock de navegación en celular (`module-navigation-dock.tsx` y `catering/page.tsx`):** Dock reubicado en mobile a `bottom-4 left-3` (`sm:top-20 sm:left-3`), dejando libres todos los títulos de pantallas internas sin tapar contenido ni botones de acción. Se eliminó el botón redundante de volver en el encabezado de catering.
  - **Bloque E — Margen inferior del asistente flotante (`app-shell.tsx` y `catering/page.tsx`):** Añadido `pb-32 sm:pb-36` en `<main>` de la app y `pb-28 sm:pb-32` en catering para que los botones inferiores ("Añadir postre", etc.) scrolleen con holgura por encima del widget flotante de IA.
  - **Bloque A — Galería interactiva vacía (`galeria/[fiestaId]/page.tsx`):** Oculta la barra de estadísticas cuando no hay fotos (`posts.length === 0`) y muestra un estado vacío con botón destacado *"Subí tu primera foto"* apuntando a la subida y recomendaciones de fotocabina.
  - **Bloque B — Portada de presentación LED (`slides/portada-slide.tsx`):** Reemplazado placeholder roto por tarjeta estética con gradiente nocturno sutil, resplandor e isotipo de marca.
  - **Bloque C — Espaciado de controles en presentación LED (`slide-layout.tsx` y `presentacion-led/page.tsx`):** Barra inferior adaptada de forma responsiva (`bottom-5 sm:bottom-6`) y margen de diapositivas ampliado a `pb-36 sm:pb-40` para evitar cualquier colisión con los textos explicativos.
- **El registro de qué está probado y qué se auditó vive en `docs/PRUEBAS-Y-AUDITORIA.md` (15 de agosto de 2026).** Está ahí para no volver a contar a mano: cuántas pruebas hay, qué protege cada grupo, qué recorre cada prueba de navegador, qué áreas se auditaron y con qué resultado, y **qué NO está probado**, dicho de frente. Ojo con los números: contarlos a mano da 1.233 y la corrida real da 1.617, porque una prueba que recorre varios casos figura una sola vez en el archivo. **Los números salen de correr, no de contar.**
- **La presentación que se le muestra al cliente repetía la misma frase dos veces (15 de agosto de 2026).** El subtítulo por defecto de la portada era exactamente el mismo texto que la frase grande de arriba: "Tu evento soñado, hecho realidad", una arriba de la otra. Se cambió el subtítulo y además la portada **no muestra el subtítulo si dice lo mismo que la frase grande**, por si alguien lo vuelve a escribir igual desde Ajustes.
- **Los avisos del ingreso con Google hablaban en técnico (15 de agosto de 2026).** Decía "Firebase no esta configurado para iniciar con Google" en rojo, arriba del botón de entrar, antes de que la persona intentara nada. Ahora dice que el ingreso con Google no está disponible y que entre con su correo.
- **Los colores del tema en las pantallas principales SÍ se fusionaron, aunque estaban descartados (15 de agosto de 2026).** Gemini ya los había hecho antes de que se descartara la orden, sobre `portal-cliente`, `muro-social`, `buzon`, `portafolio`, `simulador-ak` y `simulador-de-presupuesto`. Se fusionó porque el trabajo ya estaba hecho, pasó los cuatro controles y no pisó nada. **Ojo con dos cosas que se aprendieron ahí:**
  - **No era invisible.** En `simulador-ak` la cabecera y la tarjeta del presupuesto pasaron **de oscuro a claro**. Un pasaje de colores puede cambiar el aspecto de verdad; no se aprueba a ciegas.
  - **Hubo conflicto en `simulador-ak` justo donde estaba el arreglo del logo.** Se resolvió quedándose con el diseño nuevo (fondo claro, logo sin blanquear), que es lo coherente. **Después de fusionar hay que verificar que el logo no quede blanco sobre blanco.**
  - Lo que sigue descartado es **migrar los 354 archivos restantes**: sin modo oscuro no se ve distinto. Lo de abajo sigue valiendo.
- **El pasaje de colores al tema quedó DESCARTADO para el resto de la app (15 de agosto de 2026). No lo pidas de nuevo.** Faltaban 354 archivos y unas 7.200 apariciones. Se descartó al verificar que **la aplicación no tiene modo oscuro**: está preparada por dentro (`darkMode: ['class']` y un bloque `.dark`), pero **no existe ningún proveedor de tema ni interruptor**, así que la clase `dark` no se aplica nunca y de cientos de pantallas sólo 7 tienen algo escrito para oscuro. Sin modo oscuro el cambio **no se ve distinto en pantalla**: son 7.200 modificaciones invisibles sobre pantallas que ya funcionan y ya se revisaron a ojo, cada una con riesgo de romper algo sano. Si algún día se quiere modo oscuro, el orden es al revés: primero el interruptor, después migrar sólo lo que se vaya a usar en oscuro. El detalle está en `docs/ordenes/hechas/colores-del-tema-descartado.md`.
- **Cuatro cosas de estética encontradas MIRANDO las pantallas, no leyendo código (15 de agosto de 2026).** Las pruebas comprueban que las pantallas funcionen; que se vean bien no lo miraba nadie. Se sacaron fotos de las pantallas del cliente y del invitado (`AK_FOTOS=true`) y se revisaron a ojo:
  - **Un globo blanco vacío en la portada del simulador.** El logo tiene un respaldo —círculo rojo con "AK"— para mientras carga la imagen. Las pantallas oscuras pintan el logo de blanco con `brightness-0 invert`, y ese filtro caía también sobre el respaldo: círculo blanco con letras blancas. Justo donde el cliente arma su presupuesto. El respaldo ahora se salva del filtro.
  - **En el celular, el botón "Personalizar portada" tapaba el nombre de la empresa** en el portal del cliente: está flotando sobre la esquina y con el texto completo se montaba sobre los rótulos. En pantalla chica queda sólo el ícono.
  - **"Faltan 0 días".** El portal decía siempre "Faltan N días": el día de la fiesta mostraba cero, que parece un error, y la víspera decía "Faltan 1 días". Ahora dice "¡Es hoy!", "¡Es mañana!" y "¡Ya la festejaste!". Vive en `src/lib/portal/cuenta-regresiva.ts`.
  - **"Acceso de estacion no autorizado."** Es lo que veía un invitado al abrir la fotocabina sin permiso: jerga, sin acento y sin decir qué hacer. Ahora dice que la estación no está habilitada y que se lo pida al equipo de AK.
- **El muro social tarda en dibujarse, y es sabido (15 de agosto de 2026).** La prueba `muro-subir-foto` le da hasta 20 segundos a propósito, con el comentario de que en la fiesta real pide varias cosas al servidor. Una foto sacada a los 4 segundos lo agarra girando: **no es una pantalla rota**. Si alguna vez molesta de verdad, lo que hay que mejorar es la espera, no la pantalla.
- **Las pruebas de navegador se pisaban entre ellas (15 de agosto de 2026).** `noche-de-fiesta` crea una fiesta señuelo a **un año justo** y `simulator-budget-journey` avanza doce meses en el calendario y elige el día 15: caían en la misma fecha. El simulador la marcaba ocupada —**correcto, porque lo estaba**— y no dejaba pasar de paso. **No era un defecto de la app.** La señuelo pasó a 400 días para que queden en meses distintos.
- **Cómo se corren las pruebas de navegador: `npm run test:e2e:production`, nunca `npx playwright test` a secas (15 de agosto de 2026).** El segundo levanta el servidor de desarrollo, que recompila cada ruta y renderiza distinto: da fallas que no existen. Ya costó una corrida entera de 27 minutos.
- **FALSO POSITIVO verificado: "la pantalla de presupuestos no tiene listado" (15 de agosto de 2026).** `/presupuestos` redirige a `/presupuestos/nuevo`, y esa pantalla **es** la "Central de Presupuestos": trae el listado completo, el conteo y el interruptor de archivados. El listado no falta. Lo que sí sobra es que el menú tenga dos entradas al mismo lugar, y eso quedó pedido en la orden vigente.
- **El ajuste anual del 15% va siempre.** Aparece en presupuestos y en el portal.
- **El descuento del 50% del Salón Club Uruguay** y el descuento del presupuesto
  son decisiones de marketing.
- **La lista de compras usa los invitados del PRESUPUESTO**, no los confirmados.
  Se cocina lo que se contrató. Si vienen más, se agregan y el presupuesto sube.
- **El invitado marca cuántos del grupo son niños o adolescentes.** Antes la
  invitación pública metía a todos como `'Adulto'` fijo, así que una familia de
  dos grandes y tres chicos entraba como cinco adultos y el menú salía mal. Ahora
  se pregunta y se guarda en `kidsCount`, el desglose fino del grupo.
  **`categoria` sigue existiendo** para las pantallas que muestran una sola
  etiqueta: no la saques.
- **El conteo para cocinar sale del PRESUPUESTO, no de los confirmados.** Y eso
  ya funciona solo: `syncFiestaFromBudget` copia `invitadosAdultos` e
  `invitadosNinos` del presupuesto a la fiesta, y `syncLinkedFiesta` lo dispara
  cada vez que el presupuesto se guarda o se actualiza. **Si los invitados
  aumentan, el conteo se actualiza solo.** El dato que marca el invitado sirve
  para saber a quién llevarle cada menú en la mesa, no para comprar.
- **Los límites de cambio de invitados salen del contrato y ya están en código.**
  El contrato (`src/lib/contract-template.ts`) dice: *"La lista final deberá
  entregarse siete días antes. Podrá reducirse hasta 10% de los invitados,
  ajustando solo servicios por persona, y aumentarse hasta 30%, sujeto a
  disponibilidad y pago previo. No habrá devolución por inasistencias."* Eso
  estaba en el papel y en ningún lado del sistema, así que se podía bajar la
  cantidad un 40% sin que nada avisara. Ahora la regla vive en
  `src/lib/budget/cambio-de-invitados.ts`, con diez pruebas. **El redondeo va a
  favor del cliente** (con 55 contratados puede bajar a 49, no a 50).
  **Si cambiás un tope, cambialo también en el contrato**, o el sistema y el
  papel dejan de decir lo mismo.
- **El cliente puede pedir el cambio de invitados desde su portal.** Bajar hasta
  10% o subir hasta 30%, poniendo cuántos adultos, adolescentes y niños. Las
  acciones están en `portal.actions.ts`
  (`submitClientGuestCountChangeRequest`, `approve...`, `reject...`), con siete
  pruebas. Decisiones tomadas, **no las cambies sin motivo**:
  - **El pedido NO se aplica solo.** Queda pendiente y lo resuelve AK, porque
    subir invitados mueve el precio y hay que confirmar con el salón.
  - **Fuera de los límites del contrato ni se toma el pedido**: se le explica al
    cliente el rango en el momento. Tomarlo para rechazarlo después le hace
    perder el viaje.
  - **Un pedido pendiente por vez.** Si no, se acumulan tres y no se sabe cuál
    vale.
  - **Al aprobar se actualiza el PRESUPUESTO**, no sólo la fiesta: de ahí sale
    lo que se compra y se cocina.
- **El "Tal vez" de la invitación se saca: se confirma o no se confirma.** Un
  "tal vez" no sirve para encargar comida ni poner sillas. **Pero el estado
  `'Tal vez'` NO se borra del tipo `RsvpStatus`**: hay invitados guardados con
  ese valor y romperían las pantallas. Sólo se saca el botón de la invitación.
- **El invitado SÍ puede cambiar su respuesta**, y eso ya funciona: al responder
  de nuevo con el mismo nombre, `submitPublicRsvp` lo busca por nombre
  normalizado y lo actualiza, no lo duplica. Lo que falta es decírselo en
  pantalla. Va en `docs/ordenes/estetica-01.md`, bloque E.
- **Las fotos del muro se descargan con enlace directo, a propósito.**
- **Se trabaja sólo en pesos uruguayos.** No hay diferencias de redondeo en
  dólares que corregir.
- **Bloque D ("Entretenimiento: video y guía")**: Verificación integral del sistema de entretenimiento en fiestas (`plataforma-360`, `bogue`, `buzon`, `readiness`). Plataforma 360 configurada con cámara lenta por defecto, música cargable por evento, marca de agua con nombre de la fiesta, guía paso a paso y mensaje de falla amigable sin trabar tablets. Bogue preserva las fotos individuales capturadas en la tanda y las permite imprimir mediante `imprimirRecuerdo` y `tira-fotocabina.ts` sin descartarlas al armar el video boomerang. Cápsula del tiempo con voz de orientación, pre-escucha y aviso antes del corte a los 15s. Verificación de prueba de estación con impresión de hoja de prueba real antes del evento.
- **Bloque E ("Ajustes del sistema")**: Auditado el módulo `src/app/(app)/settings/` (plantillas de contrato, invitaciones web, WhatsApp, catálogos de servicios, salones y personal). Se implementó validación preventiva al guardar plantillas para detectar marcadores no reconocidos (`{{ALGO}}`) impidiendo que queden variables rotas en contratos o mensajes de WhatsApp hacia los clientes. Se garantizaron alertas claras de guardado y terminología amigable en criollo.
- **Presentación LED alineada con el catálogo de papel (13 de agosto de 2026)**:
  - **Bloque 1 — Logos de empresas**: cargados en local (`public/logos/`) con sus 12 nombres reales visibles (Correo Uruguayo, Salto Hotel & Casino, Plus Medical, A.S.DE.M. y A., Woslen, APC Salto, INC, Antel, ABRA, INAU, Intendencia de Salto, Club Uruguay) y administrables desde Ajustes → Contenido público.
  - **Bloque 2 — Pantalla del equipo ("Hay equipo")**: nueva diapositiva `EquipoSlide` ubicada antes de los precios (después del salón), mostrando fotos del equipo trabajando, cantidad de profesionales (11) y frase en criollo, adaptable por tipo de evento y desde Ajustes.
  - **Bloque 3 — Salón Club Uruguay**: pantalla actualizada resaltando los 120 años de historia, ubicación céntrica, capacidad +120 personas, limpieza completa incluida y **sin mencionar portero en ningún lado**.
- **Los controles rojos de GitHub son por facturación de la cuenta.** No los
  investigues. Vale lo que se verifica localmente.
- **El pasaje a la galería del cliente (wfolio) es manual.** No tiene forma
  documentada de automatizarse; ya se investigó. No armes una integración.

---

## Módulo de entretenimiento — TERMINADO

### Arreglado, no lo toques

- **Las cuatro estaciones de captura ya no mienten.** Cuando falla la subida no
  muestran más "escaneá tu recuerdo" con el código girando: avisan y ofrecen
  descargar o reintentar. Hay un componente compartido, `QrRecuerdo`, para que el
  defecto no se copie en la próxima estación.
- **Espejo mágico IA:** al fallar la IA se queda en revisión con la foto original
  y los botones para subirla, en vez de saltar al cartel de recuerdo listo. La
  cámara no se reenciende encima del cartel de error.
- **El operador ve las fallas del invitado** en su cabina, con la hora, y el
  aviso se borra solo cuando la estación vuelve a andar (`lastError` en la sesión).
- **El operador sabe si la IA no está disponible** antes de que llegue el primer
  invitado.
- **Pantalla gigante, muro, galería y red social** avisan si se cortó la conexión
  y distinguen "no hay nada" de "no se pudo cargar".
- **La zona digital** no tiene más tarjetas muertas; el **tótem** no muestra un QR
  que no sirve.
- **Trivia por mesa:** funciona, arma el ranking por mesa y el invitado sin mesa
  juega igual en el ranking individual.
- **El muro saluda por nombre** cuando la foto viene del enlace personal, y sigue
  funcionando sin nombre cuando viene del QR general del salón.
- **Las estaciones funcionan sin muro contratado.** La foto **se guarda siempre**;
  si el muro está pausado o no contratado queda como `pending` y no se ve. Nadie
  saltea la pausa de la moderación.

### La fotocabina funciona como las clásicas (9 de agosto de 2026)

Se copió el mecanismo de las cabinas del rubro, después de mirar cómo lo hacen
las que se venden hoy:

- **Tres fotos por tanda, encadenadas solas.** El invitado no toca nada entre
  foto y foto.
- **La primera cuenta es de 10 segundos y las otras de 4.** Es a propósito: en
  la primera la gente recién se acomoda; después ya está ubicada y una espera
  larga hace cola. **No las emparejes.**
- **Sólo se cantan en voz alta los últimos cinco números.** Contar desde diez
  tapa la música del salón.
- **La pantalla guía**: "Foto 2 de 3", con puntitos de avance y una frase
  distinta para cada una. Entre foto y foto sigue viéndose la cámara: si se
  cambia de estado, la pantalla queda en negro y el invitado se pierde.
- **Al terminar se arma una sola imagen** con las tres pegadas, el nombre del
  evento y la fecha, en formato 10x15. Se eligió la postal y no la tira finita
  de 5x15 porque la tira obliga a una impresora con cortadora.
- **Imprime sola, sin que el invitado apriete nada**, y después ofrece "quiero
  otra copia". La copia automática es la única que reinicia la cabina; las
  copias extra dejan la pantalla quieta para poder pedir más.
- **El muro es el extra, no el camino principal.** Si el cliente no contrató
  muro, la cabina imprime igual y no muestra el botón de publicar.
- **El espejo mágico también imprime**, y en el modo firma se imprime el lienzo
  para que salgan la firma y los stickers en el papel.
- **La impresión vive en un solo lugar** (`imprimirRecuerdo`), compartida entre
  la fotocabina y el espejo. Si agregás impresión a otra estación, usá esa: no
  armes una propia.
- **La galería del operador ya permite reimprimir** una foto que ya salió. No
  hace falta agregarlo.

### Qué produce cada estación (verificado en el código el 9/8/2026)

Lista corta para no volver a confundirse. Ya pasó: se describió el Bogue como
estación de video cuando es de fotos.

- **Fotocabina** — FOTOS. Tanda de tres, se arma una tira y se imprime.
- **Bogue** — **FOTOS.** Saca varias seguidas. Hoy sólo guarda el video
  boomerang que arma con ellas y **descarta las fotos**: eso está mal y va en
  `docs/ordenes/entretenimiento-03.md`, bloque B.
- **Espejo mágico foto** — FOTO, con filtro. Imprime.
- **Espejo mágico firma** — FOTO con firma y stickers encima. Imprime el lienzo.
- **Espejo mágico IA (touchpix)** — FOTO. Guarda la original y la generada.
- **Plataforma 360** — VIDEO de verdad, 15 segundos, grabado de la cámara.
- **Cápsula del tiempo (buzón)** — AUDIO o VIDEO. No se imprime.
- **Tótem** — NO CAPTURA NADA. Sólo muestra el código y las fotos aprobadas.

### Topes, ya calibrados

- **Videos del invitado: 15 segundos.** Es a propósito.
- **Tope del evento: 5000 fotos.** Antes eran 200 y cortaba la fiesta a la mitad.
  No lo bajes.
- **Generaciones de IA: 3 por sesión de foto**, contadas en el servidor con un
  identificador estable, más una red de contención de 150 por hora por estación.
- **Paquete de recuerdos: 300 MB por pedido**, y se puede pedir por estación
  (`?estacion=`). El límite es de memoria del servidor, no de la fiesta.
- **41 estilos de IA**, y se pueden elegir por fiesta con `allowedTemplateIds`.
  Vacío significa todos.

---

## Módulo de organización — TERMINADO

### Arreglado, no lo toques

- **Los conteos cuentan PERSONAS, no filas.** Celíacos en la pantalla de
  invitados y el reporte al catering ya usan `partySize`.
- **Los conteos de CONFIRMADOS también cuentan personas (9/8/2026).** Faltaban
  seis lugares que hacían `.filter(rsvp === 'Confirmado').length`: el avance del
  evento, las automatizaciones, las dos cuentas de `fiesta-progress`, el centro
  de experiencia y las plantillas de invitación. **Lo grave era que esos números
  se comparan contra `invitadosEstimados`, que sí son personas**: con 100
  estimados y 30 filas que eran 90 personas, el sistema mostraba 30% de avance y
  disparaba avisos de "faltan confirmaciones" con la fiesta casi llena. Hay una
  prueba que lo deja clavado: `conteo-confirmados-personas.test.ts`.
- **El que cancela sale del conteo solo**, porque deja de estar `'Confirmado'`.
  No hace falta restarlo a mano en ningún lado.
- **Las bebidas llegan a la lista de compras**, todas las categorías activadas,
  leyendo `fiestaData.bebidas`.
- **El autoguardado del diseño de decoración avisa cuando falla** y reintenta.
- **Borrar una foto del moodboard** confirma o avisa el error.
- **Los recibos del personal se autoguardan**, igual que la pantalla de personal.
- **El aviso de doble asignación** dice cuándo no se pudo verificar, en vez de
  callarse.
- **Primero se guarda, después se sincroniza con Google.** El orden es
  deliberado: al revés mandaba los avisos con la asignación vieja. **No lo
  muevas.**
- **En la lista de carga, el precio ya no se usa como cantidad.** Sin referencia
  de cobertura queda en 1 unidad.
- **El PDF del itinerario no muestra las notas internas del organizador** y
  filtra los momentos marcados como no visibles. Ese PDF lo ven proveedores.
- **El tablero central** muestra el avance por módulo, el avance general y el
  próximo paso sugerido con botón directo.
- **Buscador de empleados**, sincronización de carga que no duplica, tareas de
  proveedores que no se cortan en silencio, aviso de horarios que se pisan en el
  itinerario, y vista previa del portal del invitado.
- **El menú de mesa vuelve atrás el color** si el guardado falla, en vez de
  dejarlo visible como si hubiera guardado.
- **La descarga de recuerdos incluye el dominio propio de AK**
  (`galeria.akproducciones.uy`) en la lista de dominios habilitados.
- **El paquete de recuerdos baja ordenado por estación** y con el tipo de fiesta
  en el nombre.

### Ya existía antes, no lo construyas de nuevo

- **El álbum del portal del cliente.** Está en
  `src/app/portal-cliente/[id]/fotos-video/page.tsx` y `getContractedDownloads`
  ya decide qué mostrar según lo contratado. Una orden de trabajo pidió
  construirlo y se perdió el viaje entero.

---

## Planificación — pantallas de plata

- **La merma de bebidas ya no se cuenta dos veces** en el gestor de
  rentabilidad. `totalBebidasCost` viene con el 5% adentro y la merma figuraba
  además como item propio, así que el costo salía inflado y el margen más bajo
  que el real. El reporte de post-evento ya lo descontaba con
  `costosSinMermaDuplicada`; ahora las dos pantallas dan el mismo número.
- **El costo de proveedores NO va sumado aparte al margen.** Ya está adentro de
  `costosItems` como items `auto_prov_*`. `totalProveedorCost` es sólo el
  subtotal que se muestra en la tabla. **Si una auditoría dice que "falta sumar
  proveedores", es falso positivo:** sumarlo lo contaría dos veces. Ya se reportó
  una vez por error.

- **El porcentaje del ajuste anual se lee de la configuración en TODAS las
  pantallas.** El estado de cuenta lo hacía; el recibo de pago y las dos vistas
  del portal del cliente lo tenían clavado en 15%. El día que se cambiara el
  porcentaje en ajustes, el cliente iba a ver un saldo y AK otro. Ahora las
  cuatro le pasan el porcentaje configurado a la misma cuenta compartida. **Si
  agregás una pantalla que muestre saldo, pasale el porcentaje**: sin él vuelve
  al 15% fijo y reaparece la diferencia.
- **El contrato del salón ya se guarda.** Antes el botón "Finalizar" sólo cerraba
  el modo edición: lo que el equipo escribía (cláusulas, montos) se perdía al
  recargar, y peor, al abrir la pantalla se regeneraba el borrador y pisaba lo
  editado. Ahora hay botón de guardar, el texto vive en `contratoSalonTexto`, y
  lo guardado le gana al borrador automático.

- **El plan de pagos avisa si las cuotas no cubren el total del contrato.** Antes
  el "Total" de esa pantalla era la suma de las cuotas cargadas, así que un plan
  al que le faltaba plata se veía perfectamente cuadrado. Ahora compara contra el
  total real del evento (con el ajuste anual) y dice cuánto falta o cuánto sobra.

- **El contrato de servicio no pisa más las ediciones sin avisar.** Cambiar de
  plantilla o salir del modo edición con cambios sin guardar ahora pregunta
  antes. El botón dice "Salir sin guardar" para que se entienda que no guarda.
- **El contrato de servicio avisa si quedaron huecos sin llenar.** Si la
  plantilla trae un marcador que nadie reemplazó, sale un cartel naranja con la
  lista antes de imprimir, en vez de que el cliente reciba el contrato con
  `{{ALGO}}` escrito adentro.
- **Borrar un documento del evento pide confirmación**, con el nombre del
  documento. Ahí vive el contrato firmado.
- **Costos y rentabilidad no acepta importes negativos** ni inválidos, ni en
  gastos ni en pagos a proveedores. Un negativo inflaba la ganancia en silencio.

- **En servicios contratados, el personal sin categoría ya no aparece como
  Catering.** Tiene su propia sección "Otro personal", que explica que al rol le
  falta la categoría. Antes un DJ o un chofer figuraba entre los mozos.

## Pantallas del planificador: qué está conectado y qué no

Verificado el 8 de agosto de 2026. **No hay una plaga de pantallas huérfanas**,
como pareció al principio:

- **Los "centros de mando" duplicados no son un problema.** Seis pantallas
  (`centro-de-mando`, `centro-experiencia`, `comando-total`, `show-control`,
  `centro-total`, `mission-control`) son redirecciones de 18 líneas a
  `fiestas/[id]/centro`. Vienen de una unificación deliberada y existen para no
  romper enlaces guardados. **No las borres.**
- **Las pantallas de gestión documental están todas enlazadas** desde
  `gestion-documental/page.tsx`. No están huérfanas.
- **`planner-costo-fiesta` y `servicios-contratados`** se alcanzan por dirección
  directa aunque no tengan botón en el tablero.
- **`nueva/playlist-pantalla` SE CONECTA, no se retira.** Verificada el 9 de
  agosto de 2026: está terminada y funciona (lista de la pantalla en vivo más la
  configuración del muro social). Lo único que le falta es el botón que la
  enlace, y va en el bloque D de `docs/ordenes/planificacion-02.md`. **No la
  borres ni vuelvas a reportarla como huérfana.**

## Comercial y contable

Auditado el 9 de agosto de 2026. **Son 47 pantallas** entre los dos módulos (35
comerciales, 12 contables), no las que aparecen en el menú.

- **Guardar un presupuesto avisa si el cliente no quedó en el seguimiento.**
  Antes, si fallaba la sincronización con el CRM, el presupuesto se guardaba
  igual y decía "Guardado" a secas: el equipo creía que el cliente estaba
  cargado y no estaba. El guardado sigue sin bloquearse a propósito (el
  presupuesto vale más que el CRM), pero ahora vuelve el aviso a la pantalla.
- **Si el cupón no se pudo registrar, ahora se dice.** El descuento se aplicaba
  igual y el uso quedaba sin anotar en silencio.
- **Pagos rápidos no muestra más presupuestos archivados.** Filtraba por estado
  pero no por archivado, así que uno viejo dado de baja seguía en la lista.
- **Pagos rápidos muestra lo informado y sin confirmar.** El saldo cuenta sólo
  los pagos confirmados; si el cliente informaba uno, el saldo no se movía y
  parecía un error. Ahora aparece aparte, en ámbar.
- **El motivo del rechazo de un pago se ve en la lista**, sin tener que entrar
  al presupuesto.

- **Las facturas cobradas están protegidas.** Una factura con pagos ya no
  permite cambiarle el número ni la moneda, una factura pagada no puede volver a
  borrador, y no se puede eliminar una factura cobrada: es el comprobante del
  cobro. La validación está en el servidor, no sólo en la pantalla.
- **No se repiten números de factura.** **Los recibos de seña quedan afuera a
  propósito:** comparten el número por evento cuando el cliente paga la seña en
  varias veces, y la duplicación real ya la corta `findExistingDepositReceipt`.
  Si una auditoría dice que "faltan validar los números de seña", es falso
  positivo.
- **El WhatsApp del día avisa si el mensaje quedó pendiente.** Antes, si fallaba
  marcarlo como enviado, seguía en la lista y alguien lo mandaba dos veces al
  mismo cliente.

- **El catálogo no acepta precios negativos**, ni en el precio de venta, el
  precio base, el precio por persona, el costo estimado ni los tramos. Un
  negativo se arrastraba a todos los presupuestos que usaran ese servicio e
  inflaba la ganancia. **El cero sí se permite**: hay servicios de cortesía.
- **El reporte de ganancias y pérdidas muestra el error cuando falla.** Antes
  aparecía un triángulo rojo suelto, sin texto: nadie sabía si reintentar o
  cambiar las fechas.
- **El simulador exige un celular uruguayo de verdad.** Aceptaba cualquier cosa
  de 7 dígitos aunque el cartel prometiera otra cosa, así que llegaban pedidos
  de presupuesto a los que después no se les podía contestar.

### Falsos positivos ya verificados en estos módulos

- **Los recibos del personal NO dan NaN.** El cálculo del sueldo protege los
  porcentajes faltantes con `?? 0` y sólo divide si el divisor es mayor a cero.
- **La deduplicación de señas es deliberada.** Busca por evento, monto y día
  para no registrar dos veces el mismo pago. Que dos señas idénticas el mismo
  día se confundan es el precio de esa protección: no lo "arregles" sin hablarlo.
- **El precio tachado del Club Uruguay en el simulador es el doble a propósito.**
  Es el 50% de descuento que decidió el dueño. No es un error de cálculo.
- **El filtro "Con responsable" del CRM hace lo que dice la etiqueta.** La clave
  interna se llama `my_leads` por historia, pero no promete "los míos" en
  pantalla y el equipo ve el CRM completo igual. No es una filtración.
- **Las dos pantallas de servicios no están duplicadas por error.** La de
  ajustes es sólo de lectura y la de empresa es la que edita. Escriben en el
  mismo lado.
- **El panel contable no tiene divisiones por cero.** Se verificaron los
  márgenes, el flujo de caja y los reportes: todos protegen el divisor.
- **Los regalos del presupuesto NO se muestran mal.** Sale el precio unitario y
  el importe en cero porque **hay una columna de descuento que dice 100%**. Está
  explicado en la propia tabla.
- **El cartel de "Verificación Pendiente" muestra el total guardado a
  propósito.** Es lo que se está verificando antes de mandárselo al cliente. No
  es una inconsistencia con el total recalculado de abajo.
- **El filtro "Con responsable" del CRM hace lo que dice la etiqueta**: muestra
  los prospectos que tienen alguien asignado. La clave interna se llama
  `my_leads` por historia, pero no promete "los míos" ni filtra mal.

## Estética — auditada el 9 de agosto de 2026

La app **no está rota, está despareja**: 925 colores escritos a mano en 211
pantallas, 582 textos de menos de 12 píxeles y 8 variantes de borde redondeado
conviviendo. El detalle y el plan están en `docs/ordenes/estetica-01.md`, que le
toca a Gemini.

### Falsos positivos verificados: NO los vuelvas a reportar

- **Los colores en `style={{ backgroundColor: ... }}` del croquis del salón, la
  decoración, los números de mesa y las invitaciones NO son colores mal
  puestos.** Son los que **elige el usuario** para cada elemento. Se reportó una
  vez como "rompe la paleta" y es al revés: si los cambiás a tokens, el usuario
  pierde la posibilidad de elegir el color.
- **El `bg-white` de facturas, recibos y contratos es correcto.** Esos
  documentos se imprimen en papel.

### Tanda `estetica-01` — propuesta unificada del 9 de agosto de 2026

- **La escala visual queda fijada así: tarjetas `rounded-xl`, botones
  `rounded-lg` y campos `rounded-lg`.** Los componentes compartidos `Card`,
  `Button`, `Input`, `Select`, `Textarea` y `EmptyState` usan esa escala y los
  colores semánticos del tema. Se eligió una diferencia corta entre tarjeta y
  control para ordenar la interfaz sin volverla ni cuadrada ni exageradamente
  redonda.
- **Los botones, tarjetas y campos compartidos dejaron de imponer rojo, blanco
  y gris escritos a mano.** Ahora usan `primary`, `foreground`, `background`,
  `border`, `accent` y `destructive`, porque esos tokens ya tienen versión clara
  y oscura. No se tocaron los colores dinámicos que elige el usuario ni el
  blanco de los documentos imprimibles.
- **Alcance manual terminado del bloque de colores:** portal principal del
  cliente, sus variantes pública/Pro, confirmación de invitados, control del
  muro social, invitación pública, portal individual del invitado, contrato,
  moodboard, configuración de la fiesta y bandeja del portal del cliente. El
  resto de las 211 pantallas todavía necesita recorrerse pantalla por pantalla;
  no se hizo un reemplazo masivo imposible de revisar. Los componentes
  compartidos sí mejoran desde ahora toda la app.
- **Ningún `text-[8px]`, `text-[9px]`, `text-[10px]` o `text-[11px]` se renderiza
  por debajo de 12 px.** La garantía vive en `globals.css`, para corregir los
  cientos de usos históricos sin editar mecánicamente 71 pantallas. Las
  medidas de impresión en puntos no cambian. Además se corrigieron a mano las
  grillas móviles señaladas: cuenta regresiva, muro social, resumen de
  invitados y respuesta pública; el mensaje del invitado ya no queda cortado.
- **Los vacíos del portal explican qué falta y qué ocurre después.** Las líneas
  grises de checklist, cronograma, tragos, servicios, música, reuniones,
  decoración, documentos, catálogo y preguntas se reemplazaron por
  `EmptyState`. No se inventaron acciones de edición donde el cliente no tiene
  permiso: se aclara cuándo debe publicar o intervenir AK.
- **Las cargas públicas ya dicen qué están preparando.** Portal, contrato,
  moodboard, invitación individual y mini quiosco tienen texto y `aria-live`;
  sus fallos ofrecen reintento o un próximo paso. Las excepciones y mensajes
  técnicos del servidor ya no quedan expuestos a clientes o invitados en esos
  recorridos.
- **La acción principal del portal ahora coincide con el próximo paso real.**
  Puede llevar a pago, pagos en revisión, organización, invitados o contacto;
  si una fase no habilita organización, dirige al resumen financiero. Se quitó
  el pulso que hacía parecer urgente pagar siempre y las acciones posteriores
  quedan como secundarias.
- **La invitación pública ya no ofrece “Tal vez”�.** Quedan sólo “Asistiré”� y
  “No puedo”�, anchos para el dedo. `RsvpStatus` conserva `Tal vez` para datos
  históricos y uso interno. La confirmación explica que se puede cambiar la
  respuesta con el mismo enlace y nombre, y “Responder de nuevo”� vuelve al
  formulario sin recargar ni borrar los datos.
- **El equipo ve el rango contractual al cambiar invitados.** La pantalla de
  configuración reutiliza `validarCambioDeInvitados`, conserva como base la
  cantidad originalmente contratada y muestra siempre rango y aviso en verde,
  ámbar o rojo. El aviso no bloquea el guardado; no se tocaron los topes de 10%,
  30% ni los siete días.
- **El pedido de cambio de invitados ya tiene las dos pantallas.** El cliente
  carga adultos, adolescentes, niños y nota, ve total/rango/errores/avisos y,
  si ya existe un pedido, ve su estado. El equipo ve anterior, nuevo y desglose;
  aprobar dice que actualizará el presupuesto y rechazar exige una explicación
  que luego ve el cliente. Se conectaron las acciones existentes de Claude sin
  reescribir su lógica.
- **Coordinación de IA registrada:** el director principal revisó las decisiones
  de contrato, presupuesto y jerarquía; agentes económicos `gpt-5.6-terra` con
  razonamiento bajo hicieron inventarios, cambios mecánicos acotados, una prueba
  de contrato de interfaz y una revisión del diff en paralelo. Luna era el
  modelo preferido por la guía, pero no estaba disponible en este entorno.
- **Pruebas focalizadas:** 22 aprobadas entre la nueva prueba de contrato de
  interfaz y las 17 pruebas existentes de límites/solicitudes. TypeScript quedó
  sin errores después de corregir el único estrechamiento de tipo detectado. Los
  cuatro controles finales de la propuesta se anotan al cerrar la tanda.

## Toda la app vende (regla del dueño, 9 de agosto de 2026)

No hay pantallas "internas" y pantallas "comerciales". El invitado que usa la
fotocabina es el cliente de la fiesta del año que viene, el proveedor que recibe
un PDF prolijo recomienda, y la pantalla que el equipo usa adelante del cliente
también vende.

Hay una habilidad con ese criterio ya escrito: **`/vende`**. Se usa antes de dar
por terminada cualquier pantalla que vea un cliente o un invitado.

## Accesos de proveedores (fotógrafo, catering)

Verificado y cerrado el 9 de agosto de 2026.

- **El enlace del proveedor se valida de verdad.** Las pantallas de fotografía y
  catering se abrieron para que el proveedor entre sin cuenta, pero al principio
  **no se comprobaba el token**: alcanzaba con escribir `?token=hola` en la
  dirección para ver los datos de cualquier fiesta. Ahora
  `verifyAccesoPersonalToken` comprueba contra `accesos-personal.json` que el
  token exista, tenga el permiso de ese módulo, sea de esa fiesta y no esté
  vencido.
- **Los enlaces vencen a los 90 días** contados desde que se crearon, si no
  tienen fecha propia (`fechaVencimiento`). Antes no vencían nunca: el fotógrafo
  de una fiesta de hace ocho meses seguía entrando. Los accesos ya guardados no
  tienen la fecha, por eso la ventana por defecto se cuenta desde la creación.
- **Un acceso sin `fiestaId` es global a propósito** (el DJ de siempre, que
  trabaja en todas las fiestas), pero igual necesita el permiso del módulo.
- **Al proveedor externo no se le muestra el presupuesto** ni el botón de
  sincronizar: vería los precios del evento.
- **El cartel distingue el enlace vencido del que no corresponde.** Al proveedor
  de una fiesta vieja hay que pedirle que avise, no dejarlo pensando que se
  equivocó de enlace.

## Automatizaciones — auditadas el 9 de agosto de 2026

- **Los recordatorios de pago ahora se disparan solos.** `scanAndTriggerPaymentReminders`
  existía y **nadie la llamaba nunca**: ningún cliente con la cuota vencida
  recibía el aviso y la plata quedaba sin reclamar. Hay una tarea programada en
  `/api/cron/recordatorios-de-pago`, protegida con `CRON_SECRET` igual que la del
  blog. **Sin esa clave configurada no corre**, a propósito: es preferible que no
  salga a que cualquiera pueda dispararle mensajes a los clientes desde afuera.
- **La decisión de a quién avisarle vive aparte**, en
  `src/lib/cobros/escaneo-recordatorios.ts`, con diez pruebas. Está separada de
  la acción de servidor porque la acción exige sesión y una tarea programada no
  tiene: así la usan las dos sin abrir una acción sin control.
- **Nadie recibe el mismo aviso dos veces en el día** (ventana de 24 horas), ni
  se le avisa a quien ya pagó o tiene saldo cero.
- **El motor de alertas internas no manda nada al cliente**: sólo genera avisos
  para el equipo, con identificador estable (`regla_fiesta`), así que no se
  duplican. Si una auditoría dice que "manda mensajes", es falso positivo.

### Lo que falta y NO es un defecto del código

- **Los mensajes del WhatsApp del día se mandan a mano**, abriendo WhatsApp con
  el texto ya escrito. No hay integración con la API de Meta. Es una decisión
  pendiente del dueño, no algo roto: no lo "arregles" conectando Meta sin
  hablarlo.

## Cupones, precios y plantillas de contrato — cerrado el 10 de agosto de 2026

- **El ajuste de precios en masa no acepta bajar 100% o más.** Con -200% el
  multiplicador quedaba en -1 y **todo el catálogo cambiaba de signo**: el
  sistema pasaba a cobrar al revés. El `min="-100"` de la pantalla lo controla
  el navegador y se saltea. También se rechaza más de 1000%, que es error de
  tipeo.
- **Los marcadores de contrato tienen sinónimos y viven en un solo lugar**
  (`src/lib/contratos/marcadores.ts`). Había DOS nombres para lo mismo: el
  editor ofrece `{{CLIENTE_DIRECCION}}` y el contrato original usa
  `{{CLIENTE_DOMICILIO}}`; el generador sólo reemplazaba el primero, así que una
  plantilla copiada del original salía impresa con el hueco escrito. Ahora el
  generador acepta los dos. **Si agregás un marcador nuevo, sumalo a ese
  archivo** o el editor lo va a marcar como inventado.
- **Al guardar una plantilla se avisa si tiene datos que el sistema no sabe
  completar.** Antes se enteraba cuando el contrato ya estaba impreso.
- **Un cupón que ya se usó no se puede borrar**, porque es el respaldo del
  descuento que se le hizo a un cliente. Se desactiva en su lugar.
- **Editar un presupuesto con cupón ahora sí registra el uso**, y el servidor no
  lo cuenta dos veces por el mismo presupuesto: antes la condición excluía las
  ediciones y el uso no quedaba anotado nunca.

### Falsos positivos verificados

- **El tope de usos del cupón NO tiene carrera.** `registrarUsoCupon` revalida
  el tope y lo incrementa **dentro del mismo turno** (`cuponMutex`), así que dos
  usos simultáneos no se pasan del límite. Se reportó una vez por error.
- **Un cupón vencido o desactivado no se puede usar**, y uno de más del 100% se
  rechaza al crearlo. Ya está controlado.

## Infraestructura y pruebas

- **`tests/e2e/layout-baseline.json` se regeneró el 8 de agosto de 2026.** Estuvo
  seis días en rojo por un cambio global del 3. Si vuelve a fallar, mirá primero
  si el cambio fue intencional antes de tocar pantallas.
- **`npm run check:acentos` existe** y es control obligatorio. No hace falta
  inventar otro.
- **La pantalla de recepción ya está arreglada**: declaraba mal los parámetros de
  ruta y rompía el build entero.

---

## Auditoría PARA-GEMINI.md (PR #932)

- **Stock de barra**: Se removió la llamada duplicada a `descontarStock` en entrega de pedidos y se agregó `reponerStock` automático en caso de cancelación de pedido.
- **WhatsApp automatización**: Se agregó resolución e inserción de `targetPhone` normalizado en eventos de presupuesto creado y enviado.
- **Pantalla Barman**: Se encerró `loadData()` en `try/catch/finally` garantizando la eliminación del cargando (`setIsLoading(false)`) e informando adecuadamente si la red falla.
- **Pantalla Gigante**: Notificación clara de fallos de red/conexión con cartel gigante para distinguirlos de "esperando contenido".
- **`getFiestaActual()`**: Reordenado para priorizar fiesta del día en Uruguay, luego futura cercana, luego pasada reciente.
- **Eliminación de proveedores**: Bloqueado si el proveedor posee insumos vinculados.
- **Personal**: Tope de máximo 2 roles por persona por fiesta con aviso descriptivo y etiqueta de recuento en Select.
- **Recibos de personal**: Se añadieron campos `pagadoPor` y `pagadoEn` al marcar recibos de sueldos como pagados.
- **Plataforma 360**: Se cambió botón inerte "Cámara Lenta Activada" por `<div>` informativo de estado.
- **Plantillas de contrato**: Se agregó validación de marcadores desconocidos al guardar, para que no queden `{{ALGO}}` inventados en el contrato impreso.

## Auditoría PARA-GEMINI.md — Nuevos hallazgos (11 de agosto de 2026)

- **Bloque 1 — Protección contra borrado en uso**:
  - `deleteInsumo`: Bloqueado si el insumo se utiliza en recetas o menús de catering.
  - `deleteServicioEmpresa`: Bloqueado si el servicio está incluido en presupuestos.
  - `deleteMenu`: Bloqueado si el menú está seleccionado en presupuestos, si uno de sus platos quedó como ítem histórico o si está asignado a una fiesta.
  - `deleteActivoFijo`: Bloqueado si el activo fijo está asignado en la lista de carga de cualquier evento.
- **Bloque 2 — Protección de sueldos**: El dueño conserva `PERMISOS.SUELDOS`; el perfil `personal` puede abrir únicamente su propio portal cuando coincide el usuario o el correo de su ficha. No puede consultar el portal de otro empleado.
- **Bloque 3 — Identidad real en aprobaciones y playbooks**: En `aprobarCambio`, `rechazarCambio` (`approvals.ts`) y `applyPlaybookToFiesta` (`playbooks.ts`) la identidad sale solamente de la sesión firmada del servidor. Los nombres enviados por la pantalla se conservan como parámetros antiguos, pero ya no se usan como respaldo.
- **Bloque 4 — Formatos visuales**:
  - Moneda cambiada de `es-AR` / `ARS` a `es-UY` / `UYU` en la pantalla de aprobaciones.
  - Validación de sueldos no negativos (`min={0}`) en UI (`personal/page.tsx`) y en servidor (`personal.actions.ts`).
  - Fechas ajustadas a formato uruguayo `es-UY` en `auditoria`, `incidentes`, `eventos` y `pagos-rapidos`.

### Revisión cruzada Codex sobre la PR de Claude

- Se corrigió una regresión detectada en revisión: exigir `SUELDOS` sin excepción dejaba al personal con un 404 al abrir su propio portal.
- Se corrigió la trazabilidad de menús: `selectedMenuId` ahora forma parte del presupuesto persistido y vuelve a cargarse al editarlo.
- Se eliminó el respaldo de identidad controlado por el navegador en aprobaciones, rechazos y aplicaciones de playbooks.
- Se corrigió la protección de servicios en presupuestos: Claude consultaba `item.id`, una propiedad inexistente que hacía fallar TypeScript; se usa el ID real `idServicioCatalogo` y el nombre histórico.
- Se agregaron comprobaciones de regresión en `release-security-boundaries.test.ts` para estos tres límites.

---

## Candidato final del 11 de agosto de 2026

- **Portal LED y presupuesto usan el mismo criterio de catering.** El selector de
  adultos ya no trata el catálogo completo de platos principales como si fuera un
  único menú ni suma todos sus platos. Cada plato principal es una opción. Las
  entradas, el plato adulto y el menú infantil/adolescente se transfieren como
  ítems reales al presupuesto manual y quedan incluidos en el total.
- **El total visible del Portal LED dejó de ser un aproximado incompleto.** Ahora
  suma entradas y aplica el motor central a servicios fijos, por persona, por
  ratio o por tramos. El importe flotante y el cierre muestran ese total completo.
- **El total del Portal LED se calcula después de preparar sus entradas.** Se
  corrigió el orden de declaración que TypeScript detectó en la congelación final.
- **La importación de catering al presupuesto tiene dependencias estables.** El
  efecto incluye el conversor de platos que usa, eliminando la advertencia de
  hooks y evitando cierres con referencias antiguas.
- **Hay un control financiero cruzado en Auditoría.** El botón `Revisar ahora`
  recalcula presupuestos y facturas, detecta pagos repetidos, cobros mayores al
  total, facturas duplicadas y enlaces rotos entre presupuesto, factura y fiesta.
  Es de sólo lectura: nunca cambia saldos ni documentos automáticamente.
- **Los 19 eventos reales no se declararon revisados desde JSON local.** La copia
  local no contiene esos presupuestos, facturas y fiestas. Deben verificarse con
  el nuevo control dentro de la app autenticada, donde lee los datos actuales de
  Firebase. Un resultado local vacío no sirve como aprobación contable.
- **La pantalla gigante exige evento asignado.** Dueño y perfiles autorizados
  conservan acceso. Un operador sólo puede controlar una fiesta si su usuario o
  correo coincide con un empleado incluido en `personalAsignado` de esa fiesta.
  Las votaciones de invitados siguen públicas y limitadas por frecuencia.
- **La moderación es segura por defecto.** Las fiestas nuevas y las antiguas sin
  configuración explícita dejan fotos y videos pendientes de aprobación. Sólo una
  fiesta configurada expresamente con `requireApproval: false` publica directo.
- **Google Workspace valida identidad y rol en el servidor.** La cuenta
  corporativa y el panel son del dueño; una cuenta personal sólo la conecta su
  propio empleado o el dueño; sincronizar una fiesta exige organización y acceso
  a ese evento, sincronizar todas exige administración y las citas exigen CRM.
- **Marketing ya no finge una publicación externa.** Guardar un post conserva el
  estado elegido y no lo marca como publicado mediante un `console.log`. La
  sincronización de Instagram y la agenda social exigen permiso de CRM.
- **El secreto del cron de blog viaja sólo en Authorization Bearer.** Ya no se
  acepta en la URL, donde podía quedar registrado en historial y logs.
- **Consultar un pago de Mercado Pago ya no crea acceso al presupuesto.** La ruta
  pública de estado devuelve solamente estado e importes. Para volver, el mismo
  navegador conserva localmente el enlace que ya tenía antes de ir a Mercado Pago;
  una sesión filtrada no se transforma en un token nuevo del documento.
- **El cron de recordatorios conserva la automatización sin abrir el CRM.** Las
  personas necesitan permiso para leer o crear mensajes; la tarea validada usa un
  token interno no serializable. Su secreto se acepta sólo en el encabezado y no
  queda expuesto en la URL.
- **Agenda y Google Workspace vuelven a respetar el trabajo de secretaría.** La
  sincronización de una fiesta exige organización y alcance sobre ese evento, no
  acceso a sueldos. La sincronización masiva permanece reservada al dueño.
- **La portada vuelve a ser estática con renovación cada cinco minutos.** Se quitó
  un `searchParams` sin uso que forzaba render dinámico y hacía esperar a cada
  visitante las fuentes de galería, testimonios, Instagram, YouTube y salones.
- **Evidencia del candidato congelado:** TypeScript completo quedó sin errores,
  lint sobre los archivos tocados quedó sin errores ni advertencias y 143/143
  pruebas focalizadas en 13 suites quedaron aprobadas. Las tandas anteriores de regresión
  terminaron en 99/99, 114/114, 18/18 y 104/104. La suite Jest completa se
  intentó una vez, siguió activa más de diez minutos y fue detenida por el límite
  de la herramienta sin resumen; no se cuenta como verde. El build de producción
  con datos locales siguió activo durante treinta minutos y fue detenido sin
  resumen, por lo que tampoco se declara aprobado. El E2E de producción no se
  ejecutó al no existir un build terminado en esta máquina.
- **Graphify quedó actualizado sobre el candidato.** El índice estructural contiene
  7.801 nodos, 28.664 relaciones y 377 comunidades. El parser de Graphify avisó
  20 archivos parcialmente interpretados, pero TypeScript sí compiló todo el
  proyecto; se registra como limitación del índice, no como aprobación omitida.

## Continuacion de lanzamiento iniciada en la PR #941

- **La PR #941 fue fusionada durante la validacion.** Contiene el bloque inicial
  hasta `80384e07`. Las correcciones y evidencia producidas despues quedaron en
  la PR `#942`, porque GitHub no permite agregar commits a una PR fusionada.
- **El rojo de GitHub es una limitacion aceptada.** Firestore rules, CI, browser
  smoke y CodeQL no ejecutaron pasos: GitHub anoto bloqueo de cuenta por
  facturacion. El dueno no agregara tarjeta. No se corrige con codigo.
- **No se reinicia la auditoria terminada.** La continuacion usa este documento y
  `ESTADO-ACTUAL.md` como matriz. Solo se vuelven a ejecutar controles necesarios
  para build, E2E, Firebase, roles, integraciones, entretenimiento, visual y
  rendimiento que aun no tengan evidencia de lanzamiento.
- **La continuacion tiene una sola PR abierta: #942.** No crear otra propuesta
  paralela; documentar ahi el fallo reproducido, la correccion y su prueba.
- **El build de produccion es reproducible.** Sobre el commit publicado
  `80384e07052a4245ef70a81bc69f044859e34c11`, Next genero las 265 paginas y
  termino con codigo 0 en 9 minutos 44 segundos. Las advertencias encontradas se
  mantienen separadas de los errores y se revisan en esta misma continuacion.
- **Google OAuth ya no acepta una direccion imposible.** La configuracion ahora
  detecta que falta un origen publico absoluto y rechaza `0.0.0.0` antes de
  enviar al usuario a Google. Se agrego una prueba para origen ausente,
  `0.0.0.0` y desarrollo local.
- **Instagram tiene variables documentadas.** `.env.example` incluye el token
  privado y el identificador de cuenta profesional que usa la sincronizacion
  real. No se afirma conexion sin credenciales ni respuesta del proveedor.
- **La prueba de Instagram refleja el permiso vigente.** La sincronizacion manual
  ya estaba protegida con permiso CRM, pero su prueba aun simulaba una sesion
  generica. Se actualizo el doble de prueba sin reducir la seguridad del servidor.
- **Autenticacion e integraciones tienen una tanda focalizada aprobada.** Nueve
  suites y 42 pruebas cubrieron sesion, identidad Google, correo Workspace,
  redireccion OAuth, integraciones externas, Instagram, limites de rutas,
  Mercado Pago y generacion de imagenes con Gemini.
- **Las reglas de Firestore se ejecutaron en emulador.** Las 20 pruebas aprobaron;
  los mensajes `PERMISSION_DENIED` del registro corresponden a escrituras que la
  prueba esperaba rechazar. Firebase Tools solo aviso que una version futura
  requerira Java 21; la version actual ejecuto y cerro correctamente.
- **Los proveedores en vivo siguen siendo evidencia separada.** Estas pruebas no
  afirman que Gmail envio, Mercado Pago cobro, Instagram publico ni Gemini genero
  en produccion sin credenciales validas y una respuesta real de cada servicio.
- **Portales publicos y pantallas del evento aprobaron PC y celular.** Playwright
  abrio el portal del cliente, el portal individual del invitado, la carta de
  tragos, la red social, la barra publica, el totem y el mural en vivo. No encontro
  enlaces administrativos, errores del navegador ni desborde horizontal.
- **El primer arranque lento no se confundio con un boton roto.** La primera ruta
  del portal en Next desarrollo necesito compilacion en frio y supero el limite
  de tres minutos; con la ruta compilada, el mismo recorrido de PC termino en 39
  segundos y celular tambien aprobo. Se conserva como evidencia de velocidad del
  entorno de desarrollo, no como fallo funcional de la carta de tragos.
- **El simulador aprobo su recorrido comercial en ambos tamanos.** Seis pruebas
  completaron el precio desde el simulador, el ingreso desde catalogo y la
  descarga de un PDF formal para un evento de ano futuro en PC y celular.
- **Recuperacion publica y viaje del invitado aprobaron.** Trece recorridos
  verificaron acceso protegido, recuperacion de clave, portada, campos legibles,
  confirmacion y rechazo, QR, conteo sin duplicados, sincronizacion con el equipo
  y acceso del cliente con su clave. El ultimo caso se repitio solo porque el
  servidor de desarrollo se reinicio durante la primera navegacion; la repeticion
  termino correctamente y no se cambio codigo por una caida del entorno.
- **Los accesos flotantes ya no tapan la web en celular.** La revision visual
  encontro que subir, cotizar y WhatsApp formaban una columna de casi media
  pantalla sobre la galeria. En movil quedan Cotizar y WhatsApp en una barra
  compacta inferior; subir se conserva en PC. Se elimino el gradiente violeta
  ajeno a la marca y se mantuvieron los mismos destinos comerciales. El bloque
  tambien calcula su visibilidad al montar para funcionar al volver a una
  posicion guardada o entrar desde un enlace interno.
- **Las estaciones de entretenimiento aprobaron navegador y responsive.** Las
  pantallas de operador, la camara simulada de fotocabina, la capsula con sus
  modos y marco final, y el selector tactil del espejo IA pasaron en PC; los
  casos aplicables tambien pasaron en celular. Tres pruebas de captura completa
  se omiten en movil por diseno del dispositivo, no por fallo.
- **La subida al muro responde y se recupera.** PC y celular mostraron resultado
  tras publicar y el muro no quedo girando despues de un intento fallido. La
  primera ejecucion de PC excedio el limite durante compilacion en frio; la misma
  subida, repetida sola con la ruta compilada, aprobo en 56 segundos.
- **Hardware fisico no se declara probado.** La camara simulada valida el flujo
  web, pero esta computadora no demuestra la impresora configurada, codecs de
  cada tablet, brazo fisico de plataforma 360 ni rendimiento de la red del salon.
- **El menu de mesa restaura de verdad el ultimo guardado.** La referencia existia
  pero no se leia al fallar: la pantalla restauraba el mismo borrador. Ahora se
  actualiza al cargar y al guardar con exito, y se usa ante un error del servidor.
- **Los accesos por token no quedan viejos al navegar.** Catering y fotografia
  incluyen el token actual en la carga memorizada; contrato y moodboard eliminan
  dependencias que no se utilizan. El comportamiento queda expresado sin avisos
  de hooks.
- **Los metadatos globales tienen dominio publico.** Open Graph y Twitter ya no
  resuelven imagenes contra `localhost` cuando una pantalla usa los metadatos del
  layout raiz.
- **La imagen de Bogue conserva el elemento imprimible correcto.** La tira es un
  `blob` o `data URL` generado en el navegador; se mantiene `img` de forma
  deliberada y se documenta la excepcion local para no fingir una optimizacion
  incompatible con impresion.
- **El build completo dejo solo dependencias externas conocidas.** Tras corregir
  hooks, metadatos y la excepcion de Bogue, las advertencias propias quedaron
  eliminadas. El aviso restante de Webpack nace en `express` dentro de Genkit y
  los mensajes de cache describen serializacion del compilador; no corresponden
  a una ruta rota ni se silencian desde el codigo de negocio.
- **El candidato productivo abre los modulos internos criticos.** El artefacto de
  265 paginas inicio en 5,6 segundos y Playwright recorrio dashboard,
  contabilidad, pagos rapidos, presupuestos, clientes y eventos con una sesion
  firmada, sin respuestas HTTP de error, expulsion al login, mensaje de panel
  roto ni desborde horizontal.
- **Los portales restaurados conservan el alcance de seguridad.** El planificador
  cargo el evento seleccionado y el acceso por token de proveedor mostro solo su
  trabajo asignado, sin revelar el nombre del cliente. La tanda de produccion
  completo 3/3 pruebas en 53,3 segundos.
- **La velocidad se mide en produccion local, no por compilacion en frio.** El
  primer acceso a rutas nuevas en `next dev` puede tardar minutos porque compila;
  el mismo codigo construido sirvio los recorridos internos completos en menos de
  un minuto. La portada mantiene ISR de cinco minutos para no reconstruir fuentes
  de galeria y redes en cada visita.
- **El personal no puede quedar en dos eventos al mismo tiempo.** La validacion
  usa fecha y horario local de Uruguay, contempla fiestas que cruzan medianoche
  entre dias consecutivos y permite eventos contiguos. Un choque confirmado se
  bloquea en el servidor antes de guardar y muestra todos los primeros eventos
  involucrados. Si falta una hora no inventa `21:00 a 04:00`: guarda con un aviso
  para que el encargado complete los horarios.
- **La agenda se lee una sola vez al asignar personal.** Varias personas nuevas
  se comparan contra la misma foto de fiestas activas. Editar sueldo o rol de una
  asignacion existente no vuelve a cargar toda la agenda en cada tecla. Si la
  lectura necesaria falla, no se guarda ni se envian avisos de Google; el equipo
  recibe el error y puede reintentar sin crear una asignacion sin verificar.
- **Dos servidores no pueden reservar al mismo empleado a la vez.** Un bloqueo
  corto por empleado en Firestore cubre la lectura y el guardado; si otra
  instancia ya esta actualizando esa agenda, la segunda operacion pide reintentar.
  Los bloqueos vencen solos para no dejar personal inutilizable ante una caida.
- **Los rechazos de Google Workspace quedan visibles.** Si Google responde
  `success: false` sin lanzar una excepcion, la asignacion ya guardada se conserva
  y el motivo queda registrado como aviso para poder reintentar la sincronizacion.
- **La matriz cerrada no sustituye el mundo real.** Los 19 eventos requieren
  Firebase productivo; Gmail, Instagram, Mercado Pago y Gemini requieren
  credenciales y respuesta del proveedor; impresora, camaras, codecs, brazo 360
  y Wi-Fi requieren prueba fisica en el salon. Esos puntos se dejan explicitamente
  pendientes en lugar de declararlos aprobados por simulacion.

## Puesta al dia de los eventos y el ajuste anual (12 de agosto de 2026)

- **El ajuste anual no se aplicaba a los contratos sin facturar.** La marca que lo
  activa (`ajusteAnualActivo`) se ponia en un solo lugar: al marcar el presupuesto
  como Facturado. Un presupuesto Aceptado y todavia sin facturar nunca la recibia, y
  `calcularEstadoDeCuenta` la exige para aplicar el ajuste. Resultado: la aplicacion
  mostraba el precio del anio en que se firmo. En los contratos cargados de eventos
  anteriores son miles de pesos por contrato. Ahora se completa al quedar contratado
  (Aceptado o Facturado), dentro de `normalizePresupuestoFinancials`; las
  importaciones historicas ya activan la misma marca en su flujo propio.
  **Se completa solo cuando nunca se decidio**: si el duenio lo apago a proposito
  para un cliente, se respeta.
- **Pantalla nueva "Poner al dia los eventos"**, en Auditoria y de solo lectura.
  Encuentra fiestas pasadas que siguen abiertas, eventos viejos con equipo asignado
  o tareas sin terminar, fiestas sin presupuesto vinculado, contratos de anios
  anteriores sin el ajuste anual (con cuanto se deja de cobrar) y presupuestos
  aceptados cuya fecha paso sin evento creado. No cierra ni cobra nada por su
  cuenta.
- **Correcciones de la revision de Codex, todas validas:** el saldo pendiente usa el
  estado de cuenta con ajuste (con el total pelado, un contrato pagado al precio
  viejo no mostraba nada); no se insiste con el ajuste cuando el duenio lo apago a
  proposito; se cuentan las tareas del equipo (`tareas`) ademas de la lista del
  cliente (`clientChecklist`), que son cosas distintas; y las fiestas archivadas se
  usan solo para saber que un presupuesto ya tiene su evento, sin revisarlas como si
  estuvieran abiertas.
- **Segunda auditoria contable de la misma propuesta:** el anio se toma desde la
  fecha real de firma, no desde una creacion anterior del presupuesto; el saldo
  cobrable, los recibos, pagos rapidos, dashboard, portal y Mercado Pago incluyen
  el ajuste sin modificar el total base del presupuesto; y el limite de pagos ya
  permite cobrar exactamente ese saldo ajustado. Las operaciones legales de
  cancelacion y cambio de fecha conservan el total base para no aplicar el ajuste
  dos veces.
- **La pantalla ya no duplica lecturas de Firestore.** Carga activos una vez y el
  historial por separado. Tambien enlaza cada alerta con el evento o presupuesto
  exacto para poder resolverla, y la accion tiene una prueba que impide leer datos
  si falta el permiso de Contabilidad.

## Galería, subida de archivos y editor de invitación (12 de agosto de 2026)

- **Cualquiera de afuera podía dejar archivos en el depósito de la empresa.** La
  acción que sube imágenes (`uploadPublicPageAsset`) no pedía sesión, y es la que
  usan la galería, el editor de la invitación, la portada y las fichas del
  personal. Cualquiera que conociera la dirección podía subir lo que quisiera y
  quedaba publicado con una dirección nuestra, ocupando lugar que se paga todos
  los meses. Ahora pide sesión del equipo. **Por qué se puede pedir sesión sin
  romper nada:** se revisaron todos los lugares que la usan y son todos pantallas
  internas; el invitado sube fotos por otro camino distinto (el muro social), que
  no se tocó.
- **Sacar una foto de la galería no la sacaba del todo.** Se iba de la lista pero
  quedaban dos rastros: el archivo seguía para siempre en el depósito, y la foto
  seguía apareciendo en el catálogo, porque al subirla se guarda un gemelo que
  apunta al mismo archivo. El dueño borraba una foto y el cliente la seguía
  viendo. Ahora se limpian los tres lugares. **Por qué se eligió así:** el archivo
  se borra sólo si es nuestro y si ninguna otra foto ni video lo está usando; si
  se borrara a ciegas, una foto compartida dejaría un cuadro roto en pantalla. La
  lógica está en `src/lib/galeria/borrado-seguro.ts` con pruebas propias.
- **Se podía dar por firmado un contrato sin ser del equipo.** Subir el contrato
  firmado en papel no pedía sesión, y esa misma acción marca el contrato como
  firmado y deja el evento como Contratado, que es lo que dispara la seña y la
  organización. Igual pasaba con los documentos adjuntos del evento. Las dos
  piden sesión del equipo ahora.
- **La fecha de la ceremonia se guardaba con hora universal.** En el editor de la
  invitación, el calendario de cada ceremonia guardaba la fecha con hora, y al
  volver a abrirlo mostraba el día anterior; si el equipo tocaba el calendario,
  ese día corrido se guardaba y era el que veía el invitado. Ahora se guarda el
  día suelto, igual que la fecha del evento, y se lee con `parseEventDate`.
- **Editor de invitación y vista previa (12 de agosto de 2026).**
  - **Bloque 1 — Indicador de guardado en móvil**: En `src/components/ui/auto-save-indicator.tsx` y `pagina-web/page.tsx` se ajustó la visibilidad para que en celulares se muestre el estado de guardado (íconos visibles y texto adaptado a `sm`). En caso de error de guardado, la barra muestra el ícono rojo y al tocarlo salta la explicación completa del error.
  - **Bloque 2 — Fidelidad en vista previa de plantillas**: Se removió el filtro `!isPreview` de los `EventParticles` en `GraziaTemplate.tsx` y `AllegriaTemplate.tsx` para que las animaciones de fondo se dibujen exactas en la vista previa del editor, sin afectar las restricciones funcionales de RSVP ni contadores.
  - **Bloque 3 — Verificación de datos mínimos antes de compartir**: En `pagina-web/page.tsx`, al presionar "Ver Real", copiar el enlace de la invitación, o descargar el código QR, el sistema verifica si faltan datos esenciales (fecha, hora, salón, dirección). Si faltan, no bloquea la acción sino que abre un aviso en criollo detallando qué falta, con opción de completarlo o continuar de todos modos. La función de validación `getDatosMinimosFaltantesInvitacion` fue extraída y exportada correctamente para que la prueba unitaria la ejecute sin fallos.

## El sitio no podía aparecer en Google (12 de agosto de 2026)

- **Google tenía prohibido mostrar todo el sitio.** Había una instrucción, de
  cuando la aplicación era sólo interna, que le decía a todos los buscadores que no
  indexaran ninguna página. Con eso puesto, la portada y las páginas de bodas,
  quince, cumpleaños, catálogo y blog **no podían aparecer en una búsqueda**, por
  más bien escritas que estuvieran. Ahora se abre página por página.
- **Por qué se eligió abrir de a una y no todo.** En el mismo dominio conviven las
  páginas de venta, las pantallas internas del equipo y las pantallas con datos de
  una persona: el portal del cliente, las invitaciones con la lista de invitados,
  la opinión post evento y los accesos del personal. Si se abriera todo, la fiesta
  de un cliente podría aparecer en una búsqueda. Queda **cerrado por defecto** y la
  lista de lo permitido vive en `src/lib/seo/paginas-publicas.ts`. Si mañana se
  agrega una pantalla nueva y nadie toca la lista, queda cerrada, que es el error
  barato.
- **Se agregó el listado de páginas que se le entrega a Google**, que antes no
  existía: aunque hubiera tenido permiso, tenía que encontrarlas de casualidad. Sale
  de la misma lista que los permisos, así que no puede ofrecer una página prohibida
  ni olvidarse de una permitida. Hay pruebas que verifican las dos cosas.
- **Inventario nuevo en `docs/QUE-HAY-EN-LA-APP.md`.** Qué existe de verdad en
  inteligencia artificial, redes sociales, marketing y posicionamiento, con el
  estado de cada cosa. **Se lee antes de salir a inventariar nada**, para no volver
  a auditar lo mismo; cuando se toca algo de esa lista, se actualiza ahí mismo.

## Testimonios reales y recontacto del que no señó (12 de agosto de 2026)

- **La presentación que se le proyecta al cliente mostraba testimonios inventados.**
  La aplicación junta opiniones reales y el dueño las aprueba una por una, y esas
  aprobadas ya salían en la portada, pero la pantalla grande —donde más venden—
  seguía con una lista escrita a mano. Ahora usa las reales aprobadas.
- **Por qué se controla dos veces que estén aprobadas.** La consulta ya devuelve
  sólo las aprobadas, y `src/lib/testimonios/para-mostrar.ts` vuelve a filtrar. Es a
  propósito: **una opinión mala nunca se publica** (orden del dueño), y si alguien
  cambia la consulta o le pasa la lista completa por error, igual no se cuela.
  Mientras no haya ninguna aprobada se muestran las de ejemplo, para no dejar la
  pantalla vacía en medio de una venta.
- **El recontacto del que pidió presupuesto y no señó estaba escrito y apagado.**
  La función y el mensaje existían desde hacía tiempo pero **ningún lugar del código
  la llamaba**: trabajo hecho que no rendía nada. Ahora corre dentro del marketing
  automático, cada seis horas.
- **Por qué viene apagado de fábrica y con un interruptor en Ajustes.** Son mensajes
  de WhatsApp a clientes reales y no se pueden deshacer; nadie los dispara por
  sorpresa al publicar una versión nueva. El interruptor es sólo para el
  administrador. Las reglas de a quién se le escribe viven separadas del envío, en
  `src/lib/marketing/candidatos-recontacto.ts`, con pruebas propias: pasaron 48
  horas, dio permiso de marketing, **una sola vez en la vida**, nunca a quien ya
  contrató ni a quien está en una etapa terminada del embudo. Se anota la marca sólo
  a los que recibieron el mensaje de verdad, así un envío fallido no pierde al
  prospecto.

## Planificador de redes y ficha de negocio para Google (12 de agosto de 2026)

- **El planificador decía "Publicado" sobre algo que la app no publicó.** Lo que se
  importa de Instagram ya está publicado *en Instagram*, pero en el planificador se
  leía como si la aplicación lo hubiera publicado, y la aplicación **no publica en
  ninguna red**: el contenido se redacta acá y se copia y pega a mano. Ahora esos
  quedan como "Importado de IG", con color propio, separados de lo que el equipo
  todavía tiene que publicar.
- **La ficha de negocio para Google** (nombre, dirección, teléfono, coordenadas de
  Salto y redes) estaba sólo en la portada. Ahora también está en bodas, quince,
  cumpleaños y el blog, que son las páginas que traen clientes.
- **Por qué la ficha del blog apunta a `/public/blog` y no a `/blog`.** `/blog`
  sólo redirige, y además está fuera de la lista de páginas que Google puede mirar.
  Apuntar la ficha a una dirección prohibida no sirve de nada.

### Lo que se descartó de esa propuesta, y por qué

La propuesta traía además su propia versión de los testimonios reales y del
recontacto del que no señó, que **ya estaban hechos y fusionados** poco antes. De
haberla tomado entera, habría borrado el filtro doble que impide publicar una
opinión mala, las reglas probadas de a quién se le puede escribir por WhatsApp y
sus veinte pruebas. Se rescató sólo lo de arriba. Tampoco se tomó un segundo
interruptor de recontacto en la pantalla de WhatsApp: ya hay uno en Ajustes →
Contenido público, y dos interruptores para lo mismo confunden y se contradicen.

## Control de gasto de la inteligencia artificial (12 de agosto de 2026)

- **Nadie avisaba cuánto se gastaba por mes.** Los topes que ya existían (tres
  intentos por invitado, ciento cincuenta por hora por estación) frenan el abuso de
  una persona, pero con cuatro fiestas grandes seguidas el gasto se notaba recién en
  la factura, cuando ya estaba gastado. Ahora se cuenta cada foto con efecto y se ve
  en Ajustes → Contenido público, con el gasto estimado del mes.
- **Se puede poner un tope en pesos**, y al llegar al 80% avisa antes de que se
  dispare.
- **Por qué al llegar al tope no se corta nada.** La fotocabina y el espejo siguen
  andando: sacan la foto igual, con el efecto simple, sin gastar. Es el mismo camino
  que ya existía para cuando el servicio no está configurado. **Nunca se le corta la
  foto a un invitado por una cuestión de plata**, y menos en medio de una fiesta.
- **Por qué ante un error de lectura se deja gastar.** Quedarse sin efectos toda una
  noche por un problema al leer el contador es peor que gastar de más una vez. Lo
  mismo al anotar: si falla el guardado, la foto sale igual y se pierde un número del
  contador.
- **Se guarda un contador por mes y no un renglón por foto**, para no llenar la base
  con miles de registros en una sola fiesta.
- El costo por generación es una **estimación** para ver la tendencia y frenar a
  tiempo, no la factura del proveedor. Está en `src/lib/ai/consumo.ts` y se cambia
  ahí si cambia el precio.

## Títulos para Google en las pantallas públicas (12 de agosto de 2026)

- **Faltaba título y descripción propios** en la experiencia AK, la galería LED, la
  presentación de tecnología, el portafolio y el catálogo. Google mostraba esas
  páginas sin nombre propio.
- **Por qué el del catálogo va en la envoltura y no en la pantalla.** El catálogo se
  dibuja del lado del navegador, y esas pantallas no pueden declarar título. Va en
  `src/app/catalogo/layout.tsx`.
- **No se abrió ninguna página nueva a Google.** La lista de lo permitido sigue
  igual, cerrada a propósito, en `src/lib/seo/paginas-publicas.ts`. Poner título en
  una pantalla interna no la publica: sólo mejora el nombre de la pestaña.

## Las cuatro ideas grandes (12 de agosto de 2026)

Llegaron de una propuesta de Gemini que **no compilaba** y traía dos cosas graves.
Se repararon y se fusionó. Quedó andando:

- **El mensaje de recontacto ahora lo escribe la inteligencia artificial** con los
  datos de esa persona. Si el servicio falla o se llegó al tope de gasto, **manda el
  mensaje de siempre**: nadie queda sin mensaje ni recibe uno a medio escribir.
- **Asistente de ventas en las páginas públicas**, apagado de fábrica.
- **Video del recuerdo** por evento, armado con las fotos del muro. Sólo entra
  contenido aprobado, porque lee la lista pública que ya filtra por aprobación.
- **Repaso de la mañana** en el panel interno: reusa el reporte de "Poner al día" y
  esconde los cobros a quien no tiene el permiso de Contabilidad.

### Lo que hubo que corregir, y por qué

- **El asistente de ventas aparecía en TODA la aplicación.** Se filtraba con una
  lista de pantallas prohibidas, incompleta: el globito de ventas salía encima de la
  invitación de un casamiento, del portal de un cliente que ya contrató, de las
  estaciones de la fiesta y de la presentación proyectada en el salón. Ahora es al
  revés, **lista de lo permitido**: sólo las páginas de venta, las mismas que ve
  Google. Una pantalla nueva queda sin asistente por defecto, que es el error
  barato. Está en `src/lib/public-experience/donde-va-el-asistente.ts` con pruebas.
- **Daba por dado el permiso para escribirle al cliente.** Guardaba
  `marketingConsent: true` fijo cada vez que llegaba a armar el presupuesto, sin
  importar lo que la persona hubiera contestado. Ese permiso es justo lo que
  habilita mandarle WhatsApp automático después. Ahora se exige que el resumen lo
  marque **y** que la última respuesta de la persona sea un sí. Si no, el dato se
  guarda igual pero sin permiso: se pierde poder escribirle solo, que se arregla
  llamándola, y no al revés.
- **No se arma el presupuesto desde el chat.** La propuesta lo intentaba inventando
  los datos que espera la función real (subtotal, costo estimado, servicios
  incluidos), que son las cuentas que el cliente ve como precio firme. Sacarlas de
  una conversación es inventar plata. El dato del interesado se guarda y el equipo
  arma el presupuesto donde esas cuentas están bien hechas.
- **Dos textos de venta cambiados sin pedirlo**, y a peor: el cierre del asistente
  pasaba de invitar a una reunión a un simple "ya anotamos tus datos". Se devolvieron
  los originales.
- **La segunda llamada a la inteligencia artificial no se contaba** en el gasto. Ya
  se cuenta.
- Errores mecánicos reparados: nombres de campos inexistentes en tres lugares, y la
  pantalla del video declaraba mal sus datos, lo que hacía fallar la publicación
  aunque el revisor de tipos pasara.

## Ganancia real y comparación entre fiestas (12 de agosto de 2026)

- **La ganancia se mostraba contra el gasto estimado, no contra el real.** El
  Analizador de Rentabilidad calculaba lo cobrado menos lo que se *estimaba*
  gastar. Los pagos a proveedores se registraban aparte y no entraban en la cuenta,
  así que **si el evento se iba de gasto, el número seguía viéndose lindo**. Ahora
  manda lo que se pagó de verdad en cada renglón que tenga pagos cargados, y donde
  no hay pagos se usa el estimado. La tarjeta dice cuál de las dos cosas está
  mostrando, en vez de decir siempre "estimada".
- **Pantalla nueva: "Qué fiesta deja más plata".** Compara todas las fiestas juntas,
  agrupadas por tipo de evento y por mes. Entra desde el Panel Contable. El
  analizador de siempre muestra una fiesta por vez; esto contesta la pregunta que
  decide qué conviene vender.
- **Por qué la cuenta vive en un solo archivo** (`src/lib/costos/ganancia-evento.ts`):
  antes cada pantalla la rehacía y dos mostraban números distintos de la misma
  fiesta, porque una se olvidaba de descontar la merma de bebidas, que viene contada
  dos veces en los datos. Ahora las tres pantallas usan la misma suma y las dos
  trampas conocidas están resueltas ahí adentro, explicadas: la merma duplicada y
  el costo de proveedores, que ya está dentro de los renglones y no se suma aparte.
- **Por qué el margen de un grupo se calcula sobre los totales** y no promediando
  los porcentajes de cada fiesta: promediar le daría el mismo peso a una fiesta de
  diez personas que a una de trescientas.
- **Un pago que no corresponde a ningún renglón igual se cuenta** como plata que
  salió. Esconderlo mostraría una ganancia que no existe.
- La pantalla avisa cuántas fiestas todavía no tienen pagos cargados, para que se
  sepa qué parte del número es estimación.
- Pide el permiso de Contabilidad, no alcanza con tener sesión: se ve lo que se le
  cobró a cada cliente y lo que dejó cada evento.

## La seña se cobraba de menos (12 de agosto de 2026)

- **El botón "Pagar seña" cobraba siempre $5.000**, sin mirar la seña acordada con
  ese cliente. Ese número era el valor de último recurso, pensado para cuando no hay
  ningún dato. En un evento grande el cliente apretaba, pagaba cinco mil pesos, y la
  reserva quedaba señada con una fracción de lo acordado. La diferencia aparecía
  mucho después, al ir a cobrar el resto.
- **Lo peor: la aplicación ya sabía el número correcto.** El resumen que se le
  muestra al cliente antes de firmar usa la seña acordada, o el 20% del total. Eran
  dos lugares distintos diciendo cosas distintas sobre la misma plata.
- **Ahora la cuenta vive en un solo lugar** (`src/lib/budget/monto-de-senia.ts`) y la
  usan el botón y el cobro: primero la seña acordada con ese cliente; si no hay, el
  monto general. Nunca se cobra más que el saldo pendiente.
- **Decisión del dueño, 12 de agosto de 2026: la seña es un monto fijo, hoy $5.000,
  no un porcentaje del evento.** Se le preguntó expresamente. Si alguna auditoría
  marca que "la seña debería seguir al tamaño del evento", es falso positivo.
- **El monto se edita desde Ajustes → Presentación del presupuesto**, así que el día
  que suba no hay que tocar código ni pedirle nada a nadie. Empieza en $5.000.
- **El botón y el cobro leen la misma cuenta**, a propósito. Si el botón dijera un
  número y se cobrara otro, el cliente pierde la confianza justo en el momento en
  que está reservando.

### Falsa alarma verificada

Se reportó que "el cliente no puede pagar solo, la función está desconectada de la
pantalla". **Es falso:** el botón de Mercado Pago existe y el cliente lo usa desde
su presupuesto, con seña y saldo, en cuotas. Y el aviso de pago acreditado entra
solo por el webhook, que verifica la firma y actualiza el saldo sin que nadie toque
nada. Lo único que estaba mal era el monto.

## Sin usuario se veía plata, y una prueba que no probaba nada (12 de agosto de 2026)

- **Preguntar por los permisos de alguien que no existe devolvía los de secretaria**,
  que incluyen ver contabilidad. Venía de la conversión de las cuentas viejas: el que
  no tiene perfil cargado se trata como secretaria, y eso está bien para una cuenta
  de verdad, pero no para la ausencia de cuenta. Una pantalla que preguntaba antes de
  terminar de cargar la sesión mostraba números que no le correspondían. Ahora sin
  usuario no se puede nada. **La conversión de las cuentas viejas no cambió.**
- **La regla de qué contenido del muro se muestra estaba copiada en nueve lugares**
  distintos: el listado público, el tótem del salón, el muro en vivo, la impresión y
  el video del recuerdo. Nueve copias de la regla que decide si una foto sin revisar
  aparece proyectada delante de toda la fiesta; alcanzaba con que una quedara vieja.
  Ahora vive en `src/lib/social-fiesta/visibilidad.ts` y las demás la usan.
- **Se reescribió una prueba que no podía fallar.** Armaba una lista inventada
  adentro de la prueba y después la filtraba ahí mismo, así que probaba su propio
  filtro y no el de la aplicación: si el video hubiera dejado de descartar las fotos
  pendientes, seguía en verde. Ahora llama a la función de verdad. Una prueba que no
  puede fallar es peor que no tener prueba, porque el que la lee cree que la regla
  está protegida.

## Reseñas de Google y plan de la noche del equipo (13 de agosto de 2026)

- **El pedido automático de reseña no se mandaba nunca.** El cliente contesta la
  encuesta sin estar logueado, y el envío buscaba el teléfono con una función que
  exige sesión del equipo: se caía siempre en silencio. El dueño habría prendido
  el interruptor y no habría salido un solo mensaje. Ahora el teléfono se lee del
  lado del servidor, sin pedir sesión, y sólo se usa para mandarle el WhatsApp a
  esa persona.
- **Se le podía escribir dos y tres veces por la misma fiesta.** La encuesta es
  pública y se puede contestar hasta tres veces por día; cada respuesta con nota 9
  o 10 disparaba su propio mensaje. Ahora se mira si a esa fiesta ya se le pidió la
  reseña: si sí, no se vuelve a escribir. Vale para el envío automático y para el
  botón manual.
- **Sólo a promotores y sólo si hay enlace.** Con nota menor a 9 no sale nada, con
  el enlace de Google vacío tampoco, y el interruptor viene apagado de fábrica.
  Hay pruebas para las cuatro puertas.
- **Una prueba que fallaba sola.** Las pruebas de este bloque preparaban respuestas
  "de un solo uso" que no se consumían y se filtraban a la prueba siguiente,
  haciéndola fallar sin que hubiera nada roto. Ahora las respuestas quedan fijas
  por prueba.
- **El plan de la noche no muestra sueldos.** Cada persona del equipo ve su propio
  rol, la hora, el lugar, el teléfono del encargado y el programa de la fiesta. No
  ve lo que cobra ni lo que cobran los demás, y hay una prueba que lo cuida.
- **La documentación tenía 427 acentos rotos.** `docs/YA-RESUELTO.md`, que es
  justamente lo que todos leen antes de auditar, estaba lleno de "auditoría" y
  "dueño". Pasó desapercibido porque la revisión completa de acentos sólo miraba
  el código, no la documentación. Reparado, y la revisión ahora mira también los
  documentos para que no vuelva a pasar.
## Los logos de las empresas, de verdad (13 de agosto de 2026)

- **Ahora son los reales y viven adentro de la aplicación.** Se sacaron del catálogo
  impreso de la empresa, recortados uno por uno y verificados a ojo antes de
  nombrarlos: Correo Uruguayo, Salto Hotel & Casino, Plus Medical, A.S.DE.M. y A.,
  Woslen, APC Salto, INC, Antel, ABRA, INAU, Intendencia de Salto y Club Uruguay.
  Los doce, cada uno con su nombre visible en pantalla.
- **Por qué no se cargan más desde afuera:** venían del sitio de Canva de la
  empresa. Si esa página cambiaba o se caía, los logos desaparecían en medio de la
  presentación, delante del cliente.
- **Dos cosas que ya salieron mal y no se repiten** (hay pruebas que las cuidan):
  no se dibujan logos —una entrega los reemplazó por rectángulos de color con el
  nombre escrito en una tipografía cualquiera, que no es el logo de nadie y usa mal
  la marca de un tercero—, y no se adivina qué nombre va con qué logo.
- Se pueden reemplazar y sumar clientes nuevos desde Ajustes → Contenido público.
- **Se borró `quienes-somos-slide`**, que quedaba muerta al lado de la pantalla del
  equipo. Estaba terminada pero nunca enganchada a la presentación.

## Lo común de los tres catálogos se perdía por tipo de fiesta (13 de agosto de 2026)

- **Los tres catálogos de la empresa comparten casi todo y cambian pocas cosas**
  (sobre todo las fotos). Así está armado el contenido de la presentación: un bloque
  común y, por tipo de fiesta, sólo la diferencia.
- **El problema:** se devolvía el bloque del tipo de fiesta **entero**, no combinado
  con el común. Todo lo que ese bloque no tuviera cargado quedaba vacío. La pantalla
  del equipo salía sin título ni frase en **todos** los tipos conocidos —casamiento,
  quince, cumpleaños— y sólo se veía bien cuando el tipo no estaba en la lista, que
  es justo al revés de lo que uno espera.
- **Ahora se combinan:** lo común primero, y encima lo propio de ese tipo. Cargar un
  tipo nuevo es escribir sólo lo que cambia. Hay pruebas que lo cuidan.
- Los doce logos de empresas **son los mismos en los tres catálogos**, verificado
  mirándolos: alcanza con un solo juego para todos.

## Infantiles y empresariales, sin catálogo impreso (13 de agosto de 2026)

- **El dueño no tiene catálogo de fiestas infantiles ni empresariales**, y no hace
  falta: la presentación ahora **saca las fotos de la galería** según el tipo de
  fiesta. Cada fiesta que el equipo sube mejora la presentación sola, y sirve para
  cualquier tipo que se agregue en el futuro.
- **El detalle que lo habría dejado sin funcionar:** la presentación y la galería no
  llaman igual a las mismas cosas. La presentación dice "Empresarial" y la galería
  "Corporativo"; la presentación escribe "Cumpleaños infantil" con minúscula y la
  galería con mayúscula. Buscar tal cual no traía **ninguna** foto, y la pantalla
  quedaba vacía **sin dar ningún error**: nadie se entera hasta que está vendiendo.
  La traducción vive en `src/lib/presentacion/fotos-por-tipo.ts`, en un solo lugar y
  con pruebas.
- **Si para un tipo no hay fotos cargadas, se muestran las generales.** Es mejor una
  foto linda de otra fiesta que una pantalla vacía delante del cliente.
- **Lo que cargue el dueño manda siempre**: las fotos de la galería son el respaldo,
  no el reemplazo.
- Se escribieron los textos propios de los dos tipos. El de empresariales apoya en
  las empresas para las que ya se trabajó, que es el argumento que decide una
  contratación corporativa; el de infantiles habla al padre, no al chico: le promete
  que él va a poder disfrutar a su hijo en vez de estar trabajando.

## Sueldos, empresa y la noche de la fiesta (13 de agosto de 2026)

Primera auditoría de tres módulos que nunca se habían revisado.

### Arreglado

- **Un recibo del personal ya pagado no se puede cambiar.** Se podía editar el
  monto y la fecha de un recibo marcado como pagado o con el papel firmado
  subido, sin dejar rastro: en una revisión no había forma de saber si se le
  pagó mil o cinco mil. Ahora quedan cerrados el monto y la fecha, y no se puede
  volver a "pendiente". **El estado sí puede seguir avanzando** (pagado → con
  recibo firmado), que es el camino normal. Bloqueado en el servidor y mostrado
  en gris en la pantalla, para que no falle recién al guardar.
- **Un menú sin platos no se guarda.** Se podía crear vacío y después aparecía
  para elegir en un presupuesto: el cliente contrataba un menú sin comida.
- **Un salón sin capacidad no se guarda.** Un salón para cero personas no sirve
  y aparecía igual al armar un presupuesto.

### Verificado y sano, no lo vuelvas a reportar

- **Los sueldos están bien protegidos.** No hay doble pago por empleado y fiesta,
  los importes negativos se rechazan en el servidor, el cálculo protege la
  división por cero, y **sólo con el permiso de sueldos se ven los sueldos**.
- **Los borrados de empresa están bien cuidados**: no se puede borrar un menú, un
  servicio, un insumo ni un activo que esté en uso en presupuestos, fiestas,
  recetas o listas de carga. Los gastos generales rechazan importes en cero.
- **Las pantallas de la noche manejan bien los cortes de internet**, salvo tres:
  la pantalla gigante, la galería y el tótem reintentan solas. Los centros de
  mando se arman en el servidor. **No hay datos internos a la vista del invitado
  ni errores en jerga en las pantallas grandes.**

### Lo que quedó para Gemini

`docs/ordenes/pantallas-de-la-noche.md`: la pantalla de impresión sigue mostrando
fotos viejas cuando se corta internet y el operador no se entera; la presentación
no se recupera sola; y el aviso del tótem es demasiado chico.

### Pantallas sueltas — auditadas el 13 de agosto de 2026

- **Alertas, incidentes, aprobaciones, calendario, auditoría, playbooks y
  eventos están sanas.** Se revisaron las siete: manejan errores con aviso,
  cargan bien, usan formato uruguayo de fecha y moneda. **No las vuelvas a
  auditar sin motivo.**
- **En aprobaciones quedaba un texto que decía "(ARS)"** cuando el sistema
  trabaja en pesos uruguayos. Figuraba como corregido en esta misma lista pero
  ese cartel se había salteado. Ya dice "pesos uruguayos".
- **Incidentes, aprobaciones y playbooks no las enlaza nadie.** Funcionan bien,
  pero sólo se llega escribiendo la dirección: no hay botón en el menú ni en el
  panel. **No las borres**: falta que el dueño decida si se conectan o se
  retiran.

### Portales del cliente y del invitado — auditados el 13 de agosto de 2026

- **La distribución de mesas era pública y mostraba los invitados de cualquier
  fiesta.** `/portal` es público porque ahí vive el portal del invitado, y mesas
  colgaba de ese mismo prefijo, pero es una herramienta del EQUIPO. Con poner
  `/portal/mesas?fiestaId=...` se veía la lista entera de invitados de esa
  fiesta, con sus datos, sin estar logueado: `getFiestaById` sin sesión sólo
  borra la clave de acceso y devuelve todo lo demás. Cerrado agregándola a
  `PROTECTED_EVENT_ROUTES`, con prueba (`mesas-no-es-publica.test.ts`).
  **Ojo con esto al agregar pantallas del equipo bajo `/portal`: hay que sumarlas
  a esa lista o quedan abiertas.**
- **El resto de los portales está bien.** Se revisaron los tres (el del invitado,
  el del cliente con clave y las vistas pública y Pro): la validación de la clave
  es correcta, no se filtran sueldos, costos, márgenes ni notas del equipo, el
  guardado avisa cuando falla y los formularios no pierden lo cargado si se corta
  la conexión.

## Ajustes y empresa, lo último sin auditar (13 de agosto de 2026)

Con esto **queda auditada la aplicación entera**.

### Arreglado

- **Los datos de la empresa no se pueden dejar vacíos.** Se podía borrar el
  nombre o el RUT y guardar: el contrato y la factura del cliente salían con el
  renglón en blanco y nadie se enteraba hasta tenerlos sobre la mesa.
- **Una cuenta bancaria a medias no se guarda.** Sin banco, titular o número, el
  cliente no sabe adónde transferir y termina llamando para preguntar.
- **Los insumos y los activos no aceptan cantidades ni costos negativos.** El
  `min` del formulario lo controla el navegador y se saltea; un negativo se
  arrastra al costo de la comida en todos los presupuestos.
- **Se avisa cuando la receta y el catálogo usan unidades que no se pueden
  convertir.** El cálculo sólo sabe pasar de gramos y mililitros a kilos y
  litros. Si la receta pide "2 tazas" y el insumo está en gramos, multiplicaba
  como si fueran lo mismo y el costo del plato salía mal, en silencio.
  **Decisión: se avisa, no se inventa la conversión** — nadie puede saber cuánto
  pesa una taza de ese ingrediente. Vive en `src/lib/catering/unidades.ts` con
  seis pruebas.

### Verificado y sano, no lo vuelvas a mirar

- **Ajustes está bien**: la pantalla de presupuestos, el respaldo (con
  confirmación al restaurar), el reinicio de datos, Google Workspace y las
  sincronizaciones manejan bien los errores.
- **Los borrados de empresa siguen protegidos**: no se puede borrar un
  proveedor, insumo, menú, servicio ni activo que esté en uso.

### Lo que quedó para Gemini

Las promociones se pueden crear sin fechas y el contador de la web no arranca.
Va en `docs/ordenes/ahora.md`.

### Las órdenes de trabajo se ordenaron

Había **quince archivos con 2700 líneas**, casi todos cumplidos, sin forma de
saber cuál seguía vivo. Ahora hay **una sola vigente, `docs/ordenes/ahora.md`**,
y el resto está en `docs/ordenes/hechas/` como historia. **Cuando una orden se
termina, se mueve a `hechas/` en la misma propuesta.**

## Cómo agregar algo a esta lista

**Se anota SIEMPRE, en la misma propuesta que toca el código.** Orden del dueño
del 9 de agosto de 2026: no depende del tamaño del cambio ni de si parece
importante. Una propuesta que toca código y no toca esta lista está incompleta.

Se anotan las tres cosas, no sólo los arreglos:

- **Arreglos** — qué estaba mal y qué se hizo.
- **Mejoras y cosas nuevas** — cómo funciona y **por qué se eligió así**.
- **Falsos positivos verificados** — que quedaron descartados y el motivo, para
  que la próxima auditoría no los vuelva a reportar.

Sumá una línea en el módulo que corresponda. Con esto alcanza:

- **Qué se arregló**, en una frase, en criollo.
- **Dónde**, si sirve para ubicarlo.
- **Si la decisión tiene un porqué que no se ve en el código, escribilo.** Ese es
  el dato que evita que otro lo "arregle" al revés.
