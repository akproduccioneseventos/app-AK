---
name: que-te-encuentren
description: Como hacer que el prospecto de Salto encuentre a AK en Google antes que a la competencia. Usala cuando se toque cualquier pagina publica -landings, blog, portada, paginas de bodas o quince-, cuando se cree una pagina nueva que vea un desconocido, cuando el dueño pregunte por Google, por posicionamiento, por que no llegan consultas o por publicidad, y antes de dar por terminada cualquier pantalla a la que se llegue desde afuera. Trae que revisar, en que orden, y los errores que hacen desaparecer una pagina del buscador.
---

# Que te encuentren

**El negocio de AK es local: fiestas de quince y casamientos en Salto y alrededores.**
Eso cambia todo. No hay que competir con las grandes del rubro por palabras
generales: hay que ganar **"salon para 15 en Salto"**, **"fotocabina Salto"**,
**"animacion fiesta 15 años Salto"**. Son pocas busquedas por mes, pero **el que
busca eso esta a semanas de contratar**.

## Lo primero, siempre: ¿esta pagina se puede encontrar?

Antes de mirar textos, tres cosas que la hacen **invisible** por mas bien escrita
que este:

1. **¿Existe de verdad para Google?** Si el contenido aparece recien cuando corre
   el codigo en el navegador, el buscador puede no verlo nunca. En Next.js: la
   pagina publica **no puede depender de `useEffect` para mostrar lo que vende**.
   Con `view-source:` en el navegador tiene que verse el texto.
2. **¿Esta bloqueada sin querer?** Un `noindex` olvidado o el archivo `robots.txt`
   tapando la carpeta. Pasa mas de lo que parece y **borra la pagina del mapa**.
3. **¿Tiene una sola direccion?** La misma pagina en dos direcciones distintas se
   pelea consigo misma. Se resuelve con la etiqueta `canonical`.

## Lo que mira Google, en orden de cuanto pesa

| Que | Donde va | Cuidado |
|---|---|---|
| **El titulo** | `metadata.title` | 55-60 caracteres. **Empieza con lo que se busca**, termina con "AK Producciones Salto" |
| **La descripcion** | `metadata.description` | 150-160. No posiciona, **pero decide si te tocan**. Escribila como un aviso |
| **UN solo titulo grande** | `<h1>` | Uno por pagina. Dos confunden y no suman |
| **Los subtitulos** | `<h2>`, `<h3>` | Que digan de que habla el bloque, no "Nuestros servicios" |
| **El texto de los enlaces** | `<a>` | "ver fotos de fiestas de 15" sirve; "clic aca" no dice nada |
| **El texto alternativo de las fotos** | `alt` | Describi la foto de verdad. Es lo que te trae visitas por imagenes |

## La ficha del negocio, que es lo que mas rinde en local

Google muestra un cuadro a la derecha con horarios, telefono y reseñas. **Eso trae
mas consultas que cualquier texto.** Se alimenta desde dos lados:

- **La ficha de Google del negocio**, que se carga a mano fuera de la app. Si el
  dueño no la tiene completa, **eso vale mas que cualquier cambio de codigo**, y
  hay que decirselo.
- **Los datos marcados en la pagina**: el componente `LocalBusinessSchema.tsx` ya
  existe en la app. Tiene que llevar nombre, direccion, telefono, zona que se
  atiende y reseñas — **exactamente iguales** a los de la ficha de Google. Una
  direccion distinta en dos lados le da desconfianza al buscador.

Para las paginas de preguntas frecuentes, marcarlas como preguntas (`FAQPage`)
hace que aparezcan desplegadas abajo del resultado y **ocupan mas lugar en la
pantalla del que busca**.

## Lo que de verdad mueve la aguja, y no es escribir mas

1. **Una pagina por cosa que se busca.** "Fiesta de 15", "casamiento", "fotocabina"
   merecen **su propia pagina**, no un parrafo dentro de una. La app ya tiene esa
   estructura con las landings: **usarla, no meter todo en la portada**.
2. **Que cargue rapido en el celular.** Google lo mide y lo usa para ordenar. Si
   esto aparece como problema, la habilidad que corresponde es `que-cargue-rapido`.
3. **Fotos propias, no compradas.** Las de fiestas de verdad en Salto valen mas que
   cualquier banco de imagenes, y ademas venden mejor.
4. **Reseñas.** Es lo unico de esta lista que no se programa. Si el dueño no tiene
   el enlace para pedirlas cargado, **decirselo**: la app ya tiene el boton y sin
   enlace no aparece.

## Los errores que hacen desaparecer una pagina

- **Titulos repetidos** en varias paginas: Google elige una y esconde el resto.
- **Texto copiado** entre la landing de bodas y la de quince. Si dos paginas dicen
  casi lo mismo, se anulan. **Cada una tiene que hablar de lo suyo.**
- **Una pagina nueva a la que no llega ningun enlace.** Si no se puede llegar
  tocando, para Google casi no existe: enlazarla desde el menu o desde otra pagina.
- **Prometer en el titulo lo que la pagina no cumple.** Sube un tiempo y despues
  baja mas, porque la gente entra y se va enseguida.

## Antes de dar por terminada una pagina publica

- ¿Tiene **titulo y descripcion propios**, distintos de los de las otras?
- ¿Tiene **un solo** titulo grande, y dice lo que la persona busco?
- ¿El texto que vende **se ve en el codigo fuente**, sin depender del navegador?
- ¿Las fotos tienen descripcion escrita **de la foto real**?
- ¿Se **llega** a esta pagina desde algun enlace del sitio?
- ¿Nombra **Salto y la zona**? Sin eso, no compite en lo local.

## Y lo que NO se toca

**Ningun texto de venta, promesa, precio ni promocion se cambia por una razon de
buscador.** Son decisiones comerciales del dueño. Se puede agregar un titulo, una
descripcion o un dato marcado; **cambiar lo que dice un cartel que ya anda, no**.
Si conviene cambiarlo, se le propone en una linea y decide el.

Y en particular: **no se promete un plazo de respuesta ni un precio sostenido en
el tiempo.** Esa la dio el dueño el 27 de agosto de 2026 y vale tambien para
cualquier texto nuevo que se escriba pensando en Google.
