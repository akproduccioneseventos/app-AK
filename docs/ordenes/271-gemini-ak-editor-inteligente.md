# Orden 271 — AK Editor Inteligente: la edición de las fiestas de XV, preparada sola (10/11/2026)

**Para Gemini, trabajando en la computadora del dueño** (Windows 10 Pro, Intel Core i7 de 4.ª generación, 8 GB de
memoria, gráficos Intel + Radeon HD 8750M, **sin placa NVIDIA**). Arrancá de `claude/app-debug-stabilize-m70e6z`
(`git pull`), rama nueva `gemini/orden-271-ak-editor`. **UNA sola entrega con todos los bloques, sin fusionar.** Si un
bloque se traba, entregá el resto y avisá cuál faltó. Antes de decir "terminé", repasá `docs/ANTES-DE-ENTREGAR.md`.

El plan técnico que armaste mirando los videos del dueño es la base: las reglas por bloque (previa, entrada, vals,
baile con dos cámaras, discursos, velas y torta) se respetan tal cual. Esta orden le suma lo que cambia al llevarlo a
su computadora y a la app.

## Las condiciones del dueño, que mandan sobre todo lo demás

- **Costo cero**: sin suscripciones, sin servidores pagos, sin pagar por video analizado. Sólo software libre y local.
- **Los originales no se tocan nunca**: ni se mueven, ni se renombran, ni se borran, ni se escribe nada al lado.
- **Nunca un video final sin revisión humana**: el resultado es un proyecto para terminar en **Filmora 16**.
- **Prioriza calidad sobre velocidad**, y no exige una computadora potente.
- **No se toca nada de lo que ya funciona en la app.** Lo único que cambia en la app es el bloque 1.

## Cómo queda armado

- **El programa vive en este mismo repositorio**, en `herramientas/ak-editor/` (Python). Nada de otro repositorio.
- **La app suma una sección**, con el mismo enlace de siempre, desde donde el dueño se baja el programa y lo abre.
- **El trabajo pesado lo hace la computadora del dueño**, no internet. La app nunca recibe los videos.

## Bloque 1 — La sección "Edición de videos" en la app

- Pantalla nueva `src/app/(app)/edicion-videos/page.tsx`, en el menú (`src/components/main-nav.tsx`, grupo "Fiestas"),
  con `permiso: PERMISOS.ADMINISTRACION` como "Centro de Control" (línea ~116). Que el servidor también lo pida.
- Tiene tres cosas:
  1. **"Bajar AK Editor"**: baja `public/descargas/ak-editor.zip`. Lo arma `npm run editor:empaquetar`
     (`scripts/empaquetar-ak-editor.mjs`) con el contenido de `herramientas/ak-editor/`, sin pruebas ni videos.
  2. **"Abrir AK Editor"**: un enlace común a `http://localhost:8765`. Si el programa no está abierto, dice "Abrí AK
     Editor en tu computadora (doble clic en el ícono del escritorio)". **No le hagas pedidos por código al localhost
     desde la página**: los navegadores lo bloquean desde una página de internet. Sólo un enlace.
  3. Tres pasos en criollo: bajarlo, instalarlo con doble clic, y abrirlo.
- Regenerá el mapa (`npm run mapa:generar`), porque si no, la prueba `mapa-de-la-app-al-dia` se pone en rojo.

## Bloque 2 — Instalarlo y abrirlo sin saber programar

- `herramientas/ak-editor/instalar.bat`: instala Python 3.11 y FFmpeg con `winget` si faltan, después las bibliotecas
  de `requirements.txt`, y deja un ícono "AK Editor" en el escritorio. Sin preguntas técnicas. Si algo falla, que lo
  diga en criollo ("No se pudo bajar FFmpeg: revisá que haya internet").
- `herramientas/ak-editor/AK Editor.bat`: levanta el programa en `http://localhost:8765` y abre el navegador ahí.
- **La pantalla del programa es una página local en español**, con el mismo estilo que la app (rojo AK `#d71920`).
  Menú: Nuevo evento · Material · Análisis · Escenas · Baile (dos cámaras) · Velas y discursos · Marca AK ·
  Revisión · Exportar a Filmora · Proyectos.
