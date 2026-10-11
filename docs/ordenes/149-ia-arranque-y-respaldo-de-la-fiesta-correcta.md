# Orden149 - IA: arranque real y respaldo del contexto correcto

NO CONTRASTADO CON LA TANDA DE PROGRAMACION LOCAL NO SUBIDA.

Gemini programa; Claude compila y revisa permisos/costos si se tocan. Codex
reproduce y contrasta. No cambiar reglas comerciales ni iniciar agentes
autonomos/envios/cobros por esta orden. Integrar ambos puntos en UNA tanda.

Ejecutado9a054620718673f00e10b52f0811cc1af729ba4e. Contrastado con main
755f0707: las causas permanecen. next.config cambio solo gate de tipos/lint
Firebase; widget cambio voz146, NO mensaje/filtro de historial. Flujo Genkit/
buildFallback/diagnosticos/almacen chat sin delta. No nueva auditoria de146.
PR1286 ya fusionada por otra IA; no subir a esa rama cerrada. Antes de
programar, contrastar la entrega local real y no duplicar correcciones.

## IA97-INICIO P2 - Primera generacion falla antes de llamar a Gemini

Primera consulta real tras arrancar Next dev: NodeSDK is not a constructor,
desde ai.generate/generateWithGeminiFallback. Responde resumen automatico
HTTP200: NO respuesta del modelo. Las siguientes SI alcanzan el proveedor
(bloqueado localmente por QA): no afirmar que TODAS las consultas fallen.

next.config.js:312 anula @opentelemetry/sdk-node con alias:false. Genkit1.20
necesita new NodeSDK para inicializar telemetria. No es clave invalida ni
modelo retirado: el fallo ocurre ANTES del transporte a Google.

Control97-sonda-empaquetado.mjs aplica callback webpack REAL del proyecto a
mini entrada, no recompila app: modulo nativo constructorSI; alias actual
constructorundefined/error; quitando SOLO ese alias en la configuracion del
CONTROL, constructorSI. Datos97-empaquetado.json. No app parcheada.

Corregir compatibilidad de empaquetado del motor, sin reemplazar el SDK por
un objeto vacio que finja exito. Mantener politica de telemetria/costos y
validar memoria/build con Claude. Primera generacion de proceso NUEVO debe
alcanzar proveedor controlado o entregar respuesta real autorizada, sin
error interno de constructor. No certificar por segundo intento caliente.

Limite: comprobado Next dev9a y minisonda webpack5.106.2. NO build final
Hosting755 ni primera consulta real con una cuenta de pago. Claude valida
paquete de produccion; Codex no declara incidencia publicada demostrada.
Prueba permanente propuesta PENDIENTE:tests/e2e/ia-primera-consulta.spec.ts.

## IA97-ALCANCE P2 - Agente de A prioriza pendientes de B en respaldo

Ruta real /fiestas/nueva/tareas?fiestaId=A. Widget Fiesta actual. Peticion
fiestaId=A/agentType=fiesta comprobadas. Al preguntar que falta en ESTA
fiesta, respuesta empieza con dos pendientes de B (cierre/testimonio),
luego A y CRM general. Reproducido PC18.624s/movil18.773s sin mocks de
respuestas de app. SDK guarda la respuesta equivocada en el chat de A.

Causa directa actual: buildFallback en src/ai/flows/multiagent-flow.ts:461
toma context.briefing.items.slice(0,6), NO seleccion segun agente/fiesta.
diagnostics ya distingue byAgent y fiestaId para el prompt normal; respaldo
debe respetar el mismo alcance. No problema de aislamiento de historial:
el historial A/B y su persistencia YA pasan97. No reescribir chat-store.

Filtrar ANTES de limitar: especialista Fiesta solo pendientes del evento
activo; los generales conservan su alcance completo. Si el evento no se
pudo leer, avisarlo, no completar con otra fiesta. No ocultar al general ni
cambiar permisos. Mantener aviso honesto de resumen automatico y no fingir
tarea creada cuando no se ejecuta nada.

Aceptacion: A/B con nombres/riesgos distintos; respaldo de A no incluyeB,
general si puede revisarlas. SDK/UI coinciden; recarga conserva alcance;
sin tareas/envios/cobros por fallo del modelo. Cubrir tambien otros agentes
por area, sin afirmar fallo en todos antes de probarlos.
Prueba permanente propuesta PENDIENTE:tests/e2e/ia-respaldo-alcance.spec.ts.
Sonda documental EJECUTADA:97-ia-respaldo-historial.spec.ts. Dos controles
positivos y dos negativos PC/movil; UNA causa de alcance, no dos bugs.

```comprobar
archivo: next.config.js
archivo: src/ai/flows/multiagent-flow.ts
usa: generateWithGeminiFallback en src/ai/flows/multiagent-flow.ts
usa: buildFallback en src/ai/flows/multiagent-flow.ts
usa: seleccionarItemsDeRespaldo en src/ai/flows/multiagent-flow.ts
prueba: src/__tests__/la-ia-arranca-sin-telemetria.test.ts
prueba: src/__tests__/el-respaldo-de-la-ia-respeta-la-fiesta.test.ts
```
