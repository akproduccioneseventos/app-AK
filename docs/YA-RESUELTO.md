# Ya resuelto — NO lo vuelvas a reportar ni a "arreglar"

**Leé esto ANTES de auditar cualquier cosa.** Vale para Codex, Gemini, Claude y
cualquier ayudante que salga a buscar problemas.

En este proyecto trabajan varias IA en paralelo, en cuentas distintas. Sin esta
lista pasa lo siguiente: una auditoría nueva encuentra "un problema", lo reporta,
alguien lo arregla otra vez, y a veces **deshace** el arreglo bueno con uno peor.
Ya pasó: dos propuestas protegieron el mismo archivo de maneras distintas y al
fusionarse dejaron la pantalla colgada para siempre.

**Regla: si algo de esta lista aparece en tu auditoría, es falso positivo.** Si
creés que igual está mal, no lo arregles: decilo y esperá respuesta.

Quien arregle algo nuevo, **lo agrega acá en la misma tanda**. Si no queda
anotado, la próxima auditoría lo va a volver a encontrar.

---

## Decisiones del dueño (no son errores, no se discuten)

- **Lo que le toca a Gemini, Claude no lo programa.** Claude escribe código sólo
  en plata, cobros, comida y permisos; el resto va a una orden en
  `docs/ordenes/`. Programarlo igual le cuesta el doble al dueño.
- **Propuestas grandes, no muchas chicas.** Cada fusión dispara un despliegue y
  se paga. Se junta la tanda entera en una sola propuesta. La documentación
  viaja con el código, nunca en una propuesta aparte. **Vale también para las
  órdenes que una IA le escribe a otra**: una orden de cinco bloques se entrega
  en una sola propuesta con los cinco, no en cinco. El dueño lo tuvo que repetir
  el 10 de agosto de 2026 porque la orden pedía lo contrario que la regla.

- **El ajuste anual del 15% va siempre.** Aparece en presupuestos y en el portal.
- **El descuento del 50% del Salón Club Uruguay** y el descuento del presupuesto
  son decisiones de marketing.
- **La lista de compras usa los invitados del PRESUPUESTO**, no los confirmados.
  Se cocina lo que se contrató. Si vienen más, se agregan y el presupuesto sube.
- **El invitado marca cuántos del grupo son niños o adolescentes.** Antes la
  invitación pública metía a todos como `'Adulto'` fijo, así que una familia de
  dos grandes y tres chicos entraba como cinco adultos y el menú salía mal. Ahora
  se pregunta y se guarda en `kidsCount`, el desglose fino del grupo.
  **`categoria` sigue existiendo** para las pantallas que muestran una sola
  etiqueta: no la saques.
- **El conteo para cocinar sale del PRESUPUESTO, no de los confirmados.** Y eso
  ya funciona solo: `syncFiestaFromBudget` copia `invitadosAdultos` e
  `invitadosNinos` del presupuesto a la fiesta, y `syncLinkedFiesta` lo dispara
  cada vez que el presupuesto se guarda o se actualiza. **Si los invitados
  aumentan, el conteo se actualiza solo.** El dato que marca el invitado sirve
  para saber a quién llevarle cada menú en la mesa, no para comprar.
- **Los límites de cambio de invitados salen del contrato y ya están en código.**
  El contrato (`src/lib/contract-template.ts`) dice: *"La lista final deberá
  entregarse siete días antes. Podrá reducirse hasta 10% de los invitados,
  ajustando solo servicios por persona, y aumentarse hasta 30%, sujeto a
  disponibilidad y pago previo. No habrá devolución por inasistencias."* Eso
  estaba en el papel y en ningún lado del sistema, así que se podía bajar la
  cantidad un 40% sin que nada avisara. Ahora la regla vive en
  `src/lib/budget/cambio-de-invitados.ts`, con diez pruebas. **El redondeo va a
  favor del cliente** (con 55 contratados puede bajar a 49, no a 50).
  **Si cambiás un tope, cambialo también en el contrato**, o el sistema y el
  papel dejan de decir lo mismo.
