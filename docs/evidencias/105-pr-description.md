## Descripcion del Cambio

Una sola propuesta existente, por autorizacion del dueno, sin fusion automatica.
Main contrastado99faf4eb; registros anteriores reutilizados, sin reabrir auditorias.

Correcciones102-104 conservadas: lectura de fiestas no inventa vacio tras fallo,
QR por orientacion, mural independiente del chat, portal Reintentar solicita
lectura nueva y fechas de cupones coherentes con Uruguay. Importes intactos.

Nueva tanda105:
- Salon3D ahora dibuja y responde: React19/Fiber9/Drei10 compatibles; elimina
  parche de internals. Geometria, servicios, datos y permisos intactos.
- QRCodeCanvas4 y DayPicker9 adaptados;32tipos de iconos ajustados sin logica nueva.
- Calendario movil: encabezados ya no bloquean flechas. Agenda no corta accesos.
- Next15.5.27/React19.2.8; lock acotado. Handlebars4.7.10/proxy-addr2.0.8
  parcheados en rango compatible, con regresiones fallan-viejo/pasan-nuevo.
- Registro compartido, evidencias comprimidas/hashes y Graphify local actualizados.

## Tipo de Cambio
- [x] Correccion de errores
- [ ] Nueva funcionalidad comercial
- [x] Actualizacion de dependencias / configuracion
- [x] Documentacion y evidencia

## Lista de Verificacion
- [x] TypeScript exit0 sobre fuente appa33a54d91bf704f52fe11d1afbc956ebd8e819a5.
- [x] Lint validado en build canonico; avisos registrados, no cero avisos.
- [x] Build exit0 con tipos/lint/PWA activos; standalone desactivado SOLO QA local.
- [x]690suites/4135pruebas pasan,0fallidas/0omitidas; JSON comprimido y SHA256.
- [x]22pruebas navegador PC/movil pasan:3D4,calendarios4,QR4,mural4,fechas2,portal4.
- [x] SDK real/Firestore demo para mural/fechas/portal, sin credenciales reales.
- [x] Graphify incremental AST exit0, sin LLM:13648nodos/42372relaciones/832comunidades.
- [x] Acentos y diff revisados; notificaciones ajenas no integradas.

Harness e7f5e7fc SOLO cambia el selector de un enlace E2E; codigo de app identico
a la fuente compiladaa33. El corredor rechaza diferencias de app/dependencias.
Se conservan fallos iniciales del calendario, preflightdev y test de API QR antigua.

## Impacto en Firebase
- [ ] Cambia reglas Firestore / Storage
- [ ] Modifica Cloud Functions
- [x] Modifica frontend/acciones Next y dependencias (requiere publicar)
- [ ] Requiere nuevas variables productivas

## Limites Y Pendientes

No certificado0errores de toda la app. Quedan31advisories unicos de dependencias
(audit0critical/27high/65moderate/2low): no se fuerza downgrade de PWA ni majors SDK.
Hay friccion visual3D movil: ayuda inferior solapada con controles flotantes.
No se certifican todos los controles/permisos/variantes,19originales manuales,
cuentas reales/modelos pagos, empaquetado/despliegue Firebase ni hardware fisico.
Vista cliente3D comprobada con sesion del equipo; no prueba permiso de invitado.

Ver docs/YA-RESUELTO.md, ESTADO-ACTUAL.md y docs/evidencias/105-validacion.json.
Esta PR se deja ABIERTA para revision del dueno. NO fusionada.
