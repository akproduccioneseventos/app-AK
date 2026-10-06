# Orden 123: barra y escala del salon

6/10/2026. Codex revisa y aporta evidencia; Claude/Gemini programan segun reparto,
Claude compila y el dueno decide funcionamiento y fusion. UNA tanda junto a 122,
no una PR por caso ni una fusion documental separada.

## Base y contraste

- Main de codigo: `e52c07839563115236652229d73ac5ebf2e4e551`.
- PR1259 actual al contrastar: `feat/orden-117-video-invitados`,
  `7c96e11427c673d72638ac593bcd783915955aa8` (avanzo desde `f836c128`).
- Acciones de barra, MiniQuiosco, plantillas, layout y escena 3D no cambian entre
  esas bases. Las sondas reproducen los casos en AMBOS SHA exactos.
- Antes de programar, volver a contrastar con el HEAD vigente. Si ya fue corregido,
  validar la regresion y NO reimplementar. No trabajar sobre una version vieja.
- Evidencia: `docs/evidencias/72-recorridos-y-casos-nuevos.md`, sondas 72 y manifest.
  32 unitarias de seis suites pasan en la tanda; no prueban estos cuatro casos.

## Claude: acciones de barra y frontera de datos

### BARRA72-1, P2: cambiar trago rechaza un enlace valido

`changeBarDrinkOrder` valida invitado/token y llama `createBarDrinkOrder` pasando
`guestId`, pero SIN `guestAccessToken`. La segunda accion exige ambos; responde
"Tu enlace de invitado no corresponde a esta fiesta" aunque el pedido sea propio,
este en `nuevo` y el trago alternativo exista. No guarda ningun cambio.

Archivo real: `src/app/actions/fiesta/barra-tecnologica.actions.ts:909`.
Consumidor: `submitOrder` en MiniQuiosco (ruta al final).

Conservar la validacion de identidad en el servidor y transmitir correctamente
la autorizacion ya comprobada. NO quitar el control de token para que pase.
Conservar la regla de conseguir el nuevo antes de cancelar el anterior y la
compensacion si falla el cambio. No alterar cobros, stock ni permitir pedidos ajenos.

Regresiones PENDIENTES: token valido y pedido propio cambia una vez; token ajeno
no cambia; trago agotado/fallo de guardado conserva el pedido viejo; si falla
cancelarlo no quedan dos. Verificar despues el boton con backend aislado.

### BARRA72-3, P2: un reintento elude la validacion del invitado

En `createBarDrinkOrder:634-643`, encontrar un `clientRequestId` existente devuelve
el pedido ANTES de validar invitado/token. Sonda: listar pedidos con token errado
es rechazado, pero repetir el ID conocido con ese mismo token devuelve exito,
`guestId` y una nota privada sintetica del pedido existente.

Requiere conocer el ID; NO se demostro enumeracion ni extraccion en produccion.
La accion real se ejecuto con almacenamiento de respaldo simulado, sin red.

Validar acceso/propiedad ANTES de devolver un pedido personal ya existente; el
reintento no debe ser una lectura privada alternativa. Conservar idempotencia
y pedidos legitimos anonimos del totem por nombre. No exigir sesion interna a
todos los invitados ni bloquear la barra. Contrastar ambos caminos: lookup
inicial y pedido encontrado dentro de la operacion de base.

Regresiones PENDIENTES: el mismo invitado con token correcto recupera su pedido
sin descontar dos veces; token errado/vacio, invitado distinto o fiesta distinta
no recibe datos privados ni exito falso. El totem sin guestId sigue pidiendo.

## Gemini: UI de la barra y plantilla de salon

### BARRA72-2, P2: botones ofrecidos cuando las acciones los rechazan

MiniQuiosco muestra Cancelar y Cambiar trago con estado `nuevo` O `preparando`.
`cancelBarDrinkOrder:872` y `changeBarDrinkOrder:893` solo aceptan `nuevo`.
Sonda: pedido propio `preparando` y token valido recibe rechazo en ambos botones.
La condicion de pantalla fue inspeccionada; no se ejecuto su render en navegador.

