# Trabajo pendiente — instrucciones para Gemini

Auditoría del 5 de agosto de 2026. Todo lo de abajo está verificado leyendo el
código: archivo y línea reales, no suposiciones.

**Revisado el 11 de agosto contra la versión principal: los doce puntos siguen
abiertos, ninguno está hecho.** Los dos primeros son los que cuestan plata todos
los días.

La app está sana: compila, 1378 pruebas unitarias en verde, 92 de navegador en
verde, 20 de seguridad de la base en verde.

---

## REGLAS

- Una rama y una propuesta de cambio por tanda. Nunca commits sobre una propuesta
  ya fusionada.
- Verificar siempre: `npx tsc --noEmit`, `npx jest`, `npm run build`.
- Nunca recompilar mientras corren las pruebas de navegador: da fallas falsas.
- Nunca correr una sola prueba filtrando por nombre en un archivo donde las
  pruebas dependen entre sí (`viaje-invitado.spec.ts`): da fallas inventadas.
- Si algo que antes andaba falla y nadie lo tocó: reiniciar el servidor de prueba
  antes de buscar el defecto.

## NO TOCAR (decisiones del dueño)

- El ajuste anual del 15% va siempre.
- El descuento del 50% del Salón Club Uruguay y el descuento ficticio del
  presupuesto son marketing.
- Las fotos del muro se descargan con el enlace directo a propósito.
- La lista de compras usa la cantidad contratada, no la de confirmados.
- Sólo se trabaja en pesos uruguayos.
- **Una misma persona puede tener hasta DOS roles en la misma fiesta** y cobrar los
  dos. Es normal en AK: alguien hace de cocina y de utilero en el mismo evento.
  Ver el punto 10, que pide poner ese tope.

---

## 1. El stock de la barra se descuenta dos veces (PRIORIDAD ALTA)

`src/app/actions/fiesta/barra-tecnologica.actions.ts`

`descontarStock()` se llama dos veces por el mismo pedido:

- línea ~373, en `createBarDrinkOrder`, cuando el invitado pide desde la pantalla
- líneas ~563 y ~592, en `updateBarDrinkOrderStatusInternal`, cuando el barman lo
  marca `entregado` (la decide `shouldDiscountBarStock` en
  `src/lib/barra-tecnologica.ts:24`)

Alguien agregó el descuento del pedido del invitado sin sacar el de la entrega. El
sistema cree que hay la mitad de bebida de la que hay: avisa "sin stock" antes de
tiempo y la lista de compras compra de más.

**Qué hacer.** Dejar un solo descuento, el de `createBarDrinkOrder`: la botella se
abre cuando se toma el pedido. Sacar las llamadas de las líneas 563 y 592, y
`shouldDiscountBarStock` si queda sin uso.

Agregar la reposición que falta: si un pedido pasa a `cancelado`, devolver el stock.

**Pruebas:** crear pedido + marcar entregado descuenta una sola vez; crear pedido +
cancelar deja el stock como estaba.

---

## 2. Los mensajes automáticos se guardan sin teléfono (PRIORIDAD ALTA)

`src/app/actions/presupuestos.ts:249` y `:847`

Las dos llamadas a `triggerWhatsAppAutomation` (`presupuesto_generado` y
`presupuesto_enviado`) no pasan `targetPhone`. El motor lo guarda tal cual
(`src/lib/whatsapp-automation-engine.ts:116`), así que el mensaje queda en la
bandeja de salida sin número: no se puede enviar sin editarlo a mano.

Consecuencia comercial: cada presupuesto generado debería disparar un seguimiento
automático al prospecto, y no sale ninguno.

**Qué hacer.** Pasar el teléfono del prospecto en las dos llamadas. Sacarlo del
lead (`nuevoPresupuesto.leadId` → buscar el lead) o del propio presupuesto si tiene
el contacto. Normalizar con `normalizeUruguayPhone` de
`src/lib/commercial/contact.ts`.

Además, en el motor: si `targetPhone` viene vacío, no programar el mensaje y dejar
registro del motivo, en vez de guardar algo inservible.

**Pruebas:** generar un presupuesto con teléfono programa el mensaje con número;
sin teléfono no programa nada y deja el aviso.

---

## 3. La pantalla del barman se queda cargando para siempre

`src/app/evento/barra/[fiestaId]/barman/page.tsx:82-94`

`loadData()` no tiene `try/catch/finally`. Si `getBarraTecnologicaDashboard()`
lanza una excepción, `setIsLoading(false)` nunca corre: la pantalla queda girando y
reintentando cada 2,2 segundos, en plena fiesta.

