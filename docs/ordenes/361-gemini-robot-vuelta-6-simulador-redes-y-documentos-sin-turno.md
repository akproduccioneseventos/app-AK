# Orden 361 — Robot, vuelta 6: el simulador avisa si no guardó, redes vuelve a mirar el permiso y siete documentos con turno

**Para Gemini. Va en la MISMA propuesta que la 350 y la 355 a la 360 (rama `gemini/orden-346`).** Si un bloque se traba,
entregá el resto y avisá cuál faltó. Antes de decir "terminé", leé `docs/ANTES-DE-ENTREGAR.md`. Los bloques 2 y 3.2 tocan
permisos (fotos de invitados, quién vio qué): Claude los revisa línea por línea.

## Por qué
Sexta vuelta del robot (26/11/2026). Revisó las áreas web y redes y la sincronización por segunda vez, ahora sobre los
documentos enteros. Estas cosas no tuvieron hallazgos: los enlaces de la portada, el formulario de contacto (no duplica), el
precio del simulador (sale de la misma función que el del servidor), el borrado en redes (sólo oculta) y los duplicados al
sincronizar. Claude confirmó cada punto en el código.

## Bloque 1 — El simulador dice cuando no guardó
1. `src/app/simulador-de-presupuesto/page.tsx` ~1745-1760: al cambiar servicios o invitados después de ver el presupuesto,
   el guardado automático falla en silencio (sólo `console.error`). La pantalla muestra el total nuevo y el presupuesto
   guardado, que es el que ve el vendedor y el que tiene el enlace del cliente, queda viejo. El propio comentario dice
   "se perdió una venta y nadie se entera". Si `guardado.success` es falso, se muestra un aviso visible y un botón
   "Reintentar".
2. Mismo archivo, ~1097-1100: en el paso 1, si no se guardan nombre y celular, pasa al paso 2 sin avisar. Se reintenta una
   vez sola y, si sigue fallando, se avisa sin frenar al prospecto: "No pudimos guardar tus datos; igual podés seguir".
3. `getServiciosEmpresaPublicos` (`src/app/actions/servicios-empresa.ts` ~75-84) saca precio, proveedor y notas, pero el resto
   del servicio viaja al navegador del prospecto: `mantenimiento` (con `historial[].costo` y `gastoPendiente`),
   `cantidadDisponible` y `contactoPrincipal`. Cambialo a **una lista de lo que sí se manda** (los campos que usan el
   simulador y la presentación), no a una lista de lo que se saca. Lo llama `src/app/actions/public-simulator-bootstrap.ts` ~112.

## Bloque 2 — Redes: el permiso se mira al publicar, y el aviso al dueño es de verdad (pregunta 234)
`src/lib/presencia-digital/publicador.ts`:
1. `procesarPosteosProgramados` (~814-860) publica lo programado **sin volver a mirar el permiso de la foto**. Si el
   cliente lo retiró (`revocarPermisoFotoPromocional`, `src/app/actions/promotional-photo-consent.ts` ~80) entre que se
   programó y que sale, la foto se publica igual. Llamá a `validarPermisoPromocionalPosteo` (~581) **justo antes de
   publicar**. Si no hay permiso, no sale y queda en "rechazado por permiso", con aviso al dueño.
2. ~784-785: `enviarPreviewBorradorAlDuenio(post).catch(() => false)` y después marca `previewEnviadaAlDuenioAt` igual. Si el
   aviso no salió, no se marca y se reintenta en la próxima corrida.
3. ~777-803: un borrador de más de 12 horas al que nunca le llegó el aviso al dueño pasa directo a "Programado". Las 12
   horas se cuentan **desde que salió el aviso** (`previewEnviadaAlDuenioAt`), no desde que se creó el borrador
   (decisión del dueño del 12/11: sale solo si en 12 horas no tocó "No publicar"; para eso tiene que haberlo visto).

## Bloque 3 — Siete documentos que se leen y se reescriben enteros sin turno (pregunta 22)
Pasalos a `mutateGenericJsonArray` (o a un turno que cubra la lectura y la escritura, como `turnoDeAjustes` en
`src/app/actions/settings.ts` ~678):
1. `src/lib/whatsapp/vino-de-la-publicidad.ts` ~83-95 (`whatsapp-conversaciones-de-publicidad.json`): dos mensajes a la vez
   pierden una marca y el asistente no le contesta a alguien que **sí** vino de un anuncio.
