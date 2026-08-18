# Acá quedé

Hoja de traspaso entre chats. **Corta a propósito**: se lee entera al abrir cada
sesión. Lo histórico va a `ESTADO-AUDITORIA.md`.

Quien cierre una sesión reescribe este archivo. Se pisa, no se acumula.

---

**Última actualización:** 17 de agosto de 2026, cierre.
**Estado de la app:** sana. Verificada sobre `main` **después** de fusionar:
acentos limpios, tipos en cero, 1740 pruebas, compila, 20 de seguridad de la base.
**Propuestas abiertas:** ninguna. **Órdenes pendientes:** ninguna.

## Está todo hecho y todo auditado

Las diecisiete mejoras del plan, y **por primera vez toda la app revisada**: se
barrieron las carpetas de pantallas una por una, no sólo los módulos grandes.

## Lo que apareció en ese barrido (todo arreglado)

- **Cuatro páginas de venta no las podía abrir nadie.** Bodas, quince,
  cumpleaños y la experiencia AK: se le ofrecen a Google, pero el sistema mandaba
  al visitante a la pantalla de contraseña. El prospecto que llegaba desde Google
  o desde un enlace de WhatsApp veía un formulario de ingreso.
- **El QR de la fiesta tampoco funcionaba**: el invitado lo escaneaba y caía en
  el login. Igual la demostración de tecnología que enlaza la presentación LED.
- **Doce pantallas del equipo entraban con una cookie inventada**, entre ellas
  finanzas, ventas, la lista de invitados de la puerta y los números del negocio.

## Lo que falta, y es del dueño

- Pegar el enlace de reseñas de Google en Ajustes → Empresa y prender el
  interruptor. Sin eso las reseñas están hechas pero no sale ninguna.
- Dar el aviso a Google desde su panel.
- Prender el recontacto automático y el asistente de ventas: vienen apagados.
- Poner el tope de gasto mensual, si quiere uno.

## Los permisos de colaborador quedaron resueltos

**Se sacaron los nueve que no funcionaban** (prospectos, presupuestos, clientes,
facturación, personal, proveedores, empresa, contabilidad y calendario). El dueño
lo dejó a criterio de Claude: se eligió sacarlos y no abrirlos, porque abrirlos
significaba dejar entrar con un enlace, y sin cuenta, a la contabilidad y a la
base de clientes.

Quedan los seis del evento, que son los que el fotógrafo, el DJ y el catering
necesitan, y ésos sí llevan la llave.

## Lo que costó y no hay que repetir

- **El contenedor se reinicia y deja el árbol en una versión vieja.** Pasó al
  cierre de esta sesión: una rama nueva salió de un commit de hace días, las
  pruebas bajaron de 1742 a 1507, y el control de acentos "encontró" 425
  problemas que ya estaban arreglados. **Antes de creerle a cualquier control que
  falla de golpe, comparar contra `origin/main` de ahora.** Fusionar eso habría
  borrado cinco propuestas ya fusionadas.
- **Guardar de quién es algo sin comprobar el permiso**, y **pantallas del equipo
  fuera del grupo protegido**: el middleware sólo mira que la cookie exista, no
  que sea válida.
- **Escribir una ficha del CRM a mano en el archivo** para saltear una
  validación: queda sin etapa ni historial y en producción ni llega a la base.
- **Código contra funciones y campos que no existen**: lo agarra el revisor de
  tipos, no las pruebas.
- **Los ayudantes se equivocan seguido.** En esta tanda, de cada tres avisos uno
  era falsa alarma; uno decía que había que ponerle llave a una página de venta.
- **Dos compilaciones a la vez en la misma carpeta** se pisan y dan falla falsa.

## Decisiones del dueño

Descartó el precio variable por fecha, alquilar la app a otros salones y el
"ensayo de la fiesta". `TriviaAdminPanel` queda sin enchufar a propósito.
