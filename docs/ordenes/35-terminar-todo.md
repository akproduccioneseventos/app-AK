# Orden 35 — TERMINAR TODO

**Escrita el 2 de septiembre de 2026.** Palabras del dueño: *"quiero tener pronto todo ya"*.

**UNA SOLA PROPUESTA con todos los bloques.** Si un bloque se traba, **entregá el resto igual,
en la misma propuesta**, y decí cuál faltó y por qué. No abras una propuesta por bloque: cada
fusión dispara un despliegue y eso se paga.

## Antes de arrancar, y de terminar: `npm run "falta?"`

**Contesta solo qué falta**, ordenado por lo que le cuesta plata al negocio. Corré ese comando
al empezar y antes de decir que terminaste. **Si sigue nombrando algo, falta.**

Y acordate de las dos que ya nos costaron caro:
- **Que un control dé verde no alcanza.** Ya pasó dos veces: 10 de 10 con la página quieta.
- **Antes de programar algo, fijate que no exista.** Pasó cuatro veces en un día.

---

## BLOQUE 1 — LO ROTO. Esto va primero.

### 1.a `/evento/actual` — la pantalla de la noche del evento

Se rompe con el **error 310 de React**. Es la que se usa en la fiesta: es lo más urgente de toda
la orden.

Ese error quiere decir siempre lo mismo: **hay un `return` antes de los `useState`/`useEffect`**,
o un hook adentro de un `if`. Se arregla **subiendo todos los hooks arriba de cualquier
`return`**. Ya se resolvió así en el blog y en las landings principales: **copiá de ahí**.

### 1.b Las otras diez de `docs/pantallas-rotas-conocidas.json`

**Ese número sólo puede bajar.** Cada una que arregles, **sacala del archivo**: a partir de ahí
no puede volver a romperse sin que la puerta frene.

Por orden de importancia —las siete primeras las ve un cliente o un invitado—:

| Pantalla | Qué le pasa |
|---|---|
| `/portal`, `/portal-cliente`, `/portal/mesas` | **El portal del cliente.** No dibuja nada |
| `/invitado/[fiestaId]/[invitadoId]` | Error 310, igual que 1.a |
| `/evento/hub/[fiestaId]`, `/evento/zona-digital/[fiestaId]` | No dibujan nada |
| `/landing/eventos` | Es una página que sólo redirige |
| `/prospectos`, `/prospectos/[id]` | Error 310 |
| `/proveedor/[id]`, `/proveedor/acceso/[token]` | No dibujan nada |
| `/evento/[id]/video-recuerdo` | Casi en blanco: 161 caracteres |
| `/evento/actual/checkin` | Casi en blanco: 75 caracteres |

**Ojo con las que "no dibujan nada":** puede que la pantalla esté sana y le falte el dato de
prueba. **Abrila a mano antes de tocar código.** Si es eso, no es un error: es que la prueba no
tiene una fiesta cargada, y lo que hay que arreglar es el dato.

---

## BLOQUE 2 — LA FOTOCABINA: 12 de 26, el agujero más grande

### 2.a Lo barato: compartir lo que YA EXISTE

**No se programa de cero. Se saca a un lugar común y se usa en las dos pantallas.**

| Falta en fotocabina | Ya está en |
|---|---|
| Accesorios que se arrastran | `espejo-magico/[fiestaId]/page.tsx:64` (`STICKERS_LIST`) |
| Firmar o dibujar sobre la foto | `espejo-magico/[fiestaId]/page.tsx:78-87` (modo `firma`) |
| Video | `plataforma-360/[fiestaId]/page.tsx:370-422` |
| Cámara lenta | `plataforma-360/[fiestaId]/page.tsx:388-392` |
| Boomerang o GIF | `generarGifDesdeImagenes`, lo usa el Bogue |

**Nunca copiar y pegar**: dos copias se despegan en un mes. Ya pasó con la carga de fotos del
Video de Vida, que estaba duplicada en dos direcciones.

### 2.b La impresión — **las tres que marcó el dueño**

En `src/lib/entretenimiento/imprimir-recuerdo.ts`:

