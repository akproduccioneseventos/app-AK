# Orden 330 — Cada invitado encuentra sus fotos solo, incluidas las del fotógrafo (20/11/2026)

**Pedido del dueño:** *"nosotros tenemos que tener reconocimiento de caras, aunque lo tenga Wfolio; todo tiene que tener
reconocimiento para que el invitado se encuentre, o algo mejor. Buscá en las plataformas si hay algo mejor y agregalo, y
usá también lo de Wfolio."*

**Cómo se entrega:** en la **misma propuesta que las órdenes 328 y 329**, sobre `claude/juntar-1451`, después de la 329. Si
un bloque se traba, entregá el resto en la misma propuesta y decí cuál faltó. Antes de decir "terminé":
`docs/ANTES-DE-ENTREGAR.md`.

## Cómo está hoy (investigado por Claude el 20/11)

- **La búsqueda por cara ya existe y es gratis:** el invitado se saca una selfie en la galería
  (`src/app/evento/galeria/[fiestaId]/page.tsx` ~línea 88) y ve sus fotos seguras y dudosas. Usa `@vladmandic/face-api`
  con los modelos servidos desde `public/models/caras` (nada se paga por foto). La comparación es
  `buscarFotosDeUnaCara` con `DISTANCIA_SEGURA` 0,5 y `DISTANCIA_DUDOSA` 0,62 (`src/lib/caras/agrupar-caras.ts` ~67-99).
- **Pero no es automática:** el índice de caras (`CaraEnFoto`, guardado con `guardarCarasDeFiesta`,
  `src/app/actions/social-gallery.ts` ~1086) se arma **sólo cuando alguien del equipo toca** `PrepararGrillaDeCara`
  (`src/app/(app)/fiestas/nueva/muro-social/page.tsx` ~1667). Si nadie lo toca, el invitado no encuentra nada.
- **No incluye las fotos del fotógrafo**: esas viven en el AK Editor y en Wfolio (órdenes 281 y 329), no en la app.
- **Lo que hacen las mejores plataformas (Waldo, FotoOwl, Kwikpic):** el invitado deja **una selfie una sola vez** y le
  **llegan solas** sus fotos a medida que aparecen, de todas las cámaras; Waldo además busca por objeto o momento. Eso es lo
  que falta, y se hace con lo que ya tenemos, sin pagar nada.

## Bloque 1 — El índice de caras se arma solo

- Cada foto **aprobada** se indexa sola: el aparato que la sube (celular del invitado, fotocabina, Vogue, 360 en su foto de
  tapa) calcula las caras con `extraerDescriptorFacial` (`src/lib/caras/extractor-facial.ts`) **en segundo plano, después de
  subir** (no demora la subida ni el cartel), y las manda con `guardarCarasDeFiesta`.
- Las que lleguen sin caras (aparato viejo, sin señal) las completa en segundo plano la pantalla del muro en vivo o el panel
  del operador, sin que nadie toque nada. `PrepararGrillaDeCara` queda como botón "Volver a armar", no como requisito.
- Una foto que se oculta o se borra **sale del índice** en el mismo momento.

## Bloque 2 — Las fotos del fotógrafo también entran

- El AK Editor, al terminar de subir a Wfolio (orden 329), calcula las caras de cada foto exportada **con el mismo modelo**
  (`@vladmandic/face-api`), así los números se pueden comparar con los de la app: abrí con Playwright (ya instalado en el
  editor) una página local que cargue los mismos modelos de `public/models/caras` y devuelva los vectores.
- Sube a la app, por fiesta, una **miniatura chica** de cada foto (800 px, para mostrarla) y sus caras, con el enlace a la foto
  en Wfolio. **Cómo entra el editor a la app:** igual que en la orden 329, bloque 3 — usá la forma que ya tenga; si no tiene,
  queda como archivo y el operador lo sube a un toque desde el Centro de la fiesta. **No se crea una clave ni una ruta pública
  nueva sin preguntarle a Claude** (toca permisos).

## Bloque 3 — El invitado deja su selfie una vez y sus fotos le llegan solas (lo que hace Waldo)

