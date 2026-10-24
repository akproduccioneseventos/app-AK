# Conciliacion acotada de fallos nativos

Revision principal: este archivo es triage de resultados, NO reejecucion ni
aprobacion. Donde el ayudante sugiere egreso disponible, usar SOLO el dobleLOCAL
FIS comprobado en327, nunca abrir proveedores reales. Fiesta "real" en las filas
significa el evento FICTICIO objetivo del test. Caso1 fallo en una captura ANTES
de los asserts de fecha: no dar ese criterio como PASS por haber llegado ahi.
Los 27 conservan su estado; el reensayo preparado366/368 sera solo para ellos.

Fuente: `365-nativos-para-conciliar.json` (source `3e45a4ac6b479f89605163168e31b37dc84f2d0f`; 27 registros). Se preserva el `status` original. Los recibos de origen 317/319 identifican `Failed to fetch` en instalaciones Firebase controladas; 344 es recorrido de rutas con 14 `NO_PROBADA`, no demuestra los criterios conductuales de los tests. Abrir una ruta no equivale a aprobarla. Sin cambios de fuente ni ejecuciones en esta conciliacion.

| # | caso (proyecto; titulo/linea) | status original; categoria/evidencia | siguiente criterio exacto si no probado |
|---|---|---|---|
| 1 | `143-cocina-fecha-local.spec.ts` (desktop; fecha civil; L38) | failed; captura/teardown posterior: screenshot timeout en adjunto antes de asserts L40+ | Repetir y comprobar fecha civil `[8,8,2027]` en hoja y vista impresa |
| 2 | `48-fotocabina-recuerdo-seguro.spec.ts` (desktop; ENT-01) | timedOut; captura/teardown: timeout de cierre contexto/trace, sin fallo de assertion registrado | Confirmar estacion lista con cámara activa y tomar foto |
| 3 | `48-touchpix-entrega-sin-reinicio.spec.ts` (mobile; ENT-03; L117) | timedOut; fixture/locator: `Repetir` se desprende mientras espera click; no prueba la seguridad de sesión | Verificar que subida lenta A no sobrescribe sesión B al llegar tarde |
| 4 | `89-la-barra-no-ofrece-lo-agotado.spec.ts` (desktop; stock cero) | timedOut; inconcluso: timeout genérico sin traza causal | Probar agotado, no seleccionable, al final y nunca sugerido |
| 5 | `90-lo-que-va-atras-dice-donde-quedo.spec.ts` (desktop; corte de red; L99) | failed; fixture/locator/contexto: no aparece botón publicar tras captura | Con corte de red, comprobar guardada local y nunca subida/galería |
| 6 | mismo (desktop; subida rechazada; L139) | failed; fixture/locator/contexto: no aparece botón publicar tras captura | Rechazo debe mostrar error y no afirmar subida automática |
| 7 | mismo (mobile; corte de red; L99) | failed; fixture/locator/contexto: no aparece botón publicar tras captura | Con corte de red, comprobar guardada local y nunca subida/galería |
| 8 | mismo (mobile; subida rechazada; L139) | failed; fixture/locator/contexto: no aparece botón publicar tras captura | Rechazo debe mostrar error y no afirmar subida automática |
| 9 | `carga-rapido.spec.ts` (desktop; `/quinceaneras`; L46) | failed; criterio conductual inconcluso: 2908 ms excede 2500 ms; recibo no lo atribuye a control de entorno | Medir carga inicial en condición objetivo y comparar con 2500 ms |
| 10 | `entertainment-stations.spec.ts` (desktop; cápsula, modos; L172) | timedOut; locator/contexto: botón detener grabación se desprende; timeout impide concluir assertion | Completar grabación y verificar modos y marco configurado |
| 11 | mismo (desktop; video subido; L249) | failed; criterio conductual inconcluso: no aparece `Video Cargado` en 45 s | Verificar video cargado, reproducción y marco aplicado en galería |
| 12 | `internal-dynamic-route-inventory.spec.ts` (desktop; L292) | failed; egreso/Firebase controlado: `Failed to fetch`, listado por 317/319 | Reejecutar hidratación sin errores con egreso disponible |
| 13 | `la-grilla-de-caras.spec.ts` (desktop; resultados; L288) | failed; criterio conductual inconcluso: cero títulos de resultados visibles | Probar resultado local y que selfie no salga del dispositivo ni genere red |
| 14 | `la-hoja-de-cocina.spec.ts` (desktop; L75) | failed; egreso/Firebase controlado: `Failed to fetch`, 317/319 | Abrir, imprimir y comprobar aviso de dato faltante sin error de red |
| 15 | `la-web-de-venta-no-se-rompe.spec.ts` (desktop; L72) | timedOut; captura/teardown reportado al cerrar contexto tras timeout; evidencia no separa las aserciones previas | Completar recorrido y comprobar contenido funcional de cada pantalla, no solo apertura |
| 16 | `las-estaciones-respetan-los-ajustes.spec.ts` (desktop; Bogue; L167) | failed; inconcluso/contexto: no llega a compartir en 90 s; evidencia no determina causa | Llegar a compartir y verificar texto de marca configurado |
| 17 | `layout-baseline.spec.ts` (desktop; L229) | failed; criterio visual conductual: diferencia H1 212→216 en presupuesto nuevo | Confirmar baseline aceptado para esa geometría; no hay prueba posterior exacta en recibos permitidos |
| 18 | mismo (mobile; L229) | failed; criterio visual conductual: diferencia H1 101→98 en admin | Confirmar baseline aceptado para esa geometría; no hay prueba posterior exacta en recibos permitidos |
| 19 | `limpiar-la-agenda.spec.ts` (desktop; L60) | failed; egreso/Firebase controlado: `Failed to fetch`, 317/319 | Con egreso disponible, activar limpiar agenda y verificar respuesta de acción |
| 20 | `mobile-overflow.spec.ts` (desktop runner; rutas staff) | timedOut; inconcluso: timeout global sin caso/causa individual en evidencia | Medir desborde horizontal en las rutas staff del conjunto original |
| 21 | `noche-de-fiesta.spec.ts` (desktop; L220) | failed; egreso/Firebase controlado: `Failed to fetch` al centro de fiesta, 319 | Con egreso disponible, verificar pantallas del equipo de la fiesta real |
| 22 | mismo (mobile; L220) | failed; egreso/Firebase controlado: `Failed to fetch` al centro de fiesta, 319 | Con egreso disponible, verificar pantallas del equipo de la fiesta real |
| 23 | `pantallas-con-iconos-react19.spec.ts` (desktop; decoración/PDF; L93) | failed; egreso/Firebase controlado: `Failed to fetch`, 319 | Comprobar icono y nombre de cada zona contratada en PDF |
| 24 | mismo (desktop; experiencia mundial; L129) | failed; egreso/Firebase controlado: `Failed to fetch`, 319 | Comprobar los seis bloques con icono, título y estado |
| 25 | mismo (desktop; zona digital; L170) | failed; egreso/Firebase controlado: `Failed to fetch`, 319 | Comprobar doce funciones con icono, nombre e interruptor |
| 26 | `pantallas-tocadas-tanda-12-10.spec.ts` (desktop; fiesta B; L91) | failed; egreso/Firebase controlado: `Failed to fetch`, 319 | Confirmar que pantalla con `fiestaId=B` muestra datos de B y no A |
| 27 | `prospecto-simulador.spec.ts` (desktop; cierre; L115) | failed; criterio conductual inconcluso: CTA WhatsApp/presupuesto no visible al final | Completar recorrido y verificar CTA de cierre visible y accionable |

Pendientes que requieren ejecución para concluir el criterio funcional: casos 2–4, 5–8 tras corregir/confirmar contexto de captura, 9–11, 13, 15–18, 20 y 27. Los casos 12, 14, 19, 21–26 requieren repetición con egreso disponible; su atribución ambiental no es aprobación. El caso 1 requiere confirmar assertions aunque el error registrado sea de adjunto. No se infiere aprobación de ninguna ruta del recibo 344.
