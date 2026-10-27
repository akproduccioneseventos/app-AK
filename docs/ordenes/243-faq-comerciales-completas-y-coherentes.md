# Orden243 - Preguntas que ayudan a decidir, sin condiciones contradictorias

Gemini programa contenido/UX y F2; Claude resuelve F1/valida condiciones comerciales
y contractuales, compila conjunto y SIEMPRE fusiona. Codex revisa/no fusiona.
Una tanda. Informe723/sonda722. No fusionar documentacion sola.
La ampliacion22/8, grupos y despliegue son PROPUESTA para visto bueno del dueno,
no cambio de funcionamiento aprobado por esta revision. No implementarlos hasta
su confirmacion. F1/F2 son defectos separados, sin modificar condiciones comerciales.
Fuente c0add57f6237f666db97e7e902ef75f6c8d97479; PR1368-0929 sin deltaFAQ;
PortalFAQ igual ClaudePublicado bf0ba6c3. NO CONTRASTADO CON CAMBIOS PRIVADOS NO
PUBLICADOS: contrastar HEAD antes, no duplicar mejoras ya programadas.

## Lo existente se conserva

Home usa FAQSection de src/components/landing/FAQSection.tsx y le pasa
landingSettings.faqs (src/app/page.tsx). Base en src/types/landing-editor.ts:6.
Respaldo del componente:9, usado SOLO si no recibe lista no vacia. Actualizar solo
el componente NO garantiza que se vean nuevas preguntas. Editor existente:
getLandingSettings/saveLandingSettings en src/app/actions/landing-editor.ts.
Datos guardados del dueno pueden diferir: no borrarlos ni sobreescribirlos a ciegas.

Portal principal YA muestra24preguntas compartidas de
src/data/preguntas-frecuentes-contrato.ts. Ruta dedicadaFAQ tiene5propias. Reutilizar
fuente aprobada para condiciones; no otro CMS, coleccion, IA de respuestas o panel.
src/components/public/FAQSection.tsx sirve otras landings: no reemplazarlo globalmente
sin revisar sus consumidores, ni aplicar a todas las fiestas la misma respuesta.

## Separacion obligatoria por audiencia - aclaracion del dueno

Los22temas siguientes son un BANCO de contenido, NO22preguntas legales en lahome.
Esta aclaracion sustituye la propuesta anterior de una sola lista22comerciales.

- PROSPECTO, web/landings: decidir siAK resuelve su fiesta, servicios, otros salones,
  organizacion integral, presupuesto, visita, reserva y entretenimiento. Propuesta
  de14comerciales:1,2,3,5,6,7,8,9,10,11,12,13resumida,18,19. Las1/2/3 van primero.
  Ocho iniciales y resto desplegable sigue PROPUESTA de interfaz, no cambio ejecutado.
- CLIENTE CONTRATADO, portal: sus servicios, lista/invitados, menus/restricciones,
  musica/DJ, fotos/videodevida, decoracion, cronograma/reuniones, enlaces/QR,
  pagos/recibos propios y consultas al equipo. Respuestas segun modulos contratados
  y habilitados, no prometer funciones que ese cliente no tiene.
- CONDICIONES: fuente contractual y propuesta aplicable. El detalle de plazos,
  penalidades, responsabilidad, cancelacion y autorizaciones pertenece a contrato/
  documentos de contratacion y ayuda contextual, no un muro legal en lahome.
  Las condiciones importantes (precio, inclusiones, sena, pagos, ajustes, cambios,
  cancelacion y uso de imagen) deben poder conocerse ANTES de firmar/pagar; no
  esconderlas hasta despues de contratar ni disfrazarlas de marketing.
- TECNICA INTERNA: montaje, proveedores, cableado, insumos, costos, permisos y
  notas del equipo NO van aFAQpublica ni al portal delcliente. Si una exigencia
  tecnica afecta al lugar elegido, costo o compromiso delcliente, acordarla antes
  por escrito en su propuesta/documentos. No ocultar un costo bajo pretexto tecnico.

Usar recorridos existentes: no crear por suposicion /terminos u otra ruta ni volver
publico un contrato firmado. La app tiene /privacidad y portal privado de contrato;
verificar como se ofrece informacion precontractual en el flujo real antes de enlazar.
Mantener separacion de datos/roles: ni metadatosSEO ni FAQJsonLd llevan nombres,
telefonos, saldos, contratos privados o notas operativas. Evitar respuestas duplicadas
con reglas distintas. Estos borradores se asignan al contexto que corresponde:

1. ¿Cuentan con todos los servicios para mi fiesta?
   Sí. Contamos con los servicios para organizar tu fiesta de forma
   integral: comida, decoración, discoteca, sonido, iluminación, fotografía,
   filmación, barra, personal y tecnología. Tu presupuesto detalla lo contratado.
