# Orden 355 — Cuarta auditoría externa del 25/11: títulos dobles, páginas repetidas, ceros mientras carga y citas que no se cierran

**Para Gemini. Va en la MISMA propuesta que la 346 a 350, al final.** Si un bloque se traba, entregá el resto y avisá
cuál faltó. Antes de decir "terminé", leé `docs/ANTES-DE-ENTREGAR.md`. Usá `que-te-encuentren` y `celular-primero`.
Número 355 a propósito: del 351 al 354 los usa el robot.

## Por qué
Cuarta auditoría externa del 25/11/2026, hecha sólo con lectura y con la sesión de auditor. Claude confirmó cada hallazgo en
el código. Lo que no entra está al final, con su motivo.

## Bloque 1 — El nombre de la empresa sale dos veces en el título (hallazgo 2)
El layout raíz ya agrega `'%s | AK Producciones'` (`src/app/layout.tsx` ~69). Las páginas que escriben el sufijo a mano
lo duplican en la pestaña y en Google ("Cumpleaños… | AK Producciones | AK Producciones").
1. Sacá el sufijo del `title` de primer nivel en: `src/app/cumpleanos/page.tsx` ~7, `src/app/quinceaneras/page.tsx` ~9,
   `src/app/privacidad/page.tsx` ~14, `src/app/public/[eventType]/page.tsx` ~47, `src/app/public/blog/page.tsx` ~16,
   `src/app/public/blog/[slug]/page.tsx` ~45, `src/app/experiencia-ak/page.tsx` ~27, `src/app/galeria-led/layout.tsx` ~7,
   `src/app/presentacion-led/layout.tsx` ~5, `src/app/catalogo/layout.tsx` ~7, `src/app/evento/galeria/layout.tsx` ~4,
   `src/app/evento/espejo-magico/layout.tsx`. Lo que queda va sin sufijo (lo pone el layout).
2. Los `openGraph.title` y `twitter.title` **quedan como están** (ahí no hay plantilla y el nombre tiene que ir).
3. Título de primer nivel de hasta 60 caracteres contando el " | AK Producciones" que agrega el layout.
4. `src/lib/seo/event-landing.test.ts` espera "Bodas | AK Producciones": ajustala a lo que devuelve la función ahora.

## Bloque 2 — Dos páginas por tipo de fiesta compiten en Google (hallazgo 4)
`/bodas`, `/quinceaneras` y `/cumpleanos` (páginas propias, sin canonical) y `/public/bodas`, `/public/xv-anos` y
`/public/cumpleanos` (ruta `src/app/public/[eventType]/page.tsx`) están **las seis** en `PAGINAS_PARA_GOOGLE`
(`src/lib/seo/paginas-publicas.ts` ~20-37).
1. La buena es la propia: `/bodas`, `/quinceaneras`, `/cumpleanos`. Que cada una tenga su `alternates.canonical`.
2. En `src/app/public/[eventType]/page.tsx`, para `bodas`, `xv-anos` y `cumpleanos` el canonical apunta a la página propia
   (un mapa chico en el mismo archivo). Las demás (`fiestas`, `corporativos`, `aniversarios`) quedan como están.
3. Sacá `/public/bodas`, `/public/xv-anos` y `/public/cumpleanos` de `PAGINAS_PARA_GOOGLE`. **No borres esas páginas ni
   pongas desvíos**: hay enlaces viejos y QR que llevan ahí.
4. Coordiná con la orden 347 (páginas por tipo de fiesta), que va en la misma propuesta: no dejes dos canonical distintos.

## Bloque 3 — /enlaces sin imagen para compartir (hallazgo 5)
`src/app/enlaces/page.tsx` ~14-22: sumá `openGraph.images` con la misma imagen y el mismo tamaño que usa la portada, y un
`h2` visible ("Lo que hacemos" o el título de la sección de enlaces que ya tenga la página). No cambies los enlaces.

