# Acá quedé

Hoja de traspaso entre chats. **Corta a propósito**: se lee entera al abrir cada sesión.
Lo histórico va a `docs/YA-RESUELTO.md`. **Se pisa, no se acumula.**

---

**Última actualización:** 1 de septiembre de 2026.
**Rama:** `claude/ponte-al-dia-qtrho3`. Tiene adentro **las tres entregas de Gemini** ya
revisadas y corregidas.

## En qué se está

Se auditó **toda la app por primera vez** con un método nuevo: abrir cada pantalla en el
navegador y mirarla, en vez de leer código. **Las 353 pantallas: 328 andan, 25 quedaron
marcadas.**

## Lo que se cerró

- **El recorrido de las 353 pantallas existe y funciona.** Se corre con `npm run recorrido`.
- **La agenda del dueño ya no se ensucia**: se duplicaban eventos y quedaban fechas viejas.
  Arreglado, y hay un botón en Configuración → Sincronizaciones para limpiar lo que quedó.
- **Las dedicatorias del invitado pueden salir en la pantalla grande** (estaban apagadas con un
  candado en el código, mientras el operador tenía el botón para encenderlas).
- **Comparación con más de 40 plataformas del rubro**, módulo por módulo, en
  `docs/COMPARACION-CON-EL-RUBRO.md`. **Estamos al nivel o mejor en casi todo.**
- **Reglas nuevas del dueño anotadas**: todo lo que se haga tiene que ser mejor que lo mejor del
  rubro; el menú y los ingredientes no se tocan.

## Lo que quedó trabado, y por qué

- **16 pantallas dan un error interno**, entre ellas el blog y las landings. **Se paró después
  de tres intentos.** Está todo en `docs/ordenes/26-la-web-de-venta-se-rompe.md`: se reprodujo,
  se descartaron tres causas y **puede ser del entorno de prueba, no de la app**. Lo primero es
  abrir el blog en la web publicada y mirar. **No tocar código antes de eso.**
- **La puerta no pasa por ese error**, así que **nada se puede fusionar hasta resolverlo**.
- **Touchpix**: sigue sin comprobarse que muestre el texto de marca. Su botón de disparar no
  tiene nombre y ninguna prueba lo puede tocar. Pedido en la orden 20.

## Lo próximo

1. **Orden 26**, la web de venta. Primero comprobar si el error existe de verdad.
2. Fusionar lo que está listo: seis diseños de invitación, red social y pantalla gigante.
3. Órdenes 24 (decoración), 25 (que el empleado confirme) y 20 (estaciones).
4. **De Claude**: la hoja de cocina para la noche del evento.
