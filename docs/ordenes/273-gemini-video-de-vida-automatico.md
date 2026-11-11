# Orden 273 — El Video de Vida, armado solo y mejor que la plantilla de Filmora (10/11/2026)

**Para Gemini, en la computadora del dueño.** Sobre `claude/app-debug-stabilize-m70e6z` actualizada (`git pull`), rama
nueva `gemini/orden-273-video-de-vida`. **Una sola entrega, sin fusionar.** Repasá `docs/ANTES-DE-ENTREGAR.md`.

**Qué es:** el Video de Vida son las fotos de la quinceañera desde que es bebé hasta hoy, con música. Hoy el dueño usa
la función de Filmora que acepta hasta 50 fotos y tiene dos plantillas: sale tan básico que lo rehace entero a mano.
Esto suma un modo **"Video de Vida"** al AK Editor (`herramientas/ak-editor/`), con la misma tecnología, costo cero y
todo en su computadora.

**Lo que ya existe y no se toca:** en la app, la pantalla del Video de Vida (`src/app/(app)/fiestas/nueva/video-vida/page.tsx`)
junta las fotos que sube la familia y las baja en un `.zip`. Ese `.zip` es la entrada de este modo. Tampoco se toca nada
de lo del AK Editor que ya anda (órdenes 271 y 272).

## Bloque 1 — Cargar y ordenar las fotos

- Entrada: el `.zip` que baja la app, o una carpeta. **Sin tope de 50 fotos** (probalo con 300).
- **Orden de la vida, solo:** por la fecha de la foto (EXIF), después por la fecha del nombre del archivo y después por
  la de creación. Las que no tienen fecha quedan en "sin fecha" para que el dueño las ubique arrastrando. Si sabe el año
  de nacimiento (el año de la fiesta menos 15, editable), cada foto muestra **qué edad tenía** ("3 años").
- **Capítulos solos** por edad, con nombre editable: Bebé · Primeros pasos · Infancia · Escuela · Hoy.
- Las fotos **repetidas o casi iguales** se marcan, y queda una sola salvo que el dueño diga otra cosa.

## Bloque 2 — Que cada foto se vea lo mejor posible

- Gira solas las fotos que vienen de costado (EXIF).
- **Las fotos verticales no quedan con barras negras:** de fondo va la misma foto agrandada y desenfocada.
- Mejora suave de las fotos viejas: brillo, contraste y color automáticos con OpenCV, **sin exagerar**. La original no
  se toca nunca.
- Las fotos muy chicas o muy borrosas se marcan "baja calidad", para que el dueño decida si van.

## Bloque 3 — Movimiento, música y transiciones (lo que hoy falta)

- **Movimiento suave en cada foto** (acercar o alejar despacio, o desplazarse), **hacia la cara** que encuentra el
  detector de caras de OpenCV, alternando el sentido. **Nunca corta una cara** al encuadrar.
- **Al ritmo de la música:** detecta los golpes del tema (`scipy`, por energía del audio) y hace caer los cambios de
  foto en un golpe. Cada foto dura de 2,5 a 5 s; en las partes lentas del tema, más; en las movidas, menos.
- **Transiciones variadas** (fundido, deslizar, círculo, barrido, zoom, disolver…), **nunca dos iguales seguidas**, y
  una más especial al cambiar de capítulo.
- **Textos:** el título del capítulo al empezar cada uno, la edad o el año en una esquina (se puede apagar) y una
  dedicatoria final editable. Con la tipografía y los colores que el dueño guarde en "Marca AK".
- **Que la música no termine cortada:** el video se ajusta para terminar con el tema, con un fundido final.
- Opcionales con interruptor: textura de película vieja en las fotos de bebé, destellos de luz suaves y marco.

## Bloque 4 — Vista previa y salida

- **Vista previa liviana** (480p) en la pantalla del programa, para ver el resultado entero antes de armar el final.
  Desde ahí se cambia el orden, se saca una foto o se cambia un texto, y se vuelve a ver.
- **Video terminado en MP4** a 1920×1080 con FFmpeg (movimiento con `zoompan`, transiciones con `xfade`, textos con
  `drawtext`), por partes y con `libx264`: **la computadora no tiene NVIDIA**. Antes de empezar dice cuánto va a tardar.
- **También el XML para Filmora 16**, con las fotos en orden, la duración de cada una y la música, para retocar. Avisá
  en pantalla que el movimiento y las transiciones pueden no llegar a Filmora: para eso está el MP4.

## Pruebas (`herramientas/ak-editor/pruebas/`, con fotos y un audio armados por la prueba)

- `test_vida_ordena_por_fecha.py`: diez fotos con fechas EXIF mezcladas salen en orden, y una sin fecha queda en
  "sin fecha".
- `test_vida_cambia_en_el_golpe.py`: con un audio con golpes cada 0,5 s, cada cambio de foto cae a menos de 0,05 s de
  un golpe.
- `test_vida_no_corta_caras.py`: con una foto con una cara en una esquina, el encuadre de cada cuadro del movimiento
  contiene la cara entera.
- `test_vida_vertical_sin_barras.py`: una foto vertical da cuadros sin franjas negras a los costados.
- `test_vida_sin_tope_de_fotos.py`: 300 fotos se ordenan y arman la línea de tiempo sin error.
- `test_vida_no_toca_las_originales.py`: después de todo, las fotos originales tienen la misma huella.

Las pruebas tienen que ponerse en rojo con la función apagada. **El programa no puede tener caminos distintos para
cuando lo prueban** (se sacó uno en la orden 272).

```comprobar
archivo: herramientas/ak-editor/video_de_vida.py
usa: zoompan en herramientas/ak-editor/video_de_vida.py
usa: xfade en herramientas/ak-editor/video_de_vida.py
usa: video_de_vida en herramientas/ak-editor/app.py
prueba: herramientas/ak-editor/pruebas/test_vida_ordena_por_fecha.py
prueba: herramientas/ak-editor/pruebas/test_vida_cambia_en_el_golpe.py
prueba: herramientas/ak-editor/pruebas/test_vida_no_corta_caras.py
prueba: herramientas/ak-editor/pruebas/test_vida_vertical_sin_barras.py
prueba: herramientas/ak-editor/pruebas/test_vida_sin_tope_de_fotos.py
prueba: herramientas/ak-editor/pruebas/test_vida_no_toca_las_originales.py
```
