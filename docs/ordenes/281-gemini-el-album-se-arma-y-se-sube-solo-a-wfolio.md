# Orden 281 — El álbum se arma y se sube solo a Wfolio, ordenado en carpetas (11/11/2026)

**Para Gemini, en la computadora del dueño.** Va **en la misma entrega que la orden 280**, rama
`gemini/orden-280-fotos-estilo-ak`. Repasá `docs/ANTES-DE-ENTREGAR.md`.

## Qué quiere el dueño

Trabaja con **Wfolio** (`https://wfolio.com/my/disk`) para entregar las fotos. Hoy, a mano, crea el álbum, crea una
carpeta por parte de la fiesta ("Exterior", "Fiesta", etc.) y sube cada grupo a su carpeta. Quiere que **se haga solo**
apenas termina de exportar desde Lightroom.

**Claude no pudo abrir Wfolio desde su máquina** (el sitio no responde fuera de la computadora del dueño). Por eso el
bloque 1 es averiguar, en la computadora del dueño, cuál de los caminos existe. **No inventes nada que no hayas visto
funcionar.**

## Bloque 1 — Averiguar cómo se puede subir solo (y anotarlo)

En la computadora del dueño, en este orden, y anotá cada respuesta con su enlace en
`herramientas/ak-editor/WFOLIO.md`:

1. ¿Wfolio tiene **complemento para Lightroom Classic** (servicio de publicación)? Si lo tiene y deja elegir carpeta
   dentro del álbum, **ése es el camino**: el programa sólo arma las carpetas y el dueño publica con un toque.
2. ¿Tiene **API para desarrolladores** (crear álbum, crear carpeta, subir)? Si la tiene, el bloque 3 la usa.
3. Si no hay ni complemento ni API: **automatizar la página de Wfolio desde el navegador** de la computadora del dueño
   (Playwright, que ya usamos), con **su sesión guardada en su computadora**. La clave no se escribe en ningún archivo
   del repositorio ni se le pide al dueño en el chat: el programa abre Wfolio una vez, el dueño entra él mismo, y se
   guarda la sesión en `Documentos\AK Editor\wfolio-sesion\` (fuera del repositorio).

## Bloque 2 — Repartir las fotos en carpetas, solo

En el modo "Fotos" del AK Editor (orden 280), las fotos **elegidas** se reparten por parte de la fiesta con la hora de
la cámara y el tipo de escena que ya calcula el bloque 3 de la 280:

- **Exterior** (luz de día, sin flash, antes de la entrada), **Previa y recepción**, **Entrada y vals**, **Fiesta**,
  **Torta y velas**. Los nombres se cambian en "Marca AK" y quedan guardados.
- Pantalla para **revisar y mover** fotos entre carpetas antes de subir.
- Al exportar desde Lightroom, el dueño usa como destino `Documentos\AK Editor\<fiesta>\entrega\`. El programa mira esa
  carpeta y ubica cada JPG exportado en su parte (por el nombre del archivo original, que Lightroom conserva).

## Bloque 3 — Subir a Wfolio

Con el camino que haya salido del bloque 1:

- Crea el **álbum** con el nombre de la fiesta (el de "Nuevo evento" o el de `estilo.json`), crea las **carpetas** del
  bloque 2 y sube cada foto a la suya.
- **De a una, con reintento**, y si se corta sigue donde quedó (el almacén SQLite ya lo hace para el video). Al final
  dice cuántas subió por carpeta y cuáles fallaron.
- **El álbum queda privado.** El enlace para el cliente **lo manda el dueño**: nada se le avisa al cliente solo
  (regla de `CLAUDE.md`: preparar sí, mandar no). La pantalla muestra el enlace listo para copiar con un toque.
- Si Wfolio cambia la página y la automatización falla, el programa **lo dice en criollo** ("Wfolio cambió su página: subí
  esta vez a mano; las carpetas ya están armadas en tu computadora") y deja las carpetas listas para arrastrar. Nunca
  dice "subido" sin haberlo comprobado en la respuesta de Wfolio.

## Pruebas

- `herramientas/ak-editor/pruebas/test_reparte_en_carpetas.py`: fotos armadas por la prueba con horas y luces distintas
  caen en Exterior, Fiesta y Torta; un JPG exportado con el nombre de un original cae en la carpeta de su original.
- `herramientas/ak-editor/pruebas/test_wfolio_sigue_donde_quedo.py`: con Wfolio de mentira (un servidor local de la
  prueba) que falla en la foto 3 de 5, la segunda corrida sube sólo la 3, 4 y 5, y el resumen no dice "subido" de la
  que falló.

```comprobar
archivo: herramientas/ak-editor/WFOLIO.md
archivo: herramientas/ak-editor/wfolio.py
prueba: herramientas/ak-editor/pruebas/test_reparte_en_carpetas.py
prueba: herramientas/ak-editor/pruebas/test_wfolio_sigue_donde_quedo.py
```
