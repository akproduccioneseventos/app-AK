# Ya resuelto â€” NO lo vuelvas a reportar ni a "arreglar"

**LeÃ© esto ANTES de auditar cualquier cosa.** Vale para Codex, Gemini, Claude y
cualquier ayudante que salga a buscar problemas.

En este proyecto trabajan varias IA en paralelo, en cuentas distintas. Sin esta
lista pasa lo siguiente: una auditorÃ­a nueva encuentra "un problema", lo reporta,
alguien lo arregla otra vez, y a veces **deshace** el arreglo bueno con uno peor.
Ya pasÃ³: dos propuestas protegieron el mismo archivo de maneras distintas y al
fusionarse dejaron la pantalla colgada para siempre.

**Regla: si algo de esta lista aparece en tu auditorÃ­a, es falso positivo.** Si
creÃ©s que igual estÃ¡ mal, no lo arregles: decilo y esperÃ¡ respuesta.

Quien arregle algo nuevo, **lo agrega acÃ¡ en la misma tanda**. Si no queda
anotado, la prÃ³xima auditorÃ­a lo va a volver a encontrar.

---

## Decisiones del dueÃ±o (no son errores, no se discuten)

- **Lo que le toca a Gemini, Claude no lo programa.** Claude escribe cÃ³digo sÃ³lo
  en plata, cobros, comida y permisos; el resto va a una orden en
  `docs/ordenes/`. Programarlo igual le cuesta el doble al dueÃ±o.
- **Propuestas grandes, no muchas chicas.** Cada fusiÃ³n dispara un despliegue y
  se paga. Se junta la tanda entera en una sola propuesta. La documentaciÃ³n
  viaja con el cÃ³digo, nunca en una propuesta aparte.
  `docs/ordenes/`. Programarlo igual le cuesta el doble al dueño.
- **Propuestas grandes, no muchas chicas.** Cada fusión dispara un despliegue y
  se paga. Se junta la tanda entera en una sola propuesta. La documentación
  viaja con el código, nunca en una propuesta aparte. **Vale también para las
  órdenes que una IA le escribe a otra**: una orden de cinco bloques se entrega
  en una sola propuesta con los cinco, no en cinco. El dueño lo tuvo que repetir
  el 10 de agosto de 2026 porque la orden pedía lo contrario que la regla.

- **El ajuste anual del 15% va siempre.** Aparece en presupuestos y en el portal.
- **El descuento del 50% del SalÃ³n Club Uruguay** y el descuento del presupuesto
  son decisiones de marketing.
- **La lista de compras usa los invitados del PRESUPUESTO**, no los confirmados.
  Se cocina lo que se contratÃ³. Si vienen mÃ¡s, se agregan y el presupuesto sube.
- **El invitado marca cuÃ¡ntos del grupo son niÃ±os o adolescentes.** Antes la
  invitaciÃ³n pÃºblica metÃ­a a todos como `'Adulto'` fijo, asÃ­ que una familia de
  dos grandes y tres chicos entraba como cinco adultos y el menÃº salÃ­a mal. Ahora
  se pregunta y se guarda en `kidsCount`, el desglose fino del grupo.
  **`categoria` sigue existiendo** para las pantallas que muestran una sola
  etiqueta: no la saques.
- **El conteo para cocinar sale del PRESUPUESTO, no de los confirmados.** Y eso
  ya funciona solo: `syncFiestaFromBudget` copia `invitadosAdultos` e
  `invitadosNinos` del presupuesto a la fiesta, y `syncLinkedFiesta` lo dispara
  cada vez que el presupuesto se guarda o se actualiza. **Si los invitados
  aumentan, el conteo se actualiza solo.** El dato que marca el invitado sirve
  para saber a quiÃ©n llevarle cada menÃº en la mesa, no para comprar.
- **Los lÃ­mites de cambio de invitados salen del contrato y ya estÃ¡n en cÃ³digo.**
  El contrato (`src/lib/contract-template.ts`) dice: *"La lista final deberÃ¡
  entregarse siete dÃ­as antes. PodrÃ¡ reducirse hasta 10% de los invitados,
  ajustando solo servicios por persona, y aumentarse hasta 30%, sujeto a
  disponibilidad y pago previo. No habrÃ¡ devoluciÃ³n por inasistencias."* Eso
  estaba en el papel y en ningÃºn lado del sistema, asÃ­ que se podÃ­a bajar la
  cantidad un 40% sin que nada avisara. Ahora la regla vive en
  `src/lib/budget/cambio-de-invitados.ts`, con diez pruebas. **El redondeo va a
  favor del cliente** (con 55 contratados puede bajar a 49, no a 50).
  **Si cambiÃ¡s un tope, cambialo tambiÃ©n en el contrato**, o el sistema y el
  papel dejan de decir lo mismo.
- **El cliente puede pedir el cambio de invitados desde su portal.** Bajar hasta
  10% o subir hasta 30%, poniendo cuÃ¡ntos adultos, adolescentes y niÃ±os. Las
  acciones estÃ¡n en `portal.actions.ts`
  (`submitClientGuestCountChangeRequest`, `approve...`, `reject...`), con siete
  pruebas. Decisiones tomadas, **no las cambies sin motivo**:
  - **El pedido NO se aplica solo.** Queda pendiente y lo resuelve AK, porque
    subir invitados mueve el precio y hay que confirmar con el salÃ³n.
  - **Fuera de los lÃ­mites del contrato ni se toma el pedido**: se le explica al
    cliente el rango en el momento. Tomarlo para rechazarlo despuÃ©s le hace
    perder el viaje.
  - **Un pedido pendiente por vez.** Si no, se acumulan tres y no se sabe cuÃ¡l
    vale.
  - **Al aprobar se actualiza el PRESUPUESTO**, no sÃ³lo la fiesta: de ahÃ­ sale
    lo que se compra y se cocina.