**Qué hacer.** Envolver en `try/catch/finally`, apagar el cargando en el `finally`
y mostrar un aviso en castellano si falla.

---

## 4. La pantalla gigante no distingue "sin contenido" de "falló"

`src/app/evento/en-vivo/[fiestaId]/pantalla/page.tsx`

No hay estado de carga ni de error inicial. Si la carga falla, muestra
"🎉 Esperando contenido..." igual que cuando todo está bien. El equipo no sabe si
se rompió o si todavía no subió nadie.

**Qué hacer.** Agregar un estado de error visible, con letra grande legible de
lejos.

---

## 5. `getFiestaActual()` devuelve la fiesta más lejana

`src/app/actions/fiesta/fiesta.actions.ts:149`

Ordena las fiestas activas por `fechaEvento` DESCENDENTE y devuelve la primera: la
más lejana en el futuro, no la de hoy. La usan diez pantallas internas, que por
defecto muestran la fiesta equivocada.

(La pantalla "mi mesa" del invitado NO está afectada: toma el evento de la
dirección web. El import de `getFiestaActual` que tiene en la línea 11 quedó sin
usar y se puede borrar.)

**Qué hacer.** Devolver, en este orden:

1. La fiesta cuya `fechaEvento` es HOY en horario de Uruguay. Usar
   `getUruguayParts()` de `src/lib/utils.ts`. **No** usar `new Date(fecha)` sobre
   un texto `AAAA-MM-DD`: corre el día para atrás.
2. Si no hay ninguna hoy, la futura más cercana.
3. Si no hay futuras, la pasada más reciente.
4. Si no hay ninguna, dejar el comportamiento actual.

Empate el mismo día: desempatar por `horaInicio` ascendente.

**Pruebas:** una hoy y otra dentro de tres meses devuelve la de hoy; sólo futuras
devuelve la más cercana; sólo pasadas devuelve la más reciente; ninguna no rompe.

---

## 6. Borrar un proveedor deja insumos huérfanos

`src/app/actions/proveedores.ts:82-92`

`deleteProveedor` no verifica si algún insumo lo está usando. Los insumos quedan
apuntando a un proveedor que ya no existe. No rompe nada, pero ensucia los reportes
y la logística.

**Qué hacer.** Antes de borrar, contar los insumos que lo usan. Si hay, no borrar y
devolver el mensaje con la cantidad.

---

## 7. El stock de la barra llega a cero en silencio

`src/app/actions/fiesta/barra-tecnologica.actions.ts:148-149`

Si se piden más tragos de los que alcanza el stock, la cantidad se recorta a cero
sin avisar. Nadie se entera de que faltó.

**Qué hacer.** Cuando el descuento dejaría el stock en negativo, registrar el
faltante y avisar en la pantalla del barman.

---

## 8. Decisiones que faltan del dueño (no avanzar sin respuesta)

1. **La moderación de la pantalla gigante viene apagada** en las fiestas nuevas. No
   es urgente: las fotos ya se analizan solas y los videos ya esperan aprobación
   siempre.
2. **Los "módulos" por usuario no se validan en el servidor.** Se asignan y se
   muestran como etiquetas, pero cualquiera con sesión accede a todo. O se
   implementa la validación, o se saca la pantalla.

---

## 9. Actualizar la referencia de diseño del catálogo de bodas

`tests/e2e/layout-baseline.json`, entrada `/catalogo/bodas`

