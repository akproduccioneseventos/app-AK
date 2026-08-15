# Acá quedé

Hoja de traspaso entre chats. **Corta a propósito**: se lee entera al abrir cada
sesión. Lo histórico va a `ESTADO-AUDITORIA.md`.

Quien cierre una sesión reescribe este archivo. Se pisa, no se acumula.

---

**Última actualización:** 15 de agosto de 2026, cierre.
**Rama:** todo fusionado en `main`.
**Estado:** compila, 1606 pruebas en verde, sin acentos rotos.
**Propuestas abiertas:** ninguna.
**Órdenes pendientes para Gemini:** ninguna. `docs/ordenes/` quedó vacío de
trabajo vigente; todo está en `hechas/`.

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

## Lo que falta

- **Terminar los colores del tema** en el resto de las pantallas. Ya están las
  que ve el cliente y las de Ajustes. Va pantalla por pantalla, nunca buscar y
  reemplazar masivo, y sin tocar los colores que elige el usuario.
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
