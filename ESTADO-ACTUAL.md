# Acá quedé

Hoja de traspaso entre chats. **Corta a propósito**: se lee entera al abrir cada
sesión. Lo histórico va a `ESTADO-AUDITORIA.md`.

Quien cierre una sesión reescribe este archivo. **Se pisa, no se acumula.**

---

**Última actualización:** 22 de agosto de 2026, cierre.
**Estado de la app:** sana y fusionada. 2097 pruebas en verde, tipos en cero,
compila, sin acentos rotos, seguridad de la base en verde.
**Propuestas abiertas:** ninguna.
**Órdenes pendientes:** `docs/ordenes/despues-sin-internet.md`, para Gemini.

## Reglas del dueño (22 de agosto de 2026)

- **"Cuando está bien, siempre fusioná."** No se pregunta. Si pasa los cuatro
  controles, se fusiona y se avisa después. Verificación completa sobre la versión
  principal, siempre, después de fusionar.
- **Gemini programa, Claude revisa.** Claude escribe la orden, verifica, repara lo
  mecánico y decide.
- **No se tocan textos que ve el cliente si no están pedidos.**
- **Delegar en los ayudantes económicos**, siempre y en paralelo.

## Lo que entró hoy

- **Manual de la app** con dos capas, el mapa de pantallas que se arma solo
  (`npm run mapa:generar`) y el candado que lo mantiene al día.
- **La asistente ya sabe manejar la app**: recibe el mapa del menú y cancela la
  navegación si inventa una pantalla.
- **La auditoría de títulos lee los títulos de verdad**, no una copia.
- **Instagram conectado**; la galería muestra todo el historial desde 2019, de a
  tandas. Panel de historial de redes con botón para actualizar.
- **Movimiento en las pantallas públicas**, más el remate: números que trepan,
  galería escalonada, y una sola animación eterna en la portada en vez de tres.
- **EL DESPERTADOR**: una tarea programada cada 15 minutos hace correr todo sin
  depender de que nadie abra la app. Las visitas a la web pública también la
  disparan. Con traba de concurrencia y su prueba.

## PENDIENTE QUE NO SE PUEDE OLVIDAR

**El despertador está fusionado pero NO CORRE: nadie lo publica.** El despliegue
automático (`.github/workflows/deploy.yml`) compila `functions/` pero sube sólo el
sitio. La tarea programada nunca llega a Google.

**No dar la app por "que corre sola" hasta comprobar que el despertador tocó la
puerta al menos una vez.** Está pedido como bloque urgente en
`docs/ordenes/ahora.md`. Cuando llegue la entrega, **verificar eso primero**, antes
que ninguna otra cosa de esa propuesta.

## Lo que falta

**Una sola orden: `docs/ordenes/despues-sin-internet.md`.** La app instalable en
computadora y celular sin tienda de aplicaciones, el modo quiosco para las
estaciones que faltan, y que todo funcione sin internet sincronizando al volver.
Va en propuesta aparte a propósito: es un cambio de fondo y mezclarlo haría
imposible saber qué rompió qué.

## Cinco cosas aprendidas hoy, todas costaron

1. **COMPILAR NO ES ANDAR.** El despertador se entregó llamando a una puerta que
   no existe (una barra donde iba un guión). Los cuatro controles pasaban: tipos
   en cero, 2095 pruebas en verde, compilaba. Habría golpeado una puerta cerrada
   cada 15 minutos, con el error en un registro que nadie mira. **Cuando algo
   llama a otra cosa por su nombre escrito, hay que verificar que ese nombre
   exista.**
2. **Una prueba nueva no vale hasta verla en rojo.** Antes de dar por buena la
   prueba del despertador, se le puso la dirección mala a propósito para
   confirmar que la agarra.
3. **Mover una lista a un archivo nuevo no es unificarla.** Si la copia vieja
   queda donde estaba, la auditoría lee un reflejo de sí misma. Contá cuántas
   veces está definida antes de dar por resuelto un "ahora lee lo de verdad".
4. **Una prueba que falla sola se termina ignorando.** La de maquetación contaba
   botones y enlaces, que cambian con los datos. El día que avise algo real, nadie
   le va a creer.
5. **Una prueba corrida sola no da lo mismo que en tanda.** Pareció una regresión
   de Gemini y no lo era. Comparar siempre en igualdad de condiciones.

## Revisión completa de la app (22 de agosto)

Siete áreas auditadas: pantalla gigante, decoración, entretenimiento, comida,
plata, invitados y portal del cliente, ventas y operación. **Nada roto de fondo.**
Los cuatro hallazgos chicos ya están fusionados o pedidos. **La pantalla gigante,
que el dueño recordaba como enredada, vino limpia.**
