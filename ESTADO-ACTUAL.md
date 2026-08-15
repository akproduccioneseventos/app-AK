# Acá quedé

Hoja de traspaso entre chats. **Corta a propósito**: se lee entera al abrir cada
sesión. Lo histórico va a `ESTADO-AUDITORIA.md`.

Quien cierre una sesión reescribe este archivo. Se pisa, no se acumula.

---

**Última actualización:** 15 de agosto de 2026.
**Rama:** todo fusionado en `main`.
**Estado:** compila, 1602 pruebas en verde, sin acentos rotos.
**Propuestas abiertas:** ninguna.

## La seña ya no se asienta siempre como efectivo

El paso de cierre de contratación pedía el monto de la seña pero **nunca
preguntaba cómo había entrado la plata**: quedaba como efectivo aunque el
cliente hubiera transferido, y ese error se copiaba al pago de la factura. Ahora
el formulario pregunta el método apenas se escribe un monto, y el servidor
rechaza el cierre si falta, en vez de adivinar.

**Plata, cobros y permisos quedaron auditados sin hallazgos** (presupuestos,
facturas, recibos, gastos, cupones, planes de pago y pagos del portal). No hace
falta volver a mirar esa área.

## Tres pantallas que estaban escondidas ya están en el menú

Incidentes, guías de armado y cambios a aprobar funcionaban bien pero **no había
ningún botón que llevara ahí**: había que escribir la dirección a mano. Se
decidió conectarlas y no retirarlas, porque era trabajo ya pagado y sano.
Incidentes y guías quedaron en Fiestas; cambios a aprobar en Contabilidad,
porque cada solicitud lleva impacto en pesos.

Al conectarlas aparecieron tres agujeros en las solicitudes de cambio, ya
cerrados: una solicitud ya rechazada se podía volver a aprobar y se borraba el
rastro de quién había decidido; dos personas decidiendo al mismo tiempo se
pisaban; y rechazar aceptaba quedar sin motivo escrito.

## Lo hecho antes en esta tanda

Las tres pantallas que se usan en plena fiesta ya avisan de verdad cuando se
corta internet:

- **Impresión:** queda una franja roja fija que dice que no llegan fotos nuevas y
  desde qué hora, con botón para reintentar. Antes el cartel se iba a los dos
  segundos y el operador seguía imprimiendo fotos viejas sin enterarse.
- **Presentación al cliente:** se recupera sola cada 10 segundos. Antes quedaba
  muerta hasta que alguien apretara el botón.
- **Tótem:** mientras no está conectado el QR no se muestra, y hay un cartel
  grande que se lee de lejos. Antes el invitado escaneaba un QR que no andaba.

Lo programó Gemini. Al revisarlo se le sacó un archivo de avisos que se genera
solo y vino modificado a mano (segunda vez), y se aflojó una prueba que
controlaba el color exacto de un cartel, para que no choque con el trabajo de
colores que sigue pendiente.

## Lo que falta

En `docs/ordenes/ahora.md` quedan **dos bloques para Gemini, en una sola
propuesta**: terminar de pasar los colores de las pantallas al tema, y que las
promociones no se puedan guardar sin fecha de inicio y de fin.

No queda nada esperando decisión del dueño.

## Ojo con esto, ya pasó

- Al fusionar una rama que toque `fotografia` o `catering`, **quedate siempre con
  `verifyAccesoPersonalToken`**.
- **Una rama hecha sobre una base vieja borra trabajo nuevo sin que se note.**
  Compará contra `main` de hoy, no contra el de cuando se creó.
- Un archivo `'use server'` **sólo puede exportar funciones asíncronas**. Hay una
  prueba que lo controla y ya frenó dos entregas.
- `public/firebase-messaging-sw.js` **no se commitea**: se genera en cada
  compilación. Si viene cambiado en una rama, quedate con el de `main`.
