# Orden 271 — AK Editor Inteligente, etapa 1: ordenar, clasificar y marcar lo que no sirve (10/11/2026)

**Para Gemini, trabajando en la computadora del dueño (Windows 10, 8 GB de memoria, sin placa de video moderna).**
Rama nueva `gemini/orden-271-ak-editor-etapa-1` desde la versión principal actualizada. **Una sola entrega, no
fusiones.**

## Las condiciones del dueño, que mandan sobre todo lo demás

- **Costo cero**: nada de suscripciones, servidores pagos ni pago por video analizado. Sólo software libre.
- **Los originales no se tocan nunca**: ni se mueven, ni se renombran, ni se borran, ni se escriben al lado.
- **Es un programa aparte de la app**: vive en `herramientas/ak-editor/` y **no toca nada de `src/`**. La app web no
  cambia en esta orden.
- **Todo en español**, para alguien que no es programador: se abre con doble clic.
- **Filmora 16 es el editor final.** Esta etapa no exporta a Filmora: eso es la etapa 3, después de probar con un
  proyecto real del dueño si Filmora abre algo armado por fuera.

## Qué tiene que hacer, de punta a punta

El dueño hace doble clic en `herramientas/ak-editor/AK Editor.bat`, elige la carpeta de una fiesta, y al terminar se le
abre en el navegador **un informe en español** con todo el material ordenado y marcado.

1. **Leer todo el material** de la carpeta y sus subcarpetas: videos, fotos y audio. De cada archivo: tipo, duración,
   resolución, fecha y hora de grabación (de los metadatos con `ffprobe`; si no hay, la del archivo, y avisar que no es
   confiable) y **qué cámara es**: la principal, la Osmo o la 360, deducido de los metadatos y del nombre. Lo que no se
   pueda deducir queda "sin identificar" para que el dueño lo corrija.
2. **Copias livianas para analizar** (proxies a 360p con `ffmpeg`) en una carpeta de trabajo **fuera** de la carpeta de
   la fiesta: `Documentos\AK Editor\<fiesta>\trabajo\`. De a un archivo por vez, para no llenar la memoria.
3. **Partir cada video en escenas** con PySceneDetect.
4. **Marcar lo que no sirve**, cada cosa con su minuto:
   - pantallas negras (`ffmpeg blackdetect`);
   - silencios largos (`ffmpeg silencedetect`);
   - tomas movidas o desenfocadas (OpenCV, nitidez de varias imágenes por escena);
   - **repetidos**: el mismo momento grabado dos veces o el archivo copiado dos veces (comparación de imágenes).
5. **Reconocer el momento de cada escena** con IA local y gratuita, mirando **una imagen por escena**:
   decoración, llegada de invitados, entrada de la quinceañera, vals, velas, regalos, fotos con invitados, torta,
   comida, baile, cierre. Usá un modelo chico que ande en procesador (por ejemplo `open_clip` ViT-B-32), con la frase
   de cada momento en español y en inglés. **La hora de grabación ayuda**: la decoración va antes que la llegada, y el
   baile al final. Cada escena queda con el momento propuesto y **qué tan seguro está**. Lo que tenga poca seguridad
   queda "para revisar".
6. **El informe** (`informe.html`, en la carpeta de trabajo): una línea de tiempo de toda la fiesta en orden de hora,
   con una miniatura por escena, la cámara, el momento propuesto y las marcas de lo que no sirve. El dueño puede
   **cambiar el momento de una escena** desde el informe, y el cambio se guarda.
7. **Guardar todo en un archivo de proyecto** SQLite (`proyecto.sqlite` en la carpeta de trabajo): archivos, escenas,
   marcas, momentos y las correcciones del dueño. **Guardá las correcciones aparte**: son lo que después va a usar
   para aprender su estilo (etapa 4).
8. **Que se pueda cortar y seguir**: si se cierra la ventana a la mitad, la próxima vez sigue desde donde quedó y no
   vuelve a analizar lo ya hecho. Mostrá el avance ("Analizando 14 de 63: vals-cam2.mp4").

## Lo que NO entra en esta etapa

Recortes, sincronización de cámaras, transiciones, logo, música y exportar a Filmora. Eso viene después, cuando esta
parte ande con una fiesta real.

## Cómo se instala

Un `herramientas/ak-editor/instalar.bat` que instale Python (si no está), FFmpeg y las bibliotecas de
`requirements.txt`, sin preguntar nada técnico. Si algo falla, que diga en criollo qué pasó.

## Pruebas (con `pytest`, en `herramientas/ak-editor/pruebas/`)

Con videos de prueba **armados por la misma prueba con ffmpeg** (unos segundos negros, unos en silencio, uno borroso y
uno copiado dos veces). **No se suben videos reales al repositorio.**

- `test_no_toca_los_originales.py`: después de analizar, los originales tienen el mismo tamaño, la misma fecha y la
  misma huella, y en la carpeta de la fiesta no apareció ningún archivo nuevo.
- `test_marca_lo_que_no_sirve.py`: encuentra el tramo negro, el silencio, el borroso y el repetido **en el minuto
  correcto**, y no marca el video bueno.
- `test_sigue_donde_quedo.py`: si se corta a la mitad y se vuelve a correr, no analiza dos veces el mismo archivo.
- `test_la_correccion_se_guarda.py`: el momento corregido por el dueño queda guardado y no lo pisa un análisis nuevo.

## Al terminar

Probalo con **una fiesta real** de la computadora del dueño y anotá en `herramientas/ak-editor/MEDICION.md` cuántas
horas de video tenía, cuánto tardó, cuánta memoria usó como máximo, y qué tan bien acertó los momentos (de 20 escenas
tomadas al azar, cuántas estaban bien). Sin esa medición no se decide la etapa 2.

```comprobar
archivo: herramientas/ak-editor/AK Editor.bat
archivo: herramientas/ak-editor/instalar.bat
archivo: herramientas/ak-editor/requirements.txt
prueba: herramientas/ak-editor/pruebas/test_no_toca_los_originales.py
prueba: herramientas/ak-editor/pruebas/test_marca_lo_que_no_sirve.py
prueba: herramientas/ak-editor/pruebas/test_sigue_donde_quedo.py
prueba: herramientas/ak-editor/pruebas/test_la_correccion_se_guarda.py
archivo: herramientas/ak-editor/MEDICION.md
```
