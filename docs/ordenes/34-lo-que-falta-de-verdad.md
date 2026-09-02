# Orden 34 — Lo que falta DE VERDAD, medido el 2 de septiembre de 2026

**UNA SOLA PROPUESTA con todos los bloques.** No una por bloque: cada fusión dispara un
despliegue y eso se paga. Si un bloque se traba, **entregá el resto igual, en la misma
propuesta**, y decí cuál faltó y por qué.

## Por qué existe esta orden

El control `npm run ordenes?` decía que faltaban ~50 funciones. Se verificaron **una por una,
abriendo el archivo**. Resultado: **la mitad ya estaba hecha** y el control estaba mal escrito,
no la app. Esta orden trae **sólo lo que falta de verdad**, ya confirmado.

---

## BLOQUE 0 — LO QUE NO HAY QUE TOCAR (ya está, verificado)

**Si programás algo de esta lista, tiraste el viaje.** Está comprobado con archivo y línea:

| Lo que el control decía que faltaba | Dónde está de verdad |
|---|---|
| Bogue: velocidad del rebote | `src/app/evento/bogue/[fiestaId]/page.tsx:713` |
| Bogue: galería de la noche | mismo archivo, 634-704 |
| Bogue: repetir la toma | mismo archivo, 1145 (`allowGuestRetake`) |
| Espejo: la estación habla | `espejo-magico/[fiestaId]/page.tsx:227` (`speak`) |
| Espejo: galería de la noche | mismo archivo, 75-97 |
| Espejo: imprimir | mismo archivo, 26 (`imprimirRecuerdo`) |
| Buzón: cabina retro, fondo oscuro, texto de marca, volver a grabar, la estación habla | `buzon/[fiestaId]/page.tsx` 34, 1070, 1107, 1137 |
| Buzón: los mensajes entran al álbum | `src/lib/album/armar-album.ts:77` |
| Invitación: cuenta regresiva | ya estaba |
| Álbum: pasar hojas, videos, mensajes, tapa con nombre y fecha | `evento/album/[fiestaId]/page.tsx` 153, 42, 40, 165 |
| Muro: nombre del homenajeado, portada sin fotos | `muro-en-vivo/[fiestaId]/page.tsx` 505, 547 |
| Decoración: plano de mesas, catálogo | `(app)/fiestas/nueva/decoracion/page.tsx` 29, 67 |
| Fotocabina: elegir impresora | **lo resuelve el cuadro de impresión de Windows**, no hay que programarlo |

**Y tampoco se toca:** el menú, los ingredientes, el ajuste anual del 15%, el reloj del
simulador, los descuentos, ni ningún texto que vea el cliente.

---

## BLOQUE 1 — EL CAMBIO DE FONDO: está escrito y NADIE LO LLAMA

**Es el bloque más rentable de la orden: el 90% ya está programado.**

`src/lib/entretenimiento/segmentacion-fondo.ts:72` exporta `procesarFondoCanvas({
canvasDestino, videoOrigen, fondoSeleccionado, imagenFondo, toleranciaChroma })`, y **ya
resuelve los tres casos**: `tipo: 'ninguno'`, `tipo: 'desenfoque'` (blur de 16px, línea ~92) y
el croma.

**El problema:** está **importado en tres pantallas y llamado en ninguna**:

- `src/app/evento/fotocabina/[fiestaId]/page.tsx:66` — importa, nunca llama.
- `src/app/evento/bogue/[fiestaId]/page.tsx:66` — importa, nunca llama.
- `src/app/evento/touchpix/[fiestaId]/page.tsx:55` — importa, nunca llama.

### Qué hay que hacer

1. **Llamarla de verdad**, en el bucle que dibuja la vista previa de cada una de las tres
   pantallas, antes de sacar la foto. La salida tiene que ser la que se captura, no sólo la que
   se ve.
2. **Poner el control en pantalla** para que el invitado elija: *Sin fondo* · *Fondo borroso* ·
   *Fondo de la fiesta*. Tres botones grandes, se toca con el dedo.
3. **El croma deja una mancha negra**: cuando `tipo` es croma y no hay `imagenFondo`, se
   recorta a la persona y **no se dibuja nada atrás**. Hay que dibujar el fondo elegido primero
   y la persona encima. Si no hay fondo cargado, **no ofrecer la opción** en vez de sacar una
   foto con un agujero negro.
4. **El fondo sin tela (sin croma verde)**: es lo único que sirve en el salón del dueño —*"un
   metro y medio para atrás es imposible"*—. Usar la segmentación del navegador
   (`ImageSegmenter` de MediaPipe o `BodySegmenter`), **que corre en el teléfono y no se paga
   por foto**. Si el dispositivo no la soporta, se cae a *fondo borroso*, que sí anda en todos.

