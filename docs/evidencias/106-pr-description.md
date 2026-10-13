## Descripcion del Cambio

Actualizacion114: fuente e5f22b53f5538f7331620e6e80bfe430e49e7e2b.
Codex corrige por nueva autorizacion, Luna6low UI/tests y director dinero/permisos.
Checklist actual114; secciones106-113 historicas. Misma PR abierta, no merge.

Una sola PR1288 existente, ABIERTA; no fusion automatica. Se conservan las
correcciones102-105 y sus evidencias por SHA. Tanda106 contrastada con HEAD48829bfd
y main99faf4eb. No se reinstalan dependencias en el junction del checkout principal.

- Salon3D: la ayuda no tapa el lienzo, Recorrer gira realmente y Pausar detiene
  el giro sin conservar inercia. La camara manual conserva amortiguacion.
- Se corrige el contrato del configurador: salonElements/colorPalette llegan
  al renderer. Antes anunciaba12mesas pero mostraba una habitacion vacia.
- LED cambia el color de la escena, titulo blanco legible, swatches circulares
  de44px sin compresion; encabezado envuelve controles. Sin modificar importes,
  calculo de invitados, geometria definida, permisos ni persistencia.
- Dos parches transitivos compatibles: busboy3.2.2 y source-map-js1.2.2;
  cuatro avisos unicos eliminados, sin force ni cambios mayores adicionales.
- Registro compartido corrige la interpretacion anterior de "vacio esperado".
  Un canvas no vacio o una camara que gira NO acredita el mobiliario prometido.

## Tipo de Cambio
- [x] Correccion de errores
- [ ] Nueva funcionalidad comercial
- [x] Actualizacion de documentacion / configuracion y parches compatibles

## Lista de Verificacion (Checklist) antes de solicitar revision
- [x] TypeScript exit0 e5, `tsc --noEmit` via114-ejecutar.
- [x] Acentos exit0:2794archivos.
- [x]696suites/4229Jest aprobadas,0fallidas/0omitidas; gzip/hashes.
- [x] Build canonico final exit0 con lint/tipos/PWA activos; avisos conservados.
- [x]90criterios114:60HTTP por perfiles y30criterios navegador PC/celular.
- [x] Grafo local e5:14127nodos/42925relaciones/882comunidades; ignorado por Git.
- [x] SDK Firestore emulado demo-ak-producciones y Next compilado3301.

Los22E2E de105 tienen su propia fuentea33; no se presentan como ejecutados
sobre8fa.106 vuelve a probar los consumidores3D y las bibliotecas cambiadas.
En Jest se simula el renderer SOLO para comprobar props; en el navegador
se usa WebGL real. Se conservan los fallos anteriores, no se aflojan criterios.

## Impacto en Firebase
- [x] Afecta Seguridad: permisos de servidor; no modifica firestore.rules.
- [ ] Modifica Cloud Functions
- [x] Modifica Hosting / Frontend y dependencias: requiere publicar
- [ ] Requiere variables productivas adicionales

## Limites Y Pendientes

No certificado0errores de toda la app. Snapshot106 Audit:0critical/25high/65moderate/1low;
91entradas agregadas y27advisories unicos pendientes, no91defectos observados.
No cuentas externas/modelos pagos,19originales manuales, empaquetado/despliegue
Firebase del mismoSHA ni hardware fisico. Standalone apagado SOLO para QA local.
Vista cliente3D se prueba con sesion del equipo; no certifica permiso de invitado.
Barra flotante tapa parte de Guardar en capturaPC: friccion pendiente, no se
certifica ese flujo por haber validado el salon.
Notificaciones ajenas del checkout principal se preservan. Herramientas/grafo
son locales de programacion, no dependencias productivas nuevas.

Ver docs/YA-RESUELTO.md, ESTADO-ACTUAL.md y docs/evidencias/106-validacion.json.
Pendientes para Claude en docs/ordenes/152-claude-cierre-tanda106.md;
la orden NO acredita que Claude la haya leido o ejecutado.
Esta PR queda ABIERTA para revision y fusion del dueno.

