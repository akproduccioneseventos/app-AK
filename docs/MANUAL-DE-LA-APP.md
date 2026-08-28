# Manual de la app AK

**Un solo manual, dos capas.** Arriba, el mapa en criollo: es lo que lee la
asistente que vive adentro de la app para contestarle al equipo y llevarlo al
lugar. Abajo, el índice técnico: es lo que leen las inteligencias que programan,
para no volver a construir algo que ya está ni prometer algo que la app no hace.

Van juntos a propósito. Dos manuales separados se despegan en un mes, y el que
queda viejo hace más daño que no tener ninguno.

**Tamaño de la app hoy: 352 pantallas y 43 opciones de menú.** Esos dos números
no se escriben a mano: los cuenta el control automático, y si no coinciden con
la app de verdad, se pone en rojo.

---

## Cómo se mantiene al día (esto no es una promesa, es un candado)

El manual tiene dos partes y se cuidan distinto:

- **Lo que se arma solo**: la lista de pantallas y las opciones del menú. Se leen
  de la aplicación con `npm run mapa:generar`, que escribe el mapa que después
  usa la asistente.
- **Lo que se escribe a mano**: el porqué de cada decisión. Eso ninguna máquina
  lo puede deducir, y es justamente lo que se pierde entre un chat y otro.

Encima va el control `src/__tests__/mapa-de-la-app-al-dia.test.ts`, que vuelve a
armar el mapa y compara contra el guardado. **Si alguien agrega una pantalla y no
regenera el mapa, el control se pone en rojo y ese cambio no entra.** Además
revisa tres cosas más: que cada opción del menú lleve a una pantalla que existe,
que la asistente no pueda mandar a nadie a una pantalla inventada, y que cada
ruta que nombra este manual siga estando.

---

# CAPA 1 — El mapa en criollo (lo que lee la asistente)

## Las cinco áreas del panel

### 💼 CRM y ventas — de desconocido a cliente

| Para qué | Dónde |
|---|---|
| Ver y mover los prospectos por etapa | `/contabilidad/crm` |
| Armar un presupuesto | `/presupuestos/nuevo` |
| Ficha de clientes ya cerrados | `/customers` |
| Simulador con inteligencia artificial | `/simulador-ak` |
| Los WhatsApp preparados del día, listos para tocar y mandar | `/contabilidad/crm/outbox` |
| El repaso de la mañana: qué hay que hacer hoy | `/repaso-diario` |
| Agenda de reuniones con prospectos | `/contabilidad/crm/agenda` |
| Rendimiento de los anuncios pagos | `/contabilidad/crm/marketing-ads` |

**Etapas del prospecto:** Nuevo → Contactado → Entrevista agendada → Presupuesto
enviado → En negociación → Ganado o Perdido. Un prospecto sin etapa o sin próxima
acción es un prospecto perdido.

### 🎉 Fiestas — armar y correr el evento

| Para qué | Dónde |
|---|---|
| Las fiestas activas | `/eventos` |
| Calendario general | `/calendario` |
| Configuración general de una fiesta | `/fiestas/nueva/configuracion` |
| Invitados y confirmaciones | `/fiestas/nueva/invitados` |
| Comida del evento | `/fiestas/nueva/catering` |
| Alergias y dietas especiales | `/fiestas/nueva/alergias` |
| Decoración | `/fiestas/nueva/decoracion` |
| Entretenimiento | `/fiestas/nueva/entretenimiento` |
| Música | `/fiestas/nueva/musica` |
| Personal asignado | `/fiestas/nueva/personal` |
| Servicios contratados | `/fiestas/nueva/servicios-contratados` |
| Plan de pagos de esa fiesta | `/fiestas/nueva/plan-pagos` |
| Rentabilidad de esa fiesta | `/fiestas/nueva/gestion-costos-rentabilidad` |
| Contratos, recibos y cambios firmados | `/fiestas/nueva/gestion-documental` |
| Centro de operaciones, la noche de la fiesta | `/fiestas/nueva/en-vivo` |
| Configurar el portal del cliente | `/fiestas/nueva/portal-cliente` |
| Portal para los proveedores | `/fiestas/nueva/proveedores-portal` |
| Personal que está en dos fiestas el mismo día | `/recursos-multi-evento` |
| Incidentes | `/incidentes` |
| Guías de armado paso a paso | `/playbooks` |
| Muro social de todos los eventos | `/empresa/red-social-eventos` |