- Al confirmar asistencia o al entrar a la galería, el invitado puede tocar **"Quiero que me lleguen mis fotos"**, aceptar en
  una línea que se guardan **sólo los números de su cara, no la foto** (la selfie se descarta en el celular) y sacarse la
  selfie. El vector se guarda en su invitado (con su credencial de siempre, la de la invitación).
- Cada vez que entra una foto nueva al índice (bloques 1 y 2), se compara con los invitados anotados. Si aparece con
  seguridad: **aviso al celular** (las notificaciones de la app ya existen, `src/lib/firebase/server-messaging.ts`) *"Aparecés
  en 3 fotos nuevas"*, una vez por tanda (no por foto), y la sección **"Mis fotos"** en su portal
  (`src/app/portal-invitado/[fiestaId]/[guestId]/page.tsx`) con todas, de todas las cámaras y del fotógrafo.
- **Por WhatsApp no se manda solo:** queda preparado un mensaje con el enlace a "Mis fotos" en la bandeja de salida, para que
  lo mande una persona, hasta que el dueño diga otra cosa.
- **Mejor que Waldo:** el invitado no instala nada (es la app web que ya abre) y no paga nada.

## Bloque 4 — Buscar por momento, no sólo por cara

- En la galería, además de la cara, filtros por momento: **Entrada, Vals, Torta, Fiesta, Exterior**, con la misma clasificación
  que ya usa el editor (`clasificar_escena`, `herramientas/ak-editor/wfolio.py:187`) para lo del fotógrafo y el
  `momentTag` del muro para lo demás. Si una foto no tiene momento, va a "Fiesta".

## Bloque 5 — Lo de Wfolio, también

- El álbum de Wfolio lleva prendido su reconocimiento de caras (orden 329, bloque 4) para el cliente y la familia. La app y
  Wfolio no se pisan: la app avisa durante y después de la fiesta; Wfolio es el álbum final.

## Cuidado con los datos (lo revisa Claude: es quién ve qué)

- Los vectores de los invitados **nunca viajan al navegador de otro invitado ni del cliente**: la comparación con los
  invitados anotados se hace en el servidor.
- Se borran solos **90 días después de la fiesta**, y el invitado tiene "Borrar mi cara" a un toque.

## Qué NO tocar

- La búsqueda con selfie que ya anda en la galería y sus distancias.
- Las órdenes 328 y 329.

## Qué tiene que comprobar la prueba

- **Bloque 1 (Jest):** una foto aprobada con caras queda en el índice sin llamar a `PrepararGrillaDeCara`; ocultarla la saca.
- **Bloque 2 (Python):** con tres fotos de prueba, el editor devuelve vectores de 128 números del mismo modelo y arma el
  archivo para la app con miniatura, enlace de Wfolio y caras.
- **Bloque 3 (Jest):** un invitado anotado con un vector y una foto nueva a distancia 0,4 recibe **un** aviso por la tanda; con
  0,7 no recibe; los vectores de otros invitados no salen en ninguna respuesta pública; a los 91 días ya no están.
- **Bloque 3 (navegador):** "Mis fotos" del portal del invitado muestra la foto que le corresponde y no la de otro.
- **Bloque 4 (navegador):** en la galería, el filtro "Torta" deja sólo las fotos con ese momento.

```comprobar
usa: guardarCarasDeFiesta en src/app/evento/social/[fiestaId]/page.tsx
usa: extraerDescriptorFacial en src/app/evento/social/[fiestaId]/page.tsx
usa: buscarFotosDeUnaCara en src/lib/caras/agrupar-caras.ts
usa: face-api en herramientas/ak-editor/wfolio.py
usa: Quiero que me lleguen mis fotos en src/app/evento/galeria/[fiestaId]/page.tsx
usa: Mis fotos en src/app/portal-invitado/[fiestaId]/[guestId]/page.tsx
usa: server-messaging en src/app/actions/social-gallery.ts
usa: momentTag en src/app/evento/galeria/[fiestaId]/page.tsx
usa: clasificar_escena en herramientas/ak-editor/wfolio.py
usa: Volver a armar en src/components/social-gallery/PrepararGrillaDeCara.tsx
archivo: src/lib/caras/extractor-facial.ts
archivo: src/app/(app)/fiestas/nueva/muro-social/page.tsx
archivo: src/lib/firebase/server-messaging.ts
```
