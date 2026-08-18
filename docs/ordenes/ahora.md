# No hay orden pendiente

**Al 18 de agosto de 2026.** Las dos últimas órdenes están entregadas, verificadas
y fusionadas:

- **Leer los comentarios de las redes** → `hechas/comentarios-de-las-redes.md`
- **La reseña de Google y el panel que trabaja solo** →
  `hechas/resenas-y-panel-automatico.md`

**Antes de escribir la próxima, leer esto:**

1. **Verificar que lo que se va a pedir no exista ya.** Ya se perdió un viaje
   entero pidiendo el álbum del portal del cliente, que la aplicación tenía hecho.
   Un `graphify query` y una mirada al archivo alcanzan. El inventario de lo que
   hay está en `docs/QUE-HAY-EN-LA-APP.md`.
2. **Una sola propuesta con todos los bloques.** Cada fusión dispara un despliegue
   y eso se paga. Si un bloque se traba, se entrega el resto igual, en la misma
   propuesta, avisando cuál faltó.
3. **Decir sobre qué versión principal trabajar.** Las dos últimas entregas
   llegaron hechas sobre una base vieja: la segunda traía adentro la primera
   entera, en su forma original, y habría borrado tres correcciones sin que se
   notara.

## Lo único que quedó pendiente de las órdenes anteriores

**El aviso de puntaje bajo en Google no se puede encender todavía.** Está armado y
salta solo si el promedio baja de 4,0, pero hoy nadie puede leer el puntaje real
de la ficha: hace falta acceso a los datos de Google Business Profile. Queda en
`null` a propósito, sin inventar un número. Es lo correcto hasta que ese acceso
exista.
