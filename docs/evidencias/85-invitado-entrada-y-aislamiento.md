# Auditoria 85: archivo QR real, entrada y aislamiento entre fiestas

9/10/2026. Area: invitacion/invitado. Hallazgos: ninguno en estos recorridos.
Fuente compilada: `497ee725cb4d8cce6d1c97422fd674cbbe86c051`.
Main contrastado final: `859fd23b1175646edc0209cab114241327d302ba`.
Rama `codex/auditoria-83-contrato-estaciones-20261009`, PR 1277.
NO CONTRASTADO CON LA TANDA LOCAL DE CLAUDE que no se haya subido.

## Hueco seleccionado

El viaje existente confirmaba y dibujaba QR, pero no descargaba/decodificaba
sus bytes ni entregaba el archivo al lector real del operador. Se completo
ese resultado final; no se repitio mural, personal ni los arreglos 133/134.
RSVP y credencial tienen despues del build un cambio de telefono WhatsApp;
envio, descarga/payload QR y lectura de credencial no cambiaron. Lector/acciones
de invitados/actualizacion/autorizacion sin cambio relevante en el contraste.
La barra embebida cambio y NO se ejercito. Equivalencia solo de este flujo,
NO de todo main ni WhatsApp corregido. No hubo nueva compilacion.

## Cuatro casos aprobados: dos PC y dos viewport movil

Caso integrado por dispositivo: sin cookie de equipo, el invitado confirma dos
acompanantes y menu vegetariano; conserva mesa 7 previamente asignada. Guarda
tres personas, nombres, menu/token sin alterar otro invitado ni clave cliente.
La confirmacion NO registra entrada. Descarga PNG real, firma/contenido validos;
ZXing incluido en html5-qrcode decodifica fiesta/invitado/token en /evento/accesos.
El enlace separado al portal personal muestra credencial/mesa/menu y persiste
tras recargar, sin controles del equipo. Otro contexto autenticado como operador
elige ese mismo PNG en el lector real: ACCESO PERMITIDO, mesa/menu/grupo de tres;
checkedIn/checkInTimestamp guardados y otro invitado intacto.

Segundo caso por dispositivo: otra fiesta tiene mismo ID de invitado y distinto
token. Sin sesion de equipo, token del QR de la primera NO abre credencial de la
segunda: No pudimos abrir tu invitacion, sin nombre privado/QR ni cambios en
ambas fiestas. No sumar pasos/reintentos/capturas como casos independientes.

## Evidencia

- `85-e2e-entrada-original.json`: PC, aislamiento aprobado; primer caso frenado
  por MI selector del radio oculto. Etiqueta visible funciona en navegador:
  NO defecto app. `85-invitado-entrada-original.spec.ts` conserva esa sonda.
- `85-e2e-entrada-desktop.json`: retest SOLO del caso frenado, aprobado.
- `85-e2e-entrada-mobile.json`: ambos aprobados, sin omisiones.
- `85-invitado-entrada-real.spec.ts`: sonda corregida, ejecutada en tests/e2e
  de TEMP, runner guardado 81-correr-e2e-aislado.mjs, workers=1/retries=0.
- `85-entrada-qr-mobile.png`: PNG descargado e inspeccionado.
- `85-qr-destino-desktop.txt` / `85-qr-destino-mobile.txt`: destinos decodificados
  con tokens SOLO ficticios/disposable, nunca credenciales reales.
- `85-lector-desktop.png` / `85-lector-mobile.png`: resultados del lector;
  movil inspeccionado, nombres/mesa/grupo legibles sin superposicion.

Propuesta visual aparte, NO fallo ni condicion de cierre: traducir textos de
la opcion de archivo del lector que estan en ingles. No cambiar permisos.

## Limites

JSON propio/emuladores demo, sin Firestore real. Camara simulada SOLO para iniciar
lector; PNG, decodificacion y entrada guardada reales en entorno aislado.
No lente fisica, QR impreso, scanner externo ni conectividad real. No reentrada,
revocacion con pagina abierta ni todos los endpoints/permisos/area completa.
Semillas ficticias propias limpiadas; ayudante, pestaña y entorno propios cerrados.
Sin producto modificado, paquetes nuevos, datos/cobros/mensajes reales ni fusion.
Conservar estos casos sin repetir si consumidores/dependencias no cambian.
