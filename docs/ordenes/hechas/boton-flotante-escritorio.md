# Lo que hay que hacer ahora

**Para:** Gemini (Antigravity)
**Escribe:** Claude
**Fecha:** 16 de agosto de 2026
**Base:** `main` actualizado. Sincronizar antes de empezar.

Ésta es la **única orden vigente**. Es corta a propósito: las once mejoras ya se
entregaron y se fusionaron. Queda **una sola cosa**, que se pidió después de que
la entrega anterior ya estaba empezada.

---

# BLOQUE ÚNICO — El botón flotante todavía se monta sobre el logo en escritorio

`src/components/module-navigation-dock.tsx`

**En el celular ya está resuelto**: el título de las pantallas internas se lee
entero. Gracias.

**En escritorio falta.** El botón flotante —la flecha de volver y el cuadradito
del panel— sigue clavado arriba a la izquierda y **se monta sobre el recuadro
del logo de la barra lateral**. Se ve en Eventos, en Presupuestos, en Pagos
Rápidos y en el resto de las pantallas internas: el logo de AK queda con un
botón blanco encima.

**Qué hacer:** que en escritorio tampoco quede flotando encima de nada. Las dos
salidas razonables son meterlo dentro de la barra lateral, debajo del logo, o
correrlo al área de contenido. Elegí una y aplicala parejo.

**No toques lo del celular**, que ya quedó bien.

Cuando termines, sacá esta foto y mirá el logo de la barra lateral antes y
después:

```
AK_FOTOS=true node scripts/run-playwright-production.mjs tests/e2e/fotos-de-la-app.spec.ts --grep "equipo-eventos"
```

---

## Lo que NO se toca nunca

- La validación del token de proveedor (`verifyAccesoPersonalToken`) en
  `fotografia` y `catering`.
- Los tiempos de la fotocabina: 10 segundos la primera foto, 4 las demás.
- Los topes del contrato: 10% de reducción, 30% de aumento.
- Plata, cobros, comida y permisos: eso lo escribe Claude.
- **No migres colores al tema.** Descartado: la app no tiene modo oscuro.

## Una cosa para la próxima entrega

**Las once mejoras vinieron en TRES propuestas, y la orden pedía UNA.** No es un
detalle: cada fusión se paga, y sobre todo, **dos entregas separadas arreglaron
la misma pantalla de dos maneras distintas** —la galería vacía— y al juntarlas
quedó rota. Hubo que repararla a mano antes de fusionar.

Cuando la orden dice una sola propuesta, es una sola.

## Los controles antes de entregar

1. `npm run build`
2. `npx tsc --noEmit`
3. `npx jest --silent`
4. `npm run check:acentos`

## Cuando termines

Avisá el número de la propuesta, anotá lo hecho en `docs/YA-RESUELTO.md` y mové
este archivo a `hechas/` en la misma propuesta.
