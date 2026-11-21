# Estado actual — 21 de noviembre de 2026

## Publicado
- **#1458** (21/11): entrega de Gemini de las órdenes 322 a 330 (redes, Wfolio, caras de los invitados, achique de 1443)
  con la revisión de Claude: pruebas con fecha vencida, botones de la galería a tamaño de dedo, menús/LED/decoración sin
  texto apretado en tableta. Se cerraron las PR 1443 y 1451 (quedaron adentro de la 1458).
- En la misma: **órdenes 331 y 332 para Gemini**, y `GEMINI.md` → "TU TRABAJO DE HOY" ya las nombra.

## Esperando a Gemini (una sola propuesta, rama nueva desde la principal)
- **331:** el simulador de siempre primero e IGUAL que hoy; Sofía aparte en su página, con un enlace chico al pie del
  simulador y "Reintentar" si no guarda (hoy el prospecto de Sofía se pierde callado), planificador de 28 a 5 pantallas sin perder partes, una puerta
  para las estaciones.
- **332:** la app de Play Store: "¿Quién sos?" con prospecto directo al simulador, invitado con su celular o el código corto
  de la fiesta (sin QR obligatorio), equipo con Google, "Bajá la app" y publicación en redes. iPhone y PC desde la web
  (el dueño no paga la tienda de Apple).

## Para Claude, cuando llegue la entrega
- Revisar línea por línea `entrarComoInvitado` (quién ve qué: devuelve sólo la credencial del invitado, nunca la lista).
- Copia aparte, tipos + Jest + `ordenes?` primero; después la puerta completa, **sin nada corriendo al lado** (la subida con
  `git push` corre su propio filtro: no subir mientras corre la puerta).

## Ojo
- La puerta falla seguido por carga de la máquina (pruebas distintas cada vez que pasan solas): `npm run otravez` y volver a
  correr la puerta, que repite sólo lo que falló.
- No pude confirmar que la app esté en Play Store (desde acá no se llega a la tienda y Google no la muestra todavía). El
  paquete es `uy.akproducciones.app`.