El guardián de diseño falla en las dos versiones (escritorio y celular) porque
cambió la huella de colores de esa pantalla. **El cambio es intencional y bueno:**
lo produjo la propuesta 911 ("Unificar estética, legibilidad y flujos de
portales"), que agregó en `src/app/globals.css` una regla que sube a 12 píxeles
todo el texto que estaba en 8, 9, 10 u 11. El texto chiquito ahora se lee.

Son las dos únicas pruebas de navegador que fallan hoy.

**Qué hacer.** Regenerar la referencia de `/catalogo/bodas` y dejar escrito en el
commit que el cambio viene de esa regla de legibilidad, para que se sepa por qué se
movió. Antes de regenerar, mirar la pantalla y confirmar que se ve bien: la
referencia se actualiza porque el cambio es correcto, no para tapar el aviso.

---

## 10. Tope de dos roles por persona en la misma fiesta

`src/app/(app)/fiestas/nueva/personal/page.tsx:433`

Hoy no hay ningún límite: se puede asignar a la misma persona todas las veces que
se quiera en la misma fiesta, y cobra todas. Dos roles es válido y querido (cocina
y utilero, por ejemplo); tres o más es un error de carga.

**Qué hacer.** Permitir hasta DOS asignaciones por persona en la misma fiesta. Al
intentar la tercera, no agregarla y avisar en pantalla: decir cuántas veces ya está
asignada y en qué roles.

En la lista de empleados a elegir, mostrar al lado de cada uno cuántas veces ya
está asignado en esa fiesta, para que el equipo lo vea antes de agregarlo.

**Pruebas:** una asignación se permite; la segunda se permite; la tercera se
rechaza sin tocar los datos.

---

## 11. Sin registro de quién marcó un recibo del personal como pagado

Si hay una discusión con un empleado, no hay con qué respaldarse.

**Qué hacer.** Guardar quién y cuándo al marcar un recibo como pagado, y mostrarlo
en la ficha del recibo.

---

## 12. Un botón que no hace nada en la plataforma 360

`src/app/evento/plataforma-360/[fiestaId]/page.tsx:672`

Hay un `<button>` sin `onClick`, sin `type="submit"` y fuera de un formulario. El
texto dice "Cámara Lenta (Slow Motion) Activada": es un indicador de estado
disfrazado de botón. El operador lo toca esperando que haga algo y no pasa nada.

Hoy tiene la prueba `src/__tests__/interactive-control-boundary.test.ts` en rojo en
la versión principal. Es la única prueba que falla.

**Qué hacer.** Decidir cuál de las dos cosas es:

- Si sólo informa que la cámara lenta está activada, no debe ser un `<button>`:
  cambiarlo por un `<div>` o `<span>` con el mismo estilo.
- Si tiene que poder prenderse y apagarse, agregarle el `onClick` que cambia el
  estado, y que el texto diga si está activada o no.

**Verificar:** `npx jest src/__tests__/interactive-control-boundary.test.ts`

---

## 16. La web ofrece un paquete que no existe

`src/data/event-catalogs/shared.ts` lineas 17, 30 y 46.

Los paquetes reales de AK son **Basico, Intermedio y Premium**. La web publica
ofrece **Basico, Premium y Elite**. "Elite" no existe en el negocio y falta
"Intermedio".

**Renombrar UNICAMENTE lo que el cliente ve. El contenido de cada paquete lo armo
el dueno: no tocar que incluye ninguno, ni el orden, ni los servicios.**

Cambios en `src/data/event-catalogs/shared.ts`:

- linea 30: `Paquete Premium` -> `Paquete Intermedio`
- linea 46: `Paquete Elite` -> `Paquete Premium`
- linea 17: `Paquete Basico` queda igual
- **linea 49**: dentro del tercer paquete dice `'Todo lo del Paquete Premium'`.
  Despues del renombre ese paquete ES el Premium, o sea que diria que se incluye a
  si mismo. Cambiar a `'Todo lo del Paquete Intermedio'`.
- linea 251: "paquetes Premium y Elite" -> "paquetes Intermedio y Premium"

**PELIGRO, no hacer un reemplazo global de "Elite".** Hay otros catalogos con las
mismas tarjetas (`bodas.ts`, `xv-anos.ts`, etc.): esos si van.

Pero **NO tocar** los siguientes, donde "Elite" es un valor interno guardado en
datos, no un texto que se muestre:

- `src/types/feature-flags.ts` (`ServiceTier = 'Basico' | 'Premium' | 'Elite'`,
  `availableFrom`, `tier`)
- `src/app/actions/feature-flags.ts`
- `src/data/feature-flags.json`

Ahi los valores guardados se comparan exactos contra `TIER_DEFINITIONS` en
`isModuleEnabled`. Si se renombran sin migrar los datos existentes, dejan de
coincidir y **todos los modulos quedan apagados**.

Tampoco cambiar los identificadores internos (`id`) de las tarjetas si hay
presupuestos guardados que los referencian: cambiar solo el nombre visible.

**Verificar:** que no quede ningun texto visible con "Elite", que
`src/types/feature-flags.ts` siga igual, y que los modulos sigan habilitandose
(`npx jest`).

---

## 17. El catalogo de venta presencial

`src/app/presentacion-led/`. **Contexto importante: no es una pantalla mas. Es el
catalogo que el dueno le muestra al cliente en persona para venderle.** Lo que
falle ahi, falla delante de alguien que esta por firmar.

**17.1 El total no suma el menu.** `slides/cierre-slide.tsx:80`

`totalEstimado` suma solo los servicios. El menu elegido se busca en la linea 79 y
se muestra en pantalla en la 157, pero su precio nunca entra en el total. El numero
que ve el cliente esta miles de pesos por debajo del real, y hay que corregirlo
para arriba delante de el.

**Ojo, no alcanza con multiplicar un menu por el total de invitados.** La
presentacion maneja adultos y menores por separado, y cada grupo puede tener su
propio menu elegido. El total tiene que ser:

- menu de adultos x cantidad de adultos
- mas menu de adolescentes x cantidad de menores
- mas los servicios, respetando los que se cobran por persona en vez de precio fijo

Y ese mismo total tiene que usarse tambien en `slides/plan-pagos-slide.tsx`, que
hoy hace su propia suma solo con precios fijos: si no, la diapositiva de cierre y
la del plan de pagos le muestran al cliente dos numeros distintos. Calcularlo una
sola vez y pasarlo a las dos.

Mostrar el total desglosado: menus + servicios = total.

**17.2 Se cuelga si falla la conexion.** `page.tsx:170-197`

De las cargas en paralelo, solo `getMenus()` y `getCatalogoFotos()` tienen
`.catch()`. Si falla `getServiciosEmpresa()`, `getCompanyInfo()`,
`getInvoiceTemplateSettings()` o `getBudgetDisplaySettings()`, la pantalla queda en
"Cargando presentacion..." para siempre, sin aviso ni forma de reintentar.

Se usa presencial, en salones y casas donde la senal es mala. Poner `.catch()` en
todas, que la presentacion abra igual con lo que si cargo, y mostrar un aviso con
boton de reintentar.

**17.3 El plan de pagos esta escrito a mano.**
`slides/plan-pagos-slide.tsx:24-40`

Los porcentajes 30/40/30 estan en el codigo. Si cambia la politica de pagos hay que
editar y compilar. Sacarlos a la configuracion del negocio.

**17.4 Letra de 12 pixeles.** `cierre-slide.tsx` lineas 112, 127, 159 y 197, y
`plan-pagos-slide.tsx:150`. Es un catalogo que se mira de lejos: minimo 14.

---

## 19. Las fases del portal se aplican en una sola de las cuatro pantallas

**Regla del negocio (la dio el dueno):** al principio, apenas se firma, el cliente
solo tiene que ver **contrato, presupuesto y pagos**. Puede faltar cuatro anos para
la fiesta: lo demas no le sirve y lo confunde. Mas cerca del evento se activa la
organizacion, y despues lo de la fiesta en vivo.

Esa regla **ya esta escrita en codigo y esta bien**:
`src/lib/client-portal/access-phases.ts` define las tres fases (`financiera`,
`organizacion`, `en_vivo`), arranca en `financiera` por defecto, y abre la de en
vivo sola unos dias antes (`liveAccessDaysBefore`, 7 por defecto).

**El problema es que solo una pantalla la usa.**

- `src/app/portal/c/[accessKey]/PublicPortalClientExperience.tsx` — **si** aplica
  las fases.
- `src/app/portal-cliente/[id]/page.tsx` — **no**.
- `src/app/portal/c/[accessKey]/PublicPortalProView.tsx` — **no**.
- `src/app/portal/c/[accessKey]/PublicPortalView.tsx` — **no**.

Segun por que enlace entre, el mismo cliente ve el portal completo desde el primer
dia: menu, decoracion, musica, invitados y todo lo demas, cuatro anos antes de la
fiesta. Justo lo que la regla quiere evitar.

**Que hacer.** Aplicar `resolveClientPortalAccess(fiesta)` en las tres pantallas
que faltan, y esconder los modulos de organizacion cuando `organizationLocked` sea
verdadero y los de la fiesta en vivo cuando lo sea `liveLocked`. Usar
`PublicPortalClientExperience.tsx` de modelo: ya resuelve como mostrar lo que
todavia no esta disponible, sin dejar la pantalla vacia y sin que parezca un error.

Lo financiero (contrato, presupuesto, pagos) se ve siempre: `canSeeFinancial` es
siempre verdadero.

**Verificar:** con una fiesta a cuatro anos y `accessPhase` en `financiera`, las
cuatro pantallas muestran solo contrato, presupuesto y pagos. Con la fecha a menos
de siete dias, aparece lo de la fiesta en vivo sola.

---

## 20. Los dos portales del cliente muestran saldos distintos

`src/app/portal-cliente/[id]/page.tsx:541`

**Esto lo dejo a medias una correccion mia (propuesta 843) y hay que terminarlo.**

El ajuste anual se aplica cuando el evento cae en un anio posterior al del
presupuesto. La propuesta 843 corrigio las pantallas del portal publico
(`PublicPortalClientExperience` y `PublicPortalProView`) para que usen
`calcularEstadoDeCuenta`, el mismo calculo que el estado de cuenta de AK.

Pero el portal privado, `/portal-cliente/[id]`, quedo usando
`getPaymentPlanSummary(cuotas)`, que suma las cuotas sin el ajuste.

Antes los dos estaban igual de mal; ahora uno esta bien y el otro no, asi que el
mismo cliente ve dos saldos distintos segun por que enlace entre. En una fiesta de
120.000 la diferencia es de 18.000.

**Que hacer.** Que `/portal-cliente/[id]/page.tsx` use `calcularEstadoDeCuenta` de
`@/lib/budget/saldo-con-ajuste`, igual que las otras dos. Ojo: esa pantalla arma el
resumen a partir de las cuotas del plan de pagos, asi que hay que revisar de donde
saca el presupuesto para pasarselo.

**Verificar:** con un presupuesto aceptado y el evento el anio que viene, el saldo
tiene que ser el mismo en `/portal-cliente/[id]`, en `/portal/c/[accessKey]` y en el
estado de cuenta interno.

---

## 21. Cosas del portal del cliente que la hacen llamar por telefono

**21.1 El plan de pagos no se actualiza si cambia el presupuesto.**
`src/app/actions/fiesta/fiesta.actions.ts:669-833`

`syncFiestaFromBudget` actualiza modulos contratados, personal y costos, pero no
toca `planDePagos`. Si AK cambia montos en el presupuesto, el cliente sigue viendo
las cuotas viejas en su portal.

**21.2 Marca que empaco algo y no se guarda.**
`src/app/portal-cliente/[id]/page.tsx:322-338`

Al marcar un item de "lo que tenes que llevar", la pantalla lo marca al instante.
Si la conexion falla, aparece un aviso de error pero **el item queda marcado igual**.
Ella recarga y vuelve a estar sin marcar: creyo que lo guardo y no. Hay que
devolver la marca a su estado anterior cuando falla.

**21.3 "Todavia no hay invitados cargados" no dice que hacer.**
`src/app/portal-cliente/[id]/page.tsx:1166-1180`

No distingue entre "AK todavia no los cargo" y "algo se rompio". Aclarar que es
normal al principio y que los va a ver apenas se carguen.

---

## 22. La fase en vivo se abre 7 dias antes y tiene que ser 30

**Regla del negocio (la dio el dueno): todo se activa 30 dias antes de la fiesta, o
antes. No una semana.**

Hoy el valor por defecto es 7 en tres lugares:

- `src/lib/fiesta-defaults.ts:90` — `liveAccessDaysBefore: 7`
- `src/lib/client-portal/access-phases.ts:26` — el respaldo cuando no hay valor
  guardado: `?? 7`
- `src/app/(app)/fiestas/nueva/portal-cliente/page.tsx:946` — lo que muestra la
  pantalla de configuracion cuando esta vacio: `?? 7`

**Que hacer.** Poner 30 en los tres.

**El dueno tiene que poder cambiarlo el mismo, sin tocar codigo.** Ya existe el
campo en la configuracion del portal de cada fiesta
(`src/app/(app)/fiestas/nueva/portal-cliente/page.tsx:941-948`, "Dias previos para
abrir automaticamente la parte en vivo"). Ese campo **se queda y sigue siendo
editable**: lo unico que cambia es el numero con el que arranca.

Mejoras a ese campo mientras se toca:
- Que diga al lado, en criollo, que significa: "la parte de la fiesta en vivo se le
  abre al cliente esta cantidad de dias antes del evento".
- Que muestre la fecha resultante para esa fiesta ("se abre el 12 de octubre"), asi
  no hay que hacer la cuenta mentalmente.

Ojo con las fiestas ya creadas: las que tengan `liveAccessDaysBefore: 7` guardado
van a seguir con 7. Decidir si se migran a 30 o si se deja el valor guardado y solo
cambia el defecto para las nuevas. **Lo mas seguro es migrar**, porque el 7 no lo
eligio nadie: era el numero que venia de fabrica.

**Verificar:** una fiesta nueva arranca en 30. Con la fiesta a 20 dias, la parte de
fiesta en vivo ya se ve.

---

## Cómo verificar al terminar

1. `npx tsc --noEmit` → 0 errores
2. `npx jest` → todas en verde
3. `npm run build` → termina bien
4. Servidor compilado en el puerto 3100 + `npx playwright test` con
   `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3100`
5. `npm run test:rules`
