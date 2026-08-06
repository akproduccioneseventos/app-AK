# Orden de trabajo — Entretenimiento 01

**Para:** Gemini (Antigravity)
**Escribe:** Claude (auditoría y verificación)
**Fecha:** 6 de agosto de 2026
**Base:** `main` actualizado. Sincronizar antes de empezar.

---

## Cómo se trabaja esta orden

1. **Una tarea = una rama = una propuesta de cambio.** No juntes dos tareas en la
   misma propuesta. Una propuesta de cuarenta archivos no se puede revisar y se
   termina cerrando sin fusionar.
2. Antes de subir, que pasen **estos tres controles**. Si alguno falla, la
   propuesta vuelve sin revisar:
   - `npx tsc --noEmit` sin errores.
   - `npx jest --silent` todo en verde.
   - `npm run check:acentos` limpio. **Guardá siempre en UTF-8.** Una propuesta
     anterior metió 902 acentos rotos y hubo que cerrarla entera: además de
     verse mal en pantalla, rompe las comparaciones de texto con eñes.
3. Cada tarea dice **cómo se sabe que quedó bien**. Eso es lo que se verifica.
4. Si algo de la orden no se entiende o no se puede hacer como está escrito,
   **decilo antes de programar**. No improvises sobre plata ni sobre permisos.

## Regla de oro de este módulo

**Cada estación se vende y se usa por separado.** Un cliente puede contratar
sólo la fotocabina, o sólo la plataforma 360. Entonces:

- Ninguna pantalla puede romperse ni quedar vacía porque otra no esté contratada.
- Si algo depende de un dato que puede no existir (mesa asignada, muro social,
  lista de invitados), tiene que funcionar igual y explicar en una línea por qué
  no muestra eso.
- Nunca des por hecho que el muro social está habilitado.

## Regla de honestidad en pantalla

