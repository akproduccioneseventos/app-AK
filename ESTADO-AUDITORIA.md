# Estado de la auditoría — qué está hecho y qué falta

Documento vivo. Sirve para no repetir trabajo entre sesiones.
Última actualización: 9 de agosto de 2026.

---

## TANDA DEL 9 DE AGOSTO — PRs de Claude/Gemini posteriores a Codex #769

**Punto de corte verificado:** PR Codex #769, merge `056a5dd8`. Se auditaron sobre
`main` `96e01a96` las 60 PRs posteriores con evidencia directa de Claude que sí
fueron fusionadas. Las cerradas sin merge #805, #812 y #846 quedaron fuera. No
hay una PR posterior atribuible con certeza a Gemini; #775, #776, #781, #799,
#802, #804 y #832 sólo lo mencionan y no prueban autoría.

**Método compartido:** tres agentes económicos `gpt-5.6-terra`/`low` hicieron
inventario y primera lectura por áreas; el director Codex confirmó personalmente
los P0/P1 antes de editar. La preferencia permanente sigue siendo Luna/low, pero
esta sesión no la ofrecía. Graphify quedó actualizado y operativo sobre el SHA
auditado; Serena se reinstaló, aunque su indexador no pudo arrancar hasta disponer
de npm en la copia limpia.

### Defectos confirmados y corregidos

| Origen | Qué quedó corregido |
|---|---|
| #561 | La preparación LED ahora lee `screenPlaylist.items`; detecta pantalla y modo audiorrítmico reales. |
| #850 | Cambiar la clave del portal invalida inmediatamente las cookies antiguas; la cookie guarda huella, no la clave. |
| #836 | Canciones, dedicatorias, sorteos y audios tienen tope global por evento/IP además del tope por nombre, que el visitante podía cambiar. |
| #897 | Una factura con pagos ya no permite cambiar cliente, fecha, ítems, impuestos ni borrar/modificar pagos existentes. Sí permite anexar un pago nuevo válido. |
| #904 | `kidsCount` se guarda en ambos flujos RSVP, se recorta al tamaño del grupo y adultos/niños se cuentan por separado en invitados y mesas. |
| #877 | Los fallos de cámara de fotocabina, Bogue, 360 y espejo se informan al operador mediante `lastError`. |

### Evidencia de esta rama

- 38 pruebas focalizadas en verde; luego 9/9 tras dos guardas finales.
- Validación final del árbol definitivo: 200 archivos y 1333 pruebas en verde.
- TypeScript: sin errores. Lint: sin errores nuevos; conserva 5 avisos previos en
  archivos no tocados.
- GitHub Actions no ejecutó ningún paso: los 4 jobs de #905 quedaron en rojo
  porque GitHub informa que la cuenta está bloqueada por un problema de
  facturación. Regularizar la cuenta y reejecutar CI; no es un fallo del código.
- PR #905 abierta en borrador. No fusionar automáticamente.

---

## TANDA DEL 5 DE AGOSTO — auditoría completa por áreas

Se recorrieron **todas** las áreas de la aplicación. Estado al cerrar: revisor de
tipos sin errores, 1266 pruebas unitarias en verde, 94 de navegador, 20 de
seguridad de la base, y la aplicación compila.

### Corregido en esta tanda

| Qué pasaba | Por qué importaba |
|---|---|
| El juego de trivia reventaba apenas se abría | El invitado no veía nada |
| La fotocabina de video fallaba en silencio | La pantalla volvía sola al principio sin explicar nada |
| El simulador ignoraba al visitante si fallaba un cambio | El mensaje quedaba en la nada |
| Acentos rotos en los mensajes de facturas | Lo ve el equipo al cargar una factura |
| **El cliente veía un saldo menor al real** | El portal no aplicaba el ajuste anual: 18.000 de diferencia en una fiesta de 120.000 |
| **Cualquiera podía borrar la lista de invitados** | Sin ninguna credencial, sabiendo el código del evento |
| **Las preguntas de recuperación de cuenta se cambiaban desde afuera** | Camino a quedarse con una cuenta |
| **El botón de WhatsApp del simulador iba a un número ajeno** | El prospecto que terminaba su presupuesto le escribía a un desconocido |
| Cuatro botones de consulta abrían WhatsApp sin destinatario | La consulta del cliente no llegaba a nadie |
| El cartel de la puerta contaba filas, no gente | En una fiesta de 150 mostraba menos de la mitad |
| El tope de la pantalla en vivo bloqueaba a toda la fiesta | El primero que subía 12 fotos dejaba sin subir a los demás |
| Videos y estaciones publicaban sin ninguna revisión | Un video podía llegar a la pantalla grande sin que nadie lo mirara |
| La lista de compras redondeaba para abajo | Faltaba bebida en plena fiesta |
| **La clave del portal era adivinable y no vencía** | Se rehízo: clave inicial con el nombre del cliente, cambio obligatorio la primera vez y recuperación por correo |
| Al que dijo que no va se le seguía mandando la invitación | La persona avisaba que no podía ir y recibía el mail igual |
| Un mensaje sin teléfono quedaba marcado como enviado | La planilla decía que se avisó a alguien que nunca recibió nada |
| Un insumo sin precio dejaba el plato en cero | El presupuesto salía barato sin que nadie se diera cuenta |