- **El "Tal vez" de la invitaciÃ³n se saca: se confirma o no se confirma.** Un
  "tal vez" no sirve para encargar comida ni poner sillas. **Pero el estado
  `'Tal vez'` NO se borra del tipo `RsvpStatus`**: hay invitados guardados con
  ese valor y romperÃ­an las pantallas. SÃ³lo se saca el botÃ³n de la invitaciÃ³n.
- **El invitado SÃ� puede cambiar su respuesta**, y eso ya funciona: al responder
  de nuevo con el mismo nombre, `submitPublicRsvp` lo busca por nombre
  normalizado y lo actualiza, no lo duplica. Lo que falta es decÃ­rselo en
  pantalla. Va en `docs/ordenes/estetica-01.md`, bloque E.
- **Las fotos del muro se descargan con enlace directo, a propósito.**
- **Se trabaja sólo en pesos uruguayos.** No hay diferencias de redondeo en
  dólares que corregir.
- **Bloque D ("Entretenimiento: video y guía")**: Verificación integral del sistema de entretenimiento en fiestas (`plataforma-360`, `bogue`, `buzon`, `readiness`). Plataforma 360 configurada con cámara lenta por defecto, música cargable por evento, marca de agua con nombre de la fiesta, guía paso a paso y mensaje de falla amigable sin trabar tablets. Bogue preserva las fotos individuales capturadas en la tanda y las permite imprimir mediante `imprimirRecuerdo` y `tira-fotocabina.ts` sin descartarlas al armar el video boomerang. Cápsula del tiempo con voz de orientación, pre-escucha y aviso antes del corte a los 15s. Verificación de prueba de estación con impresión de hoja de prueba real antes del evento.
- **Bloque E ("Ajustes del sistema")**: Auditado el módulo `src/app/(app)/settings/` (plantillas de contrato, invitaciones web, WhatsApp, catálogos de servicios, salones y personal). Se implementó validación preventiva al guardar plantillas para detectar marcadores no reconocidos (`{{ALGO}}`) impidiendo que queden variables rotas en contratos o mensajes de WhatsApp hacia los clientes. Se garantizaron alertas claras de guardado y terminología amigable en criollo.
- **Los controles rojos de GitHub son por facturación de la cuenta.** No los
  investigues. Vale lo que se verifica localmente.
- **Las fotos del muro se descargan con enlace directo, a propÃ³sito.**
- **Se trabaja sÃ³lo en pesos uruguayos.** No hay diferencias de redondeo en
  dÃ³lares que corregir.
- **Los controles rojos de GitHub son por facturaciÃ³n de la cuenta.** No los
  investigues. Vale lo que se verifica localmente.
- **El pasaje a la galerÃ­a del cliente (wfolio) es manual.** No tiene forma
  documentada de automatizarse; ya se investigÃ³. No armes una integraciÃ³n.

---

## MÃ³dulo de entretenimiento â€” TERMINADO

### Arreglado, no lo toques

- **Las cuatro estaciones de captura ya no mienten.** Cuando falla la subida no
  muestran mÃ¡s "escaneÃ¡ tu recuerdo" con el cÃ³digo girando: avisan y ofrecen
  descargar o reintentar. Hay un componente compartido, `QrRecuerdo`, para que el
  defecto no se copie en la prÃ³xima estaciÃ³n.
- **Espejo mÃ¡gico IA:** al fallar la IA se queda en revisiÃ³n con la foto original
  y los botones para subirla, en vez de saltar al cartel de recuerdo listo. La
  cÃ¡mara no se reenciende encima del cartel de error.
- **El operador ve las fallas del invitado** en su cabina, con la hora, y el
  aviso se borra solo cuando la estaciÃ³n vuelve a andar (`lastError` en la sesiÃ³n).
- **El operador sabe si la IA no estÃ¡ disponible** antes de que llegue el primer
  invitado.
- **Pantalla gigante, muro, galerÃ­a y red social** avisan si se cortÃ³ la conexiÃ³n
  y distinguen "no hay nada" de "no se pudo cargar".
- **La zona digital** no tiene mÃ¡s tarjetas muertas; el **tÃ³tem** no muestra un QR
  que no sirve.
- **Trivia por mesa:** funciona, arma el ranking por mesa y el invitado sin mesa
  juega igual en el ranking individual.
- **El muro saluda por nombre** cuando la foto viene del enlace personal, y sigue
  funcionando sin nombre cuando viene del QR general del salÃ³n.
- **Las estaciones funcionan sin muro contratado.** La foto **se guarda siempre**;
  si el muro estÃ¡ pausado o no contratado queda como `pending` y no se ve. Nadie
  saltea la pausa de la moderaciÃ³n.

### La fotocabina funciona como las clÃ¡sicas (9 de agosto de 2026)

Se copiÃ³ el mecanismo de las cabinas del rubro, despuÃ©s de mirar cÃ³mo lo hacen
las que se venden hoy:

- **Tres fotos por tanda, encadenadas solas.** El invitado no toca nada entre
  foto y foto.
- **La primera cuenta es de 10 segundos y las otras de 4.** Es a propÃ³sito: en
  la primera la gente reciÃ©n se acomoda; despuÃ©s ya estÃ¡ ubicada y una espera
  larga hace cola. **No las emparejes.**
- **SÃ³lo se cantan en voz alta los Ãºltimos cinco nÃºmeros.** Contar desde diez
  tapa la mÃºsica del salÃ³n.
- **La pantalla guÃ­a**: "Foto 2 de 3", con puntitos de avance y una frase
  distinta para cada una. Entre foto y foto sigue viÃ©ndose la cÃ¡mara: si se
  cambia de estado, la pantalla queda en negro y el invitado se pierde.
- **Al terminar se arma una sola imagen** con las tres pegadas, el nombre del
  evento y la fecha, en formato 10x15. Se eligiÃ³ la postal y no la tira finita
  de 5x15 porque la tira obliga a una impresora con cortadora.
- **Imprime sola, sin que el invitado apriete nada**, y despuÃ©s ofrece "quiero
  otra copia". La copia automÃ¡tica es la Ãºnica que reinicia la cabina; las
  copias extra dejan la pantalla quieta para poder pedir mÃ¡s.
