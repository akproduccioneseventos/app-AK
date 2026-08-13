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
- **Presentación LED alineada con el catálogo de papel (13 de agosto de 2026)**:
  - **Bloque 1 — Logos de empresas**: cargados en local (`public/logos/`) con sus 12 nombres reales visibles (Correo Uruguayo, Salto Hotel & Casino, Plus Medical, A.S.DE.M. y A., Woslen, APC Salto, INC, Antel, ABRA, INAU, Intendencia de Salto, Club Uruguay) y administrables desde Ajustes → Contenido público.
  - **Bloque 2 — Pantalla del equipo ("Hay equipo")**: nueva diapositiva `EquipoSlide` ubicada antes de los precios (después del salón), mostrando fotos del equipo trabajando, cantidad de profesionales (11) y frase en criollo, adaptable por tipo de evento y desde Ajustes.
  - **Bloque 3 — Salón Club Uruguay**: pantalla actualizada resaltando los 120 años de historia, ubicación céntrica, capacidad +120 personas, limpieza completa incluida y **sin mencionar portero en ningún lado**.
- **Los controles rojos de GitHub son por facturación de la cuenta.** No los
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

## Auditoría PARA-GEMINI.md (PR #932)

- **Stock de barra**: Se removió la llamada duplicada a `descontarStock` en entrega de pedidos y se agregó `reponerStock` automático en caso de cancelación de pedido.
- **WhatsApp automatización**: Se agregó resolución e inserción de `targetPhone` normalizado en eventos de presupuesto creado y enviado.
- **Pantalla Barman**: Se encerró `loadData()` en `try/catch/finally` garantizando la eliminación del cargando (`setIsLoading(false)`) e informando adecuadamente si la red falla.
- **Pantalla Gigante**: Notificación clara de fallos de red/conexión con cartel gigante para distinguirlos de "esperando contenido".
- **`getFiestaActual()`**: Reordenado para priorizar fiesta del día en Uruguay, luego futura cercana, luego pasada reciente.
- **Eliminación de proveedores**: Bloqueado si el proveedor posee insumos vinculados.
- **Personal**: Tope de máximo 2 roles por persona por fiesta con aviso descriptivo y etiqueta de recuento en Select.
- **Recibos de personal**: Se añadieron campos `pagadoPor` y `pagadoEn` al marcar recibos de sueldos como pagados.
- **Plataforma 360**: Se cambió botón inerte "Cámara Lenta Activada" por `<div>` informativo de estado.
- **Plantillas de contrato**: Se agregó validación de marcadores desconocidos al guardar, para que no queden `{{ALGO}}` inventados en el contrato impreso.

## Auditoría PARA-GEMINI.md — Nuevos hallazgos (11 de agosto de 2026)

- **Bloque 1 — Protección contra borrado en uso**:
  - `deleteInsumo`: Bloqueado si el insumo se utiliza en recetas o menús de catering.
  - `deleteServicioEmpresa`: Bloqueado si el servicio está incluido en presupuestos.
  - `deleteMenu`: Bloqueado si el menú está seleccionado en presupuestos, si uno de sus platos quedó como ítem histórico o si está asignado a una fiesta.
  - `deleteActivoFijo`: Bloqueado si el activo fijo está asignado en la lista de carga de cualquier evento.
- **Bloque 2 — Protección de sueldos**: El dueño conserva `PERMISOS.SUELDOS`; el perfil `personal` puede abrir únicamente su propio portal cuando coincide el usuario o el correo de su ficha. No puede consultar el portal de otro empleado.
- **Bloque 3 — Identidad real en aprobaciones y playbooks**: En `aprobarCambio`, `rechazarCambio` (`approvals.ts`) y `applyPlaybookToFiesta` (`playbooks.ts`) la identidad sale solamente de la sesión firmada del servidor. Los nombres enviados por la pantalla se conservan como parámetros antiguos, pero ya no se usan como respaldo.
- **Bloque 4 — Formatos visuales**:
  - Moneda cambiada de `es-AR` / `ARS` a `es-UY` / `UYU` en la pantalla de aprobaciones.
  - Validación de sueldos no negativos (`min={0}`) en UI (`personal/page.tsx`) y en servidor (`personal.actions.ts`).
  - Fechas ajustadas a formato uruguayo `es-UY` en `auditoria`, `incidentes`, `eventos` y `pagos-rapidos`.

### Revisión cruzada Codex sobre la PR de Claude

- Se corrigió una regresión detectada en revisión: exigir `SUELDOS` sin excepción dejaba al personal con un 404 al abrir su propio portal.
- Se corrigió la trazabilidad de menús: `selectedMenuId` ahora forma parte del presupuesto persistido y vuelve a cargarse al editarlo.
- Se eliminó el respaldo de identidad controlado por el navegador en aprobaciones, rechazos y aplicaciones de playbooks.
- Se corrigió la protección de servicios en presupuestos: Claude consultaba `item.id`, una propiedad inexistente que hacía fallar TypeScript; se usa el ID real `idServicioCatalogo` y el nombre histórico.
- Se agregaron comprobaciones de regresión en `release-security-boundaries.test.ts` para estos tres límites.

---

## Candidato final del 11 de agosto de 2026

- **Portal LED y presupuesto usan el mismo criterio de catering.** El selector de
  adultos ya no trata el catálogo completo de platos principales como si fuera un
  único menú ni suma todos sus platos. Cada plato principal es una opción. Las
  entradas, el plato adulto y el menú infantil/adolescente se transfieren como
  ítems reales al presupuesto manual y quedan incluidos en el total.
