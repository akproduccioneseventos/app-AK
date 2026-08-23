# Publicar una vez y que salga en todas las redes

**Para:** Gemini (Antigravity)
**Escrita:** 23 de agosto de 2026.
**Arrancá con esta.** Las otras órdenes (`ahora.md` y `publicidad.md`) siguen
después.

## Lo que pidió el dueño

> *"Quiero poder publicar una misma y que se publique en todas a la vez. Agregar
> los anuncios de TikTok, Google, todas las redes."*

La referencia que dio son herramientas como **Metricool, Buffer, Hootsuite o
Publer**: escribís una vez, elegís las redes, y sale en todas.

## Cómo se entrega

**UNA SOLA propuesta con los cuatro bloques adentro.** Si un bloque se traba,
entregá el resto igual, en la misma propuesta, avisando cuál faltó y por qué.

**Arrancá desde la versión principal de ahora.** Antes de tocar nada, leé
`docs/MANUAL-DE-LA-APP.md` y `docs/YA-RESUELTO.md`.

**Antes de fusionar:** tipos en cero, pruebas en verde, `npm run check:acentos`
limpio y `npm run build` que termine bien.

---

## LA VERDAD SOBRE LAS REDES, y hay que decirla en pantalla

**No todas las redes dejan publicar por sistema, y eso no es un defecto de la app.**
Es cómo funciona cada red. Poné esto en la pantalla, en criollo, para que el dueño
sepa qué esperar:

- **Instagram y Facebook: salen solas.** Ya funciona hoy
  (`src/lib/presencia-digital/publicador.ts`). No se toca.
- **Google (ficha de empresa): sale sola**, si está conectada la cuenta. Ya está
  pedido en `docs/ordenes/hechas/`.
- **TikTok: se puede automatizar, pero TikTok tiene que aprobar la aplicación
  primero.** Es un trámite con ellos, no algo que se programe y ya. **Si no está
  aprobado, queda "listo para copiar".**
- **WhatsApp (estados), Threads, X y Pinterest: NO se pueden automatizar.** Quedan
  "listo para copiar", con el texto y la imagen a un toque.

**Nunca digas que se publicó en una red donde en realidad quedó para copiar.**
Eso es lo peor que puede pasar: el dueño cree que salió y no salió.

---

## BLOQUE 1 — Escribir una vez, elegir las redes, y listo

Hoy en el planificador se arma un posteo por vez. **Que se pueda escribir uno solo
y mandarlo a varias redes de una.**

1. **Una sola pantalla para escribir**: el texto, la foto o el video, y **casillas
   para elegir a qué redes va**. Con las fotos aprobadas del muro a mano, sin salir
   a buscarlas.
2. **Que cada red muestre su estado al elegirla**: "sale sola" o "te lo dejamos
   listo para copiar". Así el dueño sabe antes de programar.
3. **Que el texto se adapte a cada red** sin escribirlo de nuevo:
   - Instagram: hashtags al final.
   - Facebook: puede ser más largo.
   - TikTok: corto y con gancho al principio.
   - X: recortado al límite.
   Que se pueda editar el de cada red antes de mandar, pero **que venga ya
   adaptado**.
4. **Programar una vez para todas**, con la misma fecha y hora.

---

## BLOQUE 2 — El tablero de "qué salió y qué no"

Después de programar, el dueño tiene que poder mirar una pantalla y saber:

- **Qué salió**, en qué red y a qué hora.
- **Qué quedó listo para copiar**, agrupado, con botón grande de copiar el texto y
  la imagen.
- **Qué falló y por qué**, en criollo. Hoy una publicación que falla queda marcada
  y nadie se entera.
- **Qué está esperando** su hora.

**Un solo lugar. Sin buscar.**

---

## BLOQUE 3 — Los números de todas las redes, no sólo de Meta

Hoy la app ya trae de **Meta** el gasto de publicidad y lo cruza con los prospectos
reales del CRM: cuánto costó cada consulta y cuánto volvió por cada peso
(`src/lib/marketing/meta-ads.ts`). **Eso es lo bueno y hay que extenderlo.**

1. **Sumá Google Ads y TikTok Ads** al mismo tablero: gasto, consultas que
   trajeron, cuánto salió cada una y cuánto volvió.
2. **Todo en el mismo lugar y comparable**: "en Meta cada consulta te sale $300, en
   Google $900". **Esa comparación es la que decide dónde poner la plata**, y hoy
   no existe en ningún lado.
3. **Si una cuenta no está conectada**, decilo en criollo y explicá cómo
   conectarla. **Nunca números de ejemplo.**
4. **Traducí toda la jerga**: CPL → "lo que te sale cada consulta"; ROAS → "cuánto
   volvió por cada peso"; CTR → "de cada cien que lo vieron, cuántos hicieron
   clic".

**Ojo con esto:** conectar Google Ads y TikTok Ads necesita credenciales del dueño.
**Si te falta algo, PARÁ Y AVISÁ** en una línea, con lo que falta. No lo dejes a
medias sin decirlo.

---

## BLOQUE 4 — Que no cueste más de lo que trae

1. **Nada que aumente lo que se paga por mes** sin avisar.
2. **Adaptar el texto a cada red no puede costar una llamada de inteligencia
   artificial por red.** Una sola llamada devuelve todas las versiones. Y respetá
   el tope mensual: si se llegó, que avise en vez de fallar.
3. **Las publicaciones programadas ya se disparan** con la tarea automática que
   corre cada 15 minutos. **Usala, no armes otra.**

---

## Cómo se prueba que quedó bien

- Una prueba de que **un posteo a tres redes genera tres publicaciones**, cada una
  con su estado.
- Una prueba de que **una red que no se puede automatizar queda "listo para
  copiar"** y **nunca se marca como publicada**.
- Una prueba de que, sin la cuenta conectada, el tablero **lo dice** y no muestra
  números inventados.

---

## Lo que no se toca

- `apphosting.yaml`: el servidor se duerme a propósito.
- El WhatsApp prepara mensajes y no los manda.
- **Ningún precio ni promoción se inventa**: salen del catálogo.
- Si tocás o agregás una pantalla, **corré `npm run mapa:generar`** y anotá el
  cambio en `docs/YA-RESUELTO.md`, en la misma propuesta.
