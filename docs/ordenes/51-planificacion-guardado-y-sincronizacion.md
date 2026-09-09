# Orden 51: planificacion sin perdidas ni falsos exitos

Fecha: 2026-09-09. Codex revisa; Gemini implementa; Claude Opus compila.
Estado: AUDITORIA PARCIAL, seis fallos reproducidos en sondas aisladas; NO corregidos.
Base de codigo: main `8c5eb6e173e7b7b8dce6a8811cade7cf38411dfe`, confirmado vigente en GitHub.
Entrega en rama `codex/ordenes-45-a-48`, NO en main. No fusionar automaticamente.

## Evidencia y limites

Se reutilizaron AGENTS, Graphify y el historial de YA-RESUELTO. Reparto acotado:
agente economico reviso personal/itinerario; director reviso sus observaciones y
tareas, compras, decoracion, guardado compartido y protecciones de invitados/carga.
No se modificaron fiestas, pagos, empleados ni datos de produccion.

Sonda: `docs/evidencias/51-sondas-planificacion.cjs`.
Ejecutada con Node y TypeScript ya instalado, extrayendo funciones reales por AST,
con persistencia/sesion simuladas y datos inventados. Resultado: seis FAIL, salida 1.
Estos FAIL reproducen defectos, no son una compilacion fallida ni un arreglo.
No se ejecuto build de la app, Firebase real ni E2E autenticado.

```powershell
node docs/evidencias/51-sondas-planificacion.cjs C:/Users/Usuario/Desktop/app/app-AK/node_modules/typescript
```

El recorrido `/fiestas/nueva` llego al ingreso protegido. Se solicito al dueno
iniciar sesion, sin pedir contrasena por chat. Al retomar no habia pestanas abiertas.
No se pudo evaluar visualmente todo el planificador ni certificar cada boton.

## Correcciones para Gemini

### PLAN-01 / P1: una tarea puede parecer guardada aunque falle

`src/app/actions/fiesta/tareas.actions.ts:17` ignora `saveFiesta.success` y devuelve
success:true. Afecta actualizar, agregar y borrar tareas. El consumidor real
`src/app/(app)/fiestas/nueva/tareas/client.tsx:182` confia en esa respuesta.
La sonda inyecta success:false y recibe true.

Propagar el error real sin publicar estado actualizado como persistido. Mantener
el mecanismo existente de aviso/recarga de la pantalla. Verificar agregar, marcar,
editar y borrar con fallo de guardado, reintento y recarga.

### PLAN-02 / P1: compras elimina la tarea que acaba de crear

`src/app/actions/fiesta/catering.actions.ts:38` llama addTareaToFiestaActual;
despues guarda en :56 una copia anterior de la fiesta. La tarea queda fuera.
La sonda observa una tarea en la primera escritura y cero en la ultima.
Consumidor: `src/app/(app)/fiestas/nueva/catering/lista-compras/page.tsx:359`.

Actualizar estado del pedido y tarea de forma consistente e idempotente, con
comprobacion de errores. Repetir el guardado no debe duplicar tareas; registrar
pago debe completar la correspondiente sin perder otras tareas. Conservar la
regla existente de costos auto_prov_, sin volver a sumar al proveedor por separado.

### PLAN-03 / P1: dos modulos pueden pisar los cambios del otro

Tareas y updateMenuAsignado leen la fiesta completa y guardan su propia copia.
Promise.all con ambas funciones preserva el menu pero pierde la tarea nueva.
`saveFiesta` (:161-170 en fiesta.actions.ts) escribe el objeto recibido; preservar
la clave del portal no fusiona cambios recientes. Firestore `merge:true` en
`src/lib/firebase-sync.ts:330-333` tampoco protege campos viejos incluidos en el objeto.
Personal e itinerario usan el mismo patron: ampliar las pruebas a esos consumidores.

Usar actualizaciones acotadas por modulo y operaciones transaccionales/versionadas
para colecciones compartidas. Una lectura adicional por si sola no elimina la carrera.
Reutilizar APIs existentes cuando sea correcto; no imponer bloqueo global ni cambiar
permisos del portal. Probar dos pestañas, latencia, reintentos y orden inverso de llegada.
Esta sonda usa almacenamiento simulado: confirmar luego en emulador Firebase.

### PLAN-04 / P1: borrar una foto del tablero devuelve un exito falso

`decoracion.actions.ts:68` ignora el resultado de updateDecoracion. Igual patron en
addMoodboardItem y toggleLikeMoodboardItem. La sonda de borrar recibe true ante fallo.
La pantalla YA tiene confirmacion/aviso; el defecto esta en la respuesta del servidor,
no se debe eliminar ni reconstruir ese trabajo previo.

