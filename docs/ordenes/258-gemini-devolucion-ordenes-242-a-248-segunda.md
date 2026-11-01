# Orden 258 — Segunda devolución de la entrega 242 a 248 (01/11/2026)

**Para Gemini.** Seguí sobre `gemini/ordenes-242-a-248`, desde `73ab350c9`. **Una sola entrega, no fusiones.** Antes de
mandarla, corré vos `npx jest --silent` y **no la mandes hasta que dé cero fallas**.

**Lo que ya está bien:** compila con cero errores, `metricas-de-redes` quedó igual que en main, y los acentos están bien.

**Lo que falla:** 13 pruebas en 9 archivos. Entre ellas están **tus propias pruebas nuevas de Club Uruguay**, así que la
entrega no se corrió antes de mandarla.

## Bloque 1 — las pruebas que rompió el cambio

Por cada archivo de la lista:

- si la prueba vieja pedía algo que **una orden cambió a propósito**, actualizá la prueba a lo nuevo;
- si no, **arreglá el código**.

**Nunca borres una comprobación.**

- `src/lib/__tests__/barra-tecnologica.test.ts`:
  - "el pedido del invitado se rechaza si un ingrediente controlado no alcanza": la prueba busca
    `descontarStock(drink, { exigirCompleto: true })` y ahora le pasás también `version`. Actualizá lo que busca, pero
    que **siga exigiendo** `exigirCompleto: true` en el pedido del invitado.
  - "tags drinks for touchscreen filtering": revisá qué cambió en las etiquetas.
- `src/__tests__/club-uruguay-presentacion-verificada.test.tsx`: fallan tus 3 casos de analítica con consentimiento.
- `src/components/landing/landing-media-contract.test.ts`: Club Uruguay tiene que seguir armando las fotos con
  `uniquePhotos([...masterPhotos, ...getDynamicSalonPhotos()])`, o lo equivalente que **sólo** use fotos del salón.
  Actualizá la prueba si usás `dedupeSalonPhotos`.
- `src/__tests__/la-promocion-de-la-portada-sale-de-lo-cargado.test.ts`: con promoción activa tiene que aparecer su
  regalo y su título; sin promoción, no aparece nada. Esa es una decisión del dueño sobre la portada.
- `src/__tests__/50-la-app-de-tu-fiesta-recorrido.test.ts`: los 5 momentos del recorrido y los textos honestos de la
  sección de la app.
- `src/__tests__/marketing-automation-integrity.test.ts`: sin la clave de Gemini **no se llama** a Gemini.
- `src/__tests__/quality-closure.test.ts`: el testimonio de respaldo que se arma con lo que destacó el cliente.
- `src/__tests__/auditoria-66-quien-ve-que.test.ts`: es un control de permisos. Si tocaste el permiso de una acción,
  **volvelo como estaba**. Ese es trabajo de Claude.
- `src/__tests__/cada-hallazgo-de-codex-tiene-su-pregunta.test.ts`: se arregla solo al juntar con la rama de Claude.
  No lo toques.

## Bloque 2 — un trago sin versión sin alcohol cargada

En `barra-tecnologica.actions.ts`, si un trago **no tiene** `recetaIngredientesSinAlcohol` y se pide `sin_alcohol`, hoy
se descuenta la receta **con** alcohol.

- Tiene que **no descontar ninguna bebida alcohólica**.
- Lo más simple: si no está cargada, ese trago no ofrece el botón "Sin alcohol".
- **Prueba:** un trago sin receta sin alcohol, pedido `sin_alcohol`, no descuenta vodka.

## Al terminar

Pegá las últimas líneas de:

- `npx tsc --noEmit`;
- `npx jest --silent`, con **cero fallas**;
- `npm run check:acentos`.

No subas `data/` ni `src/data/`.

```comprobar
prueba: src/__tests__/club-uruguay-presentacion-verificada.test.tsx
prueba: src/__tests__/la-barra-no-le-da-alcohol-a-un-menor.test.ts
```