### 💰 Plata — presupuestos, cobros y cuentas

| Para qué | Dónde |
|---|---|
| Cobrar rápido una seña o un saldo | `/pagos-rapidos` |
| Panel contable | `/empresa/contabilidad` |
| Reporte de ganancias y pérdidas | `/empresa/contabilidad/reportes` |
| Flujo de caja proyectado | `/empresa/contabilidad/flujo-caja` |
| Gastos generales | `/empresa/contabilidad/gastos` |
| Facturas | `/invoices` |
| Cambios que hay que aprobar | `/aprobaciones` |
| Métricas del negocio | `/empresa/dashboard` |

**Cómo se arma la plata de una fiesta, en orden:** el presupuesto suma los
servicios elegidos → se aplica el descuento → se aplica el ajuste anual del 15%
si la fiesta es para el año que viene → sale la seña (lo acordado, o $5.000 si no
se acordó nada) → el saldo es el total menos lo que ya se cobró.

### 📦 Insumos y empresa — lo que hace falta para la fiesta

| Para qué | Dónde |
|---|---|
| Menús y platos | `/empresa/menus` |
| Lista de compras | `/compras` |
| Insumos e ingredientes | `/empresa/insumos` |
| Salones | `/empresa/salones` |
| Catálogo de servicios | `/empresa/servicios` |
| Proveedores | `/proveedores` |
| Empleados | `/empleados` |
| Fotos de la presentación en la pantalla LED | `/empresa/presentacion-led/configuracion` |
| Planificador de contenido de redes | `/empresa/redes-sociales` |
| Centro de presencia digital | `/empresa/presencia-digital` |
| Galería pública | `/empresa/galeria` |
| Editor de la página de venta | `/empresa/landing-editor` |

### ⚙️ Configuración

| Para qué | Dónde |
|---|---|
| Ajustes generales | `/settings` |
| Ver si las tareas automáticas corrieron | `/settings/tareas-automaticas` |
| Conexiones con otros servicios | `/settings/sincronizaciones` |
| WhatsApp | `/settings/whatsapp` |
| Cláusulas del contrato | `/settings/contratos/clausulas` |
| Seguridad y cuentas | `/settings/account` |
| Promociones | `/settings/promos` |
| La asistente de la app | `/settings/ai-assistant` |
| Mapa tecnológico | `/settings/mapa-tecnologico-ak` |
| Alertas | `/alertas` |

## Lo que ve el cliente

Cada fiesta tiene su portal: el cliente entra con su enlace y ahí sigue todo sin
llamar por teléfono.

| Para qué | Dónde |
|---|---|
| Su panel | `/portal-cliente/:id` |
| Menús de su fiesta | `/portal-cliente/:id/menu` |
| Música y lista de temas | `/portal-cliente/:id/musica` |
| Confirmar invitados | `/portal-cliente/:id/confirmar-invitados` |
| Fotos y videos | `/portal-cliente/:id/fotos-video` |
| Muro social | `/portal-cliente/:id/muro-social` |
| Preguntas frecuentes | `/portal-cliente/:id/faq` |

## Lo que ve el invitado

