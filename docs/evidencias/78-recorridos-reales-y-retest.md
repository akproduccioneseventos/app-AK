# Auditoria 78: recorridos reales y contraste de correcciones

7/10/2026. No es un certificado de cero errores ni una auditoria completa aprobada.
Codex audita y documenta. Orden de correccion: **128**, cuatro fallos vigentes.

## Versiones y entorno

- UI real: main `f790a002426aecb6598efa239fa948db57571752`, build
  `iZL-zBn4z4fNZ_IXFyUCN`. Copia temporal `ak-entorno-aislado-fWfDb3`, puerto 3300.
- Usuario autorizo expresamente compilar/levantar esta copia aislada; excepcion
  puntual al reparto habitual, no permiso para programar la app o publicar.
- Compilacion de Next 15.5.23 termino; siembra: una prueba aprobada. No se reconstruyo
  tras la interrupcion: se reuso el mismo build y sus datos ficticios.
- JSON local solamente, claves de ejemplo para Firebase/Gemini, sin Mercado Pago,
  Meta, Gmail o WhatsApp reales. No se modificaron datos de produccion.
- Main paso a `09051f80ee7722537a06c50c8eb7524b21ac11e8` durante la revision.
  El checkout documental se actualizo por fast-forward, NO el build ya en uso.
- PR 1263 original: `4cd3ba776b2e21d3fe528c4b487c9cecf849e256`; ahora fusionada
  con arreglos posteriores. PR 1265 tambien fusionada. No se ordena rehacerlos.
- Unica tanda abierta al ultimo contraste: PR 1266, HEAD
  `8f4f6895a2150628271c4beef7c9b64f9a0d718f`, solo cambio de ESTADO-ACTUAL.
- Graphify se uso como localizador desde `.audit-current-20261005/graphify-out`;
  el indice es anterior. Simbolos y archivos se verificaron en sus SHAs reales.
  No hay cambios estructurales de la app que requieran reconstruir el grafo.

## Hallazgos por area

### Area: comida / plata · Commit: 09051f80

**SIM78-VIRTUAL, P1, vigente.** `armarMenus` ofrece cuatro platos con IDs
`_virtual_buffet`; el catalogo autorizado al guardar solo lee items crudos.
El recorrido con POLLO ARROLLADO CON MESA BUFET falla dos veces al generar
presupuesto. Cambiando solamente a su plato base guarda correctamente.
Archivos/consumidor y pasos exactos: orden 128 A. Sonda `virtualMenuIds` en
`78-resultados/sondas.json`. Las funciones causales no cambiaron desde f790a002.

**CATERING78, P2, corregido y retesteado en fuente.** El helper rechazaba la pizarra
del buffet, pero su consumidor volvia a poner la direccion cruda o la foto de
otro plato. PR 1265 conecta `fotoDelPlatoParaMostrar` en ambos simuladores.
La misma conversion/useMemo reales ahora dan `null` para buffet sin foto y
conservan `/media/mi-buffet-real.jpg` si la carga el dueno. No se verifico este
arreglo en el build publicado ni se volvio a compilar el aislado.
Las picadas ya estaban correctas; la referencia Canva tiene los nombres cruzados.
No volver a invertirlas. Sigue pendiente del dueno la foto REAL del buffet.

### Area: plata / permisos · Commit: 09051f80

**PDF78-PUBLICO, P1, vigente.** El enlace completo del PDF, sin sesion del equipo,
muestra "Presupuesto no encontrado" aunque existe. `fetchPresupuestoAndSettings`
llama `getCompanyInfo`, funcion protegida, dentro del Promise.all y aborta antes
de asignar el presupuesto. El servidor registra "Sesion no autorizada.".
Sonda de las funciones reales en `78-sonda-enlace-publico.cjs`: token ficticio
correcto, gate llamado una vez, presupuesto no asignado, error capturado.
No bajar permisos para arreglarlo. Orden 128 B.

### Area: portal · Commit: 09051f80

**PORTAL78-PERSONAS, P2, vigente.** Fiesta identica: 61 invitaciones confirmadas
contienen 121 personas; equipo muestra 121, raiz del portal muestra 61 invitados.
19 invitaciones pendientes son 37 personas. No es el submodulo de confirmacion.
Sonda de filtros y `contarPersonas` reales: `78-resultados/contadores.json`.
Capturas y pasos, orden 128 C. Codigo causal sin cambios desde f790a002.

