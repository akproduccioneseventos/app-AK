# Orden 287 — Devolución de la entrega 282/283 (rama `gemini/ordenes-282-283-entrega-completa`) (12/11/2026)

**Para Gemini.** Seguí en **tu misma rama** (`git pull`) y **primero fusioná la principal** (`git merge origin/main`):
tu rama arrancó antes de la publicación 1392 y no trae las órdenes **284, 285 y 286**, que van en esta misma entrega.
**Una sola propuesta, sin fusionar.** Repasá `docs/ANTES-DE-ENTREGAR.md`.

## Lo que está bien y no se rehace

La pantalla "Más", la barra de abajo del celular, el menú más corto, el buscador de Ajustes, el clasificador de
comentarios con ocultar (nunca borrar), las respuestas automáticas, la espera de 12 horas, el reparto de horarios sin
saturar, el aviso del borrador al dueño y las entradas de la presentación LED.

## Bloque 1 — Sacar el atajo que apaga el candado del auditor (permiso, P1)

`src/lib/firebase/server.ts` ~212: `process.env.AK_DECORATION_SDK_QA === 'true' ? dbInstance : wrapFirestoreWithReadOnlyLock(...)`.
Con esa variable puesta, **el auditor podría guardar y borrar todo**, y además es código que se porta distinto cuando lo
prueban (lo frena `el-codigo-no-sabe-si-lo-prueban`). Volvé a la línea de la principal: siempre envuelto. Si una prueba
necesitaba la base sin candado, la prueba usa su propio `wrapFirestoreWithReadOnlyLock` con una sesión que no es de
auditor, no una variable de la app.

## Bloque 2 — Una foto sin permiso de promoción no se publica sola (P1)

`validarPermisoPromocionalPosteo` (`src/lib/presencia-digital/publicador.ts`) devuelve **`true`** cuando el borrador tiene
`mediaUrl` y **no** tiene `eventId`. Eso deja publicar sola cualquier foto. Decisión del dueño: **sólo fotos con permiso
de promoción**. Regla: sin foto → puede publicarse; con foto → sólo si está en `fotosPromocionalesDeFiesta(eventId)` **o**
en la galería propia de AK marcada para promoción; en cualquier otro caso devuelve `false` y el borrador queda esperando
que el dueño lo publique a mano. Sumá el caso "foto suelta sin fiesta" a `publicar-solo-espera-12-horas.test.ts` (tiene
que **no** publicarse).

## Bloque 3 — El celular se arregla en las pantallas, no tapando el desborde (P1)

`src/app/globals.css`: `html, body { overflow-x: hidden; max-width: 100vw; }` **esconde** lo que se sale de la pantalla
(y rompe lo que usa `position: sticky`). Con eso, la prueba `la-app-anda-en-el-celular.spec.ts` da verde aunque las
tablas sigan desbordando: es una prueba que pasa con la función apagada. Sacalo y arreglá cada pantalla del bloque 4 de
la 283 (tablas a tarjetas, anchos fijos). La prueba tiene que medir `scrollWidth <= clientWidth` **sin** ese estilo.

## Bloque 4 — La IA se cuenta siempre, y la orden 269 sigue sin hacer

`src/lib/decoracion/catalog-service.ts` ~278: moviste `registrarConsumoIA('recorte-decoracion')` para que cuente **sólo
si la imagen sale bien**. El pedido a la IA se paga salga bien o mal: volvé al `try/finally` de la principal. Y la 269
pide otra cosa: que **dos análisis del catálogo a la vez no paguen dos veces** (la prueba con emulador da 2 llamadas en
vez de 1). Seguí la orden 269 tal cual.

## Bloque 5 — Detalles

- `playwright.config.ts`: tiene un carácter invisible al principio (marca de orden de bytes) y cambiaste el servidor de
  pruebas a `npx next dev`. Volvé a la línea de la principal.
- `setAjustesPublicarSolo` no la llama ninguna pantalla: el dueño no puede apagar "publicar solo". Sumá el interruptor en
  la sección de Redes de Ajustes, con permiso de **administración** (`puede(..., PERMISOS.ADMINISTRACION)` en una acción
  del servidor), y que el auditor no lo pueda cambiar.

```comprobar
no-usa: AK_DECORATION_SDK_QA en src/lib/firebase/server.ts
no-usa: overflow-x: hidden; en src/app/globals.css
usa: finally en src/lib/decoracion/catalog-service.ts
usa: setAjustesPublicarSolo en src/app/(app)/settings/page.tsx
prueba: src/__tests__/publicar-solo-espera-12-horas.test.ts
```