### Trampa que costó una rama rota

Dos propuestas protegieron el archivo de facturas de maneras distintas. Al
fusionarse quedaron **las dos aplicadas encima**: no compilaba, y además guardar
una factura habría dejado la pantalla colgada para siempre esperando un permiso
que ella misma tenía tomado.

**Después de fusionar varias propuestas que tocan los mismos archivos, correr la
verificación completa de nuevo.** No alcanza con que cada propuesta esté bien
por separado.

### Áreas revisadas y sanas

- **Seguridad de la base**: 20 pruebas en verde, todo pasa por el servidor.
- **Sueldos del personal**: las cuentas rechazan negativos e infinitos, y no dejan
  pagar dos veces el mismo evento a la misma persona.
- **Permisos** de empleados, insumos y proveedores: exigen sesión del equipo.
- **Stock de la barra**: no se descuenta dos veces sobre el mismo pedido.
- **Botones y enlaces** de las pantallas de invitado y cliente: sin enlaces muertos.
- **Documentos impresos**: entran en la hoja, sin el menú de la app.
- **Cuentas del invitado**: se suman personas, no filas.

### Pendiente, decidido por el dueño que NO se toca

- Las fotos del muro se descargan con el enlace directo: **lo quiere así**.
- La lista de compras usa la cantidad contratada, no la de confirmados: **se cocina
  lo que se contrató**, y agregar invitados sube el presupuesto.
- Sólo se trabaja en pesos uruguayos.

### Pendiente de verdad

1. **No queda registro de quién marcó un recibo del personal como pagado.** Si
   algún día hay una discusión, no hay con qué respaldarse.
2. **En la barra, si un trago necesita más de lo que hay**, el stock queda en cero
   en vez de avisar que faltó.
3. **La moderación de la pantalla gigante viene apagada** en las fiestas nuevas. El
   dueño no decidió todavía si quiere que venga prendida.
4. **Los "módulos" por usuario no se validan en el servidor**: se asignan y se
   muestran como etiquetas, pero cualquiera con sesión accede igual a todo. O se
   implementa, o se saca la pantalla para no dar una sensación falsa de control.

---

## Historial anterior


## 🔴 LO MÁS IMPORTANTE DE LA TANDA DEL 4 DE AGOSTO

**La app no compilaba.** `npm run build` terminaba en 1. Por eso la CI venía roja
y no había nada publicable, sin importar el estado del despliegue.

Causa: la PR 837 (arreglo de `exhaustive-deps`) agregó `handleAnswer` a las
dependencias del `useEffect` de `TriviaGameScreen`, pero el `useEffect` está
declarado **antes** del `useCallback`. TypeScript lo rechaza con
*"Block-scoped variable used before its declaration"* y el build worker muere.
Una pantalla de juegos tumbaba la compilación de toda la aplicación.

Ya corregido (se movió el `useEffect` debajo del `useCallback`). Verificado:
`npm run build` termina en 0.

**Antes de fusionar cualquier cosa, correr `npm run build`.** Es el único filtro
que hubiera evitado esto, y es el mismo consejo que ya estaba al final de este
documento sin aplicarse.

### Agujeros de permisos cerrados en esta tanda

| # | Qué pasaba | Dónde |
|---|---|---|
| 31 | **`deleteAllFiestas()` no comprobaba NADA**, ni sesión. El comentario del código delegaba la protección en la confirmación de la pantalla; una server action se invoca sin pasar por la pantalla. | `actions/fiesta/fiesta.actions.ts` |
| 32 | `resetAllCustomers()` y `resetAppCompleto()` sólo pedían sesión. Cualquier colaborador podía borrar la cartera entera de clientes o resetear la app. | `actions/customers.ts`, `actions/admin-reset.ts` |
| 33 | **Se podía perder una factura entera**: `invoices.ts` hacía leer-modificar-escribir sin turno, así que dos guardados simultáneos se pisaban. `presupuestos.ts` ya usaba `AsyncMutex`; facturas no. | `actions/invoices.ts` |
| 34 | Archivar presupuestos había quedado restringido a admin junto con el borrado. Archivar es rutina diaria y reversible: se destrabó. El borrado definitivo sigue siendo de admin. | `actions/presupuestos.ts` |
| 35 | La exportación a Looker Studio devolvía **ceros fijos**: se le habían quitado los datos reales al cambiarle la autenticación. Además exigía sesión de navegador, cosa que un informe que se refresca solo no tiene. | `api/analytics/looker-export` |
| 36 | **El cliente podía informar el mismo pago dos veces.** Si el envío fallaba, la rama de error estaba vacía y no había `catch`: la ventana quedaba abierta sin ningún aviso, así que volvía a tocar. Ahora muestra el motivo, y distingue el fallo del servidor del corte de señal. | `portal/c/[accessKey]/PublicPortalView.tsx` |
| 37 | `registrarUsoCupon()` incrementaba el uso **sin revalidar**. `validarCupon` corre antes pero fuera del turno: entre una cosa y la otra el cupón podía vencerse, desactivarse o pasarse del tope por otro uso simultáneo. Ahora se revalida adentro del turno, donde chequeo e incremento son un solo paso. | `actions/cupones.ts` |
| 38 | El simulador **Sofía** se compartía por WhatsApp sin título ni foto. El simulador público ya tenía su tarjeta; este no. | `simulador-ak/layout.tsx` |

