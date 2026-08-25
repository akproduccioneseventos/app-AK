# Orden 7 — Que la app no mienta, y que la puerta de entrada se pueda usar

**Para:** Gemini
**Fecha:** 25 de agosto de 2026
**Entrega:** **UNA SOLA propuesta de cambios con los cuatro bloques.** No una por
bloque: cada fusión dispara un despliegue y eso se paga. Si un bloque se traba,
entregá los otros tres igual, en la misma propuesta, y decí cuál faltó y por qué.

---

## Por qué existe esta orden

El dueño preguntó por qué, trabajando con tres inteligencias, la app sigue dando
problemas. La respuesta honesta es que **todos los errores de esta semana son de la
misma familia**: la app dice una cosa y hace otra.

- El botón de ingreso decía "Ingresando..." para siempre y no estaba ingresando.
- Una pantalla decía que el asistente estaba "temporalmente desactivado". Funcionaba.
- La cabina decía "tu foto se sube cuando vuelva la señal", y con un iPhone la perdía.
- Instagram dice "se conecta desde Ajustes", y ahí no se puede conectar.

Nada de eso lo agarra una prueba, porque el código está bien escrito. Lo que falla es
**lo que se le promete al usuario**. Esta orden ataca esa familia entera.

---

## Bloque 1 — Instagram deja de mentir

**El problema, verificado línea por línea:** el mensaje que ve el usuario dice
*"Instagram todavia no esta conectado. Se conecta desde Ajustes, en Redes sociales."*
(`src/app/actions/social-media.ts`). Pero esa pantalla
(`src/app/(app)/settings/social-connections/page.tsx`) **sólo guarda la dirección del
perfil**. Lo que de verdad hace falta para bajar fotos está en
`src/lib/instagram/public-feed.ts`: un permiso de Meta y el identificador de la cuenta
comercial, que hoy se leen del entorno del servidor y **no se pueden cargar desde
ninguna pantalla**.

O sea: el dueño puede cargar su perfil, ver que quedó "conectado", y no bajar una sola
foto nunca, sin entender por qué.

**Qué hay que hacer:**

1. Que la pantalla de conexiones pueda recibir lo que de verdad conecta Instagram, no
   sólo la dirección del perfil.
2. Que muestre **estado real**, no un cartel fijo: conectado / falta un dato / vencido,
   con la fecha de la última vez que bajó fotos y cuántas trajo.
3. Un botón de **probar la conexión** que pregunte de verdad y diga qué pasó, en
   criollo.
4. Si falta algo, el mensaje tiene que decir **qué** falta. Nunca mandar a una pantalla
   donde el problema no se resuelve.

**Cuidado:** el permiso de Meta es un dato sensible. No se muestra en pantalla una vez
guardado, no se manda al navegador del invitado y no se escribe en el registro. Ya hay
una prueba que impide que esos datos viajen al público
(`src/app/actions/social-connections.ts`): respetala.

---

## Bloque 2 — El control que impide mentir

Esto es lo que hace que el bloque 1 no se repita en otro lado dentro de dos meses.

**Qué hay que hacer:** una prueba
(`src/__tests__/ninguna-pantalla-miente.test.ts`) que recorra las pantallas y falle
cuando una **afirma un estado que no comprobó**. Palabras a vigilar en el texto que ve
el usuario: "conectado", "sincronizado", "publicado", "enviado", "guardado",
"activo".

La regla: si una pantalla muestra una de esas palabras, tiene que ser a partir de un
dato que vino del servidor diciendo que pasó, no de una constante escrita a mano ni de
que la llamada no tiró error.

El mensaje de error de la prueba tiene que decir en criollo qué pantalla y qué palabra,
y por qué importa. Si hay casos legítimos, se declaran en una lista **con el motivo
escrito al lado**, como ya se hace en `auditoria-puertas-abiertas.test.ts`. Sin motivo,
no entra en la lista.

---

## Bloque 3 — Sacar las pantallas de programador

Adentro de la aplicación que usa el equipo hay tableros que son de desarrollo:

- `src/app/(app)/fiestas/nueva/integracion-post-445/` — muestra una lista de 37 cambios
  de código agrupados en bloques, con números de propuesta.
- `src/app/(app)/fiestas/nueva/cierre-100/` — una revisión final de producto.

No significan nada para nadie de AK. **Sacarlos de la aplicación.** Si el contenido
sirve como registro, que quede en `docs/`, no en una pantalla.

Ojo: hay que sacar también los accesos que llevan a ellas
(`src/components/.../post445-quick-access.tsx` y lo que enlace desde la pantalla de
armar la fiesta), y correr `npm run mapa:generar` para que el manual quede al día.

---

## Bloque 4 — La pantalla de armar una fiesta, usable

**El problema:** `src/app/(app)/fiestas/nueva/page.tsx` muestra **46 opciones en diez
categorías**, quince de ellas marcadas "Interno". Nadie usa 46 cosas para armar una
fiesta: se usan ocho o diez, y cambian según en qué etapa está el evento.

**Qué hay que hacer:**

1. Que la pantalla **abra en lo que importa hoy** para esa fiesta: pagos vencidos o por
   vencer, decisiones que está esperando el cliente, tareas atrasadas y los próximos
   hitos. Esos datos ya existen en la app: no inventes números nuevos.
2. Debajo, los accesos que se usan **siempre** (los ocho o diez de todas las fiestas).
3. El resto, detrás de un **"ver todo"**, agrupado como está hoy.
4. Lo marcado "Interno" no se muestra por defecto.

**Lo que NO hay que hacer:** borrar pantallas ni cambiar lo que hacen. Es sólo qué se
muestra primero. Cada pantalla que hoy existe tiene que seguir siendo alcanzable desde
"ver todo".

---

## Antes de entregar

- `npm run check:acentos` — sin acentos rotos. **Con acentos rotos no se fusiona.**
- `npx tsc --noEmit` — cero errores.
- `npx jest --silent` — todas en verde.
- `npm run build` — tiene que terminar bien. **No alcanza con el revisor de tipos:** ya
  pasó que los tipos daban cero y el build fallaba, y la app estuvo seis días sin poder
  publicarse.
- `npm run mapa:generar` — si sacaste o agregaste pantallas, el manual se regenera.
- **No toques `apphosting.yaml`.** Es la configuración del servidor y no entra en esta
  orden. **Tres entregas seguidas la trajeron modificada** con la configuración de
  cobros vieja: si tu copia la trae, sacá ese cambio antes de entregar.
- Anotá lo que hiciste en `docs/YA-RESUELTO.md` y en `docs/MANUAL-DE-LA-APP.md`, **en la
  misma propuesta**.

## Y la regla nueva, que vale de acá en adelante

**No se agrega una pantalla nueva sin sacar otra**, salvo que la pida el dueño. La app
llegó a 350 pantallas porque cada pedido se convirtió en una pantalla más en vez de un
cambio en la que ya existía. Si para resolver algo te parece que hace falta una pantalla
nueva, primero fijate si no se puede resolver en una que ya está.