## Continuacion111: incidentes, guias e inventarios

-28criterios finales PC/Pixel7:24PASS/4FAIL, dos P2 con dos reproducciones cada uno.
-157: Nueva Incidencia conserva el caso YA guardado; no se envio otro duplicado.
-158: titulo largo desborda editores activo/insumo132/191px en celular; PC correcto.
-Guardar/releer/editar/reintentar/reportes, stock2.5Kg y rechazos de guia probados.
  Imprimir solo comando observado con espia, no impresora/PDF real.
-SDK Firestore emulado, datos ficticios restaurados y procesos propios detenidos.
  Iniciales fallidos conservados y excluidos; no force-click ni cambios de app.
-Ordenes157/158 PENDIENTES, NO contrastadas con tanda privada de Claude. Mismo
  main99faf4eb y fuente8fa, sin nuevos build/Jest, dependencias ni fusion.
-Ver111-resultado.json y111-recorridos-operativos.md. NO aceptacion completa0errores.

## Continuacion107: auditoria sin cambios de app

- PC/Pixel7: cuenta Google needs_reconnect aparece Conectada/check verde;
  empleado error se suma al contador de conectados. Un P2 de estado con dos efectos.
- Sin cuenta avisa configuracion; tras cortar SOLO getGoogleWorkspaceDashboard,
  el boton Reintentar recupera la pantalla ambos contextos. No reabrir ese flujo.
- Orden153 para Claude; NO contrastada con su tanda privada desconocida:
  verificar lo ya programado antes de implementar.152 esta en trabajo segun usuario.
- Sonda/capturas/JSON en107, datos ficticios restaurados. No emails ni OAuth reales.
- Misma fuente8fa, no cambios de app/dependencias ni repeticion de build/Jest.
  Este hallazgo queda pendiente: una entrega documentada NO lo corrige.

## Continuacion108: Conexiones, redes y acceso

- Tres P2 PC/Pixel7: Conexiones sin aviso al fallar lectura/refresco; redes queda
  como vacia al cerrar el toast de error; Instagram en curso sin intento registrado.
- Ocho recorridos sin sesion/vencida vuelven a login y seis controles RPC no entregan
  datos privados a sesiones vencidas/anonimas; positivos verifican lectura real.
- Orden154 para Claude, NO contrastada con su tanda privada. No repetir152/153.
- Evidencias108 conservan fallos del harness, capturas y datos ficticios restaurados.
  Fuente app8fa intacta; sin build/Jest nuevo, cuentas externas ni fusion automatica.
- Pendientes de correccion; estos controles NO certifican toda la app sin errores.

## Continuacion109: seguridad y cobertura (sin cambios productivos)

-27avisos evaluados con metadata oficial y dependencias reales. Tres sharp llegan
  al optimizador publico; otros24 clasificados por condicion/uso, no descartados.
-P1 nuevo: cinco descargas comprueban solo sesion y sirven documentos a perfiles
  restringidos.35lecturas conPDF ficticios, positivos/negativos; backup403 demuestra
  que el servidor SI distingue perfiles. Orden155 paraClaude, pendiente de contraste.
-421rutas inventariadas por AST,4992declaraciones de controles. Conciliacion con
  E2E/imports y106Jest cuyos hashes se comprueban, sin repetir build/Jest.
-No aprobar cada boton/variante ni toda el area por referencias a pruebas. La
  aceptacion funcional total sigue incompleta y las correcciones nuevas pendientes.
-Fixtures retirados, datos sin delta; servidor propio detenido. Sin merge.

## Continuacion110: recorridos independientes

- Misma fuente compilada8fa, sin cambios productivos ni dependencias. Browser
  PC/Pixel7, JSON local y SDK con Firestore emulado, sin credenciales reales.
