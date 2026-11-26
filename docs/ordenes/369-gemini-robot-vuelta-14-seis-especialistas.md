# Orden 369 — Robot, vuelta 14 (seis especialistas): lo que el cliente ve al cancelar, carteles de "listo" sin guardar, el freno del simulador, el calendario del invitado, los menús que se pisan y los recordatorios de cuota a ciegas

**Para Gemini. Va en la MISMA propuesta que la 350 y la 355 a la 368 (rama `gemini/orden-346`).** Si un bloque se traba,
entregá el resto y avisá cuál faltó. Antes de decir "terminé", leé `docs/ANTES-DE-ENTREGAR.md`. **Los bloques 1, 3, 5 y 6 son plata,
permisos o comida: Claude los revisa línea por línea.**

## Por qué
Tercera vuelta de los seis especialistas (26/11/2026). Cada punto lo confirmó Claude abriendo el archivo. Sin hallazgos: el saldo con
recargo de Mercado Pago, la seña con recargo, la cancelación total en el servidor, el copiloto y la agenda del simulador, las acciones de
la barra, la lista de compras en el servidor, las observaciones posfiesta y la cuenta regresiva del invitado.

## Bloque 1 — Lo que el cliente ve al cancelar servicios es lo que se le cobra
`src/app/portal/c/[accessKey]/PublicPortalClientExperience.tsx` ~764-776 (cancelación parcial) calcula
`newTotal = (originalTotal - cancelledOriginalSum) + penalty`, con `originalTotal` que ya tiene el descuento. El servidor
(`src/app/actions/fiesta/portal.actions.ts` ~1812) usa `totalTrasCancelar(remainingItems, descuentoTipo, descuentoValor)`
(`src/lib/budget/total-tras-cancelar.ts` ~34), que aplica el descuento sobre lo que queda. Con dos servicios de $100.000, 10% de descuento,
se cancela uno: el portal muestra un total de $110.000 y el servidor guarda $120.000. Que la vista previa use `totalTrasCancelar` con los
mismos ítems y descuento (y el mismo ajuste anual) que el servidor.

## Bloque 2 — Carteles de "listo" que no miran si se guardó
1. `src/app/(app)/asistente/asistente-client.tsx` ~551-558 (`handlePonerAlDia`): con `res.ejecutadas` vacío dice "Todo al día", aunque
   `res.errores` traiga fallas (`src/app/actions/tareas-automaticas.actions.ts` ~36-44) o la cuenta no tenga permiso. Si hay errores,
   que los diga; si no se pudo correr, que diga por qué.
2. `src/components/fiestas/panels/musica.tsx` ~160-163: "Briefing Generado… guardado en la fiesta" sin mirar lo que devuelve
   `updateMusicaFiestaActual` (`src/app/actions/fiesta/musica.actions.ts` ~11-29). Si no guardó, avisarlo y dejar el texto en pantalla.
3. `src/components/fiestas/panels/muro-social.tsx` ~1457-1461: "Portada eliminada" sin mirar `updateSocialGallerySettingsFiestaActual`.

## Bloque 3 — El freno del simulador no se saltea cambiando el teléfono
1. `saveSimuladorV2Lead`, `src/app/actions/simulador-v2.ts` ~136-142: el freno sólo corre si hay teléfono y cuenta **por teléfono**.
   Cambiando el número (o dejándolo vacío) un robot carga prospectos y presupuestos sin tope, y cada uno le avisa al dueño. Que cuente por
   conexión (sin `identity` del visitante), como `src/app/actions/simulator-agenda.ts` ~62-66, y que corra siempre.
2. `src/app/actions/armado-rapido.ts` ~114: `checkBotShield(data.clienteContacto || data.clienteNombre || …)`: el mismo problema; que
   cuente por conexión.

## Bloque 4 — Lo que ve el invitado y el dueño, con la hora de Uruguay (pregunta 70)
1. "Agregar al calendario" (`src/components/invitacion/AddToCalendarButton.tsx` ~13-24) recibe sólo la fecha (`fiesta.configuracion.fechaEvento`,
   p. ej. `src/components/invitacion/templates/BodaCampoTemplate.tsx` ~117) y la agenda a las **00:00**. Que las plantillas pasen la fecha
   con `horaEvento`, y que el componente arme inicio y fin con la hora de Uruguay. Mirá todas las plantillas de
   `src/components/invitacion/templates/`.
2. `src/lib/presencia-digital/resenas-seguimiento.ts` ~62-67: "Hace N días" con `new Date(fechaStr)` y milisegundos; entre las 21 y las 24
   da un día de más. Usá `diasHastaEnUruguay` (en negativo) de `src/lib/utils.ts`.
3. `src/app/invitacion/[fiestaId]/invitacion-publica-client.tsx` ~742: el botón de copiar alias y cuenta mide unos 32 px: `min-h-10`.

## Bloque 5 — Menús y lista de compras
1. `saveMenuInterno` (`src/app/actions/menus-catering.ts` ~258) guarda con `updateDataItem` **el menú entero que mandó la pantalla**. Si otro
   aplicó "Ajustar márgenes" en el medio, publicar el menú desde la lista (`src/app/(app)/empresa/menus/page.tsx` ~142) devuelve márgenes y
   precios a los de antes, y `recalculateMenu` (~110-111) conserva el precio viejo. Que guarde con `mutateDataItem` **sólo los campos que
   cambió la pantalla** sobre el menú actual (publicar = sólo `estadoPublicacion`), sin salir del turno de menús.
