# Revision terminada PR1371 - NO APTA para fusionar

27/10/2026 local. Codex749-755. RamaGemini:gemini/orden-250-asi-va-a-quedar.
Fuente76855a1d4496b54b323edf83919212f32e2c6109, base/main0abe9199.
PR1370 sigue90cc18b5: NO repetir739-748; sus seis causas siguen en orden252.
NO CONTRASTADO CON CAMBIOS PRIVADOS NO PUBLICADOS. Sin appedit/merge/produccion.

## Metodo y resultado
9archivos del diff revisados. QA separado2511fuentes/config/lock contrastados
antes/despues de cada corrida; 749manifest guarda los blobs del SHA.
Graphify puntual orienta; Serena activo tenia fallo de TypeScript en checkoutdocs:
no reinstalar dependencias de produccion ni atribuirlo a la app.
Heisenberg/gpt-6-luna low reviso SOLO UI/E2E. Principal contrasto hallazgos de
consumidor y conserva dinero/seguridad. Agente cerrado.

- 750: DOS suites originales,12PASS/0FAIL/0omitidas/exit0, fuentes sin modificar.
  Son7casos de entrega nueva+5de decoracion anterior; no homologar E2E4de PR.
- 751:6criterios4PASS2FAIL. GeneradorGemini REAL contra protocolo DOBLE LOCAL;
  acciones reales y fronteras de sesion/persistencia/consumo controladas.
- 752:6criterios2PASS4FAIL. Componente REAL ReactDOM/JSDOM; 3D/dynamic/NextImage/
  API dobles declarados. Se inspeccionan estado/textos/src/href/captura.
- Total de sondas NUEVAS:12criterios6PASS6FAIL = CUATRO causas, no seis bugs.
  R1 se observa en accion y UI; R2 tiene error devuelto y excepcion.
- No build/TS/lint/E2E nativo/SDK/WebGL real/modeloexterno ni cargos reales.
  No se prueba fidelidad visual de la IA ni pixeles de la imagen final.
- E2E de Gemini intercepta la Server Action y devuelve URL /media; comprueba
  representacion de respuesta inventada, NO formato real/generacion/persistencia.
  Eso no es prueba fallida: es un limite de cobertura que oculto R1.
- Cierres anteriores no se reabren por este informe; cambio deSHA no transfierePASS.

## R1/P1 AK-CODEX-751-FOTO-BASE64-NO-ES-URL
decoracion.actions.ts:315-339 usa resultado de generateGeminiImage comoimageUrl.
El helper REAL gemini-image.ts devuelve SOLO bytesbase64 sin prefijo.
Con respuesta de protocolo local valida, accion success:true y guarda el base64,
cuenta una foto.752 comprueba que el componente consume ESA forma:
img.src y descarga.href quedan en iVBOR...; WhatsApp envia ese texto base64 y
contador dice quedan2de3. No hay URL ni archivo compartible.
Es reproduccion del comentario existente de PR, no una causa nueva independiente.
No cambiar a ciegas contrato global del helper: otros consumidores usan bytes.
Resolver en frontera de esta funcion/almacenamiento con MIME/formato explicitos
y comparticion real, sin enviar base64 como enlace.

## R2/P2 AK-CODEX-752-ERROR-DEL-PORTAL-INVISIBLE
Salon3DClienteView.tsx:89-100 descarta res.success:false y solo console.error en catch.
752: tope mensual devuelto por servidor y excepcion local de transporte dejan
pantalla solo con encabezado/boton, sin aviso ni explicacion; dosFAIL misma causa.
Control de carga/captura y tope visual3fotosPASS. No sesion/modeloreal ejecutados.
Confirma comentario previo de PR; no reemitir como descubrimiento separado.
Mostrar error devuelto y aviso util para excepciones, conservar reintento/cupo,
sin afirmar que no se cobro si la respuesta pudo perderse tras generar.

## R3/P2 AK-CODEX-752-GENERA-SIN-CAPTURA-LISTA
Boton depende de WebGL/elementos/fiestaId pero no de readiness de captureRef.
752 simula escena aun cargando: toque llama API con (qa751,undefined).
Control escena lista envia PNGdataURIexactoPASS. Eso prueba la frontera del
componente, NO carrera de GPU real. La accion actual sigue sin captura por diseno
compatible, por lo que este boton puede gastar en una imagen que ignora el plano.
Hallazgo del ayudante confirmado por principal con interaccion ReactDOM.
Esperar captura valida en ESTE flujo nuevo y mostrar error si no se puede capturar.
Conservar parametro opcional del uso legado como exige la orden; no cambiar
silenciosamente politica de todos los generadores por arreglar el boton nuevo.

## R4/P1 AK-CODEX-751-CUPO-SALON-DOS-INSTANCIAS
visualizacionesMutex es del modulo, no reserva distribuida. Dos instancias
de decoracion.actions.ts leen la misma fiesta con DOS fotos; barrera obliga
ambas llamadas de protocolo a coincidir antes de sus respuestas.
Ambas success:true, dos invocaciones al generador y dos registrarConsumoIA;
persisten SOLO3fotos. Ya habia2pagadas, se generan2: CUATRO por un tope de3.
Mocks devuelven copias, no identidades compartidas; no SDK/dosservidores reales.
La causa de limite de instancia ya existia en main; esta es una VARIANTE nueva
no cubierta por el test anterior de un solo modulo. No afirmar nueva regresion
introducida por1371 ni repetir como si nunca hubiera habido mutex.
Claude decide dinero: reservar cupo atomicamente ANTES de llamar al proveedor,
con identidad de intento para no pagar doble al reintentar y liberacion/politica
explicita ante fallo/resultado incierto. No borrar fotos para reiniciar el contador.
No fusionar entregando solo un mutex o contando al final del proceso.

## Avances que se conservan y otras observaciones
- Originales prueban captura primera imagen/prompt, mensualbloqueado, errores
  del modelo sin guardar, conteo por imagen y tope MISMO modulo. PASS poralcance.
- 751control portalajeno y tope mensual:0 llamadas/0consumos; proveedorfallido
  no guarda/0consumos; generacion real con guardadofallido SI cuenta consumo.
  No quitar ese registro por un fallo de persistencia: el proveedor ya trabajo.
- Resumen/gallery del padre puede quedar atrasado respecto al hijo; lectura
  estatica del ayudante, NO otra falla ejecutada ni bloqueo extra adjudicado.
- La UI del equipo conserva boton previo y agrega otro. Contrastar visibilidad
  efectiva/tabs con lo pedido (sin botones duplicados); no imponer redisenio sinQA.
- No YA-RESUELTO/ESTADO entre9archivos. Orden nuevaNOsustituye registro compartido.
- Los numeros de orden250 de Claude-contabilidad y Gemini-foto son distintos temas:
  usar nombre completo/IDs, no cerrar uno por arreglar el otro.
- Actualiza esta tanda con orden253 de devolucion. Claude permisos/dinero/valida/
  compila/SIEMPREfusiona; Gemini programa la UI/foto segun reparto.
- Codex SOLOaudito y archivo pruebas en docs/evidencias, NO reparo app ni fusiono.
  Retest SOLOdelta del proximoSHA; informe termina esta revision, no toda app.

