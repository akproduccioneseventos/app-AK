# Orden 68 — La hoja del DJ dice la verdad: la fecha y el "copiado"

**Para Gemini.** Va **en la misma propuesta** que el resto de la tanda (ver
`docs/ordenes/TANDA-2026-09-18-que-sigue-para-gemini.md`).

## Por qué

Lo encontró Codex el 18 de septiembre de 2026 y lo verifiqué. Las dos cosas están en
`src/app/(app)/fiestas/nueva/musica/pdf/page.tsx`, que es la hoja que se imprime y se le da al DJ.

## Bloque 1 — La fecha puede salir impresa un día antes

`formatDate`, línea ~16:

```ts
return new Date(dateString).toLocaleDateString('es-ES', { ... });
```

La fecha de la fiesta se guarda como día suelto —`2026-09-30`—. Así escrita, el navegador la
entiende como **medianoche en Greenwich**, que en Uruguay es **el 29 a las nueve de la noche**. La
hoja del DJ sale impresa con el día anterior.

**Qué hacer:** armar la fecha con los tres números del texto, sin que la zona horaria la mueva: si
el texto viene como `AAAA-MM-DD`, partirlo y construir la fecha con esos valores; sólo si trae hora
se usa `new Date(...)`.

**Mirá cómo está resuelto ya** en `src/lib/reportes/rango-de-dias.ts` —función `diaCalendario`— y
usá el mismo criterio. **No copies el archivo**: es de reportes. Si te sirve, poné la función en un
lugar común y que las dos la usen.

**Buscá si el mismo caso está en las otras hojas imprimibles** —contrato, itinerario, lista de
compras, presupuesto— y corregí todas en el mismo bloque: la fecha del evento se muestra en varias.

## Bloque 2 — "Enlace copiado" aunque no se haya copiado

Línea ~83:

```ts
navigator.clipboard.writeText(shareData.url);
toast({ title: "Enlace Copiado", ... });
```

**Nadie espera ni mira si funcionó.** Copiar al portapapeles falla seguido: sin permiso, en una
pestaña sin foco, o en un navegador viejo. Igual aparece el cartel verde. El operador cree que tiene
el enlace, lo pega en WhatsApp y manda cualquier cosa.

**Qué hacer:** esperar el resultado y **avisar distinto si falló**. Si no se pudo copiar, mostrar el
enlace en pantalla **seleccionable**, para que lo copie a mano: la app no puede dejarlo sin salida.

**Revisá los demás botones de compartir y de copiar de la app** —muro, invitación, álbum, portal del
cliente— y arreglá igual los que anuncien sin mirar.

## Lo que NO se toca

- El diseño de la hoja impresa: los tamaños y el orden están bien.
- La sincronización musical, que Codex ya dio por buena.
- Los textos que ve el cliente.

## Qué tiene que comprobar la prueba

1. **La fecha:** con una fiesta el `2026-09-30`, la hoja muestra **30 de septiembre**. Una prueba de
   navegador con el reloj del navegador en hora de Uruguay.
2. **El copiado:** haciendo que el portapapeles falle a propósito, **NO aparece "Enlace Copiado"** y
   sí aparece el enlace para copiar a mano.
3. Rompé las dos a propósito y verificá que se pongan en rojo.

```comprobar
archivo: src/app/(app)/fiestas/nueva/musica/pdf/page.tsx
usa: clipboard en src/app/(app)/fiestas/nueva/musica/pdf/page.tsx
prueba: tests/e2e/la-hoja-del-dj-dice-la-verdad.spec.ts
# Bloque 1 (verificado el 25/9)
usa: formatearFechaEvento en src/app/(app)/fiestas/nueva/musica/pdf/page.tsx
```
