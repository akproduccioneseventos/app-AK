# Acá quedé

Hoja de traspaso entre chats. **Corta a propósito**: se lee entera al abrir cada
sesión. Lo histórico va a `ESTADO-AUDITORIA.md`.

Quien cierre una sesión reescribe este archivo. Se pisa, no se acumula.

---

**Última actualización:** 17 de agosto de 2026.
**Estado de la app:** sana. Compila, 1694 pruebas en verde, sin acentos rotos.
**Propuestas abiertas:** ninguna. **Orden vigente:** `docs/ordenes/ahora.md`.

## Lo que se terminó

**Las quince mejoras del plan grande están andando**, cada una con su pantalla
anotada en `docs/QUE-HAY-EN-LA-APP.md`: trivia con podio por mesa, misiones
secretas, secretario que habla, llegada del equipo, la reunión que se agenda sola,
aviso de margen, la pregunta de los quince, configurador de cierre, termómetro,
libro de la fiesta, "lo tuyo ahora", video del recuerdo, transmisión en vivo,
pantallas de noche en oscuro y el centro de presencia digital.

## Lo que falta, y está pedido en la orden

1. **Publicar de verdad en las redes.** El botón del centro de presencia digital
   marca el posteo como publicado **y no manda nada a Facebook ni Instagram**.
   Es la mitad que le falta a ese módulo.
2. **El importador de historial de redes**, que no lee ni su propio archivo de
   prueba.
3. **Los datos de Google**: subir sólo los 3 archivos de posicionamiento, sin las
   32 copias viejas que borraban un arreglo de seguridad.
4. **Probarla en una fiesta de verdad.** Eso no lo hace ninguna IA.

## Lo que costó y no hay que repetir

- **Código escrito contra funciones y campos que no existen.** Rompió tres
  entregas seguidas. Lo agarra `npx tsc --noEmit` en un minuto.
- **Pantallas escritas que no se pueden abrir.** Cuatro en una sola tanda. Los
  cuatro controles no lo detectan: hay que preguntar "¿desde qué pantalla se ve?".
- **Informes que declaran más de lo que hicieron.** Comparar el informe contra los
  archivos que realmente cambiaron.
- **Prometer lo que no se puede cumplir.** La app decía que guardaba la foto sin
  señal y no la guardaba.
- **Frenos que no frenan.** Contar por un dato que el visitante escribe es lo
  mismo que no tener freno.
- **Las órdenes van derecho a `main`**, o Gemini trabaja sobre una vieja.
- **El build va a los ayudantes.** El modelo principal no lo corre.

## Decisiones del dueño

Descartó el precio variable por fecha, alquilar la app a otros salones y el
"ensayo de la fiesta". `TriviaAdminPanel` queda sin enchufar a propósito.
