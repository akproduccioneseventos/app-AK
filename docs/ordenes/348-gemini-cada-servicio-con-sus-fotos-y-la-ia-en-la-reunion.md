# Orden 348 — Cada servicio con sus fotos, la IA que las ordena sola, y la IA en la reunión

**Para Gemini. Va en la MISMA propuesta que la 346 y la 347 (rama `gemini/orden-346`), al final.** Si un bloque se
traba, entregá el resto y avisá cuál faltó. Antes de decir "terminé", leé `docs/ANTES-DE-ENTREGAR.md`. Usá las
habilidades `vende`, `celular-primero` y `animaciones-pro`.

## Por qué (pedido del dueño, 25/11/2026)
Palabras suyas: *"quería tener la posibilidad de apretar un botón y decirle a la IA, adelante del cliente, agregame tal
servicio, o yo apretar un botón y hacerlo, y que se vaya haciendo el presupuesto; y que cada servicio tenga su propio
catálogo de fotos: si hablo de la fuente de chocolate, entre los postres hay una foto que dice fuente de chocolate, entro
y veo fotos de eso. La IA lo tiene que ir ordenando cuando va sacando las fotos. Lo mismo en las páginas de bodas y 15:
la gente quiere ver fotos de ejemplo"*.

## Lo que YA existe (no lo rehagas)
- **Galería de la empresa:** tipo `GaleriaFoto` en `src/types/galeria.ts` (~1-18) **ya tiene** `tipoFiesta`, `servicio`
  y `subCategoria`. Listas: `TIPOS_FIESTA_GALERIA` (~73), `SERVICIOS_GALERIA` (~81), `SUBCATEGORIAS_POR_SERVICIO` (~94).
  Acciones en `src/app/actions/galeria.ts`: `addGaleriaFoto` (~17), `updateGaleriaFoto` (~174),
  `getGaleriaFotosByTipoFiesta` (~152) y **`getGaleriaFotosByServicio` (~163), que hoy no usa nadie**. Pantalla:
  `src/app/(app)/empresa/galeria/page.tsx`. Las fotos de Instagram entran por `src/app/actions/social-media.ts`.
- **Servicio del catálogo:** `ServicioEmpresa` en `src/types/presupuesto.ts` tiene **una sola** foto (`imageUrl`, ~120).
- **Presentación LED:** `src/app/presentacion-led/page.tsx`. Se eligen servicios en pantalla (`toggleSelect`, ~998), el
  total se va sumando, hay una galería por categoría (`GaleriaLightboxModal`, ~1205; filtro `galleryCategoria` ~562) y
  al final pasa al presupuesto manual (`/presupuestos/nuevo/crear`, ~716-731). Las fotos por tipo de fiesta salen de
  `src/app/actions/fotos-presentacion.ts`.
- **El cerebro de la IA:** `src/ai/cerebro.ts`. Para mirar una foto, `leerImagen` (~548); para texto, `pedirTexto`
  (~298). **Toda llamada a la IA pasa por ahí** (lo frena `toda-la-ia-pasa-por-el-cerebro.test.ts`).

## Bloque 1 — Cada servicio con su álbum de fotos
1. La foto de la galería se engancha al servicio **por su id del catálogo**: campo nuevo `servicioId?: string` en
   `GaleriaFoto`. El `servicio` de texto queda como está, para no romper lo viejo.
2. Acción nueva `getFotosDelServicio(servicioId)` en `src/app/actions/galeria.ts`: fotos con ese `servicioId`; si no hay,
   las que tienen `servicio` igual al nombre del servicio (sin distinguir mayúsculas ni tildes). Que sea pública de
   lectura, igual que `getGaleriaFotosByServicio`.
3. **En la presentación LED**, cada tarjeta de servicio (`src/app/presentacion-led/slides/categoria-servicios-slide.tsx`)
   que tenga fotos muestra un botón chico **"Ver fotos (N)"** que abre `GaleriaLightboxModal` con las fotos de **ese**
   servicio. Ejemplo: "Fuente de chocolate", dentro de Postres → sus fotos. Sin fotos, el botón no aparece.
4. **En el simulador** (`src/app/simulador-de-presupuesto/page.tsx`), el mismo botón en cada servicio, con el mismo
   modal. No cambies nada más del simulador (la orden 343 ya lo tocó).
5. En **Empresa → Galería**, cada foto tiene un desplegable "Servicio" con los servicios del catálogo y otro "Tipo de
   fiesta" (`TIPOS_FIESTA_GALERIA`). Arreglarlo a mano sigue siendo posible siempre.

## Bloque 2 — La IA ordena las fotos sola
1. Función nueva `src/lib/galeria/clasificar-foto.ts` → `clasificarFotoDeGaleria(foto)`: le pasa la imagen a
   `leerImagen` del cerebro (`quien: 'galeria'`) con la lista de servicios del catálogo (id y nombre) y
   `TIPOS_FIESTA_GALERIA`, y pide JSON `{ servicioId, tipoFiesta, titulo, confianza }`. **Sólo acepta un `servicioId` que
   exista en el catálogo** y un `tipoFiesta` de la lista; si no, deja el campo vacío. Si la confianza es menor a 0,6, no
   asigna nada.
