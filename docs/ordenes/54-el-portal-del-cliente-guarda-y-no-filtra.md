# 54 - El portal del cliente: lo que ya está hecho y lo que queda

**9 de septiembre de 2026.** Hallazgo de Codex, **verificado por Claude uno por uno** sobre la
rama de esta tanda.

## Lo que YA está hecho (no rehacer)

**1. El guardado del portal ya no avisa sin haber guardado.** Codex lo reportó sobre la versión
publicada; en la rama de la tanda ya estaba corregido: se mira el resultado antes de contestar, y
el aviso al organizador sale sólo si el cambio quedó guardado. **No lo toques.**

**2. El itinerario interno ya no le llega al cliente ni al invitado.** Es "quién ve qué", así que
lo tomó Claude. Se filtra y se recorta **en el servidor**, en un solo lugar, y lo usan las dos
proyecciones: la del portal del cliente y la del muro de la fiesta —esta última era peor, porque
la abre cualquier invitado con el enlace—.

De cada momento sale sólo la hora, el título y el texto pensado para el cliente. La nota interna
y el responsable **no salen**. Y ya no se usa la nota interna como reemplazo cuando falta el texto
del cliente.

## Lo que queda para vos, y es una sola cosa

**Que el equipo pueda marcar qué momento ve el cliente, sin adivinar.** Hoy la marca existe en los
datos (`visibleParaCliente` en `src/types/fiesta.ts`, línea ~390) y **el servidor la respeta**,
pero en la pantalla del itinerario del equipo no hay una forma clara de ponerla ni de ver cómo
queda.

Qué hacer, en la pantalla del itinerario del equipo:

1. Un interruptor por momento: **"lo ve el cliente" / "sólo el equipo"**.
2. Que se vea de un golpe cuáles ve el cliente y cuáles no, sin abrir cada uno.
3. Un campo aparte para **el texto que va a leer el cliente**, distinto de la nota interna. Hoy
   están mezclados y por eso la nota interna terminaba en el portal.
4. **Los momentos que ya existen y no tienen la marca se siguen viendo.** No los ocultes de golpe:
   las fiestas ya armadas no la tienen y sus clientes se quedarían con la pantalla vacía.

## Qué tiene que comprobar la prueba

Que **al marcar un momento como interno, deja de salir**. No alcanza con que el interruptor
aparezca: hay que tocar el interruptor, guardar, y comprobar que ese momento ya no está en lo que
recibe el cliente.

```comprobar
usa: visibleParaCliente en src/app/(app)/fiestas/nueva/itinerario/page.tsx
prueba: src/__tests__/el-equipo-elige-que-ve-el-cliente.test.ts
```
