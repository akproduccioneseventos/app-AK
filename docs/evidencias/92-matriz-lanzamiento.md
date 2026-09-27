# Matriz de lanzamiento - NO APROBADO TODAVIA

Fecha: 26/09/2026. Codigo main: `63dace0c83f990b8610833a56fb825624837ad6f`.
Alcance de esta tanda: contraste de evidencia previa, controles de lanzamiento en GitHub,
inspeccion publica limitada y limites de pruebas existentes. No es una nueva ejecucion
de todos los recorridos ni una certificacion de cero errores.

## Comprobado en esta tanda

- GitHub main coincide con el SHA anterior. PR 1230/1231 ya integradas.
- GitHub check de App Hosting: `in_progress`, sin conclusion al consultar. No se conoce
  por esta senal que version atiende el dominio. No se lo clasifica como despliegue fallido.
- Ejecucion GitHub Actions `36277269644`: build/tipos/tests, browser smoke y reglas
  aparecen fallidos, con `steps: []`. No son evidencia de pruebas del codigo ejecutadas.
  No se pide tarjeta ni se atribuye una causa economica sin evidencia.
- `curl -I --max-time 25 https://akproducciones.uy`: HTTP 200, 26/09 23:11 UTC.
- Navegador: la portada cargo y su arbol accesible mostro ofertas integrales, blog,
  Club Uruguay, galeria, testimonios y botones de fotocabina/360/espejo visibles sin
  expandir Ver mas. Kebab figura como Catering. Esto comprueba etiquetas y presencia,
  no correspondencia visual de todas las fotos ni funcionamiento de cada boton.
- Consulta DOM de anclas: todos los enlaces con fragmento inspeccionados tenian destino.
- Abrir el simulador por clic no se completo: el control del navegador agoto su plazo
  y la URL permanecio en portada. No se atribuye al codigo sin reproduccion independiente.
- No se modificaron fiestas, presupuestos, cobros, contenido publico ni accesos.
- Sondas anteriores vigentes para el mismo codigo: orden 91, 6 pasan/2 fallan.

## Evidencia historica: reutilizar, no sobreinterpretar

`ESTADO-ACTUAL.md` de main dice puerta completa verde para PR 1224-1231; se conserva como
resultado informado por Claude, no se niega. No se encontro en este clon un reporte
ejecutable asociado al candidato con todos sus resultados. `docs/PRUEBAS-Y-AUDITORIA.md`
registra una corrida de agosto; `docs/COBERTURA-AUDITORIA.md` aporta inventario historico.
Los dos documentos no bastan para certificar la version actual.

`npm run falta?` lee listas y busca archivos/texto. Su "ninguna pantalla rota" procede
de `docs/pantallas-rotas-conocidas.json`, fechado 04/09, con lista vacia; NO acaba de
recorrer todas las pantallas. Sus "completo" de entretenimiento miden presencia de
condiciones de inventario, no resultados funcionales. No reportar esto como auditoria humana.
`scripts/conexiones-estado.mjs` inspecciona configuracion local, no realiza intercambios
con proveedores. No ejecutarlo para concluir que las integraciones productivas funcionan.

## Matriz por area

| Area | Estado que puede sostener Codex | Evidencia necesaria para cerrar |
|---|---|---|
| Acceso y recuperacion | No recorrido autenticado vigente en este entorno | Correo/contrasena, Google, recuperacion recibida y acceso por rol en entorno de prueba |
| Web y venta | Portada y anclas inspeccionadas; interacciones incompletas | Desktop/movil: galeria, blog, Club Uruguay, tecnologia, CTA, imagenes y errores de carga |
| Simuladores y PDF | Existen E2E, sin corrida actual comprobada aqui | Presupuesto completo actual/futuro, paquete/cambio/extras/regalos, total por persona, PDF legible y CRM; no crear leads reales |
| CRM, agenda, secretaria | Historial de auditorias, no aceptacion actual por rol | Guardar/recargar, prospecto con varios presupuestos, tareas, concurrencia, permisos y ejecucion real de herramientas IA |
| Contabilidad/pagos/facturas | Pruebas focalizadas existentes; no conciliacion productiva hecha aqui | Claude: dinero de prueba, saldo, rechazo, doble cobro concurrente, factura sin duplicacion y reporte coincidente |
| Empresa, menus, inventario | Correcciones historicas, no prueba integral vigente localizada | Claude: menus/costos/compras; responsables: stock, personal/proveedores, devoluciones y persistencia |
| Planificacion/decoracion/3D | Tests y revisiones previas existentes | Cliente y equipo: guardar/recargar, tareas, mesas, itinerario, comida, personal/carga; resultado 3D coincide con objetos |
| Portal cliente/invitado/evento | Evidencia historica; no sesiones aisladas actuales | Dos eventos/roles separados, acceso correcto, confirmacion, solicitudes, cambios visibles sin filtracion |
| Muro/red social/galeria | No recorrido conectado actual en esta tanda | Subida, moderacion, pantalla en vivo, retiro, permisos y reconexion sin duplicacion |
| Entretenimiento/barra | Dos defectos reproducidos en Touchpix; resto no certificado por este contraste | Orden 91, recorridos operador/invitado, cola/stock de tragos, descarga/impresion y ensayo fisico |
| Redes e integraciones | Configuracion no equivale a intercambio comprobado | Instagram/YouTube/WhatsApp/Gmail y demas habilitadas: sandbox o accion autorizada, caducidad/reintento/deduplicacion; deshabilitadas se documentan |
| Infraestructura y publicacion | Dominio responde; App Hosting aun sin conclusion observada | Claude: evidencia build/reglas/tests del candidato; despliegue identificado, prueba de humo y recuperacion/rollback documentados |

No completar una fila con "OK" si solo existe un archivo o se vio el encabezado.
Por ejemplo, `internal-smoke.spec.ts` usa sesiones de prueba y verifica carga de seis rutas;
no valida login real ni cada operacion. La prueba de contabilidad 49 declara expresamente
que valida pantalla, y remite a tests de concurrencia para el dinero. El recorrido del
simulador si llega a la descarga, pero hay que aportar su ejecucion sobre el candidato.

## Bloqueos actuales y reparto

1. Gemini: dos correcciones reproducidas de orden 91. Claude revisa y compila.
2. Claude: aportar evidencia existente de la puerta; completar solo faltantes de orden 92.
3. Entorno: no hay sesion de pruebas por roles disponible en este navegador; se solicito
   enlace de entorno aislado, sin solicitar contrasenas. No eludir autenticacion.
4. Equipo AK: ensayo de dispositivos reales. No consta ejecucion firmada del ensayo.

Codex no aprobo publicacion, no compilo ni modifico la app. Rama documental para incorporar
con la siguiente tanda; no crear otra PR de despliegue solo por este informe.
