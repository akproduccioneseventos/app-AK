# Auditoría — secuencia automática de recontacto a prospectos, PR #1240

Fecha: 2026-09-28
HEAD candidato: `79dae2cd75f1ffc572f28f6ee890174c3912fff8`
Base GitHub: `main` en `b52b1f013d21bd2831b918fb04649636ce24033a`
Destino: PR abierta #1240, rama `feat/orden-95-a-la-par-del-rubro-en-toda-la-app`.
Clasificación: dos requisitos de la orden 95 no están realizados en este HEAD y un riesgo de secuencia está visible en código. Inspección del diff/fuentes remotas, no ejecución dinámica de Codex; no atribuirlo a producción.

## Aprobación de producto que se respeta

La orden 95 declara como excepción elegida por el dueño el recontacto automático de prospectos. El código exige `activo === true` (apagado por defecto) y `marketingConsent === true`, detiene si el prospecto responde y filtra clientes/etapas terminadas. **No reportar el envío automático como defecto ni cambiarlo a envío manual sin nueva decisión del dueño.**

## Hallazgos P2

### 1. Pasos y plantillas no son configurables desde la app

La orden 95 exige editar días y plantillas en la tarjeta de Ajustes. En el HEAD de la PR, `src/components/marketing/recontacto-automatico-card.tsx` tiene el mismo blob SHA que en la base de PR (`77ad7ac9c1a415c4ea9a8d696747a472f65aefa6)): sólo presenta el switch antiguo y describe un único mensaje a los dos días. `src/app/actions/marketing-automation.ts` conserva setters que reciben únicamente el booleano `activo`. El backend admite `pasos?`, pero la interfaz/acción no permite configurarlos. La PR no cambia ninguno de esos dos archivos.

### 2. La plantilla de cada paso se pierde antes del envío

`src/lib/marketing/candidatos-recontacto.ts` selecciona y devuelve `paso` y `plantilla`. Pero `src/lib/marketing/whatsapp-remarketing.ts`, `processUnbookedLeadsRemarketing`, llama `buildRemarketingMessage(lead.name, lead.eventType, lead.createdAt, lead.budgetTotal)`; no pasa ni consume `lead.plantilla`/paso. El mensaje final usa el texto genérico o Gemini. Por eso las plantillas configuradas no controlan lo enviado. La suite nueva `src/__tests__/el-seguimiento-va-en-pasos.test.ts` sustituye todo `processUnbookedLeadsRemarketing` por un mock: prueba los números de paso, no el contenido que recibe Meta.

### 3. Prospectos antiguos pueden recibir pasos acumulados cada seis horas

`src/lib/marketing/candidatos-recontacto.ts`, `evaluarPasoParaLead`, calcula elegibilidad por días desde `createdAt` y elige el primer paso que siga sin marca; no impone espera desde el envío anterior. `src/lib/marketing-automation.ts` vuelve a evaluar cada seis horas (`RECONTACTO_INTERVAL_MS`). Si la secuencia se activa para un prospecto de más de 15 días sin pasos enviados, el código puede elegir paso 1 en una corrida, paso 2 seis horas después y paso 3 seis horas más tarde. No se corrió una simulación dinámica; es una secuencia deducida directamente de los predicados e intervalo del HEAD.

## Pruebas

La suite de pasos cubre apagado, día 2, día 7 y respuesta entrante. No cubre editar configuración desde UI, que el texto final corresponda a cada plantilla, ni activación tardía/reanudación con pasos acumulados. Codex no ejecutó la suite.

## Instrucción para después de cerrar la auditoría

Gemini: completar la tarjeta y Server Action para configurar días/plantillas; propagar y utilizar la plantilla seleccionada al texto final; definir un límite seguro de recuperación para pasos atrasados sin alterar el orden ni los permisos existentes. Añadir pruebas de pantalla/acción, texto entregado y activación tardía (p.ej. prospecto de 20 días) que demuestren que los pasos no salen pegados. Preservar consentimiento explícito, default apagado, exclusiones de cliente/lead perdido, parada al responder y el envío automático autorizado por la orden 95. Claude compila y reporta evidencia. No fusionar desde Codex.

