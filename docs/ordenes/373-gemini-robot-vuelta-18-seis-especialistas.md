# Orden 373 — Robot, vuelta 18 (seis especialistas): tokens que viajan al navegador, el proveedor contado dos veces, la seña pagada dos veces, la voz del cliente fuera del tope y las marcas de corrida que se pisan

**Para Gemini. Va en la MISMA propuesta que la 350 y la 355 a la 372 (rama `gemini/orden-346`).** Si un bloque se traba,
entregá el resto y avisá cuál faltó. Antes de decir "terminé", leé `docs/ANTES-DE-ENTREGAR.md`. **Los bloques 1 y 2 son permisos y
plata: Claude los revisa línea por línea.**

## Por qué
Séptima vuelta de los seis especialistas (26/11/2026). Cada punto lo confirmó Claude abriendo el archivo. **Siguen sin arreglar y la vuelta
los volvió a encontrar:** el clima de las fiestas y los días del diagnóstico (orden 194, bloque 13). Sin hallazgos: el resumen al contador,
Poner al día (cada cobro mira el resultado), gastos y pagos del salón, firma del webhook de Mercado Pago y su conciliación sin duplicar, el
respaldo automático, las rutas `cron/*` con su puerta, el webhook de Meta y el ingreso con Google. **Descartado:** "Pedido mandado" en la lista
de compras al copiar o abrir WhatsApp (decisión anotada en YA-RESUELTO).

## Bloque 1 — Los tokens de las redes no viajan al navegador (pregunta 249)
`saveSocialCredentials` (`src/app/actions/social-connections.ts` ~217-255) devuelve `connection: updatedConnection`, que arranca con la
conexión guardada (`...connections[existingIndex]`) y lleva `pageAccessToken`, `accessToken`, `refreshToken`, `apiKey` y `appSecret`. Lo mismo
`testInstagramConnection` (~299-396, `connection: updated`). Cambiar sólo la URL de Facebook le devuelve al navegador el token de publicación.
Que las dos devuelvan la conexión **sin secretos** (como `getSocialConnectionsPublicas`, ~44-66). Y el despachador
(`src/app/api/cron-despachador/route.ts` ~80-85) devuelve `...resultado` entero, con el texto de los errores: sin clave, que use
`respuestaDeLaTarea` como las rutas `cron/*`.

## Bloque 2 — Plata
1. **El proveedor contado dos veces.** Al guardar el presupuesto se crea `sync_budget_<servicio>` con el costo del catálogo
   (`src/app/actions/fiesta/fiesta.actions.ts` ~1036-1042), y "Sincronizar costos" crea además `auto_prov_<servicio>` con el mismo costo
   (`src/app/actions/fiesta/costos.actions.ts` ~160-166). `src/lib/costos/ganancia-evento.ts` (~111-118) cuenta los dos: un DJ de $8.000 suma
   $16.000. Que `syncAllEventCosts` no cree `auto_prov_` para un servicio que ya tiene su `sync_budget_` con `costoDeCatalogo`, y que lo ya
   duplicado se sume una vez (el pago al proveedor puede estar en cualquiera de los dos).
2. **La comparativa no suma el recargo.** `src/lib/costos/comparativa.ts` ~58-60: `gananciaReal = ingreso - costoReal` en los totales, mientras
   cada fiesta usa `ingreso + recargosCobrados - costoReal` (`ganancia-evento.ts` ~234). El total no cierra con la suma de las fiestas. Sumá
   `recargosCobrados`.
3. **Pasar cobros dice "correctamente" con la lectura caída.** `pasarCobrosPendientesAlPresupuesto` (`src/app/actions/invoices.ts` ~1099-1116)
   con la lista de facturas vacía por una lectura fallida devuelve `{ success: true, pasados: 0 }` y la pantalla (`src/app/(app)/invoices/page.tsx`
   ~127-129) dice "Se pasaron 0 cobros correctamente". Con la marca de lectura fallida (orden 369, bloque 6), que devuelva `success: false`.
4. **La seña pagada dos veces.** El checkout de Mercado Pago (`src/app/api/payments/mercadopago/checkout/route.ts` ~44-55,
   `src/lib/payments/mercadopago-server.ts` ~142-165) crea una sesión nueva en cada toque, aunque haya otra pendiente (un boleto sin pagar) para
   el mismo presupuesto y el mismo fin. Si el cliente paga las dos, entran dos señas sin marca de revisión. Que devuelva la sesión pendiente
   si ya existe, y que un pago que deja el saldo en negativo quede `requiresReview` con aviso al equipo.
5. **El reintegro parcial.** `src/lib/payments/mercadopago-core.ts` ~142-143 marca `refunded` cualquier reintegro, aunque sea parcial, y la
   pantalla (`src/components/payments/mercadopago-result-client.tsx` ~105-110) y el webhook (~52) dicen "Pago devuelto, el saldo fue
   restaurado". Con reintegro parcial, que diga cuánto se devolvió y cuánto sigue cobrado (ya se calcula `netAmount`, ~144).

