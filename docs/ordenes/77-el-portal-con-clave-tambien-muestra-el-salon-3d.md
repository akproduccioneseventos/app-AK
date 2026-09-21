# Orden 77 — El portal con clave también muestra el salón en 3D (y la decoración vive en un solo lugar)

**Para Gemini. UNA SOLA PROPUESTA con los dos bloques.**

Antes de decir "terminé", leé `docs/ANTES-DE-ENTREGAR.md` sobre lo que tocaste.

**De dónde sale:** el salón en 3D quedó hecho y andando —**no se rehace**— pero **en una sola de
las dos puertas por las que entra el cliente**.

## Lo que ya está y NO se toca

- `src/app/portal/[fiestaId]/decoracion/page.tsx`: ahí está el salón en 3D andando, con el
  respaldo en foto cuando el celular no puede dibujarlo (`canRenderWebGL`). **Ése es el modelo.**
- `src/components/salon-3d/` entero, y `src/lib/decoracion/generar-layout-automatico.ts`.

---

## Bloque 1 — La otra puerta del cliente

El cliente entra por dos lados y **ve cosas distintas**:

- Por `/portal/[fiestaId]/decoracion` → **ve el salón en 3D**.
- Por su enlace privado con clave, `/portal/c/[accessKey]` → en
  `src/app/portal/c/[accessKey]/PublicPortalClientExperience.tsx:1404` **sigue viendo sólo la
  foto** (`fiesta.decoracion.salonPreview3dUrl`).

**Qué se hace:** que el de la clave muestre lo mismo. **No copies el código**: sacá el bloque
del 3D de la pantalla que ya anda a un componente propio —por ejemplo
`src/components/decoracion/SalonDelClienteEn3D.tsx`— y que **las dos pantallas usen ese mismo
componente**. Dos copias se despegan en un mes; ya pasó en esta app con la carga de fotos del
Video de Vida.

**Le falta un dato al portal con clave, y ése lo engancho yo:** `mapFiestaToClientPortal`
(`src/lib/client-portal/public-fiesta.ts:110`) hoy no le manda `salonElements` ni
`pixelsPerMeter`. **Dejalo pedido en la propuesta y lo agrego yo**, porque ese archivo decide
qué ve el cliente. Programá contra esos dos campos.

**Y lo de siempre:** sólo el plano. Nunca notas internas, costos ni proveedores.

```comprobar
archivo: src/components/decoracion/SalonDelClienteEn3D.tsx
usa: SalonDelClienteEn3D en src/app/portal/c/[accessKey]/PublicPortalClientExperience.tsx
prueba: tests/e2e/el-cliente-gira-su-salon-en-3d.spec.ts
```

---

## Bloque 2 — La prueba de navegador que falta

La orden 75 pedía una prueba que **mire el resultado en la pantalla del cliente**, y no llegó.
Va en `tests/e2e/el-cliente-gira-su-salon-en-3d.spec.ts` y tiene que comprobar, **por las dos
puertas**:

- Con una fiesta que tiene plano, **aparece el salón en 3D** (el dibujo, no la foto).
- **Girándolo cambia lo que se ve.**
- Con una fiesta **sin plano**, aparece el cartel de siempre y **no** un cuadro roto.

La sesión y la fiesta de prueba se arman con `tests/e2e/helpers/fiesta-de-prueba.ts`, con
`ponerSesionDelEquipo` donde haga falta; el portal con clave se abre con
`clientPortalSettings.accessKey`.

```comprobar
prueba: tests/e2e/el-cliente-gira-su-salon-en-3d.spec.ts
```

**La pregunta antes de dar cada línea por buena:** *¿esto daría verde con la función apagada?*
Si la respuesta es sí, está mal escrita.
