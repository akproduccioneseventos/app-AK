# Orden 60 — YouTube y TikTok tienen que publicar de verdad, y decir la verdad

**Para Gemini. UNA SOLA PROPUESTA con los dos bloques.** Si uno se traba, entregá el otro
igual y decí cuál faltó.

Los dos hallazgos son de Codex, del 16 de septiembre de 2026, y los verifiqué abriendo los
archivos: **son ciertos**.

---

## Bloque A — YouTube nunca sube el video

**Dónde:** `src/lib/social-media/youtube-publisher.ts`, líneas ~43 a ~80.

**Qué pasa hoy:** se arma un objeto con título, descripción y etiquetas, y se manda a
`https://www.googleapis.com/youtube/v3/videos?part=snippet,status` con el cuerpo en JSON.
**Ese camino no lleva el video: manda sólo la ficha.** La URL del video que recibe la función
(`videoUrl`) se usa nada más que para comprobar que no esté vacía — no la abre nadie.

Resultado para el negocio: el panel dice "publicado en YouTube" y **en el canal no hay
video**, o queda una entrada vacía.

**Qué hay que hacer:** usar la subida de verdad de YouTube, que tiene dos pasos:

1. **Abrir la subida**, con `POST` a
   `https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status`,
   mandando la ficha en JSON y las cabeceras `X-Upload-Content-Type` y
   `X-Upload-Content-Length`. La respuesta trae, en la cabecera `Location`, la dirección
   donde se sube.
2. **Subir los bytes del video a esa dirección**, con `PUT`. Los bytes salen de bajar
   `videoUrl` primero.

**Y el resultado se comprueba**: la subida termina bien cuando la respuesta trae el `id` del
video. Si no lo trae, es un fallo, no un éxito.

**Qué NO tocar:** las etiquetas, el `#Shorts`, la categoría y el estado de privacidad ya están
decididos y quedan igual.

**Cuidado con el tamaño:** si el video pesa mucho, bajarlo entero a memoria puede voltear el
servidor. Bajalo y subilo por partes, o si no se puede, **fallá con un mensaje claro** en vez
de intentarlo igual.

**Qué tiene que comprobar la prueba** (`src/__tests__/youtube-sube-el-video.test.ts`): que al
publicar, **la dirección a la que se sube contiene `upload/youtube`** y que el video viaja en
el cuerpo; y que si el servidor de YouTube no devuelve un `id`, la función contesta que
**falló**. No vale una prueba que sólo mire que se llamó a algo.

```comprobar
archivo: src/lib/social-media/youtube-publisher.ts
usa: uploadType=resumable en src/lib/social-media/youtube-publisher.ts
prueba: src/__tests__/youtube-sube-el-video.test.ts
```

---

## Bloque B — TikTok canta victoria cuando recién empezó

**Dónde:** `src/lib/social-media/tiktok-publisher.ts`, líneas ~48 a ~80.

**Qué pasa hoy:** se llama a `/v2/post/publish/video/init/`, que **sólo INICIA** la
publicación: TikTok se lleva el video de la dirección que le damos y lo procesa después. El
código toma el `publish_id` que devuelve ese primer paso y contesta **"publicación exitosa"**.

O sea: si TikTok después no puede bajar el video, o lo rechaza, **el panel ya dijo que estaba
publicado**. Nadie se entera de que no salió.

**Qué hay que hacer:**

1. Después del inicio, **preguntar cómo salió**: `POST` a
   `https://open.tiktokapis.com/v2/post/publish/status/fetch/` con el `publish_id`, cada pocos
   segundos, hasta que el estado deje de ser "en proceso" o se agote una espera razonable
   (poné un tope, no lo dejes preguntando para siempre).
2. **Contestar según el resultado real:** publicado, falló (con el motivo que da TikTok), o
   **"se mandó y todavía se está procesando"** si se agotó la espera. Los tres son distintos y
   el panel tiene que mostrarlos distintos: *"Se envió a TikTok, falta que termine de
   procesarlo"* no es lo mismo que *"Publicado"*.

**Qué NO tocar:** el armado del mensaje, la privacidad y las opciones de comentarios ya están
bien.

**Qué tiene que comprobar la prueba** (`src/__tests__/tiktok-no-canta-victoria-antes.test.ts`):
que con un inicio correcto **pero** un estado posterior de fallo, la función contesta que
**falló**; que con estado publicado contesta publicado; y que si se agota la espera, contesta
**"en proceso"** y no "publicado".

```comprobar
archivo: src/lib/social-media/tiktok-publisher.ts
usa: publish/status/fetch en src/lib/social-media/tiktok-publisher.ts
prueba: src/__tests__/tiktok-no-canta-victoria-antes.test.ts
```

---

## Y lo de siempre

Esto toca lo que sale para afuera con la marca de AK, así que **el estado que muestra el panel
tiene que ser el de verdad**. Una publicación que dice "listo" sin estarlo es peor que una que
dice "falló": la segunda se puede volver a intentar.
