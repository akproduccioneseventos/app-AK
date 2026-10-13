# 156 - Recorridos independientes: datos y estados honestos

NO CONTRASTADO CON LA TANDA PRIVADA DE CLAUDE.
Antes de programar, contrastar cada caso con su HEAD exacto; no rehacer lo existente.

## Version y reparto

- Auditoria110, 12/10/2026. PR1288 abierta, rama
  `codex/auditoria-97-ia-contexto-20261011`, HEAD probado
  `2f6007beaf8fe93c5f87dfc632c63f66eeb0428d`.
- Fuente compilada de app: `8fa5b56a2833938541a657dcd15ef88130d24b0e`.
  Desde ahi solo documentos/pruebas. Main consultado:
  `99faf4eb061fa46341cfdde6f81b93b3bfb9c73c`.
- Los archivos de estos hallazgos no difieren de ese main. Clasificacion:
  reproducido en entrega visible; no verificado en Hosting ni en tanda privada.
- Codex solo revisa y documenta esta entrega. Claude lleva persistencia compartida,
  avisos, permisos y datos del tablero que incluyen dinero; Gemini las pantallas
  y plantillas no sensibles. Claude compila. Dueno aprueba cambios y fusion.
- No repetir152-155 mientras se programan. Esta orden no declara arreglada la app.

## Defectos reproducidos

### 1. P2 - Ultimo proveedor borrado reaparece al recargar

PC y Pixel7: crear proveedor ficticio, cancelar una eliminacion (se conserva),
confirmar eliminar el ultimo y recargar. Firestore ya no tiene su documento,
pero la copia JSON lo conserva y la pantalla vuelve a mostrarlo.
`110-providers.json`: `documentExists:false`, `localContainsDeleted:true`,
`presentAfterReload:1` en ambos contextos.

Ruta/simbolos existentes: `src/app/(app)/proveedores/page.tsx`,
`deleteProveedor`/`deleteProveedorInterno` en `src/app/actions/proveedores.ts`,
`deleteDataItem` -> `refreshCollectionFallback` en `src/lib/data-service.ts`.
El refresco no escribe cuando `readFromFirestore` devuelve null para coleccion
vacia. No se comprobo este defecto en cada una de las otras colecciones.

Claude: distinguir lectura exitosa vacia de lectura fallida. Tras borrar el ultimo
elemento, actualizar o invalidar la copia correspondiente; nunca vaciar datos por
una caida del proveedor. Probar ultimo elemento, coleccion no vacia, reintento,
fallo de lectura y concurrencia sin reactivar documentos borrados.

### 2. P2 - Eliminar plantilla base anuncia exito falso

En `/settings/templates/invitaciones`, eliminar "Grazia Base" anuncia
"Plantilla Eliminada", pero vuelve tras recargar. El borrado de una plantilla
propia si persiste. `110-acciones.json` clasifica la observacion base
`FAIL_FALSE_SUCCESS`; el PASS original significa recopilacion, no aceptacion.

`deleteInvitationTemplate` en `src/app/actions/invitacion-digital-templates.ts`
filtra solo las guardadas, aunque verifica el ID contra la mezcla con las bases.
Consumidor: `InvitationTemplatesPage.handleDeleteTemplate` en
`src/app/(app)/settings/templates/invitaciones/page.tsx`.

Gemini: no anunciar borrado si no cambia nada. Consultar al dueno antes de decidir
si las bases deben protegerse o poder ocultarse persistentemente. No borrar el
catalogo base ni imponer una de esas dos politicas mediante pruebas sin permiso.

### 3-6. P2 - Cuatro fallos de red no tienen estado de error util

Sondas PC/movil bloquean SOLO el identificador exacto de cada accion compilada,
no todas las peticiones de autenticacion. `110-centro.json` y ocho capturas.

- 3: `getCommercialFollowups` falla al abrir `/control-tower/comercial` y aparece
  "Todo tranquilo" sin poder leer los seguimientos.
- 4: `getPostEventOpportunities` falla al abrir `/control-tower/post-fiesta` y
  aparece "No hay fiestas recientes" como si hubiera comprobado los datos.
- 5: falla `runSmartAutomations` al pulsar la revision en
  `/control-tower/automatizaciones`; se habilita otra vez sin informar el fallo.
- 6: falla `createCommercialFollowupAlerts` al pulsar "Crear avisos" en
  `/control-tower/comercial`; no se informa el resultado fallido.

Consumidores reales: `CommercialFollowupsPage.load/createAlerts`,
`PostEventPage.load` y `SmartAutomationsPage.run` en esas tres paginas.
Gemini: estados de carga/lectura fallida/resultado parcial separados del vacio
confirmado; aviso persistente, datos previos cuando existan, y reintento util.
No anunciar exito ni calma al fallar, ni crear avisos duplicados por reintentar.

### 7-8. P2 - Lectura del proveedor fallida se convierte en cero fiestas

Firestore emulado contiene cuatro fiestas ficticias. Sonda en `Query.get`
rechaza solamente la coleccion fiestas; no simula el resultado de la accion.
`110-negocios.json`: fallos registrados, ningun aviso visible en PC/movil.

- 7: `/control-tower` ofrece KPI de fiestas proximas cero aunque la lectura fallo.
  No se certifico que cada otro KPI fuera incorrecto en este ejemplo.
- 8: `/control-tower/preparacion` dice "No hay fiestas para revisar".

