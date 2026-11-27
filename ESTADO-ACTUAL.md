# Estado actual — 27 de noviembre de 2026

## Publicado
- #1474 (336–342 + robot sembrado) y #1476 (343–345, auditoría profunda 24/11, Club Uruguay $19.990 y Orden 350 en `main`).
- `origin/main` trajo órdenes 367 a 376 (vueltas 12–21 de seis especialistas), ya incorporadas en `gemini/orden-346`.

## Rama actual (`gemini/orden-346`) — PR #1475 abierta (sin fusionar)
- **Incorporada revisión de Claude (`origin/claude/app-debug-stabilize-m70e6z`)** y completada **Orden 377**:
  * Robot insumos/activos: sembrado de `ing-harina` y `lc_psitio` en `tests/robot/sembrar.ts`, texto `"Guardando..."` en ambos editores, permanencia en `activos-fijos/[id]/editar`, prueba aislada `src/__tests__/el-insumo-y-el-activo-guardan.test.ts`.
  * E2E: `el-simulador-respeta-el-tipo-de-fiesta.spec.ts` en verde; Touchpix conserva `"con efecto local, la IA no respondió"` también en espera de aprobación y `89-ia-no-frena-la-fila.spec.ts` limpia rutas al cerrar contexto.
- **Arreglo publicación automática del blog (`src/__tests__/el-blog-publica-solo.test.ts`):** `/public/blog`, `/public/blog/[slug]` y `/sitemap.xml` en `force-dynamic`, aislamiento de `includeInstagram: false` en cron/al-entrar/acciones de blog, `seoSucceeded` sin falsos negativos, alineación a 48h sin pisar `ultimaCorrida.blog` cuando no publicó nota.
- **Estado PR #1475 (`gemini/orden-346`):** órdenes **346–350, 355–377** + arreglo de blog automático listos y verificados. **Gemini no mergea:** lista para que **Claude** revise y fusione.
