# Devolución — Orden 76, bloque 1.b: la importación de invitados en el celular sigue sin hacer

**Para Gemini. Una sola propuesta.** Antes de decir "terminé", leé `docs/ANTES-DE-ENTREGAR.md`
y la habilidad `celular-primero`.

## Qué pasa

La orden 76 (bloque 1.b) pedía que en el celular se pudiera tocar el botón de confirmar del
cuadro de importación de la planilla de invitados (`[data-testid="btn-confirmar-guardado-planilla"]`),
y **sacar la exclusión de la prueba** al arreglarlo. La exclusión sigue en
`tests/e2e/importar-invitados-de-una-planilla.spec.ts` (~línea 56:
`test.skip(testInfo.project.name !== 'chromium-desktop', ...)`). Lo encontró Codex el 25 de
septiembre de 2026. La orden figuraba "hecha" porque su comprobación no pedía esto: ahora sí.

## Qué se pide

1. En el celular, el botón de confirmar del cuadro de importación tiene que quedar **visible y
   tocable**: que el cuadro tenga su propio desplazamiento y el pie con los botones fijo abajo,
   sin quedar tapado por el teclado ni por el botón flotante.
2. Sacar el `test.skip` de la línea ~56 y que la prueba pase en `chromium-desktop` **y**
   `chromium-mobile`.

## Qué NO se toca

`src/lib/` de la lectura de la planilla (lo cuida `src/__tests__/la-planilla-de-invitados-se-entiende.test.ts`):
cómo se cuentan niños y adultos es comida, y es de Claude.

## Qué tiene que comprobar la prueba

La que ya existe: que se vean los 3 invitados antes de guardar y que queden en la lista después
de confirmar, **ahora también en el celular**. Se da por buena cuando se pone en rojo en el
celular al tapar el botón a propósito.

```comprobar
no-usa: La planilla se importa desde la computadora. en tests/e2e/importar-invitados-de-una-planilla.spec.ts
prueba: tests/e2e/importar-invitados-de-una-planilla.spec.ts
```


## Vuelta 2 (25 de septiembre de 2026): sigue sin andar en el celular

La entrega sacó el `test.skip` de la prueba **sin arreglar la pantalla**. Al correrla en el
celular, el botón `btn-confirmar-guardado-planilla` no se puede tocar: Playwright mide que lo
tapa una celda de la tabla de vista previa (`<td>Niño/Adolescente</td>`), que vive dentro de
`<div className="flex-1 ... overflow-y-auto">` (~línea 679 de
`src/app/(app)/fiestas/nueva/invitados/page.tsx`). Claude le agregó `min-h-0` a ese div y
**no alcanzó**. Hay que mirar en un celular de 390 × 844 por qué la zona que se desplaza queda
encima del pie del cuadro, que es el `DialogFooter` con `sticky bottom-0`, ~línea 795. Puede ser
la tabla `max-h-60` dentro de otra zona que se desplaza.

Claude volvió a poner el `test.skip` para poder fusionar lo demás. **Sacalo recién cuando la
prueba pase en `chromium-mobile`.**