- **El cliente puede pedir el cambio de invitados desde su portal.** Bajar hasta
  10% o subir hasta 30%, poniendo cuántos adultos, adolescentes y niños. Las
  acciones están en `portal.actions.ts`
  (`submitClientGuestCountChangeRequest`, `approve...`, `reject...`), con siete
  pruebas. Decisiones tomadas, **no las cambies sin motivo**:
  - **El pedido NO se aplica solo.** Queda pendiente y lo resuelve AK, porque
    subir invitados mueve el precio y hay que confirmar con el salón.
  - **Fuera de los límites del contrato ni se toma el pedido**: se le explica al
    cliente el rango en el momento. Tomarlo para rechazarlo después le hace
    perder el viaje.
  - **Un pedido pendiente por vez.** Si no, se acumulan tres y no se sabe cuál
    vale.
  - **Al aprobar se actualiza el PRESUPUESTO**, no sólo la fiesta: de ahí sale
    lo que se compra y se cocina.
- **El "Tal vez" de la invitación se saca: se confirma o no se confirma.** Un
  "tal vez" no sirve para encargar comida ni poner sillas. **Pero el estado
  `'Tal vez'` NO se borra del tipo `RsvpStatus`**: hay invitados guardados con
  ese valor y romperían las pantallas. Sólo se saca el botón de la invitación.
- **El invitado SÍ puede cambiar su respuesta**, y eso ya funciona: al responder
  de nuevo con el mismo nombre, `submitPublicRsvp` lo busca por nombre
  normalizado y lo actualiza, no lo duplica. Lo que falta es decírselo en
  pantalla. Va en `docs/ordenes/estetica-01.md`, bloque E.
- **Las fotos del muro se descargan con enlace directo, a propósito.**
- **Se trabaja sólo en pesos uruguayos.** No hay diferencias de redondeo en
  dólares que corregir.
- **Los controles rojos de GitHub son por facturación de la cuenta.** No los
  investigues. Vale lo que se verifica localmente.
- **El pasaje a la galería del cliente (wfolio) es manual.** No tiene forma
  documentada de automatizarse; ya se investigó. No armes una integración.

---

## Módulo de entretenimiento — TERMINADO

### Arreglado, no lo toques

- **Las cuatro estaciones de captura ya no mienten.** Cuando falla la subida no
  muestran más "escaneá tu recuerdo" con el código girando: avisan y ofrecen
  descargar o reintentar. Hay un componente compartido, `QrRecuerdo`, para que el
  defecto no se copie en la próxima estación.
- **Espejo mágico IA:** al fallar la IA se queda en revisión con la foto original
  y los botones para subirla, en vez de saltar al cartel de recuerdo listo. La
  cámara no se reenciende encima del cartel de error.
- **El operador ve las fallas del invitado** en su cabina, con la hora, y el
  aviso se borra solo cuando la estación vuelve a andar (`lastError` en la sesión).
- **El operador sabe si la IA no está disponible** antes de que llegue el primer
  invitado.
- **Pantalla gigante, muro, galería y red social** avisan si se cortó la conexión
  y distinguen "no hay nada" de "no se pudo cargar".
- **La zona digital** no tiene más tarjetas muertas; el **tótem** no muestra un QR
  que no sirve.
- **Trivia por mesa:** funciona, arma el ranking por mesa y el invitado sin mesa
  juega igual en el ranking individual.
- **El muro saluda por nombre** cuando la foto viene del enlace personal, y sigue
  funcionando sin nombre cuando viene del QR general del salón.
- **Las estaciones funcionan sin muro contratado.** La foto **se guarda siempre**;
  si el muro está pausado o no contratado queda como `pending` y no se ve. Nadie
  saltea la pausa de la moderación.

### La fotocabina funciona como las clásicas (9 de agosto de 2026)

Se copió el mecanismo de las cabinas del rubro, después de mirar cómo lo hacen
las que se venden hoy:

- **Tres fotos por tanda, encadenadas solas.** El invitado no toca nada entre
  foto y foto.
- **La primera cuenta es de 10 segundos y las otras de 4.** Es a propósito: en
  la primera la gente recién se acomoda; después ya está ubicada y una espera
  larga hace cola. **No las emparejes.**
- **Sólo se cantan en voz alta los últimos cinco números.** Contar desde diez
  tapa la música del salón.
- **La pantalla guía**: "Foto 2 de 3", con puntitos de avance y una frase
  distinta para cada una. Entre foto y foto sigue viéndose la cámara: si se
  cambia de estado, la pantalla queda en negro y el invitado se pierde.
