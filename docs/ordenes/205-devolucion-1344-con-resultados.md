# Orden205 - Devolucion agrupada de PR1344

Entrega bfde3916a43afdb700cc0828722268db7b3ea2c1; base108e17b4387237fc921ea12e8d1eb65b20f62ac9.
Claude publico despues daefbdc00b7a43f4f252dcca6e7d9565d4d30d10.
NO CONTRASTADO CON CAMBIOS PRIVADOS NO PUBLICADOS. Contrastar HEAD nuevo antes
de programar. No copiar la rama vieja encima de daef ni deshacer199/204.
Gemini implementa; Claude decide/revisa permisos, dinero y datos sensibles.
Codex solo audita. Una sola tanda. No volver a implementar196/202/203:
se agrega evidencia del consumidor y casos nuevos a esa misma devolucion.

## Voz: cache y permisos, para Claude

POST src/app/api/asistente/voz-en-vivo/accion/route.ts consulta toolCallCache
por id ANTES del permiso de cada accion.171 consulta deuda como dueno y cambia
a operador: repetir el mismo id conocido devuelve200 y el resultado privado.
Id nuevo con operador devuelve403. No se probo obtencion del id ajeno ni HTTP.
El cache conserva esperandoConfirmacion: repetir MISMOid con confirmado:true
ejecuta0reuniones. Dos peticiones simultaneas MISMOid crean2tareas.
Autorizar siempre antes de responder, ligar actor/accion/carga/intento,
permitir avanzar confirmacion y coordinar concurrentes. Intentos deliberados
distintos SI deben crear dos tareas. No deduplicar por telefono/nombre/fecha.

## Voz: resultado real en su consumidor

- getFiestas rechazado se convierte en[] y responde success:true/no encontro
  fiesta. Indicar falla de lectura, no ausencia.
- preparar_borrador_whatsapp escribe destinatario/mensaje/canal/estado:borrador.
  src/app/(app)/contabilidad/crm/outbox/page.tsx usa targetPhone/targetName/
  messageText/channel/status/scheduledAt. Sus selectores reales muestran0 de
  ese borrador aunque la voz diga listo. Usar el contrato existente, no solo
  comprobar que se escribio una fila. Revision Claude de autorizacion/guardado.
- preparar_mail no reenvia confirmado a ejecutarAccionSecretario.174 compone
  ambos cuerpos reales: confirmado:true pregunta otra vez y escribe0. Directo
  al secretario confirmado escribe1 en doble; no certifica su contrato de correo.

## WhatsApp: camino real del anuncio, misma203

src/app/api/whatsapp/webhook/route.ts llama atenderProspectoAnuncioWhatsApp
sin importarla:171 observa ReferenceError,0llamadas helper/flujo anterior y
HTTP200 por catch. Corregir enlace y probar WEBHOOK, no solo helper.
El helper devuelve completo:true con0borradores ante saveScheduledMessage
success:false o throw. Comprobar resultado y mostrar falla, no afirmar guardado.
Conservar alternativa aprobada203: enlace a simulador SIN presupuesto cero.
Los comentarios YA presentes en1344 piden ademas conservar datos entre mensajes,
usar parametros que el simulador lee y no perder conversacion/aviso al retornar.
Contrastarlos con consumidor; no cambiar correspondeContestarSolo ni autorizar
envios nuevos por esta orden de Codex.

## Meta: concurrencia y canal, misma196 mas caso nuevo

POST src/app/api/meta/webhook/route.ts lee/regraba lista. Dos mid distintos
simultaneos responden200/guardados1, pero persiste1. Dedup secuencial SI pasa.
Mutacion atomica sobre lista actual, conservar HMAC/dedupmid. Con object:instagram
e IDs numericos15digitos guarda messenger: no deducir canal por prefijo ficticio
o longitud. Firma falsa/sin secreto ya rechazada: conservar arreglo correcto.

## Album y AR

- filtrarPorEstacion(...,'buzon') pierde capsulaTiempo antes incluida. Conservar
  ambos y nuevos alias. Candidato agente sobre invitados DESCARTADO: guard sigue.
- toPublicSocialEvent no expone AR:174 ejecuta proyeccion y condicion reales;
  con configuracion en fiesta, canStart:false. Proyectar solo campos publicos
  necesarios, no fiesta entera (Claude revisa).
- Con fixture controlado start() anuncia deteccion sin evento ni anchor/video.
 171 usa dobleMindAR: no camara real. Completar .mind/deteccion/contenido segun196.
  La E2E entregada solo continua peticiones y mira que no haya error; no prueba
  carga deMindAR ni deteccion. No certificar funcion con ese negativo.

## Pruebas y entrega

17122casos11PASS/11FAIL;1745casos2PASS/3FAIL:14aserciones, no14bugs.
JSON171/174 contienen hashes y observaciones; sesion/BD/proveedores dobles
acotados, rutas/perfiles/riesgo/selectores/DTO reales. No build/Jest/tsc amplio
de bfde;805/5010 de108e no lo valida. Lock139entradas nuevas/1versioncambiada/
0hosts ajenos a registry.npmjs.org, no auditoria de vulnerabilidades.
Agregar YA-RESUELTO a entrega de app, hoy ausente. No programado/fusionado aqui.
Lo manual del dueno no es pendiente de Codex. No usar esa separacion para
afirmar controles tecnicos no ejecutados. Retest solo delta sobre SHA nuevo.

```comprobar
archivo: src/app/api/asistente/voz-en-vivo/accion/route.ts
usa: ejecutarAccionSecretario en src/app/api/asistente/voz-en-vivo/accion/route.ts
usa: atenderProspectoAnuncioWhatsApp( en src/app/api/whatsapp/webhook/route.ts
usa: filtrarPorEstacion( en src/app/evento/album/[fiestaId]/page.tsx
prueba: docs/evidencias/171-entrega-1344.mjs
prueba: docs/evidencias/174-consumidores-1344.mjs
```
