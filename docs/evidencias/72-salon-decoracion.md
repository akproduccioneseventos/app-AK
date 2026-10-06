# Auditoria salon: plantilla y escala

- Alcance: guardado/reapertura de plantilla de distribución y conversión de los elementos a escala 3D.
- Main contrastado: `e52c07839563115236652229d73ac5ebf2e4e551` (árbol app consultado vía `git show`).
- PR1259 actualizada: `7c96e11427c673d72638ac593bcd783915955aa8`; no cambia salon/layout/decoracion. El principal volvio a ejecutar la sonda en main y este SHA; el resultado se conserva.
- Antecedentes leídos en `ESTADO-ACTUAL.md` y `docs/YA-RESUELTO.md`: autoguardado, generación automática, compatibilidad 3D y cuotas ya tratados; no se reabren.

## Hallazgo reproducido en action real

Guardar plantilla omite `pixelsPerMeter`, aunque guarda `salonElements` en coordenadas y dimensiones de plano. Al reabrir en el consumidor (`setDecoracion(t.layoutData)`), el layout usa fallback de 40 px/m. Fixture con escala 80 px/m y mesa de 160 px: era 2 m antes de guardar y se interpreta como 4 m al reabrir; el consumidor 3D usa el mismo fallback. **SALON72-1, P2, confirmado por ejecucion aislada**; no se afirma que se pierdan los elementos: los cuatro elementos y sus datos sobrevivieron la ida-vuelta. Orden 123; no correccion ejecutada.

## Comprobación

```comprobar
archivo: src/app/actions/salon-layout-templates.ts
usa: saveSalonLayoutTemplate en src/app/(app)/fiestas/nueva/invitados/layout/page.tsx
usa: pixelsPerMeter en src/components/salon-3d/SalonScene.tsx
prueba: docs/evidencias/72-salon-probe.cjs (ejecutada; fixture aislada, no persistencia Firebase/UI)
```

No se probó interfaz, backend persistente, asignación real de invitados ni todo el módulo. No certifica el recorrido visual 2D/3D ni el resto del salón.