- **El muro es el extra, no el camino principal.** Si el cliente no contratÃ³
  muro, la cabina imprime igual y no muestra el botÃ³n de publicar.
- **El espejo mÃ¡gico tambiÃ©n imprime**, y en el modo firma se imprime el lienzo
  para que salgan la firma y los stickers en el papel.
- **La impresiÃ³n vive en un solo lugar** (`imprimirRecuerdo`), compartida entre
  la fotocabina y el espejo. Si agregÃ¡s impresiÃ³n a otra estaciÃ³n, usÃ¡ esa: no
  armes una propia.
- **La galerÃ­a del operador ya permite reimprimir** una foto que ya saliÃ³. No
  hace falta agregarlo.

### QuÃ© produce cada estaciÃ³n (verificado en el cÃ³digo el 9/8/2026)

Lista corta para no volver a confundirse. Ya pasÃ³: se describiÃ³ el Bogue como
estaciÃ³n de video cuando es de fotos.

- **Fotocabina** â€” FOTOS. Tanda de tres, se arma una tira y se imprime.
- **Bogue** â€” **FOTOS.** Saca varias seguidas. Hoy sÃ³lo guarda el video
  boomerang que arma con ellas y **descarta las fotos**: eso estÃ¡ mal y va en
  `docs/ordenes/entretenimiento-03.md`, bloque B.
- **Espejo mÃ¡gico foto** â€” FOTO, con filtro. Imprime.
- **Espejo mÃ¡gico firma** â€” FOTO con firma y stickers encima. Imprime el lienzo.
- **Espejo mÃ¡gico IA (touchpix)** â€” FOTO. Guarda la original y la generada.
- **Plataforma 360** â€” VIDEO de verdad, 15 segundos, grabado de la cÃ¡mara.
- **CÃ¡psula del tiempo (buzÃ³n)** â€” AUDIO o VIDEO. No se imprime.
- **TÃ³tem** â€” NO CAPTURA NADA. SÃ³lo muestra el cÃ³digo y las fotos aprobadas.

### Topes, ya calibrados

- **Videos del invitado: 15 segundos.** Es a propÃ³sito.
- **Tope del evento: 5000 fotos.** Antes eran 200 y cortaba la fiesta a la mitad.
  No lo bajes.
- **Generaciones de IA: 3 por sesiÃ³n de foto**, contadas en el servidor con un
  identificador estable, mÃ¡s una red de contenciÃ³n de 150 por hora por estaciÃ³n.
- **Paquete de recuerdos: 300 MB por pedido**, y se puede pedir por estaciÃ³n
  (`?estacion=`). El lÃ­mite es de memoria del servidor, no de la fiesta.
- **41 estilos de IA**, y se pueden elegir por fiesta con `allowedTemplateIds`.
  VacÃ­o significa todos.

---

## MÃ³dulo de organizaciÃ³n â€” TERMINADO

### Arreglado, no lo toques

- **Los conteos cuentan PERSONAS, no filas.** CelÃ­acos en la pantalla de
  invitados y el reporte al catering ya usan `partySize`.
- **Los conteos de CONFIRMADOS tambiÃ©n cuentan personas (9/8/2026).** Faltaban
  seis lugares que hacÃ­an `.filter(rsvp === 'Confirmado').length`: el avance del
  evento, las automatizaciones, las dos cuentas de `fiesta-progress`, el centro
  de experiencia y las plantillas de invitaciÃ³n. **Lo grave era que esos nÃºmeros
  se comparan contra `invitadosEstimados`, que sÃ­ son personas**: con 100
  estimados y 30 filas que eran 90 personas, el sistema mostraba 30% de avance y
  disparaba avisos de "faltan confirmaciones" con la fiesta casi llena. Hay una
  prueba que lo deja clavado: `conteo-confirmados-personas.test.ts`.
- **El que cancela sale del conteo solo**, porque deja de estar `'Confirmado'`.
  No hace falta restarlo a mano en ningÃºn lado.
- **Las bebidas llegan a la lista de compras**, todas las categorÃ­as activadas,
  leyendo `fiestaData.bebidas`.
- **El autoguardado del diseÃ±o de decoraciÃ³n avisa cuando falla** y reintenta.
- **Borrar una foto del moodboard** confirma o avisa el error.
- **Los recibos del personal se autoguardan**, igual que la pantalla de personal.
- **El aviso de doble asignaciÃ³n** dice cuÃ¡ndo no se pudo verificar, en vez de
  callarse.
- **Primero se guarda, despuÃ©s se sincroniza con Google.** El orden es
  deliberado: al revÃ©s mandaba los avisos con la asignaciÃ³n vieja. **No lo
  muevas.**
- **En la lista de carga, el precio ya no se usa como cantidad.** Sin referencia
  de cobertura queda en 1 unidad.
- **El PDF del itinerario no muestra las notas internas del organizador** y
  filtra los momentos marcados como no visibles. Ese PDF lo ven proveedores.
- **El tablero central** muestra el avance por mÃ³dulo, el avance general y el
  prÃ³ximo paso sugerido con botÃ³n directo.
- **Buscador de empleados**, sincronizaciÃ³n de carga que no duplica, tareas de
  proveedores que no se cortan en silencio, aviso de horarios que se pisan en el
  itinerario, y vista previa del portal del invitado.
- **El menÃº de mesa vuelve atrÃ¡s el color** si el guardado falla, en vez de
  dejarlo visible como si hubiera guardado.
- **La descarga de recuerdos incluye el dominio propio de AK**
  (`galeria.akproducciones.uy`) en la lista de dominios habilitados.
- **El paquete de recuerdos baja ordenado por estaciÃ³n** y con el tipo de fiesta
  en el nombre.

### Ya existÃ­a antes, no lo construyas de nuevo