- **Cantidad de copias: ya está resuelto a medias.** `imprimirRecuerdo(imagen, copias)` acepta
  de 1 a 10 (líneas 21 y 26). **Falta que alguien se la pase**: hoy
  `fotocabina/[fiestaId]/page.tsx:1042` llama `handleImprimir(false)` sin copias. Poné el
  selector en los ajustes de la estación.
- **El tamaño está clavado** en la constante `HOJA = '10cm 15cm'` (línea 19). Que se pueda
  elegir entre **10x15, 5x15 (la tira) y 13x18**.
- **Armar el diseño de la impresión.** Hoy `tira-fotocabina.ts:56` elige solo entre `strip_3`,
  `single_photo` y `strip_4`, **sin que nadie pueda cambiarlo**. Que lo elija el operador.

**NO programes "elegir la impresora":** lo resuelve solo el cuadro de impresión de Windows.

**Qué comprueba la prueba:** que al pedir 3 copias, lo que se manda a imprimir tenga **tres
hojas**, no una.

### 2.c La galería de la noche dentro de la estación

Existe como pantalla aparte (`/evento/galeria`). Falta poder verla **desde la fotocabina**.

---

## BLOQUE 3 — EL ÁLBUM DEL RECUERDO: 6 de 10, y es lo último que ve el cliente

Ya tiene tapa con nombre y fecha, hojas que pasan, videos y los mensajes del buzón. **Falta:**

1. **Música de fondo.** El ícono `Music` ya está importado en
   `evento/album/[fiestaId]/page.tsx:7` y no hay reproductor. **Que arranque en silencio**, con
   un botón de sonido bien visible: un álbum que arranca sonando solo espanta.
2. **Bajarlo como PDF.** El ícono `Download` está importado y no hay nada detrás.
3. **Que se arme solo al terminar la fiesta**, sin que nadie apriete nada.

**El cliente NO elige fotos.** Decisión del dueño: el álbum se arma solo y se entrega terminado;
si hay que retocar, lo retoca el equipo de AK. **No hagas pantallas de "elegí tus favoritas".**

**Qué comprueba la prueba:** que exista un álbum armado **sin que nadie haya apretado nada**
(dejá rastro con fecha), y que el PDF tenga **tantas páginas como fotos**. Una prueba que arme
el álbum ella misma y después compruebe que existe **no prueba nada**.

---

## BLOQUE 4 — LA PLATAFORMA 360: 7 de 13

- **El color de la fiesta no se aplica.** `station-config.ts:132` **sí lee** `accentColor`, pero
  la pantalla del 360 tiene los colores escritos a mano (violeta, púrpura, blanco).
- **Cortina de entrada y de salida** del video.
- **Marco animado** sobre el video.
- **Elegir cuántas vueltas da** el brazo.

---

## BLOQUE 5 — LO QUE FALTA DE LAS DEMÁS

- **Espejo Mágico — texto de marca junto al QR.** Verificado: `brandText` **no aparece** en
  `espejo-magico/[fiestaId]/page.tsx`. Está en el Bogue y en el Buzón; falta acá.
- **Espejo y Bogue — cambiar el fondo.** Misma solución que en la fotocabina.
- **Bogue — filtro de belleza** (existe en `fotocabina/[fiestaId]/page.tsx:58`) y **cuántos
  cuadros tiene el loop**, hoy clavado en `frameCount: 15` (`bogue/[fiestaId]/page.tsx:714`).
- **Pantalla gigante** — fondo elegible (con **ocho o diez** bien hechos alcanza) y **traer
  publicaciones de Instagram**: `src/lib/instagram/public-feed.ts:29` exporta
  `getPublicInstagramFeed` **y el muro no la llama**.
- **Invitación — pedir canciones** desde la invitación.
- **Decoración** — que cuente los invitados solo (tomándolos del presupuesto), que avise si un
  elemento ya está usado en otra fiesta la misma fecha, y **la vista 3D**: los componentes
  existen (`src/components/salon-3d/DecoItem3D.tsx`) y la pantalla usa sólo el plano 2D.

---

