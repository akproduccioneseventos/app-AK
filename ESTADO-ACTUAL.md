# Acá quedé

Hoja de traspaso entre chats. **Corta a propósito**: se lee entera al abrir cada sesión.
Lo histórico va a `docs/YA-RESUELTO.md`. **Se pisa, no se acumula.**

---

**Última actualización:** 2 de septiembre de 2026. **Rama: `revision-t6`.**

**`npm run "falta?"` se imprime solo al abrir la sesión** y contesta qué falta, ordenado por lo
que le cuesta plata al negocio. **Ojo: mide la rama en la que estás.** Lo que Gemini ya programó
en `feat/orden-34` figura como faltante hasta que se fusione.

## Lo que se arregló hoy, y los dos primeros eran graves

- **El álbum del recuerdo se abre con el enlace.** Era la única pantalla del evento que pedía
  cuenta: **el invitado no podía abrir el regalo del cliente.**
- **El cliente ya puede bajar las fotos de su fiesta.** Las cuatro tarjetas de descarga del
  portal llevaban al álbum del fotógrafo —otro material— o no mostraban botón. **Lo causé yo** al
  sacar el enlace viejo.
- **El control del rubro dejó de mentir:** catorce funciones que daba por faltantes ya estaban.
- **El recorrido dejó de marcar los tableros de números como pantallas rotas.**

## Lo que está esperando a Gemini

En `feat/orden-34` ya entregó y **verifiqué abriendo los archivos**: el movimiento de las
landings (bien resuelto, en el componente compartido), el reproductor del álbum, las copias de
impresión con su propio ajuste y el tamaño de papel.

**Le queda una sola cosa:** `docs/ordenes/DEVOLUCION-la-musica-del-album.md` — el reproductor
apunta a un archivo que no existe, así que el botón no suena. Se pide que use **la canción de esa
fiesta** y que, si no hay, **el botón no aparezca**.

**Y sin empezar:** órdenes 36 (la grilla de caras), 37 (celular y velocidad) y 38 (el panel
atractivo).

## Lo que hace Claude

- **La orden 31/36 tiene el corazón hecho**: `src/lib/caras/agrupar-caras.ts`, con once pruebas.
  Falta que Gemini traiga los números de las fotos y arme la pantalla.
- Los controles y los matafuegos. **Ya son cinco**, todos probados rompiéndolos a propósito.

## Las dos lecciones del día, y están en `CLAUDE.md`

1. **Regla 6 — no digas la causa antes de medirla.** Si no lo mediste, decí "todavía no sé".
2. **Regla 7 — una comprobación pide el RESULTADO, no el ingrediente.** La pregunta antes de
   escribir una: *¿esto podría dar verde con la función apagada?* **La escribí y la rompí el
   mismo día**: pedí que existiera una variable y llegó vacía.

## Trampas que costaron tiempo y no se repiten

- **La puerta tarda 45 minutos**, y no es el recorrido: son las 39 tandas de navegador **corriendo
  de a una** en una máquina de cuatro núcleos.
- **Antes de creerle a una falla:** `ps aux | grep playwright`. Si hay más de una corrida, el
  resultado no vale. Quedó una huérfana peleando la máquina 42 minutos.
- **La descarga interna `download-recuerdos` pide sesión de administrador.** No se la enchufes a
  ninguna pantalla del cliente.