2. `src/components/panels/catering--lista-compras.tsx` ~425: `filter(e => e.proveedorId !== nuevo.proveedorId && e.proveedor !== nuevo.proveedor)`
   saca de la pantalla al otro proveedor con el mismo nombre (y su pago). Que compare por `proveedorId` cuando los dos lo tienen, como
   `mismoProveedor` de `src/app/actions/fiesta/catering.actions.ts` ~26-29.

## Bloque 6 — Los recordatorios de cuota no trabajan a ciegas (pregunta 244)
1. `leerFacturasSinGuardia` (`src/lib/invoices/leer-facturas.ts` ~21-24) hace `readData(...)` y enseguida `.map(...)`: **la copia pierde la
   marca de lectura fallida** (`esLecturaFallida`, `src/lib/marca-de-lectura.ts` ~39). Con la base caída, `ejecutarEscaneoDeRecordatorios`
   (`src/app/actions/invoices.ts` ~1020-1063) no prepara ningún aviso, devuelve `success: true` y la tarea figura corrida
   (`src/app/api/cron/recordatorios-de-pago/route.ts` ~37, `src/lib/automatico/al-entrar-a-la-app.ts` ~262-269). Que la marca pase a la
   copia (`marcarLecturaFallida`, ~53) y que el escaneo devuelva falla si las facturas **o** los mensajes programados
   (`src/app/actions/scheduled-messages.ts` ~29) vienen marcados. Sin la lista de mensajes, no se arma ningún aviso (se duplicaría).
2. Los avisos que arma el escaneo llevan un id fijo por factura y cuota, para que un segundo escaneo no arme otro
   (`src/lib/whatsapp-automation-engine.ts`, donde se arma `newMsg`).

## Barrido en toda la app
- Copias que pierden la marca de lectura fallida (pregunta 244): `grep -rnPzo "readData<[^>]+\[\]>\([^)]*\[\]\);\s*\n\s*return \w+\.(map|filter)\(" src`.
- Cuentas de la pantalla que el servidor hace distinto: buscá en `src/app/portal` y `src/components` cuentas de total, saldo, multa o
  reembolso que no usen las funciones de `src/lib/budget`.
- Frenos que cuentan por un dato que escribe el visitante: `grep -rn "identity:" src/app/actions` y `grep -rn "checkBotShield(" src`.
- `await <guardar>(...)` seguido de un cartel de éxito: `npm run "dice-que-si?"`.
Plata, comida y permisos: se lista y Claude lo revisa.

## Lo que NO hay que hacer
- No cambiar el 30% de multa ni el ajuste anual.
- No cambiar los presupuestos que aparecen al poner el celular (decisión del dueño del 11/11).
- No mandar los recordatorios solos: se preparan en la bandeja, como hoy.

## Qué tiene que comprobar la prueba
- `src/__tests__/la-cancelacion-muestra-lo-que-se-cobra.test.ts`: con 10% de descuento, la vista previa y `totalTrasCancelar` dan el mismo
  total para la misma selección.
- `src/__tests__/el-freno-del-simulador-no-se-saltea.test.ts`: cinco altas desde la misma conexión con cinco teléfonos distintos: la quinta
  se frena.
- `src/__tests__/publicar-un-menu-no-deshace-el-ajuste.test.ts` (base que devuelve **copias**): ajustar márgenes y después publicar con la
  copia vieja deja el margen ajustado.
- `src/__tests__/los-recordatorios-no-trabajan-a-ciegas.test.ts`: con las facturas marcadas como lectura fallida, el escaneo devuelve
  `success: false` y no marca la corrida; dos escaneos seguidos no arman dos avisos para la misma cuota.
- `src/__tests__/el-calendario-del-invitado-tiene-la-hora.test.ts`: fiesta el 20/12/2026 a las 21:00 → el enlace dice `20261220T210000`.

```comprobar
usa: totalTrasCancelar en src/app/portal/c/[accessKey]/PublicPortalClientExperience.tsx
no-usa: if (res.ejecutadas.length > 0) { en src/app/(app)/asistente/asistente-client.tsx
no-usa: identity: telefonoDelFreno, en src/app/actions/simulador-v2.ts
no-usa: checkBotShield(data.clienteContacto en src/app/actions/armado-rapido.ts
usa: horaEvento en src/components/invitacion/templates/BodaCampoTemplate.tsx
usa: diasHastaEnUruguay en src/lib/presencia-digital/resenas-seguimiento.ts
no-usa: sinBuffetVirtual(menus[index])); en src/app/actions/menus-catering.ts
no-usa: e.proveedor !== nuevo.proveedor en src/components/panels/catering--lista-compras.tsx
usa: marcarLecturaFallida en src/lib/invoices/leer-facturas.ts
usa: esLecturaFallida en src/app/actions/invoices.ts
prueba: src/__tests__/la-cancelacion-muestra-lo-que-se-cobra.test.ts
prueba: src/__tests__/el-freno-del-simulador-no-se-saltea.test.ts
prueba: src/__tests__/publicar-un-menu-no-deshace-el-ajuste.test.ts
prueba: src/__tests__/los-recordatorios-no-trabajan-a-ciegas.test.ts
prueba: src/__tests__/el-calendario-del-invitado-tiene-la-hora.test.ts
```
