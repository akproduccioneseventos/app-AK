# 104 — Lo que Codex marcó en la propuesta 1240 y todavía no está arreglado

**Para:** Gemini.
**Escrita por:** Claude, el 1 de octubre de 2026. El dueño: *"todo debe estar revisado, corregido y
tomado en cuenta para la lista de cortafuegos"*.

Codex revisó la propuesta 1240 (órdenes 95-97) el 28/09 y dejó 16 hallazgos con su evidencia en la
rama `codex/entorno-windows-94`, carpeta `docs/evidencias/` (archivos `96-…` a `112-…`). Los revisé
contra el código de hoy: **cuatro ya están arreglados** (medición, tarea del asistente elegida por
texto, conversaciones del asistente, aviso de "guardado" en la reunión) y **los demás no**.

## Cómo se entrega

- **UNA SOLA PROPUESTA con las órdenes 104, 101, 102, 105 y 106**, en ese orden (primero los
  arreglos de la 104). Arrancá de la rama **`claude/ponte-al-dia-qtrho3`** (tiene estas órdenes y la
  versión principal de hoy). Si un bloque se traba, entregá el resto y avisá cuál.
- `npm run "publicar?"` completo y la última pantalla pegada en la propuesta.
- Pasá por `docs/ANTES-DE-ENTREGAR.md`. Anotá cada bloque en `docs/YA-RESUELTO.md` con su línea en
  `comprobar`.

---

## Confirmados en el código (están rotos hoy)

### Bloque 1 — Hoja de cocina: 0 adultos se convierte en el total estimado (comida)

`src/app/(app)/fiestas/nueva/catering/hoja-de-cocina/page.tsx` ~l.56:
`presupuesto?.invitadosAdultos || Number(fiesta.configuracion?.invitadosEstimados) || 0`. Con 0
adultos y 40 niños, toma 40 adultos: el doble de comida. Usá `??` y respaldo **sólo si el campo no
existe** (`undefined`/`null`), nunca si es 0. Prueba (Jest): 0 adultos + 40 niños + estimado 40 da
40 porciones; adultos ausente + estimado 40 da 40 adultos. Evidencia Codex `106-…`.

### Bloque 2 — Reunión de organización: las notas del cronograma no se guardan

`src/app/(app)/fiestas/nueva/reunion-organizacion/page.tsx`: `cronogramaNotas` (~l.70, campo ~l.437)
no entra en lo que se guarda (~l.150 y ~l.213). Guardalo en `reunionOrganizacion.cronogramaNotas`
(sumalo al tipo en `src/types/fiesta.ts`), cargalo al abrir, y que se vea en la orden de evento.
Prueba de navegador: escribir, guardar, recargar, el texto sigue. Evidencia `104-…`.

### Bloque 3 — Mantenimiento de un equipo: el gasto y el registro no van juntos (plata)

`src/app/(app)/empresa/activos-fijos/[id]/editar/page.tsx` ~l.146-181: si `saveGastoGeneral` falla,
igual agrega el mantenimiento con costo y muestra "Mantenimiento registrado"; y el historial se
guarda recién al guardar el formulario, así que reintentar duplica el gasto. Hacé una sola acción
del servidor `registrarMantenimientoDeEquipo(equipoId, {fecha, nota, costo})` que guarde **primero**
el registro en el equipo con un `id` y después el gasto con `idempotencyKey = mantenimiento:<equipoId>:<id>`
(si ya existe un gasto con esa clave, no crea otro). Si el gasto falla, el registro queda marcado
`gastoPendiente: true` y la pantalla dice "Se anotó el mantenimiento pero no el gasto: tocá
Reintentar". Prueba: gasto que falla → no dice "registrado" y queda pendiente; reintento → un solo
gasto. Evidencia `103-…`.

### Bloque 4 — La orden de evento impresa corta en 6 artículos por categoría

`src/app/(app)/fiestas/nueva/orden-de-evento/page.tsx` ~l.417: `.slice(0, 6)`. Sacalo: se imprime la
lista entera (que pase de página si hace falta). Prueba de navegador con una categoría de 10
artículos: los 10 aparecen. Evidencia `105-…`.

### Bloque 5 — La alerta de mantenimiento vencido no sale nunca

La regla `mantenimiento-equipo-vencido` (`src/lib/automatizaciones-engine.ts` ~l.129-143) necesita
los equipos, pero `getAlertasGlobales` y `getAlertasPorFiesta` (`src/app/actions/alertas.actions.ts`
~l.14-30) no se los pasan. Leé los activos fijos (mismo origen que usa
`src/app/(app)/empresa/activos-fijos/page.tsx`) y pasalos al motor. Prueba **a nivel de la acción**
(no del motor): un equipo asignado a una fiesta en 5 días con mantenimiento vencido genera la
alerta en `getAlertasGlobales`. Evidencia `107-…`.

### Bloque 6 — La llegada con ubicación no se puede prender

