# Orden 375 — Robot, vuelta 20: lo que el cliente ve antes de pedir, la decoración que se pisa y los "listo" sin guardar

**Para Gemini. Va en la MISMA propuesta que la 350 y la 355 a la 374 (rama `gemini/orden-346`).** Si un bloque se traba,
entregá el resto y avisá cuál faltó. Antes de decir "terminé", leé `docs/ANTES-DE-ENTREGAR.md`. Los bloques 1, 2, 3, 6 y 7
tocan plata o permisos: Claude los revisa línea por línea.

## Por qué
Vuelta 20 del robot (26/11/2026), con los seis especialistas. Las áreas fueron fiesta y barra, contrato y portal, invitado y web,
asistente, personal y redes. Claude confirmó cada punto en el código. El cierre de barra, los recibos, la asignación de
personal por invitados y el recordatorio a invitados salieron sin hallazgos nuevos.

## Bloque 1 — El extra que pide el cliente cuesta en el portal lo mismo que al aprobarse
`src/app/portal/c/[accessKey]/PublicPortalClientExperience.tsx` ~912:
`selectedServiceAdditional = Math.round(selectedServiceBasePrice * (1 + annualAdjustmentPercent / 100))` suma el 15% **siempre**.

El servidor (`src/app/actions/fiesta/portal.actions.ts` ~1539 y ~1552) guarda el renglón sin ajuste, y el ajuste entra sólo con
`getBudgetCollectibleTotal` (`src/lib/budget/financial-guardrails.ts` ~216-235), cuando el evento es de un año posterior a la
firma y `ajusteAnualActivo` está prendido.

Ejemplo: firma 2026, evento 20/12/2026, total $200.000, extra de $50.000. El portal promete un extra de $57.500 y un total de
$257.500; al aprobarse, el total queda en $250.000.

Arreglo:
- El portal calcula "Extra ajustado" y "Nuevo total estimado" con la **misma** regla que el servidor.
- Usá la proyección que ya existe (`annualProj.applies`, la misma de ~2083-2088) o una función compartida. Sin ajuste, el extra se
  muestra sin el 15%.

## Bloque 2 — La cancelación parcial no cobra el 15% dos veces sobre la multa
`portal.actions.ts` ~1680-1690 ya ajusta la multa al año de cancelación. Después, ~1872, el saldo se guarda con
`includeAnnualAdjustment: true`, y en la cancelación parcial (~1867-1868 sólo apagan el ajuste en `cancelAll`) se le vuelve a
sumar el 15%.

Ejemplo: firma 2026, evento 15/03/2027, se cancela un servicio de $100.000 sin pagos. El papel dice "adeuda $30.000" y el portal
muestra $34.500.

Arreglo: la multa ya ajustada no lleva ajuste otra vez. El saldo guardado, el papel y `pendingDue` (~1949-1950) dicen la misma
cifra. El resto del contrato que sigue vigente sí conserva su ajuste.

## Bloque 3 — Una fiesta cancelada del todo no cambia de fecha
`portal.actions.ts` ~1976-2000 (cambio de fecha) no mira la marca de cancelación total (la usan ~1665 y ~1876). Así, una fiesta
cancelada puede cambiar de fecha:
- suma un 10% de multa sobre lo que queda (~2014);
- vuelve a prender `ajusteAnualActivo` (~2087-2088).

Arreglo:
- Si la fiesta está cancelada del todo, el cambio de fecha devuelve
  `{ success: false, error: 'La fiesta está cancelada: no se puede cambiar la fecha.' }`.
- El botón de `PublicPortalClientExperience.tsx` ~1672 no se muestra en ese estado.
- **Y la multa del 10%** (~2010-2014) se calcula sobre el total contratado, sin las multas de cambios de fecha anteriores
  (`multa_cambio_fecha_*`), como dice la adenda ("10% del total contratado").