- **El Ã¡lbum del portal del cliente.** EstÃ¡ en
  `src/app/portal-cliente/[id]/fotos-video/page.tsx` y `getContractedDownloads`
  ya decide quÃ© mostrar segÃºn lo contratado. Una orden de trabajo pidiÃ³
  construirlo y se perdiÃ³ el viaje entero.

---

## PlanificaciÃ³n â€” pantallas de plata

- **La merma de bebidas ya no se cuenta dos veces** en el gestor de
  rentabilidad. `totalBebidasCost` viene con el 5% adentro y la merma figuraba
  ademÃ¡s como item propio, asÃ­ que el costo salÃ­a inflado y el margen mÃ¡s bajo
  que el real. El reporte de post-evento ya lo descontaba con
  `costosSinMermaDuplicada`; ahora las dos pantallas dan el mismo nÃºmero.
- **El costo de proveedores NO va sumado aparte al margen.** Ya estÃ¡ adentro de
  `costosItems` como items `auto_prov_*`. `totalProveedorCost` es sÃ³lo el
  subtotal que se muestra en la tabla. **Si una auditorÃ­a dice que "falta sumar
  proveedores", es falso positivo:** sumarlo lo contarÃ­a dos veces. Ya se reportÃ³
  una vez por error.

- **El porcentaje del ajuste anual se lee de la configuraciÃ³n en TODAS las
  pantallas.** El estado de cuenta lo hacÃ­a; el recibo de pago y las dos vistas
  del portal del cliente lo tenÃ­an clavado en 15%. El dÃ­a que se cambiara el
  porcentaje en ajustes, el cliente iba a ver un saldo y AK otro. Ahora las
  cuatro le pasan el porcentaje configurado a la misma cuenta compartida. **Si
  agregÃ¡s una pantalla que muestre saldo, pasale el porcentaje**: sin Ã©l vuelve
  al 15% fijo y reaparece la diferencia.
- **El contrato del salÃ³n ya se guarda.** Antes el botÃ³n "Finalizar" sÃ³lo cerraba
  el modo ediciÃ³n: lo que el equipo escribÃ­a (clÃ¡usulas, montos) se perdÃ­a al
  recargar, y peor, al abrir la pantalla se regeneraba el borrador y pisaba lo
  editado. Ahora hay botÃ³n de guardar, el texto vive en `contratoSalonTexto`, y
  lo guardado le gana al borrador automÃ¡tico.

- **El plan de pagos avisa si las cuotas no cubren el total del contrato.** Antes
  el "Total" de esa pantalla era la suma de las cuotas cargadas, asÃ­ que un plan
  al que le faltaba plata se veÃ­a perfectamente cuadrado. Ahora compara contra el
  total real del evento (con el ajuste anual) y dice cuÃ¡nto falta o cuÃ¡nto sobra.

- **El contrato de servicio no pisa mÃ¡s las ediciones sin avisar.** Cambiar de
  plantilla o salir del modo ediciÃ³n con cambios sin guardar ahora pregunta
  antes. El botÃ³n dice "Salir sin guardar" para que se entienda que no guarda.
- **El contrato de servicio avisa si quedaron huecos sin llenar.** Si la
  plantilla trae un marcador que nadie reemplazÃ³, sale un cartel naranja con la
  lista antes de imprimir, en vez de que el cliente reciba el contrato con
  `{{ALGO}}` escrito adentro.
- **Borrar un documento del evento pide confirmaciÃ³n**, con el nombre del
  documento. AhÃ­ vive el contrato firmado.
- **Costos y rentabilidad no acepta importes negativos** ni invÃ¡lidos, ni en
  gastos ni en pagos a proveedores. Un negativo inflaba la ganancia en silencio.

- **En servicios contratados, el personal sin categorÃ­a ya no aparece como
  Catering.** Tiene su propia secciÃ³n "Otro personal", que explica que al rol le
  falta la categorÃ­a. Antes un DJ o un chofer figuraba entre los mozos.

## Pantallas del planificador: quÃ© estÃ¡ conectado y quÃ© no

Verificado el 8 de agosto de 2026. **No hay una plaga de pantallas huÃ©rfanas**,
como pareciÃ³ al principio:

- **Los "centros de mando" duplicados no son un problema.** Seis pantallas
  (`centro-de-mando`, `centro-experiencia`, `comando-total`, `show-control`,
  `centro-total`, `mission-control`) son redirecciones de 18 lÃ­neas a
  `fiestas/[id]/centro`. Vienen de una unificaciÃ³n deliberada y existen para no
  romper enlaces guardados. **No las borres.**
- **Las pantallas de gestiÃ³n documental estÃ¡n todas enlazadas** desde
  `gestion-documental/page.tsx`. No estÃ¡n huÃ©rfanas.
- **`planner-costo-fiesta` y `servicios-contratados`** se alcanzan por direcciÃ³n
  directa aunque no tengan botÃ³n en el tablero.
- **`nueva/playlist-pantalla` SE CONECTA, no se retira.** Verificada el 9 de
  agosto de 2026: estÃ¡ terminada y funciona (lista de la pantalla en vivo mÃ¡s la
  configuraciÃ³n del muro social). Lo Ãºnico que le falta es el botÃ³n que la
  enlace, y va en el bloque D de `docs/ordenes/planificacion-02.md`. **No la
  borres ni vuelvas a reportarla como huÃ©rfana.**

## Comercial y contable

Auditado el 9 de agosto de 2026. **Son 47 pantallas** entre los dos mÃ³dulos (35
comerciales, 12 contables), no las que aparecen en el menÃº.

- **Guardar un presupuesto avisa si el cliente no quedÃ³ en el seguimiento.**
  Antes, si fallaba la sincronizaciÃ³n con el CRM, el presupuesto se guardaba
  igual y decÃ­a "Guardado" a secas: el equipo creÃ­a que el cliente estaba
  cargado y no estaba. El guardado sigue sin bloquearse a propÃ³sito (el
  presupuesto vale mÃ¡s que el CRM), pero ahora vuelve el aviso a la pantalla.
