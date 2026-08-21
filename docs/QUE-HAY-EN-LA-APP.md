# Qué hay en la app

> **Se lee ANTES de salir a inventariar.** Si el dato está acá, se responde de acá,
> sin mandar agentes a buscar de nuevo. Y **se actualiza en la misma propuesta que
> toca el código**: un inventario desactualizado es peor que no tenerlo.

## Inventario completo por módulo (19 de agosto de 2026)

Recorrido módulo por módulo con cinco ayudantes en paralelo, cada hallazgo
verificado a mano. **Más de 230 funciones**, con archivo y línea como prueba.

| Área | Funciones | Estado |
|---|---|---|
| Comercial y venta (CRM, presupuestos, simulador, páginas de venta) | 31 | Todas andan |
| Plata y cobros (facturas, seña, Mercado Pago, rentabilidad) | 55 | Todas andan |
| Empresa y marketing (presencia digital, redes, blog, posicionamiento) | ~50 | Andan; 2 esperan credenciales |
| Invitado y noche de fiesta (invitación, portal, 25 pantallas del evento) | 40 pantallas | Todas andan |
| Planificación de la fiesta (invitados, mesas, comida, personal, impresos) | 56 | Todas andan |

### Cómo está la seguridad de las puertas de entrada (19 de agosto de 2026)

En un archivo de servidor, **cada función exportada es una dirección que cualquiera
de internet puede llamar**. Hay un control que las lista y frena las nuevas
(`src/__tests__/auditoria-puertas-abiertas.test.ts`).

| Estado | Cantidad |
|---|---|
| Cerradas en esta revisión | 15 |
| Declaradas públicas a propósito, con motivo escrito | 12 archivos |
| **Pendientes de revisar una por una** | **247 en 98 archivos** |

**Las pendientes no están todas mal:** la mayoría son de leer, y varias se protegen
de formas que el control no reconoce. Significa que nadie las miró con esta lupa.
Están congeladas en `src/__tests__/puertas-pendientes-de-revisar.json`: **la lista
sólo se achica, nunca crece**, y cualquier función nueva que quede abierta hace
fallar la aplicación.

Revisarlas está pedido en el bloque 7 de `docs/ordenes/ahora.md`.

---

### Lo único que no está completo

1. **Google Workspace** — la pantalla existe y funciona, falta cargar la credencial.
   No está rota: está esperando la llave.
2. **Buscar canciones en Spotify** desde la invitación — igual, falta la credencial.
3. **El aviso de puntaje de Google menor a 4 estrellas** — armado, no se puede
   encender hasta que se pueda leer el puntaje real de la ficha.

### Lo que se encontró en este inventario y ya se corrigió

- **La carta de tragos de una boda se imprimía diciendo "Mis XV".** Cuarto caso del
  mismo defecto de los impresos de mesa.
- **El planificador gastronómico no figuraba en ningún menú**: había que escribir la
  dirección a mano. Es la cuarta pantalla terminada sin puerta que apareció.

### Dato estructural que conviene recordar

**Hay dos sistemas de invitación y no se tocan.** El editor avanzado trabaja con una
boda de ejemplo ("María y Juan", Salón El Paraíso); la invitación que abre el
invitado se arma desde otra configuración, que tiene **todos los campos vacíos** y se
llena con los datos reales de la fiesta. Los datos de ejemplo **no tienen camino
hacia una invitación publicada**.

---

**Para qué sirve este archivo.** El dueño pregunta seguido "¿esto está?" y auditar
de nuevo cada vez cuesta tiempo y plata. Acá queda anotado lo que ya se revisó,
con fecha. **Se lee antes de salir a inventariar nada.** Si el dato está acá, no
se vuelve a buscar: se responde de acá.

**Cómo se mantiene.** Cuando se toca algo que figura en esta lista, se actualiza
la línea en la misma propuesta, igual que `docs/YA-RESUELTO.md`. Si aparece algo
nuevo que no está inventariado, se agrega. Un inventario desactualizado es peor
que no tenerlo.

Cada punto dice en qué estado está:

- **ANDA** — funciona de verdad hoy.
- **A MEDIAS** — existe pero le falta algo para servir; se aclara qué.
- **NO ESTÁ** — no existe en el código.

---

## Las catorce mejoras y el centro de redes — revisado el 17 de agosto de 2026

Verificado uno por uno, y no sólo que el archivo exista: **que alguna pantalla lo
muestre**. Esa distinción es la que más veces falló.