### Area: fiesta / CRM · Commit: 09051f80

**CRM78-CITA, P2, vigente.** La fecha del evento elegida en el simulador se guarda
en `followUpDate` y la tarjeta muestra "Cita: 23/1, 00:00hs" sin haber reservado
entrevista. JSON aislado observado y expresion real reproducida. Orden 128 D.
El ayudante economico busco antecedentes y consumidor del historial; no encontro
esta causa ya registrada. El historial SI esta conectado a un Dialog: no se
reporta un boton roto solo porque una primera observacion no mostrara el modal.

### Area: redes · Commit: 09051f80

**IG78-COUNT, P2, corregido y retesteado en fuente.** PR 1263 original informaba
dos videos por uno guardado si Firestore reintentaba. Se comento en
https://github.com/akproduccioneseventos/app-AK/pull/1263#issuecomment-6038978796.
Claude corrigio y fusiono la reasignacion por intento. Sonda misma entrada,
`syncInstagramPosts` y `mutarDocumento` reales: devuelve UNO por UNO guardado,
conserva la foto concurrente. Snapshot/reintento/API/feed/sesion son simulados.
No certifica conexion Meta, permisos, cron ni datos reales. No repetir RED03.

## Recorridos usados, resultado observable

| Rol / recorrido | Resultado y limite |
|---|---|
| Equipo: login local y centro de fiesta | Ingresa con clave ficticia, carga centro. No prueba Google, correo o recuperacion real. |
| Cliente: login propio sin sesion del equipo | Ingresa, carga progreso, invitados y pagos de fixture. |
| Cliente: cambio de mesa | Lucia de Mesa 1 a Mesa 3; persiste tras recargar; invitado ve Mesa 3. |
| Cliente/invitado frente a centro del equipo | Despues del logout del equipo, centro pide login, incluso con portal cliente abierto. Solo esta ruta comprobada; no todos los endpoints. |
| Invitado: enlace personal | Carga credencial, fecha, mesa y accesos; no muestra controles del equipo. |
| Invitado: barra | Carta de 12 tragos; Daiquiri durazno abre seleccion con nombre. Pedido rechazado por ingrediente sin stock, mensaje visible. No se completo la cola del barman. |
| Invitado: red social | Abre compositor, selecciona archivo, previsualiza, permite publicar. Subida rechaza por Firestore no disponible y conserva texto/foto. Publicacion/moderacion NO aceptadas. |
| Prospecto: cambios de paquete | Intermedio a premium y vuelta; conserva datos/menus y cambia oferta. Upsell aparece. No se cubrieron todas las combinaciones. |
| Prospecto: menu virtual | Falla al guardar, SIM78-VIRTUAL. |
| Prospecto: plato base de control | Genera propuesta y CRM local relacionado; no es prueba de Firebase. |
| Prospecto: resumen | Contador solo al final, total actual $210.349, aprox. $2.103/persona, proyeccion 2027 $241.901. Valores observados, no certificacion de todos los calculos. |
| Prospecto: PDF de control | Descarga real de 9.415 bytes, dos paginas A4 renderizadas e inspeccionadas, numeradas 1/2 y 2/2; servicios/regalos sin cortes ni firmas. Enlace completo presente, pero abrir como cliente falla por PDF78-PUBLICO. |
| Equipo: CRM | Un prospecto y presupuesto esperado, tarjeta abre su documento. Cita inventada reproducida. |
| Cliente: responsive | Anchos solicitados 390 y 1280; DOM real 384/1274, sin desbordamiento horizontal. Capturas inspeccionadas, no aprobacion visual de toda la app. |

## Pruebas y evidencia reutilizable

En `09051f80`, **4 suites / 19 pruebas aprobadas**, raw y log conservados:

- `la-foto-es-del-plato.test.ts`: 10 (9 helpers reales y 1 barrido estatico de fuentes).
- `instagram-videos-cuenta-el-intento-confirmado.test.ts`: 3 con funciones reales y mocks.
- `instagram-sync-videos-concurrentes.test.ts`: 3 con mocks; no conexion Meta.
- `una-transaccion-repetida-no-dice-que-guardo.test.ts`: 3 con base simulada.

