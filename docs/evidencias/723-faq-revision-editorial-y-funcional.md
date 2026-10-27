# Preguntas frecuentes - revision de contenido y consumidor

27/10/2026. Fuente mainc0add57f6237f666db97e7e902ef75f6c8d97479.
PR1368-0929 no cambia consumidoresFAQ/contrato. PortalFAQ en Claude publicado
bf0ba6c3 conserva blob727058d03f3b1434604230037773489b5208f5e4.
NO CONTRASTADO CON CAMBIOS PRIVADOS NO PUBLICADOS. Codex no programa ni fusiona.

## Cantidad: por que parecen pocas

722 extrae/evalua declaraciones reales desdeGit: baseLandingSettings tiene6;
componente landing/FAQSection tiene9 como respaldo. Home pasa landingSettings.faqs:
una lista no vacia reemplaza totalmente el respaldo. Cambiar solo las9 del
componente NO amplifica necesariamente las6 de home ni las guardadas en el editor.
No se leyeron landing-settings de produccion: esos conteos son bases de codigo,
no una afirmacion sobre el contenido que haya editado el dueno en la base real.

Portal /portal-cliente/[id]/faq trae5. La pagina principal del portal muestra24
preguntas compartidas de src/data/preguntas-frecuentes-contrato.ts. No faltan24
respuestas contractuales: existen, pero no sustituyen una FAQ comercial accesible.

## Valor comercial (propuesta, no error)

Confirmacion posterior DIRECTA del dueno27/10: AK cuenta con todos los servicios,
trabaja en otros salones y organiza para que los anfitriones disfruten como invitados.
Orden243 actualizada: tres primeras preguntas con respuestas afirmativas y concretas.
No es inferencia del auditor ni promesa de todo incluido en cualquier presupuesto.
Resto de condiciones desde contrato/fuentes vigentes, no copiar reglas de competencia.

Las6base cubren reserva/integral/serviciossueltos/Club/presupuesto/tiposfiesta.
Faltan respuestas de decision: que incluye el total, vigencia/promos, comparar
opciones, disponibilidad vs reserva, pagos/ajuste sin contradicciones, eleccion de
salon, visita, cambios, menus especiales, tecnologia opcional y privacidad de fotos.

Propuesta243:22preguntas comerciales cortas agrupadas,8prioritarias inicialmente,
resto desplegable sin salir de home. No22tarjetas abiertas ni otra pagina/panel.
El portal reutiliza respuestas contractuales aprobadas y conserva preguntas
operativas propias; no copiar todo el contrato al primer contacto comercial.
Mayor cantidad es oportunidad, no defecto ni nuevo bloqueo de publicacion por si sola.

## F1 - P1 DEFECT - AK-CODEX-722-FAQ-SALDO

PortalFAQ c_faq_5 promete saldo hasta5dias habiles antes. Fuente contractual actual
(clausula3f src/lib/contract-template.ts) y pregunta compartida Como pago establecen
30dias antes. El mismo cliente puede leer dos reglas distintas.
722 guarda ambas cadenas y presencia de clausula, no dictamen legal ni auditoria
de un contrato particular firmado. Claude debe alinear texto con contrato/plan
aplicable al cliente, NO cambiar formula/plazos/contratos para adaptarlos alFAQ.
La respuesta actual de inicio tambien simplifica reserva solo con sena: mejorar
claridad junto a firma/confirmacion, sin inventar importes o promociones nuevas.

## F2 - P2 DEFECT - AK-CODEX-722-FAQ-ENVIO

handleAskQuestion en mismo PortalFAQ recibe addChatMessage success:false. Solo
condiciona terminarIntento: igual agrega estado Enviada al equipo, vacia texto y
anuncia Consulta enviada. Error controlado QA se muestra como exito.
722 ejecuta callback AST real con accion/estado locales: rechazo explicito falla
doscriterios (una causa); exito real y exception pasan.5criterios2PASS3FAIL total
incluyendo F1. No tres defectos. No envio real, HTTPNext ni navegador renderizado.

La excepcion conserva camino de error; falta tratar respuesta negativa. No usar
una respuesta perdida como autorizacion para duplicar consulta: preservar idIntento.

## Reutilizar / no cambiar

Editor getLandingSettings/saveLandingSettings, LandingFaqItem, acordeones y FAQJsonLd
existentes. Fuente compartida del contrato ya llega al portal/asistentes. No nuevoCMS,
IA generando respuestas legales, otra sincronizacion de datos ni descuentos nuevos.
No borrar preguntas editadas por el dueno al cambiar defaults. No prometer Montevideo/
todoUruguay por el fallback si la cobertura real no esta confirmada; verificar antes.
No nueva clasificacion de areas limpia por cantidad de preguntas ni afirmacion de
richresultsGoogle/conversionmejorada sin medicion. Propuestas separadas de F1/F2.

Registro: orden243 Gemini contenido/UX/F2; Claude F1 y validacion de condiciones,
compilacion/fusion. Sonda722 conserva fallos. No build, agentes, servicios ni
datos/cuentas/cargos/mensajes reales en esta tanda. Pruebas de futura mejoraPENDIENTES.
