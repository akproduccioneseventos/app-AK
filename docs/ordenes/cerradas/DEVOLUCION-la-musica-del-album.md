# Devolución — la música del álbum apunta a un archivo que no existe

**Verificado el 2 de septiembre de 2026.**

## Lo que quedó BIEN, y no hay que tocar

Los tres puntos de la devolución anterior están resueltos de verdad, comprobados abriendo el
archivo:

- **El reproductor del álbum es real**: `audioRef` está enganchado a un `<audio>` (línea 667),
  con su lógica de arrancar y parar, en bucle, y **arranca en silencio** —`musicaActiva` empieza
  en `false`—, que es justo lo que se pidió para no espantar al cliente.
- **Las copias tienen su propio ajuste**: `copiasImpresion`, con 1 por defecto. **Ya no se roban
  de `fotosPorTanda`**, que era lo que hacía imprimir cuatro copias de cada recuerdo.
- **El tamaño de papel llega**: la llamada de la línea 498 es
  `imprimirRecuerdo(capturedImage, copiasImpresion, tamanoPapel)`, con los tres datos.

---

## LO ÚNICO QUE FALTA: el archivo de música no está

La línea 668 apunta a **`/audio/album-ambiente.mp3`**, y **ese archivo no existe en el proyecto**:
la carpeta `public/audio/` está vacía.

**Qué pasa en pantalla:** el cliente ve el botón de música, lo toca, y **no suena nada**. Es un
botón que no hace nada — la forma exacta que tuvieron todas las fallas de esta semana, sólo que
esta vez el hueco no está en el código sino en el archivo que el código pide.

### Cómo se resuelve, y es mejor que poner un archivo fijo

**Que la música salga de la fiesta, no de un archivo clavado.** La app ya guarda la música del
evento; el álbum tiene que usar **la canción de esa fiesta**. Es más lindo para el cliente —suena
*su* tema, no un fondo genérico— y **evita el problema de los derechos de una pista fija**.

1. **Si la fiesta tiene una canción cargada**, el álbum la usa.
2. **Si no tiene ninguna, el botón de música NO aparece.** Es la regla del dueño: **nunca un botón
   que no hace nada.** Eso es lo que está mal hoy, y es lo que hay que arreglar primero.
3. **Si más adelante se quiere un fondo genérico de AK**, tiene que ser una pista sobre la que
   AK tenga los derechos, y **eso lo decide el dueño**, no se elige por conveniencia.

**Qué comprueba la prueba:** que **con una fiesta sin canción cargada, el botón de música no
aparece**; y que **con una canción cargada, el reproductor apunta a esa canción**. Que el
elemento de audio exista **no prueba nada**: hoy existe y no suena.

```comprobar
usa: audioRef.current en src/app/evento/album/[fiestaId]/page.tsx
usa: copiasImpresion en src/app/evento/fotocabina/[fiestaId]/page.tsx
usa: tamanoPapel en src/app/evento/fotocabina/[fiestaId]/page.tsx
prueba: tests/e2e/el-album-suena-o-no-muestra-el-boton.spec.ts
```
