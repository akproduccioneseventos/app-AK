# Orden 372 — Robot, vuelta 17 (seis especialistas): documentos de plata que baja el operador, "conectado" y "al día" que no lo son, el asistente que pisa sus listas y la fecha que se rompe al mover una fiesta

**Para Gemini. Va en la MISMA propuesta que la 350 y la 355 a la 371 (rama `gemini/orden-346`).** Si un bloque se traba,
entregá el resto y avisá cuál faltó. Antes de decir "terminé", leé `docs/ANTES-DE-ENTREGAR.md`. **Los bloques 1 y 5 son permisos y
plata: Claude los revisa línea por línea.**

## Por qué
Sexta vuelta de los seis especialistas (26/11/2026). Cada punto lo confirmó Claude abriendo el archivo. **Siguen sin arreglar** (lo
volvió a encontrar la vuelta): "mp" adentro de "compra" y los bloques pagados a medias en `ganancia-evento.ts` (orden 367, bloque 2).
Sin hallazgos: subir y borrar documentos (piden CONTABILIDAD), firma digital, rutas de contratos, comprobantes y presupuestos, acciones de
facturas, cuotas, reportes y recibos, Mercado Pago, pagos a proveedores, publicador, bandeja, comentarios, chat y memoria con transacción,
y las altas de perfiles.