2. `src/app/actions/auth.ts` ~1293-1301 y ~1366-1375 (`auditores-historial.json`): abrir y cerrar un acceso de auditor a la
   vez dejan el historial de quién vio qué mal.
3. `src/lib/marketing/meta-ads-acciones.ts` ~43-44 (`publicidad-acciones-ejecutadas.json`): se pierde el registro de una
   pausa o un cambio de presupuesto de campaña.
4. `src/app/actions/mission-control.ts` ~190-197 (`updateEtapaEstado`): dos personas marcando etapas distintas la misma noche;
   una vuelve atrás.
5. `src/lib/notifications/preferencias-avisos.ts` ~42-50 (`notification-preferences.json`).
6. `src/lib/asistente/propuestas-service.ts` ~145-151 y ~474 (`asistente-reglas-aprendidas.json`): una regla desestimada vuelve.
7. `src/app/actions/settings.ts` ~702-707 (`saveAjustesLlegadaPersonal`) y ~418-420 (`saveWhatsAppSettings`): sumalos al turno.

## Barrido en toda la app
- Documentos enteros leídos y reescritos sin turno (pregunta 22): `grep -rn "await writeData(" src/app/actions src/lib`,
  descartando los archivos de `FILE_TO_COLLECTION` y los que ya usan `mutateGenericJsonArray` o un turno.
- Permisos mirados al programar y no al ejecutar (pregunta 234): `grep -rn "Programado\|programad" src/lib src/app/actions`
  y mirar si lo que se ejecuta más tarde vuelve a mirar el permiso.
- Avisos marcados como enviados sin mirar si salieron (pregunta 122): `grep -rnE "\.catch\(\(\) => (false|null|undefined)\)" src/lib src/app/actions`
  seguido de una marca de "enviado".
Plata, cobros y permisos: se lista y Claude lo revisa.

## Lo que NO hay que hacer
- No cambiar las decisiones del dueño sobre redes: las quejas se ocultan solas y los borradores salen solos a las 12 horas
  si no tocó "No publicar". Lo que se pide acá es que esas 12 horas empiecen cuando de verdad le llegó el aviso.
- No sacar el reloj del simulador ni cambiar textos.

## Qué tiene que comprobar la prueba
- `src/__tests__/redes-mira-el-permiso-al-publicar.test.ts`: un posteo programado cuya foto perdió el permiso no se
  publica; un aviso al dueño que falla no se marca como enviado; un borrador viejo sin aviso no pasa a programado hasta 12
  horas después del aviso.
- `src/__tests__/los-documentos-enteros-tienen-turno.test.ts` (base de mentira que devuelve **copias**): dos marcas de
  "vino de la publicidad" a la vez quedan las dos; dos etapas de la noche a la vez quedan las dos.
- `src/__tests__/el-simulador-no-manda-datos-internos.test.ts`: `getServiciosEmpresaPublicos` no devuelve `mantenimiento`,
  `cantidadDisponible` ni `contactoPrincipal`.
- `tests/e2e/el-simulador-avisa-si-no-guardo.spec.ts`: con el guardado cortado, después de cambiar invitados aparece el
  aviso y "Reintentar".

```comprobar
usa: mutarDocumento en src/lib/whatsapp/vino-de-la-publicidad.ts
usa: mutateGenericJsonArray en src/lib/marketing/meta-ads-acciones.ts
usa: mutarDocumento en src/app/actions/mission-control.ts
usa: mutarDocumento en src/lib/notifications/preferencias-avisos.ts
usa: syncBudgetChanges en src/app/simulador-de-presupuesto/page.tsx
usa: validarPermisoPromocionalPosteo en src/lib/presencia-digital/publicador.ts
prueba: src/__tests__/redes-mira-el-permiso-al-publicar.test.ts
prueba: src/__tests__/los-documentos-enteros-tienen-turno.test.ts
prueba: src/__tests__/el-simulador-no-manda-datos-internos.test.ts
prueba: tests/e2e/el-simulador-avisa-si-no-guardo.spec.ts
```
