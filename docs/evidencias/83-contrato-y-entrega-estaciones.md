# Auditoria 83: contrato y entrega real de recuerdos

9/10/2026. Main final contrastado: `859fd23b1175646edc0209cab114241327d302ba`.
Rama documental: `codex/auditoria-83-contrato-estaciones-20261009`.
Codex revisa; Gemini/Claude programan segun reparto. No cambios productivos.
PR 1275/1276 fusionadas por otra sesion durante las pruebas. Nueva rama desde
main, no seguir empujando a la cerrada. BAR82-CANCEL ya tiene correccion presente;
no repetir orden 132 ni declarar retest propio de ese arreglo.

## Area contrato

Commit de contraste: 859fd23b. Build ejecutado: 497ee725 (SHA completo en JSON).
4 E2E PC, **2 aprobados / 2 fallidos**, `83-e2e-contrato.json`:

- PASA: constancia ficticia guarda nombre/huella; recarga persiste, no ofrece
  firmar otra vez, no contrata ni marca papel registrado. NO prueba cobros/facturas.
- PASA: cortar SOLO POST con nombre del firmante avisa fallo, libera boton,
  conserva nombre y no inventa constancia.
- CT83-NOMBRE P2: titular guardado invisible; objeto `firma` omite `signedBy`.
- CT83-PAPEL P2: footer condicional oculta imprimir al dejar constancia, aunque
  sigue exigiendo papel. Orden 133, captura revisada `83-contrato-constancia.png`.

No son arreglos entregados ni tests verdes: los dos casos fallidos siguen abiertos.

## Area estaciones

Commit de contraste: 859fd23b. Build ejecutado: 497ee725.
Camara simulada, procesamiento REAL de la app y Firestore/Storage demo locales.
La sonda no fabrica el archivo final para sustituir lo que produce la app.

Original **3 fallidos**, `83-e2e-recuerdos-original.json`, causas distintas:

- ENT83-360 P1: respuesta real "El modulo de entretenimiento no es valido."
  Pantalla envia `plataforma-360`; servidor acepta `plataforma360`. Queda
  "1 esperando subida", con reintentos rechazados. NO se corto red en esta prueba.
- ENT83-GUEST P1: Bogue captura/procesa, pero subida desde QR de invitado falla:
  "No autorizado para modificar este evento." Accion autoriza estacion y luego
  llama guardado general de fiesta, que correctamente exige otro rol. No aflojar
  ese permiso: escritura estrecha/atomica. No afirmar fallo de todos los demas
  consumidores sin probarlos. Cadena real y reparto en orden 134.
- Buzon: timeout al buscar getByLabel. Label visual sin htmlFor, por lo que MI
  sonda nunca enviaba formulario. NO defecto confirmado de guardado.

Retest SOLO Buzon **1 aprobado**, `83-e2e-buzon.json`: selector corregido por
placeholder exacto, captura/video, nombre ficticio, ACK "Mensaje guardado", una
fila en Firestore, archivo Storage, URL local HTTP200/MIME y bytes SDK=GET.
47.008 bytes WebM; SHA256
`7b2ba28c29fb39d8effbf2c92b27d9ff814f6a69a5da9d0879f4281415ffe15e`.
Archivo descargado reproducido en Chromium: 640x480, readyState4, cuadro visible
no transparente. `83-buzon-video.json` y runner `83-verificar-video.mjs` esperan
un cuadro reproducido, NO aceptan solo dimensiones/loadeddata. No prueban hardware
ni calidad de camara real. En 360/Bogue NO se alcanzaron checks de bytes.

Propuesta aparte, no fallo de guardado: asociar label/input del Buzon para lector
de pantalla. No esconder servicios ni cambiar prioridades comerciales.

## Contraste y limites

Diff 497ee725 a main final VACIO para pantalla de contrato/documentos,
portal-session/public-fiesta/portal-actions, data-service/firebase-sync/globals,
acciones entretenimiento/fiesta, pantallas 360/Bogue/Buzon, token, station-config,
Storage y politica offline. Padre `/portal` SI cambio: no transferir esta prueba
directa a su navegacion. Equivalencia de fuentes acotada no convierte el build
viejo en build integral del main nuevo ni en web publicada autenticada probada.

HEAD local de otras IA no subido NO conocido: ambas ordenes exigen contraste
antes de programar. Tests productivos propuestos marcados PENDIENTES.
No repetir implementaciones existentes ni marcar solucionados estos cuatro.
Se reutilizo evidencia 80/81/82 sin repetir sin cambios. Ayudante economico preparo
inventario/sonda; Codex reviso permisos/resultados, corrigio selector y bucket
desde URL local, y cerro agente. Browser in-app abrio la web aislada esta vez;
regresiones ejecutadas con Playwright, no usuarios reales.

## Sigue pendiente

- Implementar/revalidar ordenes 133/134, contrastando trabajo en curso.
- Contrato fisico/documento largo/impresion completa; otras estaciones con QR de
  invitado, reintento/concurrencia y recuerdos antiguos en cola.
- Integraciones externas reales y 19 originales: limite exacto previo sigue en
  `82-base-real.json` (lectura rechazada). No se repitio sin permiso nuevo.
- Resto de aceptacion por area con evidencia vigente. No limpiar por presencia
  de codigo o verde parcial. Hardware al final con dueno.

Sin datos/credenciales reales, contratos, cobros, mensajes ni publicaciones;
sin permisos alterados, codigo productivo, nuevos builds o dependencias nuevas.
Servidores/emuladores propios detenidos. Sin certificado integral ni cero errores.
Estado anterior preservado. Checklist documental, no deploy de arreglos.
