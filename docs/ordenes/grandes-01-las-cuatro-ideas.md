# Orden de trabajo: las cuatro cosas grandes

Fecha: 12 de agosto de 2026.

**Entregá UNA SOLA propuesta de cambio con los cuatro bloques adentro.** Si uno se
traba, entregá los otros igual en la misma propuesta y avisá cuál faltó y por qué.
No abras una propuesta por bloque: cada fusión dispara un despliegue y eso se paga.

Antes de arrancar, leé `docs/QUE-HAY-EN-LA-APP.md`: es el inventario verificado de
lo que ya existe. **No rehagas nada de lo que figura ahí**, y actualizá esas líneas
en esta misma propuesta.

---

## Reglas que valen para los cuatro bloques

Estas no son sugerencias. Una propuesta que rompa cualquiera de estas no se
fusiona.

**1. Todo lo que consuma inteligencia artificial tiene que pasar por el control de
gasto.** Ya existe y está andando:

- Antes de gastar: `hayPresupuestoParaIA()` de `@/lib/ai/consumo-servidor`. Si
  devuelve `false`, **no se llama al servicio**: se cae al camino simple sin
  inteligencia artificial, igual que cuando no hay servicio configurado.
- Después de gastar: `registrarConsumoIA('<funcion>')`, para que el gasto se vea.
- Si agregás una función nueva que gasta, sumala a `FuncionConCosto` y a
  `COSTO_ESTIMADO_UYU` en `src/lib/ai/consumo.ts`, con su precio estimado.

**2. Nada que le hable a un cliente arranca prendido.** Todo lo que mande mensajes
o publique algo solo tiene interruptor en Ajustes y **viene apagado**. Los mensajes
no se pueden deshacer.

**3. No se inventan precios ni fechas.** Los precios salen del catálogo y de los
cálculos que ya existen. Las fechas libres salen de la agenda real. Si el dato no
está, se dice "te confirmamos en un rato", nunca se improvisa.

**4. Archivos que NO se tocan.** Ahí viven reglas ya resueltas y probadas:
`src/lib/testimonios/para-mostrar.ts`,
`src/lib/marketing/candidatos-recontacto.ts`,
`src/lib/marketing/recontacto-automatico.ts`,
`src/lib/ai/consumo.ts`,
`src/lib/seo/paginas-publicas.ts`.

**5. Si algo falla, la pantalla no se rompe.** Siempre hay un camino simple: el
mensaje de siempre, el simulador de siempre, la foto sin efecto. El invitado o el
cliente nunca ve un error.

---

## Bloque 1 — Que el mensaje de recontacto sea distinto para cada persona

**Qué hay hoy:** el recontacto del que pidió presupuesto y no señó ya funciona y
corre solo cada seis horas (apagado de fábrica). Manda un mensaje **igual para
todos**, armado en `buildRemarketingMessage` de
`src/lib/marketing/whatsapp-remarketing.ts`.

**Qué está mal:** no es lo mismo escribirle a una madre que consultó por unos
quince en marzo que a una pareja que consultó por un casamiento para dentro de un
año. Un mensaje calcado se nota y no vende.

**Qué hay que hacer:** que el mensaje lo escriba la inteligencia artificial usando
lo que esa persona presupuestó: nombre, tipo de evento, fecha estimada, cantidad de
invitados y cuánto tiempo pasó desde que consultó.

**Cómo, sin romper nada:**

- **No toques quién recibe el mensaje.** Eso ya está resuelto y probado en
  `candidatos-recontacto.ts`. Vos cambiás sólo **qué dice**.
- Si la inteligencia artificial falla, o si el gasto llegó al tope, **se manda el
  mensaje de siempre**. Nunca se deja a la persona sin mensaje ni se manda uno a
  medio escribir.
- El mensaje **no promete precios ni descuentos** que no estén en el presupuesto de
  esa persona. Nada de "te hacemos un 20%" inventado.
- Tono rioplatense, corto, sin sonar a robot ni a publicidad. Que se lea como si lo
  escribiera alguien del equipo.
- Registrá el gasto con `registrarConsumoIA`.

---

## Bloque 2 — Un vendedor en la página que conteste a cualquier hora

**Qué hay hoy:** el simulador de presupuesto público capta el dato y lo mete solo
en el CRM. Después queda ahí hasta que alguien lo mira. La gente busca salón el
sábado a la noche y le contestamos el lunes.

**Qué hay que hacer:** un asistente en la página pública que conteste en el momento
y, si la conversación va bien, arme el presupuesto y cargue el prospecto igual que
lo hace el simulador.

**Cómo:**

- Contesta con **datos reales**: los servicios y precios del catálogo, qué entra en
  cada opción, y si la fecha que pide está libre en la agenda. Nada inventado.