`llegadaConUbicacion` (`src/types/settings.ts`, `getAjustesLlegadaPersonal` en
`src/app/actions/settings.ts`) no tiene ninguna pantalla. El dueño eligió que sea **opcional**: sumá
un interruptor "Controlar que el personal esté en el salón al marcar la llegada" y la distancia, en
Ajustes, con el guardado que ya existe. Prueba de navegador: prender, recargar, sigue prendido.
Evidencia `108-…`.

### Bloque 7 — El escaneo de la carga dice "cargado" antes de guardar

`src/app/(app)/fiestas/nueva/carga-operativa/page.tsx` ~l.188: `void persistItemPatch(...)` y en
seguida el cartel "✅ Equipo Cargado". Esperá el resultado: si falla, volvé atrás el cambio en
pantalla y avisá. Prueba: con el guardado fallando, no aparece "Equipo Cargado". Evidencia `102-…`.

### Bloque 8 — QR de equipos: faltan las etiquetas y el lector con cámara

La orden 95 (bloque 9) pedía imprimir etiquetas QR en Activos Fijos y leerlas con la cámara; hoy
sólo se puede tipear el código (`src/lib/logistica/qr-carga.ts`, prefijo `PREFIJO_QR_EQUIPO`).
Sumá en `src/app/(app)/empresa/activos-fijos/page.tsx` "Imprimir etiquetas" (una hoja A4 con el QR
`ak-equipo:<id>` y el nombre de cada equipo) y en la carga un botón "Escanear con la cámara" que use
el lector que ya usa `src/app/(app)/fiestas/nueva/invitados/checkin-scanner/page.tsx`. Es
**opcional** para el equipo: el ingreso tipeado sigue. Evidencia `109-…`.

### Bloque 9 — Mejor horario y reciclado de publicaciones: escritos y sin usar

Los cálculos de `src/lib/presencia-digital/mejor-horario.ts` y el reciclado de
`src/lib/presencia-digital/publicador.ts` ~l.513 no los llama ninguna pantalla ni tarea. Engancharlos
donde la orden 95 lo pidió (pantalla de presencia digital: sugerir el horario al programar, y
"reciclar" una publicación vieja que anduvo bien) o, si no se puede, **sacarlos** y decirlo. Un
cálculo que nadie usa no se deja. Evidencia `99-…`.

## Marcados por Codex, sin confirmar todavía: primero la prueba

Para cada uno, escribí la prueba de lo que describe la evidencia de Codex. **Si se pone en rojo,
arreglalo; si da verde, queda como cortafuegos.**

### Bloque 10 — Avisos al cliente duplicados (evidencia `96-…`)
`src/lib/whatsapp/avisos-al-cliente.ts` ~l.63-70: dos corridas a la vez, o una corrida donde
`saveScheduledMessage` sale bien y `actualizarFiesta` falla, no pueden dejar dos avisos en la bandeja.
Usá como clave del mensaje `aviso:<fiestaId>:<reglaId>` y que `saveScheduledMessage` no cree otro
con la misma clave.

### Bloque 11 — Recontacto de prospectos (evidencia `97-…` o la que nombre "recontacto")
`src/lib/marketing/whatsapp-remarketing.ts` (`plantilla`, `paso` ~l.10-11) y
`candidatos-recontacto.ts`: el texto que sale tiene que ser el de la plantilla del paso; un
prospecto viejo no recibe dos pasos en el mismo día; y Ajustes muestra los pasos. La prueba mira
**el texto** del mensaje, no sólo que se mandó.

### Bloque 12 — Respuestas automáticas a comentarios (evidencia `98-…`)
`src/lib/social-media/comments-backfill.ts` y quien responde: una queja escrita como pregunta
("¿por qué nunca contestan?") no recibe respuesta automática; la respuesta sale del catálogo de
Ajustes; el backfill no contesta comentarios de más de 7 días; dos corridas no contestan dos veces.
Sigue **apagado por omisión**.

### Bloque 13 — Recordatorio de invitaciones no abiertas (evidencia `101-…`)
`src/lib/invitaciones/recordatorio-no-abiertas.ts`: la llamada a `sendGoogleGmailMessage` usa la
firma real de la función (mirá su definición en `src/lib/google-workspace.ts`); si Gmail falla,
suma a `fallados`; y un reintento no manda dos veces al mismo invitado.

```comprobar
no-usa: invitadosAdultos || Number(fiesta.configuracion?.invitadosEstimados) en src/app/(app)/fiestas/nueva/catering/hoja-de-cocina/page.tsx
usa: cronogramaNotas en src/types/fiesta.ts
usa: registrarMantenimientoDeEquipo en src/app/(app)/empresa/activos-fijos/[id]/editar/page.tsx
no-usa: .slice(0, 6) en src/app/(app)/fiestas/nueva/orden-de-evento/page.tsx
no-usa: void persistItemPatch en src/app/(app)/fiestas/nueva/carga-operativa/page.tsx
usa: ak-equipo en src/app/(app)/empresa/activos-fijos/page.tsx
usa: mantenimiento-equipo-vencido en src/app/actions/alertas.actions.ts
```