## Bloque 4 — La decoración no se pisa entre la pantalla del equipo y el portal
`src/app/actions/fiesta/fiesta.actions.ts` ~603 mezcla `{ ...actual, ...partialData }`: la clave `decoracion` se reemplaza entera.
`updateDecoracion` (`src/app/actions/fiesta/decoracion.actions.ts` ~34-41) recibe el objeto completo que cada pantalla cargó al
abrirse:
- `src/components/fiestas/panels/decoracion.tsx` ~487 y ~501;
- el autoguardado del plano, `src/components/panels/invitados--layout.tsx` ~387-395 y ~590;
- el moodboard del portal, `src/app/portal/[fiestaId]/moodboard/moodboard-client.tsx` ~49-60 y ~78-94;
- `enviarOpinionDecoracion`, ~204-223.

Resultado: el cliente sube una foto al moodboard, el organizador guarda o mueve una mesa con la copia vieja, y la foto desaparece.

Arreglo:
- Cada pantalla manda **sólo lo que cambió**: el plano (`salonElements`, `zonasDiseno`), el moodboard (agregar o sacar un ítem,
  un me gusta) o la opinión. Una acción nueva, `mutarDecoracion(fiestaId, cambio)`, lo aplica adentro de `actualizarFiesta`
  sobre la decoración **actual**.
- Agregar una foto suma a la lista actual por id, no la reemplaza.

## Bloque 5 — "Auto-Acomodar (IA)" guarda lo que dice que hizo
`src/components/panels/invitados--layout.tsx` ~626-656: `handleAutoAssign` muestra "N invitados ubicados en mesas" y sólo hace
`setFiesta`. `autoAssignTables` (`src/app/actions/salon-ia.actions.ts` ~11-101) no guarda nada. Al recargar, nadie tiene mesa.

Además, ~39 pone `capacity: 10 // Mock capacity for now`, así que una mesa de 4 lugares recibe 10 personas.

Arreglo:
- Guardar las mesas asignadas (sólo `tableNumber` de los invitados que cambiaron, de a uno, como `updateInvitadoFiestaActual`).
- Recién con todo guardado se muestra el aviso; si alguno falla, el aviso dice cuántos no se guardaron.
- La capacidad sale de la mesa (`seats`/`capacidad` del elemento del plano; si no tiene, 10).

## Bloque 6 — La llegada con ubicación no se saltea sin avisar
`src/app/actions/accesos-personal-view.ts` ~176-198: con `llegadaConUbicacion` prendido, la validación corre sólo si hay
`salonCoords`. Si el salón no tiene coordenadas, el nombre no coincide o `salones.json` no se pudo leer, la llegada se registra
sin ubicación.

Arreglo:
- En ese caso la llegada se anota igual (no se le traba la noche al personal), pero con `ubicacionVerificada: false`. El
  Centro de la fiesta la muestra "sin verificar".
- Ajustes, junto al interruptor, lista los salones de las fiestas próximas que no tienen ubicación cargada.
- Si la lectura de salones viene marcada (`esLecturaFallida`), también queda "sin verificar".

## Bloque 7 — Un cliente con dos cuotas vencidas recibe un solo recordatorio por corrida
`src/lib/cobros/escaneo-recordatorios.ts` ~96-110: `yaSeLeAviso` mira la lista leída al empezar, y cada `avisos.push` no se suma a
esa lista. Con dos facturas vencidas del mismo `customer.id`, salen dos `pago_vencido` el mismo día.

Arreglo:
- Llevar un registro en memoria, `reservadosEnLaCorrida`, de `cliente + tipo` ya reservado en la corrida.
- Si un cliente tiene varias facturas, un solo aviso que nombre todas, con el total del saldo.

## Bloque 8 — El estado del blog pide permiso
`src/app/actions/blog.ts` ~101, `getEstadoBlogAdmin`, no pide sesión. Cualquiera ve el motivo del último fallo de la IA (por
ejemplo, "se llegó al tope de gasto del mes"), y cada llamada con más de 4 días sin nota crea un aviso (~135).

