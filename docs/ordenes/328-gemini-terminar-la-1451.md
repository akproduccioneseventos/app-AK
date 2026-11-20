# Orden 328 — Terminar la 1451: cuatro pantallas que no hacen lo que dicen (20/11/2026)

**Tu entrega 1451 (órdenes 322 a 327) todavía no se publicó.** Compila, Jest da todo verde y casi todas las pruebas de pantallas
pasan, pero **cuatro pruebas de navegador fallan** en desktop y en celular. Claude ya arregló lo suyo en la rama
**`claude/juntar-1451`** (tu entrega más sus arreglos): **seguí en esa rama**, no en `gemini/ordenes-323-327`.

**Cómo se entrega:** una sola propuesta desde `claude/juntar-1451`. Antes de decir "terminé", correr
`npm run "publicar?"` completo y `docs/ANTES-DE-ENTREGAR.md`.

## Lo que Claude ya arregló en `claude/juntar-1451` (no lo deshagas)

- `src/app/api/meta/webhook/route.ts`: una mención en una historia **ya no reescribe `fiestas.json`** (pisaba cobros guardados
  al mismo tiempo y buscaba al invitado por un pedazo del nombre). No lo vuelvas a poner.
- `src/app/api/enlaces/clic/route.ts`: el WhatsApp va a `buildWhatsAppLink(..., 'AK-bio')` (antes iba a una ruta que no
  existe), "redes" al Instagram de AK, sólo los cuatro botones cuentan, y el día es el de Uruguay (`hoyEnUruguay`).
- 25 `.catch(() => {})` en lo nuevo pasaron a dejar aviso. **No escribas `.catch(() => {})`**: la puerta lo frena.
- `src/app/presentacion-led/layout.tsx` declara su canónica, y la línea de base de `/enlaces`, `/settings`,
  `/presupuestos/nuevo` y `/contabilidad/crm` quedó con las medidas de este entorno.

## Bloque 1 — El invitado sube una foto al muro y no se entera de nada (lo más grave)

- Prueba: `tests/e2e/muro-subir-foto.spec.ts` ("encuentra cómo compartir y, si falla, se entera"). El invitado toca publicar y
  **no aparece ningún cartel** ("publicada", "Se subió" o "No se pudo publicar") en 45 segundos.
- Lo tocaste en la orden 324 (bloque 1): `uploadSocialPost` en `src/app/actions/social-gallery.ts` ahora llama a `decidir`.
  Mirá que, **sin clave de IA o con la IA colgada**, la subida termine igual y la pantalla muestre el resultado. `decidir`
  tiene que devolver `null` en menos de 3 segundos y la subida seguir como antes.
- Recorré **cada salida** hasta el cartel: subió, falló la subida, la IA dijo que no (va a revisión: el cartel dice que la
  revisan, no "No se pudo").

## Bloque 2 — El estilo de fotos en Ajustes no muestra sus opciones

- Prueba: `tests/e2e/el-estilo-de-fotos-se-configura-en-ajustes.spec.ts`. No aparece "Salón de Noche". Si con la orden 321 la
  sección cambió de lugar, la prueba sigue a la pantalla nueva **diciendo en el commit dónde quedó**; si la sección se perdió,
  se devuelve.

## Bloque 3 — "Armar con IA" en la web del evento

- Prueba: `tests/e2e/la-ia-arma-la-web-del-evento.spec.ts`. No aparece el campo con el ejemplo "Ej: Valentina". Mismo
  criterio: si la pantalla se movió con la 321 (o la reemplazó el armador de invitación de la 323, bloque 1), la prueba va a
  donde está ahora y **sigue comprobando lo mismo**: tocar "Armar con IA" pone el nombre en la vista previa y "Deshacer" lo saca.

## Bloque 4 — La presentación lleva las entradas al presupuesto

- Prueba: `tests/e2e/la-presentacion-lleva-las-entradas.spec.ts`. En `/presentacion-led` no aparece el botón "Generar
  Presupuesto Manual" (`data-testid="btn-generar-presupuesto-manual"`). Desde la 321 el catálogo vive adentro de la
  presentación: el botón tiene que estar y llevar la entrada elegida a crear presupuesto.

## Bloque 5 — Google todavía tiene el catálogo viejo

- `/catalogo` ahora redirige a `/presentacion-led` (`next.config.js`), pero sigue en `PAGINAS_PARA_GOOGLE`
  (`src/lib/seo/paginas-publicas.ts` ~línea 29 y ~72). Cambialo por `/presentacion-led` y ajustá las pruebas que lo nombran
  (`asistente-donde-aparece`, `encontrarme-en-google`, `posicionamiento-seo-auditoria`) para que miren la presentación.

## Qué NO tocar

- Los arreglos de Claude de arriba.
- **Una prueba no se ablanda para que pase.** Si cambiás una, el commit dice por qué (la pantalla se movió y adónde); si la
  función se perdió, se arregla la pantalla.

## Qué tiene que comprobar la prueba

- Las cuatro pruebas de arriba en verde en desktop y celular, **sin cambiar lo que comprueban**.
- La subida al muro con la IA sin clave muestra el cartel de resultado.

```comprobar
prueba: tests/e2e/muro-subir-foto.spec.ts
prueba: tests/e2e/el-estilo-de-fotos-se-configura-en-ajustes.spec.ts
prueba: tests/e2e/la-ia-arma-la-web-del-evento.spec.ts
prueba: tests/e2e/la-presentacion-lleva-las-entradas.spec.ts
usa: /presentacion-led en src/lib/seo/paginas-publicas.ts
no-usa: '/catalogo', en src/lib/seo/paginas-publicas.ts
usa: decidir en src/app/actions/social-gallery.ts
```