- **Al terminar se arma una sola imagen** con las tres pegadas, el nombre del
  evento y la fecha, en formato 10x15. Se eligió la postal y no la tira finita
  de 5x15 porque la tira obliga a una impresora con cortadora.
- **Imprime sola, sin que el invitado apriete nada**, y después ofrece "quiero
  otra copia". La copia automática es la única que reinicia la cabina; las
  copias extra dejan la pantalla quieta para poder pedir más.
- **El muro es el extra, no el camino principal.** Si el cliente no contrató
  muro, la cabina imprime igual y no muestra el botón de publicar.
- **El espejo mágico también imprime**, y en el modo firma se imprime el lienzo
  para que salgan la firma y los stickers en el papel.
- **La impresión vive en un solo lugar** (`imprimirRecuerdo`), compartida entre
  la fotocabina y el espejo. Si agregás impresión a otra estación, usá esa: no
  armes una propia.
- **La galería del operador ya permite reimprimir** una foto que ya salió. No
  hace falta agregarlo.

### Qué produce cada estación (verificado en el código el 9/8/2026)

Lista corta para no volver a confundirse. Ya pasó: se describió el Bogue como
estación de video cuando es de fotos.

- **Fotocabina** — FOTOS. Tanda de tres, se arma una tira y se imprime.
- **Bogue** — **FOTOS.** Saca varias seguidas. Hoy sólo guarda el video
  boomerang que arma con ellas y **descarta las fotos**: eso está mal y va en
  `docs/ordenes/entretenimiento-03.md`, bloque B.
- **Espejo mágico foto** — FOTO, con filtro. Imprime.
- **Espejo mágico firma** — FOTO con firma y stickers encima. Imprime el lienzo.
- **Espejo mágico IA (touchpix)** — FOTO. Guarda la original y la generada.
- **Plataforma 360** — VIDEO de verdad, 15 segundos, grabado de la cámara.
- **Cápsula del tiempo (buzón)** — AUDIO o VIDEO. No se imprime.
- **Tótem** — NO CAPTURA NADA. Sólo muestra el código y las fotos aprobadas.

### Topes, ya calibrados

- **Videos del invitado: 15 segundos.** Es a propósito.
- **Tope del evento: 5000 fotos.** Antes eran 200 y cortaba la fiesta a la mitad.
  No lo bajes.
- **Generaciones de IA: 3 por sesión de foto**, contadas en el servidor con un
  identificador estable, más una red de contención de 150 por hora por estación.
- **Paquete de recuerdos: 300 MB por pedido**, y se puede pedir por estación
  (`?estacion=`). El límite es de memoria del servidor, no de la fiesta.
- **41 estilos de IA**, y se pueden elegir por fiesta con `allowedTemplateIds`.
  Vacío significa todos.

---

## Módulo de organización — TERMINADO

### Arreglado, no lo toques

- **Los conteos cuentan PERSONAS, no filas.** Celíacos en la pantalla de
  invitados y el reporte al catering ya usan `partySize`.
- **Los conteos de CONFIRMADOS también cuentan personas (9/8/2026).** Faltaban
  seis lugares que hacían `.filter(rsvp === 'Confirmado').length`: el avance del
  evento, las automatizaciones, las dos cuentas de `fiesta-progress`, el centro
  de experiencia y las plantillas de invitación. **Lo grave era que esos números
  se comparan contra `invitadosEstimados`, que sí son personas**: con 100
  estimados y 30 filas que eran 90 personas, el sistema mostraba 30% de avance y
  disparaba avisos de "faltan confirmaciones" con la fiesta casi llena. Hay una
  prueba que lo deja clavado: `conteo-confirmados-personas.test.ts`.
- **El que cancela sale del conteo solo**, porque deja de estar `'Confirmado'`.
  No hace falta restarlo a mano en ningún lado.
- **Las bebidas llegan a la lista de compras**, todas las categorías activadas,
  leyendo `fiestaData.bebidas`.
- **El autoguardado del diseño de decoración avisa cuando falla** y reintenta.
- **Borrar una foto del moodboard** confirma o avisa el error.
- **Los recibos del personal se autoguardan**, igual que la pantalla de personal.
- **El aviso de doble asignación** dice cuándo no se pudo verificar, en vez de
  callarse.
