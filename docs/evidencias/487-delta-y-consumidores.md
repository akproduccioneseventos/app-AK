# 487 — Delta de consumidores y cobertura existente

Comparación inmutable `917a98e32c63fe2f832f5cdc16db87f4fc722b6c` → `978af7d65a60bd287f3ee3cc05037a29566074f4`; solo `src`, excluyendo cambios de tests y docs al clasificar producción. Checkout documental permanece en `099ea3c7…`; no es fuente de aplicación.

## Consumidores y specs/casos que sí corresponden

- **Error vs. ausencia / acceso por perfil:** `src/app/actions/fiesta/fiesta.actions.ts` (`leerFiestaConEstado`, `getFiestaParaPantalla`, `getFiestaById`) alimenta páginas internas cambiadas y `src/app/(app)/invoices/[id]/page.tsx` (`fetchData`, estado `error`). Casos concretos en `src/__tests__/una-falla-de-lectura-no-dice-que-no-existe.test.tsx`: “con readData que tira…”, “con archivo ausente…”, sesión de personal sin `clientPortalSettings` y página de invitados que muestra error sin decir inexistente. `src/__tests__/factura-ausente-no-queda-cargando.test.tsx`: factura ausente; carga rechazada/fiesta ausente en carta de tragos, gestión de invitados y tótem. `src/__tests__/387-factura-error-no-es-ausencia.test.tsx`: factura realmente ausente, lectura pendiente y lectura fallida. Son UI/acciones con `readData` mockeado, no SDK/Firebase.
- **PIN y perfil:** consumidor `src/app/actions/fiesta/portal.actions.ts` (`cancelServicesOrParty`, `changeEventDate`). `src/__tests__/el-pin-del-cliente-sigue-pidiendose.test.ts`: PIN vacío rechazado y `1234` aceptado en ambas acciones. También usa `readData`/sesiones mock; no valida autenticación contra SDK.
- **Filtros:** `src/lib/entretenimiento/filtros-cara.ts` (`evaluarEfectoReactivo`, `dibujarFiltroDeCara`, `puedeHacerFaceSwap`) y los consumidores de evento. `src/__tests__/los-efectos-reaccionan-a-la-cara.test.ts`: umbral de boca, enfriamiento, ruleta, guiño/cejas, conteo de caras y composición del lienzo. Datos faciales y canvas son sintéticos; no cámara, modelo ni SDK. No cubre recorrido de AR en navegador.
- **Importación Instagram:** `src/lib/social-media/history-import.ts` (`parseHistoricalSocialArchive`, lectores `File`/`Blob`). `src/__tests__/history-import.test.ts`, caso “parses Instagram official export JSON with media array”; `File`/JSON se construyen en memoria. No es archivo real de Instagram ni llamada al SDK/proveedor. `galeria-historial-instagram-completo.test.ts` cubre consumidor de feed/historial guardado con `data-service` y sincronizadores mockeados, no la ruta UI de importación.

## Sin cobertura demostrada en estos candidatos

El diff de `src/app/ak-internal-experience-polish.css` cambia selectores y excepciones visuales; `src/__tests__/ak-css-cascade-guard.test.ts` solo protege orden/estructura de hojas, no resultado visual de esos selectores. `tests/e2e/barra-listo-contraste.spec.ts` rasteriza rutas autónomas y `/empresa`, pero no demuestra el cambio del CSS ni todos sus consumidores. No atribuirle PASS visual. Tampoco hallé caso existente que recorra las páginas AR cambiadas y compruebe sus estados/interfaz; los tests de filtros son lógica aislada.

## Recibos y límites

480 identifica estas cinco suites: 19 tests, 8 PASS/11 FAIL iniciales; los 11 errores React `act` fueron de modo `production`, no evidencia de 11 defectos. 482 reejecuta solo tres suites en modo `test`: 11/11 PASS (las tres suites ReactDOM de lectura/factura); conserva el recibo inicial. Esto no certifica CSS, AR, SDK, importación con export real ni el delta completo. Los recibos 253/483 mantienen expresamente límites de aceptación; no convierten ejecuciones anteriores sobre `917` en aprobación de `978`.

## Lista ejecutable corta

1. Revisar en 978 las cinco suites citadas en 480; para resultado ReactDOM usar el recibo 482, no reclasificar los FAIL iniciales como fallos de app.
2. Al validar interfaces restantes, añadir/ejecutar evidencia visual dirigida para selectores CSS y pantallas AR; no existe aquí un caso existente que las cubra.
3. Mantener separados mocks/fixtures y pruebas contra SDK/proveedor: estas suites no hacen lectura real Firebase ni importan un archivo real de cuenta.
