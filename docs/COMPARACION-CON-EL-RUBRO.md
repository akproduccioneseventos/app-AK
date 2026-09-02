
---

# LA LISTA COMPLETA, CONTADA SOLA

**Pedido del dueño, 1 de septiembre de 2026:** *"vas a tener que hacer un nuevo mecanismo para
eso también, que no vuelva a pasar; si pasó en la fotocabina, me aseguro que pasó en los otros
entretenimientos y en todo lo que hemos mejorado"*.

**Tenía razón.** El problema era éste: se investigan diez plataformas, se escribe en la orden lo
que pareció importante, **y lo que no entró en la orden se pierde**. Nadie vuelve a mirar la
lista completa. Con la fotocabina pasó: quedaron afuera la configuración de impresora, el tamaño
de impresión y el diseño propio.

**`npm run ordenes?` cuenta esta lista sola** y contesta, por módulo: *"Fotocabina: 18 de 26
funciones del rubro"*. Lo que falta queda a la vista, sin depender de que alguien se acuerde.

## Fotocabina

Contra Sparkbooth, Simple Booth HALO, dslrBooth/LumaBooth, Touchpix, Snappic, Breeze, Curator,
Darkroom, Salsa/Fiesta, Mirror Me, RightBooth, AI Photo Booth Pro y Booth.Events.

```rubro Fotocabina
Foto suelta :: usa: takePhoto en src/app/evento/fotocabina/[fiestaId]/page.tsx
Tanda de varias fotos :: usa: fotosPorTanda en src/app/evento/fotocabina/[fiestaId]/page.tsx
Cuenta regresiva con numero :: usa: countdownSeconds en src/app/evento/fotocabina/[fiestaId]/page.tsx
Repetir la toma :: usa: maxRetakes en src/app/evento/fotocabina/[fiestaId]/page.tsx
Marca de agua o logo :: usa: brandText en src/app/evento/fotocabina/[fiestaId]/page.tsx
Marcos para la foto :: usa: marcosHabilitados en src/app/evento/fotocabina/[fiestaId]/page.tsx
Entrega por QR :: usa: QrRecuerdo en src/app/evento/fotocabina/[fiestaId]/page.tsx
Imprimir :: usa: imprimir-recuerdo en src/app/evento/fotocabina/[fiestaId]/page.tsx
La estacion habla :: usa: speechSynthesis en src/app/evento/fotocabina/[fiestaId]/page.tsx
Filtro de belleza :: usa: aplicarFiltroBelleza en src/app/evento/fotocabina/[fiestaId]/page.tsx
Camara vertical u horizontal :: usa: modos-captura en src/app/evento/fotocabina/[fiestaId]/page.tsx
Cambiar el fondo con tela verde :: usa: procesarFondoCanvas en src/app/evento/fotocabina/[fiestaId]/page.tsx
Cambiar el fondo SIN tela :: FALTA
Fondo desenfocado de verdad :: FALTA
Fondo de la pantalla, el telon :: FALTA
Elegir el tamano de impresion :: FALTA
Cuantas copias se imprimen :: FALTA
Elegir la impresora :: FALTA
Armar el diseno de la impresion :: FALTA
Galeria de la noche :: FALTA
Marcos animados :: FALTA
Accesorios que se arrastran :: FALTA
Firmar o dibujar sobre la foto :: FALTA
Boomerang o GIF :: FALTA
Video :: FALTA
Camara lenta :: FALTA
```

**Las tres que el dueño marcó y no estaban en ninguna orden** —tamaño de impresión, cantidad de
copias y armar el diseño— **ahora figuran acá y no se pierden más.**

## Cómo se agrega un módulo

Un bloque por módulo, una línea por función del rubro:

```
Nombre de la función :: usa: unSimbolo en la/ruta/del/archivo.tsx
Nombre de la función :: FALTA
```

**Se cargan TODAS las funciones que se vieron en las plataformas, no las que parecieron
importantes.** Ésa fue exactamente la falla.

**Faltan cargar:** Plataforma 360, Bogue, Espejo Mágico, Touchpix, Buzón, la pantalla gigante,
la invitación y la decoración.