Se agregó `requireAdminSession()` en `lib/auth/require-session.ts` como guarda
común para acciones destructivas.

### Sobre los roles: NO existen los que se creía

Verificado en código. Sólo hay **dos** roles: `admin` y `user`. No existe
contador, marketing ni ventas.

Peor: la pantalla de usuarios permite asignar **"módulos"** por persona (crm,
presupuestos, clientes…), pero esos módulos **no se validan en ningún servidor**.
Se guardan y se muestran como etiquetas, nada más. Cualquiera con sesión accede
igual a todo. Ver `admin/usuarios/page.tsx` (asignación) contra las server
actions (ninguna los consulta).

Decisión pendiente del dueño: o se implementa la validación por módulo, o se
saca la pantalla para no dar una sensación falsa de control.

### Hallazgos verificados que NO se tocaron (riesgo de romper en plena fiesta)

1. **Fotos del muro social descargables sin permiso.**
   `api/social-gallery/[fiestaId]/[filename]` no valida nada. Los nombres no son
   triviales de adivinar (`post_<timestamp>_<7 al azar>`), así que no se puede
   enumerar, pero cualquiera con la dirección exacta baja la foto. Exigir sesión
   rompería el muro para los invitados, que no tienen cuenta: el arreglo correcto
   es pedir el mismo token de invitado que usa la invitación.
2. **La clave del portal del cliente es adivinable y no caduca.**
   `buildAccessKey()` arma `{nombre-evento}-{últimos 6 del id}`. El nombre del
   evento es público. Además se compara con `===`, no con comparación de tiempo
   constante. Cambiarla invalida los enlaces ya enviados a clientes.
3. **Doble aviso de pago.** `submitClientPayment()` agrega la notificación sin
   control de duplicados: doble clic del cliente = dos avisos idénticos.
4. **Redondeo distinto según la moneda.** `roundMoney()` (presupuestos) redondea
   a entero siempre; `roundInvoiceMoney()` (facturas) usa 2 decimales para lo que
   no sea UYU. Un presupuesto en dólares pierde los centavos.
5. **El simulador Sofía se comparte pelado** por WhatsApp: su layout no define
   metadata, a diferencia del simulador público.

### Áreas revisadas y sanas en esta tanda

- **Invitado**: verificado punto por punto que todas las pantallas toman el id de
  la fiesta de la dirección (ninguna usa "la fiesta más próxima"), que los envíos
  tienen try/catch, que las fechas pasan `es-UY`, que los botones se deshabilitan
  al enviar y que las subidas validan tamaño (15 MB audio, 40 MB video).
- **Contabilidad**: orden de redondeo correcto (redondea cada ítem y después
  suma), descuentos que nunca dejan el total negativo, IVA sobre el bruto,
  ningún divisor que pueda ser cero, y todos los caminos de escritura de
  presupuestos pasan por `normalizePresupuestoFinancials()`.
- **Ventas**: validación de teléfono uruguayo, rutas públicas bien declaradas,
  metadata del catálogo, plantillas de WhatsApp sin variables sin reemplazar.

---

## ✅ HECHO (no volver a revisar)

### Defectos funcionales corregidos

