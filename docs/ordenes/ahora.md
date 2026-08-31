# LO QUE SE HACE AHORA — orden única vigente

**Escrita el 31 de agosto de 2026. Reemplaza cualquier otra.** Las órdenes 20, 21, 22 y 23
siguen valiendo como **el detalle** de cada tanda; **esta dice en qué orden se hacen y qué va
primero**.

## La regla de siempre

**Una sola propuesta por tanda, con todos los bloques adentro.** Cada fusión dispara un
despliegue y se paga. Si un bloque se traba, **entregá el resto igual en la misma propuesta** y
avisá cuál faltó. Antes de dar por terminada: **`npm run "publicar?"` completo en verde**, y lo
anotado en `docs/YA-RESUELTO.md`.

---

# TANDA 1 — LOS DISEÑOS DE INVITACIÓN  ← ESTO PRIMERO, ANTES QUE TODO

**El dueño los pidió hace tiempo y NUNCA QUEDARON ESCRITOS EN UNA ORDEN.** Se buscó en todas:
lo único que hay son arreglos a las dos que existen. **Se perdió el pedido.** Por eso va
primero.

**Hoy hay DOS diseños**, Grazia y Allegria (`src/components/invitacion/templates/`). **Zola
tiene más de 300 y Joy vive de eso.** Para una novia o una quinceañera **el diseño es la
decisión de compra**: si no encuentra el que le gusta, se va a otro lado.

**Es lo único de todo el trabajo pendiente que hace ganar o perder una venta. Por eso es lo
primero.**

El detalle está en **`docs/ordenes/23-la-web-y-la-red-social-del-evento.md`, bloque 1**: seis
diseños nuevos —quince moderno, quince clásico, casamiento minimalista, casamiento campo, fiesta
de noche y corporativo—, todos con la estructura de secciones que ya existe, respetando el color
de la fiesta y mostrando el mapa.

**No rehagas Grazia ni Allegria: andan.** Y entregá **los seis en una sola propuesta**.

## Y en la MISMA propuesta, la RED SOCIAL DE LA FIESTA

Es la misma orden 23 y va junto, no aparte. Cuatro cosas, todas medidas:

1. **"¿Dónde me siento?" existe y el invitado NO LLEGA.** La pantalla está hecha y anda
   (`/evento/mi-mesa/[fiestaId]`), pero desde la red social no hay por dónde entrar: hace falta
   un QR aparte que genera el equipo. El invitado que está adentro sacando fotos **no puede
   buscar su mesa**. **Es un enlace, no una pantalla nueva: no la copies, enlazala.**
2. **El cronograma no se ve durante la fiesta.** La invitación lo muestra antes; en la red
   social no está, y es lo que más se pregunta en una fiesta: *"¿a qué hora es la torta?"*. Es
   el mismo dato que va a la pantalla gigante: **un dato, dos pantallas**.
3. **Bajar sus propias fotos.** No se encontró el botón. Si está, dejalo y decilo.
4. **Un ranking simpático**: el que más subió, la foto más querida, el que cumplió más misiones.
   **Sin premios y sin dejar mal a nadie.**

**Lo que la red social ya tiene y NO se toca:** subir fotos y videos, ver las de los demás, me
gusta, comentarios, chat, misiones, pedir canciones, dejar mensajes al homenajeado, y se entra
sin instalar nada y sin dar mail ni teléfono.

---

# TANDA 2 — El recorrido de las 353 pantallas y la lista automática

Detalle en **`docs/ordenes/21-el-recorrido-de-todas-las-pantallas.md`**.

Y una cosa que el dueño precisó y **es la parte que no puede faltar**:

> *"Hay que anotar lo auditado con este y los demás mecanismos, una lista automática, para no
> repetir."*

**La lista NO se llena a mano.** `docs/LO-AUDITADO.md` tiene hoy las líneas escritas a mano de
lo que se auditó el 31 de agosto, y con eso alcanza para arrancar; **de ahí en adelante la
llenan los mecanismos solos.**

Cada mecanismo, al terminar, **escribe qué miró y con qué método**:

| Mecanismo | Qué anota | Nivel |
|---|---|---|
| El recorrido de todas las pantallas | cada pantalla que abrió | 4 |
| Las pruebas de navegador que comprueban resultado | cada pantalla que comprobó | 5 |
| Las fotos de pantalla | cada pantalla fotografiada | 6 |
| `npm run lo-que-se-dijo:todo` | lo que no llama nadie y lo que no tiene prueba | 2 |
| Las pruebas de siempre (jest) | lo que cubren | 3 |

**Las tres reglas de la lista, y no se negocian:**

1. **El método más fuerte gana.** Una pantalla anotada en nivel 5 **no baja a 4** porque el
   recorrido la abrió después.
2. **Lo que está en nivel 4 o más NO se vuelve a auditar** salvo que se lo toque. Eso es lo que
   evita repetir.
3. **La fecha se guarda.** Si una pantalla se modifica después de la fecha en que se auditó,
   **vuelve a contar como sin auditar**, sola, sin que nadie se acuerde.

Y que el número se vea al final de la puerta: **"auditadas de verdad: X de 353"**.

---

# TANDA 3 — La pantalla gigante

Detalle en **`docs/ordenes/22-la-pantalla-gigante.md`**.

**Ojo: nuestra pantalla ya es mejor que las trece plataformas miradas.** Lo que falta es poco y
está listado. **Arrancá por el afiche del QR para imprimir** (bloque 6.c): sin afiche en las
mesas, la gente no sabe que puede subir fotos, y es lo que más rinde de toda esa orden.

**Ya está hecho por Claude y no lo toques:** las dedicatorias, que estaban apagadas con un
candado en el código.

---

# TANDA 4 — Las estaciones de entretenimiento

Detalle en **`docs/ordenes/20-que-las-estaciones-tengan-todo.md`**, que trae adentro la
investigación de trece plataformas y la configuración de las tres más completas.

**Arrancá por el bloque 1**, que es cambiar el fondo con y sin telón: es la función que más se
vende del rubro y en toda nuestra app no existe.

---

## Y lo que vale para las cuatro tandas

- **No se cambia lo que ya funciona.** Lo que anda pero se ve mejorable **se anota en una línea
  al final del reporte** y decide el dueño.
- **Plata, cobros, comida y permisos los hace Claude.** Si te cruzás con algo de eso, avisá.
- **Nada que se pague por mes** sin preguntar antes.
- **Nunca una prueba escrita para que un control se calle.** Si pasaría igual con la app rota,
  no sirve.
