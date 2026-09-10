# 50 - Web de ventas y tecnologia de LA APP para las fiestas

> ESTADO 1205/1b65b7c: las estaciones ya no estan dentro de details cerrado y
> la prueba que exigia ocultarlas fue corregida. No reimplementar. Falta comprobar
> visibilidad en navegador: [evidencia actual](../evidencias/contraste-1205-1b65b7c.md).

> ACTUALIZACION 2026-09-09: evidencia historica de main8c5, NO una orden
> para reprogramar todo. Contrastar cada caso con el HEAD de la tanda abierta
> antes de editar y verificar alli rutas/simbolos/consumidores.
> PR #1204 observada en a0050d40181dbaf8f0e54ffa3f2d8ce191b7185d;
> no se certifico toda esa PR. Prevalece el reparto corregido de AGENTS.md:
> Claude: dinero, cobros, contabilidad, comida y permisos; Gemini: resto.
> Fotocabina, plataforma 360 y espejo deben seguir visibles sin pulsar Ver mas.
> Priorizar tecnologia de la app NO autoriza esconder los servicios vendidos.
> No crear un test que obligue a ocultarlos; cambios comerciales los aprueba el dueno.

Fecha: 2026-09-08. Estado: REVISION PARCIAL, implementacion y aprobacion pendientes.
Codex audita y propone; Gemini programa; Claude Opus compila. El dueno fusiona.

## Orden prioritaria del dueno

"LA SECCION TECNOLOGIA DEBE MOSTRAR LA TECNOLOGIA DE LA APP PARA LAS FIESTAS".

Esto corrige el enfoque inicial demasiado centrado en fotocabina y equipos. La
seccion debe explicar y demostrar como LA APLICACION mejora la fiesta para quien
contrata y quien asiste. Los equipos son servicios complementarios; mantenerlos
en su catalogo, no borrarlos ni convertirlos en el contenido central de esta seccion.

## Base, skills y limites

- Skills usadas: ak-neuromarketing-web, ak-ux-auditor y ventas-simulador de
  ak-expertos-produccion. Rol: prospecto que llega desde anuncios Facebook/Instagram,
  necesita entender la oferta, confiar, conocer servicios y pedir propuesta.
- Fuente revisada: main `8c5eb6e173e7b7b8dce6a8811cade7cf38411dfe`.
  URL intentada: https://akproducciones.uy. No se conoce SHA del despliegue actual.
- Se reutilizo YA-RESUELTO y las ordenes 45-48; no reabrir todo lo que ya comprobaron.
  Un agente economico reviso copy/landings; Codex contrasto los hallazgos.
- PR 1201 (`114ec45ba886595f39190d068cb3b271ad01239b`) y 1202
  (`6622427c604930b02910a2a2778bf20a72683f40`) tienen cambios en la vidriera y hero.
  Se compararon sus archivos/diff relevantes, NO se auditaron completas ni aprobaron.
  Coordinarlas antes de editar los mismos componentes. No crear redisenos rivales.
- No hubo cambios de codigo de app, build, publicacion, mensajes ni datos de clientes.
  Esta entrega es una orden con evidencia de auditoria, NO una correccion finalizada.

## WEB-01 - P1: el recorrido publico no pudo completarse

Observado en navegador durante esta auditoria:

- `/`: muestra `upstream connect error or disconnect/reset before headers`;
  un reintento reprodujo el error. La consulta web independiente tambien termino
  en timeout. No alcanza para afirmar caida global ni causa Firebase/facturacion.
- `/simulador-de-presupuesto`: llego a mostrar titulo y pantalla de la app:
  "ERROR DE CONEXION" / "No pudimos cargar el catalogo de servicios...".
  Se pulso Reintentar: termino en error upstream. No se pudo llegar a los paquetes.
- `/experiencia-ak`: error upstream en este navegador.

Gemini/Claude: identificar despliegue y logs del mismo momento, distinguir red de
auditoria, backend, arranque y lectura de catalogo. No atribuirlo a tarjeta de credito
sin evidencia. Recuperar ruta publica y verificar desde otro dispositivo/red.
En el error del simulador ofrecer contacto AK y conservar datos ingresados; no
afirmar que el problema siempre es el internet del prospecto. Nunca inventar precios
para permitir avanzar cuando no hay catalogo verificable.

Aceptacion: portada, landings, tecnologia y simulador cargan; ante fallo forzado de
catalogo hay mensaje honesto, reintento y contacto utiles, sin mostrar importes falsos.
Pendientes pruebas visuales PC/celular, movimiento, imagenes y todos los CTA.