| Qué | Anda | Desde dónde se ve |
|---|---|---|
| Trivia con podio por mesa | Sí | Pantalla grande del salón |
| Misiones secretas para invitados | Sí | Muro social, en el celular |
| Secretario que habla (micrófono y voz) | Sí | Botón flotante, en toda la app interna |
| Quién llegó del equipo | Sí | Centro de la fiesta |
| Pantallas de la noche en oscuro | Sí | Recepción y logística |
| La reunión se agenda sola | Sí | Al terminar el simulador público |
| Aviso de margen al cotizar | Sí | Pantalla del presupuesto, sólo el equipo |
| Pregunta de los quince a las invitadas | Sí | Fotocabina y muro social |
| Configurador para la reunión de cierre | Sí | Central de presupuestos |
| Termómetro de la fiesta | Sí | Pantalla del DJ |
| Libro de la fiesta en PDF | Sí | Centro de la fiesta |
| Cada uno ve lo suyo | Sí | Centro de la fiesta → "Lo tuyo, ahora" |
| Video del recuerdo | Sí | Centro de la fiesta |
| Recuerdo de cada invitado (video vertical para historias) | Sí | Enlace personal del invitado / Recap de la mañana |
| Transmisión en vivo | Sí | Pantalla de la fiesta en vivo |
| Centro de presencia digital | Sí | Empresa → Presencia digital |
| Reseña de Google al terminar encuesta | Sí | Encuesta pública `/feedback/[fiestaId]` |
| Reseña de Google para el invitado | Sí | Hub del evento `/evento/hub/[fiestaId]` y Álbum `/evento/album/[fiestaId]` |
| Seguimiento de reseñas por fiesta | Sí | Empresa → Presencia digital → solapa "Ficha de Google" |
| Alerta puntaje de Google < 4.0 | Sí | Empresa → Presencia digital → banner de alerta |
| Tablero de 16 altas en directorios | Sí | Empresa → Presencia digital → solapa "Tablero de altas (16)" |
| Autogenerador semanal de calendario | Sí | Empresa → Presencia digital → solapa "Revisión Diaria" |
| Notas del blog, 3 por semana | Sí | Se generan solas; salen en borrador para aprobar |
| Foto de cada nota: real, del catálogo | Sí | Nunca se genera con inteligencia artificial |
| Estado de lo que corre solo | Parcial | Registrado en `src/lib/automatico/tareas-automaticas.ts`; falta la pantalla |
| Comentarios de redes e IA | Sí | Empresa → Presencia digital → solapa "Comentarios de redes" |
| Moderación de comentarios y quejas | Sí | Empresa → Presencia digital → solapa "Comentarios de redes" |
| Capturas de pantalla en testimonios | Sí | Ajustes → Feedback & Testimonios y carrusel público |
| Historia y hospedajes en la invitación | Sí, con su pantalla para cargarlos | Fiestas → Página web → Invitación |
| Música de fondo en la invitación | Sólo si el anfitrión sube la suya | Invitación digital |
| Carta de tragos en carrusel (pantalla grande del salón) | Sí | `/evento/barra/<fiesta>` |
| El invitado pide su trago desde el celular | Sí | Enlace personal del invitado |
| Pantalla del barman con los pedidos | Sí | `/evento/barra/<fiesta>/barman` |
| Carta de tragos en carrusel en el celular del invitado | Sí | Enlace personal del invitado |
| Buzón de saludos: grabar video (15 seg) y audio | Sí | `/evento/buzon/<fiesta>` |
| Buzón de saludos: sacarse una foto | NO, faltan | — |
| Llegar al buzón desde el portal del invitado | Sí, botón "Dejar un saludo" | Enlace personal del invitado |
| Moderar el muro desde el celular en la fiesta | Sí | Fiestas → Muro social → "Moderar desde el celular" |
| Cola de impresión de fotos | Sí, en fotocabina, plataforma 360 y 360 con IA | Fiestas → Entretenimiento → "Cola de Impresión" |
| Hoja de 10x15 con tres fotos (fotocabina) | Sí el tamaño; el reparto NO coincide con el impreso real | `/evento/fotocabina/<fiesta>` |
| Espejo mágico y 360 con IA: una foto, personalizada en 10x15 | Imprime una foto, pero SIN personalizar | `/evento/espejo-magico/<fiesta>` |
| Foto y video (8 segundos) con el trago en el tótem, sin impresión | Sí | `/evento/barra/<fiesta>` |
| Que el invitado se lleve su foto del tótem al celular | NO, queda sólo en la pantalla del salón | — |
| Exigir seguir las redes antes de subir la foto | El interruptor existe pero el tótem no lo respeta | Ajustes de la barra |
| Sección "por qué AK" en la portada | Sí | Portada, debajo de la presentación |
| Pedido de cambio de cantidad de invitados por el cliente | Sí | Portal del cliente, y el equipo lo acepta o rechaza en Fiestas → Portal del cliente |
| Pedido de cambio de menú por el cliente | Sí | Portal del cliente |
| Pasar un prospecto a cliente (con contrato y seña) | Sí | Contabilidad → CRM, botón de confirmar reserva |
| Testimonios del catálogo impreso en las páginas de venta | Sí, son reales (falta subirles la captura) | `/bodas`, `/quinceaneras`, `/cumpleanos`, `/fiestas`, `/corporativos`, `/aniversarios` |
| Tope de gasto al traer el historial de comentarios | Sí, cien por corrida | Empresa → Presencia digital → "Historial completo" |
| Tu página web (Google Analytics 4) | Sí | Empresa → Presencia digital → solapa "Tu página web" |
| Ficha de Google conectada y verificada (cuenta verificada por el dueño el 20/8) | Sí | Empresa → Presencia digital → solapa "Ficha de Google" |
| Botón que abre la ficha real de Google (antes abría una búsqueda) | Sí, enlace pasado por el dueño el 20/8 | Empresa → Presencia digital → solapa "Ficha de Google" |
| Redes de AK en las pantallas del invitado sin el permiso de publicación | Sí | Invitación, muro en vivo, página del evento |
| Lista completa de fiestas cerrada a quien no tiene cuenta | Sí | Todas las pantallas del equipo |
| Menús, servicios y salones en pantallas de venta sin costos ni contactos internos | Sí | Simulador, presentación LED, páginas de venta |
| Freno contra robots en el chat del simulador y el asistente del invitado | Sí | Simulador y portal del invitado |
| Pedidos de robots (WordPress, phpMyAdmin, archivos de contraseñas) cortados en la puerta | Sí | Automático, en toda la app |
| Soporte Pinterest, Threads y X | Sí | Empresa → Presencia digital y Ajustes → Redes sociales |
| Publicación real en Facebook e Instagram | Sí | Empresa → Presencia digital (al aprobar) |
| Publicación programada con cron y límites | Sí | Automático (cron `/api/cron/publicar-programados`) y visible en Empresa → Redes sociales |
| Textos con IA desde fotos de fiesta | Sí | Empresa → Redes sociales → "Generar desde fiesta" |
| Atribución de clientes por red ("¿De dónde vienen?") | Sí | Empresa → Presencia digital → pestaña "¿De dónde vienen?" |
| Alerta de redes inactivas | Sí | Empresa → Presencia digital → banner arriba de las pestañas |
| Importador de historial social | Sí | Empresa → Redes sociales → Importar historial |
| Schema.org LocalBusiness, FAQPage, Breadcrumb | Sí | En la cabecera (head) y body de las páginas públicas |
| Cuentas oficiales centralizadas y botón Pinterest | Sí | Pie de página web pública y `src/lib/public-contact.ts` |
| Pantalla de tareas automáticas: qué está al día y qué atrasado | Sí | Ajustes → Tareas Automáticas |
| Botón para correr a mano cada tarea automática | Sí | Ajustes → Tareas Automáticas |
| Las tareas de fondo sólo las dispara un administrador | Sí | Automático, al abrir la app |
| Un posteo no puede salir dos veces en las redes | Sí | Automático, al publicar programados |
| Auditoría mecánica que corre sola y escribe informe | Sí | `npm run auditoria`, informe en `auditoria-out/informe.md` |
| El ingreso avisa mientras espera y nunca se queda colgado | Sí | Pantalla de ingreso |
| Los avisos de pago al cliente sólo los dispara quien corresponde | Sí | Automático, al aprobar o rechazar un pago |
| Recuperar la clave del portal, con freno contra robots | Sí, 3 por hora | Portal del cliente |
| Ninguna función de servidor abierta sin querer | Sí, llegó a cero de 247 | Automático, prueba que lo cuida |
| Repaso de la mañana enlazado | Sí | Menú principal |
| Aviso de personal en dos fiestas el mismo día | Sí | Menú principal → Personal en dos fiestas |
| Métricas del negocio y rendimiento de publicidad | Sí | Menú principal |
| Promociones, asistente y mapa tecnológico | Sí | Menú → Configuración |
| Pantallas del día de la fiesta agrupadas por tema | Sí | Dentro de cada fiesta |
| Lista de compras enlazada en el menú | Sí | Insumos → Lista de Compras |
| Alergias y dietas enlazado en el menú | Sí | Fiestas → Alergias y Dietas |
| Portal de proveedores enlazado en el menú | Sí | Fiestas → Portal de Proveedores |
| Cláusulas de contrato enlazado en el menú | Sí | Configuración → Cláusulas de Contrato |