Propagar success/error y conservar foto/estado ante fallo. Probar crear, borrar y
reaccionar con recarga. No afirmar que una foto se elimino hasta persistir.

### PLAN-05 / P1: quitar toda la decoracion deja gastos anteriores

`decoracion.actions.ts:23` solo sincroniza gastos si hay elementos. Lista vacia nunca
limpia los costos deco_. En la pagina, :995 y :1104 deshabilitan ademas el boton
manual cuando la lista esta vacia. La sonda verifica que no se llama al sincronizador.

Sincronizar tambien vacio y eliminar SOLO costos derivados deco_, preservando otros
costos y sus datos. No cambiar el presupuesto del cliente por un costo interno.
Resolver el guardado conjunto y los errores de sincronizacion, sin fire-and-forget
silencioso. Conservar el acceso autorizado del cliente a SU tablero, sin exponerle
costos internos ni ampliar sus permisos. Probar equipo y portal por separado.

### PLAN-06 / P1: sincronizar gastos puede decir listo aunque no guardo

`decoracion.actions.ts:134` ignora success:false de updateGestionCostos; la pagina
:462-464 muestra Gastos sincronizados al recibir true. Reproducido en la sonda.
Propagar el fallo; mostrar estado pendiente/reintento. Verificar cantidades y costos
tras recarga, conservando los conceptos que no son decoracion.

## Mejoras de uso, sin agregar mas paneles

Estas son propuestas para validar visualmente y con el dueno, no fallos reproducidos:

- En tareas, compras y decoracion, distinguir pendiente de guardar, guardando,
  guardado y error. Mantener lo escrito y ofrecer reintentar en el mismo lugar.
- En itinerario, Plantilla cargada describe la carga local, no la persistencia.
  Conservar autoguardado existente y hacer visible su estado. No se confirma un P1
  por ese texto solo: falta probar si el aviso de error actual resulta suficiente.
- Usar el centro/progreso ya existente para llevar al pendiente y responsable;
  no crear otro dashboard ni ocultar/eliminar modulos sin autorizacion del dueno.
- Revisar en telefono durante una fiesta: accion principal visible, objetivos tactiles
  comodos, nombres completos y sin desplazamiento horizontal accidental. Animacion
  discreta ligada a cambios de estado; el trabajo interno necesita lectura rapida.

## No repetir ni deshacer

Mantener conteo partySize, cancelados fuera, bebidas en compras, avisos de doble
asignacion, PDF sin notas privadas, guardado antes de Google, rollback de mesas,
permisos por fiesta y transacciones de carga operativa ya registradas.
Se descarto un falso positivo del agente: SI existe limite servidor de dos roles en
validatePersonalAssignments, llamado por saveFiesta. No ordenar implementarlo otra vez.
Validacion de referencias empleado/rol queda pendiente de prueba especifica, no como
fallo confirmado. No duplicar costos de proveedores ni las ordenes contables 49.

## Cierre exigido y cobertura pendiente

Gemini: corregir estos seis casos, sumar tests regresion vinculados a consumidores
y registrar archivos/SHA/evidencia. Claude: compilar el mismo SHA, registrar entorno,
comandos y resultados. Codex: contrastar evidencia, no afirmar que escribir esta orden
inicia otra IA. El dueno conserva aprobacion de cambios de funcionamiento y fusion.

Pendiente navegador autenticado: configuracion, tareas, invitados/RSVP, mesas,
itinerario, personal/recibos, comida/compras, decoracion, documentos/contratos,
servicios, musica/foto/video, carga/retorno, portal/proveedores, resumen y centro del
evento; revisar rutas adicionales del inventario antes de afirmar cobertura completa.
Pruebas con datos sinteticos en entorno autorizado: no usar los 19 presupuestos
manuales para experimentos ni marcarlos verificados por esta auditoria.

Las seis sondas deben pasar tras las correcciones, pero no reemplazan pruebas de
persistencia real, permisos, concurrencia ni recorrido visual. Prueba E2E siguiente
PROPUESTA/PENDIENTE: no existe ni fue ejecutada en esta entrega. El bloque inferior
es inventario para el control automatico, no certificacion de funcionamiento.

```comprobar
archivo: src/app/actions/fiesta/tareas.actions.ts
usa: updateTareasFiestaActual en src/app/(app)/fiestas/nueva/tareas/client.tsx
prueba: tests/e2e/planificacion-persistencia-sincronizacion.spec.ts
```
