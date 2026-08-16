# Lo que hay que hacer ahora — que impresione, no que "esté bien"

**Para:** Gemini (Antigravity)
**Escribe:** Claude
**Fecha:** 16 de agosto de 2026
**Base:** `main` actualizado. Sincronizar antes de empezar.

Ésta es la **única orden vigente**. **Todo va en UNA SOLA PROPUESTA.** Si un
bloque se traba, entregá el resto y decí cuál faltó.

## PRIMERO: esto se mira en el CELULAR

**El dueño lo dijo así: "el móvil es donde se va a ver casi siempre".**

No es un detalle de implementación: **cambia qué es lo importante**. Todo lo que
está acá abajo **se diseña y se prueba primero en celular**, y después se revisa
que no se haya roto en computadora. No al revés.

- Si una decisión se ve bien en computadora y regular en celular, **está mal**.
- Los botones tienen que entrar cómodos para un dedo, no para un mouse.
- El texto tiene que leerse **con el celular en la mano, en un salón, de pie**.
- Sacá las fotos de celular y miralas: son las que valen.

## El cambio de vara

Hasta ahora se buscó lo que estaba **mal**: textos cortados, jerga, cosas
tapadas. Eso está limpio: se miraron las 243 pantallas y los trece hallazgos se
arreglaron.

**Esto es otra cosa.** El dueño pidió que la app **impresione**. La vara es:

> **¿Se la mostrarías a un cliente al lado de una plataforma paga, sin pedir
> disculpas?**

Una pantalla puede no tener ningún defecto y aun así no pasar esa prueba, porque
le falta alma: no tiene una foto donde debería, la espera es una rueda pelada, o
muestra ropa sucia de la casa. Eso es lo que hay que arreglar acá.

**Ninguno de estos bloques es un error.** Son la diferencia entre "está bien" y
"qué bueno esto".

---

# BLOQUE A — El portal del cliente no tiene una sola foto

`src/app/portal/c/[accessKey]/PublicPortalClientExperience.tsx`

Es **la pantalla más importante que ve el cliente**: su portal, el de su fiesta.
Hoy la portada es **un degradado oscuro y liso**. Nada más. Ni una foto del
salón, ni de la fiesta, ni del evento.

Un portal de una plataforma paga abre con una imagen grande que emociona. El
nuestro abre con un fondo gris oscuro.

**Qué hacer:**

- Que la portada use **una foto grande, a todo lo ancho**: la del salón
  contratado, o la de la fiesta si ya pasó, o una del catálogo según el tipo de
  evento. Con un velo oscuro encima para que el texto se lea.
- **Ya existe de dónde sacarla:** los salones tienen fotos cargadas y hay un
  catálogo de fotos por tipo de evento. Usá lo que haya, en ese orden.
- Si no hay ninguna, un degradado **con el color del evento**, no un gris.
- El nombre de la fiesta tiene que quedar **grande y sobre la foto**, como una
  portada de revista.

# BLOQUE B — El cliente no tiene que leer notas internas del equipo

`PublicPortalClientExperience.tsx:1123-1133`

Cuando faltan datos, el portal del cliente muestra este cartel amarillo:

> **Este portal todavía necesita datos reales.**
> Falta completar nombre, link, fecha o presupuesto antes de enviarlo al cliente
> final.

**Eso lo lee el cliente.** Está hablando *sobre él* —"antes de enviarlo al
cliente final"— en su propia pantalla. Es ropa sucia de la casa colgada en la
puerta de entrada.

**Qué hacer:** ese aviso es **para el equipo**, así que va donde lo ve el equipo:
en la pantalla interna del portal (`fiestas/nueva/portal-cliente`), no en la
página pública. En el portal del cliente, si faltan datos, **no se muestra nada
raro**: se muestra lo que sí está.

# BLOQUE B2 — En el celular, la fiesta del cliente parece un dato técnico

**Éste y el A son los dos que más levantan la app.** Los dos son la misma
pantalla, que es la que más importa.

Abrí `capturas/celular-portal-del-cliente-primera-vista.png` y miralo.

Lo que ve el cliente cuando entra al portal de **su** fiesta, en el celular:

- Arriba, **tres etiquetas peleándose**: "PORTAL VIP", "AK Producciones" y
  "Faltan datos". Ninguna es lo que él vino a ver.
- Abajo, la información de la fiesta —la fecha, la hora, el salón, **"¡Es
  hoy!"**— metida en **cuatro cajitas grises chicas**, una debajo de la otra,
  como una lista de datos de sistema.

**Lo más emocionante de todo —que su fiesta es hoy, a las 21, en el Club
Uruguay— está escrito en letra chica dentro de una caja gris.**

**Qué hacer:**

- **La fecha, la hora y el salón son el protagonista.** Una sola tarjeta grande,
  con aire, números grandes y legibles de un vistazo. Nada de cuatro cajitas.
- **"¡Es hoy!" o "Faltan 12 días" tiene que gritar**, en el buen sentido: es la
  emoción del cliente. Grande, con color.
- **Las etiquetas de arriba se achican o se van.** "PORTAL VIP" y el nombre de la
  empresa no compiten con la fiesta: van discretas o directamente afuera.
