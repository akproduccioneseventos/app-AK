# Triage de cierre 568

## Alcance y lectura

- Fuente probada: `978af7d65a60bd287f3ee3cc05037a29566074f4`; QA aislado `.qa-480-delta-Apsy7q`, sin servicios reales. `568-ejecucion.json` registra la tanda terminada: 31 pares, 15 PASS y 16 no-PASS. No equivale a 16 defectos.
- Se agrupan resultados por mecanismo/indicio observable; no se afirma causa raíz donde el resultado/contexto no la prueba. Este triage no reabre cobertura ya cerrada.

## Clasificación

- **Artefacto QA confirmado (2):** grilla, `ak207-la-grilla-de-caras.spec.ts`, strict locator: `getByRole` encuentra dos botones iguales y Playwright no resuelve la aserción. Es ambigüedad del selector del test, no prueba de UI rota.
- **Fotocabina, cuatro criterios NO aceptados:** los casos esperan el boton manual Publicar en el muro antes de inyectar/verificar la consecuencia de subida. El boton no llega a observarse y, por tanto, NO se prueba la etapa de rechazo/corte. El test fija autoPublish:false y SI hace clic manual: NO espera publicacion automatica. Consumidor real978 muestra ese boton bajo hayMuro; tambien tiene auto-publicacion si autoPublish, !hayMuro o navegador offline. Sin aislar fixture/etapa de captura no se acredita una causa de app ni se declara roto el test. Las seis variantes aisladas442 sobre917 son antecedentes, no un PASS actual978.
- **Selfie, dos criterios NO aceptados:** no llega a resultado terminal. Delta de medios f8f7 y comprobacion585 se registran aparte; no inferir filtracion de imagen por no alcanzar el final.
- **Medicion local fallida, no medida de produccion publicada:** carga de `/` midio3560ms frente al limite2500 del build local de produccion. NODE_ENV aqui SI era production; la tolerancia10000 del test solo aplica a desarrollo. Mantener el FAIL local sin atribuirlo automaticamente a la web alojada ni a una causa de app aislada.
- **Timeout/inconcluso (3 señales):** web de venta supera 240 s; totem vence 90 s en `beforeEach`; Bogue no llega a compartir en 90 s. El timeout describe el límite alcanzado, no su causa ni un fallo de producto aislado.
- **Muro: resultado observado, causa indeterminada:** dos contextos (desktop/móvil) no encuentran texto de éxito/error tras el intento en 45 s. Registrar la falta de respuesta visible en esa ejecución; no inferir si falló interacción, subida o criterio textual sin traza/test completo.
- **Marca/ajustes:** falla la llegada a compartir de Bogue antes de poder valorar el texto de marca; inconcluso para marca.
- **Otros no-PASS:** conservar como inconclusos/limitados por su prueba concreta; no convertir en defectos independientes sin evidencia de consumidor y resultado reproducible.

## Límites y no reauditoría

- No se infiere causa para `stock`, `totem` ni `webventas` más allá de los timeouts/contextos descritos.
- Los tres medios de `978` ya tienen delta `f8f7` y validaciones nativas 585 + audio 589; no reauditar aquí.
- No elevar fallos de selector, fixture, texto esperado o tiempo local a bloqueos de producto. No declarar aceptado globalmente: 15 PASS y 16 no-PASS siguen siendo el recuento de esta ejecución.
- Revision del director: el borrador del ayudante atribuia a autoPublish:false una incompatibilidad inexistente y suponia modo desarrollo para velocidad. Ambas afirmaciones fueron descartadas al leer el test y consumidor originales; NO son defectos de app ni cierres positivos. No trasladar sus numeros de linea antiguos como rutas actuales.
- Conciliacion596 conserva ademas los seis resultados noPASS fuera de568: cocina(captura), dos barras(oraculo de coleccion antigua), dos baselines y simulador(no clico resumen). Son22resultados noPASS dentro de258casos unicos, no22bugs. Fecha557, oraculo actual y traza556 explican sus limites sin borrar originales.

## Comprobar

- archivo: `docs/evidencias/568-batch-007-resultados.json`; usa: `ak207-la-grilla-de-caras.spec.ts`, selector `botonVerTodas`; prueba: observación documentada del strict locator; no se reejecutó.
- archivo: `src/app/evento/fotocabina/[fiestaId]/page.tsx`; usa: `handleAcceptAndPublish` y condición `fiesta.station.autoPublish`; prueba: inspección estática del consumidor; no se ejecutó prueba nueva.
- archivo: `docs/evidencias/568-batch-013-resultados.json`; usa: caso de `ak207-muro-subir-foto.spec.ts`; prueba: contextos desktop/móvil con espera de 45 s; sin nueva ejecución.