**Si se cae el internet en la fiesta:** se salva la llegada de invitados y el
pedido de la barra, que se reenvían solos al volver la señal. **La foto del muro
no se puede guardar** —pesa demasiado para el celular—, así que la pantalla lo
dice y la vuelve a ofrecer mientras siga abierta.

**Duplicado que no se usa a propósito:** hay un segundo panel para cargar
preguntas de trivia (`TriviaAdminPanel`) que ninguna pantalla muestra. **Se deja
así**: el panel del muro social ya permite escribirlas y no hace falta tener dos
formas de hacer lo mismo.

## Inteligencia artificial — revisado el 12 de agosto de 2026

### Lo que anda

Trece funciones activas:

- **Asistente que ejecuta acciones** (crear presupuestos, clientes, prospectos,
  eventos, facturas). Pantalla: Ajustes → Asistente.
- **Agente de marketing**: escribe contenido para Instagram, Facebook, TikTok y
  WhatsApp, adaptado a cada plataforma.
- **Análisis de reuniones con el cliente**: saca acta, acuerdos, tareas y alertas.
- **Fotocabina (Touchpix)**: siete transformaciones artísticas y cambio de cara con
  treinta personajes.
- **Espejo mágico**: cambio de cara propio de esa estación.
- **Guion del DJ**: arma el resumen profesional con canciones sugeridas por momento
  de la fiesta.
