# Orden 138 - El barman debe ver Cancelar

Para Gemini; sin cambiar estados, permisos, stock o decisiones del dueno.
Codex revisa, Claude compila; misma tanda/PR que137, no fusion separada.
Fuente ejecutada main1b61295ab977fd6f204ffdab0f190edbd0f0ed6b.
Tanda abierta PR1277 documental, HEAD131dbd30 antes de esta entrega; no arreglo
de esta pantalla en la tanda. Entregas locales no subidas NO CONTRASTADAS.
Contrastar si cambia la rama antes de programar.

## BAR87-VISIBLE - P2, Defecto Visual

En `/evento/barra/<id>/barman`, pedido NUEVO: al lado de Preparar hay un boton
que parece vacio. Captura real movil `barman-pedido-nuevo.png` en
`docs/evidencias/87-barra-mobile-artifactos/`.

Fuente/consumidor verificados: `src/app/evento/barra/[fiestaId]/barman/page.tsx`,
renderActions de Nuevos. Tarjeta OrderColumn es bg-white y ese boton tiene
bg-white/10/text-white; XCircle blanco no se distingue. Tampoco tiene
aria-label/title en ese estado (en Preparando SI tiene Cancelar pedido).

Hacer visible el icono existente, contraste legible y nombre accesible/tooltip
Cancelar pedido. Conservar updateStatus(...,cancelado), estados permitidos y
cancelacion de invitado SOLO antes de preparar, segun decision ya aprobada.
No alterar transacciones para corregir CSS ni agregar otro boton/accion duplicada.
No afirmar que cancelacion del BARMAN fue ejecutada87: su icono se inspecciono
visualmente y en fuente; las cancelaciones reales ejecutadas son del invitado.

## BAR87-ESPACIO - P2, Friccion

La misma captura movil muestra Nuevos/Preparando/Listos con grandes zonas
vacias. Cada OrderColumn impone min-h-[58vh] incluso en movil; con las tres
apiladas el barman debe desplazar varias pantallas para mirar estados vacios.
Reducir altura minima SOLO en movil segun contenido, manteniendo titulos,
conteos, pedidos, acciones y orden visibles; desktop puede conservar columnas.
No esconder estados detras de tabs/collapses ni cambiar flujos sin aprobacion.

## Aceptacion Pendiente

- Pedido nuevo, Preparando y Listo en PC/movil: acciones visibles y accesibles.
- Boton se encuentra por nombre Cancelar pedido; rechazo de servidor avisa y
  recupera controles; cancelacion real persiste sin descontar/restaurar dos veces.
- Cola vacia/una/muchos/nombrado largo: no solapamientos, grandes huecos vacios
  ni acciones fuera del contenedor. No probar solo clases CSS.
- Conservar cuatro E2E aprobados87 de invitado->entrega, stock y corte/reintento.
  El nuevo control visual esta pendiente; esos cuatro NO lo acreditan.

```comprobar
archivo: src/app/evento/barra/[fiestaId]/barman/page.tsx
usa: OrderColumn y updateStatus en src/app/evento/barra/[fiestaId]/barman/page.tsx
prueba: docs/evidencias/87-barra-entrega-real.spec.ts (recorridos ejecutados, icono no accionado)
prueba: tests/e2e/barman-cancelar-visible-y-cola-movil.spec.ts (propuesta pendiente de existir/ejecutar)
```
