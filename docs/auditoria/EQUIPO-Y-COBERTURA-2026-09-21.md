# Equipo y cobertura pendiente

Base de codigo: PR1210 bc7fbb3d9226585f234b331e157490e861e0b3b4.
Codex revisa, no modifica app ni compila. No fusionar este documento aisladamente.

## Hallazgos nuevos reproducidos

### EQU-01 / P1: Total cobrado incluye recibos pendientes

Fuente: src/app/(app)/empleados/[id]/historial/page.tsx, totalCobrado. Suma todos los filteredRows usando el monto editable sin filtrar estado pagado/firmado_subido. El filtro inicial es all. Consumidores: tarjeta Total cobrado y reporte HTML imprimible, con el mismo rotulo.

Sonda: un recibo pendiente de 100 produce total cobrado100 (esperado0); uno pagado100 + pendiente100 produce200 (esperado100). Dos comprobantes pagado/firmado_subido producen200 correctamente. No hubo pagos ni cambios de recibos reales.

Claude: separar total acordado/pendiente de efectivamente cobrado; no presentar borrador editable como pago persistido. Respetar decisiones de negocio y comprobar tambien el promedio y reporte. No modificar el monto de recibos cerrados. Prueba integrada pendiente: filtro todos y pendientes con pagos reales de entorno de pruebas, recarga y reporte.

### EQU-02 / P1: acciones simultaneas de proveedor se pisan

Fuente: src/app/actions/provider-portal.ts. toggleTareaProveedor, confirmarLlegada y addNotaProveedor leen todo el registro y persistProvider vuelve a escribirlo entero. Dos operaciones que partan del mismo estado pueden conservar solo la ultima.

Sondas: completar tareas a y b a la vez devuelve dos exitos, pero solo una completada. Confirmar llegada y guardar nota a la vez devuelve dos exitos, conserva nota y vuelve a Pendiente. Secuencialmente se conservan las dos tareas. Acceso inactivo, tarea inexistente y fallo de escritura se rechazan correctamente.

Consumidor verificado: src/app/proveedor/acceso/[token]/page.tsx. Botones llaman confirmarLlegada, toggleTareaProveedor y addNotaProveedor. La interfaz no sustituye control de concurrencia entre dispositivos/peticiones.

Contrato inspeccionado: src/lib/data-service.ts updateDataItem usa transaccion, pero transaction.set recibe el objeto ya calculado; solo comprueba existencia, no recalcula el cambio sobre snapshot actual. La transaccion no corrige por si sola la lectura previa obsoleta. La sonda simula almacenamiento con merge de objeto completo, no emula Firestore ni su distribucion real.

Claude por integridad de datos: operar sobre estado actual en transaccion, con cambios acotados por campo/tarea y reintentos seguros. Gemini mantiene coherencia de respuestas en la pantalla. No cambiar el significado de las confirmaciones sin aprobacion del dueno.

## Resultados

10 casos nuevos: 6 PASS/4 FAIL, dos hallazgos. Evidencias:
- docs/evidencias/equipo-sonda.cjs
- docs/evidencias/equipo-resultados-2026-09-21.json

Node + TypeScript (AUDIT_TYPESCRIPT admite ruta), ejecutar `node equipo-sonda.cjs CARPETA`.
Fuentes exactas del SHA: historial.tsx corresponde a la pagina de historial arriba; provider.ts a provider-portal.ts. No red ni escrituras reales. Codigo de salida0. No pruebas E2E ni build.

## Cobertura global: no confundir inventario con prueba

Arbol Git no truncado de bc7fbb3: 360 archivos page.tsx, mismos paths que inventario del16/9. Eso NO demuestra que funcionen 360 pantallas. El indice compartido es parcial; una ausencia no prueba que nadie haya revisado el modulo.

Se agrega COBERTURA-PANTALLAS-2026-09-21.json: inventario verificable de paths, todos pendientes de reconciliar con evidencia especifica vigente. NO pone en cero pruebas anteriores: las conserva en los informes enlazados desde INDICE-CORTO y exige asociarlas antes de reejecutar. No genera aprobaciones por presencia de archivos.

Un agente economico reviso el inventario/indice, no codigo ni dinero. Identifico ocho familias cuyo cierre integral no puede demostrarse con ese indice: cliente; invitaciones/invitados; operacion durante evento; entretenimiento; proveedores; personal; CRM/marketing/simuladores; catalogos/salones/web. No son ocho fallos ni ocho modulos necesariamente sin auditar.

Cada ficha de cierre debe contener: SHA y URL del entorno, rol, fixture no productivo, recorrido, botones/estados realmente ejercitados, persistencia tras recarga, sincronizacion observada, evidencia y limites. Para terceros: cuenta de prueba, permiso, resultado externo y manejo de rechazo/duplicado. Para fotografia/360/impresion: dispositivo real ademas de simulacion. Finanzas y permisos quedan bajo revision principal/Claude, no agente economico.

## Acceso real y bloqueo de cierre

El 21/9 se abrio https://akproducciones.uy/login. La pantalla muestra Correo electronico, Contrasena, Ingresar, Ingresar con Google y Olvide mi contrasena. No hay sesion autenticada disponible. El primer intento tuvo timeout de conexion del navegador de Codex; al recuperar la pestaña, la pagina de login se leyo correctamente. NO se reporta ese timeout como fallo de la app.

No se intento adivinar credenciales ni escribir datos reales. Se solicito al dueno URL del entorno de pruebas de PR1210 y sesion iniciada alli. El SHA desplegado en akproducciones.uy no se verifico; no usar esa pagina para afirmar que una correccion de la rama pendiente falla.

Bloqueo concreto para certificar todos los roles: falta entorno identificable con datos/cuentas de prueba y sesion. Esto no impide otras lecturas de codigo, pero si impide afirmar pruebas humanas completas de cliente, organizador, invitado y operador. No declarar auditoria total terminada, ni 0 errores, ni estetica aprobada.

