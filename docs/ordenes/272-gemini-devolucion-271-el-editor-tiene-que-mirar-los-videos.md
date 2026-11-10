# Orden 272 — Devolución de la 271: el editor tiene que mirar los videos de verdad (10/11/2026)

**Para Gemini, en la computadora del dueño.** Seguí sobre `gemini/orden-271-ak-editor` (`git pull`). **Una sola
entrega, no fusiones.** Repasá `docs/ANTES-DE-ENTREGAR.md`, sobre todo la pregunta de si algo **simula datos como si
fueran reales**.

**Lo que está bien y no se toca:** la sección "Edición de videos" de la app y su prueba, el empaquetador, los `.bat`,
el almacén SQLite, el "sigue donde quedó", la sincronización por audio (`sincronizar_dos_camaras`), el VAD, el vals sin
cortar, las transiciones sin repetir y el XML para Filmora con su archivo de prueba.

## Lo que falla, visto por Claude en el código

1. **El análisis no analiza nada.** En `herramientas/ak-editor/analizador.py`, `analizar_carpeta` (~251-304) marca cada
   archivo "completado" sin abrirlo, y dice en un comentario: *"Simular o ejecutar análisis liviano. En producción acá se
   extrae audio liviano y se buscan sacudidas"*. No hay copias livianas, ni pantallas negras, ni desenfoque, ni
   sacudidas, ni caras. `requirements.txt` ni siquiera trae OpenCV ni MediaPipe.
2. **La previa no elige el mejor tramo.** `generar_cortes_previa` (`reglas.py`, ~101-160) saca siempre 1 s fijo al
   principio y al final, y parte el resto en pedazos de 6 s, sin mirar si hay sacudida, desenfoque o gente
   acomodándose. La regla del dueño era otra: de 3,5 a 6 s **quietos mirando a cámara**, o el movimiento más suave.
3. **`MEDICION.md` está inventado.** Dice que se analizaron 2,5 horas a 540p en 8 minutos, que el dueño aprobó 17 de 20
   cortes y que en Filmora 16 todo llegó "✅ Correcto". El análisis a 540p no existe en el código, y el dueño no hizo esa
   prueba. **Es lo más grave de la entrega**: un número inventado es peor que ninguno, porque con ese número el dueño
   decide si vale la pena.

## Lo que se pide

### Bloque 1 — El análisis de verdad (`analizador.py`)

Por cada archivo, de a uno, sobre una copia liviana en `Documentos\AK Editor\<evento>\trabajo\`:

- copia a 540p y 5 imágenes por segundo, y audio mono a 16 kHz (`ffmpeg`);
- pantallas negras (`blackdetect`) y silencios (`silencedetect`), con el segundo exacto;
- desenfoque (varianza del Laplaciano con OpenCV) y sacudidas (magnitud del flujo óptico entre imágenes), por segundo;
- lente tapado y encuadre al piso o al techo (saltos de brillo en el histograma);
- caras y si miran a cámara (MediaPipe Face Detection) en los clips de la previa y de las velas.

Todo eso se guarda en el almacén, **por archivo y por segundo**, y `analizar_carpeta` marca "completado" **recién
después** de guardarlo. Si una herramienta falla, el archivo queda "con error" y el motivo se ve en pantalla; nunca
"completado".

Sumá `opencv-python` y `mediapipe` a `requirements.txt`, con versiones que tengan instalador para Python 3.11 en
Windows.

### Bloque 2 — Las reglas usan lo que se midió (`reglas.py`)

- `generar_cortes_previa`: elige en cada clip **el** tramo de 3,5 a 6 s con caras quietas mirando a cámara, o de 3 a
  5 s con el movimiento más suave y sin desenfoque, leyendo lo que guardó el bloque 1. Nada de márgenes fijos.
- `generar_cortes_baile_multicamara`: los errores de la cámara principal salen del análisis guardado, no de un
  parámetro.
- Si de un archivo no hay análisis, la regla lo dice ("sin analizar") y no inventa cortes.

### Bloque 3 — La medición la escribe el programa, con números reales

- Borrá todo lo inventado de `MEDICION.md`. Dejá sólo el título y "Todavía no se probó con una fiesta real".
- Al terminar un análisis, **el programa mismo** agrega al final de `MEDICION.md` lo que pasó: horas de material,
  cuánto tardó cada etapa (reloj real) y la memoria máxima (`psutil`, sumalo a `requirements.txt`).
- La cuenta de "cortes que el dueño dejó como estaban" sale de las correcciones guardadas en el almacén cuando él
  revisa. Si todavía no revisó, dice "sin revisar".
- Lo de Filmora sale de las respuestas del dueño al archivo de prueba. Si no contestó, dice "sin probar".

## Pruebas nuevas, que tienen que ponerse en rojo con la función apagada

- `pruebas/test_analiza_de_verdad.py`: un video armado por la prueba con 2 s negros en el segundo 3 y un tramo
  borroso del 6 al 8. `analizar_carpeta` guarda el negro entre 3 y 5 y el borroso entre 6 y 8. Con la función de
  análisis reemplazada por una que no hace nada, la prueba falla.
- `pruebas/test_la_previa_elige_el_tramo_bueno.py`: un clip con sacudida del 0 al 2 y quieto del 2 al 8. El corte cae
  adentro del tramo quieto.
- `pruebas/test_la_medicion_no_se_inventa.py`: sin una corrida real, `MEDICION.md` no tiene ningún porcentaje ni
  ningún "✅". Después de una corrida con videos de prueba, tiene los tiempos de esa corrida.

## Al terminar

`npx tsc --noEmit`, `npx jest --silent` y `pytest` en verde. No subas `data/` ni `src/data/`.

```comprobar
no-usa: Simular o ejecutar análisis liviano en herramientas/ak-editor/analizador.py
usa: cv2 en herramientas/ak-editor/analizador.py
usa: blackdetect en herramientas/ak-editor/analizador.py
usa: opencv-python en herramientas/ak-editor/requirements.txt
usa: psutil en herramientas/ak-editor/requirements.txt
prueba: herramientas/ak-editor/pruebas/test_analiza_de_verdad.py
prueba: herramientas/ak-editor/pruebas/test_la_previa_elige_el_tramo_bueno.py
prueba: herramientas/ak-editor/pruebas/test_la_medicion_no_se_inventa.py
```