`getControlTowerData` en `src/app/actions/control-tower.ts` y
`getAllFiestasPreparationScores` en `src/app/actions/preparation-score.ts`
capturan `getAllFiestas` como array vacio; la segunda accion devuelve success true.
Consumidores: `src/app/control-tower/page.tsx` y
`src/app/control-tower/preparacion/page.tsx`.
Claude: propagar resultado incompleto/fallido sin confundir permisos o vacio real.
Gemini: mostrarlo y permitir recuperacion. No recalcular dinero con fuentes ausentes
ni ampliar permisos para que una prueba pase.

### 9. P2 - Avisos silenciados contados como creados

En la segunda revision inteligente, nuevos documentos reales: cero. La pantalla
anuncia uno en PC y dos en movil, y muestra "Aviso creado" para tareas silenciadas.
`110-counts.json` guarda contador anunciado, total antes/despues y cero delta.
Los avisos efectivamente guardados NO se duplicaron en los ejemplos probados.

`notifyOnce` en `src/app/actions/smart-automations.ts` toma `result.success` como
creacion. `createNotification` en `src/app/actions/notifications.ts` devuelve
success true con notification undefined cuando preferencias silencian la categoria.
Consumidor: `SmartAutomationsPage.run` y la etiqueta de resultados en
`src/app/control-tower/automatizaciones/page.tsx`.
Claude: conservar el silencio elegido y distinguir creado, duplicado, omitido y
fallido. Contar solo documentos realmente nuevos. Revisar consumidores contadores
directos del mismo contrato, sin dar por reproducido cada uno hasta probarlo.

## Aceptacion y limites

Evidencia: `docs/evidencias/110-recorridos-independientes.md` y JSON/capturas110.
Tras corregir: registrar SHA, ejecutar regresiones focalizadas PC/movil y una
validacion amplia a cargo de Claude. Primero demostrar que las regresiones fallan
con el comportamiento anterior y pasan con el corregido; luego Codex revalida.
No hardware, credenciales reales, modelos externos, correos o pagos reales en110.
Una orden subida no inicia automaticamente otra IA ni corrige estos defectos.

Pruebas nuevas propuestas: PENDIENTES; no existen ni se ejecutaron con estos nombres.
Las sondas ejecutadas110 son evidencia aparte, no equivalen a esas regresiones.

## Correccion Codex115 - 13/10/2026

Fuente81be9ac00485bc0ece0fb6db07bf7b5f4aa96669, no publicada.
Codex corrige directamente por autorizacion nueva del dueno; no fusiona.
Proveedor/plantilla custom: borrado nativo y recarga PC/Pixel7 PASS; incorporada
se rechaza de forma visible. Se conserva la eliminacion individual transaccional.
Los cuatro consumidores muestran error, reintento y mantienen datos previos;
render ReactDOM de crear avisos/revision con rechazo simulado, no proveedor real.
Lecturas torre/preparacion propagan fallos: acciones con infraestructura simulada
y consumidores compilados con corte exacto de transporte PC/Pixel7. Son pruebas
complementarias, no afirmar una sonda SDK conjunta de cada fuente del tablero.
Contador: accion real y almacen de avisos en memoria; silencio y segunda corrida
duplicada no suman. No se mandan mensajes ni avisos reales.
La sonda tambien encontro bloqueo por undefined del proveedor, corregido con
seis casos propios y borrado nativo tras crear un insumo sin proveedor.
Ver115-correcciones.md,115-native-resultado.json y115-aceptacion.json.
NO CONTRASTADO CON TANDA PRIVADA CLAUDE; no equivale a Hosting ni toda la app.

```comprobar
archivo: src/lib/data-service.ts
usa: deleteDataItem en src/app/actions/proveedores.ts
prueba: src/__tests__/ajustes-costos-respaldo-restauracion.test.ts
prueba: src/__tests__/proveedor-insumos-sin-asociacion.test.ts
prueba: docs/evidencias/115-native-probe.mjs
archivo: src/app/actions/invitacion-digital-templates.ts
usa: deleteInvitationTemplate en src/app/(app)/settings/templates/invitaciones/page.tsx
prueba: src/__tests__/invitacion-digital-templates-delete.test.ts
prueba: docs/evidencias/115-native-probe.mjs
archivo: src/app/actions/control-tower.ts
usa: getControlTowerData en src/app/control-tower/page.tsx
prueba: src/__tests__/control-tower-lecturas-reales.test.ts
prueba: docs/evidencias/115-native-probe.mjs
archivo: src/app/actions/preparation-score.ts
usa: getAllFiestasPreparationScores en src/app/control-tower/preparacion/page.tsx
prueba: src/__tests__/control-tower-lecturas-ui.test.tsx
prueba: docs/evidencias/115-native-probe.mjs
archivo: src/app/actions/smart-automations.ts
usa: runSmartAutomations en src/app/control-tower/automatizaciones/page.tsx
prueba: src/__tests__/smart-automations-notification-count.test.ts
prueba: src/__tests__/control-tower-errores-de-consumidores.test.tsx
archivo: src/app/actions/commercial-intelligence.ts
usa: getCommercialFollowups en src/app/control-tower/comercial/page.tsx
prueba: src/__tests__/control-tower-errores-de-consumidores.test.tsx
prueba: docs/evidencias/115-native-probe.mjs
archivo: src/app/actions/post-event-intelligence.ts
usa: getPostEventOpportunities en src/app/control-tower/post-fiesta/page.tsx
prueba: src/__tests__/control-tower-errores-de-consumidores.test.tsx
prueba: docs/evidencias/115-native-probe.mjs
```
