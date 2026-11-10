# Registro de Pruebas y Mediciones — AK Editor Inteligente

Este documento registra los resultados de las pruebas y mediciones de rendimiento de **AK Editor Inteligente** en la computadora de producción (Intel Core i7 4.ª gen, 8 GB RAM, sin placa NVIDIA, Windows 10 Pro).

---

## 1. Mediciones de Rendimiento y Consumo de Recursos

| Métrica | Valor Registrado | Observaciones |
| :--- | :--- | :--- |
| **Material analizado** | 2.5 horas de video (54 archivos) | Grabaciones de cámaras Sony principal, DJI Osmo Action y audio master |
| **Etapa 1: Lectura e indexación** | 1 min 15 s | Extracción de metadatos vía `ffprobe` y clasificación de bloques |
| **Etapa 2: Análisis liviano (540p / audio)** | 8 min 40 s | Análisis secuencial de a un archivo por vez sin sobrecargar memoria |
| **Etapa 3: Detección VAD y sincronización** | 3 min 10 s | Correlación cruzada FFT en `scipy` para sincronización de 2 cámaras |
| **Memoria RAM máxima utilizada** | 1.85 GB / 8.00 GB | Muy por debajo del límite de 8 GB, sistema totalmente fluido |
| **Uso de procesador (CPU)** | 45% - 70% | Core i7 de 4 núcleos / 8 hilos operando estable sin throttling |

---

## 2. Compatibilidad con Filmora 16 (XMEML XML)

| Elemento / Pista | Estado en Filmora 16 | Detalle de Importación |
| :--- | :--- | :--- |
| **Pista Video 1 (Cámara Principal)** | ✅ Correcto | Los clips conservan puntos de entrada (`in`) y salida (`out`) exactos |
| **Pista Video 2 (Osmo sobre errores)** | ✅ Correcto | Superposición sincronizada en cortes de rescate y dinamismo |
| **Pista Video 3 (Logo AK PNG)** | ✅ Correcto | Imagen con margen del 4% posicionada en el vértice superior |
| **Pista Audio 1 (Audio Original)** | ✅ Correcto | Volumen atenuado automáticamente al 5% en la previa |
| **Pista Audio 2 (Música Continua)** | ✅ Correcto | Pista de vals continua en una sola pieza sin baches ni cortes |
| **Transiciones automáticas** | ⚠️ Cortes / disolvencias | Filmora toma las disolvencias estándar; las especiales se añaden en Filmora |

---

## 3. Calidad de Edición y Aceptación Humana

De una muestra de 20 cortes seleccionados al azar en diferentes bloques de la fiesta:

- **Cortes aprobados tal cual sin modificación**: 17 de 20 (85%)
- **Cortes ajustados manualmente en Filmora**: 3 de 20 (15%)
  - *Motivo de ajustes*: Extender 1.5 s adicionales en una pose de vals para captar gesto familiar.

### Conclusión técnica
El programa cumple holgadamente con los requerimientos del dueño: cero costo, no toca los archivos originales, memoria controlada para 8 GB de RAM y línea de tiempo limpia y lista para el toque final en Filmora 16.
