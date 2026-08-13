# Orden de trabajo: que la presentación cuente lo mismo que el catálogo de papel

Fecha: 13 de agosto de 2026.

**Entregá UNA SOLA propuesta de cambio con los tres bloques adentro.** Si uno se
traba, entregá los otros igual en la misma propuesta y avisá cuál faltó y por qué.
No abras una propuesta por bloque: cada fusión dispara un despliegue y eso se paga.

Antes de arrancar, leé `docs/QUE-HAY-EN-LA-APP.md`. **No rehagas nada de lo que
figura ahí**, y actualizá esas líneas en esta misma propuesta.

---

## De qué se trata

El dueño tiene catálogos impresos que usa para vender. Se comparó el de XV años
contra la presentación que se le proyecta al cliente desde la aplicación, y hay
tres cosas que el papel cuenta bien y la pantalla no cuenta o cuenta mal.

**Dato que cambia el diseño de todo esto:** hay **tres catálogos**, uno por tipo de
evento (XV años, bodas y fiestas en general), y **entre ellos cambian sobre todo las
fotos**, no la estructura. Así que lo que se haga acá tiene que servir para los tres
sin escribir tres veces lo mismo.

---

## Regla que vale para los tres bloques

**Todo el contenido de estas pantallas se elige por tipo de evento, y lo edita el
dueño sin tocar código.**

Ya existe el mecanismo: `src/app/presentacion-led/lib/contenido-por-tipo.ts` guarda
textos distintos para "15 años", "Casamiento", "Boda", "Cumpleaños adultos" y
varios más. Hoy sólo guarda textos; hay que poder guardar **también las fotos**.

Dos cosas obligatorias:

1. **Nada de fotos escritas a mano en el código.** Cuando lleguen los otros dos
   catálogos, el dueño tiene que poder cambiar las fotos desde Ajustes, no pedirle a
   nadie que toque el programa.
2. **Si para un tipo de evento no hay contenido cargado, se usa el general.** La
   presentación nunca queda con un hueco ni con una pantalla vacía.

---

## Bloque 1 — Los logos de las empresas: traerlos a casa y ponerles nombre

**Dónde:** `src/app/presentacion-led/slides/empresas-slide.tsx`, líneas 16 a 28.

**Qué pasa hoy, verificado leyendo el código:**

- Los once logos se cargan desde **una dirección externa de Canva**
  (`ak-producciones-fiestas-y-eventos.my.canva.site/...`). Si esa página cambia,
  se cae o le cambian el nombre a un archivo, **los logos desaparecen en el medio de
  la presentación, delante del cliente**.
- Los once figuran con el nombre **"Empresa Colaboradora"**. Ninguno dice quién es.

**Por qué importa:** el valor de esa pantalla es que el cliente lea *Antel*,
*Correo Uruguayo*, *Intendencia de Salto*, *INAU*, *Salto Hotel & Casino*,
*Club Uruguay*. Si no reconoce los nombres, la pantalla no convence de nada. Y una
empresa que muestra logos sin nombre parece que los está inventando.

**Qué hay que hacer:**

- Que los logos vivan **en la aplicación**, no en una dirección de afuera. Subilos a
  donde ya se guardan las imágenes de la empresa (la galería usa
  `uploadPublicPageAsset`).
- Que cada logo tenga **su nombre real escrito y visible** debajo o al lado. No
  alcanza con ponerlo como texto alternativo: el texto alternativo sólo aparece
  cuando la imagen NO carga, y acá el objetivo es justamente que el cliente lea
  "Antel" mirando la pantalla. Poné el nombre visible **y además** como texto
  alternativo, que sirve para quien no ve bien.
- Que la lista se administre desde Ajustes: agregar, sacar y reordenar, con el
  nombre de cada empresa. **El dueño tiene que poder sumar un cliente nuevo sin
  pedirle nada a nadie.**
- Dejá la protección que ya existe para cuando una imagen no carga; que la pantalla
  no muestre un hueco roto.

**Los nombres reales, del catálogo impreso, son DOCE:** Correo Uruguayo, Salto
Hotel & Casino, Plus Medical, A.S.DE.M. y A., Woslen, Asociación Profesionales de la
Construcción (APC Salto), INC, Antel, ABRA, INAU, Intendencia de Salto, Club
Uruguay.

