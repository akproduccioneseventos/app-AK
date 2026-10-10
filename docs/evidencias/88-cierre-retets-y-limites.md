# Auditoria 88: aceptar correcciones, no reiniciar la app

Fuente congelada: main `2aac14e290b20945bd984a0c5e2ffdbe50eb853c`.
Rama documental: `codex/auditoria-88-cierre-20261009`.
10/10/2026. Base de entrega actualizada a0af74652ebdf4c813b9eb443c358d51bc24542d7.
El delta nuevo cambia permisos de borrar/archivar/cancelar fiestas, no estos
consumidores ni dependencias. No afirmar ejecucion completa sobre0af74652.
Al comenzar no habia PR abiertas. 1279 y 1280 incorporaron los arreglos
de 135-138. Trabajo local no subido: NO CONTRASTADO CON LA TANDA.
Codex QA/documentacion; sin cambios de producto ni fusion.

## Resultado ya ejecutado

- **112 pruebas / 12 suites aprobadas**, sin omisiones: raw
  `88-retest-135-138.json`. Incluyen las cinco sondas propias de 86 que antes
  fallaban y los controles nuevos de los responsables.
- IA: dos tareas concurrentes conservadas en almacen local real; voz detenida
  y respuesta anterior anuladas; personal no apaga agentes; Publicidad tiene
  motor; intervalo respetado; accion fallida no emite el tipo de exito.
- Portal: mapper conserva entregas y filtra enlaces/campos, por unidad.
- Video: cierre, reemplazo y excepciones de guardado, con Storage controlado.
- Barman: contraste/nombre y dimension movil, controles de fuente.
- 32 ajustes generales: guardias por permiso, unidades con efectos controlados.
  NO afirmar todos sus consumidores probados por estas unidades.
- Proveedor/audio/autorizacion segun cada sonda: controlados. La concurrencia
  de tarea si utiliza el mutador y archivos reales de una fiesta ficticia.
- Advertencia de `jose` ESM durante la sonda JSON: capturada por el lector,
  que usa fallback local. No prueba Firestore real ni error publicado.
- **28 pruebas / 5 suites financieras adicionales aprobadas**, sin omisiones:
  `88-financiero-delta.json`, guardas/integridad/Poner al dia con efectos
  controlados. NO concilia los19originales ni aplica cambios a su base.

## Entorno y bloqueo descartado como defecto del producto

Primera copia TEMP N9Tcvn, mismo SHA: la compilacion encontro que habia
desaparecido `src/app/api/admin/clean-db/route.ts`. Despues se comprobo que
quedaba SOLO `.next`: tampoco habia `.git`, `tests` ni `node_modules`.
La causa de esa desaparicion no esta identificada. No reportar que main
no compila por este intento ni pedir un archivo nuevo al programador.
Se reconstruyo en TEMP/ak-codex88/ak-entorno-aislado-RCYMug; env limpio,
proyecto demo, emuladores, sin credenciales de produccion.
La excepcion de compilar el aislado fue autorizada expresamente por el dueno.
El segundo build fue detenido tras mas de20minutos y presion de memoria:
NO veredicto propio de build optimizado. Se probo por ruta con Next dev.
El primer E2E tiene12fallos (`88-e2e-primer-intento.json`): esperas, semillas y
expectativas de MI QA; NO12defectos nuevos. Otro intento se interrumpio por el
reinicio automatico al80%delheap de Next (2240MB predeterminados). Runner QA
ajustado a heap4096/Java512; no Firebase publicado/apphosting ni paquetes nuevos.

## Preparacion previa (resultados posteriores abajo)

- Retest de entrega oficial: cliente propio, descarga PDF exacto, recarga y
  clave de otra fiesta. Foto/video publico distinto del panel del equipo.
- Retest de video de vida: PNG->JPEG deja un objeto por recuadro y cierre
  rechaza la pantalla vieja antes de subir.
- Ultimo pago de factura: 250 existentes + 750 por UI, SDK/recarga/otro
  navegador deben mostrar 1000 pagado y cero saldo, con recibo de 750.
- Carga: UI->SDK->recarga->otro operador. Ayudante preparo la sonda, principal
  reviso antes de ejecutar. NO aprobar por haber creado el archivo.
- Contrato: PDF de texto largo y aislamiento de otra fiesta, no solo print().
- Salon: canvas real/pixeles/giro/recarga; foto de respaldo no acepta el 3D.
  Si WebGL no existe, registrar limite del navegador, no inventar aprobado.

## Resultados posteriores de navegador

`88-e2e-retest-estable.json`: **7 aprobados / 3 fallidos, cero omitidos**.
Solo se aceptan los resultados siguientes, no areas enteras:
- NuevaFactura: clic real abre pagina nueva, PC1280x720 y viewport390x844.
- Carga: checkbox->Firestore->recarga->otro operador conserva el marcado.
- Contrato: texto propio/otra fiesta rechazada/estado sin reserva. PDF real6A4,
  inicio/final y45clausulas completos; pdfplumber normalizando espacios y las
  seis paginas renderizadas/inspeccionadas. No firma legal ni PDF del simulador.
- Entrega oficial: servicio visible, clic solicita archivo correcto;200/PDF/bytes
  exactos; reload conserva enlace; otra clave no abre. En Chromium headless el
  PDF puede descargarse y dejar popup about:blank: se verifico solicitud del
  clic y archivo real, no URL del popup. No interceptar ni fingir el archivo.
- Factura:250existentes+750porUI, SDK conserva dospagos,total1000/estadoPaid;
  reload y otro navegador muestran saldo0 y recibo750UYU.
