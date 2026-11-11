# Orden 274 — El AK Editor arma la fiesta entera, no sólo la previa (11/11/2026)

**Para Gemini, en la computadora del dueño.** Sobre `claude/app-debug-stabilize-m70e6z` actualizada (`git pull`), rama
nueva `gemini/orden-274-editor-fiesta-entera`. **Una sola entrega junto con la orden 273 (Video de Vida)**, sin
fusionar. Si una de las dos se traba, entregá la otra igual y avisá. Repasá `docs/ANTES-DE-ENTREGAR.md`.

## Lo que midió Claude usando el programa como lo usa el dueño

Armó una fiesta de prueba con 6 videos (2 de previa, vals, baile con cámara principal y Osmo, y velas). Después
levantó el programa (`app.py`), cargó la carpeta, analizó y exportó a Filmora:

- **El programa no arrancaba con Python 3.11**, que es el que instala `instalar.bat`: una f-string con barra invertida
  en `exportador_video.py`. **Ya lo arregló Claude**, y `pruebas/test_todo_compila.py` lo frena si vuelve.
- **Los cortes de la previa salían de 0 segundos**, porque `app.py` creaba `ReglasEdicion()` sin el almacén y las
  reglas no encontraban el análisis. **Ya lo arregló Claude** (`ReglasEdicion(almacen=almacen)`, ~212). Ahora salen
  tramos de 5 s.
- **Lo que falta, y es esta orden:** de 6 videos, la línea de tiempo trae **sólo los 2 de la previa**. En
  `tarea_analisis` (`app.py`, ~205-225) nadie llama a `generar_pistas_vals`, `generar_cortes_baile_multicamara` ni
  `generar_cortes_discursos_y_velas`, ni a `sincronizar_dos_camaras`. Y la revisión salió **vacía**, aunque
  `baile_cam1` empieza con 3 s negros: sólo avisa si falta el vals.

Las pruebas de las reglas daban verde porque cada una prueba su función suelta. **Nadie probaba el camino que usa
el dueño.**

## Bloque 1 — `tarea_analisis` arma todos los bloques

Después de `analizar_carpeta`, en orden de la fiesta:

1. **Previa**, como ahora.
2. **Entrada**, si hay archivos del bloque, con la música que baja cuando habla el locutor.
3. **Vals**: `generar_pistas_vals`, con la música en una sola pieza.
4. **Baile**: `sincronizar_dos_camaras` entre principal y Osmo de cada tanda, guardando el desfase en el almacén, y
   después `generar_cortes_baile_multicamara`, con los errores leídos del análisis.
5. **Discursos y velas**: `generar_cortes_discursos_y_velas`, con `detectar_voz_activa`.

Cada bloque va **después** del anterior en la línea de tiempo (el `start` de uno empieza donde terminó el otro), y
todos se guardan, no sólo la previa. Si un bloque no tiene archivos, no se inventa nada.

## Bloque 2 — La revisión avisa lo que encontró el análisis

Además del "no encontré el vals", que siga, `tarea_analisis` agrega un aviso por cada tramo malo que quedó **adentro**
de un corte. Va con el archivo y el minuto: pantalla negra, desenfoque, sacudida sin Osmo para tapar, y "no se pudieron
sincronizar las dos cámaras del baile" si la correlación no encontró un desfase confiable.

## Bloque 3 — La prueba que faltaba: el camino del dueño

`pruebas/test_la_fiesta_entera_llega_a_filmora.py`:

1. Arma con FFmpeg una fiesta como la de Claude:
   - `previa_*.mp4` ×2;
   - `vals_cam1.mp4` (40 s);
   - `baile_cam1.mp4` (30 s, con los primeros 3 s negros);
   - `baile_osmo.mp4`: el mismo audio corrido 2,3 s, sacado de `baile_cam1`;
   - `velas_vela1.mp4`.
2. Corre el **mismo** camino que `app.py`: lo ideal es sacar de `tarea_analisis` una función
   `armar_proyecto(carpeta, almacen)` que llame la app y la prueba.
3. Exporta con `exportar_timeline_filmora` y comprueba:
   - el XML tiene clips de los cinco bloques;
   - **ningún clip dura menos de 1 s**;
   - el desfase guardado del baile es 2,3 ± 0,05 s;
   - hay un clip de la Osmo en la pista 2 durante el negro de `baile_cam1`;
   - la revisión trae el aviso del negro.
4. Con `tarea_analisis` armando sólo la previa (como hoy), **tiene que dar rojo**.

## Lo que no se toca

El instalador, la sección de la app, el análisis por segundo, el almacén, el XML de prueba para Filmora y los dos
arreglos de Claude de arriba.

```comprobar
usa: generar_cortes_baile_multicamara en herramientas/ak-editor/app.py
usa: generar_cortes_discursos_y_velas en herramientas/ak-editor/app.py
usa: sincronizar_dos_camaras en herramientas/ak-editor/app.py
prueba: herramientas/ak-editor/pruebas/test_la_fiesta_entera_llega_a_filmora.py
prueba: herramientas/ak-editor/pruebas/test_todo_compila.py
```