- **El total visible del Portal LED dejó de ser un aproximado incompleto.** Ahora
  suma entradas y aplica el motor central a servicios fijos, por persona, por
  ratio o por tramos. El importe flotante y el cierre muestran ese total completo.
- **El total del Portal LED se calcula después de preparar sus entradas.** Se
  corrigió el orden de declaración que TypeScript detectó en la congelación final.
- **La importación de catering al presupuesto tiene dependencias estables.** El
  efecto incluye el conversor de platos que usa, eliminando la advertencia de
  hooks y evitando cierres con referencias antiguas.
- **Hay un control financiero cruzado en Auditoría.** El botón `Revisar ahora`
  recalcula presupuestos y facturas, detecta pagos repetidos, cobros mayores al
  total, facturas duplicadas y enlaces rotos entre presupuesto, factura y fiesta.
  Es de sólo lectura: nunca cambia saldos ni documentos automáticamente.
- **Los 19 eventos reales no se declararon revisados desde JSON local.** La copia
  local no contiene esos presupuestos, facturas y fiestas. Deben verificarse con
  el nuevo control dentro de la app autenticada, donde lee los datos actuales de
  Firebase. Un resultado local vacío no sirve como aprobación contable.
- **La pantalla gigante exige evento asignado.** Dueño y perfiles autorizados
  conservan acceso. Un operador sólo puede controlar una fiesta si su usuario o
  correo coincide con un empleado incluido en `personalAsignado` de esa fiesta.
  Las votaciones de invitados siguen públicas y limitadas por frecuencia.
- **La moderación es segura por defecto.** Las fiestas nuevas y las antiguas sin
  configuración explícita dejan fotos y videos pendientes de aprobación. Sólo una
  fiesta configurada expresamente con `requireApproval: false` publica directo.
- **Google Workspace valida identidad y rol en el servidor.** La cuenta
  corporativa y el panel son del dueño; una cuenta personal sólo la conecta su
  propio empleado o el dueño; sincronizar una fiesta exige organización y acceso
  a ese evento, sincronizar todas exige administración y las citas exigen CRM.
- **Marketing ya no finge una publicación externa.** Guardar un post conserva el
  estado elegido y no lo marca como publicado mediante un `console.log`. La
  sincronización de Instagram y la agenda social exigen permiso de CRM.
- **El secreto del cron de blog viaja sólo en Authorization Bearer.** Ya no se
  acepta en la URL, donde podía quedar registrado en historial y logs.
- **Consultar un pago de Mercado Pago ya no crea acceso al presupuesto.** La ruta
  pública de estado devuelve solamente estado e importes. Para volver, el mismo
  navegador conserva localmente el enlace que ya tenía antes de ir a Mercado Pago;
  una sesión filtrada no se transforma en un token nuevo del documento.
- **El cron de recordatorios conserva la automatización sin abrir el CRM.** Las
  personas necesitan permiso para leer o crear mensajes; la tarea validada usa un
  token interno no serializable. Su secreto se acepta sólo en el encabezado y no
  queda expuesto en la URL.
- **Agenda y Google Workspace vuelven a respetar el trabajo de secretaría.** La
  sincronización de una fiesta exige organización y alcance sobre ese evento, no
  acceso a sueldos. La sincronización masiva permanece reservada al dueño.
- **La portada vuelve a ser estática con renovación cada cinco minutos.** Se quitó
  un `searchParams` sin uso que forzaba render dinámico y hacía esperar a cada
  visitante las fuentes de galería, testimonios, Instagram, YouTube y salones.
- **Evidencia del candidato congelado:** TypeScript completo quedó sin errores,
  lint sobre los archivos tocados quedó sin errores ni advertencias y 143/143
  pruebas focalizadas en 13 suites quedaron aprobadas. Las tandas anteriores de regresión
  terminaron en 99/99, 114/114, 18/18 y 104/104. La suite Jest completa se
  intentó una vez, siguió activa más de diez minutos y fue detenida por el límite
  de la herramienta sin resumen; no se cuenta como verde. El build de producción
  con datos locales siguió activo durante treinta minutos y fue detenido sin
  resumen, por lo que tampoco se declara aprobado. El E2E de producción no se
  ejecutó al no existir un build terminado en esta máquina.
- **Graphify quedó actualizado sobre el candidato.** El índice estructural contiene
  7.801 nodos, 28.664 relaciones y 377 comunidades. El parser de Graphify avisó
  20 archivos parcialmente interpretados, pero TypeScript sí compiló todo el
  proyecto; se registra como limitación del índice, no como aprobación omitida.

## Continuacion de lanzamiento iniciada en la PR #941

- **La PR #941 fue fusionada durante la validacion.** Contiene el bloque inicial
  hasta `80384e07`. Las correcciones y evidencia producidas despues quedaron en
  la PR `#942`, porque GitHub no permite agregar commits a una PR fusionada.
- **El rojo de GitHub es una limitacion aceptada.** Firestore rules, CI, browser
  smoke y CodeQL no ejecutaron pasos: GitHub anoto bloqueo de cuenta por
  facturacion. El dueno no agregara tarjeta. No se corrige con codigo.
- **No se reinicia la auditoria terminada.** La continuacion usa este documento y
  `ESTADO-ACTUAL.md` como matriz. Solo se vuelven a ejecutar controles necesarios
  para build, E2E, Firebase, roles, integraciones, entretenimiento, visual y
  rendimiento que aun no tengan evidencia de lanzamiento.
- **La continuacion tiene una sola PR abierta: #942.** No crear otra propuesta
  paralela; documentar ahi el fallo reproducido, la correccion y su prueba.
