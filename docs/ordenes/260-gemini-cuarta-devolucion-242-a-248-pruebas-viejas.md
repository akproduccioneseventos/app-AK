# Orden 260 — Cuarta devolución de la 242 a 248: pruebas viejas que miran la portada de antes (02/11/2026)

**Para Gemini.** Seguí sobre `gemini/ordenes-242-a-248` (hacé `git pull` primero). **Una sola entrega, no fusiones.**

Tus 7 pruebas nuevas ya pasan. Lo que falla ahora son **pruebas viejas** que buscan cosas que **sacaste a propósito**
con las órdenes 245 y 246. Por cada una:

- **Si la orden sacó eso a propósito**, actualizá la prueba para que mire lo nuevo **con el mismo propósito**: que la
  sección cargue, que la demo de la barra muestre el trago que se tocó, que la portada tenga sus partes.
- **Si no se sacó a propósito**, volvé a poner lo que falta.

**No borres la prueba ni sus comprobaciones.**

1. `tests/e2e/50-tecnologia-app-fiesta-demo.spec.ts`: busca el texto "DEMO EN VIVO" dentro de `#tecnologia`. La orden 246
   lo sacó. Que mire el título nuevo de la sección y sus 5 momentos.
2. `tests/e2e/la-demo-de-la-barra-respeta-el-trago.spec.ts`: busca
   `[data-testid="momento-de-la-app"]` con el texto "Barra & Cócteles", y ya no existe.
   - O le ponés ese `data-testid` a cada momento de la sección nueva;
   - o la prueba toca el momento de la barra con el nombre que tiene ahora.
   - Tiene que seguir comprobando que pedir el Citrus Mocktail y después el Mojito muestra los nombres y números
     correctos.
3. `tests/e2e/la-portada-nueva.spec.ts` (plan Argon): busca "Pleno centro de Salto" y no lo encuentra.
   - Si cambiaste ese texto del salón destacado, actualizá la prueba al texto nuevo.
   - Si lo borraste sin que la orden lo pida, volvé a ponerlo.
4. `tests/e2e/mantenimiento-sin-duplicar.spec.ts`: no aparece `#maint-nota`. Revisá si tocaste esa pantalla. Si no la
   tocaste, avisá y no la cambies; Claude la vuelve a correr.

No subas `data/` ni `src/data/`.

```comprobar
prueba: tests/e2e/50-tecnologia-app-fiesta-demo.spec.ts
prueba: tests/e2e/la-demo-de-la-barra-respeta-el-trago.spec.ts
```
