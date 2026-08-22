# Orden 1: que la app corra sola, cuatro arreglos y el remate del movimiento

**Para:** Gemini (Antigravity)
**Escrita:** 22 de agosto de 2026.
**Prioridad:** esta va PRIMERO. La orden de "sin internet" (`docs/ordenes/despues-sin-internet.md`) va después, en otra propuesta.

## Cómo se entrega

**UNA SOLA propuesta de cambios con los cuatro bloques adentro.** Cada fusión
dispara un despliegue y eso se paga. Si un bloque se traba, **entregá el resto
igual, en la misma propuesta**, avisando cuál faltó y por qué.

**Arrancá desde la versión principal de ahora.** Antes de tocar nada, leé
`docs/MANUAL-DE-LA-APP.md` y `docs/YA-RESUELTO.md`.

**Antes de fusionar:** tipos en cero, pruebas en verde, `npm run check:acentos`
limpio y `npm run build` que termine bien.

**Regla que ya se rompió una vez:** **no toques textos que ve el cliente si no
están pedidos.** Se cambiaron por cuenta propia la promesa de respuesta y el botón
de precio, y hubo que volverlos atrás.

---

## BLOQUE 1 — QUE CORRA SOLO DE VERDAD (lo más importante, ya se pidió y no vino)

**El problema, en criollo:** la app se pone al día **solo cuando alguien del
equipo entra al panel**. El disparador vive en `src/components/app-shell.tsx`, que
es la cáscara del área con sesión. El visitante de la web pública no dispara nada.
Si nadie del equipo abre la app el fin de semana, en todo el fin de semana no
corre nada: ni las notas del blog, ni la bajada de las fotos de Instagram, ni los
recordatorios de cuota. Ya pasó: hubo meses sin números de redes guardados.

El propio código lo dice en `src/lib/automatico/al-entrar-a-la-app.ts`: *"No
reemplaza al despertador de afuera. Si nadie abre la app en tres días, estas
tareas no corren en tres días."* Y la solución escrita
(`docs/PRENDER-LAS-TAREAS.md`) es un instructivo para que el dueño configure
cuatro renglones a mano en una página de internet. **Nunca lo hizo y no tiene por
qué.** Eso no es resolver.

### Qué hay que hacer

1. **Un despertador de verdad, dentro del proyecto.** La carpeta `functions/` ya
   existe y no tiene ninguna tarea programada. Agregá **una sola**, cada 15
   minutos, que pregunte qué está vencido y corra lo que corresponda.
   **Una sola, no cuatro**: una entra en lo que ya viene incluido sin pagar.
2. **Que la web pública también lo dispare, como red de seguridad.** Una visita a
   la portada larga la puesta al día **sin hacer esperar a nadie**: se larga y la
   página sigue, nunca se espera el resultado.
3. **La trampa que ya nos mordió:** diez visitas en el mismo minuto no pueden
   generar diez notas de blog ni pagar diez veces la inteligencia artificial.
   **La marca de "ya estoy corriendo" se toma ANTES de trabajar, no después.**
   El que llega y ve que otro está corriendo, se va. **Con una prueba que lo
   demuestre.**
4. **Que se vea.** En `/settings/tareas-automaticas`: cuándo corrió cada tarea y
   quién la disparó. Si una no corre hace más del doble de lo que debería, en rojo.
5. **Corregí `docs/PRENDER-LAS-TAREAS.md`**: hoy miente.

**Lo que cuesta:** una sola tarea cada 15 minutos entra en lo incluido, **no
agrega gasto mensual**. `apphosting.yaml` no se toca.

---

## BLOQUE 2 — Cuatro arreglos chicos (salieron de revisar la app entera)

Se auditaron las siete áreas. **Nada roto de fondo.** Salieron estas cuatro, todas
verificadas a mano. Ninguna toca plata, cuentas ni permisos.