- **El build de produccion es reproducible.** Sobre el commit publicado
  `80384e07052a4245ef70a81bc69f044859e34c11`, Next genero las 265 paginas y
  termino con codigo 0 en 9 minutos 44 segundos. Las advertencias encontradas se
  mantienen separadas de los errores y se revisan en esta misma continuacion.
- **Google OAuth ya no acepta una direccion imposible.** La configuracion ahora
  detecta que falta un origen publico absoluto y rechaza `0.0.0.0` antes de
  enviar al usuario a Google. Se agrego una prueba para origen ausente,
  `0.0.0.0` y desarrollo local.
- **Instagram tiene variables documentadas.** `.env.example` incluye el token
  privado y el identificador de cuenta profesional que usa la sincronizacion
  real. No se afirma conexion sin credenciales ni respuesta del proveedor.
- **La prueba de Instagram refleja el permiso vigente.** La sincronizacion manual
  ya estaba protegida con permiso CRM, pero su prueba aun simulaba una sesion
  generica. Se actualizo el doble de prueba sin reducir la seguridad del servidor.
- **Autenticacion e integraciones tienen una tanda focalizada aprobada.** Nueve
  suites y 42 pruebas cubrieron sesion, identidad Google, correo Workspace,
  redireccion OAuth, integraciones externas, Instagram, limites de rutas,
  Mercado Pago y generacion de imagenes con Gemini.
- **Las reglas de Firestore se ejecutaron en emulador.** Las 20 pruebas aprobaron;
  los mensajes `PERMISSION_DENIED` del registro corresponden a escrituras que la
  prueba esperaba rechazar. Firebase Tools solo aviso que una version futura
  requerira Java 21; la version actual ejecuto y cerro correctamente.
- **Los proveedores en vivo siguen siendo evidencia separada.** Estas pruebas no
  afirman que Gmail envio, Mercado Pago cobro, Instagram publico ni Gemini genero
  en produccion sin credenciales validas y una respuesta real de cada servicio.
- **Portales publicos y pantallas del evento aprobaron PC y celular.** Playwright
  abrio el portal del cliente, el portal individual del invitado, la carta de
  tragos, la red social, la barra publica, el totem y el mural en vivo. No encontro
  enlaces administrativos, errores del navegador ni desborde horizontal.
- **El primer arranque lento no se confundio con un boton roto.** La primera ruta
  del portal en Next desarrollo necesito compilacion en frio y supero el limite
  de tres minutos; con la ruta compilada, el mismo recorrido de PC termino en 39
  segundos y celular tambien aprobo. Se conserva como evidencia de velocidad del
  entorno de desarrollo, no como fallo funcional de la carta de tragos.
- **El simulador aprobo su recorrido comercial en ambos tamanos.** Seis pruebas
  completaron el precio desde el simulador, el ingreso desde catalogo y la
  descarga de un PDF formal para un evento de ano futuro en PC y celular.
- **Recuperacion publica y viaje del invitado aprobaron.** Trece recorridos
  verificaron acceso protegido, recuperacion de clave, portada, campos legibles,
  confirmacion y rechazo, QR, conteo sin duplicados, sincronizacion con el equipo
  y acceso del cliente con su clave. El ultimo caso se repitio solo porque el
  servidor de desarrollo se reinicio durante la primera navegacion; la repeticion
  termino correctamente y no se cambio codigo por una caida del entorno.
- **Los accesos flotantes ya no tapan la web en celular.** La revision visual
  encontro que subir, cotizar y WhatsApp formaban una columna de casi media
  pantalla sobre la galeria. En movil quedan Cotizar y WhatsApp en una barra
  compacta inferior; subir se conserva en PC. Se elimino el gradiente violeta
  ajeno a la marca y se mantuvieron los mismos destinos comerciales. El bloque
  tambien calcula su visibilidad al montar para funcionar al volver a una
  posicion guardada o entrar desde un enlace interno.
- **Las estaciones de entretenimiento aprobaron navegador y responsive.** Las
  pantallas de operador, la camara simulada de fotocabina, la capsula con sus
  modos y marco final, y el selector tactil del espejo IA pasaron en PC; los
  casos aplicables tambien pasaron en celular. Tres pruebas de captura completa
  se omiten en movil por diseno del dispositivo, no por fallo.
- **La subida al muro responde y se recupera.** PC y celular mostraron resultado
  tras publicar y el muro no quedo girando despues de un intento fallido. La
  primera ejecucion de PC excedio el limite durante compilacion en frio; la misma
  subida, repetida sola con la ruta compilada, aprobo en 56 segundos.
- **Hardware fisico no se declara probado.** La camara simulada valida el flujo
  web, pero esta computadora no demuestra la impresora configurada, codecs de
  cada tablet, brazo fisico de plataforma 360 ni rendimiento de la red del salon.
- **El menu de mesa restaura de verdad el ultimo guardado.** La referencia existia
  pero no se leia al fallar: la pantalla restauraba el mismo borrador. Ahora se
  actualiza al cargar y al guardar con exito, y se usa ante un error del servidor.
- **Los accesos por token no quedan viejos al navegar.** Catering y fotografia
  incluyen el token actual en la carga memorizada; contrato y moodboard eliminan
  dependencias que no se utilizan. El comportamiento queda expresado sin avisos
  de hooks.
- **Los metadatos globales tienen dominio publico.** Open Graph y Twitter ya no
  resuelven imagenes contra `localhost` cuando una pantalla usa los metadatos del
  layout raiz.
