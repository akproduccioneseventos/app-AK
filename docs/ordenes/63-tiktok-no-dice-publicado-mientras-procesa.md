# Orden 63 — TikTok no puede decir "Publicado" mientras todavia procesa

**Para Gemini.** **UNA SOLA propuesta con los dos bloques.** Si uno se traba, entregar el otro
igual en la misma propuesta y avisar cual falto.

**Antes de decir "termine", leer `docs/ANTES-DE-ENTREGAR.md`** y pasar lo que tocaste por las
nueve preguntas.

## Por que

Lo encontro Codex el 17 de septiembre de 2026, y es la segunda vuelta del mismo defecto: el
publicador de TikTok sondea el estado cinco veces; si el video **sigue procesandose**, se rinde y
devuelve `success: true` con `status: 'PROCESSING'`. El que llama mira solo `success`, asi que la
publicacion **queda marcada "Publicado" en el calendario de redes** aunque TikTok todavia no la
haya subido —y si despues TikTok la rechaza, nadie se entera nunca.

Para el negocio: el dueño ve "Publicado", no vuelve a mirar, y la publicacion no existe.

## Bloque 1 — El estado que se muestra dice la verdad

- **Archivo:** `src/lib/presencia-digital/publicador.ts`, linea ~186.
- Hoy: `if (ttResult.success) publishedTo.push('TikTok');`
- **Lo que hay que hacer:** separar el caso `ttResult.status === 'PROCESSING'`. Eso **no** entra
  en `publishedTo`. Hay que llevarlo en una lista nueva —llamala `enProceso`— y devolverla en el
  resultado (`PublicarResultado`, linea ~44, donde ya esta `publishedTo?: string[]`).
- **El estado del post** (linea ~345, `status: 'Publicado'`) **solo se pone si `publishedTo` tiene
  algo**. Si la unica red era TikTok y quedo en proceso, el post **no** pasa a "Publicado": queda
  como esta y se guarda el `publishId` que devuelve `publishToTikTok` para poder consultarlo
  despues.
- El campo ya existe: `TikTokPublishResult.publishId` en `src/lib/social-media/tiktok-publisher.ts`
  linea ~22. **No inventes otro nombre.**

## Bloque 2 — Que lo vea el dueño en pantalla

- **Archivo de pantalla:** la que muestra el calendario de redes y el estado de cada publicacion
  (`src/app/(app)/marketing/` — buscala con `graphify query "donde se muestra el estado Publicado
  de una publicacion de redes"`, **no la adivines**).
- Cuando una red quedo en proceso, el cartel dice **"TikTok: se envio, falta que TikTok termine de
  procesarlo"**, en criollo, no "Publicado" ni "Error". El texto ya lo devuelve el publicador en
  `ttResult.message`.

## Lo que NO se toca

- El sondeo de `tiktok-publisher.ts` (los cinco intentos) esta bien como esta: **no lo hagas mas
  largo**, que la pantalla se queda esperando.
- El resto de las redes: Facebook, Instagram, YouTube, Google, Pinterest, Threads y X quedan igual.
- Los textos que ve el cliente en la web. Nada de promesas de plazos.

## Que tiene que comprobar la prueba

**No alcanza con que el archivo mencione `PROCESSING`.** La prueba tiene que:

1. Simular `publishToTikTok` devolviendo `{ success: true, status: 'PROCESSING', publishId: 'x' }`
   y comprobar que el post **NO** queda con `status: 'Publicado'`.
2. Simular `{ success: true, status: 'PUBLISH_COMPLETE' }` y comprobar que **si** queda publicado.
3. Romperla a proposito una vez —dejando el `if` como esta hoy— y ver que se pone en rojo.

```comprobar
archivo: src/lib/presencia-digital/publicador.ts
usa: PROCESSING en src/lib/presencia-digital/publicador.ts
prueba: src/__tests__/tiktok-no-canta-victoria-antes.test.ts
```