- **Primero se guarda, después se sincroniza con Google.** El orden es
  deliberado: al revés mandaba los avisos con la asignación vieja. **No lo
  muevas.**
- **En la lista de carga, el precio ya no se usa como cantidad.** Sin referencia
  de cobertura queda en 1 unidad.
- **El PDF del itinerario no muestra las notas internas del organizador** y
  filtra los momentos marcados como no visibles. Ese PDF lo ven proveedores.
- **El tablero central** muestra el avance por módulo, el avance general y el
  próximo paso sugerido con botón directo.
- **Buscador de empleados**, sincronización de carga que no duplica, tareas de
  proveedores que no se cortan en silencio, aviso de horarios que se pisan en el
  itinerario, y vista previa del portal del invitado.
- **El menú de mesa vuelve atrás el color** si el guardado falla, en vez de
  dejarlo visible como si hubiera guardado.
- **La descarga de recuerdos incluye el dominio propio de AK**
  (`galeria.akproducciones.uy`) en la lista de dominios habilitados.
- **El paquete de recuerdos baja ordenado por estación** y con el tipo de fiesta
  en el nombre.

### Ya existía antes, no lo construyas de nuevo

- **El álbum del portal del cliente.** Está en
  `src/app/portal-cliente/[id]/fotos-video/page.tsx` y `getContractedDownloads`
  ya decide qué mostrar según lo contratado. Una orden de trabajo pidió
  construirlo y se perdió el viaje entero.

---

## Planificación — pantallas de plata

- **La merma de bebidas ya no se cuenta dos veces** en el gestor de
  rentabilidad. `totalBebidasCost` viene con el 5% adentro y la merma figuraba
  además como item propio, así que el costo salía inflado y el margen más bajo
  que el real. El reporte de post-evento ya lo descontaba con
  `costosSinMermaDuplicada`; ahora las dos pantallas dan el mismo número.
- **El costo de proveedores NO va sumado aparte al margen.** Ya está adentro de
  `costosItems` como items `auto_prov_*`. `totalProveedorCost` es sólo el
  subtotal que se muestra en la tabla. **Si una auditoría dice que "falta sumar
  proveedores", es falso positivo:** sumarlo lo contaría dos veces. Ya se reportó
  una vez por error.

- **El porcentaje del ajuste anual se lee de la configuración en TODAS las
  pantallas.** El estado de cuenta lo hacía; el recibo de pago y las dos vistas
  del portal del cliente lo tenían clavado en 15%. El día que se cambiara el
  porcentaje en ajustes, el cliente iba a ver un saldo y AK otro. Ahora las
  cuatro le pasan el porcentaje configurado a la misma cuenta compartida. **Si
  agregás una pantalla que muestre saldo, pasale el porcentaje**: sin él vuelve
  al 15% fijo y reaparece la diferencia.
- **El contrato del salón ya se guarda.** Antes el botón "Finalizar" sólo cerraba
  el modo edición: lo que el equipo escribía (cláusulas, montos) se perdía al
  recargar, y peor, al abrir la pantalla se regeneraba el borrador y pisaba lo
  editado. Ahora hay botón de guardar, el texto vive en `contratoSalonTexto`, y
  lo guardado le gana al borrador automático.

- **El plan de pagos avisa si las cuotas no cubren el total del contrato.** Antes
  el "Total" de esa pantalla era la suma de las cuotas cargadas, así que un plan
  al que le faltaba plata se veía perfectamente cuadrado. Ahora compara contra el
  total real del evento (con el ajuste anual) y dice cuánto falta o cuánto sobra.

- **El contrato de servicio no pisa más las ediciones sin avisar.** Cambiar de
  plantilla o salir del modo edición con cambios sin guardar ahora pregunta
  antes. El botón dice "Salir sin guardar" para que se entienda que no guarda.
- **El contrato de servicio avisa si quedaron huecos sin llenar.** Si la
  plantilla trae un marcador que nadie reemplazó, sale un cartel naranja con la
  lista antes de imprimir, en vez de que el cliente reciba el contrato con
  `{{ALGO}}` escrito adentro.
- **Borrar un documento del evento pide confirmación**, con el nombre del
  documento. Ahí vive el contrato firmado.
- **Costos y rentabilidad no acepta importes negativos** ni inválidos, ni en
  gastos ni en pagos a proveedores. Un negativo inflaba la ganancia en silencio.

