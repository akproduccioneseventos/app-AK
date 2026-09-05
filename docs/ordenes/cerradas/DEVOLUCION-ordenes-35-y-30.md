# Devolución — órdenes 30 y 35

**Verificada el 2 de septiembre de 2026 abriendo los archivos, no mirando el control.**

## LO QUE QUEDÓ BIEN. No lo toques.

- **El movimiento de las landings, resuelto.** `EventLandingPage.tsx` tiene **nueve entradas al
  llegar a la pantalla**, y como es el componente que arma `/bodas` y `/quinceaneras`, **las dos
  quedaron con una sola edición.** Era exactamente lo pedido.
- **El elemento invisible no volvió.** Cero `sr-only` en las dos landings.
- **El texto de marca del Espejo** se dibuja de verdad (línea 1500).
- **El color de la fiesta en la Plataforma 360.**
- **Las publicaciones de Instagram en el muro**: `getPublicInstagramFeed` aparece tres veces —
  importada, llamada y usada.
- **Los ajustes remotos** quedaron enganchados en el armazón.

---

## 1. LA MÚSICA DEL ÁLBUM NO EXISTE. Es un señuelo.

En `src/app/evento/album/[fiestaId]/page.tsx:59` se declara `audioRef` **y no se usa en ningún
lado**: `audioRef.` aparece **cero veces** en todo el archivo.

Las dos etiquetas `<audio>` que hay (líneas 340 y 460) son **los mensajes del buzón**, que ya
estaban desde antes.

**O sea: el álbum sigue sin música de fondo, y se agregó una línea para que el control encontrara
lo que buscaba.** Es lo mismo que el elemento invisible de la vuelta pasada, con otra cara, y
está prohibido por la regla del proyecto: **nunca escribir código para que un control se calle.**

**Qué hacer:** el reproductor de verdad, que suene mientras se pasan las páginas. **Que arranque
en silencio**, con un botón de sonido bien visible: un álbum que arranca sonando solo espanta.

**Qué comprueba la prueba:** que **el elemento de audio de la música exista y esté reproduciendo**
después de tocar el botón de sonido. Que la variable exista **no prueba nada**.

## 2. LAS COPIAS SE SACAN DEL AJUSTE EQUIVOCADO, y esto gasta papel en la fiesta

`src/app/evento/fotocabina/[fiestaId]/page.tsx:176`:

```
const copias = Math.max(1, Math.min(10, fiesta?.station.fotosPorTanda ?? 1));
```

**`fotosPorTanda` es cuántas fotos se sacan seguidas**, no cuántas copias se imprimen. Son dos
cosas distintas. Con el ajuste común de **4 fotos por tanda, la impresora saca 4 copias de cada
recuerdo.** En una fiesta eso es un rollo de papel tirado, y lo descubre el operador cuando ya
pasó.

**Qué hacer:** un ajuste propio, `copiasImpresion`, en los ajustes de la estación, **con 1 por
defecto**. Verificado: hoy **no existe ningún ajuste de copias** en `src/types/fiesta.ts`.

## 3. EL TAMAÑO DE PAPEL ESTÁ PROGRAMADO Y NO LLEGA

`src/lib/entretenimiento/imprimir-recuerdo.ts` quedó bien: acepta `tamano` y tiene la tabla
`TAMANOS_HOJA`.

**Pero nadie se lo pasa.** La llamada de la línea 496 es `imprimirRecuerdo(capturedImage, copias)`
— **sin el tercer dato** — así que **siempre imprime en 10x15**. Y `TamanoPapelImpresion` **sólo
aparece en su propio archivo**: ninguna pantalla lo usa.

**Qué hacer:** el ajuste `tamanoPapel` en la estación, con los tres valores (10x15, 5x15 y
13x18), y pasarlo en la llamada.

**Qué comprueba la prueba:** que **cambiando el ajuste, cambia la medida de la hoja** que se manda
a imprimir. Que la constante exista no alcanza.

---

## Antes de decir que terminaste

1. **Abrí el archivo y mirá quién llama a lo que agregaste.** Que exista no es que ande: es la
   forma exacta que tuvieron las tres fallas de esta vuelta.
2. `npm run "falta?"`.
3. `npm run "publicar?"` completo, una sola vez, al final.
4. `npm run limpiar:corrida`.
