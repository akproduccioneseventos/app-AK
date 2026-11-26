# Orden 370 — Robot, vuelta 15 (seis especialistas): la consulta del cliente no va al chat de los invitados, el panel de entretenimiento no borra fotos, el personal sigue a los invitados y las fechas de Uruguay

**Para Gemini. Va en la MISMA propuesta que la 350 y la 355 a la 369 (rama `gemini/orden-346`).** Si un bloque se traba,
entregá el resto y avisá cuál faltó. Antes de decir "terminé", leé `docs/ANTES-DE-ENTREGAR.md`. **Los bloques 3, 5 y 6 son permisos,
sueldos o plata: Claude los revisa línea por línea.**

## Por qué
Cuarta vuelta de los seis especialistas (26/11/2026). Cada punto lo confirmó Claude abriendo el archivo. Sin hallazgos: personal por
invitados según la regla del dueño, Club Uruguay a $19.990 con el tachado al doble en todos lados, el descuento del simulador y del
presupuesto con la misma base, los ajustes y la apertura de la barra, los recibos y la agenda del personal, el portal del empleado, los
videos para invitados, el cierre posfiesta y la papelería con IA.

## Bloque 1 — Lo que dice el portal del cliente
1. **"Enviado" cuando el cliente sólo lo tiene listo.** `src/app/portal-cliente/[id]/page.tsx` ~366-369: al tildar un ítem de "qué tenés
   que llevar" lo pasa a `estado: 'enviado'`, que se muestra como "Enviado" (~93). Nadie mandó nada. Que el tilde del cliente quede como
   `'listo'` con su etiqueta, o una nueva "Lo tengo listo"; "Enviado" y "En revisión" los pone el equipo. (Va junto con la orden 367,
   bloque 1, que cambia cómo se guarda esta lista.)
2. **El correo de recuperación.** ~318-324: `guardarCorreoDeRecuperacion(...).catch(() => null)` y sólo avisa si vuelve `success: false`.
   Si tira, no avisa nada y el cliente cree que quedó. Un `null` es lo mismo que una falla: mismo aviso.

## Bloque 2 — Guardar Entretenimiento no borra las fotos que subió un invitado (pregunta 210)
`saveEntretenimientoFiesta` (`src/app/actions/fiesta/entretenimiento.actions.ts` ~205-217) reemplaza `others.entretenimiento` entero con lo
que tenía la pantalla al abrir (`src/components/fiestas/panels/entretenimiento.tsx` ~935). Lo que un invitado subió mientras tanto
(`uploadEntretenimientoMedia`, ~414-425, que agrega a `media` del módulo) desaparece. Dentro de `actualizarFiesta`, que el `media` de cada
módulo salga **de la base** (lo que hay en `actual`), y que de la pantalla se tomen sólo los ajustes.

## Bloque 3 — La consulta del cliente no aparece en el chat de los invitados (pregunta 246)
`src/components/panels/portal--faq.tsx` ~62 manda la consulta del portal con `addChatMessage(fiestaId, '❓ Consulta de Cliente: …', 'Cliente VIP Portal')`,
que es **el chat público de la fiesta**: lo lee `getChatMessages` (`src/app/actions/social-gallery.ts` ~1720, sin control, a propósito para
invitados) y lo muestran el social (`src/app/evento/social/[fiestaId]/page.tsx` ~1538), el en vivo y el muro. Cualquier invitado lee lo que
el cliente le preguntó a AK. Que la consulta vaya por una acción del portal que pida `verifyPortalSession`, la guarde en la fiesta (como
`updateClientNotes`, `src/app/actions/fiesta/portal.actions.ts` ~430) y le cree el aviso al equipo con `createNotification`. Nunca al chat
público. Revisá si alguna otra pantalla privada usa `addChatMessage`.

## Bloque 4 — Fechas y textos en hora de Uruguay (pregunta 70)
1. `src/app/actions/fiesta/portal.actions.ts` ~1730, ~1821 y ~2045: "FECHA DE SOLICITUD" de la cancelación y de la adenda con
   `new Date().toLocaleDateString('es-UY')` en el servidor: después de las 21 sale mañana. Usá `hoyEnUruguay()` formateado.
2. `src/lib/automatico/parte-manana.ts` ~150 (y ~175): `Math.ceil((new Date(fechaFiesta) - ahora) / día)` → "para la fiesta en 0 días" una
   fiesta de mañana. Usá `diasHastaEnUruguay`. Y ~219-221: `ahora.getDate() <= 5` y el mes anterior con la hora del servidor: el último
   día del mes a la noche pide mandar al contador el mes que todavía no terminó. Usá el día y el mes de Uruguay.
3. `src/app/(app)/mi-dia/page.tsx` ~68: `hoy.toISOString().split('T')[0]` (usado en ~88, ~106, ~133 y ~181): a la noche, una cuota de mañana
   figura vencida y una reunión de mañana, de hoy. Usá `hoyEnUruguay()`.

## Bloque 5 — La fiesta sigue al presupuesto
1. **Carta de tragos.** `generateCartaTragosSugerida`, `src/app/actions/fiesta/fiesta.actions.ts` ~1280-1285: cualquier fiesta que no sea
   boda ni corporativa recibe `numeroPrincipal: 'Mis XV'` (un cumpleaños sale "Mis XV"). Que salga del tipo de evento, o vacío como en
   `src/lib/fiesta-defaults.ts` ~261-264, donde ya se sacó por lo mismo.
