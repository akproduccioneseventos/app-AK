# Estado actual — 22 de noviembre de 2026

## Publicado
- Hasta la **#1461** (21/11): órdenes 322 a 330, los arreglos urgentes de las tres auditorías externas (permisos, plata,
  asistente que leía el presupuesto de otro, tope de IA).

## Esperando a Gemini: orden 334, en la misma #1462 (rama `gemini/ordenes-331-332`)
- La 1462 trae las órdenes 331, 332 y 333. Tipos, Jest, acentos y `ordenes?` dan bien; **25 pruebas de pantallas fallan**
  (y fallan igual al repetirlas) por juntar pantallas en solapas: redirecciones encadenadas que pierden la solapa, títulos y
  botones que las pruebas no encuentran, y dos pruebas de la portada de dos botones que ya no existe.
- Claude ya le sumó a la rama: Centro de control (respondía a cualquier "que"), paquete del AK Editor al día, enlaces del
  invitado sin pase, y los controles de `YA-RESUELTO.md` apuntando a los paneles nuevos.
- Revisado a mano y bien: `entrarComoInvitado` (devuelve sólo la credencial del invitado), invitados desde el portal sólo
  con la sesión de esa fiesta, factura "pagada" con saldo pendiente frenada.

## Para Claude, cuando Gemini avise
- Traer la rama a la copia aparte (`git fetch` + `reset --hard`), repetir solas las 25 pruebas de la orden 334 y después la
  puerta completa, **sin nada corriendo al lado**. Con verde: lista, fusión con `expectedHeadSha`, y "Novedades" en
  `QUE-HAY-EN-LA-APP.md`.

## Ojo
- La puerta falla seguido por carga de la máquina: `npm run otravez` antes de creer una falla.
- Play Store: no se pudo confirmar desde acá (paquete `uy.akproducciones.app`).