- **La imagen de Bogue conserva el elemento imprimible correcto.** La tira es un
  `blob` o `data URL` generado en el navegador; se mantiene `img` de forma
  deliberada y se documenta la excepcion local para no fingir una optimizacion
  incompatible con impresion.
- **El build completo dejo solo dependencias externas conocidas.** Tras corregir
  hooks, metadatos y la excepcion de Bogue, las advertencias propias quedaron
  eliminadas. El aviso restante de Webpack nace en `express` dentro de Genkit y
  los mensajes de cache describen serializacion del compilador; no corresponden
  a una ruta rota ni se silencian desde el codigo de negocio.
- **El candidato productivo abre los modulos internos criticos.** El artefacto de
  265 paginas inicio en 5,6 segundos y Playwright recorrio dashboard,
  contabilidad, pagos rapidos, presupuestos, clientes y eventos con una sesion
  firmada, sin respuestas HTTP de error, expulsion al login, mensaje de panel
  roto ni desborde horizontal.
- **Los portales restaurados conservan el alcance de seguridad.** El planificador
  cargo el evento seleccionado y el acceso por token de proveedor mostro solo su
  trabajo asignado, sin revelar el nombre del cliente. La tanda de produccion
  completo 3/3 pruebas en 53,3 segundos.
- **La velocidad se mide en produccion local, no por compilacion en frio.** El
  primer acceso a rutas nuevas en `next dev` puede tardar minutos porque compila;
  el mismo codigo construido sirvio los recorridos internos completos en menos de
  un minuto. La portada mantiene ISR de cinco minutos para no reconstruir fuentes
  de galeria y redes en cada visita.
- **El personal no puede quedar en dos eventos al mismo tiempo.** La validacion
  usa fecha y horario local de Uruguay, contempla fiestas que cruzan medianoche
  entre dias consecutivos y permite eventos contiguos. Un choque confirmado se
  bloquea en el servidor antes de guardar y muestra todos los primeros eventos
  involucrados. Si falta una hora no inventa `21:00 a 04:00`: guarda con un aviso
  para que el encargado complete los horarios.
- **La agenda se lee una sola vez al asignar personal.** Varias personas nuevas
  se comparan contra la misma foto de fiestas activas. Editar sueldo o rol de una
  asignacion existente no vuelve a cargar toda la agenda en cada tecla. Si la
  lectura necesaria falla, no se guarda ni se envian avisos de Google; el equipo
  recibe el error y puede reintentar sin crear una asignacion sin verificar.
- **Dos servidores no pueden reservar al mismo empleado a la vez.** Un bloqueo
  corto por empleado en Firestore cubre la lectura y el guardado; si otra
  instancia ya esta actualizando esa agenda, la segunda operacion pide reintentar.
  Los bloqueos vencen solos para no dejar personal inutilizable ante una caida.
- **Los rechazos de Google Workspace quedan visibles.** Si Google responde
  `success: false` sin lanzar una excepcion, la asignacion ya guardada se conserva
  y el motivo queda registrado como aviso para poder reintentar la sincronizacion.
- **La matriz cerrada no sustituye el mundo real.** Los 19 eventos requieren
  Firebase productivo; Gmail, Instagram, Mercado Pago y Gemini requieren
  credenciales y respuesta del proveedor; impresora, camaras, codecs, brazo 360
  y Wi-Fi requieren prueba fisica en el salon. Esos puntos se dejan explicitamente
  pendientes en lugar de declararlos aprobados por simulacion.

## Puesta al dia de los eventos y el ajuste anual (12 de agosto de 2026)

- **El ajuste anual no se aplicaba a los contratos sin facturar.** La marca que lo
  activa (`ajusteAnualActivo`) se ponia en un solo lugar: al marcar el presupuesto
  como Facturado. Un presupuesto Aceptado y todavia sin facturar nunca la recibia, y
  `calcularEstadoDeCuenta` la exige para aplicar el ajuste. Resultado: la aplicacion
  mostraba el precio del anio en que se firmo. En los contratos cargados de eventos
  anteriores son miles de pesos por contrato. Ahora se completa al quedar contratado
  (Aceptado o Facturado), dentro de `normalizePresupuestoFinancials`; las
  importaciones historicas ya activan la misma marca en su flujo propio.
  **Se completa solo cuando nunca se decidio**: si el duenio lo apago a proposito
  para un cliente, se respeta.
- **Pantalla nueva "Poner al dia los eventos"**, en Auditoria y de solo lectura.
  Encuentra fiestas pasadas que siguen abiertas, eventos viejos con equipo asignado
  o tareas sin terminar, fiestas sin presupuesto vinculado, contratos de anios
  anteriores sin el ajuste anual (con cuanto se deja de cobrar) y presupuestos
  aceptados cuya fecha paso sin evento creado. No cierra ni cobra nada por su
  cuenta.
- **Correcciones de la revision de Codex, todas validas:** el saldo pendiente usa el
  estado de cuenta con ajuste (con el total pelado, un contrato pagado al precio
  viejo no mostraba nada); no se insiste con el ajuste cuando el duenio lo apago a
  proposito; se cuentan las tareas del equipo (`tareas`) ademas de la lista del
  cliente (`clientChecklist`), que son cosas distintas; y las fiestas archivadas se
  usan solo para saber que un presupuesto ya tiene su evento, sin revisarlas como si
  estuvieran abiertas.
- **Segunda auditoria contable de la misma propuesta:** el anio se toma desde la
  fecha real de firma, no desde una creacion anterior del presupuesto; el saldo
  cobrable, los recibos, pagos rapidos, dashboard, portal y Mercado Pago incluyen
  el ajuste sin modificar el total base del presupuesto; y el limite de pagos ya
  permite cobrar exactamente ese saldo ajustado. Las operaciones legales de
  cancelacion y cambio de fecha conservan el total base para no aplicar el ajuste
  dos veces.