- **Línea de tiempo del evento** y **paletas de colores** sugeridas.
- **Lectura de contratos en PDF**: saca cliente, fecha, tipo de evento y monto.
- **Discurso de venta** generado.

### Filtro de contenido de los invitados — ANDA (verificado línea por línea)

Toda **foto** que sube un invitado se revisa antes de publicarse y se bloquea sola
si detecta contenido adulto, sexual o violento. Está enganchado en la subida real,
no es una función suelta.

Los **videos** no se pueden revisar así (el análisis mira imágenes fijas), y por eso
**van siempre a aprobación manual** antes de aparecer en la pantalla grande. Eso es
correcto y es a propósito: no se cambia.

Si el servicio de análisis no está configurado o se cae, la foto **no se publica
sola**: queda para revisión manual.

### Topes de uso — ANDAN

- Tres generaciones por invitado por sesión, en fotocabina y en espejo mágico.
- Ciento cincuenta por hora por estación (red de contención contra el abuso).
- Corte a los sesenta segundos si una generación se cuelga.
- Diez megas máximo por imagen.

### Control de gasto — ANDA

Se cuenta cada foto con efecto y se ve en Ajustes → Contenido público: cuántas van
y cuánto se estima gastado en el mes. Se le puede poner un tope en pesos; al 80%
avisa, y al llegar al tope los efectos se apagan solos. La fotocabina y el espejo
**siguen andando igual**: sacan la foto con un efecto simple, sin gastar.

### Lo que falta
- Dos funciones escritas y nunca conectadas a ninguna pantalla: generación de
  testimonios y asignación automática de invitados a mesas. Ninguna es crítica.

### Guardado a propósito, sin enlazar (21 de agosto de 2026)
- **Leer un comprobante con una foto.** Está escrito y anda: se le saca una foto a un
  comprobante y la app lee el monto, la fecha y el número. **No está enlazado desde
  ninguna pantalla, y es a propósito:** tal como está muestra los datos y no los guarda
  en ningún pago, así que enlazarlo haría gastar inteligencia artificial en cada foto
  sin dejar nada anotado. Para que sirva hay que engancharlo a la carga de pagos.
  **No cuenta como pendiente**; está declarado con su motivo dentro de la auditoría.

### Si la inteligencia artificial falla

Está bien resuelto: si no hay configuración, si se cuelga o si el servicio rechaza
el pedido, devuelve la foto original con un efecto simple y la pantalla sigue
andando. No se rompe nada delante del invitado.

---

## Las diez integraciones del informe 360 — verificadas el 18 de agosto de 2026

