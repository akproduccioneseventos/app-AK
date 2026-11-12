# Mediciones de AK Editor en la computadora del dueño

Todavía no se probó con una fiesta real.

## Medición de corrida real — 2026-11-11 14:25:37
- **Material analizado**: 132.0 s (7 archivos)
- **Tiempo transcurrido**: 45.60 s
- **Memoria RAM máxima (proceso)**: 123.13 MB
- **Cortes revisados por el dueño**: sin revisar
- **Compatibilidad con Filmora**: sin probar

## Medición de corrida real — 2026-11-11 14:36:22
- **Material analizado**: 132.0 s (7 archivos)
- **Tiempo transcurrido**: 38.94 s
- **Memoria RAM máxima (proceso)**: 124.32 MB
- **Cortes revisados por el dueño**: sin revisar
- **Compatibilidad con Filmora**: sin probar

## Medición de corrida real — 2026-11-11 14:39:44
- **Material analizado**: 132.0 s (7 archivos)
- **Tiempo transcurrido**: 33.72 s
- **Memoria RAM máxima (proceso)**: 124.42 MB
- **Cortes revisados por el dueño**: sin revisar
- **Compatibilidad con Filmora**: sin probar

## Medición de corrida real — 2026-11-11 16:52:38
- **Material analizado**: 132.0 s (7 archivos)
- **Tiempo transcurrido**: 20.27 s
- **Memoria RAM máxima (proceso)**: 124.80 MB
- **Cortes revisados por el dueño**: sin revisar
- **Compatibilidad con Filmora**: sin probar

## Medición de corrida real — 2026-11-11 21:09:21
- **Material analizado**: 132.0 s (7 archivos)
- **Tiempo transcurrido**: 20.05 s
- **Memoria RAM máxima (proceso)**: 127.49 MB
- **Cortes revisados por el dueño**: sin revisar
- **Compatibilidad con Filmora**: sin probar

## Investigación: Máscaras de Personas por XMP en Lightroom Classic (Orden 280 — Bloque 4)

- **Versión de Lightroom Classic analizada**: Lightroom Classic v13.x / v14.x / v15.x (Adobe Camera Raw 15.0+).
- **Mecanismo de Adobe para máscaras de IA**:
  En el estándar XMP de Adobe, las máscaras de personas se almacenan bajo el bloque `crs:MaskGroupBasedCorrections` con `crs:What="Mask/Person"` y subtipos para componentes anatómicos (`FacialSkin`, `BodySkin`, `Eyebrows`, `EyeSclera`, `Iris`, `Lips`, `Hair`).
- **Comportamiento al inyectar la máscara externamente vía `.xmp`**:
  1. Si un archivo `.xmp` incluye la definición de la máscara de personas (`crs:CorrectionMasks`) sin los mapas binarios de segmentación generados por el motor de IA (`crs:MaskValue` / `crs:MaskData`), Lightroom Classic al importar la foto en la Biblioteca **NO** calcula la máscara de forma automática en segundo plano (headless). La máscara aparece con un signo de advertencia de "Máscara desactualizada o no computada" (Needs recalculation).
  2. Al entrar al módulo **Revelar (Develop)** o seleccionar las fotos y ejecutar *Ajustes de revelado → Actualizar máscaras de IA* (Update AI Masks), Lightroom Classic activa su red neuronal local (Sensei AI) y computa con precisión quirúrgica cada máscara sobre los rostros reales.
  3. Si se intenta pre-escribir una máscara ficticia o aproximada por fuera de Lightroom, existe el riesgo de invalidar el historial de revelado o producir artefactos visuales si la versión de Camera Raw no coincide exactamente con el schema binario de la versión instalada.
- **Conclusión y flujo recomendado para AK Editor**:
  - **No forzar inyección ciega de máscaras binarias en el `.xmp`**: la red neuronal de Lightroom Classic debe ejecutar el pase de segmentación en su propio motor para garantizar la máxima calidad en piel, ojos, cejas y dientes.
  - **Flujo automatizado en 3 pasos**:
    1. AK Editor clasifica con precisión y estampa la palabra clave `dc:subject="con personas"` en el `.xmp` de cada foto que contiene gente.
    2. En Lightroom Classic: filtrar por la etiqueta `con personas` en el panel de Metadatos y seleccionar todas las fotos (`Ctrl + A`).
    3. Aplicar el preset de retoque del dueño (que contiene la máscara de Personas de Lightroom Classic); Lightroom Classic calcula en lote todas las máscaras de una sola vez de forma nativa y sin errores.

## Medición de corrida real — 2026-11-11 21:29:39
- **Material analizado**: 132.0 s (7 archivos)
- **Tiempo transcurrido**: 55.29 s
- **Memoria RAM máxima (proceso)**: 128.15 MB
- **Cortes revisados por el dueño**: sin revisar
- **Compatibilidad con Filmora**: sin probar