## WEB-02 - P1: contenido aun no publicado puede llegar a la galeria publica

`src/lib/instagram/public-feed.ts:30-69` lee social-posts y filtra solo Instagram y
mediaUrl. No filtra status ni distingue contenido Programado/Borrador/Fallo.
`src/app/page.tsx:348-369` consume el resultado para la galeria publica.

Sonda aislada con funcion real: un Publicado, un Borrador y un Programado para 2099
producen TRES publicaciones publicas. Datos falsos; no se inspecciono ni publico un
borrador real. El defecto no implica que ya se haya expuesto una foto concreta.

Gemini: definir estados elegibles segun historial real (Publicado, importaciones
confirmadas) y aprobacion de uso publico. Fallar cerrado con Borrador, Programado,
Error y estado desconocido. No basta con comparar fecha ni con que tenga imagen.
Preservar importaciones historicas autorizadas. No cambiar estado del post al leer.
Pruebas con estados reales de SocialPost, fechas futuras, error y registros historicos.

## WEB-03 - P1: se pierde el origen de anuncios en el recorrido comercial

1. `src/lib/commercial/acquisition.ts:79-92` lee source/campaign, no utm_source ni
   utm_campaign. Con UTMs de Facebook la sonda devuelve landing y campaign undefined.
2. `src/app/actions/crm.ts:1048-1063` reemplaza acquisition.source por fuente de la
   pagina. Con facebook explicito y fuente landing-bodas, guarda landing_bodas.

Esto importa porque el dueno trae la mayoria de prospectos desde publicidad paga.
No afirmar que GA4 o Meta pierden TODOS sus eventos: estas sondas prueban el canal
guardado en este camino de CRM, no toda la medicion externa.

Gemini: conservar canal de captacion y pagina visitada como conceptos distintos.
Aceptar UTMs estandar y las referencias existentes sin romper enlaces antiguos;
conservar contexto al pasar al simulador y enviar el formulario. No usar el telefono
como identificador de una unica cotizacion: una persona puede pedir varias.
Respetar consentimientos y no publicar datos personales en URLs o analitica.
No reclasificar historicos como Facebook por defecto: desconocido sigue desconocido.

Aceptacion: anuncio Facebook -> boda -> simulador -> consulta conserva canal y
campana correctos; Instagram/directo tambien; no duplicar Lead por recargar.

## TEC-01 - Prioridad de producto: demostrar la app durante una fiesta

Actualmente `src/app/page.tsx:512-516` monta InteractiveTechShowcase (10 opciones
principalmente de servicios/equipos) seguido de TechnologyExperienceSection (3
explicaciones sobre portal/invitacion/en vivo). Esto no representa bien la prioridad
que acaba de definir el dueno. Un cambio de colores no resuelve ese contenido.

Gemini: una seccion comercial unificada sobre LA APP, con este recorrido propuesto:

| Momento | Mostrar en la app | Lo que entiende la persona |
| --- | --- | --- |
| Antes | Portal cliente: menu, musica, decoracion, acuerdos y decisiones | Organizo mi fiesta sin perder conversaciones |
| Invitacion | Invitacion, confirmar asistencia, mapa y datos practicos | Mi invitado encuentra todo desde su enlace |
| Durante | Mural/red social, dedicatorias, pedido musical y actividades habilitadas | Mis invitados participan, no solo miran |
| Barra y totem | Carta de tragos, ingredientes, nombre y seguimiento del pedido | El pedido llega a quien lo prepara |
| Despues | Album de fotos, videos y mensajes disponibles | Me quedan los recuerdos de mi fiesta |

Las filas son el guion de demostracion, no cinco paneles que llenar. Presentacion
progresiva con controles familiares y un resultado visible por interaccion. En
celular no obligar a recorrer una fila interminable de diez opciones ocultas.

Ejemplo de copy para evaluar: titulo "La app de tu fiesta"; apoyo "Organiza los
detalles, invita a los tuyos y comparti los recuerdos desde un mismo lugar".
Accion principal "Ver como funciona"; despues "Consultar para mi fiesta".
El texto definitivo debe ajustarse a funciones habilitadas y comprobadas.

### Demostracion que vende sin fingir

- Usar pantallas/componentes reales con una fiesta DEMO aislada e identificada.
  No enlazar datos, invitados ni controles administrativos de una fiesta real.
- Cada cambio de opcion debe mostrar un recorrido comprensible, no solo cambiar
  una foto de equipo. Si es video demostrativo, decirlo; no llamarlo app en vivo.
