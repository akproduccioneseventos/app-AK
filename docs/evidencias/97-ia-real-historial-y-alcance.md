# Auditoria97 - IA real, historial y alcance del respaldo

11/10/2026. Rol: organizador; ruta /fiestas/nueva/tareas?fiestaId=fixture.
Ejecucion9a054620718673f00e10b52f0811cc1af729ba4e en TEMP97/Next dev,
Firestore/Storage demo. Contrastado main755f0707; no navegador755 ejecutado.
Resultado: PARCIAL. Dos nuevos defectos P2; orden149 para Gemini/Claude.
NO CONTRASTADO CON TANDA LOCAL NO SUBIDA.

## Aprobado, no volver a encargar

- Chat REAL/API/acciones/Firestore, sin stub de respuesta: solicita tarea,
  IA falla, anuncia respaldo, actionnone, tareas antes/despues iguales.
- Dos fiestas por contexto: un turno usuario y uno asistente en cada chat
  SDK; UI persiste al recargar, B no muestra conversacionA y al volverA noB.
- PC176.609s/movil112.934s,2pass/0fail (97-browser.json). No chat-store roto.
- Texto ingresado legible, botones/enviar visibles en captura movil; no
  superposicion incoherente observada. No auditoria estetica global ni audio
  fisico certificado por esta captura. Titulos largos truncados, no bug nuevo.

## Defectos nuevos

**IA97-INICIO P2:** primer ai.generate falla internamente por NodeSDK no
constructor antes de transporteGoogle, devuelve resumen automaticoHTTP200.
Siguientes llegan al proveedor controlado. No afirmar falla en TODAS.
Alias @opentelemetry/sdk-node:false sigue en main755 (ahora linea312).
Minisonda con callback webpack real confirma: nativoSI/aliasNO/control sin
SOLOesealiasSI.97-empaquetado.json,97-sonda-empaquetado.mjs. No build app,
no app modificada, no conclusion de Hosting. Error aparece en97-start.log.

**IA97-ALCANCE P2:** widget agenteFiesta/peticionfiestaIdA correctos; respaldo
pone dos pendientes de B primero, luegoA yCRM. PC18.624s/movil18.773s,2fail
por contenido equivocado, NOtimeout.97-alcance.json y capturas/JSON
97-artifactos/97-alcance-00-* y01-*; captura movil inspeccionada. buildFallback
usa itemsglobales sin seleccionar byAgent/fiesta. No fuga entre cuentas
probada: ambas fiestas pertenecen al organizador de prueba.

Son dos causas nuevas, NO repeticion de voz146 ni lectorVideo148. Historia
por fiestaSIaislada no equivale a contenido de respuesta contextual correcto.

## Integridad del entorno y limites

Credenciales dummy/entorno filtrado; fetch del servidor bloquea LOCALMENTE
Google generativo antes de salir (97-proveedor-caido.cjs). Primera consulta
falla antes de ese control; las otras5 peticiones generativas alcanzan el
bloqueo. No generacion paga ni modelos reales contestando. Respuestas de
app/cookies/SDK no mockeadas; sesion equipo ficticia firmada por helper.
No afirmar que se escucho voz fisica ni se probo autonomia de agentes.

Paginacion/carga fria Next37.8s+API48.1s+voz10.1s y lecturas posteriores se
incluyen en tiempos; NO medicion de rendimiento productivo. Aborted/ECONNRESET
se conservan en log, sin nuevo defecto solo por log. Primer arnes miniwebpack
carecia de config/dir requeridos por next-pwa: error propio, no app. Se completo
argumento, controlSI/NO confirmado. No instalar herramientas ni paquetes.

## Contraste de la tanda durante la prueba

Otra IA fusiono1286 (b5a24449) y1287 (755f0707); Codex NO fusiono. Nueva
rama QA desde755, no seguir subiendo a cerrada. Fuente causal de los dos
hallazgos sigue presente: flujo/chat-store/diagnostics/genkit sin cambios;
widget delta solo voz146; next.config delta gate tipos/lintFirebase.

144/145 correcciones presentes a1bc1977;146presente0910b888;148presente
73c4dd0f/08aa9319, NO reencargarlas. Claude dice no corrio navegador148:
queda retest de esa entrega, no emitir otro bug del9a como si siguiera ahi.
147 intento RETIRADO89bbb741 por fallo movil: QR sigue abierto, no cerrar.
Health97 HTTP200 declara755f0707 compilada02:35Z; diferencia de etiqueta95
ya no se observa. Es metadata, NO revisionHosting independiente ni prueba
del funcionamiento de Gemini real.97-health.json preserva lectura publica.
Barrido697102a1/a535407b mejora lectura/camaras y explicita limites de
navegador. No dar todos esos consumidores por aceptados por tests de codigo.

Finalmente fixturesFiestas/chat propios retirados, runtime detenido con
PID/fecha/comando/arbol;3300/8085/9195sinlisteners.97-limpieza.json conserva
cinco documentos agregados SOLOdemo (voz-uso/ai-consumo/chats/memory/rate-limit)
sin borrarlos indiscriminadamente. No datos clientes/cobros/envios reales.

Mejoras aparte: ninguna nueva funcionalidad impuesta. Orden149 corrige
promesas existentes. Mantener limites19originales/cuentasURLs/3D/release y
hardware95; no14areaslimpias/0errores ni certificado de publicacion.
