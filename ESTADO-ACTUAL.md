# Estado actual

**Ultima actualizacion:** 23 de agosto de 2026.
**Rama candidata:** `codex/corrige-pr-1125-1126`.
**Base:** `origin/main` en `ccd579729`.

## Trabajo integrado

- Integra las propuestas 1125 y 1126 en una sola candidata.
- Protege el creador y auditor de anuncios con permiso CRM y datos separados por usuario.
- Usa enlaces y WhatsApp oficiales, sin telefonos fijos escritos en las pantallas.
- Corrige el plan estimado del simulador: total proyectado del ano del evento, sena configurable y cierre 30 dias antes.
- Consolida la validez del presupuesto en 30 dias y elimina promesas no respaldadas.
- Obtiene extras del portal desde el catalogo publico; cuando no hay precio oficial muestra `Valor a confirmar`.
- Actualiza el mapa automatico a 350 pantallas y documenta las correcciones en `docs/YA-RESUELTO.md`.

## Evidencia local

- TypeScript: aprobado con `npx tsc --noEmit --incremental false`.
- Pruebas focalizadas finales: aprobadas, incluidas seguridad, cuotas, ventas y mapa de la app.
- Pruebas amplias: 334 suites y 2155 pruebas aprobadas; el unico fallo era el mapa desactualizado y su suite paso despues de regenerarlo.
- Acentos: aprobado con `scripts/check-acentos.sh` desde Git Bash.
- Build de produccion: genero `.next/BUILD_ID` correctamente; las advertencias locales fueron por credenciales Firebase/Gemini ausentes durante el build.
- Graphify: actualizado a 8945 nodos, 32623 relaciones y 414 comunidades.

## Estado para fusion

La candidata queda preparada para una unica PR. Las comprobaciones de GitHub pueden aparecer en rojo sin ejecutar pasos por la restriccion de facturacion de la cuenta; eso no representa una deuda de la app ni sustituye esta evidencia local.

No declarar la aplicacion completa sin errores por esta PR: el alcance verificado es la integracion corregida de las propuestas 1125 y 1126.
