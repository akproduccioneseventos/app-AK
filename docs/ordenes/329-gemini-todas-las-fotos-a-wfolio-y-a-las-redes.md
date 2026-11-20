# Orden 329 — Todas las fotos de la fiesta a Wfolio, y de ahí el video y la publicación en redes (20/11/2026)

**Pedido del dueño:** *"en Wfolio se guardan todas las secciones fotográficas de la fiesta: exteriores, fotocabina, plataforma
360, fotografía de la fiesta; que se publique directamente ahí, y después de esas fotos hacé video y una publicación en las
redes. Tengo plan de imágenes infinito."*

**Cómo se entrega:** en la **misma propuesta que la orden 328**, sobre `claude/juntar-1451`, después de la 328. Si un bloque
se traba, entregá el resto en la misma propuesta y decí cuál faltó. Antes de decir "terminé": `docs/ANTES-DE-ENTREGAR.md`.

## Cómo está hoy (investigado por Claude el 20/11)

- **Lo del fotógrafo ya sube solo** (orden 281): el AK Editor de la computadora del dueño reparte las fotos en carpetas
  (`repartir_en_carpetas`, `herramientas/ak-editor/wfolio.py:285`: Exterior, Previa y recepción, Entrada y vals, Fiesta,
  Torta y velas) y las sube con `subir_a_wfolio` (~línea 706), automatizando la página con la sesión del dueño
  (`herramientas/ak-editor/WFOLIO.md`: Wfolio **no tiene API**). Reintenta y sigue donde quedó.
- **Lo de las estaciones NO llega a Wfolio:** fotocabina, plataforma 360 y lo que suben los invitados viven en la app
  (colección del muro, cada foto con `sourceModule`, `src/types/social-gallery.ts:35`). Hoy sólo se bajan en un ZIP plano
  desde `src/app/api/social-gallery/[fiestaId]/download/route.ts` (todo mezclado, sin carpetas).
- **El video de las redes ya existe en el editor:** `generar_videos_redes` (`herramientas/ak-editor/redes.py:273`), pero no
  se arma con las fotos de Wfolio ni deja publicación en la app.
- La publicación en todas las redes ya existe (`publishPostInternal`, `src/lib/presencia-digital/publicador.ts:131`, orden
  326), y los borradores se publican solos a las 12 horas si el dueño no toca "No publicar" (decisión del 12/11).

## Bloque 1 — La app entrega las fotos de las estaciones en carpetas

- En la descarga (`.../[fiestaId]/download/route.ts`), un modo `?carpetas=1` que arma el ZIP **en carpetas por estación**:
  `Fotocabina` (las de `esTiraFotocabina`, `src/lib/video-resumen/elegir-fotos-video.ts:22`, y `sourceModule` de la
  fotocabina), `Plataforma 360` (videos incluidos), `Vogue` y demás estaciones por su `sourceModule`, y `Fotos de los
  invitados` (lo subido desde el muro). Sólo lo **aprobado**; lo oculto o pendiente no va.
