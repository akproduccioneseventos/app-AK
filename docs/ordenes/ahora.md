# Lo que hay que hacer ahora

**Para:** Gemini (Antigravity)
**Escribe:** Claude (revisión a ojo de las pantallas)
**Fecha:** 15 de agosto de 2026
**Base:** `main` actualizado. Sincronizar antes de empezar.

Ésta es la **única orden vigente**. Lo que está en `hechas/` ya se hizo.

**Todos los bloques van en UNA SOLA PROPUESTA.**

**Empezá por el BLOQUE D.** Es el que se ve en todas las pantallas y el que más
barato sale de arreglar.

## De dónde salió esto

No salió de leer código: salió de **mirar las pantallas**. Se sacaron fotos del
portal, el simulador, el muro, la galería, el buzón y la presentación, en
escritorio y en celular, y se revisaron una por una con la pregunta de siempre:
*¿esto vende, se entiende solo, y da ganas?*

Podés sacar las fotos vos también, para ver el antes y el después:

```
AK_FOTOS=true node scripts/run-playwright-production.mjs tests/e2e/fotos-de-la-app.spec.ts
```

Quedan en `capturas/`, en escritorio y en celular. **Miralas antes y después de
tu cambio.**

---

# BLOQUE A — La galería vacía invita pero no deja hacer nada

**El más importante. Es plata que se pierde en el momento justo.**

`src/app/evento/galeria/[fiestaId]/page.tsx:179`

Cuando todavía no hay fotos, el invitado ve un ícono gris, y abajo:

> Aún no hay fotos en esta categoría.
> ¡Sé el primero en compartir un momento!

**Lo invita a compartir y no le da ningún botón para hacerlo.** Justo en el
momento en que quiere participar, la pantalla es un callejón sin salida. Y arriba
le dice "0 fotos · 0 · 0 comentarios", que enfría todavía más: parece que no está
pasando nada.

Esto importa porque el invitado de esta fiesta es el cliente de la del año que
viene, y la galería es lo que hace que se acuerde de AK.

**Qué hacer:**

- Poner un **botón principal, grande y claro** que lleve a subir una foto o a la
  estación de fotos que corresponda. Que diga qué hacer: "Subí tu primera foto",
  no "Cargar".
- Si desde esa pantalla no se puede subir, que el botón lleve al muro o a la
  fotocabina, y que el texto explique dónde se saca la foto ("Buscá la fotocabina
  cerca de la entrada").
- **Los contadores en cero no se muestran.** Que aparezcan recién cuando haya al
  menos una foto. Un "0 fotos · 0 me gusta" no aporta nada y desanima.
- Cuando ya hay fotos, todo queda como está.

# BLOQUE B — La presentación al cliente muestra una imagen rota

`src/app/presentacion-led/slides/portada-slide.tsx`

En la portada, el recuadro grande de la derecha —el visual principal del evento—
**se ve como una imagen rota**: el iconito de imagen fallada y el texto
alternativo "Visual principal del evento". Se le muestra al cliente en la reunión
de venta, en la pantalla grande.

Pasa cuando no hay imagen configurada, que es el estado en el que sale de fábrica.

**Qué hacer:** que cuando no haya imagen cargada se vea **un fondo lindo a
propósito** —degradado con el color de acento, el logo tenue, algo que se banque
una pantalla grande— y no un recuadro roto. Nunca el texto alternativo a la vista.

# BLOQUE C — Los botones de la presentación se encinan con el texto

`src/app/presentacion-led/page.tsx`

Abajo de la portada, los botones "Anterior" y "Siguiente" **se montan sobre la
línea** que dice "Pensado para vender en vivo, sin aspecto de catálogo interno".
Se ve desprolijo justo cuando el cliente está mirando la pantalla.

**Qué hacer:** que no se pisen. Dejar el aire suficiente abajo del contenido para
que la barra de navegación no tape nada, en escritorio y en celular.

---

# BLOQUE D — En el celular, dos botones flotantes tapan la pantalla

**Éste primero. Se ve en TODAS las pantallas del equipo, no en una.**

`src/components/module-navigation-dock.tsx:34-38`

Ese botón flotante —la flecha de volver y el cuadradito del panel— está clavado
en `top-20 left-3`, encima del contenido. En el celular cae **justo arriba del
título de la pantalla**. Se ve así:

- En Pagos Rápidos: el título dice "…os Rápidos" y abajo "…gistrar y confirmar
  pagos desde el celular". Media frase tapada, **en la pantalla que dice que es
  para usar desde el celular**.
- En el Planificador Gastronómico: la palabra "PLANIFICADOR" queda a medias.
- Pasa igual en el resto de las pantallas internas.

**Qué hacer:** que en el celular ese botón **no se monte sobre el contenido**.
Las dos salidas razonables son bajarlo al pie de la pantalla, o dejarle lugar
propio arriba y que el contenido arranque debajo. Elegí una y aplicala parejo.
En escritorio hoy no molesta: no lo rompas.

Y de paso, ahí donde la pantalla ya tiene su propio botón "Volver" —el
Planificador tiene los dos— **dejá uno solo**.

# BLOQUE E — El botón del asistente tapa botones de verdad

En el Planificador Gastronómico, el botón redondo del asistente (abajo a la
derecha) **se monta sobre el botón "Añadir postre"**, que queda cortado. El
invitado o el equipo no puede apretar lo que está tapado.

**Qué hacer:** que el asistente no se superponga con botones. Dejar espacio al
pie de las listas para que el último botón nunca quede debajo, en celular y en
escritorio.

---

## Lo que NO se toca nunca

- La validación del token de proveedor (`verifyAccesoPersonalToken`) en
  `fotografia` y `catering`. **Si hay conflicto ahí, quedate siempre con esa
  versión**: ya se reabrió el agujero una vez.
- Los tiempos de la fotocabina: 10 segundos la primera foto, 4 las demás.
- Los topes del contrato: 10% de reducción, 30% de aumento.
- Plata, cobros, comida y permisos: eso lo escribe Claude. Si te cruzás con algo
  de eso, avisá y seguí.
- **No pasar colores escritos a mano a colores del tema.** Eso quedó descartado:
  la aplicación no tiene modo oscuro, así que no se ve distinto. Está explicado
  en `docs/YA-RESUELTO.md`.

## Nada de cambios sueltos

**Pasó en las dos últimas entregas y hubo que sacarlos a mano antes de fusionar.**
La propuesta tiene que traer **sólo** lo que pide esta orden:

- **No commitees `public/firebase-messaging-sw.js`**: se genera solo al compilar.
- **No cambies imports ni librerías que no vengan al caso.** Una entrega cambió
  el `z` de `genkit` a `zod` en el asistente del simulador: compilaba igual, pero
  podía fallar recién al usarlo.
- Si de paso encontrás algo roto, **avisalo, no lo arregles acá**.

## Los controles antes de entregar

En este orden, y el build primero porque el revisor de tipos necesita lo que
genera:

1. `npm run build`
2. `npx tsc --noEmit`
3. `npx jest --silent`
4. `npm run check:acentos`

## Cuando termines

Avisá el número de la propuesta, anotá lo hecho en `docs/YA-RESUELTO.md` y **mové
este archivo a `hechas/` en la misma propuesta**.