**1. La lista de compras queda en blanco y no dice por qué.**
`src/app/(app)/fiestas/nueva/catering/lista-compras/page.tsx:475`
Dibuja una tarjeta por proveedor y nada más. Si el evento no tiene todavía platos
con ingredientes, ni bebidas, ni repostería, la pantalla queda vacía: el equipo no
sabe si falta cargar algo o si se rompió. **Un cartel que diga qué falta y a qué
pantalla ir a cargarlo.**

**2. El presupuesto que ve el cliente muestra centavos y el resto de la app no.**
`src/components/budget/BudgetDocument.tsx:31` y
`src/components/presupuestos/BudgetPrintTemplate.tsx:34` muestran "$ 10.000,00".
El resto de la app muestra "$ 10.000". **Es el papel que se le manda al cliente y
se imprime.** Unificar en cero decimales. Revisá también
`src/components/presupuestos/paso-4-resumen.tsx`.

**3. El botón de borrar una factura cobrada se ve activo pero no funciona.**
`src/components/invoice-list-item.tsx:97`. El servidor la protege bien (no se
toca), pero el botón se ve prendido y al tocarlo da error. **Que se vea apagado
cuando la factura tiene pagos**, con una ayuda que diga por qué.

**4. En el tablero de decoración del cliente, el corazón se borra solo sin avisar.**
`src/app/portal/[fiestaId]/moodboard/page.tsx:57-62`. Si falla el guardado, la
pantalla revierte el corazón y no dice nada; la persona cree que apretó mal. Al
subir una foto sí avisa (línea 88): **hacer lo mismo acá.**

---

## BLOQUE 3 — Rematar el movimiento

El movimiento que entregaste quedó bien: nada queda invisible, respeta a quien
pidió menos animación y no desborda. Falta el remate, en orden de lo que más rinde:

1. **Los números que suben.** Donde hay una cifra que impresiona (años de
   experiencia, fiestas hechas), que **trepe desde cero** al llegar ahí, una sola
   vez. Con `useReducedMotion`: quien pidió menos movimiento ve el número final.
2. **La galería.** Al tocar "ver más", la tanda nueva aparece de golpe. Que entren
   **escalonadas**, como la primera tanda. Con el historial completo de Instagram,
   eso es lo que transmite "mirá todo lo que hicimos".
3. **Mientras carga, que no haya huecos vacíos**: el molde gris de lo que va a
   venir, en vez de un espacio en blanco.
4. **SACAR, no agregar:** en `src/components/landing/HeroSection.tsx` quedaron
   **tres animaciones que no paran nunca** (la foto de fondo y dos resplandores con
   desenfoque grande). **Dejá una sola.** Las otras no se notan y le chupan batería
   al celular del que te está mirando.

---

## BLOQUE 4 — Dos pruebas de navegador que se quejan del Centro de Control

De 596 pruebas de navegador pasan 594. Las 2 son la misma
(`tests/e2e/layout-baseline.spec.ts`) en escritorio y en celular:

- **Escritorio:** `/admin · no tiene título ni contenido: la ruta no existe o no
  carga`. Pero en celular carga bien, y el `<h1>` de
  `src/app/(app)/admin/page.tsx:222` **no depende de que carguen los datos**.
  Lo que dice la prueba no coincide con el código.
- **Celular:** `/presupuestos/nuevo · falta referencia para chromium-mobile`. Se
  cambió la ruta medida (antes era `/presupuestos`, que es una redirección) y la
  referencia de ese perfil quedó sin grabar. Se graba corriendo ese archivo con
  `UPDATE_MISSING_LAYOUT_BASELINE=true`, **con nada más corriendo en paralelo**.

**Ya fallaban antes, no son una regresión.** Si la prueba mide mal, arreglá la
prueba; si hay algo roto, arreglalo y decilo. **No la desactives ni la saltees.**

---

## Lo que no se toca

- `apphosting.yaml`: el servidor se duerme a propósito.
- Nada que aumente lo que se paga por mes.
- **Textos que ve el cliente, si no están pedidos.**
- El WhatsApp prepara mensajes y no los manda.
- Si tocás o agregás una pantalla, **corré `npm run mapa:generar`** y anotá el
  cambio en `docs/YA-RESUELTO.md`, en la misma propuesta.
