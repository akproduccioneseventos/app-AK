# Orden 57 — La portada aparece al toque, sin esperar a nadie

**Para Gemini. UNA SOLA propuesta.** Si un bloque se traba, entregá el resto igual y avisá cuál
faltó.

## De dónde sale, y por qué es lo más caro que tiene la app hoy

El dueño no podía entrar y la portada le tiraba un cartel de error de Google. Se midió de los
dos lados y **las dos mediciones dan lo mismo**: el servidor prende en 3 segundos, y después la
app tarda entre 14 y 23 segundos en armar la primera pantalla. A partir de la segunda visita
contesta en centésimas.

Palabras del dueño: *"esto le pasa a un prospecto y se va"*. Tiene razón, y por eso esto va
primero que cualquier otra cosa.

**Y la causa está verificada, leyendo el código, no suponiendo.** En
`src/app/page.tsx`, la función `HomePage` (línea ~299) **espera a que terminen DIEZ pedidos de
datos antes de dibujar un solo pixel**:

```
promo, landingSettings, catalogoFotos, youtubeVideos, testimonialData,
socialConnections, galeriaData, instagramFeed, salones, publishedBlogPosts
```

Van todos juntos en un `Promise.all`, así que **la página tarda lo que tarda el más lento**.
Varios salen a internet —YouTube, Instagram— y otros a la base. Cada uno tiene su tope de
espera, de 2,5 a 4,5 segundos. Con el servidor recién despierto se suman los peores casos, y el
prospecto mira una pantalla en blanco hasta que Google se cansa.

**La prueba de que se puede hacer bien y gratis está en tu propia app:** el simulador de
presupuesto abre en menos de un segundo, porque no espera a nadie para mostrarse.

## Qué hay que lograr

**Que lo primero que se ve aparezca de entrada, y que el resto llegue después, solo.**

- **No espera nadie:** el encabezado, el titular, la imagen principal y los botones de contacto.
  Eso es lo que decide si el prospecto se queda. Hoy vive en `LandingNav` y `HeroSection`.
- **Puede seguir esperando, porque afecta lo primero que se ve:** `promo` y `landingSettings`.
  La promoción cambia el cartel de arriba y los ajustes traen los textos. **Esos dos quedan
  donde están.**
- **Los otros ocho pasan a llegar después**, sin frenar la pantalla: catálogo de fotos, videos
  de YouTube, testimonios, redes, galería, Instagram, salones y blog. Mientras no llegan, en su
  lugar va el espacio reservado con su forma —no un hueco que salta cuando aparece el
  contenido—.

**Cómo se hace en esta app:** cada sección que hoy recibe esos datos pasa a cargarse aparte, con
su propio recuadro de espera, usando lo que Next ya trae para eso. No hace falta instalar nada.
Si alguna sección es más fácil de resolver cargándola desde el navegador después de abrir, está
bien también: lo que importa es que **la primera pantalla no la espere**.

## Qué NO tocar, y esto es importante

- **El reloj del simulador, los textos de venta, el descuento del Club Uruguay y el ajuste
  anual.** Son decisiones comerciales del dueño.
- **Los topes de espera que ya existen** (`withPublicFallback`, línea ~61). Están bien puestos y
  evitan que un servicio caído cuelgue la página. No se sacan.
- **Los datos que se muestran.** No se saca ni se agrega ninguna sección: se cambia **cuándo**
  llegan, no **qué** se muestra.
- **La información para Google** (`generateMetadata`). Esa ya tiene su propio tope y anda.

## Qué tiene que comprobar la prueba, y es lo único que la hace valer

**El número de antes y el de después, medidos sobre la versión compilada, no la de desarrollo.**

1. **Una prueba de navegador que entre a la portada y compruebe que el titular y el botón de
   contacto están visibles**, con los ocho pedidos lentos todavía sin contestar. La forma de
   comprobarlo: interceptar esos pedidos y hacerlos tardar a propósito. Si el titular aparece
   igual, está resuelto. **Si la prueba espera a que todo cargue, no prueba nada.**
2. **El tiempo hasta que se ve el titular, antes y después**, escrito en la entrega. Sin esos
   dos números no se sabe si mejoró.

```comprobar
archivo: src/app/page.tsx
prueba: tests/e2e/la-portada-aparece-al-toque.spec.ts
```
