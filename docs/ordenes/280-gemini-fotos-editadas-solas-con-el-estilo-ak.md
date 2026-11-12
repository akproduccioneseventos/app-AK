# Orden 280 — Las fotos se eligen, se enderezan y se editan solas con el estilo de AK (11/11/2026)

**Para Gemini, en la computadora del dueño.** Arrancá de `claude/app-debug-stabilize-m70e6z` actualizada (`git pull`),
**después de entregar la 279**, rama nueva `gemini/orden-280-fotos-estilo-ak`. **Una sola entrega con todos los bloques,
sin fusionar.** Si uno se traba, entregá el resto y avisá cuál faltó. Repasá `docs/ANTES-DE-ENTREGAR.md`.

## Qué quiere el dueño, con sus palabras

Hoy paga **Aftershoot** (unos 45 a 55 dólares por mes) y termina en **Lightroom Classic**. Su proceso:

1. **Elegir**: sacar repetidas, ojos cerrados y borrosas.
2. **Enderezar y recortar.**
3. **Color, blancos y luz** con su estilo.
4. **Retoque de piel y pelo.**
5. En Lightroom: **logo y exportar a JPG** (eso queda como está).

Trabaja sobre los crudos de su cámara Nikon (**.NEF**). Quiere *"sacarme yo de la ecuación"*, **gratis**, y que el
programa **aprenda su estilo cargándole muchas fotos ya editadas y arme el ajuste guardado (preset)**. Además, que ese
mismo estilo se aplique **solo a las fotos que se sacan los invitados** en la fotocabina, el Vogue, el espejo mágico y
el Touchpix (**la Plataforma 360 no**: es video).

**Condiciones que no se discuten:** costo cero (sólo bibliotecas libres, nada pago por mes ni por foto); **los originales
no se tocan ni se borran nunca**; todo lo que el programa decide queda **editable en Lightroom** (ajustes, no píxeles
quemados); no se toca lo que ya anda del AK Editor (órdenes 271 a 275 y 279).

## Bloque 1 — AK Editor, modo "Fotos": elegir solo (lo que reemplaza a Aftershoot Select)

Modo nuevo en `herramientas/ak-editor/` (`fotos.py`), con su pantalla en el menú del programa. Se elige la carpeta de
NEF (y JPG, si hay). Por cada foto, de a una y sin cargar el crudo entero:

- Lee la **vista previa que trae adentro el NEF** (`rawpy.imread(...).extract_thumb()`), que es rápida. Sumá `rawpy` e
  `imagehash` a `requirements.txt`, con versiones que tengan instalador para Python 3.11 en Windows.
- **Borrosa**: varianza del Laplaciano **sobre las caras** (si hay) y sobre la foto entera; umbral en `config.yaml`.
- **Ojos cerrados**: MediaPipe Face Mesh (ya está en el programa) y la apertura de cada ojo; si alguien de la foto tiene
  los ojos cerrados, se marca. Con mucha gente, avisa cuántos.
- **Repetidas**: misma escena por parecido de imagen (`imagehash`, dHash) **y** sacadas con menos de 3 s de diferencia
  (fecha de la cámara). De cada grupo queda la mejor (más nítida, ojos abiertos, mejor luz) y las demás se rechazan.
- **Muy oscura o quemada**: por el histograma.

**Cómo llega a Lightroom:** un archivo `.xmp` al lado de cada NEF (así trabaja Lightroom Classic con los crudos), con
`xmp:Rating` (5 la elegida de cada grupo, 0 el resto), `xmp:Label` "Rechazada" para las malas y palabras clave
(`dc:subject`) "con personas" / "sin personas". **Si ya existe un `.xmp` del dueño, no se pisa lo que tenga**: se suman
sólo los campos de arriba. Pantalla del programa: cuántas eligió, cuántas rechazó y por qué, con las miniaturas para
devolver cualquiera con un toque. **No borra nada**: el dueño borra las rechazadas en Lightroom.

Avisá en pantalla: *"Si las fotos ya estaban importadas en Lightroom, elegí todas → Metadatos → Leer metadatos de los
archivos"*. Lo ideal es correrlo **antes** de importar.

## Bloque 2 — Enderezar y recortar solo

En el mismo `.xmp` de cada foto elegida:

- **Enderezar**: líneas largas casi horizontales o verticales (salón, mesas, puertas) con Hough de OpenCV; el ángulo
  va en `crs:CropAngle`, sólo si está entre 0,3° y 5°. Si no hay líneas claras, no se toca.
- **Recortar**: `crs:HasCrop`, `crs:CropLeft/Top/Right/Bottom` en 3:2 (o la proporción de la foto), **sin cortar ninguna
  cara** y dejando aire arriba de la cabeza. Si no hay caras, sólo lo que pide el enderezado.

## Bloque 3 — "Aprender mi estilo": el programa arma el preset

Dos entradas, y las dos sirven:

