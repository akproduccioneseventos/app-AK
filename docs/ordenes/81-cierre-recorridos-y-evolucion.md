# Estado prioritario25/09: cobertura integral

Continuar esta orden sin crear modulos duplicados. [Matriz y cierre vigente](../auditoria/CIERRE-INTEGRAL-2026-09-25.md). Main512eca7 corrige BAR01/INC01/PF02/LOG01 en sondas; no rehacer. LOG04 presente en PR1225 con4 sondas aprobadas, movil pendiente E2E. VID03 ZIP sigue abierto. Inventarios completos adjuntos no son pruebas ejecutadas; cerrar cada recorrido con evidencia de uso. No afirmar cero errores ni acusar al hardware sin diagnostico.

# Orden 81 - Cierre por recorridos y evolucion util, sin duplicar AK

Fecha: 2026-09-23. Autorizacion del dueno: "hace todo, acuerdate para claude y gemini programa".
ESTADO: orden entregada; implementacion y pruebas de esta orden PENDIENTES. No equivale a auditoria ejecutada.

## Base y contraste obligatorio
Main: 2f413228cf97dce5cef6f6bb818c504ec66cef74.
PR abiertas consultadas y lista de archivos contrastada:
- 1214 / 5065be7e0f2216be5d2617545dcebfd3e0c1e4fe: secretario y salon3D; no duplicar la devolucion de seis E2E.
- 1207 / 29943cdd80ed7c14ceabc650544eb2aa304516a2: memoria/persistencia; NO aumentar recursos.
- 1206 / 129c1988efed26eb1519fa7926274bf14504f0f8: decoracion/avisos/permisos.
- 1202 / 6622427c604930b02910a2a2778bf20a72683f40: marketing/entretenimiento; solapa fotocabina, Touchpix, invitado y recorridos E2E.
- 1197 / f0ac2027b7e25dc6845e1230fba60b0c9055ddb3: web/blog; solapa parte de1202.
Este contraste es de archivos y registros, NO aprobacion de esos diffs. Antes de editar: traer HEAD vigente y comparar simbolos con las tandas; marcar presente/validado/pendiente. No copiar ramas enteras ni cerrar PR por esta orden.

## Responsables y entrega
Codex revisa evidencia y propone, sin programar la app. Gemini programa interfaz/recorridos/entretenimiento. Claude programa dinero, cobros, comida, permisos e integridad de datos y compila el conjunto. Cada IA usa su rama; coordinar archivos compartidos.
Una entrega integrada de la tanda, sin una PR por bloque; dejar abierta para el dueno. No fusionar ni contratar servicios. Incluir YA-RESUELTO, ESTADO-ACTUAL y matriz de evidencia. No declarar que escribir esta orden inicia otra IA.

## A. Cierre de auditoria por resultados
Reconciliar la matriz en docs/auditoria/81-matriz-recorridos.md con evidencia previa vigente; rellenar SOLO huecos o cambios. Abrir aplicacion de prueba por rol, no conformarse con imports/archivos existentes. Inventario de pantallas no equivale a recorridos.
Cada resultado exige SHA, entorno, rol, fixture, pasos, esperado, observado, captura/log, prueba, limites y responsable. Se permite estado NO PROBADO; no aprobacion por defecto ni porcentaje artificial.
Utilizar sesion completa del equipo segun helper existente (cookie y estado navegador). Si este navegador bloquea acceso, usar entorno E2E/local autorizado con cuentas de prueba; nunca desactivar permisos ni endurecer el acceso publico aprobado para salvar una prueba.
Probar flujos de la matriz: venta, organizacion, cuentas, cliente/invitado, entretenimiento, conexiones y visual/rendimiento. Mantener 19 presupuestos manuales intactos; no convertirlos en leads ni inventar cobros. Casos monetarios con fixtures y resultados calculados independientemente.

