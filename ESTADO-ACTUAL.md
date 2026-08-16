# Acá quedé

Hoja de traspaso entre chats. **Corta a propósito**: se lee entera al abrir cada
sesión. Lo histórico va a `ESTADO-AUDITORIA.md`.

Quien cierre una sesión reescribe este archivo. Se pisa, no se acumula.

---

**Última actualización:** 16 de agosto de 2026, cierre.
**Rama:** `claude/repo-work-guidelines-l4u1tf`, con la orden nueva sin fusionar.
**Estado:** compila, 1668 pruebas en verde, sin acentos rotos.
**Propuestas abiertas:** ninguna. **Orden vigente:** `docs/ordenes/ahora.md`.

## Qué se hizo en esta tanda

- **Tres pantallas que quedaban en blanco**, arregladas: la pantalla grande del
  salón se quedaba negra cada tanto, y dos carteles del invitado eran blancos
  sobre blanco.
- **El portal del cliente, con ojo de vendedor**: la fiesta pasó a ser la
  protagonista en el celular, salieron dos notas internas que veía el cliente, y
  la espera del muro dejó de ser una rueda pelada.
- **Se fusionó la entrega de Gemini** de inteligencia artificial comercial y
  post-evento, **y se le agregó lo que faltaba**: esas dos llamadas gastaban
  plata sin anotarla en ningún lado. Ahora pasan por el mismo contador y tope
  que el resto.

## La orden que quedó escrita, sin fusionar

`docs/ordenes/ahora.md` pide tres cosas nuevas que el dueño eligió: la trivia en
la cena, el video vertical de la mañana siguiente y el configurador visual para
la reunión de cierre.

**El hallazgo que ahorra el trabajo más grande: la trivia ya está construida
entera y no está enchufada.** Hay motor con respuesta correcta, puntajes y podio
por mesa, pantalla del invitado y panel de preguntas, en `src/lib/games/` y
`src/components/games/`. **Ninguna pantalla los usa.** El bloque A es plomería,
no construcción.

## Lo que costó y no hay que repetir

- **Un ayudante buscó las piezas de la trivia y se perdió los cinco archivos que
  ya la resolvían.** Los encontró el modelo principal al verificar. Si se mandaba
  la orden tal cual, Gemini reescribía algo terminado.
- **La foto de portada del portal y el logo de la barra pública** siguen sin
  verse en las fotos de prueba. Tres intentos y se paró por regla.

## Lo próximo, si nadie dice otra cosa

Esperar la entrega de Gemini de los tres bloques, verificarla y fusionarla junto
con esta orden.
