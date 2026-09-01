# Orden 24 — Decoración: que el cliente VEA cómo va a quedar su fiesta

**Para Gemini. Escrita el 31 de agosto de 2026.**

> **Pedido del dueño:** *"el módulo de decoración hace lo mismo"*, y pasó una app de ejemplo:
> **Creador (Diseñador de fiestas)**.

## Lo investigado, y el patrón del rubro

Se miraron trece: **Creador**, AI Party, AI Event Designer, BalloonBuilder, Balloon Decor AI,
Merri (de Tripleseat), Prismm (antes AllSeated), Social Tables (hoy Cvent), 3D Event Designer,
RoomSketcher, Planner5D, Coohom y Homestyler.

**Se dividen en dos familias:**

- **Las de plano** (Merri, Prismm, Social Tables): dibujan el salón a escala, ponen las mesas,
  cuentan los invitados solos. **Merri tiene un catálogo de 80.000 objetos** y control de luces
  colgantes y de pared.
- **Las de imagen** (Creador, AI Party, AI Event Designer): **subís la foto del salón vacío y la
  inteligencia artificial te lo devuelve decorado**. Creador además convierte un boceto en una
  imagen realista para mostrarle al cliente.

**Dato de mercado:** **Prismm cierra el 31 de diciembre de 2026** y está mudando a sus clientes.
La gente del rubro está buscando reemplazo ahora.

## Lo nuestro, medido

**El módulo tiene tres pantallas** y para trabajar adentro está bien:

- Catálogo propio con **14 categorías** (paneles, cilindros, neón, mobiliario VIP, centros,
  globos, guirnaldas, fundas, iluminación, flores, mantelería, candy bar, fotocabina, entrada)
  — `src/app/(app)/fiestas/nueva/decoracion/page.tsx:67-82`.
- **Tablero de inspiración donde el cliente sube fotos y marca con corazón lo que le gusta** —
  `src/app/portal/[fiestaId]/moodboard/page.tsx:45,70`.
- **Siete estilos con paleta automática** y tres paletas listas, más editor de colores (862-929).
- **Lienzo para armar el diseño**: se arrastra, se agranda, se rota, y se guarda solo (844).
- **Lista de lo que hay que llevar y montar**, por zona, con tildes (854).
- **Muestrario de fiestas anteriores** para arrancar de un diseño ya hecho (`DecoMuestrario.tsx`).
- **Vista 3D del salón** en el configurador de reunión.

**Nada de eso está roto. NO LO REHAGAS.**

## CÓMO SE ENTREGA

**UNA SOLA PROPUESTA.** `npm run "publicar?"` en verde y anotado en `docs/YA-RESUELTO.md`.

---

## BLOQUE 1 — EL CLIENTE NO VE NUNCA LA PROPUESTA FINAL  ← LO MÁS IMPORTANTE

**Verificado.** El portal del cliente tiene menú, música, fotos, invitados, preguntas, muro y
moodboard (`src/app/portal-cliente/[id]/` y `src/app/portal/[fiestaId]/`). **No hay ninguna
pantalla donde el cliente vea la decoración que AK le armó.**

O sea: el cliente sube fotos de lo que le gusta, el equipo arma el diseño... **y el cliente
nunca lo ve**. Se lo cuentan por WhatsApp o en una reunión.

**Qué hacer:** una pantalla en el portal del cliente, **"Así va a quedar tu fiesta"**, que
muestre lo que el equipo armó: el lienzo del diseño, la paleta de colores, la lista de elementos
por zona y las fotos de referencia.

**Con un botón de "Me gusta así" y otro de "Quiero cambiar algo" con un campo para escribir.**

**Ojo, y es importante:** eso **no es aprobar el presupuesto ni cerrar nada**. Es una opinión
sobre la decoración. **No toques plata, no cambies estados de presupuesto, no marques nada como
aceptado.** Eso es de Claude.

**Por qué va primero:** es lo único de esta orden que **hace que el cliente diga que sí más
rápido** y que evita el disgusto del día de la fiesta.

---

## BLOQUE 2 — MOSTRARLE EL SALÓN DECORADO, con la foto de SU salón

Es lo que hacen Creador, AI Party y AI Event Designer, y es lo que más vende: **el cliente ve su
propio salón decorado, no la fiesta de otro.**

