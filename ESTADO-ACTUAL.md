# Acá quedé

Última actualización: 11 de agosto de 2026.
Rama: `main`, con la propuesta 943 ya fusionada. No hay propuestas abiertas.

## En qué se estaba

Auditoría de las áreas que nunca se habían revisado: sueldos y empleados, insumos
y proveedores, mensajes automáticos y presentación LED. Más la verificación
completa de salud sobre la versión principal.

## Qué quedó terminado

- **La presentación le mostraba dos precios distintos al cliente.** El cierre
  calculaba su total por su cuenta y se le quedaba afuera toda la comida, además
  de cobrar mal los servicios que van por persona. La pantalla siguiente mostraba
  el total completo. En una fiesta de cien personas con menú eran decenas de miles
  de pesos de diferencia, con el cliente mirando las dos pantallas. Corregido, con
  una guarda para que no vuelva a separarse.
- **Los accesos flotantes de la web pública** volvieron a la esquina: dos botones
  redondos (cotizar y WhatsApp). La tanda anterior los había puesto como barra
  cruzando el pie de pantalla, y tapaba las fotos. Aprobado por el dueño.
- **Aviso de pago duplicado y clave del portal del cliente**: se verificó que ya
  estaban resueltos en tandas anteriores. No hacía falta tocar nada.
- Salud completa sobre la versión principal: acentos limpios, tipos en cero, 1398
  pruebas unitarias, compila, 94 pruebas de navegador y 20 de seguridad de la base.

## Falsas alarmas verificadas (no volver a abrirlas)

- El stock de bebidas **no** se devuelve al archivar una fiesta, y está bien: para
  ese momento las bebidas se tomaron de verdad.
- El conteo de confirmaciones en los recordatorios cuenta invitados y no personas,
  y está bien: se manda un recordatorio por invitado, no por persona.
- Mensajes automáticos: sin hallazgos, está bien cerrado.

## Dónde se perdió tiempo (no repetirlo)

Las pruebas de navegador fallaron dos veces seguidas por el entorno, no por la
app: primero porque Playwright buscaba un navegador que este contenedor no tiene
(hay que pasarle el que está en `/opt/pw-browsers/chromium-1194`), y después
porque el puerto 3100 seguía ocupado por un servidor viejo, así que las pruebas
corrían contra la versión equivocada. **Antes de investigar una falla masiva,
liberar el puerto y confirmar qué navegador se está usando.**

## Lo próximo

Queda una sola mejora sugerida y sin hacer, anotada en `PARA-GEMINI.md`: al
asignar un empleado a dos fiestas del mismo día sólo aparece un aviso, no un
bloqueo. Lo demás pendiente no es programación: son las comprobaciones que
necesitan Firebase de producción, credenciales reales de los proveedores y prueba
física en el salón.
