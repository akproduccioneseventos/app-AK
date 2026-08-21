# Que las pruebas de navegador se puedan correr de una

**Para:** Gemini (Antigravity)
**Escribe:** Claude
**Fecha:** 21 de agosto de 2026
**Base:** `main` actualizado. Sincronizar antes de empezar.

> **Los dos bloques van en UNA sola propuesta.** Si el segundo se traba, entregá el
> primero igual y decí por qué.

## Por qué existe esta orden

El dueño preguntó por qué, con tanta auditoría, siempre aparece algo nuevo. **La
respuesta fue concreta: hay 596 pruebas que abren la aplicación en un navegador de
verdad y nunca se corrieron.** Son las únicas que ven lo que ve el usuario, y todo
lo que se nos escapó a las tres inteligencias es de esa clase.

**No se corrían porque no terminaban.** Ya está la mitad resuelta: `npm run
test:e2e` usa la versión compilada. Falta lo otro.

---

# BLOQUE 1 — Que la tanda entera termine sola

Hoy, para que terminen, hay que correrlas **a mano en tandas de tres archivos**,
liberando el puerto entre tanda y tanda. Eso lo sabe quien estuvo hoy y **nadie
más**. Un procedimiento que depende de acordarse no se ejecuta.

**Qué hacer:** que `npm run test:e2e` haga eso solo.

- Que agrupe los archivos de a **tres o cuatro** y corra una tanda por vez.
- Que **levante y baje su propio servidor en cada tanda**, y **libere el puerto
  antes de empezar** la siguiente. Si el puerto sigue ocupado, que espere o mate lo
  que quedó, en vez de correr contra un servidor viejo.
- Que junte todo al final en **un solo resumen**: total pasadas, total fallas, y
  la lista de fallas con archivo y nombre.

## El detalle que hace toda la diferencia

**El servidor se degrada después de varios archivos pesados seguidos.** Cuando pasa,
las pruebas que siguen fallan al instante con mensajes tipo "no respondió" o
"sesión no autorizada".

> **Falla real: tarda 45 a 60 segundos.
> Falsa alarma: falla en menos de medio segundo.**

Con ese criterio, en la corrida de hoy se descartaron **diez falsas alarmas**: sin
él el informe habría dicho quince fallas en vez de tres.

**Que el resumen las separe:** "fallas" y "descartadas por entorno", y que
**reintente sola una vez, con servidor fresco**, cualquier prueba que falle en
menos de medio segundo. Sólo si vuelve a fallar, cuenta.

# BLOQUE 2 — Que no se pueda cerrar de más una puerta

Hoy, al fusionar, se detectó a tiempo algo que **habría roto la fiesta**: una
entrega le puso control de sesión a siete funciones que son **públicas a
propósito**. Si entraba, se quedaban sin funcionar el logo de la pantalla de
ingreso, el simulador, el portal del cliente y —lo peor— **el tótem de la barra y
la plataforma 360, que se abren sin cuenta en pleno evento**.

Ya se habían reabierto una vez ese mismo día, por el mismo motivo. **Dos veces el
mismo error significa que hace falta un control, no más cuidado.**

**Qué hacer:** agregar una pasada a `npm run auditoria` que avise cuando una
función **usada por una pantalla pública** tiene control de sesión.

- La lista de pantallas públicas ya existe: `PAGINAS_PARA_GOOGLE` en
  `src/lib/seo/paginas-publicas.ts`, más las pantallas de `/evento/` que abren los
  invitados y el equipo en el salón.
- Las siete declaradas como públicas a propósito están en
  `src/__tests__/auditoria-puertas-abiertas.test.ts`, cada una con su motivo. **No
  las toques: son la respuesta correcta, no una deuda.**
- El aviso tiene que decir **qué pantalla se rompería**, no sólo el nombre de la
  función. "`getFiestaActivaDeHoy` tiene sesión y la usa el tótem de la barra, que
  se abre sin cuenta" se entiende; "función protegida" no.

---

## Lo que NO se toca

- **Plata, cobros, comida y permisos: eso lo escribe Claude.**
- **No cierres ninguna de las siete públicas.** Antes de cerrar una puerta, mirá
  quién la llama.
- **No borres ni aflojes una prueba que se pone en rojo.** Si una falla, se mira
  qué señala.

## Los controles antes de entregar

1. `npx tsc --noEmit`
2. `npx jest --silent`
3. `npm run check:acentos`
4. `npm run build`
5. **`npm run test:e2e`** — el que estás arreglando. Pegá el resumen en la entrega.

## Cuando termines

Anotá en `docs/YA-RESUELTO.md`, actualizá `docs/QUE-HAY-EN-LA-APP.md`, avisá el
número de la propuesta y mové este archivo a `hechas/` en la misma propuesta.