El informe `public/docs/Auditoria_Unificada_360_AK_Producciones.html` da diez
integraciones por "Implementado" o "100% Operativo". **Se verificaron una por
una, mirando si alguna pantalla las llama.** Que exista un archivo no alcanza.

### Andan hoy, sin configurar nada (4)

- **Sofía, la asistente que cotiza** — `/simulador-ak`. Funciona.
- **Mapa en las invitaciones** — el botón "cómo llegar" siempre anda. **Es Google
  Maps, no OpenStreetMap** como dice el informe. Da igual en la práctica.
- **Mercado Pago** — cobra la **seña acordada con ese cliente**, y si no hay, la
  general de Ajustes, y recién después los $5.000 por defecto. **Valida la firma**
  de los avisos que llegan del banco y rechaza los que no coinciden. Necesita las
  credenciales cargadas para cobrar de verdad, pero el código está sano.
- **Meta CAPI** (rastreo de conversiones) — se dispara al guardar un prospecto
  desde la landing y desde el portafolio LED. Sin credenciales falla en silencio
  y **no rompe el formulario**, que es lo correcto.

### Están hechas pero sin la clave no sirven (2)

- **Google Contacts** — el prospecto se guarda igual en la app; lo que no pasa es
  que aparezca en la agenda de Google.
- **Spotify** — el campo de buscar canciones **aparece en la invitación** y
  devuelve error al escribir. Al invitado le parece roto. Conviene esconderlo
  hasta que estén las credenciales.

### NO EXISTEN, aunque el informe las da por implementadas (4 y media)

- **Cloudinary** — cero apariciones en el código. Las fotos van a Firebase
  Storage, que funciona bien, pero no es lo que dice el papel.
- **Resend** — cero apariciones. Y más importante: **la aplicación no manda
  ningún mail, por ningún medio.** No hay confirmación de asistencia por correo.
- **Notion** — cero apariciones.
- **Microsoft Clarity** (mapas de calor) — sólo el nombre de una variable en el
  archivo de ejemplo. Ninguna pantalla carga nada.
- **TikTok Pixel** — igual que Clarity: sólo el nombre de la variable. Lo que sí
  existe de ese punto es Meta CAPI, que es la otra mitad.

### La lección, para la próxima vez que llegue un informe

**"Implementado" no quiere decir "funciona para el dueño hoy".** De diez, cuatro
andan, dos esperan una clave y cuatro y media no existen. Antes de creerle a un
informe, se comprueba si alguna pantalla llama a eso.

## Redes sociales — revisado el 12 de agosto de 2026

### Lo que anda

- **Pantalla de conexión** (Ajustes → Redes): guarda la dirección de cada perfil
  (Facebook, Instagram, TikTok), el número de WhatsApp y logos propios.
- **Importación de videos de YouTube**: trae los videos del canal a la galería. No
  necesita credenciales, es el listado público del canal, y se refresca cada seis
  horas.
- **Planificador de contenido** (Empresa → Redes sociales): se planifica y se
  redacta con inteligencia artificial. Después **se copia y se pega a mano** en la
  red. Eso es lo que hay, y está dicho así en la propia pantalla.

### A medias

- **Importación de Instagram**: existe y corre sola cada seis horas, pero **sólo si
  están cargadas las credenciales comerciales de Meta**. Sin eso devuelve error y no
  trae nada. Hay una prueba que impide que se muestre como exitosa cuando no lo fue.

### No está

- **Publicar automáticamente en Instagram, Facebook, TikTok o YouTube.** No hay
  nada. Todo el publicado es manual.
- Sincronización de comentarios, seguidores o "me gusta".
- Avisos automáticos que lleguen desde las redes hacia la app.

### Resuelto

Lo que se importa de Instagram ya no dice "Publicado" (que se leía como si la app
lo hubiera publicado): queda como **"Importado de IG"**, con color propio, separado
de lo que el equipo todavía tiene que publicar a mano.

---

## Marketing y captación — revisado el 12 de agosto de 2026

### Lo que anda

- **Simulador de presupuesto público**: cualquiera lo usa sin cuenta, y los datos
  (nombre, teléfono, fecha, invitados, salón) **entran solos al CRM como prospecto**,
  con el presupuesto armado. Es la puerta de entrada de clientes nuevos y funciona.
