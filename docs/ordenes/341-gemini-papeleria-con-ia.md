# Orden 341 — La papelería de cada fiesta la diseña la IA, con los datos de la fiesta

**Para Gemini. Propuesta aparte, rama nueva `gemini/orden-341` desde la principal recién actualizada, después de la 339
(con su 340). En esta misma propuesta va PRIMERO la orden 342 (el cerebro de IA): toda llamada a la IA de esta orden pasa
por `src/ai/cerebro.ts`.** Antes de decir "terminé", leé `docs/ANTES-DE-ENTREGAR.md`.

## Por qué (pedido del dueño, 23/11/2026)
El dueño hoy no imprime las plantillas de la app: arma **a mano con IA** la carta de tragos, el menú, el cronograma, el
afiche del agasajado y el marco de la fotocabina y del espejo mágico. Mostró cinco ejemplos: fondo con la temática y el
color de la fiesta (rosas y brillos lilas para Zaira; rosas azules y mariposas para Melany; cielo nocturno con luna para
Alejandro), el nombre en letra dorada o en relieve, "Mis 15 Años", la foto de la quinceañera integrada, el logo de AK en
el círculo rojo y, en la carta, una foto de cada trago con su nombre. Quiere que **la app lo haga sola** con los datos que
ya tiene. Las imágenes de muestra tienen personas reales: **no se suben al repositorio** (es público); el estilo se
describe en texto.

## Lo que ya existe (no lo rehagas)
- Generador de imágenes con Gemini: `src/lib/ai/gemini-image.ts` (modelo `gemini-3.1-flash-image`, ~3) con foto de
  referencia segura (`src/lib/ai/foto-de-referencia.ts` ~35, `fotoDeReferenciaSegura`). Ya lo usan el espejo mágico
  (`src/app/actions/espejo-magico-ai.ts`) y la decoración.
- El tope de gasto de IA: `src/lib/ai/consumo-servidor.ts` (`hayPresupuestoParaIA` ~309, `reservarConsumoIA` ~133,
  `registrarConsumoIA` ~106, `anotarFalloIA` ~325). **Toda generación pasa por ahí.**
- Las plantillas de hoy: `src/components/fiestas/panels/carta-tragos.tsx`, `menu-mesa.tsx`, `carteleria.tsx` y el
  itinerario. **Quedan** como respaldo: no se borran ni se cambian.

## Bloque 1 — "Diseñar con IA" en cada impreso
En carta de tragos, menú de mesa, cronograma (itinerario), afiche del agasajado y marco de fotocabina / espejo mágico, un
botón **"Diseñar con IA"** que arma la pieza con:
- **Datos de la fiesta** (nunca inventados): nombre del agasajado y tipo de fiesta, la temática y los colores que la fiesta
  ya tenga cargados (buscá en `src/types/fiesta.ts` los campos de decoración/temática/colores y usá el primero que tenga
  dato), la foto del agasajado si la hay (por `fotoDeReferenciaSegura`), el logo de AK, y el WhatsApp de Ajustes.
- **Contenido de cada pieza:** carta → los tragos de `fiesta.cartaTragos.items` (nombre de cada uno); menú → los platos
  del menú asignado; cronograma → los momentos del itinerario con su hora; afiche → nombre y "Mis 15 Años" / "Nuestra
  boda"; marco → nombre, frase y las **ventanas de foto** en la posición que usa hoy la fotocabina
  (`src/app/evento/fotocabina/[fiestaId]/page.tsx`: buscá las medidas de la tira y de cada foto).
- **Estilo:** las instrucciones a la IA describen el estilo de las muestras (fondo temático con flores y brillos, nombre en
  letra dorada o en relieve, logo en círculo rojo abajo, composición vertical para imprimir).

## Bloque 2 — La IA no se puede equivocar en un nombre ni en una hora
La IA a veces escribe mal. Antes de mostrar la pieza:
1. Se le pide a Gemini (texto, el modelo más barato de la lista de la orden 340) que **lea la imagen** y devuelva el texto
   que ve.
2. Se compara con lo esperado: cada trago, cada plato, cada hora y momento, el nombre. Sin acentos ni mayúsculas en la
   comparación, pero **todas** las palabras tienen que estar.
3. Si falta o está mal escrito algo: se vuelve a generar, **hasta 3 veces**. Si las tres fallan: se usa la plantilla de
   siempre con el fondo de la mejor de las tres, y se dice "La IA no escribió bien estos textos: …; usamos la plantilla".
