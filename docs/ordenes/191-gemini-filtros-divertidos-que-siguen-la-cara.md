# PARA GEMINI - Orden 191: filtros divertidos que siguen la cara, y diseños estilo Canva

**Una sola propuesta con todos los bloques.** Si un bloque se traba, entregá el resto igual en la misma
propuesta y avisá cuál faltó. Antes de decir "terminé", pasá `docs/ANTES-DE-ENTREGAR.md` entero.

Arrancá de la rama `claude/app-debug-stabilize-m70e6z` de hoy, encima de las órdenes 188, 189 y 190.

## Lo que pidió el dueño (19/10/2026)

*"Filtros para cuando se sacan fotos o videos, que puedan poner filtros divertidos y que queden buenos.
Puede ser un filtro que se arme personalizado del 15, y después otros. No de colores: de otro tipo,
tipo Canva."*

Quiere los filtros de Instagram o Snapchat: cosas que **siguen la cara** (corona, orejitas, anteojos,
corazones) y diseños armados con el nombre de la fiesta.

## Lo que ya existe (no lo rehagas)

- **Marcos armados con los datos de la fiesta:** `dibujarMarcoDinamico` en
  `src/lib/entretenimiento/marcos-dinamicos.ts` (~24), con los estilos `'elegante' | 'quince' | 'boda' |
  'infantil' | 'neon_glam'`. Se usa en la fotocabina (`src/app/evento/fotocabina/[fiestaId]/page.tsx`
  ~830), en la 360 (`plataforma-360/[fiestaId]/page.tsx` ~605) y en Vogue (`bogue/[fiestaId]/page.tsx`
  ~662).
- **Stickers quietos:** `STICKERS` en la fotocabina (~88), con el selector "Accesorios y Stickers"
  (~1578). Son letras y símbolos puestos en un lugar fijo, **no siguen la cara**.
- **Recorte de fondo:** `src/lib/entretenimiento/segmentacion-fondo.ts`, con
  `@mediapipe/tasks-vision` 0.10.17 ya instalado y los archivos servidos desde la app (`/mediapipe/wasm`
  y `/models/segmentacion/`).
- **Filtro de belleza:** `src/lib/entretenimiento/filtro-belleza.ts`.
- **Los datos de la fiesta que ven las estaciones:** `getPublicEntertainmentEvent` en
  `src/lib/entertainment/station-config.ts` (~223), con `nombreAgasajado`, `tipoCelebracion`,
  `primaryColor` y el color de la invitación.

## Bloque 1 — el motor que sigue la cara

- Archivo nuevo `src/lib/entretenimiento/filtros-cara.ts`.
- Usa `FaceLandmarker` del mismo `@mediapipe/tasks-vision`, con el modelo
  `face_landmarker.task` **guardado en la app** (`public/models/caras/face_landmarker.task`), igual que
  el de segmentación. **Nada desde servidores de afuera.**
- `cargarDetectorDeCaras()` se carga una sola vez, y **sólo cuando el invitado elige un filtro de
  cara**. Si el equipo no puede, devuelve `null` y la estación sigue sin filtro, con el cartel "Este
  equipo no puede usar filtros de cara".
- `dibujarFiltroDeCara(ctx, video, filtro, puntos)` dibuja el filtro sobre cada cara: **hasta 6 caras a
  la vez**, porque en la fotocabina entran grupos. Cada cara se toma por su frente, sus ojos, su nariz y
  su boca, y el filtro **se agranda y se inclina con la cabeza**.
- **El filtro tiene que verse igual en la vista previa y en la foto o video final.** El mismo dibujo
  va al lienzo que se guarda, no sólo a la pantalla.
- Si en un cuadro no aparece ninguna cara, no se dibuja nada, y no queda el filtro flotando donde
  estaba.

## Bloque 2 — los filtros

Dibujados en el lienzo, o con imágenes livianas guardadas en `public/filtros/`, siempre hechas acá:
**nada de imágenes con marca de otros**. Los colores salen de `primaryColor` de la fiesta.

**Personalizados de la fiesta (los que pidió el dueño):**
1. **"Mis 15"**: corona o tiara sobre la cabeza y, abajo de la cara, una cinta con el nombre del
   agasajado y "XV". Aparece primero cuando `tipoCelebracion` es de quince.
2. **"Los novios"**: velo o galera según la cara, y la cinta con los nombres. Para casamientos.
3. **"Cumple"**: gorrito de cumpleaños y el número de años si está cargado.

