# Matriz vigente: qué permite y qué falta para cerrar las 14 áreas

6/10/2026. Fuente `368988bb64e823d31c9d5c4b2fb9adc114b207ef`.
Reemplaza la tabla HISTÓRICA de 71 como estado actual; no borra su evidencia.
3522 unitarias actuales pasan; no equivalen a 14 áreas completas. Inventario
E2E actual: 491 desktop / 104 archivos, **descubrimiento sin ejecución**.
No se modifican `areas.json` ni su contador para aparentar una aprobación.

| Área | Evidencia comprobada/reutilizada | Ensayo preciso que aún falta / responsable |
|---|---|---|
| plata | Unitarias actuales incluidas en 3522; retest 73 de 21 casos pasa. CAMPO01/02 directos corregidos. CAMPO73-RACE sigue reproducido. | Claude corrige 124 A; intercalar cobro real de prueba con los cuatro guardados y verificar saldo/recibo recargando. Conciliar los 19 importados uno a uno con originales. Mercado Pago sólo sandbox autorizado, no cobro real. |
| contrato | Regresión de firma y permiso en batería actual; prueba existente `la-firma-digital-no-da-nada-por-aceptado` no demuestra documento final por HTTP. | En backend aislado: crear contrato, firmar/subir papel según modo, recuperarlo después y rechazar sesión de otra fiesta; Claude. |
| comida | COMPRA01 corregido, regresión concurrente actual pasa. Unitarias `auditoria-71-campos-y-compras` y `lista-de-compras-y-menu` no concilian catálogo real. | Claude: fotos/textos del menú contra material aprobado, adultos/niños/alergias con acompañantes y cantidades; compras y pagos persisten al recargar, sin revertirse. No declarar foto correcta por existir URL. |
| permisos | Fronteras y rechazos unitarios actuales verdes; guardado financiero directo cerrado, carrera 124 A pendiente. | Tres sesiones HTTP de prueba: organizador, cliente e invitado; misma/otra fiesta, expiración y revocación. Verificar lectura, acción y persistencia, sin usar un mock como permiso desplegado. Claude. |
| fiesta | Fuente y regresiones cubiertas parcialmente; plantilla de salón 123 pierde escala; 124 A afecta guardado. | Tras arreglos: crear/editar fiesta de prueba, tareas, invitados con acompañantes, mesas, itinerario, carga y cambio simultáneo de dos operadores. Confirmar no se pierde nada y 3D conserva medidas. Gemini, plata Claude. |
| portal | Helpers y guardados con sesión sintética; retorno de campo financiero parcial probado en 73, no recorrido privado completo. | Cliente de prueba abre su fiesta, guarda un cambio permitido, no altera cobros del equipo, recarga y ve sincronización con organizador; documentos/ayuda/video según lo configurado. No sesión ajena. |
| invitado | Helper de acceso y medidas UX públicas de 72 son evidencia limitada; no RSVP/subida completa en este SHA. | Link/token → RSVP sí/no → mesa/QR → mural/subida/recuerdo → recarga/descarga, aislado por fiesta. Bienvenida QR sólo saluda, NO marca llegada por decisión vigente. Check-in autorizado por camino específico. |
| web | Navegador público acotado de 72/73/74; testimonial/video/carga más funcionan. GAL73 y tres GAL/CONTACT74 siguen pendientes. PDF sintético real de 70: cuatro A4 sin recortes, no descarga actual. | Corregir 124 B tras decisión y 125; PC/móvil: dos presupuestos del mismo teléfono, paquetes/extras que cambian, menú real, precio actual/proyección anual/persona, contador al final, PDF directo formal multipágina, CRM y compartir preparado. Simulador IA aparte; no convertir prueba sintética en venta real. |
| redes | Regresiones unitarias generales verdes; RED03 /122 concurrente sigue. GAL74 muestra además clasificación errónea, no pérdida de Instagram. | Gemini: dos guardados concurrentes mantienen ambos videos; sincronizar tres veces sin duplicados ni fechas inventadas; permisos/proveedor autorizados y error real visible. No publicar en cuentas reales como prueba. |
| estaciones | Fuente/pruebas unitarias no prueban cámara, captura/subida ni entrega real. Tótem/video revisado acotadamente en 73 sin otro defecto demostrado. | Gemini: fotocabina/360/espejo/touchpix/bienvenida → captura o QR → entrega; corte de red y reintento una vez, sin falso éxito. Firebase de prueba primero; cámaras, impresora/360 y pantalla física al final. No esconder servicios comerciales. |
| barra | Cuatro hallazgos de 123 incluyen tres de barra; stock y errores unitarios actuales no sustituyen cola integrada. | Gemini corrige token/ownership, dueño decide límite de cambios; pedir con nombre/token, cola, simultáneos, stock, cancelación/reintento, bartender y retiro persisten y se sincronizan. Pantalla física después. |
| asistente | Pruebas con proveedor simulado verdes; AUD01 /112 B.1 queda pendiente previo, no hallazgo nuevo. | Gemini: consulta contextual y acción autorizada con resultado persistido, historial y fallo/límite de proveedor visible; voz/micrófono requieren permiso y prueba controlada. Confirmar costos antes de activar uso pagado. |
| personal | Unitarias `personal-vigencia-y-coordenadas-invalidas` verdes con sesiones/lecturas de prueba. No llegada ni recibo HTTP aceptados. | En aislado: personal asignado, enlace vencido y otra fiesta, ubicación inválida, marcar llegada/rechazo y conservar resultado. Nómina/recibo Claude, UI Gemini. No exigir que proveedor con varios equipos sea exclusivo por defecto. |
| automaticos | Locks/fallos en `tareas-candado-entre-instancias` y `tareas-no-marcan-exito-al-fallar` pasan simulados. | Backend de prueba: dos instancias, lock vencido/liberación tardía y proveedor controlado que falla; reintento no duplica ni marca éxito inexistente. Corroborar persistencia/resultado antes de activar cron real. |

## Fin definido, sin otra ronda infinita

1. Correcciones reproducidas: 122/123/124/125 en UNA tanda; no repetir causas
   ya resueltas ni abrir otra investigación de GitHub billing.
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