- **La pantalla ya no duplica lecturas de Firestore.** Carga activos una vez y el
  historial por separado. Tambien enlaza cada alerta con el evento o presupuesto
  exacto para poder resolverla, y la accion tiene una prueba que impide leer datos
  si falta el permiso de Contabilidad.

## Galería, subida de archivos y editor de invitación (12 de agosto de 2026)

- **Cualquiera de afuera podía dejar archivos en el depósito de la empresa.** La
  acción que sube imágenes (`uploadPublicPageAsset`) no pedía sesión, y es la que
  usan la galería, el editor de la invitación, la portada y las fichas del
  personal. Cualquiera que conociera la dirección podía subir lo que quisiera y
  quedaba publicado con una dirección nuestra, ocupando lugar que se paga todos
  los meses. Ahora pide sesión del equipo. **Por qué se puede pedir sesión sin
  romper nada:** se revisaron todos los lugares que la usan y son todos pantallas
  internas; el invitado sube fotos por otro camino distinto (el muro social), que
  no se tocó.
- **Sacar una foto de la galería no la sacaba del todo.** Se iba de la lista pero
  quedaban dos rastros: el archivo seguía para siempre en el depósito, y la foto
  seguía apareciendo en el catálogo, porque al subirla se guarda un gemelo que
  apunta al mismo archivo. El dueño borraba una foto y el cliente la seguía
  viendo. Ahora se limpian los tres lugares. **Por qué se eligió así:** el archivo
  se borra sólo si es nuestro y si ninguna otra foto ni video lo está usando; si
  se borrara a ciegas, una foto compartida dejaría un cuadro roto en pantalla. La
  lógica está en `src/lib/galeria/borrado-seguro.ts` con pruebas propias.
- **Se podía dar por firmado un contrato sin ser del equipo.** Subir el contrato
  firmado en papel no pedía sesión, y esa misma acción marca el contrato como
  firmado y deja el evento como Contratado, que es lo que dispara la seña y la
  organización. Igual pasaba con los documentos adjuntos del evento. Las dos
  piden sesión del equipo ahora.
- **La fecha de la ceremonia se guardaba con hora universal.** En el editor de la
  invitación, el calendario de cada ceremonia guardaba la fecha con hora, y al
  volver a abrirlo mostraba el día anterior; si el equipo tocaba el calendario,
  ese día corrido se guardaba y era el que veía el invitado. Ahora se guarda el
  día suelto, igual que la fecha del evento, y se lee con `parseEventDate`.
- **Editor de invitación y vista previa (12 de agosto de 2026).**
  - **Bloque 1 — Indicador de guardado en móvil**: En `src/components/ui/auto-save-indicator.tsx` y `pagina-web/page.tsx` se ajustó la visibilidad para que en celulares se muestre el estado de guardado (íconos visibles y texto adaptado a `sm`). En caso de error de guardado, la barra muestra el ícono rojo y al tocarlo salta la explicación completa del error.
  - **Bloque 2 — Fidelidad en vista previa de plantillas**: Se removió el filtro `!isPreview` de los `EventParticles` en `GraziaTemplate.tsx` y `AllegriaTemplate.tsx` para que las animaciones de fondo se dibujen exactas en la vista previa del editor, sin afectar las restricciones funcionales de RSVP ni contadores.
  - **Bloque 3 — Verificación de datos mínimos antes de compartir**: En `pagina-web/page.tsx`, al presionar "Ver Real", copiar el enlace de la invitación, o descargar el código QR, el sistema verifica si faltan datos esenciales (fecha, hora, salón, dirección). Si faltan, no bloquea la acción sino que abre un aviso en criollo detallando qué falta, con opción de completarlo o continuar de todos modos. La función de validación `getDatosMinimosFaltantesInvitacion` fue extraída y exportada correctamente para que la prueba unitaria la ejecute sin fallos.

## El sitio no podía aparecer en Google (12 de agosto de 2026)

- **Google tenía prohibido mostrar todo el sitio.** Había una instrucción, de
  cuando la aplicación era sólo interna, que le decía a todos los buscadores que no
  indexaran ninguna página. Con eso puesto, la portada y las páginas de bodas,
  quince, cumpleaños, catálogo y blog **no podían aparecer en una búsqueda**, por
  más bien escritas que estuvieran. Ahora se abre página por página.
- **Por qué se eligió abrir de a una y no todo.** En el mismo dominio conviven las
  páginas de venta, las pantallas internas del equipo y las pantallas con datos de
  una persona: el portal del cliente, las invitaciones con la lista de invitados,
  la opinión post evento y los accesos del personal. Si se abriera todo, la fiesta
  de un cliente podría aparecer en una búsqueda. Queda **cerrado por defecto** y la
  lista de lo permitido vive en `src/lib/seo/paginas-publicas.ts`. Si mañana se
  agrega una pantalla nueva y nadie toca la lista, queda cerrada, que es el error
  barato.
- **Se agregó el listado de páginas que se le entrega a Google**, que antes no
  existía: aunque hubiera tenido permiso, tenía que encontrarlas de casualidad. Sale
  de la misma lista que los permisos, así que no puede ofrecer una página prohibida
  ni olvidarse de una permitida. Hay pruebas que verifican las dos cosas.