## Bloque 1 — Quién baja los documentos de la fiesta (pregunta 248)
1. `src/app/api/documentos-fiesta/[...parts]/route.ts` ~35-48 y ~149: deja bajar cualquier documento (y el zip de todos) a quien
   `esDelEquipoDeLaFiesta` (`src/lib/auth/equipo-de-la-fiesta.ts`), que incluye al operador asignado (`src/lib/auth/perfiles.ts` ~63, "Nada de
   plata"). Contratos, recibos de seña y recibos de sueldo los sube sólo CONTABILIDAD (`src/app/actions/fiesta/documentos.actions.ts` ~110-115)
   y los baja cualquiera del equipo. Que los documentos de plata (contrato, recibo, seña, factura, recibo de personal, adenda, cancelación) y el
   zip pidan CONTABILIDAD (o SUELDOS para el recibo de personal); el resto, como hoy.
2. `src/app/portal/c/[accessKey]/page.tsx` ~118-124 manda al portal del cliente **todos** los `othersDocumentos`, y la ruta se los entrega
   (~149-165). Si se cargó un "Recibo de Pago de Personal" (`src/components/fiestas/panels/gestion-documental.tsx` ~39), el cliente lo ve y lo
   baja. Que al portal vayan sólo los tipos que son del cliente (contrato, recibos de sus pagos, adendas) y que la ruta rechace los demás.
3. `getCompanyInfoPublica` (`src/app/actions/settings.ts` ~148-150) saca las cuentas bancarias pero deja `emailContador`, y llega al
   navegador por el muro en vivo (`src/app/evento/muro-en-vivo/[fiestaId]/page.tsx` ~86-91). Sacalo también. Y `getEmailContador`
   (`src/app/actions/reportes.ts` ~431-434) pide sólo sesión: que pida CONTABILIDAD.

## Bloque 2 — "Conectado", "éxito" y "al día" que no lo son
1. `src/app/actions/presencia-digital.ts` ~130-131: la tarjeta de Google dice `isConnected: true` fijo. Que se calcule con la conexión
   guardada (token y `locationId`), como las otras redes de ~115-171 y como pide el publicador (`src/lib/presencia-digital/publicador.ts`
   ~345-352).
2. `sincronizarHistorialRedesAction` (`src/app/actions/social-history.ts` ~281-298) devuelve `success: true` aunque ninguna red trajo nada y
   todas dieron error, y la pantalla (`src/components/settings/panels/sincronizaciones.tsx` ~76-81) dice "¡Historial sincronizado con éxito!".
   Si ninguna red trajo datos y hubo errores, `success: false` con la red y el motivo.
3. `src/lib/automatico/tareas-automaticas.ts` ~262-270: `estado` mira sólo las horas desde la última marca, y una tarea que falló después
   de su último éxito (`falloPosteriorAlExito`) cuenta "Al día" en el contador (`src/lib/automatico/resumen-tareas.ts` ~66 y
   `src/components/settings/panels/tareas-automaticas.tsx` ~253-257). Esa tarea no es "al día": va a una categoría propia ("falló la última vez").
4. **Recontacto.** `correrRecontactoAutomatico` (`src/lib/marketing/recontacto-automatico.ts` ~124-130) devuelve `corrio: true` aunque no
   mandó nada (sin credenciales `whatsapp-remarketing.ts` ~95-106 los cuenta como salteados, y con el acceso vencido fallan todos), y
   `src/lib/marketing-automation.ts` ~145 anota `lastRecontactoAt`. Si había elegidos y `enviados === 0`, `corrio: false` con el motivo, y
   aviso al dueño.

## Bloque 3 — El asistente no pisa sus listas
1. `src/lib/ia/reglas-de-la-ia.ts` ~42-62 (`leerJson`) devuelve `[]` si la lectura falla, y `registrarDecisionDuenio` (~412-418) y
   `registrarAccionSola` (~377-380) reescriben la lista entera: con la base caída, 300 decisiones quedan en una. Que se use
   `mutateGenericJsonArray` (con la lectura adentro) y que una lectura fallida no se guarde (pregunta 244).
2. `getReglasAprendidas` (`src/lib/asistente/propuestas-service.ts` ~136-142) traga el error y devuelve `[]`, y `desestimarReglaAprendida`
   (~148-152) y `descartarNoAvisarMas` (~463-474) reescriben esa lista: se borran **todas** las reglas. (Completa la orden 361, bloque 3.6.)
3. `posponerPropuesta` (~438-447), `descartarNoAvisarMas` (~452-459) y `tomarPropuesta` (~496-503) no miran el estado: una propuesta ya
   aceptada vuelve a pospuesta o descartada, y `descartarNoAvisarMas` hace `if (!propuesta) return;` sin guardar la regla. Las acciones
   (`src/app/actions/asistente-proactivo.actions.ts` ~98-121) devuelven `success: true` igual. Que una aceptada o descartada no cambie, y que
   la acción diga si no la encontró o ya estaba resuelta.
4. `createUser` (`src/app/actions/auth.ts` ~956-984) mira si el correo existe y después agrega, sin el candado que ya usa
   `updateUserModules` (`conCandadoDeUsuarios`, ~996): dos toques crean dos cuentas con el mismo correo. Hacelo dentro del candado.

## Bloque 4 — La fecha de la fiesta se guarda como día (pregunta 70)
`updateFiestaDate` (`src/app/actions/agenda.ts` ~155-203), que usa el calendario para mover una fiesta, guarda `fechaEvento` como
`originalDate.toISOString()` (con hora). El resto de la app espera "AAAA-MM-DD": la pantalla del personal (`src/components/fiestas/panels/personal.tsx`
~410 y ~871) y la de empleados (`src/app/(app)/empleados/page.tsx` ~44) le pegan `'T00:00:00'` y muestran **"Invalid Date"**. Que guarde
el día de Uruguay ("AAAA-MM-DD") y que esas tres pantallas usen `parseUruguayDate`, que acepta las dos formas (por las fiestas que ya quedaron
guardadas con hora).

## Bloque 5 — Poner al día cobra el saldo sin el ajuste, y la barra devuelve botellas que no devolvió
1. `src/lib/contabilidad/poner-al-dia.ts` ~72 calcula el saldo con el presupuesto **sin normalizar**: si `ajusteAnualActivo` está sin definir,
   `getBudgetPaymentSummary` (`src/lib/budget/financial-guardrails.ts` ~220-225) no aplica el 15%; al guardar el cobro
   (`addPagoToPresupuesto`, que sí normaliza) aparece el ajuste como deuda nueva. Contrato de $100.000 sin pagos: Poner al día cobra $100.000 y
   después queda debiendo $15.000 que nadie vio. Pasá el presupuesto por `normalizePresupuestoFinancials` (~266) antes de calcular, igual que
   el panel.
2. `reintentarDevolucionesPendientes` (`src/app/actions/fiesta/barra-tecnologica.actions.ts` ~250-258): si el insumo ya no existe o no tiene
   número, no suma nada y **igual vacía la lista** y anota "se devolvieron las botellas". Las que no se pudieron devolver quedan en la lista y
   se le avisa al equipo con el nombre del insumo. Mirá el mismo `return` silencioso en ~337-339 y ~406-408.

## Barrido en toda la app
- Archivos y documentos que se bajan con "es del equipo" sin mirar qué tipo de documento es (pregunta 248):
  `grep -rn "esDelEquipoDeLaFiesta" src/app/api` y, por cada ruta, ¿lo que entrega es plata o sueldos?
- Estados fijos en verdadero: `grep -rnE "isConnected:\s*true|conectad[oa]:\s*true" src/app/actions src/lib`.
- Fechas guardadas con hora en campos de día: `grep -rn "fechaEvento: .*toISOString()" src`.
- `if (!snapshot.exists) return;` dentro de algo que después dice "listo": `grep -rn "if (!snapshot.exists) return;" src/app/actions src/lib`.
Plata y permisos: se lista y Claude lo revisa.

## Lo que NO hay que hacer
- No sacarle al operador los documentos que no son de plata (cronograma, planos, menús).
- No cambiar el tope de publicidad (decisión anotada).
- No mandar mensajes solos al prospecto: el recontacto sigue con su interruptor en Ajustes.

## Qué tiene que comprobar la prueba
- `src/__tests__/los-documentos-de-plata-no-los-baja-el-operador.test.ts`: el operador asignado recibe 403 al bajar un contrato o el zip y puede
  bajar un cronograma; el cliente no recibe un recibo de personal; `getCompanyInfoPublica` no trae `emailContador`.
- `src/__tests__/conectado-y-al-dia-son-de-verdad.test.ts`: sin credenciales de Google, la tarjeta dice desconectado; una tarea con falla
  posterior al éxito no cuenta "al día"; el recontacto con todos fallados devuelve `corrio: false`.
- `src/__tests__/el-asistente-no-pisa-sus-listas.test.ts` (base que devuelve **copias**): con la lectura fallida, `registrarDecisionDuenio` no
  borra las anteriores; posponer una propuesta aceptada no la cambia.
- `src/__tests__/dos-altas-con-el-mismo-correo.test.ts`: dos `createUser` a la vez con el mismo correo crean una sola cuenta.
- `src/__tests__/mover-la-fiesta-guarda-el-dia.test.ts`: mover una fiesta al 12/12 a las 22:00 guarda "2026-12-12" y el panel de personal muestra
  el 12/12.
- `src/__tests__/poner-al-dia-cobra-con-el-ajuste.test.ts`: un contrato firmado en 2025 con evento en 2026 y la marca sin definir propone cobrar
  $115.000, no $100.000.

```comprobar
usa: CONTABILIDAD en src/app/api/documentos-fiesta/[...parts]/route.ts
no-usa: isConnected: true, en src/app/actions/presencia-digital.ts
usa: mutateGenericJsonArray en src/lib/ia/reglas-de-la-ia.ts
no-usa: fechaEvento: originalDate.toISOString(), en src/app/actions/agenda.ts
no-usa: fechaEvento + 'T00:00:00' en src/components/fiestas/panels/personal.tsx
no-usa: fechaEvento + 'T00:00:00' en src/app/(app)/empleados/page.tsx
usa: normalizePresupuestoFinancials en src/lib/contabilidad/poner-al-dia.ts
prueba: src/__tests__/los-documentos-de-plata-no-los-baja-el-operador.test.ts
prueba: src/__tests__/conectado-y-al-dia-son-de-verdad.test.ts
prueba: src/__tests__/dos-altas-con-el-mismo-correo.test.ts
prueba: src/__tests__/el-asistente-no-pisa-sus-listas.test.ts
prueba: src/__tests__/mover-la-fiesta-guarda-el-dia.test.ts
prueba: src/__tests__/poner-al-dia-cobra-con-el-ajuste.test.ts
```
