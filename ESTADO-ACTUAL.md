# Acá quedé

Hoja de traspaso entre chats. **Corta a propósito**: se lee entera al abrir cada sesión.
Lo histórico va a `docs/YA-RESUELTO.md`. **Se pisa, no se acumula.**

---

**Última actualización:** 1 de septiembre de 2026.
**Lo primero al abrir una sesión: `npm run ordenes?`.** Contesta en un segundo qué está hecho y
qué no. **Si dice "FALTA", falta, aunque las pruebas den verde.**

## Lo que se fusionó y ya está andando

- **La web de venta ya no se rompe** (16 pantallas, entre ellas el blog y las landings).
- **Seis diseños nuevos de invitación** —ahora son ocho— y la red social con mesa, cronograma y
  ranking.
- **La pantalla gigante**: modo cine, afiche del QR para imprimir, reacciones, "qué viene ahora".
- **Las estaciones**: filtro de belleza y cámara vertical u horizontal.
- **La hoja de cocina** de la noche del evento, y **la agenda que ya no se duplica**.
- **El cliente ya no puede terminar en el disco de todos los clientes** del fotógrafo.

## Los cuatro mecanismos nuevos, y qué error apaga cada uno

- **`npm run ordenes?`** — dice si lo pedido se hizo, si lo que la app dice tener está, **y si lo
  arreglado sigue arreglado**. Antes eso se contestaba yendo a mirar a mano.
- **El bloque del rubro** — cuenta cuántas funciones de las 13 plataformas tenemos, por módulo.
- **`npm run limpiar:corrida`** — descarta lo que escriben solas las pruebas.
- **La regla del matafuego** (en `CLAUDE.md`): un arreglo sin control que lo impida **no está
  terminado**.

## Dónde estamos contra el rubro

Invitación 11/14 · Pantalla gigante 12/17 · Decoración 8/13 · 360 7/13 · Espejo 7/12 ·
Bogue 6/12 · Buzón 6/12 · **Fotocabina 12/26** · **Álbum 3/10, el más flojo.**

## Lo que sigue, en `docs/ordenes/ahora.md`

1. **Las tres de Firebase que no usa nadie** (da 0 de 3): achicar fotos, antibots y App Check.
2. **Los dos fondos de la fotocabina**: el "telón" de la pantalla, el croma que deja mancha
   negra, y el cambio de fondo sin tela.
3. **El álbum** y **la fotocabina**, que son los dos más flojos contra el rubro.

## Lo que costó tiempo hoy, y no se repite

- **La puerta se corrió cinco veces** por no juntar los arreglos. **Se corre una vez, al final.**
- **Dos correcciones propias se perdieron al fusionar.** Revisar las propias después de cada
  fusión, y **fusionar de a una entrega**.
- **Cuatro veces se dio por hecho algo que ya existía.** Antes de programar, `graphify query`.
