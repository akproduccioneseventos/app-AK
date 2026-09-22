# Orden 80: cierre residual, sin rehacer lo corregido

Base main659d696e4807b3fcd543a53988c21c189cf3e806. Sustituye la orden78 de Codex invitados-barra-catalogos, NO las ordenes78/79 de Gemini sobre portada y enlaces. Ver docs/auditoria/REVALIDACION-659d696-2026-09-22.md. Contrastar cualquier tanda nueva antes de programar.

Codex audita. Claude:datos,permisos,stock y compilacion. Gemini:interfaz. Dueno aprueba cambios de funcionamiento y fusion. No nueva PR por cada hallazgo; coordinar una tanda. No datos reales para pruebas.

## Conservar lo aprobado

- QR por nombre se mantiene por decision del dueno; INV02 NO se implementa. No pedir telefono/mail ni cambiar como confirma el invitado.
- Mantener correcciones actuales de reuniones, fecha imposible, lista con un dato corrupto, fechas nocturnas y compensacion de stock cuando respaldo devuelve success:false.
- No reimplementar enlaces/portada que ya entraron en main.

## Corregir lo residual

1. CAL05: fecha YYYY-MM-DD es dia civil, no instante UTC. Hoy10/10 se dibuja9/10.
2. CAL06: cambiar fecha debe preservar dia/hora Uruguay aun si servidor corre en UTC. Hoy pedir12/10 puede guardar11/10Uruguay.
3. BAR01: manejar excepcion de respaldo y fallo de reposicion, no solo success:false. Recuperacion durable/idempotente y visible, sin descuento huerfano ni reintento con doble consumo.
4. INV01: contrato publico de submitPublicRsvp sin updatedFiesta, otros invitados o campos internos. Esto NO cambia QR por nombre. Revisar demas lecturas exportadas pertinentes para que no sobreviva la misma exposicion por otra entrada.
5. BAR02/BAR03: recuperar cadena fallback rechazada y reemplazo de trago consistente; no cancelar definitivamente el anterior si el nuevo falla.
6. CAT01/CAT02/CAT03: conservar dos altas de fotos o ediciones de salones simultaneas y borrar ultimo registro por mutacion individual explicita. No desactivar proteccion global de arrays vacios.

## Aceptacion

Reutilizar las sondas con SHA indicado y convertir casos a pruebas integradas. Fechas con y sin hora, TZUTC/TZUruguay; pedido guardado/retorno false/excepcion/reposicion fallida; alta RSVP sin datos ajenos; dos escrituras simultaneas; ultimo borrado y recarga. Los casos antiguos sin cambios conservan evidencia, no necesitan repetir exploracion.

Claude registra compilacion del conjunto congelado, SHA, comandos/resultados, omisiones y entorno. Codex valida evidencia, no aprueba por presencia de codigo. Los tests siguientes son PROPUESTOS/PENDIENTES; el bloque no afirma que existan ni que hayan corrido. Mantener registro compartido.

```comprobar
archivo: src/app/actions/agenda.ts
usa: getCalendarEvents en src/app/(app)/calendario/page.tsx
prueba: src/__tests__/calendario-dia-civil-y-servidor-utc.test.ts
archivo: src/app/actions/fiesta/barra-tecnologica.actions.ts
usa: createBarDrinkOrder en src/app/invitacion/[fiestaId]/invitado/[guestId]/MiniQuiosco.tsx
prueba: src/__tests__/barra-pedido-y-stock-consistentes.test.ts
archivo: src/app/actions/fiesta/invitados.actions.ts
usa: submitPublicRsvp en src/app/invitacion/[fiestaId]/rsvp/page.tsx
prueba: src/__tests__/rsvp-respuesta-minima-sin-cambiar-qr.test.ts
archivo: src/app/actions/catalogo-fotos.ts
usa: addCatalogoFoto en src/app/(app)/empresa/galeria/page.tsx
prueba: src/__tests__/catalogos-concurrencia-y-ultimo-borrado.test.ts
archivo: src/app/actions/salones.ts
usa: saveSalon en src/app/(app)/empresa/salones/page.tsx
prueba: src/__tests__/catalogos-concurrencia-y-ultimo-borrado.test.ts
```