**Qué tiene que comprobar la prueba** (no alcanza con "se ve el botón"): que al elegir *fondo
borroso*, **los píxeles del borde de la imagen capturada cambien** respecto de la captura sin
fondo. Una prueba que sólo mire que el botón existe no sirve.

---

## BLOQUE 2 — LA FOTOCABINA: compartir lo que YA EXISTE en otras estaciones

Cuatro funciones que la fotocabina no tiene **y que ya están programadas al lado**. No se
programan de cero: se sacan a un lugar común y se usan en las dos.

| Qué falta en fotocabina | Dónde ya está |
|---|---|
| Accesorios que se arrastran | `espejo-magico/[fiestaId]/page.tsx:64` (`STICKERS_LIST`) |
| Firmar o dibujar sobre la foto | `espejo-magico/[fiestaId]/page.tsx:78-87` (modo `firma`) |
| Video | `plataforma-360/[fiestaId]/page.tsx:370-422` |
| Cámara lenta | `plataforma-360/[fiestaId]/page.tsx:388-392` |

**Cómo:** mover cada uno a `src/components/entretenimiento/` (o `src/lib/entretenimiento/`) y
que **las dos pantallas usen el mismo**. **No copiar y pegar**: dos copias se despegan en un mes
—ya pasó con la carga de fotos del Video de Vida, que estaba duplicada en dos direcciones—.

**Y falta de cero:** *boomerang/GIF* en fotocabina. Ojo: `generarGifDesdeImagenes` ya existe y
lo usa el Bogue. Mirar antes de escribir.

---

## BLOQUE 3 — LA IMPRESIÓN (esto lo pidió el dueño y no estaba en ninguna orden)

En `src/lib/entretenimiento/imprimir-recuerdo.ts`:

- **La cantidad de copias YA está resuelta**: `imprimirRecuerdo(imagen, copias)` acepta de 1 a
  10 (línea 21 y 26). **Lo que falta es que alguien se la pase.** Hoy
  `fotocabina/[fiestaId]/page.tsx:1042` llama `handleImprimir(false)` sin copias. Poner el
  selector en los ajustes de la estación y pasarlo.
- **El tamaño está clavado**: constante `HOJA = '10cm 15cm'` (línea 19). Hacerlo ajustable con
  las tres medidas del rubro: **10x15, 5x15 (la tira) y 13x18**.
- **Armar el diseño de la impresión**: hoy `src/lib/entretenimiento/tira-fotocabina.ts:56` elige
  solo entre `strip_3`, `single_photo` y `strip_4`, **sin que nadie pueda cambiarlo**. Que el
  operador elija cuál en los ajustes de la fiesta.

**Qué comprueba la prueba:** que al pedir 3 copias, lo que se manda a imprimir tenga **tres
hojas**, no una.

---

## BLOQUE 4 — EL ÁLBUM DEL RECUERDO (3 de 10, el más flojo, y es lo último que ve el cliente)

Ya tiene tapa, hojas que pasan, videos y mensajes del buzón. **Falta:**

1. **Música de fondo mientras se pasa.** El ícono `Music` ya está importado
   (`evento/album/[fiestaId]/page.tsx:7`) y no hay reproductor. Que arranque en silencio con un
   botón de sonido bien visible: **un álbum que arranca sonando solo espanta**.
2. **Bajarlo como PDF.** El ícono `Download` está importado y no hay nada detrás.
3. **Que se arme solo al terminar la fiesta.** Hoy no lo dispara nadie. Es lo que pidió el
   dueño: *"todo lo que pueda ser automático"*. **El cliente NO elige fotos**: se arma solo con
   las mejores y se entrega terminado; si hay que retocar, lo retoca el equipo de AK.

**Qué comprueba la prueba:** que **exista un álbum armado sin que nadie haya apretado nada**
(dejar rastro con fecha), y que el PDF que se baja **tenga tantas páginas como fotos**. Una
prueba que arme el álbum ella misma y después compruebe que existe **no prueba nada**.

---

## BLOQUE 5 — LO QUE FALTA EN LAS ESTACIONES CHICAS

- **Espejo Mágico — texto de marca junto al QR.** Verificado: `brandText` **no aparece** en
  `espejo-magico/[fiestaId]/page.tsx`. Está en el Bogue y en el Buzón; falta acá. Es el nombre
  de AK en la pantalla de compartir.
- **Bogue — filtro de belleza.** Existe en `fotocabina/[fiestaId]/page.tsx:58`. Compartirlo,
  como el bloque 2.
- **Bogue — cuántos cuadros tiene el loop.** Hoy está clavado en `frameCount: 15`
  (`bogue/[fiestaId]/page.tsx:714`). Que se pueda ajustar desde la fiesta.
