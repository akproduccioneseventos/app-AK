# Auditoria706-708 - Cocina y resumen de encuestas

27/10/2026. Fuente main `c0add57f6237f666db97e7e902ef75f6c8d97479`.
Claude publicado `0c355975dbc6d280a115b69606ef3ed5527f998d`: sin diferencias en
helper/pagina de alergias ni helper/accion/pagina de feedback. Privados no publicados
NO CONTRASTADOS. No repetir ni interferir correcciones238Codex/239 en curso.

Once criterios ejecutados,7PASS/4FAIL: **tres defectos**, no cuatro independientes.
Archivos706/707 contienen sondas reproducibles, resultados y SHA256 de fuente.
No appedit, build, SDK, navegador renderizado, modelo o datos reales.

## K1 - P1 - La alerta no contempla mariscos declarados

ID AK-CODEX-706-MARISCOS. Helper real `detectarChoquesMenuYAlergias` en
`src/lib/catering/choques-alergias.ts`; consumidor `AlergiasContent` en
`src/app/(app)/fiestas/nueva/alergias/page.tsx`.

Entrada: plato con `allergenTags:['mariscos']`, invitado confirmado con
`dietaryRestriction:'Alergia Mariscos'`, partySize5. Salida del helper: `[]`.
Ambos valores estan declarados en los tipos y la pagina ofrece esa restriccion.
La alerta/menu y su boton a cocina dependen de `choquesMenuAlergias.length > 0`.
No estamos infiriendo ingredientes por medicina: la informacion explicita cargada
no produce alerta. No se probaron cocina real, un envio ni consumo de alimentos.

Controles: frutos_secos produce aviso5; gluten con isCeliac produce aviso5;
invitado Pendiente no entra. El defecto no justifica cambiar esa politica de RSVP.

## K2 - P1 - Reporte excluye celiaquia guardada en isCeliac

ID AK-CODEX-706-REPORTE-CELIACO. Mismo consumidor, variables
`guestsWithRestrictions`, `dietCounts` y callback `copyCateringReport`.

Entrada real permitida por modelo: confirmado, isCeliac:true, sin dietaryRestriction,
partySize5. Reporte copiado por el callback real: total5, restricciones0,
resumen vacio y nombre de familia ausente. Helper de alertasSI reconoce ese flag.
Control con dietaryRestriction:'Celiaco' pasa: aparecen nombre y5personas.

No es un formato inventado ni solo migracion antigua: GraziaTemplate envia
`isCeliac` en `onRsvpSubmit`, y `submitRsvp` de invitados.actions conserva ese flag
al crear/actualizar el invitado sin exigir dietaryRestriction. Ver esos consumidores
en la fuente indicada. No es el antiguo fallo de clipboard: clipboard exitoso simulado,
lo incorrecto es el contenido ANTES de copiarlo. Tampoco se reabre el conteo porfilas
ya corregido: conservar partySize y evitar duplicar al que tiene ambos campos.

## F1 - P2 - Analisis mensual devuelve hallazgos prefijados sin analisis

ID AK-CODEX-707-TEMAS-SIN-ANALISIS. `generarResumenFeedbackMensual` en
`src/lib/feedback/resumen-feedback.ts`, expuesto por
`getResumenFeedbackMensualAction` en `src/app/actions/feedback.ts`.

Una sola encuesta ficticia habla exclusivamente de estacionamiento. Con presupuesto
IA agotado, o con proveedor fallando, resultado.temasRepetidos devuelve:
Puntualidad en el armado / Variedad de musica en la pista / Atencion del personal.
No hay fuente ni bandera que indique sugerencias genericas, ni analisis disponible.
Dos variantes fallidas de la MISMA causa, no dos bugs. No se afirmo precision de IA:
se comprueba resultado determinista cuando el modelo no aporta ningun analisis.

Controles: sin encuestas devuelve null/0llamadas; respuesta modelo ficticia valida
se conserva; promedio comida2/1respuesta se calcula correctamente sin modelo.

La pagina settings/feedback llama a la accion y guarda resumenMensual, pero en el
SHA inspeccionado no usa esa variable para renderizar temas. NO afirmar que vimos
esas frases en pantalla. El fallo demostrado es el resultado de servidor; no se
cuenta otra falla visual ni se ordena disenar una nueva pantalla en esta tanda.

## Metodo

706: helper completo y declaraciones/callback de reporte extraidos porAST deGit;
6criterios4PASS2FAIL. Portapapeles en memoria, invitados ficticios, sin UI renderizada.
707: helper completo con proveedor/presupuesto dobles;5criterios3PASS2FAIL.
No fotos/cuentas/cargos/mensajes/hardware reales; no lectura de datos del negocio.
Sondas terminadas, no servidores. Agente economico Cicero cerrado; director comprobo
consumidores y contraste con rama publicada que el agente no habia verificado.

Reproduccion: `node docs/evidencias/706-catering-restricciones-sonda.cjs` y
`node docs/evidencias/707-feedback-respaldo-sonda.cjs`. Cada una sale1 por fallos;
no se suavizaron asserts para producir verde. `AK_QA_TYPESCRIPT` selecciona runtimeTS.

Orden240 agrupa K1/K2 paraClaude (comida) y F1 paraGemini, sin mezclar con238/239.
Verificar delta entregado antes de reintentar; no declarar arreglado por documentarlo.