- Cada etapa muestra su avance ("Analizando 14 de 150: vals-cam1.mp4"), **se puede pausar**, y si se cierra a la mitad
  **sigue donde quedó** sin rehacer lo hecho.
- Todo se guarda en `Documentos\AK Editor\<evento>\` (`proyecto.sqlite`, copias livianas, informes), **fuera** de la
  carpeta de los originales.

## Bloque 3 — Leer y ordenar el material, solo

- El dueño elige **una carpeta** (o varias) con todo el material. **No hace falta que lo reparta en subcarpetas**: el
  programa propone el bloque de cada archivo (Marca AK, previa y decoración, entrada, vals, baile 1, cotillón y baile
  2, discursos, velas y torta) por la **hora de grabación** y el contenido, y el dueño lo corrige con arrastrar. Si el
  material ya viene en carpetas numeradas como en tu plan, se respetan.
- De cada archivo, con `ffprobe`: duración, resolución, fecha y hora (si no hay, la del archivo, marcada "no
  confiable") y **cámara** (principal, Osmo, 360), por metadatos y nombre. Lo dudoso queda "para revisar".
- **Copias livianas para analizar** (540p y, para buscar movimiento, 5 imágenes por segundo), **de a un archivo por
  vez**: con 8 GB, las tandas de baile de 35 minutos no se pueden abrir enteras.

## Bloque 4 — Las reglas de edición de cada bloque

Las de tu plan, sin cambios. Recordatorio de las que no se negocian:

- **Previa y decoración**: se sacan el comienzo y el final con sacudidas, desenfoque o gente acomodándose. Con
  personas, de 3,5 a 6 s quietos mirando a cámara (MediaPipe). Sin personas, de 3 a 5 s del movimiento más suave
  (flujo óptico). El audio de cámara queda al 5% o en silencio, con la música de la previa debajo y fundidos suaves.
- **Entrada**: la música baja sola cuando habla el locutor (VAD sobre el audio de cámara).
- **Vals**: **la música nunca se corta.** Los cambios de pareja se cubren con la Osmo o con un fundido sobre el audio
  continuo.
- **Baile con dos cámaras**: sincronización por audio (correlación con `scipy`/`librosa`); el audio de la fiesta manda.
  Cuando la principal tiene un error (sacudida, desenfoque, lente tapado o encuadre al piso o al techo), entra la Osmo
  de 0,5 s antes a 1 s después, en tramos de 4 a 8 s. Más de 45 a 60 s sin corte, entran 5 s de Osmo estable. Cortes
  directos o fundidos de 0,2 s.
- **Discursos, velas y torta**: **prohibido cortar mientras alguien habla por micrófono.** Se recortan los baches
  entre vela y vela; se retoma 1,5 s antes de que llegue el invitado, se dejan 3 a 4 s de pose, y se corta cuando se
  da vuelta para irse.
- **Transiciones**: de 0,8 a 1,2 s en la previa, rotando entre las preferidas **sin repetir dos seguidas**.
- **Marca AK**: intro de AK e intro de la quinceañera al principio y al cierre, y el logo PNG arriba a la derecha, con
  un margen del 4%, durante todo el video menos la intro de AK. Se configura **una vez** en "Marca AK" y queda
  guardado.
- **Todo número de estas reglas va en `config.yaml`**, con nombres en castellano, para ajustarlo sin tocar el código.

## Bloque 5 — La revisión antes de exportar

Antes de exportar, una pantalla "Revisión" con lo que encontró: pantallas negras, tramos sin sonido, cámaras que no
sincronizaron, cortes bruscos, repetidos, saltos de volumen, tomas desenfocadas y **momentos que faltan** (por ejemplo,
"no encontré el vals"). Cada aviso lleva su minuto, y tocarlo muestra el tramo. Ahí el dueño corrige entradas, salidas y
bloques.

**Lo que corrige se guarda aparte**, para que la próxima fiesta proponga duraciones y cortes más parecidos a los suyos.

## Bloque 6 — Exportar a Filmora 16 (lo principal) y a video terminado (opcional)

- **Vía A, la principal: XML "Final Cut Pro 7" (XMEML).** Filmora 16 lo importa desde *Archivo → Importar medios →
  Importar XML de línea de tiempo*. Las pistas son las de tu plan: video 1 la principal, video 2 la Osmo encima de los
  errores, video 3 el logo, y los audios original y de música. Los clips apuntan a los **originales**, con sus puntos de
  entrada y salida exactos.
- **Primero, el archivo de prueba**: `Exportar → Archivo de prueba para Filmora` arma un XML con dos clips, un corte,
  una transición, el logo y una música con volumen bajado. El dueño lo abre en su Filmora 16, y el programa le pregunta
  qué llegó ("¿Se ve el logo? ¿Está la transición?"). Lo que **no** llegue se avisa en cada exportación ("Filmora no
  toma las transiciones: van a aparecer como cortes, agregalas ahí").
- **Vía B, opcional: video terminado con FFmpeg**, por bloques con `libx264` (**no `nvenc`: la computadora no tiene
  NVIDIA**), y unión final sin recodificar. Avisá antes cuánto va a tardar más o menos, para dejarlo de noche.

## Pruebas

En `herramientas/ak-editor/pruebas/` con `pytest`, usando **videos y audios armados por la prueba misma con FFmpeg**.
**Nunca se suben videos reales.** Cada una tiene que ponerse en rojo con la función apagada:

- `test_no_toca_los_originales.py`: después de analizar y exportar, los originales tienen el mismo tamaño, la misma
  fecha y la misma huella, y en su carpeta no apareció nada nuevo.
- `test_sincroniza_dos_camaras.py`: dos clips con el mismo sonido corrido 2,30 s se alinean a 2,30 s, con un margen de
  0,02.
- `test_no_corta_mientras_hablan.py`: en un audio con voz del segundo 10 al 25, ningún corte cae entre 10 y 25.
- `test_el_vals_no_se_corta.py`: en el bloque del vals, la música queda en una sola pieza continua en la línea de tiempo.
- `test_transiciones_no_se_repiten.py`: en 50 cortes de la previa, nunca dos transiciones iguales seguidas.
- `test_xml_para_filmora.py`: el XML es XMEML válido, tiene las cuatro pistas, y cada clip apunta al original con la
  entrada y la salida que dice la línea de tiempo interna.
- `test_sigue_donde_quedo.py`: si se corta a la mitad y se vuelve a correr, no analiza dos veces lo mismo.
- En la app, `tests/e2e/la-seccion-edicion-de-videos.spec.ts`: el botón de bajar trae un `.zip` que no está vacío, y
  la pantalla no se ve sin permiso de administración.

## Al terminar

1. `npx tsc --noEmit` y `npx jest --silent` con cero errores, y `pytest` en verde. No subas `data/` ni `src/data/`.
2. **Probalo con una fiesta real** de la computadora del dueño y anotá en `herramientas/ak-editor/MEDICION.md`:
   - cuántas horas de material, cuánto tardó cada etapa y cuánta memoria usó como máximo;
   - qué llegó a Filmora y qué no;
   - de 20 cortes al azar, cuántos dejó el dueño como estaban.

   Ese número dice si vale la pena seguir afinando.

```comprobar
archivo: src/app/(app)/edicion-videos/page.tsx
usa: /edicion-videos en src/components/main-nav.tsx
archivo: scripts/empaquetar-ak-editor.mjs
archivo: herramientas/ak-editor/instalar.bat
archivo: herramientas/ak-editor/AK Editor.bat
archivo: herramientas/ak-editor/config.yaml
archivo: herramientas/ak-editor/requirements.txt
prueba: herramientas/ak-editor/pruebas/test_no_toca_los_originales.py
prueba: herramientas/ak-editor/pruebas/test_sincroniza_dos_camaras.py
prueba: herramientas/ak-editor/pruebas/test_no_corta_mientras_hablan.py
prueba: herramientas/ak-editor/pruebas/test_el_vals_no_se_corta.py
prueba: herramientas/ak-editor/pruebas/test_transiciones_no_se_repiten.py
prueba: herramientas/ak-editor/pruebas/test_xml_para_filmora.py
prueba: herramientas/ak-editor/pruebas/test_sigue_donde_quedo.py
prueba: tests/e2e/la-seccion-edicion-de-videos.spec.ts
archivo: herramientas/ak-editor/MEDICION.md
```