1. **El catálogo de Lightroom del dueño** (`.lrcat`, que es una base SQLite). Se abre **en copia y de sólo lectura**
   (nunca el original: Lightroom puede estar abierto). Tabla `Adobe_imageDevelopSettings`, columna `text`: ahí están los
   ajustes de cada foto editada (`Temperature`, `Tint`, `Exposure2012`, `Contrast2012`, `Highlights2012`,
   `Shadows2012`, `Whites2012`, `Blacks2012`, `Texture`, `Clarity2012`, `Vibrance`, `Saturation`, las de HSL y la
   curva). Se agrupan por **tipo de escena** con los datos de la cámara (ISO alto o flash = salón de noche; ISO bajo
   sin flash = exterior de día; y torta/velas si hay muy poca luz) y se toma la **mediana** de cada ajuste.
2. **Muchas fotos ya terminadas** (JPG exportados). De ahí se saca el **color y la luz finales** que le gustan:
   estadística de color por zona de luz (sombras, medios, altas) en espacio Lab.

Con eso el programa genera, en la carpeta de ajustes de Lightroom (`%APPDATA%\Adobe\CameraRaw\Settings\AK\`):

- **Un preset por tipo de escena** (`AK Salón noche.xmp`, `AK Exterior día.xmp`, `AK Torta y velas.xmp`) con la mediana de
  sus ajustes. Pantalla "antes/después" con 6 fotos de prueba; **el dueño los acepta**, el programa no los instala solo.
- **Por foto**, en el `.xmp` del bloque 1: el preset de su escena **más** una corrección de luz y temperatura para que
  todas las de la fiesta queden parejas (llevar la luz media y la temperatura de esa foto a la de su escena). Así entra a
  Lightroom ya editada y él sólo revisa.
- **Un archivo `estilo-ak.json`** con el color del bloque 4 (lo que va a la app).

"Aprende de lo que corrijo": si el dueño vuelve a correr "Aprender mi estilo" después de una fiesta, suma sus
correcciones nuevas al cálculo. Se guarda en el almacén SQLite que ya existe.

## Bloque 4 — El retoque de piel y pelo

Lo hace **Lightroom Classic**, que ya lo trae (máscara de Personas: piel, pelo, ojos, dientes, foto por foto):

- El programa marca con la palabra clave "con personas" (bloque 1) las fotos que lo necesitan.
- En la pantalla del modo Fotos, una guía de tres pasos en criollo: en Lightroom, filtrar por "con personas", elegir
  todas, aplicar el preset de retoque del dueño (con máscara de Personas). **No se automatiza más que eso**, porque las
  máscaras de Personas sólo las calcula Lightroom.
- **Prueba a investigar, sin prometer:** si un preset con máscara de Personas aplicado por `.xmp` desde afuera se
  recalcula solo al abrir la foto en Lightroom. Escribí en `herramientas/ak-editor/MEDICION.md` lo que pasó, con la
  versión de Lightroom. Si funciona, que el bloque 3 lo agregue en el `.xmp`.

## Bloque 5 — En la app: las fotos de los invitados salen con el estilo de AK

**Hoy** hay un filtro de belleza básico (`aplicarFiltroBelleza`, `src/lib/entretenimiento/filtro-belleza.ts`): adivina la
piel por el color de cada píxel y suaviza todo lo que se parece. Lo usan la fotocabina (~457 y ~693 de
`src/app/evento/fotocabina/[fiestaId]/page.tsx`), el Vogue (`src/app/evento/bogue/[fiestaId]/page.tsx` ~506) y el
Touchpix, con el interruptor `enableBeautyFilter` de la estación
(`src/app/(app)/fiestas/nueva/entretenimiento/page.tsx` ~1751).

**Qué se hace:**

- `src/lib/entretenimiento/estilo-ak.ts`, función `aplicarEstiloAK(ctx, ancho, alto, estilo, caras?)`:
  1. **Color y luz**: corrección automática de exposición y blanco, y después el color del `estilo-ak.json`
     (transferencia de color por zona de luz, como en el bloque 3), con intensidad del 0 al 1.
  2. **Piel**: suavizado **sólo dentro de la piel de las caras** que da el detector que ya existe
     (`detectarCarasEnFuente`, `src/lib/entretenimiento/filtros-cara.ts` ~149, con los puntos del contorno), sin ojos,
     cejas ni boca, con borde difuminado. Si no hay caras, sólo el color.
  Todo en el navegador de la estación, **sin servidores ni costo**.
- El `estilo-ak.json` se sube **una vez** en Ajustes → "Estilo de fotos AK" (pantalla nueva en
  `src/app/(app)/settings/estilo-fotos/page.tsx`, con `requirePermiso(PERMISOS.ADMINISTRACION)` en la acción que guarda).
  Se guarda con `mutarDocumento('estilo-fotos-ak.json', …)` (`src/lib/generic-json-store.ts`). Sólo números de color: ni
  fotos ni datos de nadie. Muestra 3 fotos de ejemplo antes/después.
- Las estaciones lo leen con una acción pública **de sólo lectura** que devuelve sólo esos números
  (`obtenerEstiloFotosAK()` en `src/app/actions/estilo-fotos.ts`).
- **Interruptor por estación** "Estilo AK" junto a `enableBeautyFilter`, **prendido por defecto** cuando hay estilo
  cargado. Se aplica en la **foto que se guarda** (no hace falta en la vista previa en vivo si la tablet no da: medilo).
- Estaciones: fotocabina, Vogue, Touchpix y espejo mágico (`src/app/evento/espejo-magico/[fiestaId]/page.tsx` ~840, antes
  del `toDataURL`). **No** la Plataforma 360.
- Fotos que suben los invitados desde su celular al muro (`src/app/evento/social/[fiestaId]/page.tsx` ~1150, `selectUpload`):
  sólo **color y luz**, sin piel, y sólo a imágenes (los videos quedan como están).
- `enableBeautyFilter` sigue andando igual: **no lo saques**. Si están los dos prendidos, va primero el Estilo AK y la piel
  la hace el suyo, no los dos.

## Pruebas

- `herramientas/ak-editor/pruebas/test_fotos_elige.py`: con fotos armadas por la prueba (una nítida, la misma borrosa, dos
  casi iguales con 1 s de diferencia, una negra) marca rechazadas la borrosa, la repetida peor y la negra; **los
  originales tienen la misma huella** después; y un `.xmp` previo del dueño conserva sus campos.
- `herramientas/ak-editor/pruebas/test_fotos_endereza_sin_cortar_caras.py`: una foto con una línea inclinada 2° da
  `CropAngle` ≈ 2 (± 0,3) y el recorte deja la cara entera adentro.
- `herramientas/ak-editor/pruebas/test_aprende_el_estilo.py`: con un `.lrcat` de mentira (SQLite armado por la prueba) con
  diez fotos de salón con `Exposure2012` 0,5 y `Temperature` 3800, el preset "AK Salón noche" sale con esos valores; con el
  catálogo vacío no se inventa ningún preset.
- `src/__tests__/el-estilo-ak-cambia-la-foto.test.ts`: con un estilo que lleva los medios a tono cálido, una imagen gris
  sale más cálida; con intensidad 0 sale igual; la piel sólo se toca dentro del contorno de la cara (un píxel de "piel"
  fuera de la cara no cambia).
- `src/__tests__/el-estilo-ak-lo-guarda-solo-el-duenio.test.ts`: el personal no puede guardar el estilo; la acción pública
  devuelve sólo números (sin campos extra).
- **(Sacada el 12/11/2026: el estilo vive en la base y el entorno de pruebas de navegador no tiene base, así que la foto salía igual con o sin estilo. Va con el emulador, como la orden 269; la función la cubre `el-estilo-ak-cambia-la-foto`.)** `tests/e2e/la-fotocabina-saca-con-el-estilo-ak.spec.ts`: con el interruptor prendido y un estilo cargado, la foto que se
  manda a subir (cortá la subida con `page.route`) es distinta de la misma foto sin el interruptor.

```comprobar
archivo: herramientas/ak-editor/fotos.py
usa: extract_thumb en herramientas/ak-editor/fotos.py
usa: CropAngle en herramientas/ak-editor/fotos.py
usa: Adobe_imageDevelopSettings en herramientas/ak-editor/fotos.py
usa: rawpy en herramientas/ak-editor/requirements.txt
archivo: src/lib/entretenimiento/estilo-ak.ts
usa: aplicarEstiloAK en src/app/evento/fotocabina/[fiestaId]/page.tsx
usa: aplicarEstiloAK en src/app/evento/bogue/[fiestaId]/page.tsx
usa: aplicarEstiloAK en src/app/evento/touchpix/[fiestaId]/page.tsx
usa: aplicarEstiloAK en src/app/evento/espejo-magico/[fiestaId]/page.tsx
usa: aplicarEstiloAK en src/app/evento/social/[fiestaId]/page.tsx
no-usa: aplicarEstiloAK en src/app/evento/plataforma-360/[fiestaId]/page.tsx
archivo: src/app/(app)/settings/estilo-fotos/page.tsx
usa: requirePermiso en src/app/actions/estilo-fotos.ts
prueba: herramientas/ak-editor/pruebas/test_fotos_elige.py
prueba: herramientas/ak-editor/pruebas/test_fotos_endereza_sin_cortar_caras.py
prueba: herramientas/ak-editor/pruebas/test_aprende_el_estilo.py
prueba: src/__tests__/el-estilo-ak-cambia-la-foto.test.ts
prueba: src/__tests__/el-estilo-ak-lo-guarda-solo-el-duenio.test.ts
```