- Mostrar un ejemplo de invitado que escribe un mensaje y donde lo recibe la
  pantalla, respetando moderacion. No prometer publicacion inmediata si requiere
  aprobacion del operador. La demo no debe publicar ni enviar avisos reales.
- Carta de tragos y cola del barman separadas de pedidos musicales al DJ. No mezclar
  ambas colas. La demo debe mostrar ingredientes y confirmacion del pedido ficticio.
- Dar salida clara para volver al sitio. El interesado no debe registrarse ni
  atravesar una pantalla de login administrativo para comprender el diferencial.
- Preservar la pregunta/experiencia de interes al consultar. No prometer que todos
  los modulos estan incluidos en cualquier paquete: conectarlo a catalogo vigente.
- No anunciar "guardado para siempre", viralidad garantizada ni descarga automatica
  al telefono sin respaldo. Escanear QR abre el recuerdo; no garantiza guardarlo.
- Validar contra orden 48: una impresion, entrega QR o actividad no se da por
  disponible solo porque la vidriera o una animacion diga que existe.

### Estetica al servicio de la venta

La sensacion futurista debe salir de ver la app responder: seleccion, transicion
entre momentos, muestra del mensaje en pantalla y confirmacion clara. No de agregar
orbes, brillos o mas tarjetas. Mantener imagenes legibles y textos separados de los
detalles que el prospecto necesita inspeccionar. Fondos claros con contraste AK y
un escenario festivo donde corresponda, no todo oscuro ni cambios bruscos sin motivo.
Respetar reduced-motion, no mover el boton de compra ni ocultar contenido hasta que
arranque JavaScript. Validar PC/celular antes de aplicar a otras secciones.

## Otras oportunidades comerciales, sin borrar decisiones del dueno

- Prueba social: EventLandingPage usa 3 testimonios constantes bajo "Experiencias
  Verificadas". Documentar su procedencia o enlazar la fuente de testimonios aprobada.
  NO calificarlos de falsos sin evidencia; NO borrar los 22 testimonios de
  src/data/event-catalogs confirmados por el dueno el 18 de agosto. Son otra lista.
- Aclarar "presupuesto cerrado" y "base exacta" donde pueda confundirse precio
  vigente con precio garantizado a futuro. Mantener ajustes anuales y contrato.
- Club Uruguay: el CTA "Coordinar una visita" abre mensaje de conocer/cotizar.
  Mejorarlo para pedir explicitamente visita, sin simular reserva confirmada.
- Servicios: dejar claro organizacion integral y que incluye la propuesta real,
  seguido de prueba visual pertinente. No eliminar equipos contratables por mover
  su explicacion fuera de la seccion de tecnologia de la app.
- Galeria: se preserva la deduplicacion adicional y clasificacion ya existentes en
  gallery-media-utils. No afirmar que siguen las fotos mal por reclamos antiguos.
  Fotos/menu incorrectos requieren cotejo visual nuevo, aun pendiente por el bloqueo.

## Evidencia y cierre

`docs/evidencias/50-sondas-venta.cjs` ejecutado contra cuerpos reales con I/O falso.
Comando: `node docs/evidencias/50-sondas-venta.cjs <ruta-a-typescript-instalado>`.
En esta maquina se uso C:/Users/Usuario/Desktop/app/app-AK/node_modules/typescript.
Salida 1: WEB-02 devuelve 3 publicaciones en vez de 1; WEB-03a pierde ambas UTMs;
WEB-03b reemplaza facebook por landing_bodas. No se crearon leads ni envios reales.

No probado: recorridos completos, formularios reales, PDF, Club/Blog visuales,
fotos Canva, demo tecnologica, telefonos reales, sincronizacion Firebase, rendimiento
y responsive. No hay certificado final. Claude debe comprobar esas rutas cuando
se recupere el acceso, sobre el mismo SHA que vaya a publicar.

Registrar por ruta: oferta, imagen/servicio, siguiente paso, resultado, PC/celular,
origen del prospecto y evidencia. Registrar defecto, friccion u oportunidad por
separado. Las pruebas del bloque siguiente son PROPUESTAS, no pruebas ejecutadas.

```comprobar
archivo: docs/evidencias/50-sondas-venta.cjs
usa: getPublicInstagramFeed en src/app/page.tsx
usa: saveLead en src/components/landing/LeadCaptureForm.tsx
usa: InteractiveTechShowcase en src/app/page.tsx
usa: TechnologyExperienceSection en src/app/page.tsx
prueba: tests/e2e/50-venta-origen-y-galeria-publica.spec.ts
prueba: tests/e2e/50-tecnologia-app-fiesta-demo.spec.ts
```
