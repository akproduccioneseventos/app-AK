# Orden 65 — La carga operativa avisa cuando no alcanza el equipo

**Para Gemini.** **UNA SOLA propuesta.** Si algo se traba, entregá el resto igual y avisá cuál faltó.

**Antes de decir "terminé", leé `docs/ANTES-DE-ENTREGAR.md`**: son **quince preguntas**.

## Por qué

Lo encontró Codex el 18 de septiembre de 2026 y lo verifiqué: **se pueden pedir 12 parlantes
teniendo 10, y la pantalla no dice nada.**

El control existe y funciona: `checkAssetConflicts` en
`src/app/actions/fiesta/carga-operativa.actions.ts` línea ~196 calcula el stock libre para esa
fecha —descontando lo que usan las otras fiestas del mismo día— y marca el ítem con
`hasConflict: true` y `availableStockAtDate`. La pantalla ya sabe pintarlo en rojo y decir
"Falta Stock" (`src/app/(app)/fiestas/nueva/carga-operativa/page.tsx`, líneas ~83 a ~129).

**El agujero está en el medio:** cuando el operador **edita la cantidad a mano**, nadie vuelve a
preguntar. `handleItemQuantityChange` (línea ~592) sólo cambia el número en pantalla y
`handleItemQuantityCommit` (línea ~603) lo guarda. **Ninguna de las dos llama a
`checkAssetConflicts`**, así que el ítem conserva la marca vieja —normalmente `hasConflict: false`—
y el cartel rojo nunca aparece. El día del evento faltan dos parlantes.

Que el equipo se agregue desde el catálogo sí lo revisa (línea ~537). Es sólo la edición a mano.

## Qué hay que hacer

- En **`handleItemQuantityCommit`**, después de guardar, volver a pasar ese ítem por
  `checkAssetConflicts(fiestaId, fiesta.configuracion.fechaEvento, [item])` y **actualizar
  `hasConflict` y `availableStockAtDate` en la pantalla** con lo que devuelva. Es exactamente lo
  que ya hace la línea ~537 al agregar del catálogo: **copiá ese patrón, no inventes otro.**
- Que el aviso aparezca **mientras el operador todavía está en la pantalla**, no al recargar.
- El contador de conflictos de la línea ~649 tiene que subir solo, porque lee `hasConflict`.

## Lo que NO se toca

- **`checkAssetConflicts` no se toca**: la cuenta está bien y descuenta las otras fiestas del día.
- **No bloquees el guardado.** El operador a veces sabe que consigue equipo prestado: se avisa en
  rojo, no se le prohíbe. Así funciona hoy y así queda.
- La pantalla de catálogo y el resto de la carga operativa, igual.
- **El borrado de equipos asignados ya lo arreglé yo** en `src/app/actions/activos-fijos.ts`: no
  lo rehagas.

## Qué tiene que comprobar la prueba

**No alcanza con que el archivo nombre `checkAssetConflicts`.** La prueba tiene que:

1. Con un equipo de 10 unidades en el catálogo y una fiesta sin conflicto, **escribir 12 a mano**
   en la cantidad.
2. Comprobar que **aparece el cartel "Falta Stock"** y que dice cuántas hay disponibles, **sin
   recargar la pantalla**.
3. Bajar la cantidad a 8 y comprobar que **el cartel desaparece**.
4. Rompela a propósito —sacando la llamada nueva— y verificá que se ponga en rojo. Dejalo escrito
   en el comentario de arriba del archivo.

```comprobar
archivo: src/app/(app)/fiestas/nueva/carga-operativa/page.tsx
usa: checkAssetConflicts en src/app/(app)/fiestas/nueva/carga-operativa/page.tsx
prueba: tests/e2e/la-carga-operativa-avisa-cuando-no-alcanza.spec.ts
```