| # | Qué pasaba | Dónde | PR |
|---|---|---|---|
| 1 | El muro social bloqueaba a **toda la fiesta**: el tope de subidas usaba `IP + fiestaId`, y en un salón todos comparten el WiFi. Eran 12 fotos por minuto para el evento entero. | `actions/social-gallery.ts` | 808 |
| 2 | Los 20 ítems del menú del staff generaban `<a><button></button></a>`: HTML inválido que rompe teclado y lectores de pantalla. | `components/main-nav.tsx` | 808 |
| 3 | El botón del RSVP decía "Confirmar asistencia" aunque el invitado eligiera "No puedo ir". | `invitacion/[fiestaId]/rsvp` | 808 |
| 4 | El saldo del cliente estaba escondido dentro de un acordeón cerrado. | `portal-cliente/[id]` | 808 |
| 5 | **Sofía quedaba inusable**: el botón flotante de WhatsApp cubría el 67 % del botón de enviar y se quedaba con el clic. | `simulador-ak` | 809 |
| 6 | Menú lateral duplicado (17 KB) sin un solo importador: editarlo no producía ningún efecto. | `app/components/main-nav.tsx` | 809 |
| 7 | **El catálogo digital pedía iniciar sesión.** Nueve láminas por tipo de fiesta con botón para cotizar, invisibles para el prospecto. | `lib/auth/public-paths.ts` | 818 |
| 8 | La galería enlazada desde tres láminas de la presentación LED **también pedía sesión**. | `lib/auth/public-paths.ts` | 819 |
| 9 | **La app no compilaba**: `activeTemplate` declarada dos veces por un choque de fusión. | `evento/buzon/[fiestaId]` | 819 |
| 10 | 22 errores de tipos de funciones fusionadas a medio terminar (juegos, conserjería, recordatorios RSVP, portal del invitado). | varios | 819 |
| 11 | Acentos rotos: el mensaje decía "automatizaciAAA3n". | `whatsapp-automation-engine.ts` | 819 |
| 12 | Dirección canónica equivocada: declaraba `/bodas` cuando las páginas viven en `/landing/bodas`. | `lib/seo/event-landing.ts` | 819 |
| 13 | **La zona digital era inalcanzable**: se podía contratar pero nadie la agregaba al menú del invitado. | `guest-portal/public-event-navigation.ts` | 819 |
| 14 | Botones habilitados sin acción: "Agregar Pregunta", "Agregar Misión" (conectados) y "Enviar a Todos los Pendientes" (deshabilitado a propósito: el envío masivo no existe). | paneles de juegos y RSVP | 819 |
| 15 | 13 pantallas se salían de la pantalla en celular. Ver detalle abajo. | varios | 818, 819 |
| 16 | **El primer invitado que confirmaba dejaba al cliente afuera de su portal.** Al guardar la confirmación se borraba la contraseña del portal del cliente. Y una vez borrada, ese portal quedaba abierto: el control comparaba "vacío contra vacío" y daba por buena la entrada. | `lib/fiesta/get-fiesta-raw.ts`, `portal.actions.ts` | rama pruebas en vivo |
| 17 | **La invitación mostraba el día equivocado.** Para una fiesta del sábado 1 de agosto decía "viernes 31 de julio", porque la fecha se leía como medianoche en Londres y Uruguay tiene tres horas menos. Encima el servidor y el celular del invitado mostraban días distintos en la misma pantalla. | `lib/fecha-evento.ts`, `invitacion-publica-client.tsx` | rama pruebas en vivo |
| 18 | El catálogo se veía **cortado en el celular**: el botón "Siguiente" quedaba fuera de la pantalla. Justo lo que se le muestra al cliente en persona. | `catalogo/[tipo]` | rama pruebas en vivo |
| 19 | El centro de alertas se salía 43px y la pantalla de red social de eventos 112px en computadora y 200px en celular (la tabla empujaba todo). | `alertas`, `empresa/red-social-eventos` | rama pruebas en vivo |
| 20 | El buzón de recuerdos decía **"Evento no encontrado"** cuando en realidad la estación estaba apagada o el enlace no traía el permiso. Al invitado le hacía pensar que la fiesta no existe. | `evento/buzon/[fiestaId]` | rama pruebas en vivo |
| 21 | **El enlace de la encuesta se moría solo.** Sólo funcionaba mientras esa fiesta fuera la más reciente. Como la encuesta se manda *después* del evento, para cuando el invitado la abría ya había otra fiesta adelante y el enlace decía "no corresponde al evento actual". Con varias fiestas activas, andaba una sola. | `feedback/[fiestaId]` | rama pruebas en vivo |
| 22 | La fecha corrida al día anterior aparecía además en el RSVP, la pantalla de cómo llegar, el portal del cliente y **la marca de agua de las fotos** de las cuatro estaciones (fotocabina, espejo mágico, 360 y bogue). | 8 pantallas | rama pruebas en vivo |
| 23 | **El enlace para subir las fotos del video de vida dejaba de andar** en cuanto había otra fiesta agendada más adelante: la familia recibía "acceso no válido". Y las fotos que sí entraban marcaban "ya subieron fotos" en el evento equivocado, igual que los ajustes del video. | `video-vida` (3 pantallas y 2 acciones) | rama pruebas en vivo |
| 24 | Con **dos fiestas vencidas sin archivar**, la pantalla de eventos se salía 204px en celular. Y todos los botones decían igual "Archivar", sin decir cuál. | `eventos` | rama pruebas en vivo |
| 25 | En el portal del cliente, el botón para **avisar un pago** quedaba habilitado aunque el monto escrito no fuera un número. El cliente lo tocaba, no pasaba nada y no recibía ningún aviso: se quedaba creyendo que ya había informado el pago. | `portal/c/[accessKey]` | rama pruebas en vivo |
| 26 | El Centro de Fiesta decía **"Arranca a las undefined"** en una fiesta a la que todavía no se le cargó la hora. | `fiestas/[id]/centro` | rama pruebas en vivo |
| 27 | El **saldo del recibo y el del estado de cuenta no coincidían**: uno sumaba el ajuste anual y el otro no. Con una fiesta al año siguiente, el cliente veía un número en el papel y otro en la pantalla. | `lib/budget/saldo-con-ajuste.ts` | rama pruebas en vivo |
| 28 | **29 platos con los acentos rotos** en el catálogo de menús que el cliente lee al armar su comida: "Jamón", "Champiñon", "GUARNICIÃ“N". | `data/menus-catering.json` | rama pruebas en vivo |
| 29 | **Lo que se comparte por WhatsApp llegaba pelado**: el catálogo y el simulador mostraban el título genérico de toda la app y ninguna imagen, y la invitación decía "Evento Especial" en vez del nombre real de la fiesta, también sin foto. | `catalogo`, `simulador`, `invitacion` | rama pruebas en vivo |
| 30 | Sin señal (el WiFi saturado de un salón lleno), el invitado veía **"Failed to fetch"** en inglés al querer confirmar. Lo mismo en el control de entrada y en la carga de fotos del video de vida. | 3 pantallas | rama pruebas en vivo |

