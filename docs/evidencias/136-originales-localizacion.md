# 136 - Localizacion de los 19 originales

Alcance: localizar referencias y nombres de los documentos fuente y evidencia previa. Sin abrir registros financieros, calcular importes ni consultar carpetas personales externas. Rama observada `codex/134-conciliacion-cobertura-20261015`, HEAD `c7188d19a33365bd0195444311a1d063ed15b0a7`.

## Resultado

- Documentos originales localizados: **0 de 19**. No se hallaron rutas fuente explícitas ni una carpeta de originales identificada en los nombres de archivos del repositorio consultados. Por tanto, no hay paths individuales que informar ni comprobar con `Test-Path`.
- PDF escaneados/fotos originales: **desconocido**. No se halló evidencia que permita afirmar que existen o que no existen fuera de las rutas documentadas. No se inspeccionaron imágenes o PDFs de negocio.
- Transcripciones/JSON importados: hay referencias a `29migrados/QA PDFsJSON`, pero el informe previo aclara que esas referencias **no identifican los 19 originales**. No se establece si esos 19 están representados por transcripción o JSON importado: **desconocido**.
- Procedencia: no hay enlaces de procedencia documento-a-registro ni un manifiesto de los 19 identificados en las referencias acotadas revisadas. No inferir correspondencias a partir de PDFs sintéticos de QA.

## Evidencia previa y alcance

- `docs/evidencias/96-video-lector-y-cierre-del-alcance-disponible.md`, sección “19 originales y cierre acotado”: el inventario limitado a scripts/docs/datos locales reportó que no encontró export autoritativo ni documentos manuales; `82-base-real.json` indica que dos lecturas gRPC7 con `recordsRead: 0` son un límite, no prueba de ausencia. El cierre dice expresamente que los 19 no se identificaron, que no se consultó la base real y que no hubo conciliación monetaria. Referencia a `29migrados/QA PDFsJSON` sin identificación individual.
- `docs/evidencias/82-base-real.json`: `sourceBase` `1b57abbec5162402cc30269cc276398707b28d55`; `writes: 0`; `credentialStoredInEvidence: false`; resultado limitado por credencial no habilitada. No demuestra ausencia de presupuestos ni documentos.
- `docs/evidencias/93-cierre-pendientes-anteriores.md`: registra que faltaba conciliación contra fuente/base real y remite al límite de lectura previo.
- `docs/evidencias/95-publicacion-y-pendientes-exactos.md`, punto 5: requiere export autorizado de solo lectura y documentos originales; enumera campos que el responsable financiero deberá cotejar, sin que este memo los evalúe.
- `docs/evidencias/134-conciliacion.md` y `134-conciliacion.json`: inventario de cobertura/estructura de la fuente publicada `7230f9d02b32805952a185f704a0208bd5d643e6`; manifiesto `PASS_RECONCILIATION_134_ONLY`, cero pruebas de aplicación y `applicationCertified: false`. No es conciliación de los 19 ni acredita sus fuentes. El HEAD de esta tanda es distinto; el informe 134 cita la fuente publicada, no valida el HEAD actual para los documentos.

## Siguiente comprobación mínima real

Solicitar en un directorio de trabajo explícitamente designado (1) manifiesto autorizado de solo lectura con 19 identificadores/rutas de origen y vínculos inequívocos al registro importado, y (2) los 19 documentos originales accesibles en esas rutas, preservando los archivos tal cual. Entonces verificar solo existencia, conteo y procedencia contra el manifiesto; derivar hashes sin divulgar contenido. Si son escaneos/fotos, confirmar disponibilidad y legibilidad sin transcribir ni calcular aquí. Entregar los originales y su índice a Claude para la conciliación financiera. Hasta entonces, original físico/digital, formato y correspondencias siguen **desconocidos**; los recuentos de imports/JSON no los sustituyen.
