# Orden 76 — Terminar de despertar las pruebas que estaban dormidas

**Para Gemini. UNA SOLA PROPUESTA con los dos bloques.**

Antes de decir "terminé", leé `docs/ANTES-DE-ENTREGAR.md` sobre lo que tocaste.

**De dónde sale:** el dueño preguntó el 20 de septiembre de 2026 cómo hacer para que Codex deje
de encontrar errores. La respuesta medida es ésta: **casi nada de lo que encuentra está recién
roto; es viejo y estaba tapado por un control dormido.** Ese día aparecieron dos pruebas de
**comida** apagadas desde hacía semanas, las dos por el mismo motivo —la pantalla interna no
veía la fiesta de prueba porque la sesión se ponía a medias—, y eso ya está arreglado.

**Ya hice yo, y NO se rehace:**

- Despertar `tests/e2e/importar-invitados-de-una-planilla.spec.ts` (estaba apagada entera) y
  ponerle la sesión completa con `ponerSesionDelEquipo`.
- Sacar el salteo de `tests/e2e/la-hoja-de-cocina.spec.ts`: **esa prueba ya pasa en verde.**
- El control nuevo `src/__tests__/ninguna-prueba-esta-apagada.test.ts`, que pone en rojo
  cualquier prueba apagada sin decir por qué. **Probado rompiéndolo.**

---

## Bloque 1 — Las dos pruebas de importar invitados llegan a la pantalla y se caen adentro

**Medido el 20 de septiembre de 2026**, con la prueba ya despierta y la sesión completa:

- La pantalla de invitados **abre bien** y muestra su título.
- La primera prueba se cae buscando el invitado **"Valeria Rossi"** después de cargar la
  planilla: nunca aparece.
- La segunda se cae esperando el aviso **"Fila 2: falta el nombre"**, que **sí existe en la
  app**: está en `src/app/(app)/fiestas/nueva/invitados/page.tsx:739`, y lo arma
  `leer-planilla.ts:160`.

**Qué significa:** la app parece estar bien y **los pasos de la prueba quedaron viejos** —se
escribió el 5 de septiembre contra una pantalla que nunca llegó a abrir—. Hay que recorrer el
camino de verdad: abrir el importador
(`[data-testid="btn-abrir-importar-planilla"]`), cargar la planilla, y ver qué muestra la
pantalla en cada paso.

**Pero no lo des por sentado:** si al recorrerlo resulta que la pantalla **no** muestra la
vista previa o **no** avisa cuál fila está mal, entonces el defecto es de la app y se arregla
ahí. **Medilo antes de decidir de qué lado está.**

**Por qué importa:** esta prueba cuida que un invitado marcado **"Niño"** no entre como adulto.
Ese defecto ya pasó una vez y **la comida sale mal** cuando pasa.

```comprobar
archivo: tests/e2e/importar-invitados-de-una-planilla.spec.ts
usa: ponerSesionDelEquipo en tests/e2e/importar-invitados-de-una-planilla.spec.ts
prueba: tests/e2e/importar-invitados-de-una-planilla.spec.ts
```

---

## Bloque 2 — La prueba de los botones que se pisan no puede apagarse sola

En `tests/e2e/sofia-composer.spec.ts:43`, si uno de los dos botones —enviar y WhatsApp— **no
está en pantalla**, la prueba se saltea y da verde.

**Eso está al revés:** que falte un botón en esa pantalla **es un defecto**, no un motivo para
no mirar. Hay que hacer que falle diciendo **cuál de los dos botones no apareció**.

Quedó anotado en el archivo con "apagada a proposito" para que se vea mientras tanto; al
arreglarlo, **sacá esa anotación**.

```comprobar
archivo: tests/e2e/sofia-composer.spec.ts
prueba: tests/e2e/sofia-composer.spec.ts
```

---

## Lo que tiene que comprobar la prueba

Las dos pruebas de importar invitados tienen que **pasar corriendo juntas**, sin saltearse y
sin apagarse. Y la pregunta de siempre antes de dar una línea por buena: *¿esto daría verde con
la función apagada?* Si la respuesta es sí, está mal escrita.