## B. Completar continuidad sin internet EXISTENTE
Ya existen saveOfflineMedia, processOfflineMediaQueue, SyncStatusIndicator y colas de acciones. YA-RESUELTO registra capturas offline y recepcion/mural/barra. No implementar otro sistema offline ni declararlo ausente.
Gemini verifica captura -> guardado local confirmado -> cierre/reapertura -> reconexion -> entrega unica; incluir cuota agotada, permisos camara, token vencido, doble pestaña y cambio de fiesta. Respuesta tardia de A no modifica captura B. No borrar cola por un intento fallido.
Mostrar guardado en este dispositivo / pendiente / entregado / requiere atencion, sin anunciar nube ni QR accesible si no existe. Explicar limite de almacenamiento local y equipos compartidos de forma breve.
Claude define idempotencia, autorizacion al reenviar y reconciliacion. No guardar secretos o informacion contable en caches publicas. Cerrar sesion no debe entregar recuerdos a otro invitado.
NO permitir cobros, confirmacion de stock, aceptacion contractual o validacion de entrada global "definitivos" sin servidor. Recepcion sin red puede registrar pendiente y reconciliar duplicados; no prometer consistencia entre equipos desconectados.

## C. Entrega de recuerdos sin ocupar la cabina
Reutilizar src/app/evento/galeria/[fiestaId]/page.tsx y capacidades existentes antes de crear rutas. Revisar si ya resuelve una segunda pantalla de entrega; si si, probar y mejorar acceso, no duplicar.
Objetivo: invitado A retira su recuerdo mientras B usa la camara. Vista de operador separada; enlace limitado a lo autorizado. No exponer album privado completo por entregar una foto.
Aceptacion con dos contextos de navegador: foto A, sesion B activa, entrega A sin reiniciar B; error/reintento sin duplicado; QR escaneable desde otro dispositivo y aislamiento entre fiestas. No confundir QR que contiene URL con transferencia sin internet: entrega local tipo Scanpix requiere mecanismo y prueba reales. No instalar Touchpix ni pagar licencias por esta orden.

## D. Interaccion coordinada y prueba previa de equipo
El show-control ya REDIRIGE al Centro de Fiesta. NO reabrir otro tablero.
Gemini utiliza Centro, control de entretenimiento y herramientas de votacion/musica existentes. Una interaccion activa, accion del operador para abrir/cerrar y pantalla publica sincronizada. Integrar enlaces/estados faltantes, sin nuevo motor de encuestas ni ranking no pedido.
Claude revisa aislamiento por fiesta, permisos de operador, moderacion y limites. Invitado no recibe botones de administrador; contenido pendiente no se proyecta. Probar recarga, dos operadores, fin de votacion y reconexion.
Agregar o completar comprobacion previa DENTRO del centro existente: camara/microfono solicitados explicitamente, pantalla correcta, conexion, almacenamiento, captura y recuperacion de prueba. Barra con fixture/sandbox sin consumir stock real.
Cada comprobacion: no probado / paso / fallo / requiere equipo, fecha, dispositivo y accion de reintento. Configuracion presente NO significa prueba pasada. Estado no se hereda al cambiar dispositivo/fiesta; no medir red solo por navigator.onLine.
Ensayo fisico fotocabina/360/barra sigue pendiente hasta conectarlos. Describir dependencias soportadas; no simular hardware para certificarlo.

## E. Venta, estetica y velocidad
No rediseño indiscriminado. Gemini completa recorridos con capturas desktop/movil/totem y corrige solo fricciones reproducidas. Reusar motion/tokens existentes; movimiento visible con reduccion de movimiento, sin bloquear CTA ni sacrificar escritura/scroll.
Fotocabina,360,espejo visibles sin "ver mas". No introducir cuenta atras falsa, promocion sin condiciones ni imagen generada presentada como evento real.
Web/paquetes/menu: imagen-texto con fuente verificada; no reasignar automaticamente por nombre dudoso. En presupuesto no mostrar etiquetas comerciales "destacado". Presupuesto formal, pantalla/PDF mismos importes, paginas numeradas y legibles sin recortes.
Prospecto de Facebook/Instagram como origen principal; conservar atribucion al CRM. Varios presupuestos para mismo telefono sin pisarlos. Paquete cambia -> ofertas excluyen incluidos/regalos y se recalculan; total actual, proyeccion anual separada y monto por persona coherente.
No cambiar formulas financieras ni regalos/descuentos: Claude revisa. No publicar analytics con datos personales o grabaciones de sesiones sin control/consentimiento que corresponda.
Medir tiempos reales antes/despues en condiciones iguales: navegacion, imagen principal, pulsacion/escritura, PDF y carga de datos. Registrar herramienta/dispositivo/red y ejecuciones; no inventar INP de usuarios a partir de una captura.