4. El marco de fotocabina se genera con las ventanas pintadas de **verde puro (#00FF00)**; la app las vuelve
   transparentes y comprueba que cada ventana quedó transparente donde la fotocabina va a poner la foto. Si no, se
   regenera.

## Bloque 3 — Que se vea antes de imprimir y quede guardado
- Vista previa con "Usar esta", "Otra versión" y "Volver a la plantilla".
- Lo elegido se guarda en Storage y en la fiesta (un campo por pieza, por ejemplo `papeleriaIA.cartaTragos.url`), y es lo
  que imprimen el botón de imprimir / descargar de cada panel y la fotocabina (el marco).
- Pedir al modelo la resolución más alta que acepte y comprobar el tamaño que devolvió; si queda por debajo de lo que
  pide la impresión, avisarlo en la vista previa.

## Bloque 4 — La hoja A4 lista para imprimir, como la arma hoy el dueño
El dueño mandó cuatro PDF de cómo imprime (23/11/2026). La app arma la hoja sola:
1. **Carta de tragos y menú:** el dueño las arma en Canva así: **vertical, tamaño A6 (10,5 × 14,8 cm), dos copias
   una al lado de la otra en la mitad de arriba de una hoja A4**, cada una con borde negro fino para cortar. Hoy la carta
   imprime una sola, apaisada de 15 × 10 cm (`carta-tragos.tsx` ~449 y `@page` ~464): **se suma** la opción "2 por hoja
   A4 (A6 vertical)" y queda como la que viene elegida; la de 15 × 10 sigue disponible. Lo mismo en `menu-mesa.tsx`
   (hoy A4 apaisado, `@page` ~242). El menú lleva secciones con foto de cada plato: Entradas, Plato principal, Menú
   niños y adolescentes, Postres y Bebidas (sólo las que la fiesta tiene), el logo de AK y el WhatsApp de Ajustes.
2. **Números de mesa en torrecita: el armado YA EXISTE y está bien, no lo rehagas.** `numeros-mesa.tsx` ~188-220 ("Torres
   de Mesa A4", 2 por hoja): cada columna de 105 mm es una torre triangular, con la solapa de pegar de 30 mm, una cara en
   blanco de 87 mm y dos caras de 90 mm con "Mesa N", una girada 180° (~130). Es igual a como la imprime el dueño: se
   dobla, se pega con cascola y queda parada. Lo único que se suma: **"Diseñar con IA" pone el fondo** en las dos caras con
   número (flores, temática), diseñado **una sola vez** y repetido en todas las mesas (no una imagen por mesa: se paga cada
   una). El número, el nombre del agasajado y la fecha (`dd/mm/aa`) los sigue escribiendo la app encima, así nunca salen
   mal. La solapa y la cara en blanco quedan sin dibujo.
3. **No sólo quinces y bodas:** si la fiesta es de empresa (ejemplo del dueño: "Correo Uruguayo, Día del Funcionario
   Postal"), la temática sale del cliente y del motivo del evento (sus colores, sus símbolos), no de flores y coronas.
4. El botón "Imprimir" baja **un PDF con todas las hojas** (todas las mesas, las dos copias de cada pieza).

## Lo que NO hay que hacer
- No borrar ni cambiar las plantillas de hoy: son el respaldo.
- No generar solo al abrir la pantalla: sólo cuando alguien toca "Diseñar con IA" (cada imagen se paga).
- No poner precios en las piezas. No inventar tragos, platos ni horarios que la fiesta no tiene.
- No subir fotos de personas reales al repositorio.

## Qué tiene que comprobar la prueba
- Con una respuesta falsa de la IA que "escribe" mal un trago, la pieza se regenera, y a la tercera vuelve a la plantilla
  con el aviso (no se muestra la imagen con el error).
- Con el tope de IA agotado, el botón dice "Se llegó al tope de IA del mes" y no llama al modelo.
- El marco: las ventanas verdes quedan transparentes en la posición exacta de la fotocabina.

```comprobar
archivo: src/lib/papeleria/disenar-con-ia.ts
usa: hayPresupuestoParaIA en src/lib/papeleria/disenar-con-ia.ts
usa: fotoDeReferenciaSegura en src/lib/papeleria/disenar-con-ia.ts
usa: Diseñar con IA en src/components/fiestas/panels/carta-tragos.tsx
usa: Diseñar con IA en src/components/fiestas/panels/menu-mesa.tsx
usa: Diseñar con IA en src/components/fiestas/panels/carteleria.tsx
usa: papeleriaIA en src/types/fiesta.ts
usa: papeleriaIA en src/app/evento/fotocabina/[fiestaId]/page.tsx
prueba: src/__tests__/la-papeleria-con-ia-no-escribe-mal.test.ts
prueba: src/__tests__/el-marco-con-ia-deja-las-ventanas-transparentes.test.ts
usa: Diseñar con IA en src/components/fiestas/panels/numeros-mesa.tsx
prueba: src/__tests__/la-hoja-a4-de-mesas-sale-completa.test.ts
```
