# Orden 15 — Las pruebas que terminan el trabajo

**Para Gemini. Escrita el 27 de agosto de 2026.**

## Por qué existe esta orden

**El dueño lo preguntó dos veces**, y la segunda fue más clara:

> *"¿Hay alguna manera de revisar toda la app con un mecanismo de uso, no sé el término,
> para que no sigan fallando las auditorías? La fotocabina, todo el entretenimiento estaba
> mal después de la auditoría."*

**El término es prueba de punta a punta, y ya existen: 22 archivos en `tests/e2e/`.** El
problema no es que falten. Es **qué comprueban**.

### Los números, medidos el 27 de agosto

| Archivo | Mira un resultado | Sólo comprueba que abrió |
|---|---|---|
| `simulator-budget-journey` | **0** | 11 |
| `prospecto-simulador` | **0** | 5 |
| `muro-subir-foto` | **0** | 3 |
| `la-web-publica-se-ve` | **0** | 4 |
| `entertainment-stations` | 5 | **20** |
| `public-smoke` | 6 | 17 |
| `viaje-invitado` | 7 | 11 |

**El caso que lo resume todo:** `simulator-budget-journey` recorre los cinco pasos, llega a
*"Tu presupuesto está listo"* y se baja el PDF. **Nunca mira el monto.** Si el presupuesto
dijera $1 o $999.999.999, la prueba pasa igual. Es el camino que le da de comer al negocio.

Por eso la fotocabina, el entretenimiento y la web pasaron auditorías estando mal: **todo
confirma que la pantalla ABRE; nada confirma que el resultado esté BIEN.**

## Lo que hay que hacer: UNA prueba por trabajo, que mire el resultado

**No se tocan las pruebas que ya existen.** Se agrega **una** por cada cosa para la que sirve
la app. **Esta lista es finita y cuando esté completa, se terminó.**

Para cada una: hacer el trabajo completo como una persona, y al final **comprobar el dato que
la app produjo** — un texto, un número o una imagen. No que algo sea visible.

### Plata (lo más importante)

1. **El presupuesto da el número correcto.** Armar uno con datos conocidos —cantidad de
   invitados y servicios fijos— y comprobar **el monto exacto** en pantalla, no que la
   pantalla diga "listo". Que incluya el ajuste anual del 15%, que va siempre.
2. **El PDF del presupuesto trae ese mismo monto**, no sólo que se baje un archivo.
3. **Una factura guardada aparece con su importe** en la lista, y la cuenta cierra.
4. **Un cobro registrado baja el saldo** en la cantidad correcta.

### Entretenimiento (lo que el dueño usa en la fiesta)

5. **La fotocabina produce la tira.** Sacarse la tanda con cámara simulada y comprobar que la
   imagen resultante **tiene el nombre del homenajeado y el fondo de la fiesta**. Hoy ninguna
   prueba se saca la foto.
6. **El muro social muestra la foto subida**, con el autor, no que el botón de subir exista.
7. **El espejo mágico y la plataforma 360 producen su recuerdo**, igual que la fotocabina.
8. **La impresión sale en 10x15** con el contenido correcto.

### El cliente y el invitado

9. **El invitado confirma asistencia y queda registrado** — que su nombre aparezca en la
   lista del evento después.
10. **El portal del cliente muestra sus datos reales**: su fiesta, su saldo, sus invitados.
11. **La invitación digital se ve con el arte y el nombre que se cargaron.**

### La web pública

12. **La portada muestra los textos y precios que corresponden**, y **el pie de página se
    ve** — ya pasó que existía y el visitante no lo veía.
13. **El formulario de contacto deja el prospecto anotado** en el CRM, con su teléfono.

## Cómo saber si una prueba cuenta

- Si termina en **`toBeVisible`**, en **`status() < 400`** o en *"no dice error"* → **sólo
  confirma que abrió. No cuenta.**
- Si termina comprobando **un texto, un número o una imagen que la app produjo** → cuenta.

## Lo que NO se hace

- **No se borran ni se reescriben las pruebas de hoy.** Sirven para detectar pantallas rotas;
  lo que no hacen es confirmar resultados. Se suman las nuevas.
- **No se agregan veinte pruebas por módulo.** Una por trabajo, la que llega hasta el final.
  Una de éstas vale más que veinte que abren pantallas, y son lentas: por eso una sola.
- **No se toca la app para que la prueba pase.** Si la prueba encuentra algo mal, **eso es un
  hallazgo** y se avisa antes de cambiar nada.

## Cómo se comprueba que quedó bien

Las trece están escritas y en verde. Y una comprobación que vale más que todas: **cambiar a
mano el cálculo del presupuesto para que dé un número distinto y ver que la prueba número 1
se ponga en rojo.** Si sigue en verde, esa prueba no sirve.