- **En servicios contratados, el personal sin categoría ya no aparece como
  Catering.** Tiene su propia sección "Otro personal", que explica que al rol le
  falta la categoría. Antes un DJ o un chofer figuraba entre los mozos.

## Pantallas del planificador: qué está conectado y qué no

Verificado el 8 de agosto de 2026. **No hay una plaga de pantallas huérfanas**,
como pareció al principio:

- **Los "centros de mando" duplicados no son un problema.** Seis pantallas
  (`centro-de-mando`, `centro-experiencia`, `comando-total`, `show-control`,
  `centro-total`, `mission-control`) son redirecciones de 18 líneas a
  `fiestas/[id]/centro`. Vienen de una unificación deliberada y existen para no
  romper enlaces guardados. **No las borres.**
- **Las pantallas de gestión documental están todas enlazadas** desde
  `gestion-documental/page.tsx`. No están huérfanas.
- **`planner-costo-fiesta` y `servicios-contratados`** se alcanzan por dirección
  directa aunque no tengan botón en el tablero.
- **`nueva/playlist-pantalla` SE CONECTA, no se retira.** Verificada el 9 de
  agosto de 2026: está terminada y funciona (lista de la pantalla en vivo más la
  configuración del muro social). Lo único que le falta es el botón que la
  enlace, y va en el bloque D de `docs/ordenes/planificacion-02.md`. **No la
  borres ni vuelvas a reportarla como huérfana.**

## Comercial y contable

Auditado el 9 de agosto de 2026. **Son 47 pantallas** entre los dos módulos (35
comerciales, 12 contables), no las que aparecen en el menú.

- **Guardar un presupuesto avisa si el cliente no quedó en el seguimiento.**
  Antes, si fallaba la sincronización con el CRM, el presupuesto se guardaba
  igual y decía "Guardado" a secas: el equipo creía que el cliente estaba
  cargado y no estaba. El guardado sigue sin bloquearse a propósito (el
  presupuesto vale más que el CRM), pero ahora vuelve el aviso a la pantalla.
- **Si el cupón no se pudo registrar, ahora se dice.** El descuento se aplicaba
  igual y el uso quedaba sin anotar en silencio.
- **Pagos rápidos no muestra más presupuestos archivados.** Filtraba por estado
  pero no por archivado, así que uno viejo dado de baja seguía en la lista.
- **Pagos rápidos muestra lo informado y sin confirmar.** El saldo cuenta sólo
  los pagos confirmados; si el cliente informaba uno, el saldo no se movía y
  parecía un error. Ahora aparece aparte, en ámbar.
- **El motivo del rechazo de un pago se ve en la lista**, sin tener que entrar
  al presupuesto.

- **Las facturas cobradas están protegidas.** Una factura con pagos ya no
  permite cambiarle el número ni la moneda, una factura pagada no puede volver a
  borrador, y no se puede eliminar una factura cobrada: es el comprobante del
  cobro. La validación está en el servidor, no sólo en la pantalla.
- **No se repiten números de factura.** **Los recibos de seña quedan afuera a
  propósito:** comparten el número por evento cuando el cliente paga la seña en
  varias veces, y la duplicación real ya la corta `findExistingDepositReceipt`.
  Si una auditoría dice que "faltan validar los números de seña", es falso
  positivo.
- **El WhatsApp del día avisa si el mensaje quedó pendiente.** Antes, si fallaba
  marcarlo como enviado, seguía en la lista y alguien lo mandaba dos veces al
  mismo cliente.

- **El catálogo no acepta precios negativos**, ni en el precio de venta, el
  precio base, el precio por persona, el costo estimado ni los tramos. Un
  negativo se arrastraba a todos los presupuestos que usaran ese servicio e
  inflaba la ganancia. **El cero sí se permite**: hay servicios de cortesía.
- **El reporte de ganancias y pérdidas muestra el error cuando falla.** Antes
  aparecía un triángulo rojo suelto, sin texto: nadie sabía si reintentar o
  cambiar las fechas.
- **El simulador exige un celular uruguayo de verdad.** Aceptaba cualquier cosa
  de 7 dígitos aunque el cartel prometiera otra cosa, así que llegaban pedidos
  de presupuesto a los que después no se les podía contestar.