| Para qué | Dónde |
|---|---|
| Su invitación | `/invitacion/:fiestaId` |
| Confirmar asistencia | `/invitacion/:fiestaId/rsvp` |
| Portal personal del invitado | `/portal-invitado/:fiestaId/:guestId` |
| El hub de la fiesta, la puerta a todo | `/evento/hub/:fiestaId` |
| Su mesa | `/evento/mi-mesa/:fiestaId` |
| Fotocabina | `/evento/fotocabina/:fiestaId` |
| Espejo mágico | `/evento/espejo-magico/:fiestaId` |
| Plataforma 360 | `/evento/plataforma-360/:fiestaId` |
| Tótem de la barra: pedir el trago y sacarse la foto | `/evento/barra/:fiestaId` |
| Pedir temas al DJ | `/evento/dj/:fiestaId` |
| Muro en vivo, en la pantalla grande | `/evento/muro-en-vivo/:fiestaId` |
| Galería oficial de la fiesta | `/evento/galeria/:fiestaId` |
| Buzón de saludos | `/evento/buzon/:fiestaId` |
| Álbum, después de la fiesta | `/album/:fiestaId` |

## Las páginas que traen clientes nuevos

`/` es la portada. Después están las de cada tipo de fiesta: `/bodas`,
`/quinceaneras`, `/cumpleanos`, más `/catalogo`, `/experiencia-ak` y el
`/simulador-de-presupuesto`. El blog vive en `/public/blog`.

## Lo que corre solo, sin que nadie apriete nada

Son cuatro tareas, y en `/settings/tareas-automaticas` se ve cuándo pasó cada una
por última vez:

1. **Notas del blog** — 3 notas juntas, una vez por semana.
2. **Métricas de redes** — una vez por día.
3. **Publicar lo programado** — cada hora.
4. **Recordatorios de pago** — una vez por día. Prepara el mensaje; no lo manda.

**Cómo se disparan:** cuando alguien del equipo entra a la app, lo atrasado se
pone al día solo a los pocos segundos. O sea: mientras el equipo use la app, esto
corre. No hace falta un despertador externo.

## Cosas que la asistente tiene que saber contestar bien

- **La lista de compras usa los invitados del presupuesto, no los confirmados.**
  Se cocina lo que se contrató. Si vienen más, se agregan invitados y el
  presupuesto sube.
- **El WhatsApp prepara mensajes, no los manda.** Salen desde el teléfono del
  dueño cuando una persona los toca. Al único que le contesta solo es a quien
  llega desde un anuncio o una publicación de la empresa.
- **Se trabaja sólo en pesos uruguayos.**
- **El ajuste anual del 15% va siempre.**
- **Si un dato no está, se dice qué falta y dónde cargarlo.** Nunca se inventa,
  y nunca se dice que algo se guardó o se mandó si no hubo confirmación.

---

# CAPA 2 — El índice técnico (lo que leen las que programan)

## Dónde vive la plata

| Tema | Archivo | Función |
|---|---|---|
| Total del presupuesto y descuentos | `src/lib/simulator/pricing.ts` | `calculateSimulatorPricing` |
| Ajuste anual del 15% | `src/lib/budget/financial-guardrails.ts` | `calcularAjusteAnualAlPresupuesto` |
| Monto de la seña | `src/lib/budget/monto-de-senia.ts` | `montoDeSenia` |
| Saldo y resumen de pagos | `src/lib/budget/financial-guardrails.ts` | `getBudgetPaymentSummary` |
| Facturas: crear, numerar, cobrar | `src/app/actions/invoices.ts` | `saveInvoiceInner`, `addPaymentToInvoice` |
| Cobro por internet (Mercado Pago) | `src/lib/payments/mercadopago-server.ts` | `createMercadoPagoCheckout` |
| Firma del aviso de cobro | `src/lib/payments/mercadopago-core.ts` | validación HMAC |
| Ganancias y pérdidas | `src/app/actions/reportes.ts` | `getProfitAndLossData` |
| Costo de la comida y del personal | `src/app/actions/fiesta/costos.actions.ts` | `syncAllEventCosts` |
| Recibos del personal | `src/app/actions/recibos-personal.ts` | `saveReciboFirmado` |

Dos protecciones que no se tocan: una factura que ya tiene pagos no puede
cambiar número, moneda, cliente, ítems ni impuestos; un recibo ya pagado no
puede cambiar monto ni fecha.

## La asistente de la app

