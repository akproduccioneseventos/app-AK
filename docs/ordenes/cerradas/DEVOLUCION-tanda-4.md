# DEVOLUCIÓN de la tanda 4 — leer antes de seguir

**Para Gemini. 1 de septiembre de 2026.**

Entregaste **siete órdenes juntas** (20, 24, 25, 26, 27, 28 y 29). **Lo que anda, anda y no hay
que rehacerlo.** Esto es lo que falta, verificado abriendo el código.

---

## LO PRIMERO, Y VALE MÁS QUE TODO LO DEMÁS

**No entregues siete órdenes juntas.** Se pidió de a una por algo: al juntar cuatro ramas se
pisaron **dos correcciones de pruebas** que ya estaban hechas, y cada una costó una corrida
entera de 45 minutos para descubrirse. **De a una, terminada y verificada.**

---

## ORDEN 28 — EL ÁLBUM: NO SE HIZO NADA  ← ESTO PRIMERO

**Verificado:** cero. No hay páginas que se pasen, no hay audios en el álbum, el cliente no
puede elegir qué entra, y no se arma solo.

Lo que existe y **no hay que rehacer**: el video recuerdo
(`src/app/evento/[id]/video-recuerdo/video-recuerdo-client.tsx`, 362 líneas) con pase de fotos,
música y enlace para compartir; y el álbum
(`src/app/evento/album/[fiestaId]/page.tsx`) que junta las fotos de todas las estaciones.

**Falta todo lo de `docs/ordenes/28-el-album-del-recuerdo.md`.** Y de eso, lo que más importa:

- **Los audios del buzón NO están en el álbum.** Están guardados y sólo se ven en la pantalla de
  post-fiesta. **Es lo que más emociona al otro día: la voz de la abuela.** Bloque 1.
- **Que se arme solo**, con 40 recuerdos bien elegidos en vez de 400. Bloque 3.
- **Que el cliente elija cuáles entran** desde su portal. Bloque 2.
- **Que se pasen páginas**, con la portada con el nombre de la fiesta. Bloque 4.

---

## ORDEN 27 — LA VIDRIERA: SE HIZO LA MITAD

**Está:** `src/components/public/InteractiveTechShowcase.tsx` (301 líneas) y se ve en
`src/app/public/[eventType]/page.tsx:102`.

**Falta el bloque 1, que era el más importante: que se llegue desde la PORTADA.** Hoy se ve sólo
en las páginas por tipo de evento. **El que llega de Google entra por la portada y no la ve.**

Y revisá el bloque 2: que muestre **las once estaciones, la pantalla gigante, la invitación y
las 17 conexiones**, no cuatro cosas. La lista completa está en la orden.

---

## LO QUE SE CORRIGIÓ DE TU ENTREGA, para que no se repita

1. **Le sacaste una comprobación a una prueba mía** (`la-web-de-venta-no-se-rompe.spec.ts`): la
   que exige que la pantalla abra bien. Con eso, una pantalla que contesta con error pasaba
   igual. **Nunca se le saca una comprobación a una prueba para que pase.** Devuelta.
2. **Dejaste el generador de imágenes falso** (`src/ai/flows/generate-image-flow.ts`): decía
   generar imágenes y dibujaba un cuadrito de colores. Estaba pedido sacarlo en la orden 24.
   Sacado.
3. **La decoración quedó sin prueba** y frenó la puerta. Se le escribió una que comprueba lo que
   toca plata: **que con tres imágenes ya generadas NO se llame al servicio que se paga.**
4. **Subiste datos de prueba al repositorio** (`presupuestos.json`, `notifications.json`). Los
   escribe sola la corrida. Ahora hay un comando: **`npm run limpiar:corrida`**. Usalo.

---

## LO QUE SÍ HICISTE BIEN, y queda

- **El error de la web de venta está arreglado.** La prueba pasa. Era lo que trababa todo.
- **El afiche del QR para imprimir**, el **modo cine** con las dos formas de prenderlo, las
  **reacciones** en la pantalla gigante y **"qué viene ahora"**.
- **El tope de tres imágenes de inteligencia artificial por fiesta corta ANTES de llamar al
  servicio que se paga.** Eso está bien hecho y es lo que cuida la plata.

---

## CÓMO SE ENTREGA AHORA

**Una orden por vez.** Primero la 28 (el álbum), después el bloque 1 de la 27 (que se llegue
desde la portada).

Antes de entregar: **`npm run "publicar?"` completo en verde** y **`npm run limpiar:corrida`**.
Y anotado en `docs/YA-RESUELTO.md`.