### Desborde horizontal en celular

Causa dominante (11 pantallas): filas de botones con `whitespace-nowrap` en
contenedores `flex` sin `flex-wrap`.

Arreglos de fondo, que protegen a toda la app:

- `components/ui/sidebar.tsx`: el `main` del armazón sin `min-w-0` no podía encogerse.
- `components/ui/tabs.tsx`: las filas de solapas son `inline-flex` sin límite de ancho.
- `components/ui/toast.tsx`: el contenedor de avisos crecía con textos largos.

Pantallas corregidas: clientes, alertas, menús, tragos, reportes de contabilidad,
lista de compras, reuniones, accesos del personal (×2), ajuste de precios,
cupones, feedback, notificaciones, plantillas, WhatsApp Business (×2), muro
social y decoración.

### Construido

- **Centro de Fiesta** (`fiestas/[id]/centro`): una sola pantalla para dirigir la
  noche desde el celular. Agrupa las herramientas reales por dónde ocurren.
- **Portal del cliente en 3 pestañas**: Progreso, Invitados y Pagos.
- **Menú del staff en 5 módulos**: CRM, Fiestas, Contabilidad, Insumos y Configuración.
  Ninguna página cambió de ruta: es reagrupación, no mudanza.

### Alarmas automáticas creadas

| Archivo | Qué protege |
|---|---|
| `tests/e2e/impresion-a4.spec.ts` | Que el contrato, el recibo y el resumen **entren en la hoja A4** y que el menú de la app no se imprima. Se mide con el navegador en modo impresión: ya no hace falta imprimir para saberlo |
| `tests/e2e/senal-mala.spec.ts` | La fiesta con el WiFi saturado: seis pantallas del invitado con la señal lenta y con la señal cortada, exigiendo que ninguna quede girando ni muda |
| `tests/e2e/muro-subir-foto.spec.ts` | Que el invitado encuentre cómo subir su foto y que, si falla, se entere |
| `tests/e2e/prospecto-simulador.spec.ts` | El camino por donde entra la plata: del simulador al precio, sin trabarse |
| `tests/e2e/tarjetas-whatsapp.spec.ts` | Que la invitación, el catálogo y el simulador no vuelvan a compartirse sin título ni foto |
| `src/__tests__/acentos-rotos.test.ts` | Que ningún archivo de datos vuelva a tener los acentos rotos |
| `src/__tests__/saldo-con-ajuste.test.ts` | Que el saldo con ajuste anual dé lo mismo en todos lados |
| `tests/firebase/firestore.rules.test.ts` (ampliada) | Que nadie entre directo a la base: las ocho colecciones con datos sensibles |
| `tests/e2e/noche-de-fiesta.spec.ts` (fiesta señuelo) | Que ninguna pantalla vuelva a cargar "la fiesta más próxima" en vez de la del enlace: hay una segunda fiesta agendada a un año, así que la trampa se dispara sola |
| `tests/e2e/noche-de-fiesta.spec.ts` | Las 27 pantallas que se usan **mientras la fiesta pasa**, con una fiesta de esta noche, invitados confirmados y mesas asignadas: ninguna se cuelga, se vacía, se sale de la pantalla ni tarda más de 12 segundos |
| `src/__tests__/fecha-evento.test.ts` | Que la fecha de la fiesta no se corra al día anterior |
| `tests/e2e/viaje-invitado.spec.ts` | El recorrido completo del invitado **con datos de verdad**: confirma, su QR se dibuja, la confirmación queda guardada, el equipo la ve en el Centro de Fiesta y el cliente entra a su portal y la encuentra |
| `tests/e2e/mobile-overflow.spec.ts` | 14 rutas internas + 2 públicas sin desborde en celular |
| `tests/e2e/catalogo-publico.spec.ts` | El catálogo y la galería siguen abiertos al prospecto |
| `tests/e2e/sofia-composer.spec.ts` | El botón de WhatsApp no vuelve a tapar el de enviar |
| `src/__tests__/ak-css-cascade-guard.test.ts` | El orden de carga de las 8 hojas de estilo |
| `src/__tests__/api-route-boundary.test.ts` (ampliada) | Rutas de API nuevas sin protección |