## Plataforma 360

Contra dslrBooth 360, Snappic 360, Touchpix, Snap360 y las de plataforma giratoria.

```rubro Plataforma 360
Graba video girando :: usa: recordingDurationSeconds en src/app/evento/plataforma-360/[fiestaId]/page.tsx
Camara lenta :: usa: processSlowMotionVideo en src/app/evento/plataforma-360/[fiestaId]/page.tsx
Cuenta regresiva :: usa: countdownSeconds en src/app/evento/plataforma-360/[fiestaId]/page.tsx
Marca de agua :: usa: brandText en src/app/evento/plataforma-360/[fiestaId]/page.tsx
Entrega por QR :: usa: qrCallout en src/app/evento/plataforma-360/[fiestaId]/page.tsx
Galeria de la noche :: usa: recentVideos en src/app/evento/plataforma-360/[fiestaId]/page.tsx
Repetir la toma :: usa: maxRetakes en src/app/evento/plataforma-360/[fiestaId]/page.tsx
Color de la fiesta :: FALTA
Musica sobre el video :: FALTA
Cambios de velocidad, el efecto de moda :: FALTA
Marco animado sobre el video :: FALTA
Cortina de entrada y de salida :: FALTA
Elegir cuantas vueltas da :: FALTA
```

## Bogue (boomerang)

Contra dslrBooth, Touchpix, Salsa y Curator.

```rubro Bogue
Boomerang o GIF :: usa: generarGifDesdeImagenes en src/app/evento/bogue/[fiestaId]/page.tsx
Cuenta regresiva :: usa: countdownSeconds en src/app/evento/bogue/[fiestaId]/page.tsx
Marcos :: usa: marcosHabilitados en src/app/evento/bogue/[fiestaId]/page.tsx
Marca de agua :: usa: brandText en src/app/evento/bogue/[fiestaId]/page.tsx
Entrega por QR :: usa: qrCallout en src/app/evento/bogue/[fiestaId]/page.tsx
La estacion habla :: usa: speechSynthesis en src/app/evento/bogue/[fiestaId]/page.tsx
Velocidad del rebote :: usa: recordingDurationSeconds en src/app/evento/bogue/[fiestaId]/page.tsx
Cuantos cuadros tiene el loop :: FALTA
Galeria de la noche :: usa: handleAutoUpload en src/app/evento/bogue/[fiestaId]/page.tsx
Cambiar el fondo :: FALTA
Filtro de belleza :: FALTA
Repetir la toma :: usa: allowGuestRetake en src/app/evento/bogue/[fiestaId]/page.tsx
```

## Espejo Magico

Contra Mirror Me Booth, Touchpix Mac, Sparkbooth mirror y AI Photo Booth Pro.

```rubro Espejo Magico
Foto :: usa: takePhoto en src/app/evento/espejo-magico/[fiestaId]/page.tsx
Firmar o dibujar sobre la foto :: usa: firma en src/app/evento/espejo-magico/[fiestaId]/page.tsx
Accesorios que se arrastran :: usa: sticker en src/app/evento/espejo-magico/[fiestaId]/page.tsx
Cambiar la cara con inteligencia artificial :: usa: espejo-magico-ai en src/app/evento/espejo-magico/[fiestaId]/page.tsx
Filtros de imagen :: usa: filtro en src/app/evento/espejo-magico/[fiestaId]/page.tsx
Pide permiso antes de publicar :: usa: hayQuePedirPermiso en src/app/evento/espejo-magico/[fiestaId]/page.tsx
La estacion habla :: usa: speechSynthesis en src/app/evento/espejo-magico/[fiestaId]/page.tsx
Animaciones con locucion, las 200 de Mirror Me :: FALTA
Texto de marca junto al QR :: FALTA
Galeria de la noche :: usa: muro de la fiesta en src/app/evento/espejo-magico/[fiestaId]/page.tsx
Cambiar el fondo :: FALTA
Imprimir :: usa: imprimirRecuerdo en src/app/evento/espejo-magico/[fiestaId]/page.tsx
```

