# Que la app corra sola, y que el movimiento remate mejor

**Para:** Gemini (Antigravity)
**Escrita:** 22 de agosto de 2026.

## Cómo se entrega

**UNA SOLA propuesta de cambios con los tres bloques adentro.** Cada fusión
dispara un despliegue y eso se paga. Si un bloque se traba, entregá el resto
igual, en la misma propuesta, avisando cuál faltó y por qué.

**Arrancá desde la versión principal de ahora.**

Antes de tocar nada, leé `docs/MANUAL-DE-LA-APP.md` y `docs/YA-RESUELTO.md`.

**Antes de fusionar:** tipos en cero, pruebas en verde, `npm run check:acentos`
limpio y `npm run build` que termine bien.

---

## Lo que ya entregaste y quedó bien — no lo rehagas

La galería lee el historial guardado, aparece de a tandas, el panel de historial
de redes con su botón de actualizar, y el movimiento de las pantallas públicas.
**El movimiento quedó bien hecho**: nada queda invisible, respeta a quien pidió
menos animación, y no desborda en el celular.

**Dos cosas se volvieron atrás y no se vuelven a cambiar:** los textos
"Respuesta en 24 hs" y "Consultar precio". Son decisiones comerciales del dueño.
**No toques textos que ve el cliente si no está pedido.**

---

## BLOQUE 1 — QUE CORRA SOLO DE VERDAD (esto es lo que falta y es lo primero)

**Esto ya estaba pedido y no vino. Es lo mas importante de todo.**

**El problema, en criollo:** la app se pone al día **solo cuando alguien del
equipo entra al panel**. El disparador vive en `src/components/app-shell.tsx`, que
es la cáscara del área con sesión. El visitante que entra a la web pública no
dispara nada. Si nadie del equipo abre la app el fin de semana, no corre nada:
ni las notas del blog, ni la bajada de las fotos de Instagram, ni los
recordatorios de cuota. Ya pasó: hubo meses sin números de redes guardados.

El propio código lo dice en `src/lib/automatico/al-entrar-a-la-app.ts`: *"No
reemplaza al despertador de afuera. Si nadie abre la app en tres días, estas
tareas no corren en tres días."*

Y la solución que hay escrita es `docs/PRENDER-LAS-TAREAS.md`: un instructivo para
que el dueño se cree una cuenta en una página de internet y configure cuatro
renglones a mano. **Nunca lo hizo y no tiene por qué.** Eso no es resolver.

### Qué hay que hacer

**1. Un despertador de verdad, dentro del proyecto.** La carpeta `functions/` ya
existe y hoy no tiene ninguna tarea programada. Agregá **una sola** tarea
programada, cada 15 minutos, que pregunte qué está vencido y corra lo que
corresponda.

- **Una sola, no cuatro.** Una sola tarea agendada entra en lo que ya viene
  incluido sin pagar. Cuatro serían cuatro trabajos agendados.
- Que no dependa de que nadie abra nada.
- Corregí `docs/PRENDER-LAS-TAREAS.md`: hoy miente, porque dice que hay que
  configurar algo a mano.

**2. Que la web pública también lo dispare, como red de seguridad.** El sitio
recibe visitas. Que una visita a la portada dispare la misma puesta al día **sin
hacer esperar a nadie**: se larga y la página sigue, nunca se espera el resultado.

**3. La trampa que ya nos mordió:** cuando algo pasa de correr en un solo lugar a
correr con cada visita, la pregunta no es "¿funciona?" sino **"¿qué pasa si dos lo
hacen al mismo tiempo?"**. Diez visitas en el mismo minuto no pueden generar diez
notas de blog ni pagar diez veces la inteligencia artificial.

- **La marca de "ya estoy corriendo" se toma ANTES de trabajar, no después.**
- El que llega y ve que otro está corriendo, se va sin hacer nada.
- **Una prueba que lo demuestre**: varias llamadas al mismo tiempo dejan una sola
  corrida.

**4. Que se vea.** En `/settings/tareas-automaticas`, cuándo corrió cada tarea por
última vez y quién la disparó. Si una no corre hace más del doble de lo que
debería, que se vea en rojo.

**Sobre lo que cuesta:** una sola tarea programada cada 15 minutos entra en lo
incluido: **no agrega gasto mensual**. `apphosting.yaml` no se toca, ni la memoria
ni las instancias mínimas.

---

## BLOQUE 2 — Rematar el movimiento (tres cosas que venden)

El movimiento quedó bien. Esto es lo que le falta para rematar, en orden de lo
que más rinde:

**1. Los números que suben.** Donde la pantalla muestra una cifra que impresiona
—años de experiencia, fiestas hechas, invitados atendidos—, que el número **trepe
desde cero** cuando la persona llega ahí, en vez de aparecer quieto. Es lo que
hace que el dato se quede grabado. Que suba una sola vez, no cada vez que se
pasa. Y con `useReducedMotion` puesto: quien pidió menos movimiento ve el número
final directo.

**2. La galería, que ahora tiene años de fotos.** Al tocar "ver más", la tanda
nueva aparece de golpe. Que entren **escalonadas**, de a una con unas milésimas de
diferencia, como ya se hace en la primera tanda. Con el historial completo eso es
lo que transmite "mirá todo lo que hicimos" en vez de un salto brusco.

**3. Mientras la pantalla trae datos, que no haya huecos vacíos.** Poner el molde
gris de lo que va a venir (lo que hacen las apps buenas) en vez de un espacio en
blanco. La página se siente rápida aunque tarde lo mismo.

**Y una que hay que SACAR, no agregar:** en `src/components/landing/HeroSection.tsx`
quedaron **tres animaciones que no paran nunca** (una en la foto de fondo y dos
resplandores con desenfoque grande). Con una alcanza. Las otras no se notan y le
chupan batería al celular del que te está mirando. **Dejá una sola.**

---

## BLOQUE 3 — Una prueba de navegador que se queja del Centro de Control

De 596 pruebas de navegador pasan 594. Las 2 que fallan son la misma
(`tests/e2e/layout-baseline.spec.ts`) en escritorio y en celular:

- **Escritorio:** `/admin · no tiene titulo ni contenido: la ruta no existe o no
  carga`. Pero en celular esa pantalla carga bien, y el `<h1>` de
  `src/app/(app)/admin/page.tsx:222` **no depende de que carguen los datos**: se
  dibuja siempre. Lo que dice la prueba no coincide con el código.
- **Celular:** `/presupuestos/nuevo · falta referencia para chromium-mobile`. Se
  cambió la ruta medida (antes era `/presupuestos`, que es una redirección) y la
  referencia de ese perfil quedó sin grabar. Se graba corriendo ese archivo con
  `UPDATE_MISSING_LAYOUT_BASELINE=true`, **con nada más corriendo en paralelo**.

**Ya fallaban antes, no son una regresión.** Si la prueba mide mal, arreglá la
prueba; si hay algo roto de verdad, arreglalo y decilo. **No la desactives.**

---

## Lo que no se toca

- `apphosting.yaml`: el servidor se duerme a propósito.
- Nada que aumente lo que se paga por mes.
- **Textos que ve el cliente, si no están pedidos.**
- El WhatsApp prepara mensajes y no los manda.
- Si tocás o agregás una pantalla, **corré `npm run mapa:generar`** y anotá el
  cambio en `docs/YA-RESUELTO.md`, en la misma propuesta.
