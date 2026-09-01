# Orden 23 — La invitación digital y la red social de la fiesta

**Para Gemini. Escrita el 31 de agosto de 2026.**

> **Pedido del dueño:** *"hacé lo mismo con la web del evento y la red social del evento"* —el
> mismo método que con el entretenimiento y la pantalla gigante: investigar el rubro, medir lo
> nuestro con archivo y línea, y pedir sólo lo que falta.

## Lo investigado

**Zola, The Knot y Joy** son las tres grandes de la web de casamiento, y las tres son gratis en
lo básico. **Zankyou, la española, la compró The Knot en 2023**, así que en habla hispana quedó
casi todo en el mismo dueño. Para la red social de la fiesta se miró **Whova**, que es la que
más engancha en eventos.

**Ninguna de ellas organiza la fiesta.** Son la web y la lista de regalos; no tienen estaciones,
ni pantalla gigante, ni presupuesto, ni proveedores. Eso es nuestro y no hay que tocarlo.

## Antes que nada: DOS avisos que resultaron FALSOS

Un ayudante reportó que la invitación **no muestra el mapa** y que las **preguntas frecuentes
están vacías**. **Se abrieron los archivos: las dos cosas andan.**

- El mapa se muestra: `GraziaTemplate.tsx:472` y `AllegriaTemplate.tsx:343`.
- Las preguntas frecuentes se dibujan: `invitacion-publica-client.tsx:1413`.

**No las toques.** Si aparecen de nuevo en una auditoría, son falso positivo.

## CÓMO SE ENTREGA

**UNA SOLA PROPUESTA.** `npm run "publicar?"` en verde y anotado en `docs/YA-RESUELTO.md`.

---

## BLOQUE 1 — SÓLO HAY DOS DISEÑOS DE INVITACIÓN  ← LO MÁS IMPORTANTE

**Contado:** en `src/components/invitacion/templates/` hay **dos**, Grazia y Allegria.

**Zola tiene más de 300 y Joy vive de eso.** Para una quinceañera o una novia, **el diseño es la
decisión**: si no encuentra el que le gusta, se va a buscarlo a otro lado. Es de lo poco de esta
orden que **hace ganar o perder una venta**.

**Qué hacer: seis diseños más**, que compartan la misma estructura de secciones que ya existe
(portada, cuenta regresiva, detalles, cronograma, galería, regalos, vestimenta, preguntas,
confirmación) y cambien **el ánimo**:

1. **Quince años moderno** — colores fuertes, tipografía grande.
2. **Quince años clásico** — dorado y serif.
3. **Casamiento minimalista** — blanco, mucho aire.
4. **Casamiento campo** — verdes, texturas naturales.
5. **Fiesta de noche** — oscuro con neón, para cumpleaños de 18 y 21.
6. **Corporativo sobrio** — para los eventos de empresa.

**Cada uno tiene que respetar el color de la fiesta y mostrar el mapa**, como ya hacen los dos
que están. **No rehagas Grazia ni Allegria: andan.**

**La prueba:** que cada diseño nuevo se abra con la fiesta de prueba y muestre las secciones que
tiene cargadas, sin texto técnico y sin secciones vacías.

---

## BLOQUE 2 — "DÓNDE ME SIENTO", que existe y el invitado no encuentra

**Verificado:** la pantalla existe (`/evento/mi-mesa/[fiestaId]`) y el equipo puede sacar su QR
desde la pantalla de invitados (`src/app/(app)/fiestas/nueva/invitados/page.tsx:488`). **Pero
desde la red social de la fiesta no hay forma de llegar.**

O sea que el invitado que está adentro de la app, sacando fotos, **no tiene por dónde buscar su
mesa** salvo que alguien le haya pasado ese QR aparte.

**Qué hacer:** un acceso a "¿Dónde me siento?" **desde la red social del evento y desde el hub**.
Es un enlace, no una pantalla nueva: **la pantalla ya está hecha y anda**.

**Ojo con esto:** una pantalla vive en un solo lugar. **No la copies**: enlazala.

---

## BLOQUE 3 — El cronograma, que el invitado no ve durante la fiesta

La invitación **sí** muestra el cronograma antes del evento. **Durante la fiesta, en la red
social, no está** (las secciones son `feed | songs | dedications | chat | poll | game |
missions`).

Es lo que más pregunta un invitado en la fiesta: *"¿a qué hora es la torta?"*.

**Qué hacer:** una sección más con **"qué viene ahora"**, del mismo cronograma que ya usa la
invitación. **Si la fiesta no tiene cronograma cargado, la sección no aparece.**

Va junto con el bloque 2 de la orden 22 (la pantalla gigante también lo va a mostrar): **es el
mismo dato en dos pantallas, no dos datos**.

---

## BLOQUE 4 — Que el invitado pueda bajar SUS fotos

En la red social se ve el muro de todos, pero **no se encontró un botón para que el invitado se
baje las suyas**. Si está, dejalo como está y decilo en el reporte.

Si no está: un botón "Bajar mis fotos" en su propio perfil.

**Recordá la decisión del dueño:** las fotos del muro **se bajan con el enlace directo, a
propósito**, para que cualquiera que tenga el enlace pueda bajarlas. **No agregues trabas.**

---

## BLOQUE 5 — El ranking de invitados

Whova lo usa para que la gente participe, y en la pantalla gigante **ya tenemos** el ranking de
la foto más querida. **En la red social no hay ninguno.**

**Qué hacer, y que sea simpático, no competitivo:** "el que más fotos subió", "la foto más
querida de la noche", "el que cumplió más misiones". **Sin premios y sin exponer a nadie**: es
para divertir, no para dejar mal a los que no participaron.

---

## LO QUE NO SE COPIA, por decisión tomada

- **Pedirle mail o teléfono al invitado.** Hoy entra sólo con el nombre, y así se queda.
- **Mandar la invitación sola por mensaje.** La app **prepara**; **manda una persona.**
- **Lista de regalos con cobro adentro de la app.** Los datos para transferir ya están
  (`datosBancarios`) y con eso alcanza: **cobrar es de las cuatro cosas que no se automatizan.**
- **Hoteles y viajes** (Zola y Joy lo tienen para casamientos de destino). Acá casi todas las
  fiestas son locales. **Si el dueño lo pide, se agrega; no lo hagas ahora.**

## LO QUE NO SE TOCA

- **La invitación anda y está completa**: portada, confirmación con menú y alergias, cuenta
  regresiva, cronograma, regalos con datos bancarios, vestimenta, galería, mapa, preguntas
  frecuentes, compartir por WhatsApp y enlace propio para cada invitado. **Sólo faltan diseños.**
- **La red social anda**: subir fotos y videos, ver las de los demás, me gusta, comentarios,
  chat, misiones, pedir canciones y dejar mensajes. **No la rehagas.**
- **Plata, cobros, comida y permisos: los hace Claude.**
- **Lo que se ve feo pero anda: se anota, no se toca.**