- **El aviso de "Faltan datos" no va acá** (ver bloque B): es del equipo.

# BLOQUE C — Dos cosas encimadas en la portada del portal

En la misma pantalla, en computadora:

1. El botón **"Personalizar portada"** (arriba a la derecha) **se monta sobre la
   tarjeta blanca de "Próximo paso"**. Se ve el botón semitransparente encima de
   la tarjeta.
2. La tarjeta de **"Próximo paso"** queda **cortada por arriba**: se sale del
   borde de la portada. Parece un accidente, no una decisión.

**Qué hacer:** que no se pisen. La tarjeta tiene que quedar apoyada entera, con
aire arriba, y el botón en un lugar donde no la toque. Mirá la foto antes y
después.

# BLOQUE D — La espera del muro no puede ser una rueda pelada

`src/app/evento/social/[fiestaId]/`

El invitado escanea el código en la fiesta, abre el muro, y ve **una rueda roja
sola en una pantalla en blanco**. Puede quedarse así **hasta veinte segundos**
—la propia prueba del muro le da ese margen a propósito, porque pide varias cosas
al servidor—. Veinte segundos mirando una rueda, parado en una fiesta, con el
celular en la mano.

**No se pide acelerarlo** (eso es harina de otro costal). Se pide que **la espera
se vea bien**:

- El nombre de la fiesta y la marca de AK arriba, **desde el primer instante**.
- Una frase que diga qué está pasando: *"Buscando las fotos de la fiesta…"*.
- El armazón de la galería dibujado en gris mientras carga, en vez del vacío.

Con eso, los mismos veinte segundos se sienten la mitad.

# BLOQUE E — Las pantallas vacías tienen que dar ganas

En toda la app, cuando algo todavía no tiene datos, la pantalla dice que no hay
nada y ahí queda.

**La galería ya se arregló bien y es el modelo a copiar:** ícono grande, frase
clara, **botón que lleva a la acción**, y una línea de ayuda abajo.

**Qué hacer:** aplicá ese mismo patrón a las pantallas vacías que ve **el cliente
y el invitado**, que son las que venden. Empezá por el muro, el buzón y el portal.
Cada una: qué es esto, qué va a pasar acá, y el botón para empezar.

**No toques** las pantallas internas del equipo en este bloque: ésas ya están
bien y no las ve el cliente.

# BLOQUE F — Dos toques que suman, si llegás

Estos dos no son defectos: son oportunidades. Hacelos **sólo si terminaste todo
lo de arriba**.

1. **La portada pública, en celular, no muestra el logo de AK.** Arriba sólo se
   ven las rayitas del menú. En la pantalla donde más se decide si un cliente
   sigue leyendo, **la marca no está**. Poné el logo arriba a la izquierda,
   chico, sobre la foto.
2. **Después del botón "Cotizá tu Fiesta", un bloque de respaldo.** Tres o cuatro
   datos que den confianza —cantidad de fiestas hechas, años de trabajo, los
   salones donde trabajan—, grandes y legibles. Es lo que tienen las plataformas
   con las que competimos, y AK tiene con qué llenarlo.

**Y una advertencia sobre una idea que puede salir mal:** se pensó mostrar fotos
de otras fiestas como inspiración en la galería vacía. **No lo hagas con fotos de
clientes.** Si se hace, sólo con fotos del catálogo propio de AK, y aclarando que
son de ejemplo.

---

## Lo que NO se toca nunca

- La validación del token de proveedor (`verifyAccesoPersonalToken`) en
  `fotografia` y `catering`.
- Los tiempos de la fotocabina: 10 segundos la primera foto, 4 las demás.
- Los topes del contrato: 10% de reducción, 30% de aumento.
- Plata, cobros, comida y permisos: eso lo escribe Claude.
- **No vuelvas a subir el ruido** que se bajó: nada de carteles de éxito nuevos,
  nada de parpadeos decorativos, nada de globitos rojos que cuenten de más.
- **No migres colores al tema.** Descartado: la app no tiene modo oscuro.

## Cómo se sabe si salió bien

No alcanza con que compile. **Sacá las fotos antes y después y comparalas:**

```
AK_FOTOS=true node scripts/run-playwright-production.mjs tests/e2e/fotos-de-la-app.spec.ts --grep "portal-del-cliente|muro-social|galeria|buzon|landing"
```

**Mirá las que empiezan con `celular-`. Ésas son las que valen**, porque es donde
se va a ver casi siempre. Las de escritorio, sólo para confirmar que no rompiste
nada.

Para cada pantalla que toques, preguntate la vara: **¿se la mostrarías a un
cliente al lado de una plataforma paga, sin pedir disculpas?** Si la respuesta es
"casi", no está lista.

## Los controles antes de entregar

1. `npm run build`
2. `npx tsc --noEmit`
3. `npx jest --silent`
4. `npm run check:acentos`

## Cuando termines

Avisá el número de la propuesta, anotá lo hecho en `docs/YA-RESUELTO.md` y mové
este archivo a `hechas/` en la misma propuesta.