### Verificado y SANO (no hace falta volver)

- **Seguridad**: barrido de las 53 páginas públicas sin sesión. Todas las
  internas (`/admin/*`, `/analytics`, `/compras`, `/control-tower/*`,
  `/secretaria-ak`, `/marketing/*`) piden ingreso correctamente. Sin filtraciones.
- **Descarga de QR**: funciona. El envoltorio de `qrcode.react` renderiza canvas
  cuando no se declara `renderAs`. Se sospechó un fallo y se descartó midiendo.
- **Conteo de invitados**: ya suma `partySize` (personas, no filas).
- **Validaciones del RSVP**: no hay regex rígidos de teléfono ni fecha.
- **Reglas de seguridad de la base**: 4 pruebas en verde.
- **Herramientas del proyecto**: Playwright solo con Chromium, `@firebase/rules-unit-testing`,
  CodeQL y Knip (manual) están correctamente configurados.

---

## ⏳ PENDIENTE

### 1. Desborde en celular — ✅ RESUELTO

Las tres que quedaban están en **cero**:

| Pantalla | Antes | Ahora | Causa real |
|---|---|---|---|
| `/empresa/red-social-eventos` | 47 px | **0** | Botón "Guardar Configuración" en una fila sin `flex-wrap` |
| `/fiestas/nueva/decoracion` | 538 px | **0** | Fila de 885 px con "Exportar" y "Pantalla completa" |
| `/settings/contenido-publico` | 337 px | **0** | Fila con "Actualizar ahora" y "Nuevo artículo" |

La técnica que lo destrabó: buscar el elemento cuyo **borde derecho coincide con
el ancho del documento**, en vez de listar todo lo que sobresale. Se descartaron
antes dos hipótesis equivocadas (el contenedor de avisos y un ancestro
transformado), ambas revertidas al no poder demostrarlas.

### 2. Fotos del catálogo digital — ✅ HECHO

El catálogo ahora muestra las fotos reales, con este orden de preferencia:
fotos etiquetadas para ese tipo de fiesta → galería configurada a mano →
imágenes de ejemplo. **Cargar fotos desde la pantalla de Galería alcanza para
que aparezcan al mostrarle el catálogo a un cliente**, sin tocar código.

### 3. Decidir qué pantallas archivar (decisión del dueño)

323 pantallas en total: 213 internas y 110 públicas. Listado navegable generado
en sesión anterior, agrupado y explicado en castellano.

Ya resuelto: de los "4 simuladores" quedan **2 reales** (el de la web y Sofía) más
la puerta de entrada. `/simulador-v2` **ya se eliminó**: sólo redirigía, y sus dos
referencias se apuntaron al simulador real.

Ya resuelto también:
- **Presentación**: se usa el portal LED con los catálogos reales de bodas, XV y
  celebraciones (PR 825). Las otras láminas de ejemplo quedan de lado.
- **Fotos del catálogo**: la galería ya tiene más de 100 fotos cargadas, así que
  el catálogo digital muestra material real y reemplaza al impreso.
- **Centro de control**: quedaba **uno solo** de seis. Los otros cinco redirigen
  a él, así que ningún enlace guardado se rompe. Está rehecho para la noche de la
  fiesta.
  Muestra cuánto falta para empezar (o cuánto lleva andando), qué toca en este
  momento y qué sigue según el cronograma, cuánta gente confirmó y cuánta llegó,
  quién trabaja esa noche con su rol, lo que quedó sin hacer, y recién después
  los botones a las herramientas.

### 4. Limpieza del diseño — 🟡 DESBLOQUEADA, primera pasada hecha