- Cuando junte lo mínimo (nombre, teléfono, tipo de evento, fecha estimada,
  cantidad de invitados), usa **lo que ya existe** para crear el prospecto y el
  presupuesto: `captureSimulatorLeadProgress` y
  `generateBudgetAndLeadFromSimulator` de `src/app/actions/armado-rapido.ts`. **No
  escribas un camino nuevo para crear presupuestos.**
- **Pedí el permiso de marketing** de forma clara antes de guardarlo
  (`marketingConsent`), porque de eso depende que después se le pueda escribir.
- **Tope de uso por visitante**, con `enforcePublicRateLimit`, para que nadie use
  la página como juguete y nos gaste la cuenta.
- Si el servicio no está disponible o se llegó al tope de gasto, el asistente
  **no desaparece**: muestra el simulador de siempre y el botón de WhatsApp, con un
  texto que diga que en un rato le contestamos.
- Registrá el gasto con `registrarConsumoIA`.
- Es una pantalla que ve el cliente: pasala por la mirada de venta antes de darla
  por terminada.

---

## Bloque 3 — El video del recuerdo, a la mañana siguiente

**Qué hay hoy:** durante la fiesta se juntan las fotos del muro social, las de la
fotocabina y los videos. Al día siguiente el invitado se acuerda de la noche y no
tiene nada en la mano.

**Qué hay que hacer:** que la aplicación arme sola un video corto (uno o dos
minutos) con lo mejor de la noche, y quede disponible para el cliente y para los
invitados a la mañana siguiente.

**Cómo:**

- **Sólo entra contenido aprobado.** Las fotos que el análisis automático bloqueó,
  y los videos que están esperando aprobación, **no van**. Esto no se negocia: un
  video de la empresa con algo indebido adentro es un problema serio. Usá el estado
  que ya tienen los elementos del muro; si está pendiente de revisión, queda afuera.
- Armalo **sin gastar en inteligencia artificial**: una secuencia de fotos con
  música y transiciones alcanza y se ve muy bien. Si más adelante se quiere usar
  inteligencia artificial para elegir las mejores fotos, se agrega después y con el
  control de gasto puesto.
- Que se pueda **compartir con un enlace**, igual que las fotos del muro.
- Que el cliente lo vea desde su portal, y el invitado desde donde ya ve las fotos.
- Si una fiesta tiene pocas fotos, no armes un video pobre: no lo armes y listo.

---

## Bloque 4 — El repaso de la mañana

**Qué hay que hacer:** una pantalla corta que al abrir la aplicación diga lo que
importa **hoy**, sin tener que revisar cinco módulos:

- Qué cobro vence o está vencido, y de quién.
- Qué fiesta próxima tiene el equipo incompleto.
- Qué prospecto se está enfriando (consultó hace días y nadie lo llamó).
- Qué falta comprar para las fiestas de esta semana.
- Qué evento ya pasó y sigue abierto.

**Cómo:**

- **Es sólo de lectura.** No cambia nada, no manda nada.
- Para la plata usá `calcularEstadoDeCuenta` de `src/lib/budget/saldo-con-ajuste.ts`,
  que es el que aplica el ajuste anual. **No hagas cuentas nuevas por tu lado**: ya
  pasó que dos pantallas mostraban totales distintos al mismo cliente.
- **Respetá los permisos**: quien no puede ver plata, no ve los cobros en el
  repaso. Fijate cómo lo hace la pantalla de Auditoría, que ya resuelve esto.
- Mucho de esto ya existe en `src/lib/commercial-flow/puesta-al-dia.ts`
  ("Poner al día los eventos"). **Reusalo**, no lo escribas de nuevo.
- Que sean **tres o cuatro frases en criollo**, no otra tabla larga para revisar.
  Si no hay nada urgente, que lo diga: "Hoy está todo al día".

---

## Cómo se comprueba

1. `npm run check:acentos` limpio.
2. `npx tsc --noEmit` en cero.
3. `npx jest --silent` todo en verde.
4. `npm run build` termina bien.
5. Pruebas nuevas para lo que no se puede probar a ojo:
   - Que el mensaje de recontacto **cae al de siempre** si la inteligencia
     artificial falla o si se llegó al tope de gasto.
   - Que el video del recuerdo **nunca** incluye contenido pendiente de aprobación.
   - Que el repaso de la mañana **no muestra plata** a quien no tiene el permiso.
6. Probado a mano en el navegador, en tamaño de celular, lo que ve el cliente.

Anotá todo en `docs/YA-RESUELTO.md` y en `docs/QUE-HAY-EN-LA-APP.md`, en esta misma
propuesta.
