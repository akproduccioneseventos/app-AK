# Evidencia 203: calendario de invitado

**Dictamen posterior del principal:** ver `203-revision-principal.md`. Las tres
salidas civiles pasan; TZ flotante es riesgo/propuesta, NO otro fallo confirmado
ni archivo ICS invalido. El texto original del ayudante se conserva debajo.

- Fuente exacta solicitada: `fa3b492b8f1d6a77433a92f4d63b665cfea3747c`; blob del componente en esa fuente: `ec415320eaebfcf6ef30c62fee7ab568721dd0f3`.
- Checkout de auditoría: `f80113d35551bc9cc6525227b7e5755b4c98525b` (`codex/192-portal-cliente-20261021`). La sonda importa el componente de este checkout; se comprobó que su blob coincide con el de la fuente fijada.
- Símbolo consumidor: `AddToCalendarButton` en `src/components/invitacion/AddToCalendarButton.tsx`, usado por plantillas de invitación; el probe monta el componente, elige Apple/Outlook, captura el Blob descargado y decodifica sus líneas DTSTART/DTEND. No abrió el enlace Google ni usó datos reales.

## Criterios observados

| Criterio | Resultado |
| --- | --- |
| Descarga `.ics` efectiva y MIME `text/calendar;charset=utf-8` | PASS |
| Hora civil del caso Uruguay `2027-06-15T21:30:00-03:00` | PASS en los campos: DTSTART `20270615T213000`, DTEND `20270616T013000` |
| Cruce nocturno `2027-06-15T23:30:00-03:00` | PASS en los campos: `20270615T233000` / `20270616T033000` |
| Año nuevo `2027-01-01T00:30:00-03:00` | PASS en los campos: `20270101T003000` / `20270101T043000` |
| Semántica de zona Uruguay en ICS | FAIL: DTSTART/DTEND flotantes, sin `TZID`, `VTIMEZONE` ni sufijo UTC `Z`; el archivo no declara Uruguay y su interpretación depende del calendario importador. No se verificó una app de calendario consumiendo el archivo. |

La sonda es un montaje ReactDOM aislado con dependencias existentes; no build ni cambios de app. Error descartado de harness: primer montaje carecía de `URLSearchParams`; corregido antes de la evidencia válida. JSDOM puede emitir una advertencia sobre `act`; las capturas posteriores son completas. Ver salidas exactas/casos en `203-calendario-invitado.json`; fuente reproducible en `203-calendario-invitado.mjs`.

## Contraste histórico

`docs/YA-RESUELTO.md` contiene cobertura de otros calendarios (p. ej. entradas alrededor de 2162, calendarios de reuniones/Google y calendarios laborales), pero la búsqueda acotada de `AddToCalendarButton`, `BEGIN:VCALENDAR`, `DTSTART` y `.ics` no localizó prueba histórica de exportación ICS de invitado con decodificación de estos tres casos. No se repitió cobertura equivalente encontrada.

Límite: esto documenta un defecto de interoperabilidad de zona en el ICS exportado, no afirma que una app concreta muestre una hora incorrecta ni certifica el resto de calendarios/app.
