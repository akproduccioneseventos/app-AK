# Acá quedé

Hoja de traspaso entre chats. **Corta a propósito**: se lee entera al abrir cada
sesión. Lo histórico va a `ESTADO-AUDITORIA.md`.

Quien cierre una sesión reescribe este archivo. Se pisa, no se acumula.

---

**Última actualización:** 21 de agosto de 2026, cierre.
**Estado de la app:** sana. Acentos limpios, tipos en cero, **2053 pruebas en
verde**, compila, seguridad de la base en verde.
**Propuestas abiertas:** ninguna.
**Órdenes pendientes:** `docs/ordenes/6-la-resena-desde-el-invitado.md` (sin
empezar) y lo que quede de `ahora.md`.

## LO MÁS IMPORTANTE: el sexto control que faltaba

Los cinco controles de siempre —tipos, pruebas, build, acentos, seguridad— **no
ven lo que ve el usuario**. Por eso, con todas las auditorías hechas, siempre
saltaba algo nuevo: el píxel que no existía, los carteles de "conectado" sin nada
detrás, las tareas que no corrían.

**La app tiene 596 pruebas que abren la aplicación en un navegador de verdad, y no
se corrían nunca.** Ni Codex, ni Gemini, ni Claude. Ese era el agujero.

**Ahora es el sexto control obligatorio: `npm run test:e2e`.** Está en
`CLAUDE.md` con las dos trampas que dan fallas inventadas.

### Cómo se corren sin perder horas

- **En tandas de 3 o 4 archivos**, compilando una sola vez antes. La tanda entera
  de una no termina en este contenedor.
- **El servidor se degrada** después de 6 o más archivos seguidos: todo lo que
  sigue falla al instante. **La señal para distinguir:** una falla real tarda 45 a
  60 segundos; una falsa falla en menos de medio segundo. Con eso se descartaron
  **10 falsas alarmas** de 15.
- **Un servidor viejo ocupando el puerto 3100** hace que se pruebe contra una
  versión anterior. Dio una falla que parecía gravísima —el prospecto llegaba al
  final del simulador y no tenía cómo cerrar la compra— y era eso. **Reiniciar y
  repetir sólo esa prueba antes de creerle a una falla.**

### Resultado del primer barrido completo

**89 pasaron, 3 fallaron, y las tres eran pruebas viejas, no fallas de la app:**
buscaban un texto renombrado ("Video Analógico" → "Video Grabado"), una promesa
que se sacó a propósito ("en 15 minutos"), y una referencia de maquetación que
cambió porque se enchufaron al menú las pantallas que estaban sin puerta. Las tres
corregidas.

## `npm run auditoria`: cómo leer sus números

Cuenta cosas sobre los archivos, no opina, no usa inteligencia artificial. Última
corrida: **4 tareas sin rastro, 137 huérfanos, 1 dato simulado, 120 promesas.**

**No son 262 problemas.** Los 120 son frases para contrastar y casi todas son texto de
venta correcto; las tres que importaban ya se verificaron y **son ciertas**. El dato
simulado es un falso positivo verificado. Todo eso está anotado en
`docs/YA-RESUELTO.md`: **leelo antes de volver a revisarlas.**

De las 31 pantallas sin puerta quedan **9, y son exactamente las que no deben tener
enlace**: son redirecciones para que un enlace viejo no muera.

## Las puertas: de 84 a 49, y una fuga seria

**Cualquiera podía mandarle avisos falsos al cliente.** Las funciones que mandan el
correo de "pago confirmado" y "pago rechazado" eran direcciones abiertas: con sólo
saber el número de una fiesta se podía hacer que la aplicación le mandara al cliente
un mail firmado por AK con el monto que se quisiera. La pantalla donde el equipo
aprueba sí pedía cuenta; el agujero era que se podía saltear la pantalla. Cerrado.

**De las 84 que figuraban abiertas, 49 lo estaban sólo en apariencia.** Casi todo lo
que toca una fiesta escribe a través de `saveFiesta`, que adentro pide sesión del
equipo o la clave del cliente de esa fiesta: la comprobación estaba un nivel más abajo
y el control no la veía. Ahora la reconoce, **exigiendo además que la función no
escriba nada por su cuenta**, así que no se aflojó nada.

> **Lo que enseña:** antes de agregar una comprobación, mirá si no está ya un nivel más
> abajo. Ponerla dos veces no protege más y esconde dónde está la de verdad.

Quedan **49**, y son casi todas de leer contenido público: blog, catálogo, promos,
galería, simulador, portal del proveedor con su token.

## Lo otro que se cerró hoy

- **El cartel de las cuentas bancarias mentía.** Decía que se sincronizaban con cada
  fiesta; sólo se copian a una fiesta que aún no tiene ninguna. Si el dueño cambia su
  cuenta, las fiestas viejas le siguen mostrando la anterior al cliente.
- **A la entrega de la orden 5 se le sacó la configuración de cobros de Mercado Pago**,
  que venía a medias: apagaba el modo de prueba (dinero real) sin la llave que valida
  los avisos de pago. Prender los cobros es una decisión aparte del dueño.
- **Cuatro pantallas escondidas ya tienen puerta**: compras, alergias, portal de
  proveedores y cláusulas de contrato.

## Lo que depende del dueño

**Nada urgente.** Sólo conectar tres cuentas cuando quiera: Google Workspace, búsqueda
de canciones en Spotify y el puntaje de Google en el panel.

## Decisiones cerradas que NO se vuelven a preguntar

- **No se toca nada que aumente lo que cobra Firebase.** El servidor se queda dormido
  a propósito. Si una auditoría lo marca como problema de velocidad, es falso
  positivo: la app contesta entre 5 y 25 milésimas y las páginas de venta salen
  armadas de antes, así que el prospecto que llega de Google no espera.
- **Anotarse en directorios gratis: descartado (21 de agosto).**
- **La reseña la pide la aplicación, también al invitado (21 de agosto).** Falta sólo
  el botón, en la orden 6.
- **El video de vida no lo toca la app.**
- **La llave de cobros no se cambia.** Se le propuso dos veces; dijo que no.
- **El WhatsApp es su número personal.** Ningún bot general, nunca.
- Los testimonios de las páginas de venta **son reales**.
- No tiene local físico: la ficha va sin dirección, con zona de cobertura.