Lo que la frenaba era no poder comprobar que un cambio de estilos no descolocara
una pantalla que nadie tocó. **Esa red de seguridad ya existe**:
`tests/e2e/layout-baseline.spec.ts` mide la geometría de seis pantallas
representativas y avisa con el número exacto si algo se mueve. Se comprobó que
detecta de verdad: se introdujo a propósito un corrimiento de 40 px y lo señaló
en cinco pantallas a la vez.

Primera pasada de limpieza hecha y verificada con esa red: se eliminaron los
bloques inertes que quedaban (`.ak-red-premium-live` y el `box-shadow` de
`.ak-red-premium-client`, ambos redefinidos por completo en
`ak-release-polish.css`, que carga después). La huella no se movió.

Pasadas siguientes, todas comprobadas: se quitaron **91 `!important`** de seis
hojas. Quedan **50**, sólo en `globals.css` (25) y `ak-budget-mobile-fixes.css`
(25, todos dentro de plantillas de impresión).

Para llegar ahí hubo que reforzar la red dos veces, porque la primera versión
daba falsa confianza:

1. **Cobertura**: medía seis pantallas que no incluían ninguna de modo "live" ni
   "client". Se sumaron `/empresa/presentacion-led`, `/fiestas/nueva/portal-cliente`
   y `/contabilidad/comercial-360`, que cubren los tres modos de
   `ak-red-premium-surface`, donde viven las reglas globales más agresivas.
2. **Qué medía**: sólo geometría. Buena parte de esas reglas controla colores y
   fondos, que no mueven nada de lugar. Se agregó una huella de color (texto,
   fondo y borde de los puntos clave).

Recién con las dos correcciones el "pasó" significa algo. Con la red anterior
estos 65 habrían entrado sin verificación real.

### 5. Código sin uso — ✅ REVISADO

Knip reporta 124 archivos, pero la lista **no se puede aplicar a ciegas**:
incluye los dos pasos de `npm run build`, la configuración de las pruebas, el
servicio de notificaciones y la entrada de las funciones de Firebase. Borrarlos
dejaría la app sin compilar.

Lo único verificable como descartable era `scratch/` (scripts sueltos y volcados
de diferencias); ya se eliminó. El resto son mayormente tipos de TypeScript, que
no ocupan espacio en la app compilada: riesgo sin beneficio medible.

### 6. Módulos internos — ✅ AUDITADOS

Doce módulos recorridos con navegador y sesión válida: contabilidad, facturas,
compras, insumos, activos fijos, secretaría AK, control tower, marketing,
catálogo de servicios, proveedores, personal y calendario.

**Todos cargan con contenido real, título propio y sin errores.** Ninguno expulsa
al login ni muestra mensajes de fallo.

`/compras` y `/control-tower` aparecían con cero botones activos; se verificó que
son **pantallas-índice** (4 y 10 enlaces respectivamente hacia sus subsecciones),
así que es el comportamiento correcto, no un defecto.

Pendiente sólo la prueba de operaciones reales de escritura del lado del staff
(cargar un gasto, emitir una factura). El lado del invitado y del cliente **ya se
prueba de verdad**: ver el punto 8.

Las sesiones se concentraron en lo que ve el cliente y el invitado, que es donde
se cae una venta o se arruina una fiesta.

### 7. Rutas dinámicas — ✅ VERIFICADAS

15 rutas de tipo `[id]` recorridas con navegador: **cero caídas**, sin errores de
JavaScript ni desbordes. 11 muestran correctamente su estado de "no encontrada"
al no existir el evento, que es el comportamiento esperado. Degradan bien.

### 8. Pruebas actuando como invitado de verdad — ✅ FUNCIONANDO

Hasta ahora las pruebas de navegador comprobaban que las pantallas **abren**.
Ahora hay una que comprueba que **funcionan**: crea una fiesta, entra como
invitado, completa la confirmación diciendo que van tres personas, y después
verifica que el dato quedó guardado, que el equipo lo ve en el Centro de Fiesta
y que el cliente entra a su portal con su contraseña y encuentra ahí al invitado.

Lo que lo destrabó: la app ya tenía un modo que guarda los eventos como archivos
en vez de en la base. Faltaba permitir que en ese modo el guardado ocurriera de
verdad. Con eso, el recorrido es el mismo que en producción salvo por dónde
termina el dato.

**La primera corrida encontró un defecto grave que ninguna prueba anterior podía
ver** (defecto 16 de la tabla de arriba): confirmar la asistencia le borraba al
cliente la contraseña de su portal. Ya está arreglado y la prueba lo vigila.

Lo único del recorrido que sigue sin poder probarse acá: **subir una foto al muro
social**, porque esa parte guarda la imagen en el servicio de archivos de
Firebase, que no existe en este entorno.

---

### 9. Dos cosas de plata que quedan a decisión del dueño

No las cambié: tocar una fórmula de dinero sin confirmarlo con quien factura es
peor que dejarla como está. Las dejo anotadas con lo que encontré.