- **Atribución de clientes por fiesta (Tanda 1 — ANDA, 15 de agosto de 2026)**:
  1. La fotocabina, la galería y el muro social muestran un llamado discreto al finalizar ("¿Te toca festejar el año que viene? Mirá cuánto sale tu fiesta") enlazando al simulador con atribución (`refFiestaId` y campaña).
  2. Tablero en CRM (**Atracción de Clientes por Fiesta**, `/contabilidad/crm/atraccion-fiestas`) que muestra por cada evento cuántos prospectos trajo, cuántos presupuestos se armaron y cuántos contrataron, con filtro por año.
  3. **Álbum oficial público** (`/evento/album/[fiestaId]` y `/album/[fiestaId]`) con fotos aprobadas en alta definición, lightbox a pantalla completa, botón de compartir por WhatsApp y enlace comercial con atribución al simulador.
- **Cupones y descuentos**: se configuran, se validan y se aplican solos al armar el
  presupuesto. Hay estadísticas de uso.
- **Tablero de conversión del CRM**: prospectos activos, valor del embudo, ganados,
  perdidos y tasa de conversión.
- **Tablero de publicidad (Meta Ads)**: cruza lo gastado en publicidad con los
  contratos reales para calcular el retorno. Necesita credenciales cargadas.
- **WhatsApp uno a uno**: conversaciones, envío y estadísticas.
- **Prioridad de prospectos**: calcula a quién conviene atender primero.
- **Agenda de seguimiento** de reuniones con prospectos.
- **Módulo de marketing**: lista de tareas configurable y plantillas guardadas.
- **Recordatorios de cobro**: se disparan solos.
- **Opinión del cliente después del evento**: hay una pantalla por evento donde el
  cliente deja su opinión, se llega desde la pantalla de post-evento y desde
  Ajustes, y esa opinión se puede convertir en testimonio. La portada del sitio
  muestra los testimonios reales cargados.

- **Testimonios reales en la presentación grande**: la pantalla de testimonios usa
  los que el dueño aprobó, igual que la portada. Si todavía no hay ninguno
  aprobado, muestra los de ejemplo para no quedar vacía. **Una opinión mala nunca
  se publica**: se controla dos veces.
- **Recontacto del que pidió presupuesto y no señó**: corre dentro del marketing
  automático, cada seis horas, y le manda **un** mensaje de WhatsApp. Viene
  **apagado de fábrica**; se prende desde Ajustes → Contenido público, y sólo puede
  hacerlo el administrador. Se le escribe una sola vez en la vida, sólo a quien dio
  permiso de marketing, nunca a quien ya contrató ni a quien está en una etapa
  terminada del embudo.

- **Asistente de ventas en las páginas públicas**: contesta con el catálogo real,
  no inventa precios ni fechas, y guarda al interesado en el CRM. **Apagado de
  fábrica**; se prende en Ajustes. Sólo aparece en las páginas de venta, nunca
  encima de una invitación, del portal del cliente ni de la fiesta. Vive en
  `src/components/public/AsistenteVirtual.tsx` y se monta en el armazón general.
- **El mensaje de recontacto se escribe a medida** de cada persona. Si el servicio
  falla o se llegó al tope de gasto, manda el de siempre.
- **Video del recuerdo** por evento, armado con las fotos aprobadas del muro.
- **Repaso de la mañana** en el panel interno: cobros, equipo incompleto y eventos
  que quedaron abiertos. Los cobros no se le muestran a quien no tiene el permiso.

- **Pedido de reseña en Google — ANDA (13 de agosto de 2026).** Cuando el cliente
  contesta la encuesta de después del evento y pone 9 o 10, se le manda solo un
  WhatsApp con el enlace para que deje la reseña. Se configura en Ajustes →
  Empresa: hay que pegar el enlace de Google y prender el interruptor, que **viene
  apagado**. Sin enlace no se puede prender. Con nota menor a 9 no sale nada, y a
  la misma fiesta **no se le pide dos veces**. Desde la pantalla de opiniones se
  puede pedir a mano con un botón, con las mismas reglas.
- **Plan de la noche para el equipo — ANDA (13 de agosto de 2026).** Cada persona
  entra con su código y ve, pensado para el celular, su rol en esa fiesta, la hora,
  el lugar con la dirección, un botón para llamar al encargado y el programa de la
  noche. **No ve sueldos**, ni el suyo ni el de los demás. Si no tiene nada
  asignado, la pantalla lo dice en vez de quedar vacía.