- **Si el cupÃ³n no se pudo registrar, ahora se dice.** El descuento se aplicaba
  igual y el uso quedaba sin anotar en silencio.
- **Pagos rÃ¡pidos no muestra mÃ¡s presupuestos archivados.** Filtraba por estado
  pero no por archivado, asÃ­ que uno viejo dado de baja seguÃ­a en la lista.
- **Pagos rÃ¡pidos muestra lo informado y sin confirmar.** El saldo cuenta sÃ³lo
  los pagos confirmados; si el cliente informaba uno, el saldo no se movÃ­a y
  parecÃ­a un error. Ahora aparece aparte, en Ã¡mbar.
- **El motivo del rechazo de un pago se ve en la lista**, sin tener que entrar
  al presupuesto.

- **Las facturas cobradas estÃ¡n protegidas.** Una factura con pagos ya no
  permite cambiarle el nÃºmero ni la moneda, una factura pagada no puede volver a
  borrador, y no se puede eliminar una factura cobrada: es el comprobante del
  cobro. La validaciÃ³n estÃ¡ en el servidor, no sÃ³lo en la pantalla.
- **No se repiten nÃºmeros de factura.** **Los recibos de seÃ±a quedan afuera a
  propÃ³sito:** comparten el nÃºmero por evento cuando el cliente paga la seÃ±a en
  varias veces, y la duplicaciÃ³n real ya la corta `findExistingDepositReceipt`.
  Si una auditorÃ­a dice que "faltan validar los nÃºmeros de seÃ±a", es falso
  positivo.
- **El WhatsApp del dÃ­a avisa si el mensaje quedÃ³ pendiente.** Antes, si fallaba
  marcarlo como enviado, seguÃ­a en la lista y alguien lo mandaba dos veces al
  mismo cliente.

- **El catÃ¡logo no acepta precios negativos**, ni en el precio de venta, el
  precio base, el precio por persona, el costo estimado ni los tramos. Un
  negativo se arrastraba a todos los presupuestos que usaran ese servicio e
  inflaba la ganancia. **El cero sÃ­ se permite**: hay servicios de cortesÃ­a.
- **El reporte de ganancias y pÃ©rdidas muestra el error cuando falla.** Antes
  aparecÃ­a un triÃ¡ngulo rojo suelto, sin texto: nadie sabÃ­a si reintentar o
  cambiar las fechas.
- **El simulador exige un celular uruguayo de verdad.** Aceptaba cualquier cosa
  de 7 dÃ­gitos aunque el cartel prometiera otra cosa, asÃ­ que llegaban pedidos
  de presupuesto a los que despuÃ©s no se les podÃ­a contestar.

### Falsos positivos ya verificados en estos mÃ³dulos

- **Los recibos del personal NO dan NaN.** El cÃ¡lculo del sueldo protege los
  porcentajes faltantes con `?? 0` y sÃ³lo divide si el divisor es mayor a cero.
- **La deduplicaciÃ³n de seÃ±as es deliberada.** Busca por evento, monto y dÃ­a
  para no registrar dos veces el mismo pago. Que dos seÃ±as idÃ©nticas el mismo
  dÃ­a se confundan es el precio de esa protecciÃ³n: no lo "arregles" sin hablarlo.
- **El precio tachado del Club Uruguay en el simulador es el doble a propÃ³sito.**
  Es el 50% de descuento que decidiÃ³ el dueÃ±o. No es un error de cÃ¡lculo.
- **El filtro "Con responsable" del CRM hace lo que dice la etiqueta.** La clave
  interna se llama `my_leads` por historia, pero no promete "los mÃ­os" en
  pantalla y el equipo ve el CRM completo igual. No es una filtraciÃ³n.
- **Las dos pantallas de servicios no estÃ¡n duplicadas por error.** La de
  ajustes es sÃ³lo de lectura y la de empresa es la que edita. Escriben en el
  mismo lado.
- **El panel contable no tiene divisiones por cero.** Se verificaron los
  mÃ¡rgenes, el flujo de caja y los reportes: todos protegen el divisor.
- **Los regalos del presupuesto NO se muestran mal.** Sale el precio unitario y
  el importe en cero porque **hay una columna de descuento que dice 100%**. EstÃ¡
  explicado en la propia tabla.
- **El cartel de "VerificaciÃ³n Pendiente" muestra el total guardado a
  propÃ³sito.** Es lo que se estÃ¡ verificando antes de mandÃ¡rselo al cliente. No
  es una inconsistencia con el total recalculado de abajo.
- **El filtro "Con responsable" del CRM hace lo que dice la etiqueta**: muestra
  los prospectos que tienen alguien asignado. La clave interna se llama
  `my_leads` por historia, pero no promete "los mÃ­os" ni filtra mal.

## EstÃ©tica â€” auditada el 9 de agosto de 2026

La app **no estÃ¡ rota, estÃ¡ despareja**: 925 colores escritos a mano en 211
pantallas, 582 textos de menos de 12 pÃ­xeles y 8 variantes de borde redondeado
conviviendo. El detalle y el plan estÃ¡n en `docs/ordenes/estetica-01.md`, que le
toca a Gemini.

### Falsos positivos verificados: NO los vuelvas a reportar

- **Los colores en `style={{ backgroundColor: ... }}` del croquis del salÃ³n, la
  decoraciÃ³n, los nÃºmeros de mesa y las invitaciones NO son colores mal
  puestos.** Son los que **elige el usuario** para cada elemento. Se reportÃ³ una
  vez como "rompe la paleta" y es al revÃ©s: si los cambiÃ¡s a tokens, el usuario
  pierde la posibilidad de elegir el color.
- **El `bg-white` de facturas, recibos y contratos es correcto.** Esos
  documentos se imprimen en papel.

### Tanda `estetica-01` â€” propuesta unificada del 9 de agosto de 2026

