# Acá quedé

Hoja de traspaso entre chats. **Corta a propósito**: se lee entera al abrir cada sesión.
Lo histórico va a `docs/YA-RESUELTO.md`. **Se pisa, no se acumula.**

---

**Última actualización:** 19 de septiembre de 2026, de noche. **Rama:
`fix/despertador-de-afuera`**, con la verificación corriendo y **sin fusionar todavía**.

## Lo que está listo para entrar (todo probado, casi todo en "probado suelto")

- **Respaldos, reportes y recordatorios**: una copia vacía ya no se guarda como completa, y los
  días se cuentan en hora de Uruguay, no de Greenwich.
- **Encuesta post fiesta, incidentes de la fiesta, reuniones**: no se cuelgan, no se pisan entre
  dos personas, y no dicen "guardado" cuando no guardaron. La reunión borrada por otro ya no le
  manda el aviso al calendario del cliente.
- **Quince guardados que reescribían la lista entera ahora tienen turno.**
- **El ajuste de costos avisa si los menús quedaron con el precio viejo**, en vez de decir "listo".
- **Un equipo asignado a una fiesta no se borra renombrándolo.**
- **Entró el trabajo de Gemini**: TikTok ya no dice "Publicado" mientras procesa, y las pantallas
  del invitado no quedan colgadas al cortarse la señal.

## El mecanismo, que es lo que más cambió

- **`npm run formas-que-mienten`**: busca solo, en todo el código, las cuatro formas de defecto
  que ya costaron caro. La primera corrida encontró **95 lugares**; frena por lo que cambia.
- **La verificación avisa si se arrancó con trabajo a medio terminar**, y dice "este resultado no
  vale" si se tocó código mientras corría.
- **Cinco niveles de evidencia** (`docs/COMO-AUDITAR.md`): mirado, probado suelto, probado de
  punta a punta, probado en navegador, visto andando publicado. **Al contar un arreglo se dice en
  cuál está.**
- **La matriz de diez escenarios** reemplazó la lista larga de preguntas.

## Lo que falta

- **Fusionar.** El entorno de estas sesiones no deja fusionar: queda para el dueño.
- **Nueve órdenes abiertas para Gemini**, con la hoja de ruta en
  `docs/ordenes/TANDA-2026-09-18-que-sigue-para-gemini.md`. **Todo en UNA propuesta.**
- **Codex sigue la primera pasada** por áreas que nadie había mirado; van 12 de 16 sin pasar con
  el método de ahora.

## Trampas que costaron tiempo y no se repiten

- **Nunca barrer procesos con `pkill -f`**: caza el propio comando y mata la sesión.
- **Lo que escriben las pruebas no se sube**: `npm run limpiar:corrida`.
- **No tocar código mientras corre la verificación**: la tira abajo.