- **Inventario nuevo en `docs/QUE-HAY-EN-LA-APP.md`.** Qué existe de verdad en
  inteligencia artificial, redes sociales, marketing y posicionamiento, con el
  estado de cada cosa. **Se lee antes de salir a inventariar nada**, para no volver
  a auditar lo mismo; cuando se toca algo de esa lista, se actualiza ahí mismo.

## Testimonios reales y recontacto del que no señó (12 de agosto de 2026)

- **La presentación que se le proyecta al cliente mostraba testimonios inventados.**
  La aplicación junta opiniones reales y el dueño las aprueba una por una, y esas
  aprobadas ya salían en la portada, pero la pantalla grande —donde más venden—
  seguía con una lista escrita a mano. Ahora usa las reales aprobadas.
- **Por qué se controla dos veces que estén aprobadas.** La consulta ya devuelve
  sólo las aprobadas, y `src/lib/testimonios/para-mostrar.ts` vuelve a filtrar. Es a
  propósito: **una opinión mala nunca se publica** (orden del dueño), y si alguien
  cambia la consulta o le pasa la lista completa por error, igual no se cuela.
  Mientras no haya ninguna aprobada se muestran las de ejemplo, para no dejar la
  pantalla vacía en medio de una venta.
- **El recontacto del que pidió presupuesto y no señó estaba escrito y apagado.**
  La función y el mensaje existían desde hacía tiempo pero **ningún lugar del código
  la llamaba**: trabajo hecho que no rendía nada. Ahora corre dentro del marketing
  automático, cada seis horas.
- **Por qué viene apagado de fábrica y con un interruptor en Ajustes.** Son mensajes
  de WhatsApp a clientes reales y no se pueden deshacer; nadie los dispara por
  sorpresa al publicar una versión nueva. El interruptor es sólo para el
  administrador. Las reglas de a quién se le escribe viven separadas del envío, en
  `src/lib/marketing/candidatos-recontacto.ts`, con pruebas propias: pasaron 48
  horas, dio permiso de marketing, **una sola vez en la vida**, nunca a quien ya
  contrató ni a quien está en una etapa terminada del embudo. Se anota la marca sólo
  a los que recibieron el mensaje de verdad, así un envío fallido no pierde al
  prospecto.

## Planificador de redes y ficha de negocio para Google (12 de agosto de 2026)

- **El planificador decía "Publicado" sobre algo que la app no publicó.** Lo que se
  importa de Instagram ya está publicado *en Instagram*, pero en el planificador se
  leía como si la aplicación lo hubiera publicado, y la aplicación **no publica en
  ninguna red**: el contenido se redacta acá y se copia y pega a mano. Ahora esos
  quedan como "Importado de IG", con color propio, separados de lo que el equipo
  todavía tiene que publicar.
- **La ficha de negocio para Google** (nombre, dirección, teléfono, coordenadas de
  Salto y redes) estaba sólo en la portada. Ahora también está en bodas, quince,
  cumpleaños y el blog, que son las páginas que traen clientes.
- **Por qué la ficha del blog apunta a `/public/blog` y no a `/blog`.** `/blog`
  sólo redirige, y además está fuera de la lista de páginas que Google puede mirar.
  Apuntar la ficha a una dirección prohibida no sirve de nada.

### Lo que se descartó de esa propuesta, y por qué

La propuesta traía además su propia versión de los testimonios reales y del
recontacto del que no señó, que **ya estaban hechos y fusionados** poco antes. De
haberla tomado entera, habría borrado el filtro doble que impide publicar una
opinión mala, las reglas probadas de a quién se le puede escribir por WhatsApp y
sus veinte pruebas. Se rescató sólo lo de arriba. Tampoco se tomó un segundo
interruptor de recontacto en la pantalla de WhatsApp: ya hay uno en Ajustes →
Contenido público, y dos interruptores para lo mismo confunden y se contradicen.

## Control de gasto de la inteligencia artificial (12 de agosto de 2026)

- **Nadie avisaba cuánto se gastaba por mes.** Los topes que ya existían (tres
  intentos por invitado, ciento cincuenta por hora por estación) frenan el abuso de
  una persona, pero con cuatro fiestas grandes seguidas el gasto se notaba recién en
  la factura, cuando ya estaba gastado. Ahora se cuenta cada foto con efecto y se ve
  en Ajustes → Contenido público, con el gasto estimado del mes.
- **Se puede poner un tope en pesos**, y al llegar al 80% avisa antes de que se
  dispare.
- **Por qué al llegar al tope no se corta nada.** La fotocabina y el espejo siguen
  andando: sacan la foto igual, con el efecto simple, sin gastar. Es el mismo camino
  que ya existía para cuando el servicio no está configurado. **Nunca se le corta la
  foto a un invitado por una cuestión de plata**, y menos en medio de una fiesta.
- **Por qué ante un error de lectura se deja gastar.** Quedarse sin efectos toda una
  noche por un problema al leer el contador es peor que gastar de más una vez. Lo
  mismo al anotar: si falla el guardado, la foto sale igual y se pierde un número del
  contador.
- **Se guarda un contador por mes y no un renglón por foto**, para no llenar la base
  con miles de registros en una sola fiesta.
- El costo por generación es una **estimación** para ver la tendencia y frenar a
  tiempo, no la factura del proveedor. Está en `src/lib/ai/consumo.ts` y se cambia
  ahí si cambia el precio.

## Títulos para Google en las pantallas públicas (12 de agosto de 2026)

- **Faltaba título y descripción propios** en la experiencia AK, la galería LED, la
  presentación de tecnología, el portafolio y el catálogo. Google mostraba esas
  páginas sin nombre propio.
