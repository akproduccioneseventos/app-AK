# 65 - Retest de la 1254 y continuacion comprobada

Fecha de negocio: 2 de octubre de 2026 (Montevideo); corridas UTC del 3/10.
Codex solo audito y escribio evidencia/ordenes. No cambio codigo de app, no compilo,
no hizo cobros/envios ni fusiono PR. Un agente economico hizo solo un inventario
documental acotado; los hallazgos financieros fueron revisados por el principal.

## Version y resultado

- Area: **plata**. Commit: `39da52a33fcdda83f7575d6751a9bc101b3484cf`.
- Hallazgos: **COB06-09**, detallados en la orden 112, no los cinco anteriores
  reportados otra vez. El retest es acotado a la 1254, no aprobacion de toda plata.
- Main actualizado por fetch y tanda 1251 consultada:
  `feat/super-asistente-unificado` / `ea2cb46d732b815492ee5c176cd9ea6e61e867de`.
  Los archivos afectados de dinero no tienen la correccion de main en esa tanda.
- Publicado: `39da52a33fcdda83f7575d6751a9bc101b3484cf`, compilado
  `2026-10-03T00:32:58.521Z`. Health comprobado, NO prueba de integraciones reales.

## Lo aprobado, sin repetirlo

`65-jest-cobros.json`: **9 suites, 42 pruebas, todas pasan**. Resultado original
de Jest con fechas, casos y assertions. Las suites de este checkout nuevo se
ejecutaron con sus mocks, variables del sistema permitidas, sin `.env` ni claves
reales. Intento inicial no llego a Jest por ruta relativa duplicada del ejecutor;
se corrigio SOLO la invocacion a ruta absoluta. No fue fallo de app.

Suites: cuotas simultaneas; cobros simultaneos; consistencia del flujo financiero;
contabilidad no miente; integridad de pagos/borrado de facturas; idempotencia y
tolerancia de la 1254; plan de pagos; limite entre servidores. No se repitio el
build ni las 581 suites de la evidencia 64 por cambios ajenos al alcance.

`65-sonda-cobros-39da52a.cjs`: usa AST TypeScript para extraer funciones originales,
no vuelve a escribir su logica. IO sintetica, sin Firebase/red/mensajes/cargos.
Verifica identidad de fuente contra 39da52a y guarda hashes SHA256. Son **9 casos:
5 esperados pasan y 4 defectos quedan reproducidos**. Exit 0 significa sonda
ejecutada segun sus assertions, no "la app esta limpia".

- COB01: dos intentos con la misma operacion fallida dejan 1 pago de 100, no 2;
  al recuperarse el espejo, concilia ese mismo pago y marca su estado.
- COB02: las pruebas de dos cuotas distintas y dos intentos de la misma cuota
  pasan; codigo usa la mutacion actual de la fiesta y notifica despues de guardar.
  No se comprobo contencion de un Firestore real en esta maquina.
- COB03: el handler original muestra el error devuelto y conserva la operacion;
  no se llama a esto una prueba interactiva de navegador.
- COB04: total 1000 ya cubierto y tres pagos de 1: [true,false,false], total 1001.
  Respeta la tolerancia comercial existente, no la regala de nuevo.
- COB05 almacenamiento: USD 12,50 se guarda 12.5; entrada invalida se rechaza.
  La politica sigue UYU; no se introdujeron monedas.

## Casos nuevos de la misma entrega

| ID | Prioridad | Resultado observable en la sonda | Limite |
|---|---|---|---|
| COB07 | P1 | Reintento en dos invocaciones independientes: segundo recibe success:true, primero falla, pago sigue sin pasar al presupuesto. | Persistencia compartida simulada; no dos servidores de Firebase reales. |
| COB08 | P1 | Handler intenta 100, espejo falla; edita a 200 y reenvia mismo ID: toast Pago Registrado pero registro de 100. | Handler y action originales ejecutados en VM, no browser real. |
| COB06 | P2 | Recibo de 12.5 produce DIEZ Y undefined y rotulo USD. | Campo real llama al helper probado; no impreso fisico. |
| COB09 | P2 | Mensaje promete conciliacion sola; parte de mañana solo alerta, consumidor real es accion manual en Facturas. | Comprobacion de fuente y consumidores, no ejecucion de cron real. |

