# Orden 307 — El modo Fotos del AK Editor edita cada foto, como Aftershoot (14/11/2026)

**Para Gemini, en la computadora del dueño.** Va **en la misma propuesta que la 297 a 306**. Antes de "terminé":
`docs/ANTES-DE-ENTREGAR.md`. Pedido del dueño: *"la edición de imágenes debe ser como Aftershoot"*.

## Qué hace Aftershoot (investigado el 14/11/2026) y qué tiene hoy el AK Editor

| Aftershoot | AK Editor hoy (`herramientas/ak-editor/fotos.py`) |
|---|---|
| Elige: borrosas, ojos cerrados, repetidas, con puntaje de calidad | Lo hace (`procesar_seleccion_fotos`), pero califica sólo 5 o 0 |
| Prioriza la cara principal (la agasajada) | **No existe** |
| Edita **cada foto** con el estilo aprendido, corrigiendo la luz y el color de esa foto | **No**: `aprender_mi_estilo` (~826) saca la mediana de todo y arma 3 ajustes guardados con retoques fijos (+0,2 de exposición, −400 K). No se aplica a ninguna foto: el dueño los pone a mano |
| Endereza y recorta | Lo hace (`detectar_angulo_enderezado`, `calcular_recorte_3_2`) |
| Retoque de piel, dientes, pelo suelto, brillo | Queda en Lightroom a mano (`MEDICION.md`, bloque 4 de la orden 280) |
| Vista antes / después | **No existe** |

## Lo que NO se toca

- Costo cero: sólo bibliotecas libres, nada pago. Los originales no se tocan ni se borran. Todo va como ajustes en el `.xmp`
  (editable en Lightroom), nunca píxeles quemados.
- Lo que ya anda de elegir, enderezar y recortar, y el AK Editor de video (órdenes 271 a 275 y 279).

## Bloque 1 — Cada foto sale editada (lo central)

1. Al procesar una carpeta, cada foto elegida se **clasifica sola** en "Salón noche", "Exterior día" o "Torta y velas" (brillo
   medio, ISO y temperatura de color de la vista previa) y **se le escribe en su `.xmp`** el ajuste de esa escena que armó
   `aprender_mi_estilo`.
2. **Corrección por foto:** sobre ese ajuste, se suma lo que le falta a esa foto para llegar al estilo. Exposición
   (`crs:Exposure2012`) para que su brillo medio quede en el del estilo, y balance de blancos (`crs:Temperature`/`crs:Tint`) para
   que su color quede en el del estilo, medidos en la vista previa. Con tope (±1,5 de exposición, ±1500 K) para no arruinar una foto rara.
3. Si el dueño ya tiene ajustes en el `.xmp`, **no se pisan**: se escriben sólo los que no tienen valor.
4. Al abrir en Lightroom (Metadatos → Leer metadatos de los archivos) cada foto ya se ve editada.

## Bloque 2 — Calificación por calidad y la cara principal

- Estrellas de 1 a 5 según el puntaje (nitidez, ojos, luz), no sólo 5 o 0. Las rechazadas quedan con la etiqueta "Rechazada", como hoy.
- **Cara principal:** el dueño elige 1 a 3 fotos de la agasajada (o de los novios). Con el reconocimiento de caras que ya está en el
  programa, las fotos donde sale suben una estrella y, en un grupo de repetidas, gana la mejor de ella. En pantalla: "Salen N fotos
  de la agasajada".

## Bloque 3 — Antes y después en pantalla

En el modo Fotos, al tocar una miniatura: la vista previa original al lado de la misma con la exposición y el color del bloque 1
aplicados (simulado sobre la miniatura con OpenCV). Botón "Volver al original" que saca esos ajustes del `.xmp` de esa foto.

## Bloque 4 — Retoque: lo que se puede hacer sin Lightroom

- Para las fotos "con personas": un toque suave global en el `.xmp` (`crs:Texture` −10, `crs:Clarity2012` −5) que suaviza piel sin
  máscara. Con interruptor en `config.yaml`, apagado si el dueño no lo quiere.
- El retoque fino (dientes, pelo suelto, brillo de piel) **sigue en Lightroom**: decir eso en la pantalla, con el paso a un toque.
  No prometer lo que Lightroom no calcula desde afuera (ver `MEDICION.md`).

## Bloque 5 — Medido, no supuesto

En `MEDICION.md`: cuánto tarda con 500 NEF de una fiesta real, cuántas eligió y rechazó, y una muestra de 10 fotos antes y después.
Lo corre el dueño; si no hay fotos reales, se deja la planilla para completar y **no se inventan números**.

## Pruebas

Con fotos de prueba armadas en la prueba (una oscura, una clara, una azulada, una cálida):
- la oscura recibe exposición positiva y la clara negativa; la azulada recibe temperatura más cálida;
- un `.xmp` con ajustes del dueño no se pisa;
- con la cara principal marcada, gana su foto en el grupo de repetidas;
- "Volver al original" saca los ajustes.

```comprobar
usa: Exposure2012 en herramientas/ak-editor/fotos.py
usa: Temperature en herramientas/ak-editor/fotos.py
prueba: herramientas/ak-editor/pruebas/test_fotos_edita_cada_foto.py
prueba: herramientas/ak-editor/pruebas/test_fotos_cara_principal.py
```
