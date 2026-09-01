
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
