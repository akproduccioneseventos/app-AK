# Estado actual

**Última actualización:** 24 de agosto de 2026.
**PR candidata:** #1128.
**Rama:** `codex/auditoria-final-lanzamiento-20260823`.
**Base exacta:** `main` en `2190ff9a9a115dd7cdc8e86a40039a20dd01dbc5`.

## Trabajo integrado

- La PR fue reconstruida con padre directo en el main actual; no arrastra una base vieja.
- Conserva seguridad social, colas offline, agenda, catering, FCM y locks de Firestore.
- Separa el alquiler del Club Uruguay del total de servicios AK sin quitar el 50% comercial.
- Conserva el reloj del simulador, el ajuste anual del 15% y los textos comerciales vigentes.
- Separa App Hosting del despliegue del despertador programado con Node 20.
- Actualiza dependencias y elimina la vulnerabilidad crítica de producción detectada.
- Registro detallado en `docs/YA-RESUELTO.md`.

## Evidencia del candidato conciliado

- TypeScript: aprobado.
- ESLint: aprobado sin advertencias ni errores.
- Pruebas focalizadas: 9 suites y 66/66 pruebas aprobadas.
- La versión anterior del mismo código pasó 335 suites y 2165 pruebas antes de descartar
  los cinco cambios incompatibles; no se presenta ese resultado como corrida del nuevo SHA.
- E2E y servicios/hardware reales no fueron repetidos por Codex en este SHA.

## Estado

La PR queda abierta para que el dueño la fusione. Codex no la fusionó.
