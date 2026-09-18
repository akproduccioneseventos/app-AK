# Qué sigue para Gemini — tanda del 18 de septiembre de 2026

**Esto es la hoja de ruta de la tanda, no una orden nueva.** Dice **en qué orden** hacer lo que ya
está escrito y **cómo se entrega**. Leerla primero.

## Cómo se entrega TODO esto

**UNA SOLA propuesta con todos los bloques.** Cada fusión dispara un despliegue y eso se paga: no
se abre una propuesta por orden. Si un bloque se traba, **entregá el resto igual en la misma
propuesta** y decí cuál faltó y por qué, en una línea.

**Antes de decir "terminé", pasá lo que tocaste por las quince preguntas de
`docs/ANTES-DE-ENTREGAR.md`.** No es una auditoría general: es sobre lo que acabás de tocar.

**Y la regla de siempre:** ninguna prueba puede dar verde con la función apagada. Cada control
nuevo se rompe a propósito una vez y se deja escrito arriba del archivo que se probó así.

## El orden, de lo que más duele a lo que menos

### 1. Orden 56 — Los ajustes de avisos (va 0 de 3) — **lo más urgente**

`docs/ordenes/56-los-ajustes-de-avisos-se-guardan-de-verdad.md`

Es una pantalla de mentira: el que apaga un aviso lo sigue recibiendo, y los ajustes se pierden al
cambiar de computadora. **Empezá por acá.** Falta:

- que `src/app/actions/preferencias-avisos.ts` pida sesión con `requireAppSession`,
- que la pantalla `src/app/(app)/settings/notifications/page.tsx` lea de verdad con
  `leerPreferenciasDeAvisos`,
- y la prueba `src/__tests__/los-avisos-respetan-lo-que-se-apago.test.ts`.

### 2. Orden 65 — La carga operativa avisa cuando no alcanza el equipo

`docs/ordenes/65-la-carga-operativa-avisa-cuando-no-alcanza.md`

Se pueden pedir 12 parlantes teniendo 10 sin que nadie avise. El día de la fiesta faltan dos.

### 3. Orden 66 — La carga operativa se sincroniza entre dos operadores

`docs/ordenes/66-la-carga-operativa-se-sincroniza-entre-operadores.md`

**Es la misma pantalla que la 65: hacelas juntas**, en el mismo bloque, para no tocar dos veces el
mismo archivo.

### 4. Orden 68 — La hoja del DJ dice la verdad

`docs/ordenes/68-la-hoja-del-dj-dice-la-verdad.md`

La fecha puede salir impresa un día antes, y "Enlace copiado" aparece aunque no se haya copiado.
Las dos se arreglan en el mismo archivo y las dos se repiten en otras pantallas: corregilas todas.

### 5. Orden 67 — Barrer la app con las preguntas nuevas

`docs/ordenes/67-barrer-la-app-con-las-preguntas-nuevas.md`

Es la más larga y la que más rinde: la misma forma de defecto que Codex viene encontrando de a uno
está repetida en varios lugares. **Lo que toque plata, cobros, comida o permisos NO lo toques**:
anotalo en `docs/auditoria/BARRIDO-PREGUNTAS-NUEVAS.md` con archivo y línea, que lo arreglo yo.

### 6. Orden 55 — La decoración entrega lo que promete (va 1 de 6)

`docs/ordenes/55-la-decoracion-entrega-lo-que-promete.md`

Quedó a medias hace días. Va última porque no rompe nada hoy, pero **no la dejes para otra tanda**.

## Devoluciones que siguen esperando

Tres entregas anteriores volvieron con observaciones y **nadie las retomó**:

- `docs/ordenes/DEVOLUCION-48-entretenimiento-sesion-segura.md`
- `docs/ordenes/DEVOLUCION-61-la-auditoria-necesita-evidencia.md`
- `docs/ordenes/DEVOLUCION-acceso-administrativo.md` — ésta espera una decisión del dueño, no la
  toques.

Las dos primeras entran en esta misma propuesta.

## Lo que NO se toca, en toda la tanda

- **Los textos que ve el cliente y las decisiones de marketing**: promociones, descuentos, el reloj
  del simulador, la seña. Nada de eso se cambia, aunque parezca mejorable.
- **Lo que ya está arreglado**, que figura en `docs/YA-RESUELTO.md`. Si un análisis lo marca, es
  falso positivo.
- **Lo que arreglé yo en esta tanda**: la encuesta post fiesta, el borrado de equipos asignados, el
  ajuste de costos de insumos, los respaldos y el reporte por día de Uruguay.
- **Nada que aumente lo que se paga por mes.**

```comprobar
archivo: docs/ordenes/68-la-hoja-del-dj-dice-la-verdad.md
archivo: docs/ordenes/65-la-carga-operativa-avisa-cuando-no-alcanza.md
archivo: docs/ordenes/66-la-carga-operativa-se-sincroniza-entre-operadores.md
archivo: docs/ordenes/67-barrer-la-app-con-las-preguntas-nuevas.md
```