## Bloque 4 — La galería del simulador muestra "Instagram: …" debajo de cada foto (hallazgo 7)
`src/app/simulador-de-presupuesto/page.tsx` ~2012-2032 usa `foto.titulo` como `alt` **y como texto visible**, y ese título
lo arma `src/app/actions/social-media.ts` ~371 como `` `Instagram: ${category}` ``.
1. En la pantalla: el texto visible es la categoría sola, con la primera letra en mayúscula ("Eventos", "Bodas"). El `alt`
   es propio de cada foto: `foto.descripcion` si existe, si no "`<categoría>` de AK Producciones, foto N".
2. En `social-media.ts`, las fotos nuevas guardan `titulo` = la categoría, sin "Instagram:". El origen ya está en otro campo.
   Las viejas no se reescriben: la pantalla saca el prefijo al mostrar.
3. **Los testimonios no se tocan** (ortografía y cifras): son citas reales y las decide el dueño.

## Bloque 5 — Botones sin nombre en la presentación LED (hallazgo 8)
`src/app/presentacion-led/page.tsx`: los puntitos de navegación (~1158-1167) llevan `aria-label="Ir a la diapositiva N"` y
`aria-current` en el activo; el área tocable mide al menos 24 px de alto (padding alrededor del puntito, el dibujo puede
seguir chico). El botón de pantalla completa (~881-886) lleva `aria-label="Pantalla completa"`. Mirá la portada a 1280 px:
el borde cortado arriba del logo no tiene que verse. **No cambies textos, orden ni diseño de las diapositivas.**

## Bloque 6 — Números en 0 mientras carga (hallazgo 9)
1. `src/app/(app)/empleados/page.tsx` ~414: "Listado de Empleados ({empleados.length})" muestra "(0)" mientras dice
   "Cargando empleados…". Mientras carga, sin número.
2. `src/app/(app)/eventos/page.tsx`: "Eventos Pasados" (~604-612, `kpiData.fiestasPasadas` arranca en 0 ~104-107) y
   "Eventos Futuros" (~617-625, `activePlanningCount`) muestran 0 antes de tener los datos. Mientras carga, un esqueleto o
   "…", nunca un 0.
3. Barrido en toda la app (abajo): todo contador que se pinta con un valor inicial en 0 antes de cargar.

## Bloque 7 — Dos pantallas cuentan las fiestas próximas distinto (hallazgo 10)
`/eventos` cuenta "Futuros" con `activePlanningCount` (`src/app/(app)/eventos/page.tsx` ~160-171: sin DEMO, sin
suspendidas, fecha desde hoy o Contratada). `src/app/recursos-multi-evento/page.tsx` ~92-103 sólo saca suspendidas, **cuenta
la DEMO** e incluye 30 días para atrás, y el cartel dice "Eventos próximos".
1. Pasá la regla de `/eventos` a una función compartida (`src/lib/fiesta/` , por ejemplo `esFiestaProxima`) y que las dos
   pantallas cuenten "próximos" con ella.
2. La detección de choques de personal de recursos puede seguir mirando los 30 días anteriores, pero sin la DEMO, y el número
   del cartel "Eventos próximos" sale de la función compartida.

## Bloque 8 — Las citas pasadas quedan "Agendada" para siempre, y "Oficina AK Producciones" (hallazgo 13)
1. Nada escribe el estado `'Realizada'` (`src/types/crm.ts` ~161). En `src/app/(app)/calendario/page.tsx`, una cita con
   fecha pasada y estado "Agendada" se muestra como **"Pasada — ¿se hizo?"** con dos botones de un toque: "Se hizo"
   (guarda `Realizada`) y "No vino" (guarda el estado de no asistencia que ya exista en el tipo; si no hay, sumalo). Las
   pasadas sin cerrar se cuentan aparte, no en "pendientes" ni "confirmados" del mes.