**Ojo con esto: en la pantalla hay once imágenes y en el catálogo hay doce
empresas.** O sea que falta un logo. No adivines cuál ni le pongas a un logo el
nombre de otra empresa: **poner el nombre equivocado sobre el logo de un cliente es
peor que no mostrarlo.** Dejá los once que se puedan identificar con certeza, y en
la pantalla de Ajustes que quede el lugar para que el dueño suba el que falta con su
nombre. Avisá en la propuesta cuál quedó sin cargar.

---

## Bloque 2 — La pantalla del equipo: está hecha y nadie la muestra

**Qué pasa hoy: la pantalla YA EXISTE y no se muestra.** Está en
`src/app/presentacion-led/slides/quienes-somos-slide.tsx`, con lugar para la foto
del equipo, la historia de la empresa y tres números (años de experiencia, eventos
realizados, familias felices). Nadie la enganchó a la presentación, así que el
cliente no la ve nunca.

**No hagas una pantalla nueva: usá esa.** Duplicarla dejaría dos versiones y una
muerta.

Y aprovechá el viaje: hay **otras tres pantallas terminadas y sin usar** en esa
misma carpeta —`formas-de-pago-slide`, `menu-slide` y `recursos-slide`—. Miralas,
decidí cuáles vale la pena mostrar y contá en la propuesta qué hiciste con cada una:
engancharla o borrarla. Lo que no se muestra ni se borra sólo confunde al próximo.

**Por qué importa:** en el catálogo impreso hay una foto de los once —mozos, cocina,
y el dueño con el micrófono— bajo el título "Hay equipo". Es de lo que más confianza
transmite: el cliente está por dejar una fiesta cara en manos de alguien y quiere
ver quién la va a hacer. Es una de las pocas cosas que la competencia no puede
copiar.

**Qué hay que hacer:** engancharla a la presentación, ubicada **antes de los
precios** (después de los beneficios o del salón, no al final), y completarla con:

- Una o dos fotos del equipo trabajando.
- Un título corto y una frase, en criollo, del estilo "El día de tu fiesta somos
  once personas trabajando para vos".
- Si se puede, la cantidad de gente que trabaja en un evento.

Las fotos y el texto salen del contenido por tipo de evento, como dice la regla de
arriba: **para una boda va la foto de una boda, no la de unos quince**.

---

## Bloque 3 — Que la pantalla del salón cuente el Club Uruguay de verdad

**Dónde:** `src/app/presentacion-led/slides/salon-slide.tsx`.

**Qué pasa hoy:** la pantalla habla de "capacidad adaptable" y "ubicación" en
general. No nombra el salón ni da un solo argumento concreto.

**Qué dice el catálogo, que es lo que hay que contar:**

- Un salón de primer nivel, con más de 120 años en Salto.
- En pleno centro, accesible para todos los invitados.
- Para más de 120 personas.
- **Incluye la limpieza completa del salón.**
- A precio promocional.

**MUY IMPORTANTE, decisión del dueño del 13 de agosto de 2026: el portero YA NO va.**
El salón dejó de ofrecerlo. **No lo menciones en ningún lado.** En el catálogo
impreso todavía figura y está mal; en la aplicación no aparece y así tiene que
quedar. Ojo, que no se confunda con el servicio de Portero que AK sí vende aparte
(`serv_portero`, $2.500): ese sigue existiendo y no se toca.

**Qué hay que hacer:** que la pantalla del salón use los argumentos de arriba, con
las fotos reales del Club Uruguay, y siempre por tipo de evento. Si la fiesta es en
otro salón, tiene que seguir mostrando la versión general: **no le muestres el Club
Uruguay a alguien que ya contrató otro lugar.**

---

## Cómo se comprueba

1. `npm run check:acentos` limpio.
2. `npx tsc --noEmit` en cero.
3. `npx jest --silent` todo en verde.
4. `npm run build` termina bien. **Correlo de verdad**: ya pasó que los tipos daban
   bien y la aplicación no se podía publicar.
5. Una prueba que verifique que **si un tipo de evento no tiene contenido cargado,
   se usa el general** y no queda una pantalla vacía.
6. Probado a mano: la presentación entera, de principio a fin, sin huecos.

Anotá todo en `docs/YA-RESUELTO.md` y en `docs/QUE-HAY-EN-LA-APP.md`, en esta misma
propuesta.
