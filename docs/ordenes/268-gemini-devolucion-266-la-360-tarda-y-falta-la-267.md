# Orden 268 — Devolución de la 266: la 360 todavía tarda, y falta la 267 (03/11/2026)

**Para Gemini.** Seguí sobre `gemini/orden-262-anuncio-al-simulador`, **después de `git pull`**.
**Una sola entrega con los dos bloques, no fusiones.** Si un bloque se traba, entregá el otro igual y avisá cuál faltó.

**Lo que ya está bien y no se toca:** todo lo de la 262 a la 265, y de la 266 la duración del video
(`armarLineaDeTiempo360`, Jest 19 de 19) y el aviso de corte de red. Tipos en cero, Jest y compilación en verde.

## Bloque 1 — con la máquina ocupada, el aviso de subida rechazada no llega

Medido por Claude: `tests/e2e/90-lo-que-va-atras-dice-donde-quedo.spec.ts`, "Plataforma 360 con subida rechazada",
**pasa sola y falla dos veces seguidas en la corrida completa**. La pantalla queda en **"Subiendo tu video 360 al
muro..."** a los 45 segundos, sin mostrar el error. La fotocabina, con la misma prueba, pasa siempre.

- En `src/app/evento/plataforma-360/[fiestaId]/page.tsx`, alrededor de las líneas 600 a 760, medí cuánto tarda cada
  parte entre que termina la grabación y que llega la respuesta de la subida: el armado con `armarLineaDeTiempo360`, el
  `await updateEntertainmentSessionStatus(...)` (línea ~743) y la subida. Lo que no haga falta esperar, que no se espere.
- Si el armado dibuja cuadro por cuadro en tiempo real, que dibuje más rápido que el tiempo real. El video final no
  puede tardar en armarse lo mismo que dura.
- **No se toca la prueba ni su tope de 45 segundos.** El aviso tiene que llegar en **menos de 30 segundos** después de
  grabar, con la máquina ocupada.

## Bloque 2 — la orden 267, que quedó sin hacer

Está entera en `docs/ordenes/267-gemini-el-total-con-el-ajuste-anual-a-la-vista.md` (la versión corregida: **el ajuste
anual NO se le muestra al prospecto**). Hacela tal cual dice ahí, con sus dos pruebas.

## Al terminar

Corré `npx tsc --noEmit` y `npx jest --silent`, con cero errores. Repasá `docs/ANTES-DE-ENTREGAR.md`. No subas `data/`
ni `src/data/`.

```comprobar
prueba: tests/e2e/90-lo-que-va-atras-dice-donde-quedo.spec.ts
prueba: src/__tests__/el-prospecto-no-ve-el-ajuste.test.tsx
prueba: tests/e2e/el-simulador-no-muestra-el-ajuste.spec.ts
```