**Divertidos, para todas las fiestas:**
4. Anteojos de fiesta grandes.
5. Orejitas y nariz de gatito.
6. Corazones en los ojos.
7. Bigote y sombrero.
8. Corona de flores.
9. Lentes de estrella brillante (neón).

**Estilo Canva** (no siguen la cara, son un diseño encima de la foto):
10. Tres diseños más para `dibujarMarcoDinamico`: `'revista'` (tapa de revista con el nombre del
    agasajado de título), `'polaroid'` (marco blanco con la fecha escrita a mano) y `'cartel_neon'` (el
    nombre en letras de neón arriba). Van al lado de los cinco que existen; **no cambies los que ya
    están**.

## Bloque 3 — en qué estaciones

- **Fotocabina** (`fotocabina/[fiestaId]/page.tsx`): en el panel "Personalizar mi foto", una fila nueva
  "Filtros" arriba de "Accesorios y Stickers", con los filtros de cara. Los stickers quietos quedan
  como están.
- **Touchpix** (`touchpix/[fiestaId]/page.tsx`), **Vogue** (`bogue/[fiestaId]/page.tsx`, es video) y
  **Espejo mágico** (`espejo-magico/[fiestaId]/page.tsx`): la misma fila de filtros.
- **Plataforma 360: sin filtros de cara**, porque la cámara gira y las caras quedan chicas. Sí los
  diseños nuevos del bloque 2.
- **En video**, el filtro se dibuja en cada cuadro de la grabación, no sólo en el primero.

## Bloque 4 — el operador elige

- En `EntertainmentStationRuntimeConfig` (`station-config.ts` ~13) sumá `filtrosActivos?: string[]`.
- En la pantalla del operador de cada estación, una lista con casillas para prender y apagar cada
  filtro, y **"el de la fiesta primero"** prendido por omisión.
- Si la lista está vacía, se muestran todos.
- El ajuste lo lee la estación: pregunta 3 de "Cuatro reglas" en CLAUDE.md, *todo lo que se puede
  editar tiene que leerlo alguien*.

## Qué NO tocar

- Los stickers quietos, los marcos que ya existen, el recorte de fondo y el filtro de belleza.
- La impresión de la tira de la fotocabina (`tira-fotocabina.ts`): el filtro va adentro de cada foto y
  la tira se arma igual que hoy.
- Nada que se pague por mes ni servicios de filtros de afuera.

## Prueba (que mire el resultado, no el ingrediente)

- `src/__tests__/los-filtros-siguen-la-cara.test.ts`, con puntos de cara de mentira:
  - con la cara a la izquierda, la corona se dibuja a la izquierda; corrida a la derecha, la corona va
    a la derecha;
  - con la cabeza inclinada 20°, el dibujo sale inclinado;
  - con dos caras, dos coronas;
  - sin caras, el lienzo queda **idéntico** al original.
- `src/__tests__/el-filtro-de-15-lleva-el-nombre.test.ts`: el filtro "Mis 15" escribe el
  `nombreAgasajado` de la fiesta, y sin nombre no escribe "undefined" ni deja la cinta vacía.
- `tests/e2e/la-fotocabina-ofrece-filtros.spec.ts`:
  - la fila "Filtros" aparece;
  - con `filtrosActivos: ['mis15']` sólo se ve ese;
  - la foto final guardada es distinta de la foto sin filtro (se comparan los dos lienzos, no un
    nombre en el código).

```comprobar
archivo: src/lib/entretenimiento/filtros-cara.ts
archivo: public/models/caras/face_landmarker.task
usa: dibujarFiltroDeCara en src/app/evento/fotocabina/[fiestaId]/page.tsx
usa: dibujarFiltroDeCara en src/app/evento/bogue/[fiestaId]/page.tsx
usa: dibujarFiltroDeCara en src/app/evento/touchpix/[fiestaId]/page.tsx
usa: dibujarFiltroDeCara en src/app/evento/espejo-magico/[fiestaId]/page.tsx
usa: filtrosActivos en src/lib/entertainment/station-config.ts
usa: revista en src/lib/entretenimiento/marcos-dinamicos.ts
prueba: src/__tests__/los-filtros-siguen-la-cara.test.ts
prueba: src/__tests__/el-filtro-de-15-lleva-el-nombre.test.ts
prueba: tests/e2e/la-fotocabina-ofrece-filtros.spec.ts
```
