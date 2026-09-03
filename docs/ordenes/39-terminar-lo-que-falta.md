# Orden 39 — Terminar lo que falta

**Escrita el 3 de septiembre de 2026.** Es la lista completa de lo que queda contra las
plataformas del rubro, **medida, no supuesta**.

> **UNA SOLA PROPUESTA con todos los bloques.** Si uno se traba, entregá el resto y decí cuál
> faltó y por qué. No abras una propuesta por bloque: cada fusión dispara un despliegue.

## Antes de arrancar

**Corré `npm run "falta?"`.** Te dice qué falta, ordenado por lo que le cuesta plata al negocio.
**Y acordate de las dos que ya nos costaron caro:**

- **Que un control dé verde no alcanza.** Pasó tres veces esta semana: un elemento invisible, una
  variable declarada y sin usar, y una pantalla impecable sin datos.
- **Antes de programar algo, fijate que no exista.** La mitad de esta orden es enchufar cosas que
  ya están escritas.

---

## BLOQUE 1 — LO MÁS BARATO: compartir lo que YA EXISTE

**Nada de esto se programa de cero.** Está escrito y andando en otra estación. Se saca a un lugar
común y se usa en las dos. **Nunca copiar y pegar**: dos copias se despegan en un mes.

| Falta en | Qué | Dónde ya está |
|---|---|---|
| Fotocabina | Accesorios que se arrastran | `espejo-magico/[fiestaId]/page.tsx:64` (`STICKERS_LIST`) |
| Fotocabina | Firmar o dibujar sobre la foto | `espejo-magico/[fiestaId]/page.tsx:107`, modo `firma` |
| Fotocabina | Video | `plataforma-360/[fiestaId]/page.tsx:65` (`MediaRecorder`) |
| Fotocabina | Cámara lenta | `plataforma-360/[fiestaId]/page.tsx:389` |
| Fotocabina | Boomerang o GIF | `src/lib/entretenimiento/gif-generator.ts:19` |
| Bogue | Filtro de belleza | `src/lib/entretenimiento/filtro-belleza.ts` |
| Bogue y Espejo | Cambiar el fondo | `procesarFondoCanvas`, **ya enchufado en la fotocabina**: copiá cómo quedó ahí |
| Espejo | Texto de marca junto al QR | `buzon/[fiestaId]/page.tsx:1107` (`brandText`) |
| Plataforma 360 | Música sobre el video | ya existe en el 360 el selector de MP3; falta mezclarla al video |

**Son nueve funciones y ninguna es nueva.** Este bloque solo sube la fotocabina de 17 a 22.

## BLOQUE 2 — LA FOTOCABINA, lo que falta de cero

- **Armar el diseño de la impresión.** Hoy `src/lib/entretenimiento/tira-fotocabina.ts:56` elige
  solo entre `strip_3`, `single_photo` y `strip_4`, **y nadie puede cambiarlo**. Que lo elija el
  operador en los ajustes de la fiesta.
- **La galería de la noche dentro de la estación.** Existe como pantalla aparte
  (`/evento/galeria/[fiestaId]`); falta poder verla **sin salir de la fotocabina**.
- **Marcos animados.** Hoy `FRAMES` (línea ~70) son fijos.

## BLOQUE 3 — LA PLATAFORMA 360

- **Cortina de entrada y de salida** del video.
- **Marco animado** sobre el video.
- **Elegir cuántas vueltas da** el brazo. Hoy se elige la duración (10, 15, 20 segundos), que no
  es lo mismo.

## BLOQUE 4 — EL ÁLBUM DEL RECUERDO

- **Descargar todo junto.** Verificado: no hay ninguna función de descarga en
  `evento/album/[fiestaId]/page.tsx`. **Ojo: NO uses `/api/fiestas/[fiestaId]/download-recuerdos`,
  que pide sesión de administrador** y le contestaría "no autorizado" al cliente.
- **Que se arme solo al terminar la fiesta**, sin que nadie apriete nada.
- **La grilla de caras también en el álbum.** Quedó sólo en la galería; la orden 36 pedía las dos.

**El cliente NO elige fotos.** Decisión del dueño: el álbum se arma solo y se entrega terminado.

## BLOQUE 5 — LA DECORACIÓN

- **Que cuente los invitados solo**, tomándolos del presupuesto.
- **Que avise si un elemento ya está usado** en otra fiesta la misma fecha. Es lo que evita
  prometer dos veces el mismo panel.
- **La vista 3D.** Los componentes existen (`src/components/salon-3d/DecoItem3D.tsx`) y la
  pantalla usa sólo el plano 2D.

## BLOQUE 6 — LO QUE FALTA SUELTO

- **Pantalla gigante:** fondo elegible (con **ocho o diez** bien hechos alcanza) y **moderación
  que ayude sola**: hoy se marca en la base y no hay nada en pantalla que le diga al operador qué
  conviene mirar.
