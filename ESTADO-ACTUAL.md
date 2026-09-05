# Acá quedé

Hoja de traspaso entre chats. **Corta a propósito**: se lee entera al abrir cada sesión.
Lo histórico va a `docs/YA-RESUELTO.md`. **Se pisa, no se acumula.**

---

**Última actualización:** 5 de septiembre de 2026. **Rama: `main`.**

**Todo lo de la tanda anterior está fusionado y publicable.** La puerta
(`npm run "publicar?"`) dio **SE PUEDE PUBLICAR** con las nueve etapas en verde, incluido el
recorrido de las 358 pantallas.

## Lo que quedó terminado

- **129 de 129 funciones del rubro.** Los nueve módulos de entretenimiento, completos contra la
  competencia. El panel lo muestra solo: `npm run panel`.
- **El fondo sin tela verde, de verdad.** La versión que llegó dibujaba un óvalo en el medio y
  cortaba gente por la mitad. Ahora el modelo mira la imagen. No se paga nada por mes.
- **La pantalla del invitado ya no se rompe.** El enlace que abre el invitado mostraba
  "Application error". Era el redireccionamiento; se hace desde la configuración y listo.
- **Dos defectos de la importación de invitados**, encontrados al sacarla de la pantalla: una
  planilla sin encabezado rompía todo, y **un "Niño" entraba como adulto** —eso cambiaba la
  cuenta de la comida—.
- **Dos pantallas vacías sin salida** (el video del recuerdo y el check-in) ahora tienen adónde ir.
- **Las once devoluciones viejas quedaron cerradas.** El panel dice cero pendientes, que es cierto.
- **La verificación es más corta:** el recorrido pasó de 40 a 18 minutos, y se dejaron de perder
  siete minutos por corrida recompilando de gusto.

## Lo que sigue, si nadie dice otra cosa

Nada urgente. La app está publicable. Lo que aparezca lo pide el dueño o lo muestra una fiesta.

## Trampas que costaron tiempo y no se repiten

- **Un error de React se mide con la app COMPILADA, no en modo desarrollo.** En desarrollo se
  recupera solo y parece que no rompe nada. Me equivoqué por eso y lo anoté.
- **Las pantallas internas no ven las fiestas que arman las pruebas** (la app de prueba lee
  archivos locales). Toda prueba de navegador sobre una pantalla interna con una fiesta inventada
  va a fallar: eso se comprueba sin navegador.
- **Una fusión puede pisar un arreglo de hace un rato.** Pasó con la prueba del post-evento.
  Después de fusionar, revisar las correcciones propias.
- **No correr ayudantes mientras corre la puerta:** la corrida se pasa de tiempo y se pierde.
