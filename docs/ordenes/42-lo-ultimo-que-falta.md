# Orden 42 — Lo último que falta del panel

**Para Gemini. UNA SOLA PROPUESTA con los cinco bloques.** Si uno se traba, entregá el resto
igual en la misma propuesta y decí cuál faltó. No abras una propuesta por bloque.

**Antes de empezar:** `git fetch origin && git checkout -b feat/orden-42 origin/main`. Arrancar de
una versión vieja ya hizo perder tres entregas.

**Lo que NO se toca:** el reloj del simulador, el ajuste anual, los descuentos, los textos de
venta, `apphosting.yaml`, cobros y permisos. **Y nunca reemplaces una biblioteca por un archivo
vacío para que compile.** Si algo no compila, decilo y entregá el resto.

**La regla que más importa acá:** un ajuste que se puede tocar y no cambia nada en pantalla es
peor que no tenerlo. **Ya pasó dos veces esta semana**, la última con la velocidad del recuerdo.

---

## Bloque 1 — Fotocabina: cambiar el fondo SIN tela verde

Es lo único que le falta a la fotocabina, y es lo que más la separa de la competencia.

Archivo: `src/app/evento/fotocabina/[fiestaId]/page.tsx`. Hoy el cambio de fondo **sólo funciona
con tela verde**: `aplicarChromaKey()` en `src/lib/entretenimiento/segmentacion-fondo.ts:32`,
llamada desde la línea ~428 cuando `fiesta.station.enableChromaKey`.

**Toda la cadena de alrededor ya está hecha y no se toca:** el estado `fondoVirtual` (línea ~105)
ya deja elegir fondo, y `procesarFondoCanvas()` (`segmentacion-fondo.ts:72`) ya lo aplica al
lienzo. **Lo único que falta es el recorte de la persona sin tela.**

Usá `@mediapipe/selfie_segmentation` o `@tensorflow-models/body-segmentation`, y **cargalo sólo
cuando el operador prende la opción**, no al abrir la pantalla: 200 invitados abriendo la estación
no pueden bajarse una biblioteca pesada de arriba. Ajuste nuevo en
`src/lib/entertainment/station-config.ts`: `recorteSinTela?: boolean`.

## Bloque 2 — Plataforma 360: marco animado y cortinas

Archivo: `src/app/evento/plataforma-360/[fiestaId]/page.tsx` (componente `Plataforma360Page`).
El video se arma dibujando cuadro por cuadro en `drawCanvasRef` (línea ~101) y grabando ese
lienzo; el bucle de dibujo está alrededor de la línea 442.

1. **Marco animado sobre el video.** `dibujarMarcoDinamico()` en
   `src/lib/entretenimiento/marcos-dinamicos.ts:24` **ya existe y ya lo usan el Bogue y la
   fotocabina**: llamalo dentro del bucle de dibujo, por cada cuadro. No escribas otro.
2. **Cortina de entrada y de salida.** Un fundido desde negro en los primeros cuadros y hacia
   negro en los últimos, dibujado sobre el mismo lienzo. Nada de una animación de CSS encima del
   video: **tiene que quedar dentro del archivo que se entrega**, porque el invitado se lleva el
   video, no la pantalla.

## Bloque 3 — Espejo mágico: las animaciones con locución

Archivo: `src/app/evento/espejo-magico/[fiestaId]/page.tsx`. La estación **ya habla**
(`speechSynthesis`) y ya filtra qué estilos se ofrecen con `fiesta.station.allowedTemplateIds`.

Falta la parte de Mirror Me: **una animación en pantalla acompañada de una frase hablada** en cada
paso — al saludar, al pedir la pose, en la cuenta regresiva y al despedirse. No hacen falta 200:
**hacen falta seis bien hechas**, que se elijan según el tipo de fiesta.