Comando exacto:

```powershell
node docs/evidencias/sondas/64-isolated-audit-runner.mjs . jest-mocked --runTestsByPath src/__tests__/la-foto-es-del-plato.test.ts src/__tests__/instagram-videos-cuenta-el-intento-confirmado.test.ts src/__tests__/instagram-sync-videos-concurrentes.test.ts src/__tests__/una-transaccion-repetida-no-dice-que-guardo.test.ts --maxWorkers=1
node docs/evidencias/78-sondas-consumidores.cjs
node docs/evidencias/78-sonda-enlace-publico.cjs
node docs/evidencias/78-sonda-contadores.cjs <copia-aislada>\data\fiestas\e2e_entorno_aislado.json
```

Estas sondas fijan los SHAs de la evidencia. No ejecutarlas sobre otro commit y
afirmar que lo validan. `78-resultados/manifest.json` conserva hashes y limites.
La sonda de variantes reemplaza recalculo de recetas por identidad: prueba IDs,
NO precio, receta, costo o escritura completa. La de contadores extrae expresiones,
NO ejecuta React ni toda la persistencia. Ambas tienen respaldo de UI real aparte.

Historico NO repetido: evidencias 75-77 en `codex/auditoria-75-20261007`, commit
`f70da8c3be3cec086b9288c8ccc17751846828a9`; esos documentos no se dan por main.
Reporte anterior: `docs/evidencias/77-catalogo-presupuestos-y-conexiones.md` en esa rama.
No se suman sus pruebas de otro SHA para inflar este resultado.

## Incidencias del entorno, no fallos publicados

- Arranque Windows original: EPERM creando symlink de directorio. Launcher
  `78-entorno-windows.mjs` usa junction para la copia temporal; no cambia la app.
- Interrupcion de herramientas cerro servidor y perdio sesiones/pestanas. Se
  reanudo build existente con `78-reanudar-entorno.cjs`, guardas de ruta/SHA/env.
- Espera de descarga vencio, pero el archivo SI estaba en Descargas. Se abrio y
  renderizo: no se reporta descarga rota por el tiempo de espera de la herramienta.
- El primer enlace copiado de una nota tenia token truncado. Se descarto esa
  observacion y se uso el enlace COMPLETO extraido de la anotacion PDF, con HMAC
  verificado. El fallo real persistio y tiene la causa independiente documentada.
- Advertencias de build/SDK dummy no equivalen a un problema de la app publicada.
- No se usaron controles rojos de GitHub ni facturacion como senal de aceptacion.

## Propuesta UX, separada de errores

En celular, los dos flotantes del portal ocupan el costado inferior de las tarjetas
de llegadas y pueden tapar parte de sus etiquetas. Proponer agrupacion/posicion
que conserve acceso a ayuda/asistente y no cubra informacion; no ocultar funciones
ni cambiar su funcionamiento sin decision del dueno. No agrega un quinto fallo
funcional ni bloquea el cierre por gustos esteticos.

## Que falta para cerrar, sin inventar porcentajes

1. Corregir A-D en la tanda real; pruebas rojo/verde; Claude compila el mismo SHA.
2. Retest de los cuatro recorridos cambiados en ese build, no repetir modulos intactos.
3. Completar publicacion/moderacion del mural y pedido/cola de barra con fixture de
   proveedores/insumos apto; este entorno no demuestra esos finales.
4. Integraciones reales (Meta, Google, WhatsApp, Mercado Pago), permisos de los
   otros perfiles/endpoints y hardware de entretenimiento siguen sin aceptacion
   final en esta tanda. No crear cobros, mensajes ni concesiones reales sin permiso.
5. La matriz global anterior conserva pendientes; este lote no limpia 14 areas
   ni demuestra cada boton de toda la app. No hay fundamento para un certificado
   de cero errores. Se conserva evidencia por SHA para no reiniciar el trabajo.

No se programo la app, no se fusionaron PRs, no se envio nada a Gemini/Claude como
si existiera una conexion automatica. Las ordenes se publican para que puedan leerlas.