Reproduccion desde checkout con fuente identica: `node docs/evidencias/65-sonda-cobros-39da52a.cjs .`.
Archivo y simbolo consumidor actuales verificados; orden 112 para Claude. Las
regresiones nuevas que deben exigirse tras corregir estan PENDIENTES.

## Continuacion: que sigue abierto y que se comprobo ahora

Se reutilizo `integral-source-probes.cjs` anterior, verificando blobs actuales,
no se rehizo la investigacion. `65-resultados-cierre-y-permisos.json`:

- AUD01: 416 rutas, 232 fuera del mapa; si las areas estuvieran limpias, un cambio
  omitido en portal-cliente no invalidaria el cierre. Hoy limpias reales: 0.
  No son 232 errores de negocio ni una aprobacion historica inventada.
- AUD02: CLI Windows termina 0 y escribe 0 caracteres. Fuente sigue sin cambio.
- PER01: getter completo devuelve contacto/token SINTETICOS donde el getter
  normal recorta. **No confirmado por HTTP**; no afirmar filtracion real.
  Cliente del muro, recepcion y cron son consumidores existentes del getter.

Estos son pendientes de la evidencia 64 ya entregada; no nuevos encargos duplicados.
La orden 113 los referencia y exige un entorno real disponible para continuar.

### Celular publicado, solo lectura

`65-publico-celular.json`: viewport 390x844, seis rutas, contextos anonimos nuevos.
Inicio, blog (redirige correctamente a public/blog), Club Uruguay, inicio del
simulador y entrada del portal renderizan sin desbordamiento horizontal, imagen
rota detectada ni pageerror. Se inspeccionaron capturas del inicio y blog:
texto legible, CTA visible, imagen del articulo separada del texto. Las demas
capturas se guardaron localmente; no aprobacion estetica de todas las secciones.

`/tecnologia` renderiza LOGIN, no el catalogo solicitado. El basic-render-pass
del JSON crudo corresponde a esa pantalla final, NO a la ruta de tecnologia.
Ya esta en lo pendiente de la orden 106/ESTADO-ACTUAL; no inventar una segunda orden.
No se completaron formularios, no se generaron leads ni se escribieron presupuestos
de produccion. Estas aperturas no se suman a los 46 tests de escritorio previos.

### Bloqueo de continuacion observado otra vez

Falta `.next/BUILD_ID` en el checkout actual; 127.0.0.1:3300 rechaza conexion.
Esto bloquea los recorridos INTERNOS completos en el entorno preparado. No es
caida del publicado y Codex no modifica memoria/costos del servidor. Claude ya
compilo, pero su artefacto/servidor no esta disponible para este host. Orden 113:
entregarlo con SHA y backend aislado, reutilizando la compilacion aprobada.

No se certifican las 14 areas. Del informe 64 permanecen 434/480 casos de
escritorio no ejecutados, matriz movil completa y recorrido separado de rutas;
las pruebas financieras nuevas no son 434 casos ni cambian ese denominador.
Fotocabina reconexion/rechazo y stock quedan inconclusos hasta entorno estable,
no como tres bugs de producto supuestos. Falta evidencia real autorizada de
Gmail/recuperacion, WhatsApp, Instagram, Gemini, Mercado Pago y equipos fisicos.
No se comprobo la carga actual de las 19 fiestas reales. Conteos globales no
reemplazan pruebas por rol, persistencia y sincronizacion.

## Registro sin perder la base anterior

Evidencia 64 sigue en `codex/auditoria-integral-20261002` / commit `9393f43`.
Su orden 111 NO debe sobrescribir `111-devolucion-de-la-1251.md` de Claude,
que entro en main posteriormente. Por eso las instrucciones nuevas son 112 y 113.
No se creo PR documental ni se fusiono nada. Entrega remota se informa solo
despues de push y verificar los blobs de GitHub.