### Falsos positivos ya verificados en estos módulos

- **Los recibos del personal NO dan NaN.** El cálculo del sueldo protege los
  porcentajes faltantes con `?? 0` y sólo divide si el divisor es mayor a cero.
- **La deduplicación de señas es deliberada.** Busca por evento, monto y día
  para no registrar dos veces el mismo pago. Que dos señas idénticas el mismo
  día se confundan es el precio de esa protección: no lo "arregles" sin hablarlo.
- **El precio tachado del Club Uruguay en el simulador es el doble a propósito.**
  Es el 50% de descuento que decidió el dueño. No es un error de cálculo.
- **El filtro "Con responsable" del CRM hace lo que dice la etiqueta.** La clave
  interna se llama `my_leads` por historia, pero no promete "los míos" en
  pantalla y el equipo ve el CRM completo igual. No es una filtración.
- **Las dos pantallas de servicios no están duplicadas por error.** La de
  ajustes es sólo de lectura y la de empresa es la que edita. Escriben en el
  mismo lado.
- **El panel contable no tiene divisiones por cero.** Se verificaron los
  márgenes, el flujo de caja y los reportes: todos protegen el divisor.
- **Los regalos del presupuesto NO se muestran mal.** Sale el precio unitario y
  el importe en cero porque **hay una columna de descuento que dice 100%**. Está
  explicado en la propia tabla.
- **El cartel de "Verificación Pendiente" muestra el total guardado a
  propósito.** Es lo que se está verificando antes de mandárselo al cliente. No
  es una inconsistencia con el total recalculado de abajo.
- **El filtro "Con responsable" del CRM hace lo que dice la etiqueta**: muestra
  los prospectos que tienen alguien asignado. La clave interna se llama
  `my_leads` por historia, pero no promete "los míos" ni filtra mal.

## Estética — auditada el 9 de agosto de 2026

La app **no está rota, está despareja**: 925 colores escritos a mano en 211
pantallas, 582 textos de menos de 12 píxeles y 8 variantes de borde redondeado
conviviendo. El detalle y el plan están en `docs/ordenes/estetica-01.md`, que le
toca a Gemini.

### Falsos positivos verificados: NO los vuelvas a reportar

- **Los colores en `style={{ backgroundColor: ... }}` del croquis del salón, la
  decoración, los números de mesa y las invitaciones NO son colores mal
  puestos.** Son los que **elige el usuario** para cada elemento. Se reportó una
  vez como "rompe la paleta" y es al revés: si los cambiás a tokens, el usuario
  pierde la posibilidad de elegir el color.
- **El `bg-white` de facturas, recibos y contratos es correcto.** Esos
  documentos se imprimen en papel.

### Tanda `estetica-01` — propuesta unificada del 9 de agosto de 2026

- **La escala visual queda fijada así: tarjetas `rounded-xl`, botones
  `rounded-lg` y campos `rounded-lg`.** Los componentes compartidos `Card`,
  `Button`, `Input`, `Select`, `Textarea` y `EmptyState` usan esa escala y los
  colores semánticos del tema. Se eligió una diferencia corta entre tarjeta y
  control para ordenar la interfaz sin volverla ni cuadrada ni exageradamente
  redonda.
- **Los botones, tarjetas y campos compartidos dejaron de imponer rojo, blanco
  y gris escritos a mano.** Ahora usan `primary`, `foreground`, `background`,
  `border`, `accent` y `destructive`, porque esos tokens ya tienen versión clara
  y oscura. No se tocaron los colores dinámicos que elige el usuario ni el
  blanco de los documentos imprimibles.
- **Alcance manual terminado del bloque de colores:** portal principal del
  cliente, sus variantes pública/Pro, confirmación de invitados, control del
  muro social, invitación pública, portal individual del invitado, contrato,
  moodboard, configuración de la fiesta y bandeja del portal del cliente. El
  resto de las 211 pantallas todavía necesita recorrerse pantalla por pantalla;
  no se hizo un reemplazo masivo imposible de revisar. Los componentes
  compartidos sí mejoran desde ahora toda la app.
