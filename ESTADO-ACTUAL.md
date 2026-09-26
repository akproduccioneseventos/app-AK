# Aca quedo

**25 de septiembre de 2026. Traspaso documental Codex, sin codigo ni compilacion.**
Base contrastada: main `97638e0efe0795d05219e8630e6550132b37fb53`.

## Lo ya registrado por Claude
PR 1224 y 1225 fusionadas; Claude registro puerta completa verde para esas entregas.
Codex no repitio esa compilacion en esta tanda.
- Orden 81: captura offline, cola aislada, comprobacion de equipo y doble pedido.
- Facturas: proteccion de cobros simultaneos. Barra: acceso del invitado, carta real,
  guardado de respaldo y devoluciones sin duplicar. No reimplementar.
- La app no se recarga sola al volver wifi; orden 83 une reunion comercial y ficha CRM.
- VID03 / orden 87: Claude la cerro; correccion de ZIP y prueba presentes en main.
  No volver a encargarla a Gemini. Validar evidencia si falta, no confundir con despliegue.
- No reintroducir las tres regresiones retiradas por Claude: insumos sin sesion,
  foto declarada subida sin estarlo y aumento de espera del invitado a 35 segundos.

## Tanda abierta al consultar
PR 1227, `feat/orden-88-devolucion-76b`, HEAD `10f4a9d4081a9c0a49f98a012601b725e12e4504`:
orden 88, secretario, fechas y devolucion 76b de importacion movil.
Su descripcion declara pruebas aprobadas; Codex solo comparo diff, no aprobo la PR.
No duplicar estos cambios ni fusionar automaticamente. Actualizar HEAD antes de actuar.

## Nueva orden del dueno
`docs/ordenes/89-experiencia-conectada-sin-duplicar.md`, rama
`codex/orden-89-experiencia-conectada`: doce bloques de experiencia y comprobaciones.
Reutiliza 14/17/20/28/30/46/48/81; ampliada por "todo y mas". No significa implementado.
Gemini interfaz/entretenimiento; Claude datos, permisos, comida/dinero y compilacion.
Una entrega integrada posterior; documentacion no se fusiona sola. El dueno fusiona.

## Limites pendientes

El registro anterior deja sin ensayo real al asistente invitado con IA verdadera.
Hardware y red del salon: `docs/ENSAYO-EN-EL-SALON.md`; no se hicieron aqui.
Reconciliar evidencia por SHA; no certificado de cero errores por inventario o tests textuales.

## Trampas conservadas
- Apagar servidores con `pgrep -x next-server | xargs -r kill`, nunca por texto.
- Mirar `EADDRINUSE` antes de creerle a una prueba contra servidor propio.
- `npm run limpiar:corrida` despues de cada corrida; no tocar codigo con puerta andando.