- **La escala visual queda fijada asÃ­: tarjetas `rounded-xl`, botones
  `rounded-lg` y campos `rounded-lg`.** Los componentes compartidos `Card`,
  `Button`, `Input`, `Select`, `Textarea` y `EmptyState` usan esa escala y los
  colores semÃ¡nticos del tema. Se eligiÃ³ una diferencia corta entre tarjeta y
  control para ordenar la interfaz sin volverla ni cuadrada ni exageradamente
  redonda.
- **Los botones, tarjetas y campos compartidos dejaron de imponer rojo, blanco
  y gris escritos a mano.** Ahora usan `primary`, `foreground`, `background`,
  `border`, `accent` y `destructive`, porque esos tokens ya tienen versiÃ³n clara
  y oscura. No se tocaron los colores dinÃ¡micos que elige el usuario ni el
  blanco de los documentos imprimibles.
- **Alcance manual terminado del bloque de colores:** portal principal del
  cliente, sus variantes pÃºblica/Pro, confirmaciÃ³n de invitados, control del
  muro social, invitaciÃ³n pÃºblica, portal individual del invitado, contrato,
  moodboard, configuraciÃ³n de la fiesta y bandeja del portal del cliente. El
  resto de las 211 pantallas todavÃ­a necesita recorrerse pantalla por pantalla;
  no se hizo un reemplazo masivo imposible de revisar. Los componentes
  compartidos sÃ­ mejoran desde ahora toda la app.
- **NingÃºn `text-[8px]`, `text-[9px]`, `text-[10px]` o `text-[11px]` se renderiza
  por debajo de 12 px.** La garantÃ­a vive en `globals.css`, para corregir los
  cientos de usos histÃ³ricos sin editar mecÃ¡nicamente 71 pantallas. Las
  medidas de impresiÃ³n en puntos no cambian. AdemÃ¡s se corrigieron a mano las
  grillas mÃ³viles seÃ±aladas: cuenta regresiva, muro social, resumen de
  invitados y respuesta pÃºblica; el mensaje del invitado ya no queda cortado.
- **Los vacÃ­os del portal explican quÃ© falta y quÃ© ocurre despuÃ©s.** Las lÃ­neas
  grises de checklist, cronograma, tragos, servicios, mÃºsica, reuniones,
  decoraciÃ³n, documentos, catÃ¡logo y preguntas se reemplazaron por
  `EmptyState`. No se inventaron acciones de ediciÃ³n donde el cliente no tiene
  permiso: se aclara cuÃ¡ndo debe publicar o intervenir AK.
- **Las cargas pÃºblicas ya dicen quÃ© estÃ¡n preparando.** Portal, contrato,
  moodboard, invitaciÃ³n individual y mini quiosco tienen texto y `aria-live`;
  sus fallos ofrecen reintento o un prÃ³ximo paso. Las excepciones y mensajes
  tÃ©cnicos del servidor ya no quedan expuestos a clientes o invitados en esos
  recorridos.
- **La acciÃ³n principal del portal ahora coincide con el prÃ³ximo paso real.**
  Puede llevar a pago, pagos en revisiÃ³n, organizaciÃ³n, invitados o contacto;
  si una fase no habilita organizaciÃ³n, dirige al resumen financiero. Se quitÃ³
  el pulso que hacÃ­a parecer urgente pagar siempre y las acciones posteriores
  quedan como secundarias.
- **La invitaciÃ³n pÃºblica ya no ofrece â€œTal vezâ€�.** Quedan sÃ³lo â€œAsistirÃ©â€� y
  â€œNo puedoâ€�, anchos para el dedo. `RsvpStatus` conserva `Tal vez` para datos
  histÃ³ricos y uso interno. La confirmaciÃ³n explica que se puede cambiar la
  respuesta con el mismo enlace y nombre, y â€œResponder de nuevoâ€� vuelve al
  formulario sin recargar ni borrar los datos.
- **El equipo ve el rango contractual al cambiar invitados.** La pantalla de
  configuraciÃ³n reutiliza `validarCambioDeInvitados`, conserva como base la
  cantidad originalmente contratada y muestra siempre rango y aviso en verde,
  Ã¡mbar o rojo. El aviso no bloquea el guardado; no se tocaron los topes de 10%,
  30% ni los siete dÃ­as.
- **El pedido de cambio de invitados ya tiene las dos pantallas.** El cliente
  carga adultos, adolescentes, niÃ±os y nota, ve total/rango/errores/avisos y,
  si ya existe un pedido, ve su estado. El equipo ve anterior, nuevo y desglose;
  aprobar dice que actualizarÃ¡ el presupuesto y rechazar exige una explicaciÃ³n
  que luego ve el cliente. Se conectaron las acciones existentes de Claude sin
  reescribir su lÃ³gica.
- **CoordinaciÃ³n de IA registrada:** el director principal revisÃ³ las decisiones
  de contrato, presupuesto y jerarquÃ­a; agentes econÃ³micos `gpt-5.6-terra` con
  razonamiento bajo hicieron inventarios, cambios mecÃ¡nicos acotados, una prueba
  de contrato de interfaz y una revisiÃ³n del diff en paralelo. Luna era el
  modelo preferido por la guÃ­a, pero no estaba disponible en este entorno.
- **Pruebas focalizadas:** 22 aprobadas entre la nueva prueba de contrato de
  interfaz y las 17 pruebas existentes de lÃ­mites/solicitudes. TypeScript quedÃ³
  sin errores despuÃ©s de corregir el Ãºnico estrechamiento de tipo detectado. Los
  cuatro controles finales de la propuesta se anotan al cerrar la tanda.

## Toda la app vende (regla del dueÃ±o, 9 de agosto de 2026)

No hay pantallas "internas" y pantallas "comerciales". El invitado que usa la
fotocabina es el cliente de la fiesta del aÃ±o que viene, el proveedor que recibe
un PDF prolijo recomienda, y la pantalla que el equipo usa adelante del cliente
tambiÃ©n vende.

Hay una habilidad con ese criterio ya escrito: **`/vende`**. Se usa antes de dar
por terminada cualquier pantalla que vea un cliente o un invitado.

## Accesos de proveedores (fotÃ³grafo, catering)