- **Ningún `text-[8px]`, `text-[9px]`, `text-[10px]` o `text-[11px]` se renderiza
  por debajo de 12 px.** La garantía vive en `globals.css`, para corregir los
  cientos de usos históricos sin editar mecánicamente 71 pantallas. Las
  medidas de impresión en puntos no cambian. Además se corrigieron a mano las
  grillas móviles señaladas: cuenta regresiva, muro social, resumen de
  invitados y respuesta pública; el mensaje del invitado ya no queda cortado.
- **Los vacíos del portal explican qué falta y qué ocurre después.** Las líneas
  grises de checklist, cronograma, tragos, servicios, música, reuniones,
  decoración, documentos, catálogo y preguntas se reemplazaron por
  `EmptyState`. No se inventaron acciones de edición donde el cliente no tiene
  permiso: se aclara cuándo debe publicar o intervenir AK.
- **Las cargas públicas ya dicen qué están preparando.** Portal, contrato,
  moodboard, invitación individual y mini quiosco tienen texto y `aria-live`;
  sus fallos ofrecen reintento o un próximo paso. Las excepciones y mensajes
  técnicos del servidor ya no quedan expuestos a clientes o invitados en esos
  recorridos.
- **La acción principal del portal ahora coincide con el próximo paso real.**
  Puede llevar a pago, pagos en revisión, organización, invitados o contacto;
  si una fase no habilita organización, dirige al resumen financiero. Se quitó
  el pulso que hacía parecer urgente pagar siempre y las acciones posteriores
  quedan como secundarias.
- **La invitación pública ya no ofrece “Tal vez”.** Quedan sólo “Asistiré” y
  “No puedo”, anchos para el dedo. `RsvpStatus` conserva `Tal vez` para datos
  históricos y uso interno. La confirmación explica que se puede cambiar la
  respuesta con el mismo enlace y nombre, y “Responder de nuevo” vuelve al
  formulario sin recargar ni borrar los datos.
- **El equipo ve el rango contractual al cambiar invitados.** La pantalla de
  configuración reutiliza `validarCambioDeInvitados`, conserva como base la
  cantidad originalmente contratada y muestra siempre rango y aviso en verde,
  ámbar o rojo. El aviso no bloquea el guardado; no se tocaron los topes de 10%,
  30% ni los siete días.
- **El pedido de cambio de invitados ya tiene las dos pantallas.** El cliente
  carga adultos, adolescentes, niños y nota, ve total/rango/errores/avisos y,
  si ya existe un pedido, ve su estado. El equipo ve anterior, nuevo y desglose;
  aprobar dice que actualizará el presupuesto y rechazar exige una explicación
  que luego ve el cliente. Se conectaron las acciones existentes de Claude sin
  reescribir su lógica.
- **Coordinación de IA registrada:** el director principal revisó las decisiones
  de contrato, presupuesto y jerarquía; agentes económicos `gpt-5.6-terra` con
  razonamiento bajo hicieron inventarios, cambios mecánicos acotados, una prueba
  de contrato de interfaz y una revisión del diff en paralelo. Luna era el
  modelo preferido por la guía, pero no estaba disponible en este entorno.
- **Pruebas focalizadas:** 22 aprobadas entre la nueva prueba de contrato de
  interfaz y las 17 pruebas existentes de límites/solicitudes. TypeScript quedó
  sin errores después de corregir el único estrechamiento de tipo detectado. Los
  cuatro controles finales de la propuesta se anotan al cerrar la tanda.

## Toda la app vende (regla del dueño, 9 de agosto de 2026)

No hay pantallas "internas" y pantallas "comerciales". El invitado que usa la
fotocabina es el cliente de la fiesta del año que viene, el proveedor que recibe
un PDF prolijo recomienda, y la pantalla que el equipo usa adelante del cliente
también vende.

Hay una habilidad con ese criterio ya escrito: **`/vende`**. Se usa antes de dar
por terminada cualquier pantalla que vea un cliente o un invitado.

## Accesos de proveedores (fotógrafo, catering)

Verificado y cerrado el 9 de agosto de 2026.

- **El enlace del proveedor se valida de verdad.** Las pantallas de fotografía y
  catering se abrieron para que el proveedor entre sin cuenta, pero al principio
  **no se comprobaba el token**: alcanzaba con escribir `?token=hola` en la
  dirección para ver los datos de cualquier fiesta. Ahora
  `verifyAccesoPersonalToken` comprueba contra `accesos-personal.json` que el
  token exista, tenga el permiso de ese módulo, sea de esa fiesta y no esté
  vencido.