## BLOQUE 5.b — El invitado escribe su nombre cuando la app ya sabe quién es

**Medido el 2 de septiembre de 2026.** Cuando el invitado entra a confirmar **desde su propio
portal**, el enlace lleva quién es: `src/app/invitacion/[fiestaId]/invitado/[guestId]/page.tsx:282`
arma el enlace con `guestPath(...)`, que le agrega su identificador y su llave.

**Y la pantalla de confirmación los ignora.** `src/app/invitacion/[fiestaId]/rsvp/page.tsx` **no
lee nada de la dirección** —no usa `useSearchParams`— así que le pide el nombre igual, en la
línea 454. La app sabe que es María García y le pregunta cómo se llama.

**Qué hacer:** si la dirección trae el invitado, **traer su nombre y su teléfono ya escritos**, y
dejarlos editables por si quiere corregirlos. Si no los trae —que es el caso del que llega por
el enlace general— **todo sigue exactamente como está**: ahí escribir el nombre es correcto, es
como la app se entera de quién confirmó.

**Qué comprueba la prueba:** que entrando **con** el invitado en la dirección, el campo del
nombre **ya viene lleno**; y que entrando **sin** él, sigue vacío y se puede confirmar igual. La
segunda es la que importa: **no rompas el camino del que llega por el enlace general**, que son
la mayoría.

## BLOQUE 6 — CAMBIAR COSAS SIN VOLVER A PUBLICAR

`docs/ordenes/33-cambiar-sin-desplegar.md` — **da 0 de 3.** Es corta y ya está medida.

---

## LO QUE HACE CLAUDE, NO VOS

**No lo programes:** la orden 31 (buscar las fotos con una selfie), que es de permisos y de la
cara de la gente, y cualquier cosa de plata, cobros, comida o quién ve qué.

## Lo que NO se toca

El menú y los ingredientes · el ajuste anual del 15% · el reloj del simulador · los descuentos ·
**ningún texto que vea el cliente** · `apphosting.yaml` · y **nada que aumente lo que se paga
por mes**.

**`/analytics` y las estadísticas de la barra están sanas**: son tableros de números y el
control las marcaba mal. Ya se corrigió y ahora pasan. **No las toques.**

**Pero el video recuerdo y la entrada del evento SÍ están rotas**, y se midió: dibujan **161 y
75 caracteres** en toda la pantalla. Eso no es un tablero, es una pantalla casi en blanco.
**Van al bloque 1**, con las demás.

## Antes de decir que terminaste

1. `npm run "falta?"` — si sigue nombrando algo de esta orden, falta.
2. `npx jest src/__tests__/nada-de-animaciones-de-mentira.test.ts` — verde.
3. `npm run "publicar?"` completo, **una sola vez, al final**.
4. `npm run limpiar:corrida`.
5. Anotado en `docs/YA-RESUELTO.md` **con su línea en el bloque `comprobar`**.
6. `npm run mapa:generar` si agregaste alguna pantalla.

**Y la regla que manda:** cada error que arregles, **dejale un control que lo impida volver**, y
comprobá que ese control **frena de verdad rompiéndolo a propósito**.

```comprobar
usa: setFondoVirtual( en src/app/evento/espejo-magico/[fiestaId]/page.tsx
usa: brandText en src/app/evento/espejo-magico/[fiestaId]/page.tsx
usa: accentColor en src/app/evento/plataforma-360/[fiestaId]/page.tsx
usa: getPublicInstagramFeed en src/app/evento/muro-en-vivo/[fiestaId]/page.tsx
usa: copiasImpresion en src/app/evento/fotocabina/[fiestaId]/page.tsx
usa: tamanoPapel en src/app/evento/fotocabina/[fiestaId]/page.tsx
usa: audioRef.current en src/app/evento/album/[fiestaId]/page.tsx
archivo: src/lib/firebase/ajustes-remotos.ts
prueba: tests/e2e/la-fotocabina-imprime-lo-que-se-pide.spec.ts
prueba: tests/e2e/el-album-se-arma-solo.spec.ts
prueba: tests/e2e/las-pantallas-rotas-se-arreglaron.spec.ts
```