2. **El personal no se recalcula cuando cambian los invitados.** La sincronización llena las vacantes sólo si `personalAsignado` está vacío
   (`fiesta.actions.ts` ~1379-1381), con `presupuesto.invitadosCantidad || 100` (~1324), y el panel pide mozos con la cantidad guardada del
   ítem (`src/components/fiestas/panels/personal.tsx` ~193 y ~214). Si el cliente aprueba +50 invitados, el presupuesto cobra 6 mozos y la
   lista sigue en 4. Arreglo:
   - Los invitados salen de `resolveBudgetGuestTotal` (`src/lib/budget/financial-guardrails.ts` ~64), no de `invitadosCantidad || 100`.
   - En cada sincronización se recalculan con `src/lib/fiesta/personal-por-invitados.ts` **sólo las vacantes sin empleado asignado**
     (`empleadoId` vacío): se agregan las que faltan y se sacan las que sobran. A las personas ya asignadas no se las toca.
   - El panel calcula con los invitados actuales, no con `item.cantidad`.

## Bloque 6 — Sueldos y cuotas que se leen distinto
1. Con `eventSalary: 0` (lo guarda `src/app/actions/fiesta/personal.actions.ts` ~42 cuando asigna alguien sin SUELDOS), los costos, la
   ganancia y los reportes usan el sueldo del rol (`eventSalary || rol.sueldoPorEvento`), pero el recibo
   (`src/components/panels/personal--recibos.tsx` ~121 y ~259) y el reporte del empleado (`src/components/panels/empleados--reporte.tsx` ~118)
   muestran $0. Que todos usen la misma función (sacala a `src/lib/fiesta/` y usala en los cinco lugares).
2. `src/lib/simulator/payment-plan.ts` ~49: `Math.ceil(balance / installments)`: 6 cuotas de $15.834 suman $95.004 sobre $95.000. Que la
   última cuota sea lo que falta para cerrar exacto.

## Barrido en toda la app
- Algo privado que termina en una lista pública (pregunta 246): `grep -rn "addChatMessage(" src` y, por cada uno, ¿lo escribe alguien que
  no es invitado?
- Cantidades que se calculan una vez y no siguen a lo que las origina (pregunta 245): `grep -rn "length === 0) {" src/app/actions/fiesta`
  y mirar si lo que se llena "sólo si está vacío" debería recalcularse cuando cambia el presupuesto.
- Fechas de "hoy" en el servidor: `grep -rn "new Date().toLocaleDateString\|getDate() <=" src/app/actions src/lib`.
Plata, sueldos y permisos: se lista y Claude lo revisa.

## Lo que NO hay que hacer
- No cambiar la regla de personal por invitados ni sacar a nadie ya asignado.
- No cambiar los planes de pago que muestran el simulador, la presentación ni el contrato: eso lo decide el dueño (se le preguntó).
- No hacer privado el chat de los invitados: sólo sacar de ahí la consulta del cliente.

## Qué tiene que comprobar la prueba
- `src/__tests__/la-consulta-del-cliente-no-va-al-chat.test.ts`: la consulta del portal no aparece en `getChatMessages` y sí crea el aviso
  al equipo.
- `src/__tests__/guardar-entretenimiento-no-borra-fotos.test.ts` (base que devuelve **copias**): una foto subida con el panel abierto sigue
  después de guardar.
- `src/__tests__/el-personal-sigue-a-los-invitados.test.ts`: con 100 invitados y una persona asignada, pasar a 150 suma 2 mozos sin tocar a
  la asignada; con `invitadosCantidad` en 0 y 40+10 invitados, se calcula para 50.
- `src/__tests__/el-sueldo-se-lee-igual-en-todos-lados.test.ts`: con `eventSalary: 0` y rol a $3.000, el recibo y el costo dicen lo mismo.
- `src/__tests__/el-parte-de-la-manana-cuenta-dias-de-uruguay.test.ts`: a las 22:00 del 14/12, una fiesta del 15/12 dice "en 1 día", y el
  31/12 a las 22:00 no aparece el aviso del contador.

```comprobar
no-usa: estado: (!item.completado ? 'enviado' : 'pendiente') en src/app/portal-cliente/[id]/page.tsx
no-usa: guardarCorreoDeRecuperacion(fiestaId, correo).catch(() => null) en src/app/portal-cliente/[id]/page.tsx
no-usa: entretenimiento: nextEntertainment, en src/app/actions/fiesta/entretenimiento.actions.ts
no-usa: addChatMessage en src/components/panels/portal--faq.tsx
no-usa: FECHA DE SOLICITUD: ${new Date().toLocaleDateString('es-UY')} en src/app/actions/fiesta/portal.actions.ts
usa: diasHastaEnUruguay en src/lib/automatico/parte-manana.ts
no-usa: const hoyStr = hoy.toISOString().split('T')[0]; en src/app/(app)/mi-dia/page.tsx
no-usa: numeroPrincipal: 'Mis XV' en src/app/actions/fiesta/fiesta.actions.ts
no-usa: presupuesto.invitadosCantidad || 100 en src/app/actions/fiesta/fiesta.actions.ts
no-usa: findAndAdd('Mozo', item.cantidad en src/components/fiestas/panels/personal.tsx
no-usa: Number(asignacion.eventSalary || 0) en src/components/panels/empleados--reporte.tsx
no-usa: Math.ceil(balance / installments) en src/lib/simulator/payment-plan.ts
prueba: src/__tests__/la-consulta-del-cliente-no-va-al-chat.test.ts
prueba: src/__tests__/guardar-entretenimiento-no-borra-fotos.test.ts
prueba: src/__tests__/el-personal-sigue-a-los-invitados.test.ts
prueba: src/__tests__/el-sueldo-se-lee-igual-en-todos-lados.test.ts
prueba: src/__tests__/el-parte-de-la-manana-cuenta-dias-de-uruguay.test.ts
```