**Y no arranca de cero: ya tenemos la parte cara hecha.** El Espejo Mágico genera imágenes con
inteligencia artificial de verdad, con `generateGeminiImage` de `@/lib/ai/gemini-image`, con
control de uso incluido (`src/app/actions/espejo-magico-ai.ts`). **Usá esa misma, no traigas
otra.**

**Cómo funciona:**
1. Se sube **la foto del salón vacío** (o se toma del salón que ya está cargado en la empresa).
2. Se arma el pedido con lo que YA está elegido en la pantalla de decoración: el estilo, la
   paleta y los elementos del lienzo. **El operador no escribe nada.**
3. Devuelve la imagen y **se guarda en la fiesta**, para mostrarla en la reunión y en la
   pantalla del bloque 1.

**EL LÍMITE DE GASTO, Y NO SE NEGOCIA:**

- **Cada imagen se paga.** Poné un tope de **tres imágenes por fiesta** y un botón que diga
  claramente que se está generando una.
- **Nunca en bucle ni automático.** La dispara una persona.
- **Si falla o se pasa del tope, se avisa en criollo** y la pantalla sigue andando.
- **No contrates ningún servicio nuevo.** Si te parece que hace falta otro, **paralo y avisá.**

---

## BLOQUE 3 — El plano para poner las mesas

Merri, Prismm y Social Tables viven de esto, y nosotros tenemos **los datos y no la pantalla**:
ya existen `salonElements`, `salonWidth`, `salonHeight` y `salonPlanBackgroundImageUrl`
(`src/types/fiesta.ts:334`), **y ninguna pantalla deja poner las mesas encima del plano**.

**Qué hacer:** que en el lienzo que ya existe se pueda **poner el plano del salón de fondo** y
arrastrar las mesas encima, con el número de cada una. **Es el mismo lienzo que ya anda: no
hagas uno nuevo.**

**Y lo que hace Merri y es la mejor idea de todas: que cuente los invitados solo.** A medida que
se ponen mesas, que muestre "capacidad: 120 de 140 invitados". Hoy eso se hace con la
calculadora.

**Con esto se conecta con "dónde me siento", que ya existe** (`/evento/mi-mesa/[fiestaId]`): las
mesas que se dibujan son las mismas que busca el invitado. **Un dato, dos pantallas.**

---

## BLOQUE 4 — Qué tiene la empresa y qué está libre esa fecha

**No existe nada.** No hay lista de los elementos físicos que AK tiene ni forma de saber si el
arco de globos grande ya está comprometido para otra fiesta del mismo fin de semana.

**Qué hacer, y que sea simple:** una lista de los elementos de la empresa (nombre, foto,
cantidad) y, al armar la decoración de una fiesta, **que avise si un elemento ya está usado en
otra fiesta de esa misma fecha**. No hace falta un sistema de reservas: **alcanza con el aviso.**

**Ojo:** esto toca el inventario de la empresa. **Si te cruzás con costos, precios o compras,
NO lo toques**: eso es de Claude.

---

## BLOQUE 5 — Que los gastos se sumen solos

Hoy hay un botón que sincroniza los gastos de decoración al módulo de costos
(`syncDecoGastosToModule`, línea 430-443) y **hay que acordarse de tocarlo**.

La regla de la casa dice que lo que puede ser automático, va automático. **Que se sincronice
solo al guardar la decoración**, y que el botón quede igual por si se quiere forzar.

**PERO:** son **costos internos**. **NO los pases al presupuesto del cliente ni cambies ningún
precio.** Eso es de Claude.

---

## Y una cosa vieja que conviene sacar

`src/ai/flows/generate-image-flow.ts` se llama "generar imagen" y **dibuja un cuadrito de
colores en blanco: no genera nada con inteligencia artificial. Y no lo usa nadie.** Cualquiera
que lo lea va a creer que tenemos algo que no tenemos. **Sacalo** (o dejá una nota bien clara de
que es un dibujo de relleno).

---

## LO QUE NO SE TOCA

- **Las tres pantallas del módulo andan** y lo que hacen está bien. Lo de arriba es agregar.
- **El configurador de reunión en 3D**: el dibujo del salón **tiene un problema conocido y hay
  una sesión dedicada pendiente**. **No lo toques**, ni intentes arreglarlo de paso.
- **Plata, cobros, precios, presupuestos y comida: los hace Claude.**
- **Nada que se pague por mes** sin preguntar. **Las imágenes se pagan por unidad: respetá el
  tope de tres por fiesta.**
- **Lo que se ve feo pero anda: se anota, no se toca.**