## Buzon de recuerdos

Contra Instawall, Wedibox, Eventoly y las de video guest book.

```rubro Buzon de recuerdos
Mensaje en video :: usa: video en src/app/evento/buzon/[fiestaId]/page.tsx
Mensaje de audio :: usa: audio en src/app/evento/buzon/[fiestaId]/page.tsx
Foto con dedicatoria :: usa: foto en src/app/evento/buzon/[fiestaId]/page.tsx
Cabina telefonica retro :: usa: Cabina en src/app/evento/buzon/[fiestaId]/page.tsx
Subir desde la galeria del celular :: usa: subir en src/app/evento/buzon/[fiestaId]/page.tsx
Cuenta regresiva :: usa: countdownSeconds en src/app/evento/buzon/[fiestaId]/page.tsx
Color de la fiesta :: usa: accentColor en src/app/evento/buzon/[fiestaId]/page.tsx
Fondo oscuro como las demas :: usa: bg-background en src/app/evento/buzon/[fiestaId]/page.tsx
Texto de marca y del QR :: usa: brandText en src/app/evento/buzon/[fiestaId]/page.tsx
Volver a grabar :: usa: Grabar otro recuerdo en src/app/evento/buzon/[fiestaId]/page.tsx
La estacion habla :: usa: speak en src/app/evento/buzon/[fiestaId]/page.tsx
Que los mensajes entren al album :: usa: sourceModule === 'buzon' en src/lib/album/armar-album.ts
```

## Pantalla gigante

Contra Instawall, Walls.io, Taggbox, Kululu, GuestCam, EventMobi, Webex y Whova.

```rubro Pantalla gigante
Fotos en vivo con moderacion :: usa: isPostApprovedForScreen en src/app/evento/muro-en-vivo/[fiestaId]/page.tsx
Encuestas con resultados :: usa: activePoll en src/app/evento/muro-en-vivo/[fiestaId]/page.tsx
Sorteo con rueda :: usa: sorteoSpinActive en src/app/evento/muro-en-vivo/[fiestaId]/page.tsx
Chat de invitados :: usa: recentChatMessages en src/app/evento/muro-en-vivo/[fiestaId]/page.tsx
Pedidos al DJ :: usa: recentSongRequests en src/app/evento/muro-en-vivo/[fiestaId]/page.tsx
Juegos con podio :: usa: activeGame en src/app/evento/muro-en-vivo/[fiestaId]/page.tsx
Momentos a pantalla completa :: usa: activeMoment en src/app/evento/muro-en-vivo/[fiestaId]/page.tsx
Publicidad y redes :: usa: marquee en src/app/evento/muro-en-vivo/[fiestaId]/page.tsx
Se mueve con la musica :: usa: AudioRhythmSlide en src/app/evento/muro-en-vivo/[fiestaId]/page.tsx
Aviso si se corta internet :: usa: isReconnecting en src/app/evento/muro-en-vivo/[fiestaId]/page.tsx
Modo cine, una foto sola :: usa: cinemaMode en src/app/evento/muro-en-vivo/[fiestaId]/page.tsx
Dedicatorias en pantalla :: usa: dedicaciones en src/app/evento/muro-en-vivo/[fiestaId]/page.tsx
Dice de quien es la fiesta :: usa: eventName en src/app/evento/muro-en-vivo/[fiestaId]/page.tsx
Fondo elegible, los 100 de Instawall :: FALTA
Portada mientras no hay fotos :: usa: EmptyWallState en src/app/evento/muro-en-vivo/[fiestaId]/page.tsx
Moderacion que ayude sola :: FALTA
Traer publicaciones de Instagram :: NO SE COPIA
```

## Invitacion digital

Contra Zola, The Knot, Joy y Zankyou.