- Nueve defectos nuevos: ultimo proveedor borrado reaparece desde fallback;
  plantilla base anuncia borrado falso; cuatro fallos de transporte sin aviso;
  torre/preparacion confunden lectura fallida con cero fiestas; contador anuncia
  avisos silenciados como creados aunque la base recibe cero nuevos.
- Orden156 contrasta main visible, pero NO tanda privada de Claude desconocida.
  Claude/Gemini corrigen segun reparto, Claude compila. Ningun arreglo se declara
  implementado por publicar esta evidencia. No repetir152-155 aun en programacion.
- Guardados/consumidores, maestros de reuniones, invitacion propia, cierre y
  marketing probados; ver matriz final110 por criterio/SHA/hash. Fallos iniciales
  del auditor quedan conservados y excluidos del conteo aceptado.
- Copias/fixtures restaurados. No cada boton/rol de421rutas certificado,
  ni integraciones reales,19presupuestos originales,Hosting mismoSHA o hardware.
- Documento compartido actualizado. PR permanece abierta, sin fusion automatica.

## Continuacion112: mantenimiento de equipos (solo punto1)

-18criterios PC/Pixel7:15PASS/3FAIL, dos familias P1 nuevas paraClaude en159.
-Base14/14: cancelar, error antes del envio, gasto123.45, historial reabierto,
  gasto en contabilidad, alerta vencida y desaparicion tras service vigente.
-Respuesta perdida trasHTTP200: reintento duplica el gasto en PC/celular.
-Dos operadores celular: ambos exito/dos gastos, pero una fila del historial.
  PC paso en esa corrida, no afirmar todas las carreras cubiertas.
-Fuente8fa intacta, mismos consumidores main99fa; NO tanda privada Claude.
-Fixtures/JSON restaurados, procesos propios detenidos; evidencia112 con hashes.
-Sin programacion productiva, build repetido, merge ni certificado0errores.

## Continuacion113: ajuste de costos y recetas

-14criterios10PASS/4FAIL: dos P1 nuevos160, paraClaude comida/dinero.
-250g de receta se convierten250kg al actualizar insumo: costo27.5->27500.
  SDK y editor real coinciden. Receta kg, stock, menu ajeno y precio50 pasan.
-HTTP200 perdido: reintento aplica porcentaje otra vez110->116->122 PC;
 134->141->148 celular. El arreglo previo66 de menus pendientes SI existe.
-Dos consumidores inicialmente no aceptados se reemplazan por sus PASS finales;
  sondas/iniciales conservadas, sin inflar conteo ni atribuir defectos del harness.
-App8fa sin cambios/main99fa contrastado; NO tanda privada deClaude.
-Fixturas restauradas, servicios propios cerrados. Continuidad nocturna del
  chat programada cada30min, segun disponibilidad/cuota; no dependencia productiva.
-Correcciones159/160 pendientes en113, reemplazadas por retest114; no0errores.

## Correcciones114 comprobadas
-159: identidad de reintento+recarga, no doble gasto, historial transaccional.
-160: receta conserva unidad/cantidad, ajuste+recibo atomicos, turno compartido,
 reintento lento no pisa nueva tanda; respuesta perdida no multiplica otra vez.
-157: incidente nuevo limpia textos solo tras exito; borrador fallido conservado.
-158: titulos contenidos; Guardar/Volver reales PC/Pixel7 con8muestras.
-155 parcial: seisPDF CONTABILIDAD/SUELDOS, positivos/negativos y4enlaces reales.
-Build/tipos/lint/acentos/Jest y90criterios sobre e5;114-aceptacion.json verificable.
-Fixtures restaurados, demo vacio, servicios propios detenidos; fallos previos
 conservados/excluidos. No nuevas dependencias de herramientas en produccion.
-Pendientes:152-154/156, sharp/variantes155, respaldo de recibos de ajuste;
 no Hosting, cierre de pestaña de mantenimiento, cuentas externas ni hardware.
-Sin merge ni datos reales. No representa una app completa sin errores.
