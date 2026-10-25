# Inventario para publicacion 362-389

NOTA DEL DIRECTOR: inventario auxiliar preliminar, no manifiesto de entrega.
Las categorias iniciales no se usan como una particion conciliada y el conjunto
cambio mientras se cerraba la tanda.399-manifiesto-final.json lo sustituye
para nombres, tamanos, hashes y publicacion efectiva; no copiar estos totales
como una prueba de integridad o verificacion remota.

Alcance: archivos observados en `docs/evidencias` cuyo nombre comienza por 362-389; indice `253-recuento-unico-auditoria.md` consultado solo como indice. No se leyeron contenidos de JSON ni trazas grandes. Esto es inventario, no auditoria integral ni verificacion de publicacion.

## Recuento y tamanos

104 archivos; total 10,156,860 bytes (9.69 MiB, basado en tamanos del sistema).

| Clase por extension | Cantidad | Bytes |
| --- | ---: | ---: |
| Fuentes `.mjs`/`.cjs`/`.ts`/`.tsx`/`.md` | 28 | 109,483 |
| JSON (recibos/resultados/configuracion, sin inspeccionar contenido) | 50 | 3,134,528 |
| Logs `.log` | 15 | 6,733,505 |
| Logs/artefactos comprimidos `.gz` | 13 | 190,938 |

Fuentes: 14 `.mjs` (66,287 B), 2 `.cjs` (2,532 B), 6 `.ts` (16,308 B), 1 `.tsx` (2,596 B), 5 `.md` (23,818 B). Los `.gz` pueden ser scripts comprimidos o logs; extension sola no identifica el contenido.

## No olvidar

- Unico TSX observado: `387-factura-error-no-es-ausencia.test.tsx` (2,596 B).
- Documentos de evidencia `.md`: `362-consistencia-informe-final.md`, `365-conciliacion-fallos-nativos.md`, `369-timeouts-jest-contrato.md`, `383-entretenimiento-diagnostico-final.md`, `384-web-diagnostico-final.md`.
- Para preparar la publicacion, no omitir tampoco las fuentes `.mjs`, `.cjs`, `.ts` y el test `.ts` inventariados: son parte del conjunto, no recibos.

## Artefactos y advertencias

- Mayores archivos observados: `386-jest.log` (6,248,225 B), `386-jest-resultados.json` (2,533,695 B), `386-jest.log.gz` (139,299 B). No se leyeron los dos archivos grandes; el comprimido se clasifico por extension.
- Hay logs sin comprimir y sus versiones `.gz` en algunos prefijos. Confirmar expresamente cuales deben viajar; no asumir que el comprimido reemplaza al original.
- La presencia local en el directorio no demuestra que un archivo este versionado, incluido en un commit o publicado. Verificar el manifiesto/commit remoto antes de declarar entrega; pueden existir artefactos locales no publicados.
- Inventario basado en nombres y tamanos observados en esta copia; no afirma resultados de pruebas, integridad, cobertura ni cierre de auditoria.

Conclusion: usar esta lista como control de empaquetado; confirmar remotamente el conjunto antes de anunciarlo publicado.