- **Se arma el contexto en** `src/ai/flows/multiagent-flow.ts`, función
  `buildContext`. Ahí entran: el manual de `src/lib/multiagent/manual-ak.ts`,
  la memoria del agente, el diagnóstico del día y la pantalla donde está parado
  el usuario.
- **Sí recibe datos reales**: métricas del día, presupuestos, prospectos, tareas
  pendientes y la fiesta en contexto si hay una.
- **Puede hacer cuatro cosas**: crear una tarea, crear un recordatorio, llevar a
  una pantalla, o sólo contestar.
- **El mapa de pantallas** sale de `src/lib/multiagent/mapa-app.generado.ts`, que
  se arma solo. No escribir listas de rutas a mano en ningún otro lado.
- **Dónde aparece**: en todas las pantallas del panel, y en las páginas públicas
  de venta que define `src/lib/public-experience/donde-va-el-asistente.ts`.

## Marketing y posicionamiento

- **Tareas automáticas**: se registran en `src/lib/automatico/tareas-automaticas.ts`.
  Se disparan por `/api/cron/...` y la puerta la controla
  `src/lib/automatico/puerta-de-las-tareas.ts`.
- **Blog**: se escribe en `src/lib/blog-ai-generator.ts`. Cuántas y cada cuánto:
  `NOTAS_POR_SEMANA` y `SEO_INTERVAL_MS` en `src/lib/marketing-automation.ts`.
  La foto es siempre una foto real del catálogo, nunca generada.
- **YouTube**: se lee del listado público del canal
  (`src/lib/social-media/youtube-history-backfill.ts`). No necesita credenciales.
- **Instagram**: `src/lib/instagram/public-feed.ts`. Necesita la conexión
  comercial de Meta cargada. Sin eso, en producción avisa que no está conectado;
  **nunca muestra fotos de ejemplo fuera de la computadora de prueba**.
- **Mapa del sitio**: `src/app/sitemap.ts`. Cada nota nueva del blog entra sola.
- **Títulos y descripciones de las páginas de venta**:
  `src/lib/seo/event-landing.ts` y `src/lib/seo/paginas-publicas.ts`. La ficha
  del negocio, en `src/components/public/LocalBusinessSchema.tsx`.

## Lo que NO existe (para que nadie lo prometa ni lo rehaga)

- **No hay nada que mida posiciones en Google** ni que busque palabras clave
  nuevas. El posicionamiento es lo que sale solo: notas que entran al mapa del
  sitio y páginas de venta con su título y su ficha.
- **El blog no tiene aprobación previa.** Las notas se publican directo.
- **La asistente no cobra, no factura y no manda WhatsApp.** Puede llevar a la
  pantalla donde se hace.
- **No hay despertador externo.** Las tareas se ponen al día cuando alguien entra.
- **El servidor se duerme cuando nadie lo usa, y es a propósito** (`apphosting.yaml`,
  `minInstances: 0`). No es un problema de velocidad.

## Los porqués que el código no cuenta

- **La lista de compras usa los invitados del presupuesto** y no los confirmados,
  porque se cocina lo que se contrató.
- **El WhatsApp prepara y no manda** porque la línea es el número personal del
  dueño: escribirle a clientes está bien, contestarle a cualquiera no.
- **El descuento del 50% del Salón Club Uruguay y el descuento del presupuesto**
  son decisiones de marketing. No son errores de cuenta.
- **Las fotos del muro se bajan con el enlace directo** a propósito: quien tenga
  el enlace tiene que poder bajarlas.
- **Sólo pesos uruguayos.** Las diferencias de redondeo en dólares no aplican.
- **El agente de publicidad administra solo, pero no prende nada.** Puede pausar, bajar un
  presupuesto y subir el de algo que ya está al aire, dentro de un tope mensual. **No crea
  campañas ni reactiva las pausadas**: eso lo enciende el dueño. Apagar y moderar es cuidar;
  encender es salir a gastar. El tope **niega** en vez de aconsejar, y cuenta lo comprometido
  hasta fin de mes y no lo ya gastado — contando sólo lo gastado, el desastre se descubre el
  día 28. **Y el aviso de qué se está por hacer es obligatorio: sin él no compila**, porque
  la primera entrega que usó el freno simplemente no lo mandaba y la prohibición quedaba
  salteada en silencio.
