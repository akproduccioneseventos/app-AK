# Acá quedé

Hoja de traspaso entre chats. **Corta a propósito**: se lee entera al abrir cada
sesión. Lo histórico va a `ESTADO-AUDITORIA.md`.

Quien cierre una sesión reescribe este archivo. **Se pisa, no se acumula.**

---

**Última actualización:** 22 de agosto de 2026, cierre.
**Estado de la app:** sana y fusionada. 2090 pruebas en verde, tipos en cero,
compila, sin acentos rotos, seguridad de la base en verde.
**Propuestas abiertas:** ninguna.
**Órdenes pendientes:** `docs/ordenes/ahora.md`, para Gemini.

## Reglas nuevas del dueño (22 de agosto de 2026)

- **"Cuando está bien, siempre fusioná."** No se pregunta más. Si pasa los cuatro
  controles, se fusiona y se avisa después. Verificación completa sobre la versión
  principal, siempre, después de fusionar.
- **Gemini programa, Claude revisa.** Claude escribe la orden, verifica, repara lo
  mecánico y decide. No programa lo que le toca a Gemini.
- **No se tocan textos que ve el cliente si no están pedidos.** Gemini cambió la
  promesa de respuesta y el botón de precio por su cuenta; se volvieron atrás.

## Lo que entró hoy

- **Manual de la app** con las dos capas, el mapa de pantallas que se arma solo
  (`npm run mapa:generar`) y el candado que lo mantiene al día a la fuerza.
- **La asistente ya sabe manejar la app**: recibe el mapa del menú y cancela la
  navegación si inventa una pantalla.
- **La auditoría de títulos lee los títulos de verdad**, no una copia.
- **Instagram conectado y la galería muestra todo el historial desde 2019**, que se
  bajaba solo y no lo mostraba nadie. Aparece de a tandas.
- **Panel de historial de redes** con botón para actualizar.
- **Movimiento en las pantallas públicas**, revisado: nada queda invisible,
  respeta a quien pidió menos movimiento, no desborda.

## Lo que falta, todo en la orden de Gemini

1. **El despertador. Es lo más importante y ya se pidió una vez sin resultado.**
   La app se pone al día sólo cuando alguien del equipo abre el panel; una visita
   a la web pública no dispara nada. Si el equipo no entra el fin de semana, no
   corre nada en todo el fin de semana.
2. **Rematar el movimiento**: números que trepan, fotos escalonadas, molde gris
   mientras carga, y sacar dos de las tres animaciones eternas de la portada.
3. **Dos pruebas de navegador** (`layout-baseline`) que se quejan del Centro de
   Control. **Ya fallaban antes, no son una regresión**; de 596 pasan 594.

## Tres cosas aprendidas hoy, que costaron caro

1. **Mover una lista a un archivo nuevo no es unificarla.** Si la copia vieja queda
   donde estaba, la auditoría lee un reflejo de sí misma. Contá cuántas veces está
   definida antes de dar por resuelto un "ahora lee lo de verdad".
2. **Una prueba que falla sola se termina ignorando.** La de maquetación contaba
   botones y enlaces, que cambian con los datos. El día que avise algo real, nadie
   le va a creer.
3. **Una prueba corrida sola no da lo mismo que en tanda.** Pareció una regresión
   del trabajo de Gemini y no lo era. Comparar siempre en igualdad de condiciones.
