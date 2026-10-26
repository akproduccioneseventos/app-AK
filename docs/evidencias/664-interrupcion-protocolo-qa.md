# Canonica664 no aceptada: protocolo propio distinto al anterior

Se retiro antes de terminar; se conserva el log parcial, no un PASS canonico.
La configuracion impuso FIRESTORE_EMULATOR_HOST a un emulador no levantado y
GCLOUD_PROJECT, ademas de ejecutar869suites en el mismo proceso con heap1024.
Los mocks/unitarios necesitan su propio ambiente y el reciclado de worker que
ya usaba el protocolo491/593. Hubo timeouts y rechazos por ese destino artificial.

Se detuvo SOLO Jest propio9088 (comando/padre comprobados). El finally restauro
JSON y se comprobo el diff. Ningun proceso ajeno fue detenido. No son nuevos
fallos de app demostrados ni se ajustan aserciones o tiempos para hacerlos pasar.

665 reutiliza el protocolo ya existente: ambiente minimo sin claves/proyecto/
emulador impuesto, bloqueo de sockets323, un worker reciclado a512MB. Primero
comprueba siete suites afectadas y solo despues permite la canonica completa.
