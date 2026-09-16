# Antes de decir "terminé": las nueve preguntas

**Para las tres IA que programan esta app, y para cualquier entrega.** Es la lista corta de
lo que hay que mirarle al propio trabajo antes de decir que está hecho. No es una auditoría
general —eso está prohibido—: es el repaso de **lo que uno acaba de tocar**.

**Por qué existe, y con números.** Desde que Codex empezó a revisar, encontró **alrededor de
veinte defectos y todos eran ciertos**. Ninguno estaba roto a la vista: todos compilaban,
tenían pruebas en verde y decían que funcionaban. Cada uno dejó una pregunta nueva o un
control automático, y hoy hay **nueve preguntas** y **más de cincuenta controles** puestos.

**La idea de esta lista es que el que programa se haga las nueve preguntas ANTES**, para que
cuando Codex pase, lo que encuentre sea algo **nuevo** y no lo mismo otra vez.

---

## Las nueve preguntas

1. **¿Dejó rastro?** Lo que tiene que pasar solo —una tarea, un aviso, un cierre—, ¿cuándo
   pasó por última vez? "Nunca" es una falla.
2. **¿Alguien lo llama?** Que la función exista no alcanza. Hay que ver **quién la usa**.
3. **¿Necesita algo que no está?** Y si falta, ¿avisa, o **inventa datos** como si fueran
   reales? Lo segundo es lo más grave.
4. **¿Lo que dice la pantalla existe en el código?** Una promesa que nadie cumple es una
   mentira al cliente.
5. **¿El dato LLEGA hasta donde se muestra?** Se guarda en un lado y se lee en otro: hay que
   recorrer el camino entero.
6. **¿La prueba termina el trabajo?** Que la pantalla abra no prueba nada. La prueba mira el
   **resultado**: que imprima, que se mueva, que quede guardado.
7. **¿Qué pasa cuando falla, y qué pasa si son dos a la vez?** La mitad de los defectos de
   esta app viven acá: alguien devuelve el error en vez de tirarlo y nadie lo mira; o dos
   personas hacen lo mismo al mismo tiempo y una operación se pierde.
8. **¿El servidor se lo mandó de verdad?** Lo que el cliente ve tiene que salir del servidor,
   no armarse en el navegador con datos que no llegaron.
9. **¿Puede terminar A MEDIAS y decir que terminó?** Todo lo que recorre una lista o hace
   varios pasos. Tres cosas obligatorias:
   - Lo que salió a medias **no dice que salió**, y **nombra lo que faltó**.
   - Lo que salió a medias **no pisa ni borra lo anterior**.
   - El aviso **se puede leer**: nada de recargar la pantalla arriba del cartel.

---

## Y dos reglas que valen para las pruebas

- **Si sacando la app entera la prueba igual pasa, esa prueba no prueba nada.** Nada de
  escribir la lógica adentro de la prueba y después aprobarla.
- **Un control nuevo se prueba ROMPIÉNDOLO**, no viéndolo pasar en verde.

---

## Dónde está el detalle

- El porqué de cada pregunta: `docs/COMO-AUDITAR.md`.
- Los controles automáticos que ya están puestos y qué error apagó cada uno: la tabla de
  matafuegos en `CLAUDE.md`.
- Lo que ya se arregló —para no volver a reportarlo—: `docs/YA-RESUELTO.md`.
