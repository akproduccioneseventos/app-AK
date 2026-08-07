# Acá quedé

Hoja de traspaso entre chats. **Corta a propósito**: se lee entera al abrir cada
sesión, así que si crece más de 40 líneas deja de servir. Lo histórico va a
`ESTADO-AUDITORIA.md`, que no se lee salvo que haga falta.

Quien cierre una sesión reescribe este archivo. No se acumulan tandas: se pisa.

---

**Última actualización:** 7 de agosto de 2026
**Rama:** todo fusionado en `main`. No hay ramas a medias.
**Estado:** compila, 1291 pruebas en verde, sin acentos rotos.

## Cómo se trabaja ahora (acordado con el dueño)

Claude audita y deja la orden escrita en `docs/ordenes/`. Gemini programa y sube
la propuesta. Claude verifica y fusiona. Si viene rota, vuelve a Gemini: no se le
arregla el trabajo, salvo que sea un renglón. Plata, cobros y permisos los
escribe Claude. Propuestas completas por bloque, sin mezclar dos bloques.

## Módulo de entretenimiento: qué está hecho

- Las cuatro estaciones de captura ya no dicen "escaneá tu recuerdo" cuando la
  subida falló, y ofrecen descargar o reintentar.
- Pantalla gigante y muro avisan si se cortó la conexión; galería y red social
  distinguen "no hay nada" de "no cargó"; la zona digital sin tarjetas muertas;
  el tótem no muestra un QR que no sirve.
- El operador se entera al abrir la cabina si la IA no está disponible.
- El álbum del portal del cliente **ya existía**: la orden lo pedía por error mío.
  Quedó cubierto con pruebas (#869) y el bloque se cerró.

## Lo que falta, en `docs/ordenes/entretenimiento-02.md`

- **Bloque A** (el próximo): terminar la trivia por mesa y que el muro salude por
  nombre. Hoy nada completa el campo de la mesa, así que el ranking sale vacío.
- **Bloque C**: tope de generaciones con IA. Verificado que no hay ninguno, ni en
  pantalla ni en servidor. Es lo único que toca la plata del dueño.
- **Bloque D**: confirmar que cada estación funciona sola, con prueba.
- **Bloque E**: que el operador se entere de las fallas antes que el invitado.

## Lección de esta tanda

Antes de pedir algo en una orden, verificar que no esté ya hecho. El bloque B le
hizo perder un viaje a Gemini.