2. ¿Pueden realizar el evento en otro salón que no sea Club Uruguay?
   Sí. Podemos trabajar en otro salón o lugar que elijas. Coordinamos las
   condiciones del espacio y los servicios necesarios para tu evento.
3. ¿Se encargan de todo para que nosotros disfrutemos como invitados?
   Sí. Planificamos y coordinamos los servicios contratados antes y durante la
   fiesta. Definimos juntos los detalles para que ustedes y su familia disfruten
   la fiesta como invitados, sin estar pendientes de coordinar a cada proveedor.
4. ¿Qué tipos de fiestas organizan?
   Organizamos fiestas de 15, bodas, cumpleaños, aniversarios, reuniones familiares
   y eventos empresariales. Adaptamos la propuesta al tipo de celebración.
5. ¿Qué incluye el total del presupuesto?
   El desglose indica servicios, cantidades, regalos, descuentos y condiciones.
   Lo que no figure no se considera incluido; podés consultarlo antes de contratar.
6. ¿Puedo contratar solo algunos servicios?
   Sí. Podés consultar servicios individuales o una producción integral.
   Confirmamos disponibilidad y detalle en la propuesta.
7. ¿Pueden adaptar la propuesta a mis ideas y presupuesto?
   Podemos preparar alternativas de servicios y estilo para que elijas. Los
   cambios y adicionales se detallan; no prometemos descuentos nuevos ni costos cero.
8. ¿Cómo pido un presupuesto?
   Podés usar el simulador o escribirnos por WhatsApp con fecha, tipo de evento
   y cantidad de invitados. El equipo te ayuda a revisar las opciones.
9. ¿Puedo comparar varias opciones con el simulador?
   Sí. Podés evaluar distintas propuestas antes de decidir. Simular no reserva
   la fecha: disponibilidad y contratación se confirman por separado.
10. ¿Cómo reservo mi fecha?
    Confirmamos disponibilidad y formalizamos la reserva con el contrato y la
    seña acordada. No fijar un importe universal distinto al de la oferta aplicable.
11. ¿Con cuánta anticipación conviene consultar?
    Cuanto antes consultes, más margen hay para coordinar salón y servicios.
    Si falta poco, revisamos las opciones disponibles sin garantizar una fecha libre.
12. ¿Puedo conocer Club Uruguay antes de decidir?
    Sí. Coordiná una visita o entrevista sin costo para conocer el espacio y
    conversar sobre tu fiesta. Enlazar páginaClub y contacto; clic no es cita confirmada.
13. ¿Cómo se pagan la seña, las cuotas y el saldo?
    Reutilizar respuesta de fuente contractual/plan aplicable validada por Claude.
    No repetir cinco días hábiles ni inventar flexibilidad distinta al contrato.
14. ¿Qué pasa con el precio si la fiesta es otro año?
    Distinguir precio actual y proyección/ajuste según contrato y presupuesto.
    Reutilizar tasa/reglas aprobadas, sin congelamiento ni tasa nueva por FAQ.
15. ¿Hasta cuándo vale mi presupuesto y sus promociones?
    Mostrar vigencia y condiciones reales de la propuesta/campaña. En FAQ general,
    explicar dónde consultar esa fecha. No inventar un contador ni quitar el 50% aprobado.
16. ¿Hay menús para niños y adolescentes y opciones por restricciones alimentarias?
    Explicar menús del catálogo y que se deben informar edades/restricciones con
    anticipación. Reutilizar texto contractual sobre adaptaciones, precio y trazas.
    No garantizar cocina exclusiva ni ausencia de gluten/contaminación.
17. ¿Puedo modificar la cantidad de invitados o el menú?
    Reutilizar plazos/límites de la fuente contractual aplicable y explicar que
    se coordinan diferencias y disponibilidad. No crear una regla financiera nueva.
18. ¿Puedo elegir la decoración y personalizar mi fiesta?
    Compartí colores, temática y referencias. Acordamos lo que se va a realizar y
    queda por escrito; la propuesta distingue lo incluido de cualquier adicional.
19. ¿Qué tecnología y entretenimiento puedo contratar?
    Presentar fotocabina, plataforma360, espejo, pantallas, tótems y otras opciones
    disponibles de AK según catálogo/propuesta. No afirmar que todo viene incluido
    ni anunciar como operativas funciones privadas todavía sin entrega aceptada.
20. ¿Cómo participo en la organización y comparto información con mis invitados?
    Explicar portal, invitación y enlaces realmente disponibles para la propuesta,
    preferencias de música e información para el equipo. Conectar a recorridos reales.
21. ¿Van a publicar fotos de mi fiesta?
    Reutilizar consentimiento contractual. Contratar no autoriza publicación
    automática; respetar autorizaciones y protección de menores.