Arreglo: la primera línea de la función es `const sesion = await requirePermisoAlguno(PERMISOS.ADMINISTRACION, PERMISOS.CRM);`,
como `saveBlogPost` (~24).

## Bloque 9 — El chat de la web no dice "Anoté" si no anotó
`src/app/actions/asistente-virtual.ts` ~203-208: "Anoté lo que me contaste" sale también cuando faltan nombre o teléfono, o cuando
`captureSimulatorLeadProgress` falló.

Arreglo:
- Si faltan datos, pedir el que falta ("¿Me pasás tu nombre y un celular para mandarte el presupuesto?").
- Si falló el guardado: "No pude anotar tus datos ahora. Escribinos por WhatsApp y te armamos el presupuesto." Con el botón de
  WhatsApp.

## Bloque 10 — El texto para Google no dice "congelando"
`src/components/seo/FAQJsonLd.tsx` ~55 dice "Se reserva con una seña inicial congelando la fecha...". La palabra está prohibida
por el dueño. Cambiala por: "Se reserva la fecha con una seña inicial y el saldo se puede abonar en cuotas coordinadas hasta la
fecha de la celebración." No tocar el resto de las preguntas.

## Bloque 11 — El calendario de redes pone cada publicación en su día de Uruguay
`src/components/social-media/SocialMediaCalendar.tsx` ~46 y ~58 agrupan con `toISOString().split('T')[0]`. Una publicación de las
22:00 de Uruguay cae en la celda del día siguiente, y 21 a 23 es el horario que sugiere la app.

Arreglo: agrupar y comparar con el día de Uruguay (`getUruguayDateString` o `hoyEnUruguay(fecha)` de `src/lib/utils.ts`).

## Barrido en toda la app
- Cuentas que el cliente ve antes de pedir y que el servidor recalcula (pregunta 252): `grep -rn "annualAdjustmentPercent" src/app/portal src/components`
  y comparar cada una con lo que guarda la acción que la recibe.
- Controles de "ya se avisó" que miran sólo lo leído al empezar (pregunta 253): `grep -rn "yaSeLeAviso\|yaAvisado\|yaSeMando" src/lib`.
- Controles que se saltean cuando falta el dato con que se comparan (pregunta 254): `grep -rn "if (salonCoords)\|if (!.*) return true" src/app/actions src/lib/auth`.
- Objetos anidados guardados enteros desde la copia de la pantalla (pregunta 22): `grep -rn "updateFiestaPartial(.*{ [a-z]*: " src/app/actions`.
- Botones que dicen "listo" tras una acción que sólo calcula (pregunta 179): `grep -rn "setFiesta(" src/components/panels` y mirar
  si antes hay un guardado.
- Acciones `'use server'` sin control (pregunta 35): `grep -L "require" src/app/actions/*.ts`.
- Días agrupados con `toISOString().split('T')[0]` en pantallas (pregunta 174): `grep -rn "toISOString().split('T')\[0\]" src/components`.
- "congel" en lo público: `grep -rni "congel" src/components src/app/public src/data/*.json`.

Plata, cobros y permisos: se listan y Claude los revisa.

## Lo que NO hay que hacer
- No cambiar el 15% acumulativo, la multa del 30% ni el 10% del cambio de fecha: sólo que se cuenten una vez y igual en todos
  lados.
- No bloquear la llegada del personal por falta de ubicación del salón (bloque 6).
- No sacar el botón Auto-Acomodar.
- No cambiar el resto de las preguntas frecuentes (bloque 10).

## Qué tiene que comprobar la prueba
- `src/__tests__/el-extra-del-portal-cuesta-lo-mismo.test.ts`:
  - Con evento del mismo año que la firma, el estimado del portal y el total aprobado dan $250.000.
  - Con evento del año siguiente, los dos dan lo mismo con el ajuste.
