# Orden 87 — La descarga del Video de Vida avisa lo que falta (VID03, Codex 25/9)

**CERRADA: la hizo Claude el 25 de septiembre de 2026, por pedido del dueño.** Gemini no la
tiene que hacer. Era el bloque 3 de la orden 69, que se había escapado.

**Para Gemini. UNA SOLA PROPUESTA.** Arrancá de la versión principal actualizada. Antes de decir
"terminé", leé `docs/ANTES-DE-ENTREGAR.md` y corré tus pruebas.

## Qué pasa hoy

`src/app/api/video-vida-photos/[fiestaId]/download/route.ts`, en `GET`, recorre `photoUrls`
(~línea 46). Cuando una foto no baja, la saltea sin anotar nada:
- `if (!res.ok) continue;` (~línea 55);
- una excepción de red corta todo con un 500.

Pasa lo mismo cuando la dirección no está permitida (`continue`, ~línea 52). Al final responde 200
con el archivo comprimido **aunque le falten fotos o no tenga ninguna**. La pantalla
`src/app/(app)/fiestas/nueva/video-vida/page.tsx`, en `handleDownloadAll` (~línea 220), toma el
200 como éxito y dice "Descarga Iniciada". El equipo baja un archivo incompleto o vacío sin
enterarse.

## Qué se pide

1. **En la ruta**, contar las fotos pedidas, las incluidas y las que fallaron. Cuentan como
   falla: `!res.ok`, una excepción de `fetch` (envolverlo en `try/catch` por foto) y una
   dirección bloqueada.
2. **Si no se incluyó ninguna**, responder **502** con
   `{ error: 'No se pudo bajar ninguna foto. Probá de nuevo en un rato.' }`. Nunca un archivo
   vacío con 200.
3. **Si faltan algunas**:
   - agregar al archivo comprimido `FALTAN_FOTOS.txt` con cuántas faltaron y el **nombre** de
     cada una. Sólo el nombre, sacado igual que `name`, **nunca la dirección completa**, que
     lleva la firma de acceso;
   - poner los encabezados `X-Fotos-Pedidas`, `X-Fotos-Incluidas` y `X-Fotos-Fallidas`.
4. **Nombres repetidos**: si dos fotos dan el mismo `name`, la segunda va como `nombre-2.jpg`,
   así no se pisan dentro del archivo.
5. **En la pantalla**, en `handleDownloadAll`:
   - si `X-Fotos-Fallidas` es mayor que 0, el aviso dice *"Se bajaron N de M fotos. Faltaron K:
     probá de nuevo más tarde"* en vez de "Descarga Iniciada";
   - con 502, mostrar el `error` de la respuesta: hoy lee `errorData.details`, que no viene.

## Qué NO tocar

- `hasAppSession()` al principio de la ruta ni `isUrlAllowed`: es el permiso y la protección de
  direcciones.
- El tope de 50 MB y su aviso: quedan como están.
- La rama "Legacy local path" (`fs.readFile(url)`): no la toques; si te molesta, avisá.

## Qué tiene que comprobar la prueba (resultado, no ingrediente)

`src/__tests__/video-vida-descarga-avisa-lo-que-falta.test.ts`, con `fetch` simulado y **leyendo
el archivo comprimido de verdad** con JSZip:

- **dos fotos bien**: 200, dos fotos adentro y sin `FALTAN_FOTOS.txt`;
- **una bien y una con 404**: 200, una foto, `FALTAN_FOTOS.txt` nombra la que falta **sin**
  `https://`, y `X-Fotos-Fallidas: 1`;
- **las dos fallan (500, y una excepción de red)**: 502 y ningún archivo comprimido;
- **dos fotos con el mismo nombre**: quedan las dos;
- **sin sesión**: 401, como hoy.

Cada caso **se rompe a propósito** antes de entregar: volviendo al `continue` de antes, el
segundo y el tercero se tienen que poner en rojo.

```comprobar
archivo: src/app/api/video-vida-photos/[fiestaId]/download/route.ts
usa: X-Fotos-Fallidas en src/app/(app)/fiestas/nueva/video-vida/page.tsx
usa: FALTAN_FOTOS en src/app/api/video-vida-photos/[fiestaId]/download/route.ts
prueba: src/__tests__/video-vida-descarga-avisa-lo-que-falta.test.ts
```