- **El permiso no cambia:** la descarga sigue pidiendo sesión del equipo como hoy (no se agrega ninguna puerta nueva).
- En el Centro de la fiesta, junto a la tarjeta del álbum (`src/app/(app)/fiestas/[id]/centro/tarjeta-entrega-album.tsx`),
  botón **"Mandar todo a Wfolio"**: baja ese ZIP a `Documentos\AK Editor\<fiesta>\estaciones\` (o a Descargas, y el editor
  lo toma de ahí) y le avisa al editor.

## Bloque 2 — El AK Editor sube todo al mismo álbum de Wfolio

- `wfolio.py`: si en la carpeta de la fiesta aparece el ZIP del bloque 1, lo descomprime y suma sus carpetas al **mismo
  álbum** que las del fotógrafo (mismo nombre de fiesta). Quedan: las del fotógrafo + `Fotocabina`, `Plataforma 360`,
  `Fotos de los invitados` y las estaciones que tengan fotos.
- Usa el mismo `subir_a_wfolio`: de a una, reintento, sigue donde quedó, y **nunca dice "subido" sin la respuesta de Wfolio**.
- **Videos de la 360:** confirmá en la página de Wfolio, en la computadora del dueño, si el plan sube videos. Si no, los videos
  quedan en la carpeta local y el resumen lo dice en una línea ("Wfolio no acepta video: los 360 quedaron en tu compu").
- El álbum queda **privado**; el enlace para el cliente lo manda el dueño (preparar sí, mandar no). Al terminar, el editor
  pega el enlace del álbum en la fiesta (lo que hoy carga a mano la tarjeta del álbum, `guardarAlbumWfolioAction`).

## Bloque 3 — De esas fotos, el video y la publicación en redes, solos

- Apenas termina la subida, el editor arma con `generar_videos_redes` un **video corto** (vertical para historias y reels,
  cuadrado para el feed) con las mejores de **todas** las carpetas: elige con la nota de calidad que ya existe
  (`analizador.py`) y mezcla fotógrafo, fotocabina y 360. Lleva la placa de cierre de AK (`generar_placa_cierre_redes`).
- **Sólo fotos con permiso de promoción** (la misma regla que los borradores automáticos): si la fiesta no dio permiso, no se
  arma la publicación y el resumen lo dice. Nunca nombres de invitados ni del cliente en el texto si no dio permiso.
- El video se sube a la app como **borrador** de publicación en todas las redes conectadas (orden 326, bloque 4), con el texto
  armado por la IA (sin precios, sin promesas, sin "garantía"). Sale solo a las 12 horas si el dueño no toca "No publicar",
  como el resto de los borradores. **Ningún mensaje va al cliente.**
- Para subir el borrador a la app el editor necesita una forma de entrar: **usá la que ya tenga el editor; si no tiene
  ninguna, el borrador queda como archivo en la carpeta de la fiesta y la app lo toma desde "Subir borrador" en Publicaciones
  a un toque**. No se crea una clave nueva ni una ruta pública sin preguntarle a Claude (toca permisos).

## Bloque 4 — El álbum entero lo arma el editor: nombre, carpetas, portada y diseño (pedido del dueño, 20/11 tarde)

**Pedido del dueño:** *"estudiá cómo funciona la plataforma: crear el álbum, después las carpetas, personalizar la portada,
etcétera… y ver cómo darle acceso a la app. Tengo el plan más caro."*

Lo que Claude confirmó en la documentación pública de Wfolio (docs.wfolio.pro; desde el contenedor de Claude el sitio no
abre, por eso el paso 1 se hace en la computadora del dueño):

- **No hay API pública ni complemento de Lightroom** (ya estaba en `herramientas/ak-editor/WFOLIO.md`). El acceso es el que
  ya usa la orden 281: **el editor abre Wfolio con la sesión del dueño guardada en su computadora**
  (`obtener_directorio_sesion`, `wfolio.py:57`). El dueño entra una sola vez; la clave no se escribe en ningún archivo.
- Cada álbum es un **proyecto** del disco. Adentro se pueden crear **varias carpetas**, y hay carpetas **ocultas**.
- La portada y el diseño se cambian en la solapa **"Diseño y portada"** del proyecto (en computadora, además, el espacio
  entre fotos: chico, mediano o grande).
- **Videos:** MP4 o MOV en H.264; hasta **500 MB** se reproducen dentro de la galería, más grandes quedan como foto fija.
- **Reconocimiento de caras:** sólo en planes ilimitados (el del dueño), fotos JPG y PNG, **hasta 2000 archivos por proyecto**
  contando todas las carpetas.

Lo que tiene que hacer el editor, en este orden:

1. **Primero, en la computadora del dueño, anotar en `WFOLIO.md`** qué opciones muestra la solapa "Diseño y portada" del plan
   del dueño (plantillas, letra, colores, foto de portada, título y subtítulo), qué opciones tiene cada carpeta (oculta,
   descarga permitida, contraseña o PIN de descarga) y dónde se prende el reconocimiento de caras. **No se programa nada
   que no se haya visto en pantalla.**
2. **Crear el proyecto** con el nombre de la fiesta y la fecha ("Valentina · 15 años · 14/03/2027"), y las carpetas en este
   orden: las del fotógrafo (`repartir_en_carpetas`, `wfolio.py:285`), después `Fotocabina`, `Plataforma 360`, `Fotos de los
   invitados` y las estaciones que tengan fotos. Una carpeta sin fotos no se crea.
3. **Portada sola:** la foto de portada es la mejor de la agasajada que elija la nota de calidad (`analizador.py`), preferida
   de la carpeta Exterior; título con el nombre, subtítulo con el tipo de fiesta y la fecha. El diseño, la letra y los colores
   salen de una plantilla AK que el dueño elige **una vez** en "Marca AK" del editor y queda guardada para todas las fiestas.
4. **Videos de la 360:** si un video pasa de 500 MB, el editor lo comprime a H.264 antes de subir (con `exportador_video.py`,
   que ya usa ffmpeg) para que se vea dentro de la galería.
5. **Reconocimiento de caras prendido** en cada álbum, si el proyecto tiene hasta 2000 fotos. Si tiene más, se deja apagado y
   el resumen lo dice ("Más de 2000 fotos: Wfolio no busca caras en este álbum"). Así el invitado encuentra sus fotos
   buscando su cara.
6. Si Wfolio cambia la página y algún paso falla, el editor sigue con el resto y dice en criollo cuál quedó a mano. Nunca dice
   "listo" sin haber visto el resultado en la página.

**Lo que tiene Wfolio y NO se prende, por decisiones del dueño:** la selección de fotos por el cliente ("el cliente no elige
nada", 1/9/2026) y la venta de fotos (descartada el 28/9/2026). El álbum sigue **privado** y el enlace lo manda el dueño.

## Qué NO tocar

- La subida del fotógrafo que ya anda (orden 281) y sus carpetas.
- Quién puede descargar las fotos: sigue igual.
- Lo de la orden 328.

## Qué tiene que comprobar la prueba

- **Bloque 4 (Python):** con el Wfolio de mentira, el proyecto se crea con nombre y fecha, sin carpetas vacías, con la foto
  de portada de mejor nota; con 2500 fotos el reconocimiento de caras queda apagado y el resumen lo dice; un video de 600 MB
  se comprime antes de subir.

- **Bloque 1 (Jest):** con fotos de prueba de fotocabina, 360, invitados y una oculta, el ZIP con `carpetas=1` trae las tres
  carpetas con sus fotos y **no** trae la oculta; sin sesión, contesta lo mismo que hoy.
- **Bloque 2 (Python):** `herramientas/ak-editor/pruebas/test_wfolio_estaciones.py`: con el Wfolio de mentira de la orden 281,
  el ZIP de estaciones termina en el mismo álbum en sus carpetas, y si falla la 3 de 5 la segunda corrida sube sólo las que
  faltan.
- **Bloque 3 (Python):** sin permiso de promoción no se arma la publicación; con permiso, el video mezcla fotos de al menos
  dos carpetas.

```comprobar
usa: Diseño y portada en herramientas/ak-editor/WFOLIO.md
usa: portada en herramientas/ak-editor/wfolio.py
usa: 2000 en herramientas/ak-editor/wfolio.py
usa: wfolio en herramientas/ak-editor/exportador_video.py
usa: carpetas en src/app/api/social-gallery/[fiestaId]/download/route.ts
usa: Mandar todo a Wfolio en src/app/(app)/fiestas/[id]/centro/tarjeta-entrega-album.tsx
usa: Fotocabina en herramientas/ak-editor/wfolio.py
usa: generar_videos_redes en herramientas/ak-editor/wfolio.py
archivo: herramientas/ak-editor/pruebas/test_wfolio_estaciones.py
archivo: src/types/social-gallery.ts
usa: esTiraFotocabina en src/app/api/social-gallery/[fiestaId]/download/route.ts
usa: publishPostInternal en src/lib/presencia-digital/publicador.ts
usa: guardarAlbumWfolioAction en src/app/(app)/fiestas/[id]/centro/tarjeta-entrega-album.tsx
archivo: herramientas/ak-editor/redes.py
archivo: herramientas/ak-editor/analizador.py
```
