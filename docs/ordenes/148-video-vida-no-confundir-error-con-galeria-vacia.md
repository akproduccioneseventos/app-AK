# Orden148 - Error de lectura no significa cero fotos

NO CONTRASTADO CON LA TANDA DE PROGRAMACION LOCAL NO SUBIDA.

Gemini corrige; Claude revisa permisos si los toca y compila. Contrastar
primero la entrega local, no duplicar arreglos existentes. Fuente ejecutada y
main remoto:9a054620718673f00e10b52f0811cc1af729ba4e. PR1286 es QA, no arreglo.

## VID96-LECTOR P2 - Video de Vida anuncia galeria vacia ante un error

`getLifeStoryVideoPhotos`, src/app/actions/fiesta/video-vida.actions.ts:203,
devuelve[] al fallar listado/firma de UNA foto. El consumidor conectado en
src/app/video-vida/[fiestaId]/page.tsx:123 muestra "Tu Galeria (0 de 2)",
dos controles de carga y ninguna advertencia. Puede inducir a reemplazar
fotos ya cargadas. NO se observo borrado ni reemplazo destructivo.

Sonda96 del componente REAL/acciones REALES con fallos SDK controlados:
listado rechazado ->contador0; dos fotos (una publica legible) y una firma
rechazada ->[] para TODO. No mock del retorno del lector.
Navegador PC/movil: Storage demo conserva01.png, HTTP200/bytes exactos,
pero sin firmante el consumidor muestra0 sin aviso. Capturas01-1 y03-1,
JSON01-0 y03-0 en docs/evidencias/96-artifactos.

**Limite:** el emulador no tiene firmante Google. NO demuestra cuenta publicada
rota; demuestra error convertido en cero y consumidor real conectado.
No cambiar ACL/permisos/credenciales para hacer pasar QA. No duplicar
sustitucion de archivos aprobada92. Reemplazo rechazado conserva preview y
contador: sospecha descartada, mantener ese control.

## Correccion y aceptacion pendientes

- Distinguir lectura exitosa vacia, fotos disponibles y error. Resultado
  estructurado o error propagado acorde al proyecto, no[] para fallos.
- Aviso y reintento real; no contador0 como exito ni reemplazos basados en
  listado desconocido. Conservar fotos previas si recarga falla.
- UNA URL fallida: parcial con aviso o error completo explicito, nunca
  descartar silenciosamente todas las otras ni inventar faltantes.
- Recuperacion debe restaurar fotos/contador sin duplicar ni sobrescribir.
- Conservar galeria realmente vacia y subida rechazada que YA pasan.

Sondas ejecutadas:96-video-lector.test.tsx2pass/2fail;
96-video-lector-browser.spec.ts2pass/2fail PCmovil. Una causa, no cuatro bugs.
Prueba permanente propuesta PENDIENTE:tests/e2e/video-vida-error-lectura.spec.ts.
Claude registra build/SHA; Codex repite criterio afectado en SHA corregido.
Integrar con tanda144-147 existente, NO nueva PR por hallazgo.

```comprobar
archivo: src/app/actions/fiesta/video-vida.actions.ts
archivo: src/lib/video-vida/lectura-fotos.ts
usa: lecturaConError en src/app/actions/fiesta/video-vida.actions.ts
usa: getLifeStoryVideoPhotos en src/app/video-vida/[fiestaId]/page.tsx
usa: MENSAJE_LECTURA_FALLIDA en src/app/video-vida/[fiestaId]/page.tsx
usa: lectura.estado en src/app/api/video-vida-photos/[fiestaId]/download/route.ts
usa: lectura.estado en src/app/evento/video-vida/[fiestaId]/page.tsx
usa: lectura.estado en src/app/(app)/fiestas/nueva/video-vida/page.tsx
prueba: src/__tests__/video-vida-error-de-lectura-no-es-galeria-vacia.test.tsx
prueba: src/__tests__/video-vida-descarga-avisa-lo-que-falta.test.ts
prueba: tests/e2e/video-vida-error-lectura.spec.ts
prueba: docs/evidencias/96-video-lector.test.tsx
prueba: docs/evidencias/96-video-lector-browser.spec.ts
```
