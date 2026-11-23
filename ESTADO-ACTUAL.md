# Estado actual — 23 de noviembre de 2026

## En verificación: #1462 (rama `gemini/ordenes-331-332`)
- Trae las órdenes 331 (menos pantallas), 332 (entrada de la app de Play Store), 333 (auditoría externa del 21/11) y 334
  (devolución: redirecciones en un salto y pruebas siguiendo a las solapas), más lo de Claude: pregunta 206 con su control
  (`una-redireccion-no-lleva-a-otra-redireccion`), seis redirecciones viejas arregladas, enlaces del invitado con su pase,
  Centro de control, paquete del AK Editor y la galería que no dice "no hay fotos tuyas" cuando la selfie no tiene cara.
- Revisado a mano: `entrarComoInvitado` (sólo la credencial propia), invitados desde el portal sólo con la sesión de esa
  fiesta, factura "pagada" con saldo frenada, y la puerta pública de los PDF con `tab/subtab=pdf` + token (los datos los
  siguen cuidando las acciones del servidor).
- Falta: la puerta completa en verde y fusionar con `expectedHeadSha`; después "Novedades" en `QUE-HAY-EN-LA-APP.md`.
- Mi rama `claude/app-debug-stabilize-m70e6z` ya está adentro de la 1462: no hace falta fusionarla aparte.

## Ojo
- La puerta falla seguido por carga de la máquina (fotocabina con IA, resumen del simulador): `npm run otravez` antes de
  creer una falla. Si la misma falla dos veces seguidas, se para y se avisa.
- Se llena el disco: borrar `.next` y `test-results` de las copias aparte en el scratchpad.
- Play Store: no se pudo confirmar desde acá (paquete `uy.akproducciones.app`).