- **Por qué el del catálogo va en la envoltura y no en la pantalla.** El catálogo se
  dibuja del lado del navegador, y esas pantallas no pueden declarar título. Va en
  `src/app/catalogo/layout.tsx`.
- **No se abrió ninguna página nueva a Google.** La lista de lo permitido sigue
  igual, cerrada a propósito, en `src/lib/seo/paginas-publicas.ts`. Poner título en
  una pantalla interna no la publica: sólo mejora el nombre de la pestaña.

## Las cuatro ideas grandes (12 de agosto de 2026)

Llegaron de una propuesta de Gemini que **no compilaba** y traía dos cosas graves.
Se repararon y se fusionó. Quedó andando:

- **El mensaje de recontacto ahora lo escribe la inteligencia artificial** con los
  datos de esa persona. Si el servicio falla o se llegó al tope de gasto, **manda el
  mensaje de siempre**: nadie queda sin mensaje ni recibe uno a medio escribir.
- **Asistente de ventas en las páginas públicas**, apagado de fábrica.
- **Video del recuerdo** por evento, armado con las fotos del muro. Sólo entra
  contenido aprobado, porque lee la lista pública que ya filtra por aprobación.
- **Repaso de la mañana** en el panel interno: reusa el reporte de "Poner al día" y
  esconde los cobros a quien no tiene el permiso de Contabilidad.

### Lo que hubo que corregir, y por qué

- **El asistente de ventas aparecía en TODA la aplicación.** Se filtraba con una
  lista de pantallas prohibidas, incompleta: el globito de ventas salía encima de la
  invitación de un casamiento, del portal de un cliente que ya contrató, de las
  estaciones de la fiesta y de la presentación proyectada en el salón. Ahora es al
  revés, **lista de lo permitido**: sólo las páginas de venta, las mismas que ve
  Google. Una pantalla nueva queda sin asistente por defecto, que es el error
  barato. Está en `src/lib/public-experience/donde-va-el-asistente.ts` con pruebas.
- **Daba por dado el permiso para escribirle al cliente.** Guardaba
  `marketingConsent: true` fijo cada vez que llegaba a armar el presupuesto, sin
  importar lo que la persona hubiera contestado. Ese permiso es justo lo que
  habilita mandarle WhatsApp automático después. Ahora se exige que el resumen lo
  marque **y** que la última respuesta de la persona sea un sí. Si no, el dato se
  guarda igual pero sin permiso: se pierde poder escribirle solo, que se arregla
  llamándola, y no al revés.
- **No se arma el presupuesto desde el chat.** La propuesta lo intentaba inventando
  los datos que espera la función real (subtotal, costo estimado, servicios
  incluidos), que son las cuentas que el cliente ve como precio firme. Sacarlas de
  una conversación es inventar plata. El dato del interesado se guarda y el equipo
  arma el presupuesto donde esas cuentas están bien hechas.
- **Dos textos de venta cambiados sin pedirlo**, y a peor: el cierre del asistente
  pasaba de invitar a una reunión a un simple "ya anotamos tus datos". Se devolvieron
  los originales.
- **La segunda llamada a la inteligencia artificial no se contaba** en el gasto. Ya
  se cuenta.
- Errores mecánicos reparados: nombres de campos inexistentes en tres lugares, y la
  pantalla del video declaraba mal sus datos, lo que hacía fallar la publicación
  aunque el revisor de tipos pasara.

## Ganancia real y comparación entre fiestas (12 de agosto de 2026)

- **La ganancia se mostraba contra el gasto estimado, no contra el real.** El
  Analizador de Rentabilidad calculaba lo cobrado menos lo que se *estimaba*
  gastar. Los pagos a proveedores se registraban aparte y no entraban en la cuenta,
  así que **si el evento se iba de gasto, el número seguía viéndose lindo**. Ahora
  manda lo que se pagó de verdad en cada renglón que tenga pagos cargados, y donde
  no hay pagos se usa el estimado. La tarjeta dice cuál de las dos cosas está
  mostrando, en vez de decir siempre "estimada".
- **Pantalla nueva: "Qué fiesta deja más plata".** Compara todas las fiestas juntas,
  agrupadas por tipo de evento y por mes. Entra desde el Panel Contable. El
  analizador de siempre muestra una fiesta por vez; esto contesta la pregunta que
  decide qué conviene vender.
- **Por qué la cuenta vive en un solo archivo** (`src/lib/costos/ganancia-evento.ts`):
  antes cada pantalla la rehacía y dos mostraban números distintos de la misma
  fiesta, porque una se olvidaba de descontar la merma de bebidas, que viene contada
  dos veces en los datos. Ahora las tres pantallas usan la misma suma y las dos
  trampas conocidas están resueltas ahí adentro, explicadas: la merma duplicada y
  el costo de proveedores, que ya está dentro de los renglones y no se suma aparte.
- **Por qué el margen de un grupo se calcula sobre los totales** y no promediando
  los porcentajes de cada fiesta: promediar le daría el mismo peso a una fiesta de
  diez personas que a una de trescientas.
- **Un pago que no corresponde a ningún renglón igual se cuenta** como plata que
  salió. Esconderlo mostraría una ganancia que no existe.
- La pantalla avisa cuántas fiestas todavía no tienen pagos cargados, para que se
  sepa qué parte del número es estimación.
- Pide el permiso de Contabilidad, no alcanza con tener sesión: se ve lo que se le
  cobró a cada cliente y lo que dejó cada evento.

## La seña se cobraba de menos (12 de agosto de 2026)

