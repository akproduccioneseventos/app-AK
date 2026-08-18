# Acá quedé

Hoja de traspaso entre chats. **Corta a propósito**: se lee entera al abrir cada
sesión. Lo histórico va a `ESTADO-AUDITORIA.md`.

Quien cierre una sesión reescribe este archivo. Se pisa, no se acumula.

---

**Última actualización:** 18 de agosto de 2026.
**Estado de la app:** sana. Verificada sobre `main` después de fusionar: acentos
limpios, tipos en cero, 1780 pruebas, compila, 20 de seguridad de la base.
**Propuestas abiertas:** ninguna.
**Orden vigente para Gemini:** `docs/ordenes/ahora.md` — el panel de presencia
digital, cuatro bloques, **una sola propuesta**.

## Lo que sigue, por orden

1. **Gemini tiene que hacer la orden de `docs/ordenes/ahora.md`.** Ya está
   escrita, con la lista de lo que existe y no debe rehacer.
2. **Cuando entregue, revisarla** con la habilidad `revisar-pr`. Ojo especial:
   que nada se publique sin que el dueño haya aprobado ese posteo.
3. **Lo del dueño** (no lo puede hacer una IA, es en su aplicación andando):
   pegar el enlace de reseñas de Google en Ajustes → Empresa y prenderlo, dar el
   aviso a Google desde su panel, prender el recontacto y el asistente de ventas,
   y poner el tope de gasto mensual si quiere.

## Lo hecho el 18 de agosto

- **El panel de redes mostraba números inventados.** 1420 seguidores, 5240 de
  alcance, 4,9 de puntaje en Google con 38 opiniones: todos escritos a mano, y la
  tarea diaria los guardaba como si fueran medidos. Ahora lo que no se midió va
  vacío y dice "sin dato".
- **Los nueve permisos "generales" de los accesos de colaborador se sacaron.** No
  funcionaban: el colaborador tocaba el botón y caía en el login. Se eligió
  sacarlos y no abrirlos, porque abrirlos era dejar entrar con un enlace, sin
  cuenta, a la contabilidad y a la base de clientes.
- **Se verificaron las diez integraciones del informe 360.** Cuatro andan, dos
  esperan una clave, cuatro y media no existen. Está en
  `docs/QUE-HAY-EN-LA-APP.md`.

## Lo que se descubrió y NO está resuelto

- **La aplicación no manda ningún mail.** Ni confirmación de asistencia, ni nada.
  No hay Resend ni ningún otro. Si alguien promete correos, hoy no salen.
- **El buscador de canciones de Spotify aparece en la invitación y da error.** Al
  invitado le parece roto. O se cargan las credenciales o conviene esconderlo.
- **Programar una publicación no hace nada.** Está en el bloque 1 de la orden.
- **El botón "generar desde fiesta" no usa inteligencia artificial**: son cuatro
  textos fijos donde sólo cambia el nombre del evento. Bloque 2 de la orden.
- **El informe 360 sobrevende.** Dice "implementado" de cosas que no existen. No
  tomarlo como inventario: el inventario verificado es
  `docs/QUE-HAY-EN-LA-APP.md`.

## Lo que costó y no hay que repetir

- **El contenedor se reinicia y deja el árbol en una versión vieja.** Pasó dos
  veces el 17 y 18 de agosto. Una rama nueva salió de un commit de días atrás,
  las pruebas bajaron de 1742 a 1507 y un control "encontró" problemas ya
  arreglados. **Fusionar eso habría borrado cinco propuestas ya fusionadas.**
  Ante un control que falla de golpe, lo primero es comparar contra `origin/main`
  de ahora. Y conviene subir el trabajo apenas compila, no al final.
- **Que exista un archivo no quiere decir que funcione.** Lo que decide es si
  alguna pantalla lo llama. Con eso aparecieron: pantallas del equipo sin
  guardia, páginas de venta que nadie podía abrir, y cinco integraciones
  inexistentes dadas por hechas.
- **Los números inventados son el peor defecto**, porque no se ven y se toman
  decisiones con ellos.
- **Los ayudantes se equivocan seguido.** Uno dijo que había que ponerle llave a
  una página de venta; otro dio por hecha una integración con IA que eran
  plantillas. Verificar cada hallazgo antes de tocar nada.
- **Escribir una ficha del CRM a mano en el archivo** para saltear una validación:
  queda sin etapa ni historial y en producción ni llega a la base.

## Decisiones del dueño

- Las redes son: Instagram `akproduccionesfiestasyeventos`, Facebook
  `akproduccionessalto`, TikTok `@akproduccioneseve`, X `@AkSalto`, más YouTube y
  Threads. **Confirmadas por él el 18 de agosto**, no se cambian.
- El sitio es `akproducciones.uy`.
- Descartó el precio variable por fecha, alquilar la app a otros salones y el
  "ensayo de la fiesta". `TriviaAdminPanel` queda sin enchufar a propósito.
