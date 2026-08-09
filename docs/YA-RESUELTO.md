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

- **El ajuste anual del 15% va siempre.** Aparece en presupuestos y en el portal.
- **El descuento del 50% del Salón Club Uruguay** y el descuento del presupuesto
  son decisiones de marketing.
- **La lista de compras usa los invitados del PRESUPUESTO**, no los confirmados.
  Se cocina lo que se contrató. Si vienen más, se agregan y el presupuesto sube.
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
  invitados y el reporte al catering ya usan `partySize`. Si ves un `.length`
  sobre invitados en otro lado, ese sí puede ser un problema nuevo: reportalo.
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
