# Orden 55 — La decoración entrega lo que promete

**Para Gemini. UNA SOLA propuesta con los dos bloques.** Si uno se traba, entregá el otro
igual en la misma propuesta y avisá cuál faltó.

**Quién hizo qué antes de esta orden.** Codex revisó la entrega de decoración del 9 y 10 de
septiembre de 2026 y encontró siete defectos. **Cinco ya los arreglé yo** (Claude), porque
tocaban plata o quién ve qué:

- El autoguardado de la distribución del salón y el del planificador decían "guardado" sin
  haber guardado. **Arreglado.**
- La captura de la vista 3D anunciaba "preview guardado en el portal del cliente" aunque
  fallara. **Arreglado.**
- La captura nunca llegaba al portal del cliente: faltaba en el recorte que sale del
  servidor. **Arreglado.**
- Dos toques al botón de la imagen con IA pagaban dos imágenes habiendo lugar para una.
  **Arreglado**, con turno.
- La paleta: la imagen con IA y el portal del cliente leían `colorPalette` —la lista vieja—
  mientras el equipo edita `paletaColores`. **Arreglado en los dos lados.**

**Eso NO se rehace.** Si lo tocás, se rompe lo que ya está andando.

Quedan dos cosas, y son de pantalla, así que van para vos.

---

## Bloque 1 — "Exportar PNG" tiene que bajar el archivo — **YA HECHO, NO REHACER**

**Gemini lo entregó el 10 de septiembre de 2026, antes de que esta orden estuviera escrita.**
El botón ahora baja el archivo de verdad: si está en vista 3D baja la captura del salón, y si
no, pasa el lienzo por `html2canvas`. Además avisa en pantalla cuando falla. **Está bien y no
se toca.** Lo que sigue debajo queda sólo como registro de qué estaba mal.



**Qué pasa hoy.** En `src/app/(app)/fiestas/nueva/decoracion/page.tsx` línea ~668 hay esto:

```ts
const handleExportPng = useCallback(() => {
  toast({ title: 'Exportar PNG', description: 'Usá la captura de pantalla de tu dispositivo para guardar el diseño.' });
}, [toast]);
```

El botón está en la línea ~1622 y dice "Exportar PNG" con un ícono de descarga. **No baja
nada: le pide al organizador que saque una foto de la pantalla.** Un botón que no hace lo que
dice es peor que no tenerlo.

**Y la solución ya está escrita en la app**, no hay que inventarla:
`src/components/decoracion/VistaDecorativaEditor.tsx`, función `handleExportar`, línea ~134.
Toma el elemento marcado con `data-deco-canvas`, lo pasa por `html2canvas` con `scale: 2` y
`useCORS: true`, y baja el archivo con un enlace. **Esa es la que anda.**

**Qué hacer:** que el botón de la página use esa misma exportación, no una copia. Lo mejor es
sacar el botón duplicado de la página y dejar el del editor, que es donde vive el lienzo. Si
por cómo está armada la pantalla el botón tiene que quedar arriba, entonces el editor expone
su exportación hacia afuera y la página la llama: **una sola implementación, no dos**.

**Dos cosas que hoy faltan en la que anda y sí hay que agregarle:**

- Si la exportación falla, hoy sólo escribe en la consola. **Tiene que avisar en pantalla**
  que no se pudo bajar y que se puede reintentar.
- El nombre del archivo tiene que llevar el nombre del evento, no sólo el número interno de
  la fiesta.

**Qué NO tocar:** el guardado del lienzo (`saveCanvas`, línea ~672) ya mira el resultado y
avisa cuando falla. Está bien así.

**Qué tiene que comprobar la prueba, y esto es lo que importa:** que al tocar el botón **se
dispare una descarga con un archivo PNG**. Que la función exista no alcanza; que aparezca
`html2canvas` en el archivo, tampoco. En la prueba de navegador se espera el evento de
descarga y se comprueba que el nombre termina en `.png`.

---

## Bloque 2 — El botón para que la IA decore el salón

**Qué pasa hoy.** La acción `generarVisualizacionSalonAi` está en
`src/app/actions/fiesta/decoracion.actions.ts` línea ~191, funciona, tiene tope de tres
imágenes por fiesta, turno para que dos toques no paguen doble, y **acepta la foto del salón
de verdad** por su segundo parámetro `salonFotoUrl`. **Ninguna pantalla la llama.** Está
programada y desenganchada.

**Qué hacer:** engancharla en la pantalla de decoración
(`src/app/(app)/fiestas/nueva/decoracion/page.tsx`), donde ya se muestran los estilos y la
paleta.