- **Presentación LED alineada con el catálogo de papel (revisado el 13 de agosto de 2026)**:
  1. **Logos de empresas**: cargados en local (`/logos/...`), con sus nombres reales
     visibles (Correo Uruguayo, Antel, Intendencia de Salto, Club Uruguay, etc.) y
     administrables desde Ajustes → Contenido público.
  2. **Diapositiva del equipo ("Hay equipo")**: pantalla dedicada ubicada antes de
     los precios, mostrando la cantidad de profesionales (11) y fotos/frase en
     criollo por tipo de evento.
  3. **Salón Club Uruguay**: pantalla actualizada con sus 120 años de historia,
     ubicación en pleno centro, +120 personas, limpieza completa incluida y **sin
     mencionar portero en ningún lado**.

### No está

- **Armar el presupuesto desde el chat del asistente.** Se sacó a propósito: la
  entrega original inventaba las cuentas que el cliente ve como precio firme. Está
  anotado cómo completarlo bien en `docs/ordenes/grandes-01-las-cuatro-ideas.md`.
- **Envío de mails masivos.** No hay nada.
- **Formulario de contacto** aparte del simulador.
- **Reseñas de Google** u otro servicio de reputación: no hay integración. La
  aplicación sí sabe quién quedó contento (la encuesta post evento guarda una nota
  del 1 al 10), pero esa opinión no sale nunca hacia afuera. Pedido en
  `docs/ordenes/crecer-01-resenas-y-plan-del-equipo.md`.

---

## Plata por evento — revisado el 12 de agosto de 2026

- **Analizador de Rentabilidad — ANDA.** Dentro de cada fiesta muestra lo que se
  pactó cobrar, lo que va a costar (comida, bebidas con su merma, repostería,
  sueldos con aportes y proveedores) y la ganancia con su porcentaje. Tiene un botón
  para sincronizar todo de una.
- **La ganancia contra lo gastado de verdad — ANDA** (verificado el 15 de agosto de
  2026; antes figuraba acá como "a medias" y ya no lo está). Muestra las dos: la
  estimada y la real. Para la real usa lo que efectivamente se le pagó a cada
  proveedor, y para los renglones que todavía nadie rindió usa el estimado, pero
  los cuenta aparte para que se vea cuánto falta rendir. Los pagos que no
  corresponden a ningún renglón también se suman: plata que salió no se esconde.
- **Comparar la ganancia entre todas las fiestas — ANDA** (verificado el 15 de
  agosto de 2026; antes figuraba acá como "no está"). Hay una pantalla que las
  pone a todas juntas y las agrupa por tipo de evento y por mes, ordenadas por lo
  que dejaron. Se entra desde el Panel Contable.

## Atracción Comercial y Pantallas de la Fiesta — revisado el 15 de agosto de 2026

### Lo que anda

