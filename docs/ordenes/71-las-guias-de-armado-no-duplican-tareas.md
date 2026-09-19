# Orden 71 — Las guías de armado: si el paso 2 falla, no se duplica al reintentar

**Para Gemini.** Va **en la misma propuesta** que el resto de la tanda
(`docs/ordenes/TANDA-2026-09-18-que-sigue-para-gemini.md`).

## Por qué

Lo encontró Codex el 19 de septiembre de 2026 y lo verifiqué en el código. En
`src/app/actions/playbooks.ts`, `applyPlaybookToFiesta` (línea ~82), la aplicación de una guía
hace **dos guardados, uno atrás del otro**:

1. Guarda la fiesta con las tareas nuevas ya agregadas (línea ~130).
2. Anota en el historial de aplicaciones (línea ~145).

**Si el segundo falla, devuelve `success: false` y `tareasGeneradas: 0`… pero las tareas ya están
creadas.** La pantalla (`src/app/(app)/playbooks/page.tsx`, `handleApply`) deja el diálogo abierto
y habilita el botón de nuevo, así que el operador **aplica otra vez y quedan todas las tareas
duplicadas**. Y el historial sigue sin decir que se aplicó.

Es la misma familia que ya nos costó caro: **lo que salió a medias no puede decir que no salió**.

## Qué hacer

**Decisión tomada, para que no la adivines: no se borran las tareas ya creadas.** Deshacer un
guardado que ya entró es más riesgoso que informarlo bien.

1. **Si el paso 1 falla**, queda como está: error y nada creado. Eso ya funciona.
2. **Si el paso 1 salió bien y falla el paso 2**, la función tiene que devolver **la verdad**:
   las tareas creadas —el número real, no cero— y un aviso de que **no se pudo anotar en el
   historial**. Un campo nuevo, por ejemplo `historialNoAnotado: true`.
3. **La pantalla, con ese aviso**, dice en criollo: *"Se crearon N tareas, pero no se pudo anotar
   la aplicación en el historial. **No vuelvas a aplicarla**: las tareas ya están."* Y **cierra
   el diálogo**, en vez de dejarlo listo para reintentar.
4. **Y el freno de verdad:** antes de aplicar, mirar el historial
   (`getPlaybookAplicaciones()`): si esa guía **ya se aplicó a esa fiesta**, avisar y pedir
   confirmación —*"esta guía ya se aplicó el 12 de septiembre; ¿querés aplicarla igual?"*—. No lo
   prohíbas: aplicarla dos veces a propósito tiene que seguir siendo posible.

## Lo que NO se toca

- El contenido de las guías ni las tareas que generan.
- El historial de aplicaciones: **no se borra ni se limpia**.
- La generación de documentos, que Codex dio por buena.

## Qué tiene que comprobar la prueba

1. Con el paso 2 fallando a propósito: el resultado **dice cuántas tareas se crearon** (no cero) y
   marca que el historial no se anotó.
2. **Reintentar después de ese fallo NO duplica**: la pantalla avisa que ya está aplicada.
3. Con todo bien, se aplica una vez y quedan las tareas una sola vez.
4. Rompela a propósito —volviendo a devolver cero— y verificá que se ponga en rojo.

```comprobar
archivo: src/app/actions/playbooks.ts
usa: historialNoAnotado en src/app/(app)/playbooks/page.tsx
prueba: src/__tests__/las-guias-de-armado-no-duplican-tareas.test.ts
```
