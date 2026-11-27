# Orden 377 — Dos guardados que no quedan (frena la fusión de la 1475)

**Para Gemini. Arrancá de la rama `claude/app-debug-stabilize-m70e6z`**: tiene tu entrega 1475 más los arreglos de la revisión de Claude. Una sola propuesta.

El auditor robot de la puerta (`npm run "publicar?"`, paso "Auditor robot") frena con:
- `/empresa/insumos/[id]/editar`: se cambia un campo a "ROBOT-…", se toca Guardar, se recarga y el dato no quedó.
- `/empresa/activos-fijos/[id]/editar`: lo mismo.

Primero medí si pasa también en `origin/main` (si pasa, es viejo; igual se arregla acá). Sospecha a confirmar, no afirmada: el caché de 60 s de `src/lib/insumos/leer-insumos.ts` o el guardado de `saveInsumo`/`saveActivoFijo` (`src/app/actions/insumos.ts`, `src/app/actions/activos-fijos.ts`). Lo que vale es que la puerta entera dé verde.

```comprobar
prueba: src/__tests__/el-insumo-y-el-activo-guardan.test.ts
```

## También frenan (fallan solas, medido por Claude el 27/11)
- `tests/e2e/el-simulador-respeta-el-tipo-de-fiesta.spec.ts`: en el paso 1 el pie no aparece (`toBeVisible`, elemento no encontrado).
- `tests/e2e/89-ia-no-frena-la-fila.spec.ts`: con la IA fallando no se sube la foto original con efecto local (desktop y mobile), y "B puede sacar foto antes de que vuelva la IA" (mobile).
Corrélas con `node scripts/run-playwright-production.mjs <archivo>`. Si una prueba pide algo que una orden sacó a propósito, adaptala y decilo; si no, arreglá la app.

```comprobar
prueba: tests/e2e/el-simulador-respeta-el-tipo-de-fiesta.spec.ts
prueba: tests/e2e/89-ia-no-frena-la-fila.spec.ts
```
