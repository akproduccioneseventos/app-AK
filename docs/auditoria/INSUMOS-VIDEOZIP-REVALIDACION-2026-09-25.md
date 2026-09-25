# Insumos y descarga de video de vida - revalidacion25/09/2026
Main2c652dddeaf33e4d709256a60a57ceac6376a225. Reutilizadas sondas historicas, sin cambiar sus criterios.
6 casos:4 PASS/2 FAIL. Funciones AST reales con persistencia, HTTP y JSZip simulados. No ZIP binario real/E2E/Storage/compilacion.

## Insumos: tres PASS
adjustAllInsumoCostsInterno:100+10%=110; fallo de propagacion devuelve success:false y explica que insumos quedaron ajustados, menus no.
propagateInsumoChangesToMenus: solo escribe menu vinculado, no el ajeno.
Consumidor src/app/(app)/empresa/insumos/page.tsx:123. Cierra los dos defectos historicos ensayados; no certifica concurrencia distribuida ni reintento del porcentaje ni cuentas completas.

## VID03 persiste: descarga parcial o vacia sin aviso
src/app/api/video-vida-photos/[fiestaId]/download/route.ts GET:
-2 HTTP correctos ->200 con2 fotos:PASS.
-1 HTTP fallido ->200 con1 foto, sin manifiesto de faltantes:FAIL.
-2 HTTP fallidos ->200 con0 fotos, sin aviso:FAIL.
La ruta hace continue ante !res.ok. Solo el limite50MB agrega advertencia, no los fallos HTTP.
Consumidor src/app/(app)/fiestas/nueva/video-vida/page.tsx:225 trata200 como descarga normal y anuncia Descarga Iniciada.
No se afirma archivo corrupto: es incompleto/vacio y se entrega sin explicarlo.
Gemini: contabilizar solicitadas/incluidas/fallidas; si ninguna se obtiene, devolver error accionable, no ZIP vacio exitoso. Si algunas fallan, avisar en pantalla y en manifiesto dentro del ZIP, sin exponer URLs firmadas/tokens; conservar fotos logradas y permitir reintento. No desactivar permisos ni permitir URLs arbitrarias.
Probar todos/uno/ninguno, HTTP403/404/500, excepcion de red, limite50MB, no duplicacion de nombres y lectura real del ZIP. Estos adicionales pendientes, no ejecutados por Codex.
Claude revisa cualquier cambio de acceso/lectura y compila el conjunto. No una PR por caso.

## Evidencias
docs/evidencias/insumos-sonda.cjs
docs/evidencias/video-zip-sonda.cjs
docs/evidencias/insumos-videozip-2c652dd-resultados.json
Ejecucion: AUDIT_TYPESCRIPT apuntando a TypeScript externo; node insumos-sonda.cjs RUTA/insumos.ts y node video-zip-sonda.cjs RUTA/route.ts.
Solo documentacion en esta entrega; sin app/build/merge ni datos reales.
Prueba integrada propuesta PENDIENTE:

```comprobar
archivo: src/app/api/video-vida-photos/[fiestaId]/download/route.ts
usa: handleDownloadAll en src/app/(app)/fiestas/nueva/video-vida/page.tsx
prueba: tests/e2e/video-vida-descarga-parcial-visible.spec.ts
```
