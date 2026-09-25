# Acá quedé

**25 de septiembre de 2026.** Propuesta 1222 (orden 81 de Gemini + arreglos de Claude): puerta
completa en verde y fusionada.

## Lo que entró

- **De Gemini (orden 81):** fotocabina sin señal con aviso "guardada en este equipo" y subida
  única al volver; comprobación del equipo en el Centro de Fiesta con "probar de nuevo"; doble
  toque en la barra sin pedidos repetidos. Cuatro pruebas de navegador que tocan los botones.
- **Se le sacaron tres cosas a la entrega:** le quitaba la sesión a una acción de insumos, daba
  por subida una foto que no se subió, y subía a 35 s la espera del invitado.
- **Plata (Claude):** una factura ya no se cobra de más con dos servidores a la vez.
- **Barra (Claude):** el invitado pide sin que le pidan sesión del equipo (antes se descontaban
  botellas y el pedido se cortaba); ve la carta de la empresa y no la de fábrica; con la base
  caída el pedido se guarda igual sin pisar la fiesta; las botellas por devolver no se devuelven
  dos veces.
- **Toda la app:** la pantalla ya no se recarga sola cuando vuelve el wifi (cortaba fotocabina y
  barra en plena fiesta).

- **Orden 83 (propuesta 1223):** la reunión que agenda un prospecto en la web ya queda en su
  ficha; una sola copia de cómo se anota. La lista de "qué falta" muestra sólo lo abierto.

## Espera a Gemini

Nada. Todas las órdenes y devoluciones están cerradas.

## Decisión del dueño (25 de septiembre)

**Cuando vuelve la señal, no se avisa nada.** Palabras suyas: *"está bueno que vuelva la señal y
la persona no se dé cuenta"*. No se hace un cartel de "volvió la señal".

## Pendiente, y es mío

Nada.

## Lo que ningún control cubre

Falta **un ensayo real**. La lista para hacerlo en media hora: `docs/ENSAYO-EN-EL-SALON.md`.

## Trampas

- Apagar servidores con `pgrep -x next-server | xargs -r kill`, nunca por texto (error 20).
- Mirar `EADDRINUSE` en el registro antes de creerle a una prueba contra servidor propio.
- `npm run limpiar:corrida` después de cada corrida; no tocar código con la puerta andando.