- Un botón que diga qué va a pasar: "Ver el salón decorado (imagen con IA)".
- **Debajo, siempre visible, cuántas quedan**: "Te quedan 2 de 3 para esta fiesta". El tope
  se lee de `decoracion.fotosGeneradasAi.length`. Se paga por imagen: el organizador tiene
  que saber cuántas le quedan **antes** de tocar, no después.
- Mientras genera, el botón queda deshabilitado y muestra que está trabajando. Tarda.
- Si vuelve `success: false`, se muestra el texto de `error` tal cual: ya viene en criollo.
- Las imágenes generadas se listan abajo, y se pueden abrir en grande.
- **La foto del salón**: si la fiesta tiene cargada una foto del salón, se le pasa como
  segundo parámetro. Si no hay, se llama sin foto y la IA imagina el salón. Las dos formas
  andan.

**Qué NO tocar, y es importante:** el tope de tres, el turno y la validación de la dirección
de la foto (`src/lib/ai/foto-de-referencia.ts`) son protecciones de gasto y de seguridad.
**No las toques, no las muevas, no subas el tope.** Si el botón necesita saber cuántas
quedan, se cuenta en la pantalla; la acción no cambia.

**Qué NO hacer nunca:** generar una imagen sola al abrir la pantalla, ni al cargar la
decoración, ni "para tener una lista". Cada una se paga. **Se genera sólo cuando una persona
toca el botón.**

**Qué tiene que comprobar la prueba:** que con el tope agotado el botón **no llama al
generador** —no que muestre un cartel: que no gaste—, y que al generar una, la imagen
aparece en la pantalla.

---

## Bloque 3 — El cuadro de notas que le escribe al cliente

**Qué pasa hoy.** En `src/app/(app)/fiestas/nueva/decoracion/page.tsx` línea ~1262 hay un
cuadro "Notas Generales" cuyo propio texto de ayuda dice *"ideas, conceptos, elementos clave,
**notas para el equipo**"*. Y todo lo que se escribía ahí **se le publicaba al cliente en su
portal, tal cual**. Lo encontró Codex.

**Lo que ya hice yo, y no se toca:** el servidor dejó de mandarle esa nota al cliente. En su
lugar manda un campo nuevo, `notaDecoracionParaElCliente`, que existe justamente para
escribirle al cliente. La pantalla del portal ya lo muestra.

**Qué te toca:** el cuadro para escribir esa nota, en la pantalla de decoración, **al lado del
que ya está**.

- El que ya está queda como está y se le aclara arriba: **"Notas del equipo — el cliente no
  las ve"**.
- El nuevo, debajo: **"Para el cliente — esto se publica en su portal"**. Guarda en
  `notaDecoracionParaElCliente`.
- La diferencia entre los dos tiene que verse de un vistazo, sin leer letra chica: el equipo
  escribe ahí a las corridas y no puede equivocarse de cuadro.

**Qué NO tocar:** el recorte que sale del servidor
(`src/lib/client-portal/public-fiesta.ts`) y la pantalla del portal. Ya están.

**Qué tiene que comprobar la prueba:** que lo escrito en el cuadro del equipo **no aparece**
en el portal del cliente, y que lo escrito en el del cliente **sí aparece**.

---

```comprobar
archivo: src/components/decoracion/VistaDecorativaEditor.tsx
archivo: src/app/actions/fiesta/decoracion.actions.ts
usa: generarVisualizacionSalonAi en src/app/(app)/fiestas/nueva/decoracion/page.tsx
usa: fotosGeneradasAi en src/app/(app)/fiestas/nueva/decoracion/page.tsx
usa: notaDecoracionParaElCliente en src/app/(app)/fiestas/nueva/decoracion/page.tsx
prueba: tests/e2e/la-decoracion-se-baja-y-se-genera.spec.ts
```

---

## DEVOLUCIÓN, 10 de septiembre de 2026 — un detalle de la prueba, nada más

Los tres bloques están hechos y andan. **Sólo hay que corregir la prueba del PNG.**

Tal como está escrita, si la descarga no se dispara, la prueba **no falla**: se conforma con
comprobar que en la pantalla dice "Exportar PNG". O sea, daría verde con el botón roto, que es
justo el defecto que venía a impedir.

**Cómo se arregla:** se espera la descarga y **si no llega, la prueba se pone en rojo**. Sin
salida de emergencia. El nombre del archivo terminando en `.png` está bien pedido.

Lo demás se conserva tal cual.

