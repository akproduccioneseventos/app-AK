## Descripcion del Cambio

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
- [x] TypeScript exit0, fuente8fa5b56a2833938541a657dcd15ef88130d24b0e.
- [x] Acentos exit0:2771archivos;4regresiones focalizadas aprobadas.
- [x]692suites/4139Jest aprobadas,0fallidas/0omitidas; JSON comprimido con hashes.
- [x] Build canonico final exit0 con lint/tipos/PWA activos; avisos conservados.
- [x]12casos unicos navegador PC/celular:11pass de ronda general +2camaras
  repetidas tras mejorar solo la sonda. Se conserva el timeout de la ronda inicial.
- [x] Graphify actualizado localmente:13713nodos/42463relaciones/838comunidades.
  Salida ignorada por Git; log incluido, no se afirma que el grafo se subio.
- [ ] Emuladores Firebase repetidos en106: no forman parte de este retest.

Los22E2E de105 tienen su propia fuentea33; no se presentan como ejecutados
sobre8fa.106 vuelve a probar los consumidores3D y las bibliotecas cambiadas.
En Jest se simula el renderer SOLO para comprobar props; en el navegador
se usa WebGL real. Se conservan los fallos anteriores, no se aflojan criterios.

## Impacto en Firebase
- [ ] Afecta reglas de Firestore / Seguridad
- [ ] Modifica Cloud Functions
- [x] Modifica Hosting / Frontend y dependencias: requiere publicar
- [ ] Requiere variables productivas adicionales

## Limites Y Pendientes

No certificado0errores de toda la app. Audit:0critical/25high/65moderate/1low;
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