2. Se llama **sola** al subir una foto (`addGaleriaFoto`) y al entrar fotos de Instagram (`social-media.ts`), **después
   de guardar la foto** (la foto se guarda aunque la IA falle o tarde). Lo que la IA decide se marca
   `clasificadaPor: 'ia'`; si después una persona lo cambia, queda `clasificadaPor: 'persona'` y **la IA nunca pisa lo
   que puso una persona**.
3. Para las fotos que ya existen, una tarea del despertador (`src/lib/automatico/`) que clasifica **de a 20 por corrida**
   las que no tienen `servicioId` ni `tipoFiesta`, respetando el tope diario de IA del cerebro. Nada que se pague por mes.
4. En Empresa → Galería, un filtro "Sin clasificar" y la marca "La IA la puso en: Fuente de chocolate · 15 años" con un
   botón para corregir.

## Bloque 3 — La IA en la reunión, adelante del cliente
En la presentación LED, un botón **"Pedile a la IA"** (micrófono y casilla de texto):
1. El dueño dice o escribe *"agregá la fuente de chocolate"*, *"sacá la fotocabina"*, *"poné 150 invitados"*. La voz se
   pasa a texto **con el reconocimiento del navegador** (`webkitSpeechRecognition`; si no hay, queda sólo la casilla), sin
   servicios pagos.
2. `pedirTexto` del cerebro (`quien: 'presentacion'`) recibe la frase y **la lista de servicios del catálogo con su id**,
   y devuelve JSON `{ accion: 'agregar' | 'sacar' | 'invitados', servicioId?, cantidad? }`. **Sólo se aplica un
   `servicioId` que exista**; si la IA no está segura, muestra las dos o tres opciones más parecidas para tocar una.
3. La acción **es la misma que tocar la tarjeta a mano** (`toggleSelect` y el cambio de invitados que ya existen): el total
   en pantalla se actualiza en el momento y aparece un cartelito "Agregado: Fuente de chocolate · Deshacer".
4. **Nunca guarda el presupuesto, no lo cierra ni lo da por aceptado.** Sólo cambia lo elegido en pantalla; el paso al
   presupuesto manual sigue siendo el botón de siempre. No dice precios inventados: el número sale del catálogo.
5. El botón tocado a mano sigue andando igual, con IA o sin IA (sin conexión, la IA no aparece y no rompe nada).

## Bloque 4 — Las páginas por tipo de fiesta muestran fotos de ese tipo
La galería de cada página de la orden 347 sale de `getGaleriaFotosByTipoFiesta` con su tipo (`Bodas`, `15 Años`,
`Cumpleaños`, `Empresariales`, `Infantiles`), destacadas primero. **Sin fotos de ese tipo, se usan las ilustrativas
marcadas "Imagen ilustrativa"**, nunca fotos de otro tipo de fiesta.

## Lo que NO hay que hacer
- No llamar a la IA fuera de `src/ai/cerebro.ts`.
- No contratar nada que se pague por mes (voz, visión, almacenamiento).
- La IA en la reunión no guarda, no cierra y no cobra. No toca permisos.
- No borres el `servicio` de texto ni la foto única `imageUrl` del servicio: siguen siendo el respaldo.

## Qué tiene que comprobar la prueba
- `src/__tests__/la-ia-ordena-las-fotos.test.ts` (con el cerebro de mentira): una foto que la IA describe como fuente de
  chocolate queda con el `servicioId` real; un `servicioId` inventado por la IA **no** se guarda; con confianza 0,4 no se
  asigna nada; una foto corregida por una persona **no** la cambia la IA en la siguiente pasada; si la IA falla, la foto
  igual quedó guardada.
- `src/__tests__/la-ia-en-la-reunion-no-cierra-nada.test.ts`: "agregá la fuente de chocolate" devuelve `agregar` con el id
  real; un servicio que no existe no se aplica y devuelve opciones; ninguna acción llama a guardar el presupuesto.
- `tests/e2e/cada-servicio-con-sus-fotos.spec.ts`: en la presentación LED, el servicio con fotos muestra "Ver fotos" y abre
  **sólo** sus fotos; escribir "agregá <servicio>" en "Pedile a la IA" (con la respuesta de la IA cortada y simulada en
  la prueba) lo marca elegido y **el total cambia**; "Deshacer" lo vuelve atrás.

```comprobar
archivo: src/lib/galeria/clasificar-foto.ts
usa: servicioId en src/types/galeria.ts
usa: getFotosDelServicio en src/app/presentacion-led/slides/categoria-servicios-slide.tsx
usa: getFotosDelServicio en src/app/simulador-de-presupuesto/page.tsx
usa: clasificarFotoDeGaleria en src/app/actions/galeria.ts
usa: clasificarFotoDeGaleria en src/app/actions/social-media.ts
usa: leerImagen en src/lib/galeria/clasificar-foto.ts
usa: Pedile a la IA en src/app/presentacion-led/page.tsx
usa: getGaleriaFotosByTipoFiesta en src/components/landing/EventLandingPage.tsx
prueba: src/__tests__/la-ia-ordena-las-fotos.test.ts
prueba: src/__tests__/la-ia-en-la-reunion-no-cierra-nada.test.ts
prueba: tests/e2e/cada-servicio-con-sus-fotos.spec.ts
```