- **El archivo `llms.txt` existe y no declara precios.** Es donde las IA leen qué hace el negocio.
  Va en `ARCHIVOS_QUE_GOOGLE_LEE`, no en la lista de páginas: esa segunda alimenta también el
  mapa del sitio, y ofrecer un archivo de texto como si fuera una página es ofrecer algo que
  no existe.
- **El cliente ideal se calcula, no se inventa.** Sale de cruzar presupuestos ganados contra
  perdidos. Si no hay contratos suficientes, la pantalla lo dice en vez de mostrar un perfil
  bonito: un cliente ideal escrito por una IA de la nada es un horóscopo, y con eso se toman
  decisiones que cuestan plata.
- **La tira de la fotocabina se arma sola con los datos de la fiesta** —nombre del
  homenajeado en manuscrita, motivo, fecha y color— e imprime en **10x15 vertical**. Lo único
  que todavía no llega es el **fondo decorado**, que es el de la invitación digital de esa
  misma fiesta. Ahí está la diferencia con el recuerdo que el dueño entrega hoy, y es lo que
  ninguna plataforma paga puede hacer sin que alguien arme una plantilla por evento.
- **La pantalla de entrada se diagnostica sola, y nunca se guarda en el teléfono.**
  El dueño estuvo sin poder entrar y la app le decía "contraseña incorrecta" cuando el
  problema era otro. Ahora, si un intento falla, la app comprueba cuatro cosas —si llega a
  la base, si le falta la llave que mantiene la sesión, si hay alguna cuenta creada, o si
  es la clave— y escribe cuál de las cuatro fue. **Y la entrada quedó fuera de lo que se
  guarda en la memoria del navegador**: una copia vieja se dibuja igual y ningún botón
  responde, y siendo la única puerta de la app, no habría forma de entrar a arreglarla.
- **El primer ingreso con Google crea la cuenta de administrador.** Antes la app sólo sabía
  crear ese primer usuario si encontraba una configuración inicial cargada; si faltaba,
  quedaba vacía para siempre. Callejón sin salida: no se puede entrar a crear la cuenta
  porque no hay cuenta con la cual entrar. Sólo pasa con la base **completamente vacía** y
  con un correo ya autorizado por Google.
- **Nada de promesas en la web, y menos congelar precio.** Se sacaron las de "respuesta en
  24 horas" y las de precio congelado. El **ajuste anual del 15% va siempre**, y congelar
  un precio lo contradice de frente: una promesa que el negocio no sostiene no es una
  mejora de venta, es una discusión futura con un cliente. Sí se dice **por dónde se
  contesta**, y **reservar la fecha con una seña** también, porque es real.
- **El reloj del simulador es para la promoción, no para congelar la tarifa.** Se entendió
  mal mucho tiempo, incluso en la documentación. Está para que la gente acceda al descuento
  y los regalos mientras corre: una **oferta con fecha**, que es cosa distinta.
- **El agente de publicidad administra solo, pero no prende nada.** Puede pausar, bajar un
  presupuesto y subir el de algo que ya está al aire, dentro de un tope mensual. **No crea
  campañas ni reactiva las pausadas**: eso lo enciende el dueño. Apagar y moderar es
  cuidar; encender es salir a gastar. El tope **niega** en vez de aconsejar, y cuenta lo
  comprometido hasta fin de mes y no lo ya gastado — contando sólo lo gastado, el desastre
  se descubre el día 28.

---

**Cuando cambies algo de la app, este manual se toca en el mismo viaje.** Si es
una pantalla nueva, corré `npm run mapa:generar`. Si es una decisión nueva,
escribí el porqué acá abajo del todo, en los porqués. Un manual que miente hace
más daño que no tener ninguno.
