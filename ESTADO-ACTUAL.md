# Acá quedé

Hoja de traspaso entre chats. **Corta a propósito**: se lee entera al abrir cada sesión.
Lo histórico va a `docs/YA-RESUELTO.md`. **Se pisa, no se acumula.**

---

**Última actualización:** 20 de septiembre de 2026. **Rama `fix/despertador-de-afuera`**,
todo subido, **sin fusionar**.

## Lo arreglado hoy (todo con su control, probado rompiéndolo)

- **El indicador de preparación daba 100% con el cliente debiendo**: leía un campo de pagos que
  no existe. Ahora mira el mismo plan que la pantalla de cobros.
- **La lista de compras sumaba gramos como si fueran kilos** (200 g + 2 kg = "202"). La unidad
  entra en la cuenta, en las dos pantallas.
- **El buzón decía "Sincronizado" con la lista borrada** y la descarga bajaba un archivo vacío.
  Ahora avisa que falló la lectura y no borra lo que se ve.
- **Al volver del ingreso se perdía la fiesta** y la pantalla quedaba cargando para siempre.
- **Las pruebas de navegador entraban con media sesión**: era la causa de que varias pantallas
  parecieran rotas. Queda un único ayudante, `ponerSesionDelEquipo`.

## El mecanismo

- **Preguntas 17, 18 y 19** en `docs/COMO-AUDITAR.md`: campos leídos que no existen, claves de
  agrupación incompletas, y datos de la dirección que no sobreviven al ingreso.
- **La corrida dice qué archivo no carga** cuando una tanda no registra ninguna prueba. Eso fue
  lo que costó la hora.
- **Errores propios 14 y 15** anotados en `CLAUDE.md`, con la regla nueva de **destrancar**.

## Lo que falta

- **Tres pruebas de Gemini siguen en rojo** (carga operativa x2 y regalos): son de contenido, no
  de sesión. Están devueltas con el diagnóstico medido en
  `docs/ordenes/DEVOLUCION-71-las-cuatro-pruebas-de-navegador.md`.
- **Por eso la puerta completa todavía no está en verde.** Lo mío sí: compila, 2725 pruebas en
  verde, sin acentos rotos.
- **Órdenes abiertas para Gemini: 72 y 73**, más las nueve anteriores. Todo en UNA propuesta.
- **Fusionar**: queda para el dueño.

## Trampas que costaron tiempo y no se repiten

- **La sesión del equipo son dos mitades**: cookie + marca en el navegador.
- **Una prueba tiene que fallar diciendo qué pasó**, no "no encuentro el campo".
- **Lo que escriben las pruebas no se sube**: `npm run limpiar:corrida`.
