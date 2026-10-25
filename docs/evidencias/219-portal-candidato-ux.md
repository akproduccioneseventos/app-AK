# Contraste UX portal cliente, tanda candidata

- Fecha: 2026-10-22.
- Tanda pública contrastada: `b91bdbeff7d3db7489fabdadd599776376c0577a` (PR1353).
- Rama de trabajo observada: `codex/216-contraste-20261022`, HEAD `9d1a07f99b8d6972995ff8c2b9f1a5a1ac4a81de` (igual a `main` indicado; no es el SHA candidato).
- Alcance limitado a evidencia UX de los cuatro archivos requeridos. Solo lectura del código candidato; no navegador, app, build, pruebas, servidor ni evaluación de seguridad/dinero.
- Graphify puntual intentado: `graphify query "Portal cliente PublicPortalClientExperience pasos entretenimiento comprobante album fotografia General"`; no disponible porque falta `graphify-out/graph.json`. Sin reconstruir índice.

## Resultados

1. **Cinco pasos y entretenimientos configurados — RIESGO / NO CONTRASTADO como flujo configurable.** `portal-modules.ts:37-74` declara cinco pasos y asigna módulos (paso 1: 47-53; paso 2: 55-60; paso 3: 62-65; paso 4: 67-68; paso 5: 70-74). Pero en el componente candidato, el consumidor visible usa acordeones propios: `PublicPortalClientExperience.tsx:1294-1295` para organización y `1462-1466` para contable; no importa/consume `PASOS_PORTAL` ni `portalModules` (búsqueda exacta en ese archivo, sin resultados). Entretenimientos son tarjetas descriptivas en `PublicPortalClientExperience.tsx:1300-1314`, con activación de la tarjeta de fotos condicionada en el cálculo de `serviceCards` (línea aproximada 420; referencias `videoVida.visible`, `fotografiaYFilmacion.visible`, galería). Esto no acredita que los cinco pasos o cada módulo configurado tengan consumidor visible individual.

2. **“Informar pago” llega al formulario — RIESGO PRESENTE EN EL CÓDIGO, no probado.** Hay botones que abren estado `paymentModalOpen` (`PublicPortalClientExperience.tsx:1131-1132`, `1527-1531`) y handler con monto/`submitClientPayment` (`898-924`); no se encuentra JSX de diálogo ligado a ese estado ni formulario de comprobante/notas. Los campos de estado existen (`853-858`) y el lector de archivo (`890-896`), pero en este SHA no hay consumidor JSX visible para ellos. La orden 212 documenta el mismo faltante histórico (`docs/ordenes/212-gemini-portal-del-cliente-lo-que-se-ve.md`, bloques 1-2); no se toma como evidencia de ejecución.

3. **Álbum oficial desde `fotografia.servicios` — RIESGO PRESENTE EN EL CÓDIGO.** El DTO candidato transmite de `fotografiaYFilmacion` solo `notasGenerales` (`page.tsx:87-89`); no pasa `servicios`. El consumidor de fotos solo muestra esas notas y estado/video/mural (`PublicPortalClientExperience.tsx:1370-1386`), sin enlace de entrega. No se observa camino de datos DTO→enlace “Ver entrega” en los archivos revisados.

4. **Acceso General y componentes existentes — CORRECCIÓN/PRESERVACIÓN PRESENTE, AÚN NO PROBADA.** Se conservan los bloques de acceso con fases y condiciones (`PublicPortalClientExperience.tsx:251-281`), el acordeón contable siempre renderizado y organización bajo `access.canSeeOrganization` (`1294-1295`, `1462-1466`), además de render del componente desde la página (`page.tsx:210-219`). No se encontró un control literal llamado “General” en el componente; no afirmar UX de ese control ni funcionamiento de permisos. El alcance no evalúa cálculos ni permisos finales.

## Límites y comprobación

- Clasificación es estática para el SHA público indicado; no equivale a comportamiento reproducido, pruebas aprobadas ni despliegue verificado. Sin navegador por instrucción.
- Las referencias `git show b91bdbeff7d3db7489fabdadd599776376c0577a:ruta` confirmaron la existencia de los cuatro archivos requeridos, incluida la orden 212.
- Comprobar: archivo: `src/app/portal/c/[accessKey]/PublicPortalClientExperience.tsx`, `src/app/portal/c/[accessKey]/page.tsx`, `src/lib/portal/portal-modules.ts`, `docs/ordenes/212-gemini-portal-del-cliente-lo-que-se-ve.md`; usa: `PublicPortalClientExperience`, `mapFiestaToPortalDTO`, `portalModules`/`PASOS_PORTAL`; prueba: pendiente (no ejecutada; contraste estático únicamente).