2. **No hay oficina** (decisión del dueño, 17/11/2026: "reunión a coordinar"). Cambiá:
   `src/app/actions/simulator-agenda.ts` ~124 (`'Oficina AK Producciones'` → `'Reunión presencial a coordinar'`),
   `src/components/simulator/SimulatorMeetingScheduler.tsx` ~80 (`'Presencial en Oficina'` → `'Presencial a coordinar'`) y
   ~131 (el texto visible "Oficina AK Producciones · Salto, Uruguay" → "Lugar a coordinar · Salto, Uruguay"), y el valor por
   defecto "Oficina AK Salto" de `src/app/(app)/calendario/page.tsx` ~374, ~408, ~859 → "A coordinar".
   También el lugar por defecto `'Oficina AK Producciones Salto'` de `src/lib/agenda-utils.ts` ~23 (evento de Google
   Calendar) y ~35 (mail de confirmación), y `'Oficina AK Producciones, Salto, Uruguay'` del enlace de calendario en
   `src/app/actions/simulator-agenda.ts` ~173: pasan a "Lugar a coordinar por WhatsApp". El código que compara el tipo
   `'Presencial en Oficina'` acepta los dos valores, el viejo y el nuevo, para las citas ya guardadas.
   Las citas viejas guardadas no se reescriben: al mostrarlas, "Oficina AK Producciones" se lee "A coordinar".

## Bloque 9 — Lo que la pantalla afirma sin mirarlo
1. `src/app/(app)/perfil/page.tsx` ~35: "Estás autenticado con contraseña compartida." es fijo. Que diga cómo entró de
   verdad (Google o clave), sacándolo de la sesión que ya lee esa pantalla, y el rol real ("Auditor" con la sesión de
   auditor). Si la sesión no trae el método, no lo afirmes: mostrá sólo el rol.