- **Plataforma 360 — el color de la fiesta no se aplica.** `station-config.ts:132` **sí lee**
  `accentColor`, pero la pantalla del 360 tiene los colores escritos a mano (violeta, púrpura,
  blanco). Que use el color de la fiesta, como las otras estaciones.
- **Plataforma 360 — cortina de entrada y de salida**, y **marco animado sobre el video**.

---

## BLOQUE 6 — LA PANTALLA GIGANTE

- **Fondo elegible.** Hoy sólo hay `mobileControlCoverUrl`, que es la **portada** cuando no hay
  fotos, no el fondo. Instawall trae 100 fondos; con **ocho o diez bien hechos** alcanza.
- **Traer publicaciones de Instagram.** `src/lib/instagram/public-feed.ts:29` exporta
  `getPublicInstagramFeed` y **el muro no la llama**. Otro caso de escrito-y-desenchufado.
- **Moderación que ayude sola.** Hoy se marca `highlighted: true` en la base y **no hay nada en
  pantalla** que le diga al operador qué conviene mirar.

---

## BLOQUE 7 — LA DECORACIÓN

- **Que cuente los invitados solo**, tomándolos del presupuesto. Hoy no hay ninguna conexión
  entre la decoración y la cantidad de gente.
- **Que avise si un elemento ya está usado** en otra fiesta la misma fecha. Es lo que evita
  prometer dos veces el mismo panel.
- **La vista 3D.** Los componentes existen (`src/components/salon-3d/DecoItem3D.tsx`) y la
  pantalla usa sólo el plano 2D. Tercer caso de escrito-y-desenchufado.

---

## BLOQUE 8 — LAS ONCE PANTALLAS ROTAS

Están anotadas en `docs/pantallas-rotas-conocidas.json`. **Ese número sólo puede bajar.** Las
que más importan, porque las ve el cliente o el invitado:

- `/portal`, `/portal-cliente`, `/portal/mesas` — **el portal del cliente**.
- `/invitado/fiesta_esta_noche/invitado_1` — la pantalla del invitado.
- `/evento/hub/...` y `/evento/zona-digital/...`
- `/proveedor/...` (dos), `/prospectos` (dos), `/landing/eventos`

Cuatro se rompen con el **error 310 de React**, que quiere decir siempre lo mismo: **hay un
`return` antes de los `useState`/`useEffect`**, o un `hook` adentro de un `if`. Se arregla
subiendo todos los hooks arriba de cualquier `return`.

**Cada una que se arregla se saca del archivo.** A partir de ahí no puede volver a romperse sin
que la puerta frene.

---

## LO QUE HACE CLAUDE, NO GEMINI

**No lo programes, ya está repartido:**

- **El álbum pide iniciar sesión y no debería.** `/evento/album/[fiestaId]` **no está** en
  `src/lib/auth/public-paths.ts`, mientras que `/evento/galeria` sí (línea 62) y las seis
  estaciones también. El álbum es el regalo final del cliente y hoy **el invitado con el enlace
  no lo puede abrir**. Es un tema de permisos: lo toca Claude.
- **Orden 33 (cambiar sin desplegar)** y lo de Firebase.
- **Orden 31 (encontrá tus fotos con una selfie)** — el bloque 0, las reglas de la cara, no se
  negocia.

---

## ANTES DE DECIR QUE TERMINASTE

1. `npm run ordenes?` — si dice FALTA, falta, aunque las pruebas den verde.
2. `npm run "publicar?"` **completo en verde**. Una sola vez, al final, con todo junto.
3. `npm run limpiar:corrida`.
4. Anotado en `docs/YA-RESUELTO.md` **con su línea en el bloque `comprobar`**.
5. `npm run mapa:generar` si agregaste alguna pantalla.

**Y la regla que manda sobre todas:** cada error que arregles, **dejale un control que lo
impida volver**, y comprobá que ese control **frena de verdad rompiéndolo a propósito**. Un
arreglo sin ese control no está terminado.

```comprobar
archivo: src/lib/entretenimiento/segmentacion-fondo.ts
usa: procesarFondoCanvas( en src/app/evento/fotocabina/[fiestaId]/page.tsx
usa: procesarFondoCanvas( en src/app/evento/bogue/[fiestaId]/page.tsx
usa: brandText en src/app/evento/espejo-magico/[fiestaId]/page.tsx
usa: accentColor en src/app/evento/plataforma-360/[fiestaId]/page.tsx
usa: getPublicInstagramFeed en src/app/evento/muro-en-vivo/[fiestaId]/page.tsx
prueba: tests/e2e/el-fondo-se-cambia-de-verdad.spec.ts
prueba: tests/e2e/el-album-se-arma-solo.spec.ts
```
