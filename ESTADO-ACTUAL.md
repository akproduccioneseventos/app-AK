# Acá quedé

Hoja de traspaso entre chats. **Corta a propósito**: se lee entera al abrir cada
sesión. Lo histórico va a `ESTADO-AUDITORIA.md`.

Quien cierre una sesión reescribe este archivo. Se pisa, no se acumula.

---

**Última actualización:** 17 de agosto de 2026.
**Estado de la app:** sana. Compila, 1705 pruebas en verde, sin acentos rotos.
**Propuestas abiertas:** ninguna. **Orden vigente:** `docs/ordenes/ahora.md`.

## Lo que está terminado

**Dieciséis de las diecisiete mejoras que eligió el dueño**, cada una con su
pantalla anotada en `docs/QUE-HAY-EN-LA-APP.md`.

**El centro de presencia digital está completo:** publica de verdad en Facebook e
Instagram, importa el historial de las cuentas, cruza la publicidad contra las
señas cobradas, y **guarda los números de las redes todos los días con una tarea
que corre sola** (antes sólo se guardaban si alguien abría la pantalla).

## Lo que falta: el recuerdo de cada invitado

Es la última, y está pedida en la orden. **Dos partes ya están hechas** (propuesta
1034, la de plata y permisos que le toca a Claude): la foto del muro ya guarda de
quién es —con candado, sólo si la persona probó tener su enlace personal— y se
dejó de inventar el teléfono `099000000`. La orden está actualizada para que
Gemini no lo rehaga.

**La idea original no se puede hacer y la orden explica por qué:**

- **La app no sabe quién aparece en cada foto.** No hay etiquetas ni
  reconocimiento de caras, y no se va a agregar: caro, se equivoca, y con caras de
  menores es un problema serio.
- **La versión que sí se puede** es "las fotos que sacaste vos". En una fotocabina
  el que la usa sale en la foto, así que rinde casi lo mismo y no cuesta nada.
- **Hoy `guestId` llega al subir la foto y no se guarda.** Ese cambio chico
  habilita todo lo demás, y **sirve de acá en adelante**: lo viejo no se recupera.
- **Lo que hay hoy no es un video**, es un pase de fotos que se mira: no se puede
  bajar ni subir a las historias. Eso es lo que hay que agregar, armándolo en el
  celular del invitado y no en el servidor.
- **El invitado no tiene cómo volver a su enlace al otro día.** Se le muestra una
  sola vez. La orden pide que se lo pueda mandar a sí mismo con un toque.
- **Un teléfono inventado** (`099000000`) se guarda cuando una invitada no deja
  contacto: ensucia la lista de prospectos.

## Lo que costó y no hay que repetir

- **Código escrito contra funciones y campos que no existen.** Lo agarra
  `npx tsc --noEmit` en un minuto.
- **Pantallas escritas que no se pueden abrir.** Preguntar siempre "¿desde qué
  pantalla se ve?".
- **Informes que declaran más de lo que hicieron.** Comparar contra los archivos
  que cambiaron de verdad.
- **Prometer lo que no se puede cumplir**, como guardar una foto que no entra.
- **Frenos que no frenan:** contar por un dato que el visitante escribe.
- **Datos sensibles en archivos versionados.** Pasó con el permiso de publicar.
- **Las órdenes van derecho a `main`.** El build va a los ayudantes.

## Decisiones del dueño

Descartó el precio variable por fecha, alquilar la app a otros salones y el
"ensayo de la fiesta". `TriviaAdminPanel` queda sin enchufar a propósito.
