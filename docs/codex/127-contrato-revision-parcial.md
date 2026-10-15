# Revision127 - contrato y retest focalizado164

Area: `contrato` (principal), `portal` (solo el control164).
Commit: `ce1ac07d1bb16c24dd73e2d26ac55038028a2472` de main.
Hallazgos: ninguno nuevo en los casos ejecutados. **Revision PARCIAL, no area limpia.**

Claude y Gemini programan siempre; Codex SOLO audita, prueba y registra.
No se modifico app, dependencias, permisos, datos de negocio ni comportamiento.
No se compilo ni fusiono. No hay PR abierta al consultar. La cabeza privada de
Claude NO CONTRASTADA; no se supone que coincide con main.

## Confirmado

- Orden164 ya tiene implementacion en main y cierre en YA-RESUELTO; no enviarla
  de nuevo a Gemini. Funcion real `saveInvitationTemplate` y consumidor real
  `InvitationTemplatesPage/handleCreateNewTemplate` comprobados.
- Ocho suites existentes ejecutadas:34tests PASS,0fallos,0omitidos.
- Contrato: generacion con ajustes y clausulas del dueno, sustitucion de datos,
  fechas y horas conservadas, fecha civil de Uruguay en recibo/contrato.
- Constancia digital: no marca contrato en papel firmado, no contrata ni crea
  sena; exige aceptar plan cuando corresponde y omite IP en vista del cliente.
- Sena contractual: reintento conserva un pago/ID por presupuesto; dos
  presupuestos distintos conservan senas independientes.
- Plantilla164: misma identidad repetida/concurrente da un registro; creaciones
  deliberadas distintas dan dos, bajo doble EN MEMORIA de la base.
- Decoracion164: componente renderizado y clases verificadas; no es medicion
  de color computado ni prueba visual del navegador compilado.

La suite mezcla pruebas de comportamiento con comprobaciones de fuente/clases:
34PASS no significan34flujos end-to-end. Se conservaron los nombres y resultados
por caso en `docs/evidencias/127-contrato-y-retest-jest.json`.

## Todavia no contrastado en esta fuente

- Recorrido completo desde edicion contractual hasta documento final impreso/
  PDF, y carga del contrato en papel, en navegador PC y movil.
- Firma/constancia desde una sesion ficticia de cliente, persistencia del
  documento y autorizacion real del transporte; las unidades usaron dobles.
- Retest nativo164: HTTP200 perdido DESPUES de commit, recarga y retry desde la
  pantalla, mas color/fondo computados despues del arreglo.
- El resto de carpetas asignadas a contrato (`settings/templates` tambien
  contiene layouts, carga, invitaciones y reuniones). El nombre del area no
  reemplaza la lista de consumidores ni implica que todas esas plantillas se
  revisaron aqui. No se propone cambiarlas ni cambiar la estructura aprobada.

No es una lista de errores nuevos para programar. Existen pruebas preparadas,
incluida `tests/e2e/contrato-constancia-mantiene-papel.spec.ts`, pero no se
ejecutaron aqui. No se contaron como aprobadas por existir.

## Entorno comprobado, sin suposiciones

Checkout Codex no tiene compilacion ce1 aprobada disponible: su recibo local
`125-build-execution.json` dice b520f7ce, fuente distinta. Ningun servidor
escucha3300/3301/3302/8085 y GET127.0.0.1:3300/api/health falla por conexion
rechazada. La carpeta historica Desktop/app/app-AK no existe en este host.
Eso NO es un fallo publicado de la app. No se relanza el build antiguo para
adjudicarle el arreglo nuevo ni se pide reprogramar el entorno114 ya entregado.

Para la parte de navegador, Claude puede reutilizar su compilacion QA aprobada
actual y dejar acceso/artefacto verificable desde este host: SHA de app y
dependencias, respuesta de health, datos sinteticos y credenciales ficticias.
No mandar .env, claves, cookies reales ni las19fiestas originales. Codex no
compila por defecto ni altera el reparto para resolver ese requisito.

## Registro14 y limites

En `docs/codex/areas.json` hay0limpias,2sin-revisar y12con-hallazgos. Sus ultimas
revisiones son anteriores a125/126. Eso describe la falta de un cierre de AREA
entera bajo ese metodo, no demuestra que cada pantalla de contrato/portal nunca
se miro. No borro el historial ni marco14limpias con este retest focalizado.

No se abrio una orden de programacion nueva ni se afirma ceroerrores globales.
Proveedores reales, OAuth, Hosting, hardware y datos originales no se probaron.

## Incidencia de la propia QA

Primera corrida: `AK_USE_LOCAL_JSON_ONLY=true` activo la rama JSON de la accion,
pero la suite de plantilla usa un doble `createDataItem` que simula Firestore;
su `writeData` es un no-op. Dio3FAIL y31PASS, no un fallo app. Se archivo intacto
en `127-before-qa-local-mode-jest.json`. Sin tocar codigo ni expectativas, se
corrigio solo el modo del proceso (`AK_USE_LOCAL_JSON_ONLY=false`) y paso34/34.
Las acciones de dinero/autorizacion tuvieron dobles; credenciales centinela y
claves externas vacias. Ningun servicio ni SDK real iniciado, agente cerrado,
los dos archivos locales ajenos siguen sin tocarse.
