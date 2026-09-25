# Matriz de cierre por recorridos - orden 81

Creada 2026-09-23 sobre main2f41322. NO representa nuevas pruebas ejecutadas.
Primero enlazar evidencia vigente existente; no repetir auditoria completa sin cambios.
Estados: pendiente de reconciliar / probado en SHA / fallo reproducido / bloqueado por entorno / requiere equipo.
Todas las filas inician PENDIENTE DE RECONCILIAR; algunos subcasos ya tienen evidencia en el historial.

| Bloque | Recorrido y resultado exigido | Responsable |
|---|---|---|
| Acceso | Correo, Google, recuperacion con cuenta de prueba, sesion vencida, rol restringido y carga de dashboard; no bucles silenciosos | Claude |
| Venta | Anuncio -> web -> simulador comun e IA por separado -> varios presupuestos mismo telefono -> CRM conserva historial/atribucion -> cita | Gemini; Claude importes |
| Presupuesto | Cambio paquete/menu/regalos, ofertas pertinentes, año futuro separado, precio/persona, pantalla=PDF, paginas legibles, compartir sin administrador | Gemini; Claude numeros |
| Dinero | Pendiente/rechazado no ingresa; seña/saldo/factura sin duplicar; pagos simultaneos; conciliacion; 19 manuales no se alteran | Claude |
| Organizacion | Configuracion -> tareas/responsable -> invitados/mesas -> comida/alergias -> personal/proveedores -> carga/retorno -> cierre, guardado y recarga | Gemini; Claude comida/datos |
| Cliente | Portal propio, documentos y aprobacion, progreso, salon3D; otra fiesta inaccesible | Gemini; Claude permisos |
| Invitado | RSVP aprobado por dueño, propio acceso, mural/moderacion, musica/participacion, trago y recuerdo; nada administrativo | Gemini; Claude permisos/stock |
| Entretenimiento | Configurar -> operador -> invitado -> captura/resultado -> entrega -> siguiente invitado; fotocabina/360/espejo/IA/totem | Gemini |
| Offline | Corte, reabrir, reconectar, dos pestañas, permiso revocado, cuota llena y entrega unica; no exito falso | Gemini; Claude integridad |
| Integraciones | Entrada/salida real en sandbox, deduplicacion, fallo/expiracion/revocacion y recuperacion; cada proveedor declarado | Gemini; Claude credenciales/cobros |
| Visual | Desktop/movil/totem, teclado, texto, imagen real correcta, movimiento reducido, carga/error/vacio, contraste, CTA visible | Gemini |
| Rendimiento | Medicion comparable antes/despues de carga e interaccion; no logs/secretos; no afirmar metricas no medidas | Gemini |
| Cobertura | Relacionar cada ruta/tarjeta/accion del inventario con recorrido o exclusion justificada; no contar archivos como pruebas | Codex revisa evidencia |
| Equipos | Ensayo con camara/360/pantallas/barra y red del lugar; dispositivo/fecha/responsable y resultado | Operador + Claude/Gemini |
| Lanzamiento | SHA congelado, pruebas/types/acentos/build/E2E y smoke del despliegue del mismo SHA; no fusion automatica | Claude compila; Codex revisa; dueño fusiona |

Formato por caso: ID; ruta; rol; SHA; entorno; fixture; pasos; esperado; observado; estado; evidencia; fecha; responsable; limites.
No datos reales/contactos/tokens en capturas. PR1214 conserva su devolucion de seis E2E; orden80 conserva residuales. Reutilizar ambas, no abrir tareas duplicadas.

## Parte de Claude — resultado (23 de septiembre de 2026)

Probado con Jest sobre la rama `fix/traspaso-23` (el SHA exacto queda en la propuesta que la
fusiona). Pruebas de comportamiento, no de nombres: base de mentira que devuelve copias y tarda.

| Bloque | Qué se probó | Estado | Evidencia |
|---|---|---|---|
| Dinero | Cobros simultáneos (confirmar + anotar, rechazar + borrar, mismo cobro dos veces); lista vieja no pisa cobros ni borra presupuestos/facturas; restauración sí manda | Probado | `la-plata-no-se-pierde-entre-servidores`, `una-lista-vieja-no-borra-plata` |
| Dinero | Cupón de un uso con dos presupuestos a la vez; mismo presupuesto dos veces | Probado | `un-cupon-de-un-uso-sirve-una-vez` |
| Dinero | Pendiente/rechazado no suma; doble envío del comprobante | Ya estaba bien (revisado) | `financial-guardrails.ts`, `submitClientPayment` |
| Invitado | Un voto por invitado, votación cerrada, pantalla pública sin votantes | Probado | `la-noche-no-se-maneja-de-costado` |
| Invitado | Trago a nombre de otro; pedido reenviado no descuenta dos veces | Probado (en el código) | `un-trago-que-no-se-guardo-no-descuenta-botellas` |
| Operador | Operador de otra fiesta no maneja votaciones ni borra contenido | Probado | `la-noche-no-se-maneja-de-costado` |
| Offline | Captura reenviada no se publica dos veces; cola no entrega fotos al siguiente; sin cachés de datos | Corregido / falsa alarma verificada | `offline-sync-manager.ts`, `next.config.js` |
| Equipos | Ensayo real con cámara, 360, barra y red del lugar | Requiere equipo | — |

## Parte de Gemini — resultado (23 de septiembre de 2026)

Probado y verificado en la rama `feat/orden-81-gemini-recorridos-offline-equipo`. Implementación real en pantalla y pruebas Playwright verificadas:

| Bloque | Qué se probó | Estado | Evidencia |
|---|---|---|---|
| Offline | Captura en fotocabina con botón real sin internet -> aviso visible "Foto guardada en este equipo" -> reconexión -> entrega única al servidor sin duplicar | Probado | `src/app/evento/fotocabina/[fiestaId]/page.tsx`, `tests/e2e/81-captura-reconexion-entrega.spec.ts` |
| Offline | Cola de subida aislada por fiesta (dos eventos sin mezclar fotos); aislamiento de credenciales de invitado; reintento conserva cola | Probado | `tests/e2e/81-cola-aislamiento-y-reintento.spec.ts`, `src/__tests__/cola-aislamiento-y-reintento.test.ts` |
| Equipos | Módulo interactivo de comprobación de equipo dentro del Centro de Fiesta (`ComprobacionEquipo`): 5 pasos (cámara, pantalla, conexión real, almacenamiento local, captura de prueba), botones "Probar de nuevo" por paso, estados visibles (`no probado`, `pasó`, `falló`, `requiere equipo`) y fecha/hora | Probado | `src/app/(app)/fiestas/[id]/centro/comprobacion-equipo.tsx`, `tests/e2e/81-prueba-previa-no-finge-equipo.spec.ts` |
| Invitado | Barra tecnológica: pedido con doble toque rápido en la interfaz; protección anti-duplicados por referencia y `clientRequestId`; barman recibe exactamente un pedido | Probado | `src/app/evento/barra/[fiestaId]/page.tsx`, `MiniQuiosco.tsx`, `tests/e2e/81-roles-y-pedidos-sin-duplicados.spec.ts` |
| Entrega | Galería de recuerdos accesible en segunda pantalla (`/evento/galeria/[fiestaId]`) para retiro mientras otro invitado usa la cabina | Probado | `src/app/evento/galeria/[fiestaId]/page.tsx` |
