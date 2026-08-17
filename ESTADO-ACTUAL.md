# Acá quedé

Hoja de traspaso entre chats. **Corta a propósito**: se lee entera al abrir cada
sesión. Lo histórico va a `ESTADO-AUDITORIA.md`.

Quien cierre una sesión reescribe este archivo. Se pisa, no se acumula.

---

**Última actualización:** 17 de agosto de 2026.
**Estado:** compila, 1681 pruebas en verde, sin acentos rotos.
**Propuestas abiertas:** ninguna. **Orden vigente:** `docs/ordenes/ahora.md`.

## Dónde va el plan de catorce bloques

**Entrega 1: HECHA y fusionada.** Trivia con podio por mesa, secretario que
habla, llegada del equipo y logística en oscuro.

**Entrega 2: pendiente.** La reunión que se agenda sola desde el simulador (la
más importante), la pregunta de los quince a las invitadas, que no se pierda la
foto ni el pedido de la barra sin internet, y las misiones secretas.

**Entrega 3: pendiente.** Configurador de cierre, videos, termómetro de la
fiesta, libro de la fiesta, cada uno ve lo suyo, transmisión en vivo.

## Lo que costó y no hay que repetir

- **El informe de una entrega dijo siete bloques y eran cuatro.** El control que
  sirvió no fue correr las pruebas —que también fallaban— sino **comparar lo que
  el informe decía contra los archivos que realmente cambiaron**. Hacerlo siempre.
- **Una funcionalidad puede compilar, pasar las pruebas y no existir para el
  usuario.** Pasó con el aviso de margen: el cálculo estaba y no lo mostraba
  ninguna pantalla. Preguntar siempre "¿desde qué pantalla se ve esto?".
- **La llegada del equipo escribía el archivo del proyecto a mano.** En producción
  los datos viven en la base: no se hubiera guardado nada. Todo lo que escribe usa
  `updateDataPartial`/`writeData` y pide `requireAppSession()`.
- **Una orden que Gemini no puede leer no sirve.** Se dejó una en una rama sin
  fusionar y Gemini trabajó sobre una orden vieja ya cumplida. **Las órdenes van
  derecho a `main`.**
- **Se gastó de más esperando compilaciones.** El build va a los ayudantes desde
  el principio; el modelo principal no lo corre.

## Decisiones del dueño

Descartó el precio variable por fecha, alquilarle la app a otros salones y el
"ensayo de la fiesta". Pidió que la captación de prospectos **no sea sólo en la
fotocabina** sino en toda pantalla donde el invitado ya consiguió lo suyo, y
avisó que **el menú de niños y adolescentes es el mismo**: separar la etiqueta no
puede cambiar comida ni precio (verificado: no lo cambia).

## Lo próximo

Esperar la entrega 2 de Gemini, verificarla y fusionarla.