- **Los enlaces vencen a los 90 días** contados desde que se crearon, si no
  tienen fecha propia (`fechaVencimiento`). Antes no vencían nunca: el fotógrafo
  de una fiesta de hace ocho meses seguía entrando. Los accesos ya guardados no
  tienen la fecha, por eso la ventana por defecto se cuenta desde la creación.
- **Un acceso sin `fiestaId` es global a propósito** (el DJ de siempre, que
  trabaja en todas las fiestas), pero igual necesita el permiso del módulo.
- **Al proveedor externo no se le muestra el presupuesto** ni el botón de
  sincronizar: vería los precios del evento.
- **El cartel distingue el enlace vencido del que no corresponde.** Al proveedor
  de una fiesta vieja hay que pedirle que avise, no dejarlo pensando que se
  equivocó de enlace.

## Automatizaciones — auditadas el 9 de agosto de 2026

- **Los recordatorios de pago ahora se disparan solos.** `scanAndTriggerPaymentReminders`
  existía y **nadie la llamaba nunca**: ningún cliente con la cuota vencida
  recibía el aviso y la plata quedaba sin reclamar. Hay una tarea programada en
  `/api/cron/recordatorios-de-pago`, protegida con `CRON_SECRET` igual que la del
  blog. **Sin esa clave configurada no corre**, a propósito: es preferible que no
  salga a que cualquiera pueda dispararle mensajes a los clientes desde afuera.
- **La decisión de a quién avisarle vive aparte**, en
  `src/lib/cobros/escaneo-recordatorios.ts`, con diez pruebas. Está separada de
  la acción de servidor porque la acción exige sesión y una tarea programada no
  tiene: así la usan las dos sin abrir una acción sin control.
- **Nadie recibe el mismo aviso dos veces en el día** (ventana de 24 horas), ni
  se le avisa a quien ya pagó o tiene saldo cero.
- **El motor de alertas internas no manda nada al cliente**: sólo genera avisos
  para el equipo, con identificador estable (`regla_fiesta`), así que no se
  duplican. Si una auditoría dice que "manda mensajes", es falso positivo.

### Lo que falta y NO es un defecto del código

- **Los mensajes del WhatsApp del día se mandan a mano**, abriendo WhatsApp con
  el texto ya escrito. No hay integración con la API de Meta. Es una decisión
  pendiente del dueño, no algo roto: no lo "arregles" conectando Meta sin
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

- **`tests/e2e/layout-baseline.json` se regeneró el 8 de agosto de 2026.** Estuvo
  seis días en rojo por un cambio global del 3. Si vuelve a fallar, mirá primero
  si el cambio fue intencional antes de tocar pantallas.
- **`npm run check:acentos` existe** y es control obligatorio. No hace falta
  inventar otro.
- **La pantalla de recepción ya está arreglada**: declaraba mal los parámetros de
  ruta y rompía el build entero.

---

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
- **C�lculo de invitados (post-evento):** Corregido un falso error (el m�dulo de check-in asume 1 acompa�ante y en post-evento se comparaba con la cantidad exacta, provocando un 100% de discrepancia visual que era err�nea).
- **AutoGuardado (Configuraci�n y Fotograf�a):** A�adidas alertas de uso de auto-guardado en interfaces para evitar que el planificador presione "guardar" y reciba alertas innecesarias.
- **Acceso a Playlist (Pantallas):** El m�dulo playlist-pantalla ahora est� correctamente enlazado desde la vista de control central.
- **Muro Social y Totems (Persistencia):** Corregida la ausencia de guardado autom�tico de estado en muro-social/page.tsx para los ajustes de audio r�tmico (ahora llama a updateSocialGallerySettingsFiestaActual).
- **Seguridad en Vistas de Proveedores:**
  - Los proveedores (DJ, Fot�grafos, Catering) ingresan mediante la generaci�n de URL con token.
  - La validaci�n del token en /fotografia y /catering mediante useSearchParams **evita** el renderizado o descarga del presupuesto del evento para externos. Se oculta el bot�n "Sincronizar con presupuesto".
  - Se modific� middleware.ts y uth-guard.tsx para permitir acceso p�blico s�lo si el par�metro 	oken est� presente en la URL.
