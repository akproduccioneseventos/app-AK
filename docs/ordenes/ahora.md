# LA ORDEN: la última mejora antes de publicar. Que la app venda.

**Para:** Gemini (Antigravity)
**Escrita:** 23 de agosto de 2026.

**Esto NO son errores.** La app está sana, auditada entera y sin fallas conocidas.
Esta orden sale de mirarla con ojo de vendedor antes de publicarla: **dónde se
enfría una venta y dónde se está dejando de vender.**

## Cómo se entrega

**UNA SOLA propuesta con los cinco bloques adentro.** Si un bloque se traba,
entregá el resto igual, en la misma propuesta, avisando cuál faltó y por qué.

**Arrancá desde la versión principal de ahora.** Antes de tocar nada, leé
`docs/MANUAL-DE-LA-APP.md` y `docs/YA-RESUELTO.md`.

**Antes de fusionar:** tipos en cero, pruebas en verde, `npm run check:acentos`
limpio y `npm run build` que termine bien.

## Lo que NO hay que tocar (ya verificado, funciona)

- **El precio de la Presentación LED sí se actualiza en vivo** cuando cambian los
  invitados. Se reportó como roto y es falso: está atado a esos valores.
- **El Club Uruguay sí es un botón** y dice "hacé click para seleccionar".
- **El total del presupuesto ya coincide con el del portal** (arreglado el 23 de
  agosto: los dos usan `getBudgetCollectibleTotal`).
- **Decisiones del dueño, no errores:** el ajuste anual del 15%, el descuento del
  50% del Salón Club Uruguay y el descuento del presupuesto son marketing suyo.
  La reseña se pide a todos por igual, sin premio.

---

## BLOQUE 1 — El invitado tiene que poder hablarte (lo que más plata deja)

**La idea que manda:** *el invitado que usa la fotocabina es el cliente de la
fiesta del año que viene.* Está adentro de tu producto, emocionado, con el celular
en la mano. **Es el prospecto más caliente del año.**

**El problema:** casi no se entera de quién organizó todo eso. En el álbum, el
crédito "Organizado y capturado por AK Producciones" está en letra chica al pie
(`src/app/evento/album/[fiestaId]/page.tsx`), y lo único que se le ofrece es el
simulador de presupuesto, que es para alguien frío que llega de Google.

**Qué hacer:**

1. **Un botón de contacto directo por WhatsApp** en el álbum y en el hub del
   invitado, junto al de presupuesto. Texto en criollo, del tipo *"¿Querés algo así
   para tu fiesta? Escribinos"*. **Discreto, no invasivo**: el invitado está
   disfrutando una fiesta, no comprando.
2. **Que se vea quién lo hizo**, sin gritar: el crédito de AK en el álbum, con el
   logo, en un tamaño que se lea. Hoy es texto gris chico.
3. **Que el mensaje de WhatsApp llegue con contexto**: que el equipo sepa que esa
   persona escribe desde el álbum de la fiesta de tal, no desde la web. Un
   prospecto que ya vio el trabajo se atiende distinto.
4. **En las estaciones que capturan** (fotocabina, espejo, tótem, plataforma 360),
   después de que la persona se lleva su foto: un cierre corto del tipo *"Esto lo
   hizo AK Producciones"* con el mismo botón. **Después de la foto, nunca antes.**

**Cuidá esto:** no puede molestar ni tapar la experiencia. Si queda invasivo, el
dueño lo va a sacar y perdemos las dos cosas.

---

## BLOQUE 2 — La reunión: tres cosas que cierran

En la Presentación LED (`src/app/presentacion-led/`), con el cliente sentado
enfrente:

1. **Ofrecer el Salón Club Uruguay SIEMPRE, no sólo a quien dice "no tengo
   salón".** Hoy sólo aparece en ese caso. **El que viene con otro salón medio
   decidido nunca ve las fotos del Club**, y es justo al que se le puede dar vuelta
   la cabeza. Una pantalla propia del Club, con fotos que luzcan, capacidad y el
   descuento, disponible en cualquier momento de la presentación.

2. **Un paquete integral con precio de combo.** Hoy el cliente ve servicios
   sueltos y suma de a uno. **Mostrale que todo junto sale menos que por
   separado**: qué incluye, qué no, y el ahorro en pesos. Es la venta más fácil y
   más grande. Los precios salen del catálogo, nunca inventados.