22. ¿Puedo cambiar de fecha o cancelar?
    Reutilizar respuesta contractual aprobada por Claude, no prometer cambios
    gratuitos, devolución total ni penalidades diferentes.

Las respuestas1/2/3 se apoyan en confirmación DIRECTA del dueño en este chat,
27/10/2026: todos los servicios, otros salones y organización para disfrutar como
invitados. Son las tres primeras, no esconderlas en el final ni detrás de Ver más.
No diluirlas en frases genéricas. Preservar el límite: servicios CONTRATADOS, no
todo incluido por defecto; otro salón no implica transporte ilimitado o sin costo.
Prioritarias comerciales sugeridas:1,2,3,5,8,10,12,13resumida. El resto en su contexto.
Las preguntas contractuales son BORRADORES de integración, no nueva política.
Las24contractuales existentes tambien atienden duracion/horasextra/proveedores
externos/sobrantes/cuidado de menores/AGADU. Conservarlas accesibles en el portal;
no volcar todas en la home. Organizacion integral no es servicio de cuidado infantil:
mantener esa aclaracion en su pregunta especifica, no cargar la respuesta comercial3.
Las notas de programación (Reutilizar/No fijar/Enlazar...) NO van como texto público:
Gemini debe resolverlas con la fuente real y Claude validar la redacción final.
Sin cobertura nacional/horarios/garantías inventadas, sin lenguaje interno ni CTA
por respuesta. Un contacto al final basta.

## F1 Claude - AK-CODEX-722-FAQ-SALDO

src/app/portal-cliente/[id]/faq/page.tsx, CLIENT_PRELOADED_FAQS c_faq_5:
5dias habiles antes contradice clausula3f de src/lib/contract-template.ts y
PREGUNTAS_FRECUENTES_DEL_CONTRATO (30dias antes). Corregir respuesta, NO contrato/
calculos/datos para hacerla coincidir con la copia vieja. Para cliente con contrato
particular usar sus condiciones aplicables; no tratar FAQglobal como nueva obligacion.
Evitar duplicar reglas en cinco componentes. Reusar fuente compartida donde proceda.

## F2 Gemini - AK-CODEX-722-FAQ-ENVIO

handleAskQuestion anuncia Consultaenviada, vacia texto y agrega Enviadaalequipo si
addChatMessage devuelve success:false. Errorcontrolado722 lo reproduce; throw si avisa.
No afirmar recibido/enviado sin success confirmado. Rechazo debe mostrar mensaje y
conservar consulta para reintento; conservar idIntento para ACKincierto, sin duplicar.
No resolverlo quitando la consulta ni cambiando acciones de chat ajenas a la pantalla.

## Integracion y aceptacion - PENDIENTE hasta ejecutar

- Una fuente comercial editable coherente para default de settings/componente: publicar
  el cambio sobre datos reales del editor sin reemplazar personalizaciones. Si hay
  migracion, versionada, idempotente, solo plantilla reconocida; no tocar datos reales
  desde QA. Preguntas con idestable; no cambios a contratos por migracion de contenido.
- Home con defaults Y con lista guardada/edicion propia Y datos vacios/lecturafallida.
  No basta encontrar22objetos en un archivo que la home no consume.
- Acordeon teclado/foco/aria y texto largo completos a360/390/1440; reduced-motion.
  Ver todas no pierde pregunta/scroll; no ocultar servicios que se venden.
- FAQJsonLd basado en preguntas/respuestas reales disponibles en pantalla; no otra
  lista SEO divergente ni prometer resultados enriquecidos o mas ventas sin evidencia.
- F1 texto coherente con fuente vigente; cambios financieros soloClaude/dueno.
- F2 casos success:false/error, success:true, excepcion y reintento idempotente:
  no falsoexito ni perder el texto. Mantener recibos722 previos.
- GuardarYA/ESTADO, capturasPC/movil y SHA. Claude compila/valida conjunto/fusiona.
  Codex no implementa ni fusiona. No build/grafo por esta orden documental.

Prueba722 EXISTE y esta ejecutada:5criterios2PASS3FAIL =DOScausas F1/F2, no3bugs.
Las dos pruebas nuevas siguientes son PROPUESTAS/PENDIENTES, no aceptadas.

```comprobar
archivo: src/components/landing/FAQSection.tsx
usa: FAQSection en src/app/page.tsx
usa: PREGUNTAS_FRECUENTES_DEL_CONTRATO en src/app/portal-cliente/[id]/page.tsx
prueba: docs/evidencias/722-faq-inventario-y-envio-sonda.cjs
prueba: src/__tests__/faq-comercial-coherente.test.tsx
prueba: tests/e2e/faq-publica-completa.spec.ts
```