- **Invitación:** pedir canciones desde la invitación.
- **Espejo Mágico:** las animaciones con locución. **Ojo, no son 200**: con seis o siete bien
  hechas alcanza, y son mucho trabajo por cada una. **Empezá por tres.**

---

## LO QUE NO SE HACE EN ESTA ORDEN

**"Cambiar el fondo SIN tela"** (la que separa a la persona sin croma) **queda para después**, y
va junta con la grilla de caras: **las dos necesitan el mismo modelo de inteligencia artificial
en el navegador**. Cuando se haga el de la devolución de la grilla, ésta sale casi gratis.
**Hacerlas por separado es pagar dos veces.**

## Lo que NO se toca

El menú y los ingredientes · el ajuste anual del 15% · el reloj del simulador · los descuentos ·
**ningún texto que vea el cliente** · `apphosting.yaml` · y **nada que aumente lo que se paga por
mes**. Si la única forma de hacer algo es pagando un servicio, **pará y avisá**.

## Antes de decir que terminaste

1. `npm run "falta?"` — si sigue nombrando algo de esta orden, falta.
2. **Abrí la pantalla y miralo.** Que la función exista no es que ande: es la forma exacta que
   tuvieron las tres fallas de esta semana.
3. `npm run "publicar?"` completo, **una sola vez, al final**.
4. `npm run limpiar:corrida`.
5. Anotado en `docs/YA-RESUELTO.md` **con su línea en el bloque `comprobar`**.

```comprobar
usa: STICKERS en src/app/evento/fotocabina/[fiestaId]/page.tsx
usa: MediaRecorder en src/app/evento/fotocabina/[fiestaId]/page.tsx
usa: aplicarFiltroBelleza en src/app/evento/bogue/[fiestaId]/page.tsx
usa: procesarFondoCanvas({ en src/app/evento/espejo-magico/[fiestaId]/page.tsx
usa: brandText en src/app/evento/espejo-magico/[fiestaId]/page.tsx
usa: agruparEnPersonas en src/app/evento/album/[fiestaId]/page.tsx
usa: DecoItem3D en src/app/(app)/fiestas/nueva/decoracion/page.tsx
prueba: tests/e2e/la-fotocabina-tiene-todo.spec.ts
prueba: tests/e2e/el-album-se-baja-entero.spec.ts
usa: /invitado/ en tests/e2e/las-pantallas-rotas-se-arreglaron.spec.ts
```

---

## BLOQUE 7 — LA PANTALLA DEL INVITADO SE ROMPE. Es la más urgente de esta orden.

**`/invitado/[fiestaId]/[invitadoId]` tira el error 310 de React**, medido el 3 de septiembre de
2026 abriéndola en el navegador. **Es la que abre el invitado con su enlace**: si se rompe, se
entera en la fiesta.

**Lo que YA descarté**, para que no pierdas el viaje:

- **La pantalla del enlace está limpia**: `invitado/[fiestaId]/[invitadoId]/page.tsx` son 17
  líneas, un reenvío del servidor, **sin un solo gancho**. El error viene del destino.
- **El destino es `/portal-invitado/[fiestaId]/[guestId]`**, que son seis líneas que re-exportan
  `invitacion/[fiestaId]/invitado/[guestId]/page.tsx`. **Ahí está el problema.**
- **En esa pantalla los ganchos están bien ordenados**: todos entre las líneas 198 y 239, y los
  cortes (`if (isLoading)`, `if (loadError)`, `if (allowGuestPortal === false)`) vienen después,
  en las líneas 252, 255 y 298. **Comprobado: no hay ningún gancho después de un corte.**
- **`MiniQuiosco.tsx` también está bien ordenado**: ganchos en 44-72, cortes en 143 y 147.

**Entonces la causa es otra**, y el error 310 tiene dos más:

1. **Un componente definido adentro de otro.** Si una función de componente se declara dentro del
   cuerpo de otra, React la trata como nueva en cada dibujo y se le desordenan los ganchos. **Es
   la causa más probable acá.** Buscá `function` o `=> (` que devuelvan pantalla **adentro** de
   `GuestPortalContent`.
2. **Un gancho adentro de un `if`, de un bucle o de un `&&`**, en cualquiera de los componentes
   hijos que dibuja esa pantalla.

**Qué comprueba la prueba:** que al abrir `/invitado/<fiesta>/<invitado>` **no aparezca ningún
error de React en la consola**. Ya está escrita en
`tests/e2e/las-pantallas-rotas-se-arreglaron.spec.ts` y hoy se saltea sola porque la pantalla
figura en `docs/pantallas-rotas-conocidas.json`. **Cuando la arregles, sacala de ese archivo y la
prueba empieza a exigírsela sola.** Ese número sólo puede bajar.