- **El botón "Pagar seña" cobraba siempre $5.000**, sin mirar la seña acordada con
  ese cliente. Ese número era el valor de último recurso, pensado para cuando no hay
  ningún dato. En un evento grande el cliente apretaba, pagaba cinco mil pesos, y la
  reserva quedaba señada con una fracción de lo acordado. La diferencia aparecía
  mucho después, al ir a cobrar el resto.
- **Lo peor: la aplicación ya sabía el número correcto.** El resumen que se le
  muestra al cliente antes de firmar usa la seña acordada, o el 20% del total. Eran
  dos lugares distintos diciendo cosas distintas sobre la misma plata.
- **Ahora la cuenta vive en un solo lugar** (`src/lib/budget/monto-de-senia.ts`) y la
  usan el botón y el cobro: primero la seña acordada con ese cliente; si no hay, el
  monto general. Nunca se cobra más que el saldo pendiente.
- **Decisión del dueño, 12 de agosto de 2026: la seña es un monto fijo, hoy $5.000,
  no un porcentaje del evento.** Se le preguntó expresamente. Si alguna auditoría
  marca que "la seña debería seguir al tamaño del evento", es falso positivo.
- **El monto se edita desde Ajustes → Presentación del presupuesto**, así que el día
  que suba no hay que tocar código ni pedirle nada a nadie. Empieza en $5.000.
- **El botón y el cobro leen la misma cuenta**, a propósito. Si el botón dijera un
  número y se cobrara otro, el cliente pierde la confianza justo en el momento en
  que está reservando.

### Falsa alarma verificada

Se reportó que "el cliente no puede pagar solo, la función está desconectada de la
pantalla". **Es falso:** el botón de Mercado Pago existe y el cliente lo usa desde
su presupuesto, con seña y saldo, en cuotas. Y el aviso de pago acreditado entra
solo por el webhook, que verifica la firma y actualiza el saldo sin que nadie toque
nada. Lo único que estaba mal era el monto.

## Sin usuario se veía plata, y una prueba que no probaba nada (12 de agosto de 2026)

- **Preguntar por los permisos de alguien que no existe devolvía los de secretaria**,
  que incluyen ver contabilidad. Venía de la conversión de las cuentas viejas: el que
  no tiene perfil cargado se trata como secretaria, y eso está bien para una cuenta
  de verdad, pero no para la ausencia de cuenta. Una pantalla que preguntaba antes de
  terminar de cargar la sesión mostraba números que no le correspondían. Ahora sin
  usuario no se puede nada. **La conversión de las cuentas viejas no cambió.**
- **La regla de qué contenido del muro se muestra estaba copiada en nueve lugares**
  distintos: el listado público, el tótem del salón, el muro en vivo, la impresión y
  el video del recuerdo. Nueve copias de la regla que decide si una foto sin revisar
  aparece proyectada delante de toda la fiesta; alcanzaba con que una quedara vieja.
  Ahora vive en `src/lib/social-fiesta/visibilidad.ts` y las demás la usan.
- **Se reescribió una prueba que no podía fallar.** Armaba una lista inventada
  adentro de la prueba y después la filtraba ahí mismo, así que probaba su propio
  filtro y no el de la aplicación: si el video hubiera dejado de descartar las fotos
  pendientes, seguía en verde. Ahora llama a la función de verdad. Una prueba que no
  puede fallar es peor que no tener prueba, porque el que la lee cree que la regla
  está protegida.

## Los logos de las empresas, de verdad (13 de agosto de 2026)

- **Ahora son los reales y viven adentro de la aplicación.** Se sacaron del catálogo
  impreso de la empresa, recortados uno por uno y verificados a ojo antes de
  nombrarlos: Correo Uruguayo, Salto Hotel & Casino, Plus Medical, A.S.DE.M. y A.,
  Woslen, APC Salto, INC, Antel, ABRA, INAU, Intendencia de Salto y Club Uruguay.
  Los doce, cada uno con su nombre visible en pantalla.
- **Por qué no se cargan más desde afuera:** venían del sitio de Canva de la
  empresa. Si esa página cambiaba o se caía, los logos desaparecían en medio de la
  presentación, delante del cliente.
- **Dos cosas que ya salieron mal y no se repiten** (hay pruebas que las cuidan):
  no se dibujan logos —una entrega los reemplazó por rectángulos de color con el
  nombre escrito en una tipografía cualquiera, que no es el logo de nadie y usa mal
  la marca de un tercero—, y no se adivina qué nombre va con qué logo.
- Se pueden reemplazar y sumar clientes nuevos desde Ajustes → Contenido público.
- **Se borró `quienes-somos-slide`**, que quedaba muerta al lado de la pantalla del
  equipo. Estaba terminada pero nunca enganchada a la presentación.

## Cómo agregar algo a esta lista

**Se anota SIEMPRE, en la misma propuesta que toca el código.** Orden del dueño
del 9 de agosto de 2026: no depende del tamaño del cambio ni de si parece
importante. Una propuesta que toca código y no toca esta lista está incompleta.

Se anotan las tres cosas, no sólo los arreglos:

- **Arreglos** — qué estaba mal y qué se hizo.
- **Mejoras y cosas nuevas** — cómo funciona y **por qué se eligió así**.
- **Falsos positivos verificados** — que quedaron descartados y el motivo, para
  que la próxima auditoría no los vuelva a reportar.

Sumá una línea en el módulo que corresponda. Con esto alcanza:

- **Qué se arregló**, en una frase, en criollo.
- **Dónde**, si sirve para ubicarlo.
- **Si la decisión tiene un porqué que no se ve en el código, escribilo.** Ese es
  el dato que evita que otro lo "arregle" al revés.