## F. Integraciones y lanzamiento
Inventariar todas las conexiones realmente declaradas en codigo/configuracion: Google/Gmail, WhatsApp, Meta/Instagram/Facebook, TikTok, YouTube, Mercado Pago, Gemini y proveedores de entretenimiento. No afirmar soporte si solo hay enlace a perfil.
Por conexion: uso real, cuenta de prueba, permiso, vencimiento, ultima operacion confirmada, callback/webhook duplicado o fuera de orden, revocacion y recuperacion. No publicar, enviar mensajes ni cobrar a personas reales. Lo que necesita credenciales/hardware queda identificado, no aprobado.
No sumar suscripciones, plugins, servidor, modelo de IA ni actualizacion automatica de modelo. Mantener decisiones de costos y seguridad.
Claude primero resuelve residuales de orden80 segun CIERRE-CONTRASTE-2026-09-23.md; esta orden NO los duplica. Congelar cambios y compilar/testear conjunto una vez; guardar SHA exacto. Codex revisa solo resultados y diferencias afectadas.
No mezclar mejoras opcionales incompletas con declaracion de salida. Cierre por matriz: cada bloque probado, bloqueado o pendiente con razon; nunca "cero errores" por conteo de tests.

## Referencias de producto, no dependencias
- Touchpix: continuidad offline y limites de entrega https://intercom.help/touchpix/en/articles/14690556-pre-event-checklist-tips
- Touchpix: segunda pantalla de entrega https://intercom.help/touchpix/en/articles/9791632-how-to-set-up-a-sharing-station
- Cvent: entrada offline y limites de sincronizacion https://support.cvent.com/articles/en_US/FAQ/Does-OnArrival-work-without-internet
- Slido: participacion QR y resultados https://www.slido.com/conferences
Consultadas 23/9/2026. Adoptar patrones utiles, no copiar marcas ni contratar plataformas. Funciones similares en AK se validan, no se reconstruyen.

## Comprobacion
Rutas/simbolos siguientes existen en main2f41322. Tests listados son PROPUESTOS, pendientes de crear/adaptar y ejecutar; reutilizar pruebas existentes equivalentes antes de añadir archivos. El bloque no certifica comportamiento.

```comprobar
archivo: src/lib/offline/offline-db.ts
usa: saveOfflineMedia en src/app/evento/fotocabina/[fiestaId]/page.tsx
prueba: tests/e2e/81-captura-reconexion-entrega.spec.ts
archivo: src/lib/offline/offline-sync-manager.ts
usa: processOfflineMediaQueue en src/components/offline/sync-status-indicator.tsx
prueba: tests/e2e/81-cola-aislamiento-y-reintento.spec.ts
archivo: src/lib/ak-100/ak-100-readiness.ts
usa: buildAk100Readiness en src/app/(app)/fiestas/[id]/centro/page.tsx
prueba: tests/e2e/81-prueba-previa-no-finge-equipo.spec.ts
archivo: src/app/actions/fiesta/barra-tecnologica.actions.ts
usa: createBarDrinkOrder en src/app/invitacion/[fiestaId]/invitado/[guestId]/MiniQuiosco.tsx
prueba: tests/e2e/81-roles-y-pedidos-sin-duplicados.spec.ts
```