Ninguna pantalla puede decirle al invitado que algo salió bien si no salió bien.
Ya se corrigió este defecto en las cuatro estaciones de captura (propuesta #863):
mostraban "Escaneá tu recuerdo" con una rueda girando para siempre cuando la
subida había fallado, y la gente se iba creyendo que tenía su foto.

**Si un `catch` no le muestra nada al usuario, está mal.** Vale para todo lo que
sigue.

---

# PARTE 1 — Arreglos (hacer primero)

Son chicos, verificados uno por uno leyendo el código. Cada uno es una propuesta
aparte.

## Tarea 1.1 — La pantalla gigante se congela sin avisar

**Archivo:** `src/app/evento/en-vivo/[fiestaId]/pantalla/page.tsx` (alrededor de
la línea 203)

**Qué pasa hoy:** `fetchData()` hace un `Promise.all` de dos llamadas sin
`.catch()`. Si se corta la conexión, la pantalla del salón se queda mostrando lo
de hace un rato, o el cartel "Esperando contenido...", sin que nadie se entere.
El operador está en otra punta del salón y no lo ve.

**Qué hay que hacer:** capturar el error y mostrar un aviso **discreto y chico**
en una esquina — algo como "Reconectando…" — que desaparezca solo cuando la
siguiente carga funcione. No un cartel grande: esto se proyecta delante de toda
la fiesta y no puede quedar un error tapando la pantalla.

**Cómo se sabe que quedó bien:** si las dos llamadas fallan, aparece el aviso en
la esquina y el contenido anterior se mantiene visible. Cuando vuelve la
conexión, el aviso se va solo. Nunca se muestra un texto técnico.

## Tarea 1.2 — El muro en vivo se para y nadie se entera

**Archivo:** `src/app/evento/muro-en-vivo/[fiestaId]/page.tsx` (alrededor de la
línea 355)

**Qué pasa hoy:** hay un `catch (_) { }` con el comentario "Silent fail for
projection wall". Si falla la carga, no sólo se ignora: hay que revisar si
`pollingRef.current` queda en `true` y bloquea los reintentos siguientes. Si es
así, el muro no se recupera nunca hasta que alguien recarga la página.

**Qué hay que hacer:** que el error no bloquee los reintentos, y el mismo aviso
discreto de "Reconectando…" de la tarea 1.1. Reutilizá el componente que hagas
ahí, no lo copies.

**Cómo se sabe que quedó bien:** después de un error, el siguiente intento se
ejecuta igual y el muro se recupera solo. Hay una prueba que lo cubre.

## Tarea 1.3 — La galería y la red social fallan en silencio

**Archivos:**
- `src/app/evento/galeria/[fiestaId]/page.tsx` (líneas 26-27 y 31-35: un
  `.catch(() => {})` y un `catch (e) {}` vacíos)
- `src/app/evento/social/[fiestaId]/page.tsx` (alrededor de 336-349: el `catch`
  sólo hace `console.warn`)

**Qué pasa hoy:** si falla la carga, la galería muestra "Aún no hay fotos" cuando
en realidad hubo un error, y el feed social se congela sin avisar.

**Qué hay que hacer:** distinguir "todavía no hay nada" de "no se pudo cargar".
Son dos mensajes distintos, y el segundo con un botón de reintentar.

**Cómo se sabe que quedó bien:** con la carga fallando, la pantalla dice que no
se pudo cargar y ofrece reintentar. Con la carga bien y sin contenido, dice que
todavía no hay fotos.

## Tarea 1.4 — Tarjetas muertas en la zona digital

**Archivo:** `src/app/evento/zona-digital/[fiestaId]/page.tsx` (líneas 275-310)

**Qué pasa hoy:** cuando no encuentra el enlace de una estación, deja el `href`
vacío y renderiza un `div` no clickeable con `opacity-70` y un tooltip. La
tarjeta se ve casi igual que las otras. El invitado la toca y no pasa nada: le
parece que la app está rota.

**Qué hay que hacer:** que se vea claramente que esa estación no está disponible
para él, con un texto corto y visible (no un tooltip, que en el celular no
existe). Si la estación no está contratada, ni siquiera mostrarla.

**Cómo se sabe que quedó bien:** en un celular, sin tocar nada, se entiende
cuáles tarjetas se pueden abrir y cuáles no, y por qué.

## Tarea 1.5 — El tótem se traga el error del permiso

**Archivo:** `src/app/evento/totem/[fiestaId]/[totemId]/page.tsx` (línea 176)

**Qué pasa hoy:** `getEntertainmentLaunchToken(...).catch(() => {})`. Si el
permiso no llega, el tótem igual muestra su código QR, pero los invitados que lo
escaneen no van a poder subir nada.

**Qué hay que hacer:** si el permiso no llega, no mostrar un QR que no sirve.
Mostrar que la estación no está lista y reintentar solo cada pocos segundos.

**Cómo se sabe que quedó bien:** sin permiso no hay QR en pantalla, hay un aviso,
y cuando el permiso llega el QR aparece sin recargar la página.

---

# PARTE 2 — La ventaja que las otras plataformas no pueden copiar

**Contexto, para que se entienda el porqué.** Se investigaron las plataformas
comerciales del rubro: muros de fotos en vivo (Guestpix, Kululu, Wedbox,
GuestLense, Instawall, VeamosLasFotos, EventPix y otras) y juegos en vivo
(Kahoot, Slido, AhaSlides, Crowdpurr, TriviaMaker, My Wedding Trivia).

Conclusión: **ninguna sabe quién es cada invitado.** Son herramientas anónimas.
No conocen la lista de invitados, ni quién confirmó, ni en qué mesa está sentado
cada uno, porque nunca tuvieron esos datos. Varias además cobran por mes y ponen
topes de fotos o de participantes.

La app de AK sí tiene todo eso: lista de invitados, confirmaciones, mesas, portal
del cliente. **Ahí está la diferencia, y no se copia con animaciones más lindas.**

Las tres tareas que siguen son eso. Hacerlas **después** de la Parte 1, y también
de a una.

## Tarea 2.1 — Que el muro salude por nombre

**Idea:** cuando un invitado sube una foto desde su enlace personal, el muro no
debería mostrar "Invitado" ni pedirle que escriba su nombre: ya sabemos quién es.

**Qué hay que hacer:** si la subida viene con la identificación del invitado
(`guestId` + token, como ya usan el hub y la red social), guardar el nombre real
junto a la publicación y mostrarlo en el muro y en la pantalla gigante.

**Cuidado obligatorio (estación individual):** si la foto viene de una estación
del salón, sin invitado identificado — que es el caso de la fotocabina con el QR
general — tiene que seguir funcionando igual que hoy, sin nombre. **No pedirle
nunca al invitado que se registre.** Eso es exactamente lo que hace molestas a
las otras plataformas.

**Cómo se sabe que quedó bien:** una foto subida desde el enlace personal aparece
con el nombre del invitado; una subida desde el QR del salón aparece sin nombre y
sin errores. Hay pruebas para los dos casos.

## Tarea 2.2 — Trivia por mesa

**Idea:** la trivia hoy es individual. Si arma equipos por mesa automáticamente y
muestra qué mesa va ganando, la fiesta cambia: la gente se mira entre mesas. Es
lo que ninguna plataforma puede hacer sola, porque no sabe dónde está sentado
nadie.

**Qué hay que hacer:** cuando el invitado entra con su enlace personal y tiene
mesa asignada, sumar sus puntos al total de su mesa. En la pantalla grande,
ranking por mesa además del individual.

**Cuidado obligatorio:** el invitado sin mesa asignada tiene que poder jugar
igual, en el ranking individual. Nada de bloquearlo ni de mandarlo a una pantalla
de error.

**Cómo se sabe que quedó bien:** con invitados de dos mesas distintas, cada punto
va al total correcto y el ranking por mesa se ordena bien. Un invitado sin mesa
juega y puntúa individualmente. Hay pruebas de las dos cosas.

## Tarea 2.3 — El álbum al día siguiente, en el portal del cliente

**Idea:** las plataformas de internet guardan las fotos entre 2 meses y 1 año, en
su sitio, y varias cobran extra por bajarlas en buena calidad. Acá el cliente ya
tiene su portal: las fotos de su fiesta tienen que estar ahí, suyas, sin plazo ni
costo extra.

**Qué hay que hacer:** una sección en el portal del cliente con todo lo que
quedó de la fiesta — fotos y videos de todas las estaciones contratadas, los
mensajes de la cápsula del tiempo — y la posibilidad de bajarlo todo junto.

**Cuidado obligatorio:** sólo el material de las estaciones que ese cliente
contrató. Si contrató una sola, se ve una sola, sin secciones vacías.

**Cómo se sabe que quedó bien:** un cliente con una sola estación contratada ve
sólo esa; uno con varias las ve todas; y la descarga junta funciona en las dos
situaciones.

---

## Lo que NO hay que tocar en esta orden

- Nada de plata: presupuestos, cobros, facturas, descuentos.
- Nada de permisos de acceso ni de quién puede ver qué, más allá de lo que dice
  cada tarea.
- El ajuste anual del 15% y los descuentos de marketing son decisiones tomadas:
  no son errores.
- Los controles rojos de GitHub son por facturación de la cuenta. No los
  investigues: lo que vale es lo que se verifica localmente.