Guardalas en un archivo propio, `src/lib/entretenimiento/animaciones-con-locucion.ts`, con una
lista de `{ id, cuando, textoHablado, animacion }`, y **que la lista se pueda curar por fiesta**
con el mismo mecanismo de `allowedTemplateIds`. Para el movimiento seguí el estándar de la app:
la habilidad `animaciones-pro` tiene las curvas y los tiempos.

## Bloque 4 — Decoración: la vista 3D dibuja los muebles en un bloque OCULTO

**Esto es un defecto, no una función nueva.** En
`src/app/(app)/fiestas/nueva/decoracion/page.tsx`, alrededor de la línea 1699, los elementos de
decoración se dibujan así:

```
<div className="hidden">
  {decoracionData.items.map((it, idx) => (
    <DecoItem3D key={it.id || idx} item={it as any} position={[0, 0, 0]} />
  ))}
</div>
```

**Están adentro de un bloque oculto y todos en la posición cero.** O sea: la vista 3D muestra el
salón vacío y los muebles no aparecen nunca. El botón "Vista 3D" existe y anda (`is3DMode`, línea
177), y `SalonScene` (línea ~1688) dibuja el salón: **lo que falta es meter los muebles adentro de
la escena, en la posición que tienen en el plano.**

Las coordenadas ya están en cada elemento del plano 2D (`DecoCanvas`, mismo archivo). Convertí esa
posición del plano a la escena 3D. **Sacá el `div hidden`.**

## Bloque 5 — Pantalla gigante: fondo elegible y moderación que ayude

Archivo: `src/app/evento/muro-en-vivo/[fiestaId]/page.tsx` (componente `MuroEnVivoPage`).

1. **Fondo elegible.** Hoy el fondo es un degradado armado con `config.accentColor` y
   `config.secondaryColor` (línea ~1399). Falta poder **elegir un fondo de una lista** —seis u
   ocho, no cien— y que se vea en la pantalla del salón. Ajuste nuevo en `station-config.ts`:
   `fondoMuro?: string`.
2. **Moderación que ayude sola.** En `src/app/evento/moderacion/[fiestaId]/page.tsx`,
   `moderateSocialPost` (línea ~67) aprueba o esconde de a una, en el orden en que llegaron.
   Falta que **lo dudoso venga primero**: fotos muy oscuras o movidas, y las que traen texto con
   palabras subidas de tono. **Que ordene y avise, no que decida sola**: la aprobación la sigue
   dando una persona.

---

## Cómo se comprueba que está hecho

**Cada línea pide el RESULTADO, no el ingrediente.** La pregunta antes de dar algo por hecho:
*¿esto podría dar verde con la función apagada?*

```comprobar
usa: recorteSinTela en src/lib/entertainment/station-config.ts
usa: recorteSinTela en src/app/evento/fotocabina/[fiestaId]/page.tsx
usa: dibujarMarcoDinamico( en src/app/evento/plataforma-360/[fiestaId]/page.tsx
archivo: src/lib/entretenimiento/animaciones-con-locucion.ts
usa: animaciones-con-locucion en src/app/evento/espejo-magico/[fiestaId]/page.tsx
usa: fondoMuro en src/app/evento/muro-en-vivo/[fiestaId]/page.tsx
prueba: tests/e2e/las-estaciones-respetan-los-ajustes.spec.ts
prueba: tests/e2e/la-vista-3d-muestra-los-muebles.spec.ts
```

**Y tres pruebas de navegador que miren lo que se ve, no lo que está escrito:**

1. `tests/e2e/la-vista-3d-muestra-los-muebles.spec.ts` — con dos elementos en el plano, al tocar
   "Vista 3D" **los dos aparecen en la escena y en posiciones distintas**. Hoy esta prueba tiene
   que fallar: escribila primero, mirá que falle, y recién después arreglá el `div hidden`.
2. Con el fondo del muro elegido, **el muro se ve con ese fondo**, no con el degradado.
3. Con el recorte sin tela prendido, la foto sale con el fondo cambiado **sin tela verde delante
   de la cámara**.
