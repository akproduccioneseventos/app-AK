# No hay orden pendiente

**Al 18 de agosto de 2026.** Las últimas órdenes están entregadas, verificadas y
fusionadas:

- **Leer los comentarios de las redes** → `hechas/comentarios-de-las-redes.md`
- **La reseña de Google y el panel que trabaja solo** →
  `hechas/resenas-y-panel-automatico.md`

## Antes de escribir la próxima orden, leer esto

1. **Verificar que lo que se va a pedir NO EXISTA YA, buscando la función y no el
   archivo.** Es el error que más caro salió. En una sola revisión, dos "funciones
   que faltaban" ya estaban hechas con otro nombre: el pedido de cambio de comida
   del cliente (existe como pedido de cambio de invitados y de menú, en el portal)
   y pasar un prospecto a cliente (existe como confirmar la reserva, en el CRM).
   Y un componente que "faltaba enchufar" resultó ser un archivo muerto de seis
   líneas, mientras el de verdad funcionaba con otro nombre.

   Buscá **sin distinguir mayúsculas** y por lo que la cosa hace, no por cómo se
   llama el archivo. Ya se declaró que algo no existía por buscar `autoSave` cuando
   se llamaba `handleAutoSaveSalary`.

2. **Una sola propuesta con todos los bloques.** Cada fusión dispara un despliegue
   y eso se paga. Si un bloque se traba, entregar el resto igual, en la misma
   propuesta, avisando cuál faltó.

3. **Arrancar desde la versión principal de ahora.** Las dos últimas entregas
   llegaron hechas sobre una base vieja, y una traía adentro la anterior entera:
   habría borrado tres correcciones sin que se notara.

4. **Leer `docs/QUE-HAY-EN-LA-APP.md` primero.** Está el inventario de lo que
   existe y con qué nombre.

## Lo único que quedó pendiente de verdad

**El aviso de puntaje bajo en Google no se puede encender todavía.** Está armado y
salta solo si el promedio baja de 4,0, pero hoy nadie puede leer el puntaje real de
la ficha: hace falta acceso a los datos de Google Business Profile. Queda en `null`
a propósito, sin inventar un número. Es lo correcto hasta que ese acceso exista.