2. `/fiestas/nueva` sin fiesta (`src/app/(app)/fiestas/nueva/page.tsx` ~345) y `/fiestas/nueva/datos` (aviso "Error. No se
   encontró el ID de evento" en `src/components/fiestas/panels/configuracion.tsx` ~76-77) mandan a `/eventos` sin explicar.
   Sin fiesta, en vez de desviar con un aviso de error, mostrá una tarjeta con menú: "Para planificar, elegí una fiesta" con
   el botón **"Ir a Fiestas"** (a `/eventos`) y "Crear fiesta", que dispara la misma acción de crear que usa
   `src/app/(app)/eventos/page.tsx` ~320-324.
3. `src/app/evento/actual/checkin/page.tsx` ~43 ("Faltan datos para el check-in (ID de fiesta o invitado).") y
   `src/app/evento/actual/mesa/page.tsx` ~26 ("No se proporcionó ID de invitado."): los lee un invitado. Texto: "Abrí este
   enlace desde tu invitación o pedile el QR a la recepción." Los botones de salida que ya tienen quedan.

## Barrido en toda la app
- Contadores en 0 mientras cargan (pregunta 228): `npm run formas-que-mienten` y además
  `grep -rnE "\(\{\w+\.length\}\)" src/app src/components --include=*.tsx`; en cada uno, mirar si se pinta antes de cargar.
- Títulos con el nombre dos veces (pregunta 229): `grep -rnE "^  title:\s*['\"\`][^'\"\`]*\| AK Producciones" src/app` y
  todo `title` de primer nivel dentro de un layout que hereda la plantilla. Los de `openGraph`/`twitter` no cuentan.
- Estados con fecha que nunca se cierran (pregunta 230): estados "Agendada", "Pendiente", "Programada" de citas, tareas y
  recordatorios; por cada uno, ¿qué lo pasa a cerrado cuando la fecha ya pasó? Lo que no tenga nada, se muestra como pasado.
- Textos fijos que afirman algo de la sesión o del lugar (pregunta 231): `grep -rniE "oficina|contraseña compartida|estás
  autenticado" src --include=*.tsx`.
Lo encontrado se arregla en esta misma orden. Plata, cobros y permisos: se lista y no se toca.

## Lo que NO hay que hacer
- No tocar testimonios, cifras, el reloj del simulador ni el pie (YouTube y correo en el pie: lo decide el dueño).
- No borrar páginas públicas ni poner desvíos nuevos.
- No escribir datos viejos de la base para "arreglarlos": se corrigen al mostrar.

## Lo que no entra, y por qué
- `robots.txt` con `Disallow: /` al final (hallazgo 1): es a propósito (cerrado y abierto página por página,
  `src/app/robots.ts`); Google y Bing eligen la regla más larga. Falso positivo.
- `/catalogo` en la lista para Google (hallazgo 3): ya decidido y anotado en `YA-RESUELTO.md` (20/11).
- Pendientes con fechas de agosto y setiembre en Pagos rápidos (hallazgo 11): los borra la tarea de empezar 2027 que se
  publicó hoy. Tope de fecha futura del simulador: propuesta para el dueño, no es un error.
- Personal sin teléfono (hallazgo 12): es un dato a cargar. La cédula completa ya la ve sólo quien tiene permiso de sueldos.
- El nombre que cambia en el encabezado (hallazgo 14): ya está en la orden 349, bloque 7.5.
- El "no negociable" de Agentes autónomos: es un texto para el dueño, no para los agentes.

## Qué tiene que comprobar la prueba
- `src/__tests__/auditoria-4-del-25-11.test.ts`: ninguna página de `PAGINAS_PARA_GOOGLE` tiene un `title` de primer nivel
  que termine en "AK Producciones" o "AK Producciones Eventos"; `/public/bodas` devuelve canonical `/bodas`;
  `esFiestaProxima` no cuenta una fiesta DEMO ni una de ayer; el lugar que guarda `simulator-agenda` no dice "Oficina".
- `tests/e2e/la-cuarta-auditoria-del-25-11.spec.ts`: en `/empleados` y `/eventos`, con la respuesta del servidor retenida,
  no aparece "(0)" ni un contador en 0; al soltarla aparecen los números. En `/calendario` una cita de ayer en "Agendada"
  muestra "Pasada — ¿se hizo?" y "Se hizo" la cambia. En `/perfil` con la sesión de auditor no dice "contraseña compartida".
  En `/presentacion-led` los puntitos tienen nombre accesible.

```comprobar
archivo: src/lib/fiesta/esFiestaProxima.ts
usa: esFiestaProxima en src/app/recursos-multi-evento/page.tsx
usa: esFiestaProxima en src/app/(app)/eventos/page.tsx
usa: Pasada en src/app/(app)/calendario/page.tsx
usa: Reunión presencial a coordinar en src/app/actions/simulator-agenda.ts
usa: a coordinar en src/components/simulator/SimulatorMeetingScheduler.tsx
no-usa: Oficina AK Producciones en src/lib/agenda-utils.ts
no-usa: Oficina AK Producciones en src/app/actions/simulator-agenda.ts
no-usa: contraseña compartida en src/app/(app)/perfil/page.tsx
usa: aria-label en src/app/presentacion-led/page.tsx
usa: canonical en src/app/bodas/page.tsx
usa: canonical en src/app/quinceaneras/page.tsx
usa: canonical en src/app/cumpleanos/page.tsx
usa: '/bodas' en src/app/public/[eventType]/page.tsx
usa: images en src/app/enlaces/page.tsx
no-usa: | AK Producciones' en src/app/cumpleanos/page.tsx
no-usa: | AK Producciones' en src/app/quinceaneras/page.tsx
no-usa: | AK Producciones' en src/app/privacidad/page.tsx
usa: descripcion en src/app/simulador-de-presupuesto/page.tsx
usa: tu invitación en src/app/evento/actual/checkin/page.tsx
usa: tu invitación en src/app/evento/actual/mesa/page.tsx
usa: Ir a Fiestas en src/app/(app)/fiestas/nueva/page.tsx
prueba: src/__tests__/auditoria-4-del-25-11.test.ts
prueba: tests/e2e/la-cuarta-auditoria-del-25-11.spec.ts
```