```rubro Invitacion digital
Portada con foto y nombres :: usa: fotoPortada en src/app/invitacion/[fiestaId]/invitacion-publica-client.tsx
Confirmacion con menu y alergias :: usa: alergiasEspecificas en src/app/invitacion/[fiestaId]/rsvp/page.tsx
Cuenta regresiva :: usa: Countdown en src/app/invitacion/[fiestaId]/invitacion-publica-client.tsx
Cronograma del dia :: usa: cronograma en src/app/invitacion/[fiestaId]/invitacion-publica-client.tsx
Lista de regalos con datos bancarios :: usa: datosBancarios en src/lib/invitacion-digital-defaults.ts
Codigo de vestimenta :: usa: dressCode en src/lib/invitacion-digital-defaults.ts
Galeria de fotos :: usa: galeria en src/app/invitacion/[fiestaId]/invitacion-publica-client.tsx
Preguntas frecuentes :: usa: faq en src/app/invitacion/[fiestaId]/invitacion-publica-client.tsx
Mapa de como llegar :: usa: mapsUrl en src/components/invitacion/templates/GraziaTemplate.tsx
Compartir por WhatsApp :: usa: whatsappMensaje en src/app/invitacion/[fiestaId]/invitacion-publica-client.tsx
Varios disenos :: usa: XvModernaTemplate en src/components/invitacion/templates/index.ts
Enlace propio para cada invitado :: usa: guestId en src/app/invitacion/[fiestaId]/invitado/[guestId]/page.tsx
Hoteles y como llegar de lejos :: NO SE COPIA
Pedir canciones desde la invitacion :: FALTA
```

## Decoracion

Contra Creador, Merri, Prismm, Social Tables, AI Party y 3D Event Designer.

```rubro Decoracion
Catalogo de elementos :: usa: itemsDecoracion en src/app/(app)/fiestas/nueva/decoracion/page.tsx
Tablero de inspiracion del cliente :: usa: moodboardItems en src/app/portal/[fiestaId]/moodboard/page.tsx
Paleta de colores :: usa: paletaColores en src/app/(app)/fiestas/nueva/decoracion/page.tsx
Lienzo para armar el diseno :: usa: ElementoDecorativo en src/app/(app)/fiestas/nueva/decoracion/page.tsx
Lista de lo que hay que montar :: usa: checklistDecoracion en src/app/(app)/fiestas/nueva/decoracion/page.tsx
Muestrario de fiestas anteriores :: usa: DecoMuestrario en src/app/(app)/fiestas/nueva/decoracion/page.tsx
El cliente ve su propuesta :: usa: enviarOpinionDecoracion en src/app/actions/fiesta/decoracion.actions.ts
Imagen del salon decorado con IA :: usa: generarVisualizacionSalonAi en src/app/actions/fiesta/decoracion.actions.ts
Plano para poner las mesas :: usa: DecoCanvas en src/app/(app)/fiestas/nueva/decoracion/page.tsx
Que cuente los invitados solo :: FALTA
Que avise si un elemento ya esta usado :: FALTA
Vista 3D que se dibuje :: FALTA
Catalogo de 80.000 objetos como Merri :: NO SE COPIA
```

## Album del recuerdo

Contra Kululu, GuestPix, GuestCam, Curator, Wfolio, Kamero, FotoOwl y Memzo.

```rubro Album del recuerdo
Junta las fotos de todas las estaciones :: usa: getPublicSocialPosts en src/app/evento/album/[fiestaId]/page.tsx
Video recuerdo con musica :: usa: audioRef en src/app/evento/[id]/video-recuerdo/video-recuerdo-client.tsx
Descargar todo junto :: usa: download-recuerdos en src/app/api/fiestas/[fiestaId]/download-recuerdos/route.ts
Compartir con un enlace :: usa: handleShare en src/app/evento/album/[fiestaId]/page.tsx
Los audios del buzon en el album :: usa: audioReproduciendo en src/app/evento/album/[fiestaId]/page.tsx
Se arma solo con los mejores :: FALTA
Se pasan paginas como un libro :: usa: AnimatePresence en src/app/evento/album/[fiestaId]/page.tsx
Portada con el nombre de la fiesta :: usa: nombreFiesta en src/app/evento/album/[fiestaId]/page.tsx
Buscar tus fotos con una selfie :: FALTA
Que el cliente elija :: NO SE COPIA
```
