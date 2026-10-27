# 545 - Triage UX propuesto (snapshot 978)

Propuesta para validacion del director; no cierra casos ni ordena cambios.
Fuente de resultados: `docs/evidencias/537-triage-pendientes.json` local,
declarado para snapshot `978af7d65a60bd287f3ee3cc05037a29566074f4`.
El conteo previo al corte es 204 filas: 128 pass, 39 skipped, 37 nonPass.
El corte posterior se excluye: `docs/evidencias/527-limite-emulador.md`
registra OOM/RPC y lo clasifica inconcluso, no defecto. Diagnostico 515
aporta criterio de no atribuir fallos de fixture/timeout a la app.

## Fotocabina - Orden 90
- Evidencia exacta: 512 batch 013, desktop y mobile; ambos escenarios fallan
  en `getByRole('button', {name:/publicar en el muro/i})`, timeout 25 s
  (`537`, filas de `ak207-90-lo-que-va-atras-dice-donde-quedo.spec.ts`).
- Fuente 978: el spec configura `autoPublish:false`; los dos tests hacen captura
  y exigen el boton. Error-context del caso corresponde a evidencia de corrida,
  no prueba por si solo que la pantalla carezca de toda respuesta.
- Clasificacion propuesta: no aceptar boton ausente como defecto UX hasta
  contrastar el flujo de captura configurado con la UI real. Puede ser selector/
  supuesto de flujo; no inferir causa desde el timeout.
- Conserva: necesidad de comprobar estado local y rechazo tras captura.
  No prueba: que no exista feedback alternativo ni que el guardado haya ocurrido.

## Muro - feedback al publicar
- Evidencia exacta: 512 batch 036 desktop/mobile; tras click, locator de texto
  `/No se pudo publicar|publicada|Se subió|subida/i` no aparece en 45 s.
  En error-context desktop el snapshot sí muestra el encabezado del muro,
  saludo, tabs, boton "¿Qué querés compartir?", selector Foto/Video; el extracto
  no demuestra el estado posterior al click ni el mensaje de error.
- Fuente 978: `tests/e2e/muro-subir-foto.spec.ts` entra con enlace/token,
  selecciona archivo y pulsa Publicar; el oráculo solo acepta esos textos.
- Clasificacion propuesta: candidato a feedback realmente ausente, pero
  no contrastado: regex estrecha podría excluir otro copy visible. Requerir
  contenido completo del estado posterior antes de atribuirlo a la app.
- Conserva: comprobar respuesta perceptible al invitado. No prueba: fallo de
  subida real; el test documenta que Firebase Storage no está disponible.

## Encabezados/settings
- Evidencia exacta: 512 batch 030, test Orden 226 para `/settings/contratos/clausulas`
  y `/settings/whatsapp`, falla `getByRole('heading', ...)` a 15 s. En el primer
  caso el error-context correspondiente es `...38440...`; snapshot y contexto
  deben leerse como evidencia de corrida, no como ausencia de pantalla.
- Fuente 978: rutas existentes `src/app/(app)/settings/contratos/clausulas/page.tsx`
  y `src/app/(app)/settings/whatsapp/page.tsx`. El locator exige rol heading;
  un título visible sin semántica heading no equivale a pantalla inexistente.
- Clasificacion propuesta: discrepancia de selector/semántica accesible frente
  a posible pantalla no cargada; NO CONTRASTADO sin inspección acotada del DOM
  y contexto de ambos casos. No convertir timeout de teardown/traza en appbug.
- Conserva: rutas y expectativa de contenido identificable. No prueba: que falte
  la pantalla, ni que un título visualmente presente sea heading accesible.

## Orden 86 - aviso del mail del contador
- Evidencia exacta: 512 batch 038 desktop; se puede editar `#email-contador`,
  pulsa Guardar Información, falla espera literal `Información Guardada` por
  20 s. El snapshot del contexto muestra campos disabled y botón Guardando...;
  eso documenta estado observado, no persistencia posterior.
- Fuente 978: `tests/e2e/orden-86-pantallas.spec.ts:140-153` verifica aviso
  antes de recargar y valor. Clasificacion propuesta: feedback no confirmado;
  distinguir aviso con otro texto/estado persistente de ausencia real. El valor
  tras reload no queda demostrado por el fallo en el paso anterior.
- Conserva: tanto confirmación comprensible como persistencia son criterios
  separados. No prueba: que se haya guardado ni que no exista feedback alterno.

## Limites
- Solo UX/selector/feedback/fixtures dentro de los grupos solicitados; no revisar
  seguridad 499/506 ni dinero/permisos. No duplicar 230/229.
- 537 aporta input de triage, no aceptación independiente. Ningún caso se declara
  cerrado; la corrida posterior al cutoff sigue inconclusa por entorno.
- Los contextos 512 son artefactos locales y conservan estado de workspace.
  QA520/525 permanece intacto. Sin pruebas nuevas, QA, build ni cambios de app.