3. **Poder compartir la propuesta.** El cliente está en la reunión; su pareja está
   en casa. **Un enlace con lo que armaron**, para que lo vea después sin empezar
   de cero. Hoy la decisión se enfría hasta la próxima reunión.

**Y una de confianza:** en `/contabilidad/comercial-360` hay un ejemplo con un
total de $680.000 que **no dice en ningún lado que es un ejemplo**. Si alguien
muestra esa pantalla en una reunión, el cliente puede tomarlo como precio real.
**Que diga "EJEMPLO" en grande y sin posibilidad de confusión.**

---

## BLOQUE 3 — El cliente contratado: dejalo sumar extras

**El contexto:** abre su portal solo, a las once de la noche, desde el celular,
emocionado con la fiesta de su hija. **Es el mejor momento para venderle algo, y
hoy no hay dónde.**

1. **Una sección de extras contratables** en el portal del cliente: una hora más
   de banda, fotos adicionales, una estación más. Que vea qué tiene contratado y
   qué puede sumar, con el precio.
2. **Que pedirlo sea un toque**: no un formulario. Toca "me interesa" y **queda un
   mensaje preparado en la bandeja** para que una persona lo atienda. **No se cobra
   solo ni se agrega solo al contrato**: eso lo confirma el equipo.
3. **Que el portal abra celebrando lo que contrató**, no con un panel de finanzas:
   qué está incluido, con íconos, en tono humano. Hoy abre en números.
4. **Que cada pantalla que ofrece un cambio tenga cómo preguntar** (el WhatsApp
   está sólo al pie).

---

## BLOQUE 4 — El prospecto que llega de Google

En `/simulador-de-presupuesto`:

1. **El contador de 15 minutos**: hoy aparece un reloj que corre después de generar
   el presupuesto. La intención es buena, pero a alguien que quiere sentarse a
   leerlo tranquilo le suena a apuro. **Cambialo por algo que sume en vez de
   apurar**: "Te guardamos este presupuesto por 7 días" o directamente sacalo.
   **La urgencia falsa hace desconfiar.**
2. **Que se pueda volver a editar el presupuesto** después de generarlo. Hoy sólo
   se puede bajar el PDF o abrir WhatsApp. El que piensa "es caro, quiero sacar el
   DJ y ver cuánto baja" **no puede, y se va**. Un botón "Modificar mi presupuesto"
   que vuelva al paso anterior sin perder nada.
3. **Mostrar el plan de pagos en el presupuesto**, no sólo el total. Ver "$120.000"
   de una asusta; ver "seña ahora y el resto en cuotas" decide. **Es un acelerador
   de decisión.**
4. **La aclaración del Club Uruguay tiene que verse.** Está bien explicado que el
   alquiler se paga aparte en el Club, pero está al final y en letra chica. Que se
   lea junto al precio, no debajo de todo. **Que nadie se sienta sorprendido
   después: eso arruina la relación antes de empezar.**

---

## BLOQUE 5 — Los textos que ve el cliente

Repasá los carteles del portal del cliente y del simulador con esta regla:
**decir qué hacer, no sólo qué pasó**, y hablar como habla el dueño.

- Hay un cartel que dice *"AK todabia no cargo este dato"* — **con falta de
  ortografía** y sin decir qué hacer. Buscá si hay más así.
- "Sin presupuesto cargado aún" → decí cuándo lo va a tener y a quién escribirle.
- Los montos: en pesos, con separador de miles, **sin decimales**, y diciendo de
  qué son y hasta cuándo.
- **Nunca culpar al cliente**: "No pudimos procesar el pago", no "Ingresaste mal
  los datos".

---

## Lo que no se toca

- `apphosting.yaml`: el servidor se duerme a propósito.
- Nada que aumente lo que se paga por mes.
- **El WhatsApp prepara mensajes y no los manda.** Vale también para los extras del
  portal y para el contacto del invitado: **se preparan, los manda una persona.**
- **Ningún precio se inventa**: todos salen del catálogo.
- Si tocás o agregás una pantalla, **corré `npm run mapa:generar`** y anotá el
  cambio en `docs/YA-RESUELTO.md`, en la misma propuesta.

## Y esta lista está cerrada

Son cinco bloques. **Hacé eso y nada más.** Si ves algo roto de verdad mientras
trabajás, arreglalo y decilo en una línea. Si no está roto y el dueño no lo pidió,
no existe.