## Bloque 3 — La voz del cliente pasa por el tope
`src/app/api/asistente/voz-en-vivo/cliente/route.ts` ~108-151 mira `hayPresupuestoParaIA` y registra al final, sin reservar: veinte pedidos a
la vez pasan el mismo chequeo y se pasan del tope. Y llama a Gemini con `direccionDeLaFicha` (`src/lib/asistente/voz-en-vivo.ts` ~216), que
arma la dirección con `src/ai/direcciones-google.ts`: el control `src/__tests__/toda-la-ia-pasa-por-el-cerebro.test.ts` busca la dirección
escrita y no la ve. Que reserve con `reservarConsumoIA` antes de llamar, y que el control frene también cualquier import de
`@/ai/direcciones-google` fuera de `src/ai/`. (El chat de la fiesta, `asistente-virtual.ts`, ya está en la orden 358.)

## Bloque 4 — Las marcas de las tareas no se pisan (pregunta 210)
`marcarCorrida` y `marcarFallo` (`src/lib/automatico/tareas-automaticas.ts` ~140-181) leen el archivo de marcas entero, cambian una y lo
escriben, sin turno; las llaman trece rutas y el arranque de la app a la vez. Dos tareas que terminan juntas: una marca se pierde y la tarea
figura "nunca corrió". Y `ponerAlDiaAlEntrar` (`src/lib/automatico/al-entrar-a-la-app.ts` ~175-177 y ~421-422) reescribe su estado con la foto
del principio, borrando un fallo anotado en el medio. Que las dos escrituras cambien sólo su clave, dentro de una transacción
(`mutateGenericJsonArray` o `updateDataPartial`).

## Bloque 5 — Fechas del asistente (pregunta 70)
1. `src/lib/asistente/clima-de-las-fiestas.ts` ~125-136 y `src/lib/multiagent/diagnostics.ts` ~39-44 (ya en la orden 194, bloque 13, **sin
   hacer**): la alerta de clima nunca sale el día de la fiesta, y el diagnóstico dice "faltan 0 días" para mañana y da por vencida una cuota de
   hoy. Usá `hoyEnUruguay` y `diasHastaEnUruguay`.
2. `src/lib/asistente/avisos-proactivos.ts` ~41: el tope de 3 avisos por día cuenta el día en Greenwich y se reinicia a las 21:00: pueden salir 6
   en un día de Uruguay. Usá `hoyEnUruguay(fecha)`.

## Barrido en toda la app
- Respuestas que arman el objeto con lo guardado y pueden llevar secretos (pregunta 249): `grep -rnE "return \{ success: true, (connection|account|settings|config):" src/app/actions`
  y mirar si el objeto trae `token`, `secret`, `apiKey` o `password`.
- Dos procesos que crean el mismo renglón con prefijos distintos: `grep -rn "auto_prov_\|sync_budget_\|auto_" src/app/actions/fiesta`.
- Sesiones de pago que se crean sin mirar si hay otra pendiente: `grep -rn "createMercadoPagoCheckout\|crearSesion" src`.
- Imports de direcciones de IA fuera de `src/ai/`: `grep -rn "direcciones-google" src | grep -v "^src/ai/"`.
Plata y permisos: se lista y Claude lo revisa.

## Lo que NO hay que hacer
- No cambiar quién puede guardar las credenciales: sólo lo que devuelve la acción.
- No cambiar la comisión ni el recargo de Mercado Pago.
- No borrar renglones de costo que ya tengan pagos cargados.

## Qué tiene que comprobar la prueba
- `src/__tests__/los-tokens-no-viajan-al-navegador.test.ts`: `saveSocialCredentials` y `testInstagramConnection` no devuelven `pageAccessToken`,
  `accessToken`, `refreshToken`, `apiKey` ni `appSecret`.
- `src/__tests__/el-proveedor-se-cuenta-una-vez.test.ts`: un DJ con costo de catálogo $8.000 suma $8.000 de costo después de guardar el
  presupuesto y sincronizar costos; la comparativa total incluye el recargo.
- `src/__tests__/la-sena-no-se-paga-dos-veces.test.ts`: dos checkouts de seña seguidos devuelven la misma sesión; un pago que deja el saldo
  negativo queda para revisar.
- `src/__tests__/las-marcas-de-las-tareas-no-se-pisan.test.ts` (base que devuelve **copias**): dos `marcarCorrida` a la vez dejan las dos marcas.
- `src/__tests__/la-voz-del-cliente-reserva-el-tope.test.ts`: con el tope en el último lugar, dos pedidos a la vez: uno pasa y el otro no.

```comprobar
no-usa: return { success: true, connection: updatedConnection }; en src/app/actions/social-connections.ts
usa: respuestaDeLaTarea en src/app/api/cron-despachador/route.ts
usa: recargosCobrados en src/lib/costos/comparativa.ts
usa: esLecturaFallida en src/app/actions/invoices.ts
usa: reservarConsumoIA en src/app/api/asistente/voz-en-vivo/cliente/route.ts
no-usa: const marcas = await readData<Marcas>(ARCHIVO, {}); en src/lib/automatico/tareas-automaticas.ts
usa: hoyEnUruguay en src/lib/asistente/clima-de-las-fiestas.ts
no-usa: const hoyStr = fecha.toISOString().split('T')[0]; en src/lib/asistente/avisos-proactivos.ts
prueba: src/__tests__/los-tokens-no-viajan-al-navegador.test.ts
prueba: src/__tests__/el-proveedor-se-cuenta-una-vez.test.ts
prueba: src/__tests__/la-sena-no-se-paga-dos-veces.test.ts
prueba: src/__tests__/las-marcas-de-las-tareas-no-se-pisan.test.ts
prueba: src/__tests__/la-voz-del-cliente-reserva-el-tope.test.ts
```
