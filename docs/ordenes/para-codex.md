# Para Codex: estado correcto de la PR #1128

**Corregido:** 24 de agosto de 2026.

La PR #1128 usa la rama `codex/auditoria-final-lanzamiento-20260823`.
Sí compartía historia con main: GitHub confirmó como ancestro común
`3e259324076ba43434506a739a4354cb3f3d0a8c`.

El diagnóstico anterior nombraba otra rama y no aplicaba a esta PR. Para evitar
cualquier riesgo, igualmente se reconstruyó la propuesta con un commit cuyo padre
es el main actual `2190ff9a9a115dd7cdc8e86a40039a20dd01dbc5`.

## Qué se preservó

- El despertador cada 15 minutos y su despliegue.
- Las estaciones offline y sus colas por fiesta.
- Los agentes y avisos existentes en main.
- El arreglo contable de rentabilidad.
- El reloj del simulador.
- El ajuste anual del 15%.
- El descuento comercial del 50% del Club Uruguay.
- WhatsApp prepara mensajes; no los envía.
- Los precios salen del catálogo, salvo decisiones comerciales ya aprobadas.

## Qué se descartó de la auditoría anterior

- Quitar el reloj.
- Quitar el 50% comercial del Club Uruguay.
- Reemplazar el simulador público actual por una versión anterior.
- Documentar bloqueos del entorno como errores confirmados de la aplicación.
- Sobrescribir documentos compartidos con estados viejos.

## Evidencia

TypeScript y ESLint aprobaron. Las 9 suites focalizadas posteriores a la conciliación aprobaron
66/66 pruebas. Los detalles están en `docs/YA-RESUELTO.md` y
`ESTADO-ACTUAL.md`.

La PR queda abierta para que la fusione el dueño; Codex no la fusiona.