**DECISION DEL DUENO PENDIENTE:** ya se le pregunto si la gestion del invitado
termina al empezar la preparacion o al quedar listo. El registro antiguo dice
"mientras no este listo", pero el servidor actual lo limita antes de preparar.
No elegir una regla nueva ni ampliar cancelaciones/devolver ingredientes ya
usados sin esa respuesta. Gemini alinea la pantalla con la decision; Claude
valida estado actual, autorizacion y stock en la accion, incluida concurrencia.
Este punto NO autoriza cambiar el funcionamiento por cuenta propia.

### SALON72-1, P2: guardar una plantilla pierde su escala

`saveSalonLayoutTemplate` conserva elementos en pixeles, pero omite
`pixelsPerMeter` del Pick y del objeto guardado. Cargar hace
`setDecoracion(t.layoutData)`; layout y SalonScene usan 40 si falta escala.

Fixture real de accion: plano de 18 x 12 m, escala 80 px/m y mesa de 160 px.
Guardar y reabrir conserva los cuatro elementos, pero pierde escala: la mesa
pasa de 2 m a interpretarse como 4 m. NO se perdieron las mesas/elementos.
Archivo: `src/app/actions/salon-layout-templates.ts:11,36`; consumidores al final.

Persistir y recuperar la escala con el plano, siguiendo el modelo existente.
No cambiar medidas/calibracion elegidas por AK. Mantener compatibilidad con
plantillas viejas; si ya no tienen la escala, NO adivinarla a partir de una foto.
Conservar formas, rotaciones, zonas y asignaciones. No rehacer el arreglo anterior
del arco dibujado como mesa ni la generacion automatica del salon.

Regresiones PENDIENTES: guardar/cargar a 80 y a 40 px/m conserva dimension y
posicion fisica en 2D/3D, fondo y datos de elementos; plantilla antigua sigue
abriendo con politica existente. Recorrido visual con cuatro tipos de elemento.

## Entrega y limites

`node docs/evidencias/72-barra-probe.cjs [SHA]` y
`node docs/evidencias/72-salon-probe.cjs [SHA]` reproducen DEFECTOS. Que esas sondas
pasen NO quiere decir que la app quede aprobada; al corregir, crear regresiones
de aceptacion que fallen en el codigo viejo y pasen en el nuevo.

No tocar las 19 fiestas, mandar WhatsApp, realizar cobros ni pedidos reales al
probar. No reabrir las correcciones 120/116 ni duplicar 122. Mantener visibles
fotocabina, 360 y espejo en venta. No investigar facturacion de GitHub.

Claude conserva SHA, entorno, logs y resultado de compilacion de UNA tanda final.
Codex retesta estos casos y los recorridos afectados, sin repetir pruebas del
mismo codigo. Actualizar YA-RESUELTO con lo realmente corregido, no con promesas.
No marcar 14 areas limpias, publicacion ni hardware por estos resultados.

```comprobar
archivo: src/app/actions/fiesta/barra-tecnologica.actions.ts
usa: changeBarDrinkOrder en src/app/invitacion/[fiestaId]/invitado/[guestId]/MiniQuiosco.tsx
usa: cancelBarDrinkOrder en src/app/invitacion/[fiestaId]/invitado/[guestId]/MiniQuiosco.tsx
archivo: src/app/actions/salon-layout-templates.ts
usa: saveSalonLayoutTemplate en src/app/(app)/fiestas/nueva/invitados/layout/page.tsx
usa: pixelsPerMeter en src/components/salon-3d/SalonScene.tsx
prueba: src/__tests__/barra-72-cambio-y-reintento-autorizado.test.ts (PROPUESTA PENDIENTE: crear y ejecutar)
prueba: src/__tests__/salon-72-plantilla-conserva-escala.test.ts (PROPUESTA PENDIENTE: crear y ejecutar)
prueba: tests/e2e/barra-72-pedido-propio-y-estado.spec.ts (PROPUESTA PENDIENTE; depende de decision del dueno)
```
