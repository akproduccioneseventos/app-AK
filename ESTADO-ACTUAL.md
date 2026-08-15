# Acá quedé

Hoja de traspaso entre chats. **Corta a propósito**: se lee entera al abrir cada
sesión. Lo histórico va a `ESTADO-AUDITORIA.md`.

Quien cierre una sesión reescribe este archivo. Se pisa, no se acumula.

---

**Última actualización:** 15 de agosto de 2026, cierre.
**Rama:** todo fusionado en `main`.
**Estado:** compila, 1612 pruebas en verde, sin acentos rotos.
**Propuestas abiertas:** ninguna.
**Orden vigente para Gemini:** `docs/ordenes/ahora.md`, las ocho pantallas del
cliente con más colores escritos a mano.

## Lo hecho en esta tanda

- **Pantallas de la noche:** impresión, presentación y tótem ya avisan de verdad
  cuando se corta internet, en vez de mostrar información vieja como si nada.
- **Tres pantallas escondidas ahora están en el menú:** incidentes, guías de
  armado y cambios a aprobar. Funcionaban pero no había botón que llevara ahí.
- **La seña ya no se asienta siempre como efectivo.** El cierre de contratación
  pedía el monto pero no cómo había entrado la plata: una transferencia figuraba
  como plata en mano, también en la factura. Ahora pregunta, y no deja cerrar sin
  el dato.
- **Una solicitud de cambio se decide una sola vez**, con turnos de guardado para
  que dos personas no se pisen, y rechazar exige motivo.
- **Promociones:** no se pueden guardar sin fecha de inicio y de fin.
- **Colores del tema:** hechas las pantallas de Ajustes. Falta el resto.

## Probada en un navegador de verdad, entera

**94 recorridos en Chrome contra el servidor compilado, en escritorio y en
celular: todos pasan.** Desde la invitación pública y el simulador de
presupuesto hasta las pantallas de la noche, el muro, el portal del cliente y
las internas del equipo.

Tres habían fallado y **ninguna era culpa de la app**:

- Dos pruebas se peleaban por la misma fecha: la de la noche crea una fiesta de
  mentira a un año justo y la del simulador elegía ese mismo día. El simulador
  la marcaba ocupada, que es lo correcto porque lo estaba. Se separaron.
- La huella de las pantallas cambió porque el menú tiene tres botones nuevos y
  uno repetido menos. Se actualizó la referencia.

**Ojo con cómo se corre:** `npm run test:e2e:production`, nunca `npx playwright
test` a secas. El segundo levanta el servidor de desarrollo y da fallas falsas;
ya pasó en esta sesión y costó una corrida entera.

## Lo revisado en el cierre

Se auditaron las pantallas del cliente e invitado, las internas del equipo y
toda el área de comida. **Las del cliente salieron limpias.** De comida salieron
cinco arreglos, ya hechos: no se guardan cantidades ni costos negativos, la
lista de compras avisa si un plato contratado no tiene ingredientes cargados, y
una cantidad en cero ya no compra una unidad igual.

## Lo que falta

**Nada.** El pasaje de colores al tema, que era lo último que quedaba, **se
descartó**: la app no tiene modo oscuro —está preparada por dentro pero no hay
interruptor y nunca se activa—, así que cambiar 354 archivos no se vería
distinto en pantalla. Está explicado en `docs/YA-RESUELTO.md`.

**No hay órdenes vigentes para Gemini.** `docs/ordenes/` quedó sin trabajo
pendiente.
Lo único abierto son **cuatro cosas que nunca existieron**, y es decisión
comercial del dueño si valen la pena: armar presupuesto desde el chat del
asistente, mails masivos, un formulario de contacto aparte del simulador, y
traer reseñas de Google. No son deudas ni arreglos: son funciones nuevas.

No hay errores conocidos sin resolver. Plata, cobros y permisos quedaron
auditados sin hallazgos: no hace falta volver a mirar esa área.

## Ojo con esto, ya pasó

- Al fusionar una rama que toque `fotografia` o `catering`, **quedate siempre con
  `verifyAccesoPersonalToken`**.
- **Una rama hecha sobre una base vieja borra trabajo nuevo sin que se note.**
  Compará contra `main` de hoy, no contra el de cuando se creó.
- Un archivo `'use server'` **sólo puede exportar funciones asíncronas**. Hay una
  prueba que lo controla y ya frenó dos entregas.
- `public/firebase-messaging-sw.js` **no se commitea**: se genera al compilar.
- **Revisá que la entrega no traiga cambios sueltos fuera de lo pedido.** En dos
  entregas seguidas vinieron colados; el último tocaba el asistente del simulador
  y compilaba igual, pero podía fallar recién al usarlo.
