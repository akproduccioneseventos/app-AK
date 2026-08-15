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

## Lo revisado en el cierre

Se auditaron las pantallas del cliente e invitado, las internas del equipo y
toda el área de comida. **Las del cliente salieron limpias.** De comida salieron
cinco arreglos, ya hechos: no se guardan cantidades ni costos negativos, la
lista de compras avisa si un plato contratado no tiene ingredientes cargados, y
una cantidad en cero ya no compra una unidad igual.

## Lo que falta

- **Terminar los colores del tema.** Queda grande: unos 354 archivos. La orden
  vigente pide las ocho pantallas del cliente con más colores a mano, que es
  donde más rinde. Va pantalla por pantalla, nunca buscar y reemplazar masivo, y
  sin tocar los colores que elige el usuario.
- **Cuatro comodidades chicas de las pantallas internas**, ninguna rota: la
  pantalla de presupuestos salta directo a "nuevo" y no deja ver el listado; el
  historial de un empleado no tiene filtro y se hace largo; las citas del
  calendario no se pueden editar ni borrar después de creadas; y las alertas
  leídas no se pueden esconder.
- **Nunca existieron** (decisión comercial del dueño si valen la pena): armar
  presupuesto desde el chat del asistente, mails masivos, formulario de contacto
  aparte del simulador, y traer reseñas de Google.

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
