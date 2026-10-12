# Codex107: estado de conexiones Google, no entrega externa

Rol: encargado. Tarea: saber si Google esta conectado y recuperarse de un corte.
App8fa5b56a2833938541a657dcd15ef88130d24b0e, harness08478e71 con sonda107.
Main99faf4eb, PR1288/08478e71; esos dos archivos Google no difieren de main.
La rama privada donde Claude trabaja no esta identificada: contrastar antes de tocar.

## Resultado PARTIAL: un P2 de estado con dos efectos

- Fixture solo en candidato propio sin .env: empresa needs_reconnect, empleado
  error, accessToken vacio y correos example.invalid. Archivos locales vacios
  previos respaldados/restaurados byte a byte; los inexistentes se retiran.
- PC/movil dicen Cuenta de AK:Conectada con check verde y habilitan Sincronizar
  fiestas. Personal conectado1/14,7%, aunque el mismo empleado abajo tiene error.
- Causa trazada: getGoogleWorkspaceDashboard conserva status pero incluye todos
  los employee; GoogleWorkspaceSettingsPage decide por existencia/longitud.
- No se pulso sincronizar ni se enviaron mails. No se afirma falla de Google real,
  perdida de datos ni cuenta productiva revocada. Orden153 pide una correccion.

## Aprobaciones concretas

- Sin cuenta (observacion inicial): indica Falta configurar Google y bloquea
  los botones de sincronizacion. No es una conexion real acreditada.
- Transporte abortado una vez SOLO para actionID getGoogleWorkspaceDashboard
  00c21a19219b3114ed2f9927f257a1a06269ec4a3b: aparece error visible PC/movil.
- Se retira el corte, se pulsa Reintentar REAL, se recupera pantalla sin recarga
  externa en ambos. No pedir otra implementacion de reintento por este recorrido.
- Sonda observa estados y devuelve exit0 si completa; NO significa criterios de
  conexion aprobados ni una suite de aceptacion verde. El criterio de estado falla.

## Errores propios descartados y limites

- Primer intento aborto el primer POST de la ruta, compartida con widgets:
  NO acredito corte del dashboard. JSON inicial conservado, no se usa para cerrar.
  Segundo usa el ID real del bundle de8fa; exactamente un corte en cada contexto.
- Primera vuelta permitio solicitudes de Firebase Installations con llave dummy:
  API key INVALID_ARGUMENT no es un defecto productivo ni un correo enviado.
  La sonda focalizada bloquea todo HTTPS; no consulta proveedores remotos.
- El inventario economico inicial repetia huecos ya cerrados de barra/comida;
  se descarto contra102/recuento, no se emitieron ordenes duplicadas.
- No hay cambio de app, build, dependencias, permisos ni datos reales.
  No repetir 4139Jest/build por documentacion. No nuevas cuentas ni servicios pagos.
- GoogleOAuth, renovacion/delivery real,19originales,hardware y Hosting quedan
  limites previos. Claude trabaja en152 segun el usuario, no se presume resuelta.

## Archivos

107-google-focused.json y seis capturas finales;107-google-probe.json conserva
observacion inicial no dirigida;107-*-execution.json/log y sondas reproducibles.
Conservar106 y pruebas88-105 vigentes en su propioSHA, no comenzar auditoria de cero.