- VID87-CIERRE: pantalla vieja sin sesion equipo recibe rechazo, cero objetos
  Storage. Delta aceptado aqui; NO otra orden137 por el mismo cierre.

Clasificacion de los tres fallos:
- Compartir130: semilla soloJSON no correspondia al runtimeFirestore, y pulsaba
  ANTES de cargar el presupuesto. Corregido adaptador SDK y espera del contenido,
  el retest YA PASO: `88-e2e-ventas-estaciones.json`. No nuevo defecto SHARE80.
- Salon: WebGL SI disponible; reconciler lanza `reading 'current'`, boundary
  muestra FOTO, no canvas. Dependencias instaladas coinciden con lock:
  Next15.5.23/React18.3.1/Fiber8.18.0/reconciler0.27.0. Problema historico de
  dibujo52/75/77/DEVOLUCION42 sigue SIN aceptar, NO orden duplicada.
  Foto/texto NO prueba3D. Consola: `88-errores-consola-retet.json`.
- Video reemplazo: upload llega a Storage/emite exito, pero Next dev rechaza
  imagen localhost9195 no permitida en remotePatterns. Ese error de host/URL
  de emulador NO demuestra fallo publicado. Backend tiene controles aprobados,
  reemplazo FINAL en navegador aun SIN aceptar. No permitir loopback en
  produccion ni fingir una foto para poner verde la prueba.

## Fallo nuevo en consumidor de compras

**COM88-UNIDADES P1, orden139 Claude.** Un adulto, mismo ingrediente/proveedor:
200g+2kg, stock0,coste100UYU/kg. Pantalla lista-compras muestra202.00G/$20,
no2.20kg. Captura/renglon/recetas adjuntos ANTES de exigir resultado esperado.
Raw `88-e2e-compartir-compras-original.json`, caso compras; no timeout.
La clave normaliza unidades, pero consumidor suma cantidades sin convertir.
Test anterior prueba helper/presencia, NO resultado de pantalla. Resumen tiene
mismo patron en fuente, pero suUI no reproducida; verificarla al corregir.
No correccion propia, gastos/pedidos reales ni cambio de regla de compra.

## Ventas y estaciones: resultados finales adicionales

`88-e2e-ventas-estaciones.json`:5aprobados/2fallidos, ceroomitidos.
- SHARE80 aceptado: equipo copia enlace cliente con token; otro navegador sin
  cuenta abre el presupuesto correcto. No WhatsApp real ni envio de mensajes.
- Sin parametro: Cumpleanos seleccionado; pie no muestra precio0 antes de elegir.
- Fotocabina: camara falsa, captura tres fotos y tira real compuesta en pantalla.
  No prueba dispositivo/impresora/Storage/QR de entrega ni todas las estaciones.
- Simulador comun: recorrido completa y descarga PDF real,2A4numeradas, sin
  firmas ni controles internos, enlace personalizado. Render de ambas paginas
  inspeccionado (`88-presupuesto-descargado.pdf`). Vigente121184UYU/persona1515;
  proyeccion2027 a15%=139362. Regalos excluidos y bonificacion coherente.
  Este caso no selecciono plato del menu: NO aprueba paquete con catering,
  fotos del catalogo, todas las variantes, CRMpersistido ni simuladorIA.
- Los2fallos tipoBoda/XV eran MIQA: perseguia portada deshabilitada TRANSITORIA
  que el parametro retiraba al cargar. No forzar clicks ni cambiar la app.
  Adaptador espera el paso1 real: `88-e2e-tipos-corregidos.json`,2aprobados,
  ceroomitidos,24.2s. No duplicar esos dos fallos como errores del simulador.

Total aceptado de esta tanda:140unidades acotadas y14E2Eunicos. No sumar intentos
fallidos/descartados, ni llamarlos14areas limpias. El defectoCOM88 y el3D pendiente
impiden afirmar cierre total. Documento papel puede mejorarse luego: numeracion
y ocultar formulario digital al imprimir; propuesta, no nuevo bloqueo funcional.

## Lista finita de cierre restante

Mantener matriz84 y pruebas80-87, no reabrir resultados sin cambio causal.
Solo resultados internos sin evidencia final: compartir/WhatsApp actuales;
acciones/documentos pendientes del portal; variantes y descarga del simulador
comun/IA; comida aprobada->cantidades/alergias/compras/pago; salida final de
otras estaciones; consumidores automaticos faltantes. Contrastar correcciones
antes de probar: parte de los puntos81 ya tiene arreglo y pruebas de Claude.
Las mejoras nuevas quedan congeladas; no son errores ni ordenes nuevas.
Pedido del dueno: DESPUES del cierre, lista priorizada de mejoras de toda la app
y su IA, separada de defectos y decisiones ya aprobadas. No ampliar alcance ahora.

## Limites externos, separados de errores internos

No se certifican OAuth/correo/publicaciones/cobros con proveedores reales por
mocks. No publicar, enviar mensajes ni cobrar para llenar una casilla.
Los 19 originales tienen lectura bloqueada gRPC7; no inferir ausencias/deudas
ni debilitar permisos. Equipos 360/camara/impresora/barra fisicos requieren
ensayo real. GitHub billing no determina si la app funciona.
No certificado 0errores ni 14 areas enteras limpias.

## Entrega y cierre del entorno

Entorno aislado detenido al completar estas pruebas; no quedan procesos propios
de emuladores, servidor ni agentes de esta tanda. Comprobacion sintactica de
12 sondas/runners y check-acentos de 2610 archivos aprobados. No equivalen a
typecheck, lint ni build completo. Compartir el enlace cliente ya quedo probado
arriba; solo el envio real por WhatsApp permanece fuera de esa aceptacion.
