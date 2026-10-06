# Inventario de rutas y cobertura E2E

Alcance: inventario estático en HEAD `feb90f4d40906029d6d31ba2e2abbed64461a2ad`. Rutas obtenidas con `scripts/helpers/route-inventory.mjs` (`getAllRoutes`) y cotejadas por prefijo de archivo fuente con las 14 áreas de `docs/codex/areas.json`.

## Rutas

370 rutas en total; 173 coinciden con carpetas/archivos declarados y 197 no. Conteo por área (coincidencia directa, no juicio de propiedad): plata 15, contrato 2, comida 6, permisos 2, fiesta 82, portal 7, invitado 5, web 7, redes 0, estaciones 47, barra 0, asistente 0, personal 0, automáticos 0.

Las 197 no mapeadas se agrupan por primer segmento: empresa 41, settings 41, contabilidad 9, admin 6, multiagente 6, customers 5, control-tower 5, landing 5, empleados 6, proveedores 4, marketing 4; quedan 65 repartidas entre 43 segmentos raíz de una a dos rutas (entre ellos portal-cliente 10, presentacion-led 3, blog 2, catalogo 2 y los restantes segmentos de una ruta). Esto refleja huecos/alcance parcial de `areas.json`, no áreas limpias ni fallos de la app.

## Registro E2E 66

`docs/evidencias/66-navegador-completo.json`: 968 resultados de proyecto (desktop 226 aprobados/258 saltados; mobile 154/330), correspondientes a 482 casos únicos: 224 con al menos un aprobado y 258 solo saltados. Los resultados son del commit `430b21248fefdf766da21416cd141ad4c33cc27b`, no del HEAD de este inventario; no prueban el estado actual. Entre los 224 casos únicos aprobados, clasificación orientativa por título: 62 de humo/apertura, 55 de acción o persistencia, 107 especializados/mixtos. No se infiere cobertura de cada botón a partir de cobertura por archivo o ruta.

## E2E útil para pendientes

Comandos (no ejecutados):

```powershell
node scripts/run-playwright-production.mjs tests/e2e/viaje-invitado.spec.ts
node scripts/run-playwright-production.mjs tests/e2e/la-pantalla-gigante-anda.spec.ts
node scripts/run-playwright-production.mjs tests/e2e/las-estaciones-respetan-los-ajustes.spec.ts
node scripts/run-playwright-production.mjs tests/e2e/sofia-composer.spec.ts
node scripts/run-playwright-production.mjs tests/e2e/el-cliente-le-escribe-al-equipo.spec.ts
```

Sirven como base para invitado, pantalla gigante, configuración de estaciones, compositor/IA y persistencia cliente. La orden 117 aún pide cobertura específica del video por invitado, conversación por voz, objetivos multi-paso y micrófono en reunión; crear/agregar esas pruebas antes de usarlas como evidencia. Reutilizar las dos pruebas de pantalla gigante/estaciones no demuestra los nuevos requisitos.

## Límites

No se ejecutaron pruebas ni se inspeccionó comportamiento en navegador. Los estados contabilizados son los guardados en la evidencia histórica. Saltos incluyen exclusión intencional por proyecto; no equivalen a fallos. La clasificación humo/acción se basa en títulos, con resto mixto/especializado, no en análisis exhaustivo de cada paso. El inventario dinámico sustituye segmentos por fixtures y no valida datos reales, permisos, persistencia, cada control ni despliegue. No repetir los defectos ya registrados en informes 66/orden 117.
