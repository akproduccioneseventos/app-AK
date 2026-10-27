# Auditoria704-705 - Datos nuevos del dialogo de invitacion

Fecha:27/10/2026. ID estable: **AK-CODEX-704-DIALOGO-PROPUESTAS**.
Fuente main: `c0add57f6237f666db97e7e902ef75f6c8d97479`.
Claude publicado: `0c355975dbc6d280a115b69606ef3ed5527f998d`.
No cambio en los seis pendientes de703: no se repitieron esas22 pruebas.

## Un defecto nuevo reproducido, P2

En el dialogo Crear3propuestas, nombre/fecha/salon se asignan al estado local, pero
la llamada inmediata `crearTresPropuestasDeWeb(fiestaId, propuestasColor)` no los
envia ni espera un guardado. La accion vuelve a leer la fiesta persistida anterior.
El guardado automatico separado tiene debounce2000ms; no garantiza que la lectura
del generador vea los cambios recien escritos en el dialogo.

Consumidor `src/app/(app)/fiestas/nueva/pagina-web/page.tsx`, callback
`handleCrearTresPropuestas`, linea182 de esta fuente. Accion real:
`src/app/actions/fiesta/armar-web-con-ia.actions.ts`, `crearTresPropuestasDeWeb`.

## Reproduccion y evidencia

`node docs/evidencias/704-propuestas-datos-dialogo.cjs`
Resultado: `704-propuestas-datos-resultados.json`. Cinco criterios:2PASS/3FAIL,
**un defecto**, no tres bugs independientes.

|Campo|Usuario escribe|Generador recibe|Resultado|
|---|---|---|---|
|Nombre|QA nombre nuevo|QA nombre anterior|FAIL|
|Fecha|2028-09-20|2027-01-10|FAIL|
|Salon|QA salon nuevo|QA salon anterior|FAIL|
|Color|#445566|#445566|PASS|
|Control sin cambios|Datos originales|Datos originales|PASS|

Traza: local_state_only -> permission -> read_stored_event -> generator_input ->
save_generated_proposals. Callback muestra exito de generacion con esa entrada vieja.

La sonda carga porGit el cuerpo real de la accion y extrae porAST el callback real
sin modificarlo. Base, permiso y generador son dobles explicitos en memoria.
No se ejecuta modelo ni se afirma que se vieron invitaciones reales incorrectas:
se demuestra que la entrada del generador recibe datos viejos. No navegador
renderizado, HTTP/SDK ni hook completo. Es el caso inmediato anterior al autoguardado,
permitido por el codigo y suficiente para refutar que el formulario siempre se usa.

## Contraste y no duplicacion

Blobs identicos entre mainc0 y Claude0c para ambos consumidores:
- page.tsx: `8778866a2a22fc218ae7b11efdbbb93446d64cf9`.
- armar-web-con-ia.actions.ts: `3f560ce87646c63bd466c329c7b2106937d2bdae`.
La prueba existente `la-ia-arma-la-web-sin-inventar.test.ts` llama a la accion con
ID/color y datos ya guardados; eso no cubre cambios del dialogo antes de generar.

Agente economico Carver busco antecedentes de forma acotada; fue cerrado. Su
afirmacion de que no encontraba el simbolo se descarto: principal lo extrajo y
ejecuto desde el SHA, linea182. No se uso esa conclusion para inventar ausencia.
Seis grupos anteriores siguen en orden238-Codex; NO confundir con
`238-gemini-voz-del-cliente-en-su-portal.md` de Claude. Nuevo defecto en orden239.
NO CONTRASTADO CON CAMBIOS PRIVADOS NO PUBLICADOS.

Sin appedit/build/dependencias nuevas/datos o cuentas reales/mensajes/merge/deploy.
Sin procesos persistentes. No se afirma auditoria completa ni0errores.