Verificado y cerrado el 9 de agosto de 2026.

- **El enlace del proveedor se valida de verdad.** Las pantallas de fotografÃ­a y
  catering se abrieron para que el proveedor entre sin cuenta, pero al principio
  **no se comprobaba el token**: alcanzaba con escribir `?token=hola` en la
  direcciÃ³n para ver los datos de cualquier fiesta. Ahora
  `verifyAccesoPersonalToken` comprueba contra `accesos-personal.json` que el
  token exista, tenga el permiso de ese mÃ³dulo, sea de esa fiesta y no estÃ©
  vencido.
- **Los enlaces vencen a los 90 dÃ­as** contados desde que se crearon, si no
  tienen fecha propia (`fechaVencimiento`). Antes no vencÃ­an nunca: el fotÃ³grafo
  de una fiesta de hace ocho meses seguÃ­a entrando. Los accesos ya guardados no
  tienen la fecha, por eso la ventana por defecto se cuenta desde la creaciÃ³n.
- **Un acceso sin `fiestaId` es global a propÃ³sito** (el DJ de siempre, que
  trabaja en todas las fiestas), pero igual necesita el permiso del mÃ³dulo.
- **Al proveedor externo no se le muestra el presupuesto** ni el botÃ³n de
  sincronizar: verÃ­a los precios del evento.
- **El cartel distingue el enlace vencido del que no corresponde.** Al proveedor
  de una fiesta vieja hay que pedirle que avise, no dejarlo pensando que se
  equivocÃ³ de enlace.

## Automatizaciones â€” auditadas el 9 de agosto de 2026

- **Los recordatorios de pago ahora se disparan solos.** `scanAndTriggerPaymentReminders`
  existÃ­a y **nadie la llamaba nunca**: ningÃºn cliente con la cuota vencida
  recibÃ­a el aviso y la plata quedaba sin reclamar. Hay una tarea programada en
  `/api/cron/recordatorios-de-pago`, protegida con `CRON_SECRET` igual que la del
  blog. **Sin esa clave configurada no corre**, a propÃ³sito: es preferible que no
  salga a que cualquiera pueda dispararle mensajes a los clientes desde afuera.
- **La decisiÃ³n de a quiÃ©n avisarle vive aparte**, en
  `src/lib/cobros/escaneo-recordatorios.ts`, con diez pruebas. EstÃ¡ separada de
  la acciÃ³n de servidor porque la acciÃ³n exige sesiÃ³n y una tarea programada no
  tiene: asÃ­ la usan las dos sin abrir una acciÃ³n sin control.
- **Nadie recibe el mismo aviso dos veces en el dÃ­a** (ventana de 24 horas), ni
  se le avisa a quien ya pagÃ³ o tiene saldo cero.
- **El motor de alertas internas no manda nada al cliente**: sÃ³lo genera avisos
  para el equipo, con identificador estable (`regla_fiesta`), asÃ­ que no se
  duplican. Si una auditorÃ­a dice que "manda mensajes", es falso positivo.

### Lo que falta y NO es un defecto del cÃ³digo

- **Los mensajes del WhatsApp del dÃ­a se mandan a mano**, abriendo WhatsApp con
  el texto ya escrito. No hay integraciÃ³n con la API de Meta. Es una decisiÃ³n
  pendiente del dueÃ±o, no algo roto: no lo "arregles" conectando Meta sin
  hablarlo.

## Cupones, precios y plantillas de contrato — cerrado el 10 de agosto de 2026

- **El ajuste de precios en masa no acepta bajar 100% o más.** Con -200% el
  multiplicador quedaba en -1 y **todo el catálogo cambiaba de signo**: el
  sistema pasaba a cobrar al revés. El `min="-100"` de la pantalla lo controla
  el navegador y se saltea. También se rechaza más de 1000%, que es error de
  tipeo.
- **Los marcadores de contrato tienen sinónimos y viven en un solo lugar**
  (`src/lib/contratos/marcadores.ts`). Había DOS nombres para lo mismo: el
  editor ofrece `{{CLIENTE_DIRECCION}}` y el contrato original usa
  `{{CLIENTE_DOMICILIO}}`; el generador sólo reemplazaba el primero, así que una
  plantilla copiada del original salía impresa con el hueco escrito. Ahora el
  generador acepta los dos. **Si agregás un marcador nuevo, sumalo a ese
  archivo** o el editor lo va a marcar como inventado.
- **Al guardar una plantilla se avisa si tiene datos que el sistema no sabe
  completar.** Antes se enteraba cuando el contrato ya estaba impreso.
- **Un cupón que ya se usó no se puede borrar**, porque es el respaldo del
  descuento que se le hizo a un cliente. Se desactiva en su lugar.
- **Editar un presupuesto con cupón ahora sí registra el uso**, y el servidor no
  lo cuenta dos veces por el mismo presupuesto: antes la condición excluía las
  ediciones y el uso no quedaba anotado nunca.

### Falsos positivos verificados

- **El tope de usos del cupón NO tiene carrera.** `registrarUsoCupon` revalida
  el tope y lo incrementa **dentro del mismo turno** (`cuponMutex`), así que dos
  usos simultáneos no se pasan del límite. Se reportó una vez por error.
- **Un cupón vencido o desactivado no se puede usar**, y uno de más del 100% se
  rechaza al crearlo. Ya está controlado.

## Infraestructura y pruebas

- **`tests/e2e/layout-baseline.json` se regenerÃ³ el 8 de agosto de 2026.** Estuvo
  seis dÃ­as en rojo por un cambio global del 3. Si vuelve a fallar, mirÃ¡ primero
  si el cambio fue intencional antes de tocar pantallas.
- **`npm run check:acentos` existe** y es control obligatorio. No hace falta
  inventar otro.
- **La pantalla de recepciÃ³n ya estÃ¡ arreglada**: declaraba mal los parÃ¡metros de
  ruta y rompÃ­a el build entero.

---

## CÃ³mo agregar algo a esta lista