**El ajuste anual no se aplica en todos lados.** La pantalla de estado de cuenta
suma el ajuste por inflación cuando el contrato está aceptado o facturado. El
recibo de pago y el saldo que ve el cliente en su portal **no lo suman**. Con un
contrato con ajuste activo, el cliente ve un saldo menor que el que figura en el
estado de cuenta. Hay que decidir cuál es el número bueno y usar ese en los tres
lugares.

**El precio tachado del simulador.** Cuando el cliente elige el Club Uruguay, la
pantalla muestra el precio tachado al doble y "(50% OFF)". Ese precio tachado no
sale de ninguna lista: se calcula multiplicando por dos el precio real. Es una
decisión comercial, no una falla —hay hasta un módulo en el código pensado para
eso— pero un cliente que compare precios lo puede notar.

---

## 💡 Recomendación de fondo

Lo que dejó la app sin poder publicarse **no fue mala suerte**: se fusionó
trabajo de varios asistentes sin que nadie compilara después. Un solo filtro
—confirmar que `npm run build` pasa antes de fusionar— evita la mayoría de estos
episodios.

---

## 16 de agosto de 2026 — Las once mejoras, y la estética mirada de verdad

Se entregaron y fusionaron las once mejoras de la propuesta: la fotocabina, la
galería y el muro ofrecen el presupuesto con la marca de la fiesta; pantalla de
qué fiesta trajo clientes; álbum público; ranking de la noche; mensajes a futuro;
pedidos de música; pedido por proveedor; posteos automáticos; y el párrafo que
explica el presupuesto.

**La estética se revisó fotografiando las 242 pantallas**, en escritorio y en
celular, y mirándolas. Es la primera vez que se hace así: hasta ahora las pruebas
controlaban que las pantallas funcionaran, no que se vieran bien. Salieron ocho
arreglos. El pase de fotos quedó en `tests/e2e/fotos-de-la-app.spec.ts`, se corre
con `AK_FOTOS=true`.

**Tres cosas que se evitaron por verificar antes de pedir:** la atribución por
fiesta ya existía, los avisos preventivos del evento ya existían (once reglas), y
el pedido de reseña en Google ya andaba.

**Lo que costó:** Gemini entregó en tres propuestas donde la orden pedía una, y
dos de ellas arreglaron la galería vacía de maneras distintas: al juntarlas el
archivo no compilaba. Es el caso exacto que la regla de una sola propuesta busca
evitar, y quedó documentado en `docs/YA-RESUELTO.md`.

## 1 de septiembre de 2026 — La app se auditó entera por primera vez

**Método nuevo:** abrir cada pantalla en el navegador y mirarla, en vez de leer código. Salió
de que todo lo que falló este año tenía la misma forma —escrito, compilando, en verde y sin
hacer nada—, y eso leyendo código no se ve.

**Resultado:** 353 pantallas recorridas. **328 andan, 25 quedaron marcadas.** El primer intento
había dicho 51, pero el recorrido juzgaba a los 300 milisegundos y gritaba por 26 pantallas
sanas; corregido para que espere a que se dibujen.

**Lo que encontró y ninguna auditoría anterior había visto:** 16 pantallas con un error interno
—entre ellas el blog y las landings—, el buzón siendo la única pantalla blanca de seis (encandila
en un salón a oscuras), el botón de Touchpix sin nombre, y la pantalla gigante que no dice de
quién es la fiesta.

**Se comparó con más de 40 plataformas del rubro** (fotocabinas, muros sociales, webs de
casamiento, decoración, catering, personal, DJ). Detalle en `docs/COMPARACION-CON-EL-RUBRO.md`.

**Y seis avisos de los ayudantes resultaron falsos**, verificados uno por uno. Están anotados en
`docs/YA-RESUELTO.md` para que no se reporten de nuevo.


## 5 de septiembre de 2026 — La app quedó publicable

La puerta dio verde en las nueve etapas y se fusionó todo a la version principal. Los nueve
modulos de entretenimiento quedaron completos contra el rubro (129 de 129).

Lo mas importante que se arreglo, por lo que le costaba al negocio:

1. **La pantalla del invitado mostraba "Application error"** al abrir su enlace. Era el
   redireccionamiento hecho desde la pantalla; pasa a la configuracion.
2. **Un invitado marcado "Niño" se importaba como adulto**, lo que cambiaba la cuenta de la
   comida. Salio a la luz al sacar la lectura de la planilla a su propio archivo y probarla.
3. **El fondo sin tela verde no miraba la imagen**: dibujaba un ovalo y cortaba gente. Se rehizo
   con el modelo que segmenta de verdad, sin pagar nada por mes.

Y la verificacion se acorto: el recorrido de pantallas bajo de 40 a 18 minutos, y se dejaron de
perder siete minutos por corrida recompilando sin motivo.
