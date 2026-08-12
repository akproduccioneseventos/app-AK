# Acá quedé

Última actualización: 12 de agosto de 2026.
Rama: `main`, con las propuestas 943, 944 y 946 fusionadas. No hay propuestas abiertas.

## Lo más importante de esta tanda

**Se estaba dejando de cobrar el ajuste anual.** La marca que lo activa se ponía
en un solo lugar: al facturar. Todo contrato firmado y todavía sin facturar quedaba
sin ella, así que la aplicación mostraba el precio del año en que se firmó. Afecta
de lleno a los 19 contratos cargados de eventos anteriores, con otros precios y la
fiesta por venir. Ahora se activa cuando el presupuesto queda contratado, que es la
regla del dueño. Si él lo apaga a propósito para un cliente, se respeta.

**La presentación mostraba dos precios distintos al cliente.** El cierre calculaba
su total sin la comida y la pantalla siguiente sí la incluía. Corregido, con una
guarda para que no vuelva a separarse.

## Qué quedó terminado

- Pantalla nueva **Auditoría → "Poner al día los eventos"**: sólo lee y muestra
  fiestas pasadas que siguen abiertas, eventos viejos con equipo asignado o tareas
  sin terminar, contratos sin el ajuste anual (con cuánto se deja de cobrar) y
  presupuestos aceptados que nunca se convirtieron en evento.
- Los accesos flotantes de la web volvieron a la esquina, aprobado por el dueño.
- Codex revisó la 946 y marcó cinco cosas: **las cinco eran válidas** y están
  corregidas. La más grave escondía plata: el saldo pendiente no incluía el ajuste.
- Salud completa sobre la versión principal: acentos limpios, tipos en cero, 1416
  pruebas unitarias, compila, 94 de navegador y 20 de seguridad de la base.

## Falsas alarmas verificadas (no volver a abrirlas)

- El stock de bebidas no se devuelve al archivar una fiesta: está bien, para ese
  momento se tomaron.
- Los recordatorios cuentan invitados y no personas: está bien, se manda uno por
  invitado.
- Mensajes automáticos: sin hallazgos.

## Dónde se perdió tiempo (no repetirlo)

Las pruebas de navegador fallaron varias veces por el entorno, no por la app:
Playwright busca un navegador que este contenedor no tiene (pasarle el de
`/opt/pw-browsers/chromium-1194`), el puerto 3100 queda ocupado por servidores
viejos, y al reiniciarse la máquina se borra la versión compilada. **Antes de
investigar una falla masiva: liberar el puerto, confirmar el navegador y compilar.**

## Lo próximo

Sólo queda lo anotado en `PARA-GEMINI.md`: bloquear (no sólo avisar) cuando se
asigna un empleado a dos fiestas que se solapan. Lo demás pendiente no es
programación: son las comprobaciones con Firebase de producción, credenciales
reales de los proveedores y prueba física en el salón.