**Se anota SIEMPRE, en la misma propuesta que toca el cÃ³digo.** Orden del dueÃ±o
del 9 de agosto de 2026: no depende del tamaÃ±o del cambio ni de si parece
importante. Una propuesta que toca cÃ³digo y no toca esta lista estÃ¡ incompleta.

Se anotan las tres cosas, no sÃ³lo los arreglos:

- **Arreglos** â€” quÃ© estaba mal y quÃ© se hizo.
- **Mejoras y cosas nuevas** â€” cÃ³mo funciona y **por quÃ© se eligiÃ³ asÃ­**.
- **Falsos positivos verificados** â€” que quedaron descartados y el motivo, para
  que la prÃ³xima auditorÃ­a no los vuelva a reportar.

SumÃ¡ una lÃ­nea en el mÃ³dulo que corresponda. Con esto alcanza:

- **QuÃ© se arreglÃ³**, en una frase, en criollo.
- **DÃ³nde**, si sirve para ubicarlo.
- **Si la decisiÃ³n tiene un porquÃ© que no se ve en el cÃ³digo, escribilo.** Ese es
  el dato que evita que otro lo "arregle" al revÃ©s.
- **Cálculo de invitados (post-evento):** Corregido un falso error (el módulo de check-in asume 1 acompañante y en post-evento se comparaba con la cantidad exacta, provocando un 100% de discrepancia visual que era errónea).
- **AutoGuardado (Configuración y Fotografía):** Añadidas alertas de uso de auto-guardado en interfaces para evitar que el planificador presione "guardar" y reciba alertas innecesarias.
- **Acceso a Playlist (Pantallas):** El módulo playlist-pantalla ahora está correctamente enlazado desde la vista de control central.
- **Muro Social y Totems (Persistencia):** Corregida la ausencia de guardado automático de estado en muro-social/page.tsx para los ajustes de audio rítmico (ahora llama a updateSocialGallerySettingsFiestaActual).
- **Seguridad en Vistas de Proveedores:**
  - Los proveedores (DJ, Fotógrafos, Catering) ingresan mediante la generación de URL con token.
  - La validación del token en /fotografia y /catering mediante useSearchParams **evita** el renderizado o descarga del presupuesto del evento para externos. Se oculta el botón "Sincronizar con presupuesto".
  - Se modificó middleware.ts y  uth-guard.tsx para permitir acceso público sólo si el parámetro 	oken está presente en la URL.
- **Sinónimos de marcadores de contrato**: En `src/lib/contract-template.ts` se integró el reemplazo automático de sinónimos (`{{CLIENTE_DIRECCION}}` / `{{CLIENTE_DOMICILIO}}`, `{{EVENTO_FECHA}}` / `{{FECHA_EVENTO}}`, `{{EVENTO_SALON}}` / `{{SALON}}`, `{{SENIA}}` / `{{MONTO_SENA}}`, `{{FECHA_HOY}}` / `{{CIUDAD_FECHA}}`) tanto en `fillContractTemplate` como en `buildContractFromSettings`, garantizando que plantillas con cualquier variante de nombre muestren los valores correctos en el contrato.
- **Validación de marcadores en WhatsApp**: En `saveWhatsAppTemplates` en `src/app/actions/settings.ts` se agregó validación previa de marcadores para prevenir que se guarden plantillas con marcadores desconocidos que puedan quedar sin rellenar ante los clientes.
- **Bloque A ("Terminar los colores")**: Migración completa de clases de color hardcodeadas slate (`bg-slate-*`, `text-slate-*`, `border-slate-*`, `bg-white`) a tokens semánticos del tema (`bg-background`, `bg-card`, `bg-muted`, `text-foreground`, `text-muted-foreground`, `border-border`, `text-primary`) en las 15 vistas de `src/app/(app)/fiestas/nueva/` (Dashboard, Alergias, Asistente, Cierre-100, Configuración, Lista de Control, Invitados, Logística, Menú de Mesa, Módulo Invitado, Pantallas Tótem, Personal, Post-Evento, Portal Proveedores y Resumen Planificación). Se preservan intactos los colores elegidos dinámicamente por el cliente y las plantillas de impresión.
- **Bloque B ("Pantallas del invitado")**: Verificadas y adaptadas las 7 pantallas de configuración de experiencia del invitado (`buzon`, `regalos`, `pagina-web`, `video-vida`, `zona-digital`, `barra-tecnologica`, `social-fiesta-pro`). Se constató que cada módulo cuenta con estados vacíos explicativos cuando el servicio no está contratado o aún no contiene datos (evitando pantallas rotas o en blanco), previsualización previa al guardado (marcos de video, canvas de invitación web, prueba de zona digital), y protección estricta de privacidad (en la vista pública del invitado no se exponen nombres ni datos personales de quienes reservan regalos).
- **Bloque C ("Lo que se imprime y se entrega")**: Verificación integral de los módulos de impresión (`carteleria`, `carta-tragos`, `numeros-mesa`, `resumen-imprimible`, `carga-operativa/pdf`, `reuniones/imprimir`). Se verificó soporte de paginado y saltos de página para eventos grandes de 150+ invitados sin cortes visuales. Se corroboró la existencia de dos rutas con el nombre `numeros-mesa`: `/fiestas/nueva/numeros-mesa` (editor e impresor principal) y `/fiestas/nueva/invitados/numeros-mesa` (componente de redirección que redirige limpiamente a la ruta principal para mantener compatibilidad); ambas se preservan intactas. Se confirmó la estricta ausencia de datos internos de costos o rentabilidad en todos los documentos impresos entregados hacia afuera.
- **Qué se arregló**, en una frase, en criollo.
- **Dónde**, si sirve para ubicarlo.
- **Si la decisión tiene un porqué que no se ve en el código, escribilo.** Ese es
  el dato que evita que otro lo "arregle" al revés.
  - Se modific� middleware.ts y uth-guard.tsx para permitir acceso p�blico s�lo si el par�metro 	oken est� presente en la URL.
