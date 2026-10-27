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

## Propuesta comercial:22preguntas cortas, no relleno

Cuatro grupos: Antes de reservar / Espacio y servicios / Organizacion y pagos /
Tecnologia y privacidad. Inicialmente8prioritarias cerradas en acordeon, comando
Ver todas las preguntas muestra las restantes en la misma seccion. Sin muro de
22respuestas abiertas, paginas nuevas innecesarias, carrusel automatico ni otrochat.
Estos borradores deben validarse contra catalogo/configuracion/contrato actuales:

1. Que tipos de eventos organizan?
   Bodas, fiestas de15, cumpleanos, aniversarios y eventos empresariales. La propuesta
   se arma segun celebracion, invitados y servicios elegidos.
2. Que incluye la organizacion integral?
   AK puede coordinar comida, musica, decoracion, personal, foto/video y tecnologia.
   Tu presupuesto detalla lo contratado, lo regalado y lo que no esta incluido.
3. Puedo contratar servicios por separado?
   Si. Se pueden consultar servicios individuales o una produccion integral;
   disponibilidad e inclusiones quedan detalladas en la propuesta.
4. Como pido un presupuesto?
   Usa el simulador o escribi por WhatsApp con fecha, tipo de fiesta e invitados.
   El equipo puede ayudarte a ajustar la propuesta a lo que necesitas.
5. El simulador confirma el precio y reserva mi fecha?
   Genera una propuesta segun los datos y servicios elegidos. La reserva requiere
   disponibilidad confirmada y las condiciones de contratacion, no solo simular.
6. Puedo comparar varias opciones?
   Si. Podes evaluar distintos paquetes/servicios antes de decidir. No eliminar
   presupuestos anteriores ni deduplicar por telefono para responder esta pregunta.
7. Como se que incluye el total?
   Revisa el desglose: servicios, cantidades, regalos, descuentos y condiciones.
   No asumir que salon, adicionales u horasextra estan incluidos si no figuran.
8. Como consulto si mi fecha esta disponible?
   Consulta tu fecha y cantidad de invitados. AK confirma disponibilidad antes de
   formalizar la reserva. No decir que abrir calendario garantiza disponibilidad.
9. Como se reserva la fiesta?
   Con disponibilidad confirmada, firma del contrato y sena acordada. No hardcodear
   $5000/20% ni otro importe si no sale de la oferta aplicable.
10. Cuanto dura el presupuesto y sus promociones?
    Usar vigencia y condiciones REALES de la propuesta/campana. No inventar vencimiento
    ni quitar el50% aprobado del Club. Si la FAQ no tiene contexto, explicar donde
    consultar la fecha de validez, sin prometer una promocion permanente.
11. Con cuanta anticipacion conviene consultar?
    Cuanto antes consultes, mas margen hay para coordinar servicios y salon.
    Si falta poco para la fecha, el equipo puede revisar opciones disponibles.
12. Necesito usar un salon de AK?
    Se coordina el lugar segun el evento y los servicios. Consultar ClubUruguay u
    otra ubicacion; no presentar aAK como propietario ni prometer cobertura ilimitada.
13. Puedo visitar Club Uruguay antes de decidir?
    Coordina una visita/entrevista sin costo conAK. Mostrar contacto real; un clic
    aWhatsApp no es una cita confirmada. Remitir a paginaClub para sus espacios.
14. Puedo elegir estilo y decoracion?
    Comparti referencias, colores y prioridades. La propuesta aclara lo incluido y
    cualquier adicional; no prometer replicar exactamente cualquier imagen ni
    modificaciones ilimitadas sin costo.
15. Como son la sena, las cuotas y el saldo?
    Usar fuente contractual aprobada/plan aplicable, no copiar una regla resumida
    distinta. Referir a presupuesto/contrato; Claude valida texto exacto antes de usarlo.
16. Que pasa con el precio si la fiesta es otro ano?
    Explicar precio actual vs proyeccion/ajuste aplicable segun contrato y propuesta;
    mostrar condiciones vigentes, no congelamiento de precio ni nueva tasa inventada.
17. Puedo cambiar invitados o menu?
    Se solicitan cambios dentro de plazos y limites del contrato, sujetos a
    disponibilidad y diferencia correspondiente. Reutilizar respuesta compartida.
18. Tienen opciones infantiles y contemplan alergias?
    Consultar menus y avisar restricciones con anticipacion. Reutilizar texto aprobado
    sobre adaptaciones y trazas; no garantizar ausencia de gluten/contaminacion.
19. Que tecnologia puedo contratar?
    Mostrar fotocabina,360,espejo,portal,QR,muro y otras opciones disponibles segun
    propuesta. No decir que todas estan incluidas ni promover funciones aun no entregadas.
20. Como organizo musica e informacion para mis invitados?
    El portal y enlaces contratados ayudan a compartir datos y preferencias con el
    equipo. Enlazar recorrido real; no prometer cambios automaticos que no existan.
21. Publican las fotos de mi fiesta?
    Reutilizar consentimiento del contrato. Contratar no autoriza publicacion por
    defecto; proteger menores. No generar testimonios ni permisos ficticios.
22. Que pasa si cambio de fecha o cancelo?
    Se aplican condiciones del contrato/propuesta. Reutilizar texto aprobado porClaude;
    no inventar devolucion total, cambios gratuitos ni nuevas penalidades.

Prioritarias sugeridas:2,3,4,5,8,9,13,15. La redaccion final debe ser corta, natural,
en espanol con tildes, sin lenguaje interno, sin emojis decorativos ni CTA por pregunta.
Un CTA de consulta al final basta. No agregar campos de edad/telefono alFAQ.
Agregar preguntas por tipo de landing solo si aportan una diferencia real.

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