- **Conversión desde la fiesta al simulador de presupuestos — ANDA.** Enlace con atribución (`campaign` y `refFiestaId`) en la pantalla final de la fotocabina (`/evento/fotocabina/[fiestaId]`), galería interactiva (`/evento/galeria/[fiestaId]`), muro social (`/evento/social/[fiestaId]`) y álbum oficial (`/album/[fiestaId]`).
- **Reporte de Atracción por Fiesta en CRM — ANDA.** Pantalla en `/contabilidad/crm/atraccion-fiestas` accesible desde el CRM que agrupa prospectos, presupuestos enviados y contratos ganados originados en cada fiesta con filtro anual.
- **Álbum Oficial Público con visor HD y descarga — ANDA.** Ruta pública `/album/[fiestaId]` y `/evento/album/[fiestaId]` con visualizador lightbox, descarga directa de imágenes y botón para compartir por WhatsApp.
- **Ranking de la noche y foto más querida en el muro — ANDA.** Diapositiva especial rotativa en la pantalla gigante de `/evento/muro-en-vivo/[fiestaId]` que resalta la foto aprobada con más corazones y las mesas más participativas sin nombres individuales ni perdedores.
- **Cápsula del tiempo en el Buzón de Deseos — ANDA.** Selector en `/evento/buzon/[fiestaId]` para guardar saludos de voz o video con fecha futura de apertura (1, 3, 5, 10 o 15 años), persistidos en Firestore con `unlockDate`.
- **Pedidos de música para el DJ y vista DJ ordenada — ANDA.** Pantalla para invitados con tope de 3 temas por persona y panel en tiempo real para el DJ en `/evento/dj/[fiestaId]` ordenado por votos con estados sonada/pendiente.
- **Pedido a proveedores por WhatsApp en lista de compras — ANDA.** Botones en `/fiestas/nueva/catering/lista-compras` para enviar o copiar el pedido de insumos formateado a cada proveedor sin alterar fórmulas de costos.
- **Generador de borradores para redes sociales desde fiesta — ANDA.** Acción `generateDraftPostsFromPartyPhotos` y botón en `/empresa/redes-sociales` que crea 4 borradores con copy y hashtags listos para que el equipo los revise.
- **De quién es cada foto del muro — ANDA a medias (17 de agosto de 2026).** La foto que sube un invitado al muro queda guardada con su dueño, pero **sólo si abrió su enlace personal**: un identificador suelto no se guarda nunca, así nadie se adueña de las fotos de otro. Si no hay enlace personal, la foto se sube igual y queda sin dueño. **Falta que lo hagan las estaciones** (fotocabina, espejo mágico, plataforma 360), que hoy ni siquiera reciben ese enlace. Verificado de nuevo el 19 de agosto de 2026: sigue sin hacerse. **Este pedido se perdió una vez** al rotar la orden y hubo que reponerlo; está en el bloque 5 de `docs/ordenes/ahora.md`. **Sirve de acá en adelante**: las fiestas ya pasadas no tienen el dato.
- **Explicación narrativa del presupuesto — ANDA.** Resumen descriptivo fiel en `BudgetDocument.tsx` y visor de presupuestos que explica los servicios contratados sin inventar números ni precios.
- **Ejecución automática de pruebas de navegador en tandas — ANDA (21 de agosto de 2026).** `npm run test:e2e` corre los 20 archivos de Playwright en tandas de 4 levantando y liberando su servidor, aplicando el criterio de medio segundo (<500ms) para reintentar saturaciones de entorno y consolidar un único informe.
- **Control de puertas públicas en la auditoría — ANDA (21 de agosto de 2026).** Pasada 5 en `npm run auditoria` que detecta y avisa en criollo si una función requerida por pantallas públicas recibe control de sesión indebido (`requireAppSession`), protegiendo las pantallas de tótem, barra, simulador y portal.


## Aparecer en Google (posicionamiento) — revisado el 18 de agosto de 2026

### Tener título no alcanza si la página no se abre

**Encontrado el 17 de agosto.** Bodas, quince años, cumpleaños y la experiencia
AK figuraban acá como listas para Google, y estaban bien armadas —título,
descripción, imagen de vista previa—, pero **el sistema mandaba al visitante a la
pantalla de contraseña**: faltaba declararlas como abiertas. El prospecto que
llegaba desde Google o desde un enlace de WhatsApp veía un formulario de ingreso,
y Google tampoco podía leerlas.

Corregido, con una prueba que ata las dos listas para que no vuelva a pasar. **Al
revisar esta sección hay que mirar las dos cosas**: que la página tenga su título
y que se pueda abrir sin cuenta.

### Lo que muestra el panel de redes, revisado el 18 de agosto

El centro de presencia digital mostraba seguidores, alcance, crecimiento y
puntaje de Google **inventados**, escritos a mano, con la misma cara que los datos
reales. Corregido: lo que no se midió va vacío y dice "sin dato". Ver
`docs/YA-RESUELTO.md`.



### El problema principal

El sitio tenía una instrucción que le decía a **todos** los buscadores que no
indexaran **ninguna** página. Venía de cuando la aplicación era sólo interna. Con
eso puesto, nada de la parte pública podía aparecer en Google. Corregido: ver
`docs/YA-RESUELTO.md`.

### Lo que anda

- Las páginas de bodas, quince años y eventos tienen título, descripción e imagen
  de vista previa para cuando se comparte por WhatsApp o redes.
- Las invitaciones arman su título, descripción e imagen con los datos reales de
  cada fiesta, y se actualizan solas al guardar la fiesta.
- El blog y las páginas por tipo de evento tienen título y descripción.
- La portada tiene la ficha de negocio (dirección, teléfono, coordenadas de Salto,
  redes) que Google usa para mostrar el local.
- La mayoría de las pantallas públicas se arman del lado del servidor, que es lo
  que Google lee bien.

- **La ficha de negocio para Google** (nombre, dirección, teléfono, coordenadas y
  redes) está en la portada y también en bodas, quince, cumpleaños y el blog.

- **Todas las páginas que Google puede ver tienen título y descripción propios.**

### A medias

### No está

- Nada que avise a Google cuando se agrega un servicio, una foto o un evento nuevo.
  El listado de páginas se arma solo, pero el aviso a Google no existe (Google dejó
  de aceptarlo en 2023; hoy se hace desde su panel).