- `src/__tests__/la-cancelacion-no-ajusta-dos-veces.test.ts`:
  - La cancelación parcial de $100.000 deja saldo $30.000 y el papel dice $30.000.
  - Una fiesta cancelada del todo no cambia de fecha.
  - Dos cambios de fecha sobre $100.000 dan $120.000.
- `src/__tests__/la-decoracion-no-se-pisa.test.ts` (base que devuelve **copias**): el cliente suma una foto, el equipo guarda el
  plano con la copia vieja, y la foto sigue.
- `src/__tests__/auto-acomodar-guarda.test.ts`:
  - Después de Auto-Acomodar, al releer la fiesta, los invitados tienen su mesa.
  - Una mesa de 4 lugares no recibe más de 4.
- `src/__tests__/la-llegada-sin-ubicacion-queda-sin-verificar.test.ts`: con el interruptor prendido y el salón sin coordenadas, la
  llegada queda con `ubicacionVerificada: false`.
- `src/__tests__/un-recordatorio-por-cliente-por-corrida.test.ts`: dos facturas vencidas del mismo cliente dan un solo aviso
  `pago_vencido`.
- `src/__tests__/el-estado-del-blog-pide-permiso.test.ts`: sin sesión, `getEstadoBlogAdmin` no devuelve el motivo del fallo.
- `src/__tests__/el-chat-no-dice-anote-sin-anotar.test.ts`: sin teléfono, la respuesta no contiene "Anoté".
- `src/__tests__/el-calendario-de-redes-usa-el-dia-de-uruguay.test.ts`: una publicación del 5/12 a las 22:00 de Uruguay queda en
  el 5/12.

```comprobar
no-usa: const selectedServiceAdditional = Math.round(selectedServiceBasePrice * (1 + annualAdjustmentPercent / 100)); en src/app/portal/c/[accessKey]/PublicPortalClientExperience.tsx
usa: mutarDecoracion en src/app/actions/fiesta/decoracion.actions.ts
usa: mutarDecoracion en src/components/panels/invitados--layout.tsx
usa: mutarDecoracion en src/app/portal/[fiestaId]/moodboard/moodboard-client.tsx
no-usa: capacity: 10 // Mock capacity for now en src/app/actions/salon-ia.actions.ts
usa: ubicacionVerificada en src/app/actions/accesos-personal-view.ts
usa: La fiesta está cancelada: no se puede cambiar la fecha. en src/app/actions/fiesta/portal.actions.ts
usa: const sesion = await requirePermisoAlguno en src/app/actions/blog.ts
usa: reservadosEnLaCorrida en src/lib/cobros/escaneo-recordatorios.ts
no-usa: congelando en src/components/seo/FAQJsonLd.tsx
no-usa: const day = new Date(post.publishDate).toISOString().split('T')[0]; en src/components/social-media/SocialMediaCalendar.tsx
no-usa: 'Anoté lo que me contaste. en src/app/actions/asistente-virtual.ts
prueba: src/__tests__/el-extra-del-portal-cuesta-lo-mismo.test.ts
prueba: src/__tests__/la-cancelacion-no-ajusta-dos-veces.test.ts
prueba: src/__tests__/la-decoracion-no-se-pisa.test.ts
prueba: src/__tests__/auto-acomodar-guarda.test.ts
prueba: src/__tests__/la-llegada-sin-ubicacion-queda-sin-verificar.test.ts
prueba: src/__tests__/un-recordatorio-por-cliente-por-corrida.test.ts
prueba: src/__tests__/el-estado-del-blog-pide-permiso.test.ts
prueba: src/__tests__/el-chat-no-dice-anote-sin-anotar.test.ts
prueba: src/__tests__/el-calendario-de-redes-usa-el-dia-de-uruguay.test.ts
```
