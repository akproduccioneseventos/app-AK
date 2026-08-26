# Orden 8 — Terminar las tres puertas, y ensanchar el control

**Para:** Gemini
**Fecha:** 25 de agosto de 2026
**Entrega:** **UNA SOLA propuesta con los tres bloques.** Si uno se traba, entregá los
otros dos igual y decí cuál faltó.

**Esto es la segunda mitad de la orden 7**, que quedó muy bien pero incompleta. Lo que sí
salió y no hay que volver a tocar: «Mi día», el módulo de Marketing, el arreglo del cobro
duplicado, la salida de los tableros de programador y las dos pantallas que abrían el
diseñador de mesas por error.

---

## Bloque 1 — El menú, en tres puertas

**Qué falta:** se agregó «Mi día» y el módulo de Marketing, pero **el menú sigue teniendo
las cinco secciones de antes**. El dueño lo pidió así: *"quiero la misma app con su
potencial pero más organizada y más fácil de usar, no esta app compleja"*.

**Cómo queda arriba, y nada más:**

- **Mi día** — la pantalla que ya existe. Es lo primero al entrar.
- **Fiestas** — activas, calendario, historial. Adentro de cada fiesta, los cuatro
  momentos del bloque 2 de la orden 7.
- **La empresa** — con cuatro grupos adentro:
  - **Vender:** prospectos, simulador, presupuestos, clientes.
  - **Plata:** pagos rápidos, panel contable, facturas, métricas del negocio.
  - **Recursos:** comida y menús, insumos, salones, catálogo de servicios, proveedores,
    empleados.
  - **Marketing:** el módulo que ya hiciste.

**Ajustes sale del camino:** conexiones, tareas automáticas, WhatsApp (la configuración,
no el uso diario), contratos y cláusulas, seguridad, promociones, asistente y plantillas.
No compite por lugar con el trabajo de todos los días.

**Laboratorio:** lo experimental deja de estar mezclado. Un solo lugar, y **sólo lo ve el
administrador**.

**La regla que manda acá: no se pierde ninguna entrada.** Todo lo que hoy está en el menú
tiene que seguir siendo alcanzable desde alguna de las tres puertas. Si algo no entra en
ningún grupo, ponelo en «ver todo» antes que sacarlo.

---

## Bloque 2 — El control anti-mentira, para todas las pantallas

`src/__tests__/ninguna-pantalla-miente.test.ts` quedó **angosto**: hoy mira sólo tres
carpetas (conexiones sociales, redes y anuncios) y busca un caso puntual. Así no va a
agarrar la próxima mentira, que va a estar en otro lado.

La parte que sí quedó firme y **no se toca**: las palabras prohibidas en «Mi día».

**Qué hay que hacer:** que el control recorra **todas** las pantallas y falle cuando una
afirma un estado que no comprobó. Palabras a vigilar en el texto que ve el usuario:
"conectado", "sincronizado", "publicado", "enviado", "guardado", "activo", "automático".

La regla: si una pantalla muestra una de esas palabras, tiene que salir de un dato que
vino del servidor diciendo que pasó. No de una constante escrita a mano, ni de que la
llamada no tiró error.

**Cómo hacerlo sin que se llene de falsas alarmas** —esto es lo importante, porque un
control que grita siempre lo termina apagando alguien—:

1. Arrancá con una **lista declarada** de los casos legítimos que ya existen, cada uno
   **con el motivo escrito al lado**, como en `auditoria-puertas-abiertas.test.ts`. Sin
   motivo, no entra en la lista.
2. La lista **sólo puede achicarse**. Que haya una prueba que lo impida, como se hizo con
   las puertas públicas.
3. El mensaje de error dice, en criollo, **qué pantalla, qué palabra y por qué importa**.

---

## Bloque 3 — Revisar una frase que promete de más

En `src/app/(app)/settings/social-connections/page.tsx` hay una frase que dice, más o
menos: *"si le cargás el token a cada red, la app publica sola de forma 100% automática
sin que abras ninguna aplicación"*.

**Hay que revisarla contra lo que de verdad pasa**, y corregirla si promete de más:

- Que diga **qué redes publican solas de verdad** y cuáles quedan en "listo para copiar".
- Que el texto dependa del **estado real de cada conexión**, no que sea un cartel fijo.
- **WhatsApp queda afuera de cualquier promesa de "publica solo".** Es el número personal
  del dueño: la app **prepara** los mensajes y **los manda una persona**. Eso no cambia y
  hay una prueba que lo cuida.

Es exactamente el tipo de frase que el control del bloque 2 tiene que agarrar. Que la
agarre.

---

## Antes de entregar

- `npm run check:acentos` — sin acentos rotos. **Con acentos rotos no se fusiona.**
- `npx tsc --noEmit` — cero errores.
- `npx jest --silent` — todas en verde.
- `npm run build` — tiene que terminar bien. **No alcanza con el revisor de tipos.**
- `npm run mapa:generar` — el manual se regenera solo, no lo edites a mano.
- **No toques `apphosting.yaml`.** Tres entregas seguidas la trajeron modificada con la
  configuración de cobros vieja: si tu copia la trae, sacá ese cambio antes de entregar.
- Anotá lo que hiciste en `docs/YA-RESUELTO.md` y en `docs/MANUAL-DE-LA-APP.md`, **en la
  misma propuesta**.

## Y la regla que sigue valiendo

**No se agrega una pantalla nueva sin sacar otra**, salvo que la pida el dueño. Esta
orden es de reordenar: si te parece que hace falta una pantalla nueva para agrupar algo,
fijate primero si no se resuelve en una que ya está.
