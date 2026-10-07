# Matriz vigente: qué permite y qué falta para cerrar las 14 áreas

**Actualización 75, 7/10/2026.** Fuente `9bb955ac6af65a314f3ac62975020b37c9edaaf3`.
Informe actual en 75. 50 focales actuales pasan; las 3522 generales y el
inventario 491 E2E de 104 archivos son del SHA ANTERIOR, no un resultado nuevo.
Ese inventario sólo descubrió casos, no los ejecutó. No borra evidencia previa.
No se modifican `areas.json` ni su contador para aparentar una aprobación.

| Área | Evidencia comprobada/reutilizada | Ensayo preciso que aún falta / responsable |
|---|---|---|
| plata | CAMPO01/02 y COMPRA01 siguen verdes (21); CAMPO73-RACE corregido, 6 casos nuevos pasan. No HTTP/transacción real. | Intercalar cobro de prueba con los cuatro guardados, verificar saldo/recibo recargando. Conciliar 19 importados con originales. Mercado Pago sandbox autorizado. Claude; no reprogramar 124 A. |
| contrato | Regresión de firma y permiso en batería actual; prueba existente `la-firma-digital-no-da-nada-por-aceptado` no demuestra documento final por HTTP. | En backend aislado: crear contrato, firmar/subir papel según modo, recuperarlo después y rechazar sesión de otra fiesta; Claude. |
| comida | COMPRA01 corregido, regresión concurrente actual pasa. Unitarias `auditoria-71-campos-y-compras` y `lista-de-compras-y-menu` no concilian catálogo real. | Claude: fotos/textos del menú contra material aprobado, adultos/niños/alergias con acompañantes y cantidades; compras y pagos persisten al recargar, sin revertirse. No declarar foto correcta por existir URL. |
| permisos | Guardado financiero directo y carrera 124 A corregidos, regresiones focales verdes; no frontera HTTP aceptada. | Tres sesiones HTTP de prueba: organizador, cliente e invitado; misma/otra fiesta, expiración y revocación. Verificar lectura, acción y persistencia, sin usar un mock como permiso desplegado. Claude. |
| fiesta | Guardado y plantilla 123/124 corregidos en 1261; tres casos de escala pasan. No UI integrada. | Crear/editar fiesta de prueba, tareas, invitados con acompañantes, mesas, itinerario, carga y dos operadores. Verificar persistencia y medidas en consumidor 3D. Gemini, plata Claude. |
| portal | Helpers y guardados con sesión sintética; retorno de campo financiero parcial probado en 73, no recorrido privado completo. | Cliente de prueba abre su fiesta, guarda un cambio permitido, no altera cobros del equipo, recarga y ve sincronización con organizador; documentos/ayuda/video según lo configurado. No sesión ajena. |
| invitado | Helper de acceso y medidas UX públicas de 72 son evidencia limitada; no RSVP/subida completa en este SHA. | Link/token → RSVP sí/no → mesa/QR → mural/subida/recuerdo → recarga/descarga, aislado por fiesta. Bienvenida QR sólo saluda, NO marca llegada por decisión vigente. Check-in autorizado por camino específico. |
| web | 124 B/125 corregidos, 11 regresiones pasan; publicación sin verificar. CONTACT75 fallback nuevo reproducido. Siete fotos cotejadas y campos móviles legibles; PDF sintético 70 no acepta descarga actual. | Gemini corrige 126. En aislado PC/móvil: dos presupuestos del mismo teléfono, cambio paquete/extras, menú real, precio actual/proyección/persona, contador final, PDF formal, CRM y compartir preparado sin enviar. Simulador IA aparte. No reprogramar 124 B/125 por despliegue viejo. |
| redes | Regresiones unitarias generales verdes; RED03 /122 concurrente sigue. GAL74 muestra además clasificación errónea, no pérdida de Instagram. | Gemini: dos guardados concurrentes mantienen ambos videos; sincronizar tres veces sin duplicados ni fechas inventadas; permisos/proveedor autorizados y error real visible. No publicar en cuentas reales como prueba. |
| estaciones | Fuente/pruebas unitarias no prueban cámara, captura/subida ni entrega real. Tótem/video revisado acotadamente en 73 sin otro defecto demostrado. | Gemini: fotocabina/360/espejo/touchpix/bienvenida → captura o QR → entrega; corte de red y reintento una vez, sin falso éxito. Firebase de prueba primero; cámaras, impresora/360 y pantalla física al final. No esconder servicios comerciales. |
| barra | Tres casos de 123 corregidos; nueve regresiones pasan, botones sólo en nuevo según decisión documentada. No cola integrada. | Nombre/token, cola, simultáneos, stock, cancelación/reintento, bartender y retiro persisten y se sincronizan en aislado. Pantalla física después. No reabrir decisión ni reprogramar 123. |
| asistente | Pruebas con proveedor simulado verdes; no prueban una consulta ni acción integrada en este SHA. AUD01 corresponde al contador de auditoría, NO a este asistente. | Gemini: consulta contextual y acción autorizada con resultado persistido, historial y fallo/límite de proveedor visible; voz/micrófono requieren permiso y prueba controlada. Confirmar costos antes de activar uso pagado. |
| personal | Unitarias `personal-vigencia-y-coordenadas-invalidas` verdes con sesiones/lecturas de prueba. No llegada ni recibo HTTP aceptados. | En aislado: personal asignado, enlace vencido y otra fiesta, ubicación inválida, marcar llegada/rechazo y conservar resultado. Nómina/recibo Claude, UI Gemini. No exigir que proveedor con varios equipos sea exclusivo por defecto. |
| automaticos | Locks/fallos en `tareas-candado-entre-instancias` y `tareas-no-marcan-exito-al-fallar` pasan simulados. | Backend de prueba: dos instancias, lock vencido/liberación tardía y proveedor controlado que falla; reintento no duplica ni marca éxito inexistente. Corroborar persistencia/resultado antes de activar cron real. |

## Fin definido, sin otra ronda infinita

1. Pendientes: 122 RED03 (guardados concurrentes de videos), 112 B.1 AUD01
   (cobertura e invalidación del contador de auditoría) y 126 (contacto del
   simulador) en UNA tanda. 123/124/125 ya
   entraron en 1261; no repetir causas ni investigar GitHub billing.
2. Claude aporta entorno 114 estable y su puerta del SHA de esa tanda; usar
   los mismos datos ficticios en los tres roles. No solicitar contraseñas por chat.
3. Ejecutar los ensayos de la tabla, registrar SHA/rol/pasos/resultado y origen
   de los datos. Sólo volver a la fila que falla o cuyo código cambió.
4. Originales de 19 presupuestos y catálogo se cotejan con datos de negocio,
   sin modificarlos como prueba. Si no están disponibles, constar no conciliados.
5. Proveedores autorizados y ensayo físico separados de unitarias. No se infiere
   ningún defecto por esa evidencia pendiente; tampoco una aprobación.
6. «No encontré errores en lo probado» requiere todos los ensayos de aceptación
   del alcance completados en el MISMO SHA. Nunca equivale a garantía absoluta
   de que cualquier dato, dispositivo o uso futuro no pueda fallar.

Pendiente no significa fallo. Las propuestas opcionales, decisiones del dueño
y mejoras nuevas no frenan la aceptación del alcance acordado. Este documento
no afirma que alguien haya iniciado las órdenes ni que el contador sea 14/14.
