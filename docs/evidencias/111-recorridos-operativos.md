# Codex111 - incidentes, guias e inventarios, sin cambiar la app

12/10/2026. HEAD probado39704d5c9f64c4914310be2b040c1a9b073c502f;
fuente app8fa5b56a2833938541a657dcd15ef88130d24b0e; main99faf4eb061fa46341cfdde6f81b93b3bfb9c73c.
PR1288 abierta, `codex/auditoria-97-ia-contexto-20261011`. Tanda privada de Claude
desconocida: contrastar su SHA antes de programar. Fuentes afectadas iguales a main.

## Alcance seleccionado sin repetir lo ya aceptado

Registro compartido, Graphify puntual y simbolos preceden la lectura dirigida.
Un ayudante economico inventario huecos de cobertura y fue cerrado. Su referencia
localmain estaba atrasada: Codex verifico el remoto y la fuente antes de decidir.
No se reabren152-156 mientras Claude trabaja, ni cobros/menus/permisos ya cubiertos.
No se usan los checks rojos de facturacion GitHub como fallo de la aplicacion.

Cuatro superficies nuevas/variantes sin evidencia equivalente vigente: Incidentes,
Guias de Armado y catalogos/editores/reportes de Activos Fijos e Insumos. Esto NO
acepta todos sus botones ni completa por si solo una de las14areas.

## Resultado final:28criterios,24PASS y4FAIL

FAIL corresponden a DOS defectos P2, cada uno con dos reproducciones, no cuatro
errores distintos. Matriz `111-resultado.json` guarda fuentes, criterio y hashes.

- Incidentes: fallo de crear conserva borrador y no crea documentos; reintento
  crea uno. Fallo de actualizar conserva nota; reintento agrega exactamente una.
  PC/celular. Nueva Incidencia tras guardar conserva titulo/descripcion antiguos:
  pendiente157; no se envio otro caso duplicado para probarlo.
- Guias: fiestaId prellenado, cancelar no escribe; evento inexistente da error.
  Cortar solo applyPlaybookToFiesta deja destino/boton recuperables y no modifica
  tareas, documentos ni compras. PC/celular. Aplicacion saludable y concurrencia
  historicas NO se repitieron ni se atribuyen a este lote.
- Activos e insumos: guardar, releer desde editor, editar ante red fallida y
  reintentar conservan datos; stock de insumo2.5Kg persiste. Reporte recibe el
  stock actual y la pulsacion pide imprimir. PC/celular, costo ficticio cero.
  window.print se observa con espia: NO impresora real ni PDF descargado certificado.
- Titulos: comparacion corta/larga por catalogo. PC sin desborde; Pixel7 largo
  desborda132/191px y falla trial de alcanzabilidad de Guardar. Familia pendiente158.
  Comparacion no envia Guardar; fixture adicional por UI invalida cache de insumos.

## Ambiente y pruebas negativas reales

SDK FirebaseAdmin real frente al emulador Firestore demo-ak-producciones8085;
Next compilado3301. JSON3300 se reutilizo solo para descubrimiento. Datos propios
ficticios, sesiones de prueba, sin .env/credenciales reales; HTTPS externa bloqueada.
Se intercepta SOLO cada Next-Action compilada de guardar/aplicar/actualizar, no todo
POST ni autenticacion. Persistencia se comprueba con lecturas del SDK emulado.
Guardar exitoso se comprueba por navegacion, reapertura y documento, no un toast solo.

Guardas restauran bytes JSON y eliminan solo documentos de la instancia privada
inicialmente vacia. Cada sonda SDK exige DB propia vacia; no restaura ni borra nube.
Los procesos propios se detienen y puertos se verifican en111-entorno-detenido.json.
Los archivos ajenos notifications/notification-preferences conservan sus hashes.

## Fallos de sonda conservados, no convertidos en bugs falsos

- Descubrimiento inicial buscaba Nuevo incidente; el boton real es Nueva Incidencia.
- Ronda inventarios inicial: timeout5seg, estado decimal leido demasiado pronto
  y prerequisitos posteriores sin aceptar. Ronda segunda usa espera adecuada.
- La validez HTML transitoria no se tomo como decimal rechazado: se espero
  navegacion y lectura SDK;2.5Kg SI quedo guardado.
- Interaccion movil no aceptada con nombres artificiales largos no se descarto
  como maquina lenta: controles cortos pasan; sonda de titulos confirma desborde.
  No force-click, cambios CSS de app ni aflojar aceptacion para pasar.
- Primer ensayo de titulos leyo cache de insumos anterior al sembrado SDK y busco
  el primerh1(header), no el titulo del editor. Se conservan raw/log. La version
  final siembra ambos casos antes, invalida mediante guardar un fixture por UI
  y mide el h1 Editando. No se reporta un item inexistente como fallo productivo.

Concilia: diez criterios operaciones; siete PC de segunda ronda inventarios;
siete movil de ronda nombres habituales; cuatro titulos finales. Otras rondas,
descubrimiento y reintentos NO aumentan conteo ni valen como aceptaciones finales.

## Limites y reparto

Codex revisa/docs; Gemini arregla estas pantallas; Claude compila. Propietario
aprueba cambios de funcionamiento y fusion.157/158 son instrucciones PENDIENTES,
no correcciones hechas, no prueba de que las otras IA las leyeron.
Sin cambios productivos, dependencias, rebuild Graphify ni build/Jest nuevos:
app igual a8fa, se reutiliza106 en ese alcance solamente.

Para reproducir se adjunta111-firestore-config.json, equivalente estructural a
firebase.105.json de la ejecucion registrada. El launcher genera una copia propia
en raiz, conserva paths de reglas y la elimina al salir si nadie la cambio.
Esta adaptacion documental del launcher NO agrega una nueva corrida aceptada.

Sin mantenimiento con gasto, ajuste global de costos, fotografia/Storage real,
impresora, hardware, OAuth/Gmail/Meta/WhatsApp/pagos/modelos reales,19originales,
ni Hosting del mismo SHA. Aceptacion completa aun incompleta; no0errores garantizados.
