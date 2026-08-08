# Orden de trabajo — Planificación 02

**Para:** Gemini (Antigravity)
**Escribe:** Claude (auditoría y verificación)
**Fecha:** 8 de agosto de 2026
**Base:** `main` actualizado. Sincronizar antes de empezar.

## Por qué existe esta orden

El planificador tiene **79 pantallas**, no 18. El inventario anterior sólo listó
las que aparecen en el menú del tablero central, y todo lo que cuelga por detrás
quedó sin mirar. Ya se auditaron y arreglaron 22 (ver `docs/YA-RESUELTO.md`).
Quedan unas 57.

Esta orden cubre **lo que te toca a vos**. Las pantallas de plata, las que no las
enlaza nadie y los centros de mando duplicados los está mirando Claude aparte:
**no las toques**, están listadas al final.

---

## Cómo se trabaja esta orden

**Cuatro propuestas completas, una por bloque.** Cada bloque entero en una
propuesta. No mezcles dos bloques.

Estas pantallas **nunca fueron auditadas**, así que cada bloque es *revisar y
después arreglar*. Si al revisar una pantalla no encontrás nada, decilo: esa
también es una respuesta válida, y la propuesta queda en las pruebas que lo
demuestren.

### Antes de subir, siempre

```
npx tsc --noEmit
npx jest --silent
npm run check:acentos
npm run build
```

**Si alguno falla, no subas.** Guardá en UTF-8 y cuidado con las comillas
invertidas: ya rompieron el proyecto tres veces.

### Leé esto antes de reportar nada

- **`docs/YA-RESUELTO.md`** — lo que ya está arreglado y las decisiones tomadas
  del dueño. Si un hallazgo tuyo figura ahí, es falso positivo.
- **`AGENTS.md`, sección "Errores ya cometidos"** — diez cosas que ya salieron
  mal en este proyecto.

### La mirada: tres preguntas, no una

Por cada pantalla que toques:

1. **¿Qué está roto?**
2. **¿Cómo se usa mejor?** Pasos de más, datos cargados dos veces, cosas que el
   sistema ya sabe y podría completar solo.
3. **¿Cómo se ve mejor?** Es un producto que compite con plataformas pagas.

Y dos patrones que ya aparecieron repetidos en todo el proyecto, buscalos en cada
pantalla:

- **`catch` que no le muestran nada al usuario.** Si falla y nadie se entera,
  está mal.
- **Contar filas en vez de personas.** Un invitado puede traer acompañantes
  (`partySize`). Si ves `.length` sobre una lista de invitados, miralo dos veces.

---

# BLOQUE A — Lo que ve el invitado

**Propuesta completa.**

- `src/app/(app)/fiestas/nueva/buzon/page.tsx`
- `src/app/(app)/fiestas/nueva/regalos/page.tsx`
- `src/app/(app)/fiestas/nueva/pagina-web/page.tsx`
- `src/app/(app)/fiestas/nueva/video-vida/page.tsx`
- `src/app/(app)/fiestas/nueva/zona-digital/page.tsx`
- `src/app/(app)/fiestas/nueva/barra-tecnologica/page.tsx`
- `src/app/(app)/fiestas/nueva/social-fiesta-pro/page.tsx`

Son las pantallas donde el equipo configura lo que después ve el invitado. Un
error acá se multiplica por la cantidad de invitados de la fiesta.

**Qué mirar, además de lo de siempre:**

- **¿Se puede ver cómo queda antes de guardar?** Configurar a ciegas obliga a
  guardar, salir, mirar y volver. Ya se resolvió así en el portal del invitado:
  copiá ese patrón donde tenga sentido.
- **¿Qué pasa si el cliente no contrató eso?** Ninguna pantalla puede romperse ni
  quedar vacía sin explicar. Cada cosa se vende por separado.
- **Los regalos y el buzón tocan datos personales de los invitados.** Fijate que
  no se filtre nada a quien no corresponde.

---

# BLOQUE B — Lo que se imprime y se entrega

**Propuesta completa.**

- `src/app/(app)/fiestas/nueva/carteleria/page.tsx`
- `src/app/(app)/fiestas/nueva/carta-tragos/page.tsx`
- `src/app/(app)/fiestas/nueva/numeros-mesa/page.tsx`
- `src/app/(app)/fiestas/nueva/invitados/numeros-mesa/page.tsx`
- `src/app/(app)/fiestas/nueva/resumen-imprimible/page.tsx`
- `src/app/(app)/fiestas/nueva/carga-operativa/pdf/page.tsx`
- `src/app/(app)/fiestas/nueva/reuniones/imprimir/page.tsx`

Esto se imprime y se pone arriba de las mesas, o se le entrega al cliente. Que
salga mal se ve, y queda mal.

**Qué mirar:**

- **Que no se corte.** Listas largas, nombres largos, textos que se desbordan de
  la hoja. Probá con una fiesta de 150 invitados, no con tres.
- **Que no salga en blanco sin avisar.** Si no hay datos cargados, tiene que
  decir qué falta, no imprimir una hoja vacía.
- **Ojo con `numeros-mesa`: hay DOS pantallas** con ese nombre, una suelta y otra
  dentro de invitados. Averiguá si hacen lo mismo. Si son duplicados, **avisá y
  no borres nada**: esa decisión no es tuya.
- **Los datos internos no van en lo que se imprime para afuera.** Ya pasó con el
  PDF del itinerario, que mostraba las notas privadas del organizador.

---

# BLOQUE C — Las herramientas internas del equipo

**Propuesta completa.**

- `src/app/(app)/fiestas/nueva/fotografia/page.tsx`
- `src/app/(app)/fiestas/nueva/reuniones/page.tsx`
- `src/app/(app)/fiestas/nueva/post-evento/page.tsx`
- `src/app/(app)/fiestas/nueva/readiness/page.tsx`
- `src/app/(app)/fiestas/nueva/fiesta-lista/page.tsx`
- `src/app/(app)/fiestas/nueva/resumen-planificacion/page.tsx`
- `src/app/(app)/fiestas/nueva/configuracion/page.tsx`

**Qué mirar:**

- **Trabajo que se pierde.** Formularios largos donde un fallo al guardar deja al
  equipo sin lo que cargó. Es el problema más caro y ya apareció tres veces.
- **`readiness` y `fiesta-lista` suenan a lo mismo**, y el tablero central ya
  tiene su propio cálculo de avance. Fijate si dan números distintos para la
  misma fiesta: eso confunde más que ayudar. Si se contradicen, avisá.
- **`configuracion` es la base de todo lo demás.** Si algo se guarda mal ahí,
  arrastra a las otras pantallas.

---

# BLOQUE D — Pantallas y tótems del salón

**Propuesta completa.**

- `src/app/(app)/fiestas/nueva/pantallas-totem/page.tsx`
- `src/app/(app)/fiestas/nueva/muro-social/page.tsx`
- `src/app/(app)/fiestas/nueva/playlist-pantalla/page.tsx`
- `src/app/(app)/fiestas/nueva/entretenimiento/page.tsx`
- `src/app/(app)/fiestas/nueva/accesos-personal/page.tsx`

Es la configuración de lo que corre durante la fiesta. **El módulo de
entretenimiento ya está terminado y probado** (ver `docs/YA-RESUELTO.md`): lo que
falta es la pantalla desde donde el equipo lo configura.

**Qué mirar:**

- **¿Lo que se configura acá tiene efecto real?** Un interruptor que no cambia
  nada en la fiesta es peor que no tenerlo.
- **¿Se puede probar antes de la fiesta?** El operador tiene que poder verificar
  que cada estación contratada funciona antes de que llegue el primer invitado.
  Ya existe una captura de prueba en la configuración de entretenimiento: mirá si
  alcanza.
- **`accesos-personal` reparte permisos a gente de afuera** (proveedores, DJ).
  Revisá que cada uno vea sólo lo suyo, pero **no cambies las reglas de permisos**:
  si encontrás algo raro, avisá y no lo toques.

---

## Lo que NO tenés que tocar

Lo está mirando Claude en paralelo. Si te cruzás con estas pantallas, dejalas:

**Plata y documentos legales:**
`gestion-costos-rentabilidad` y su reporte, `plan-pagos`, `servicios-contratados`,
y toda la carpeta `gestion-documental` (contratos de salón y de servicio, recibos
de pago, cancelaciones, cambio de fecha).

**Los centros de mando**, que parecen duplicados entre sí:
`centro`, `centro-total`, `mission-control`, `en-vivo`, y las de `fiestas/[id]/`
(`centro`, `centro-de-mando`, `comando-total`, `show-control`,
`centro-experiencia`, `ak-100`, `cierre-mundial`, `experiencia-tecnologica-ak`,
`timeline`).

**Las que no las enlaza nadie**, hasta saber si se borran o se conectan:
`asistente`, `cierre-100`, `integracion-post-445`, `planner-costo-fiesta`,
`portal-cliente/cierre-final`, `social-fiesta-pro/cierre-final`.

Y lo de siempre: el ajuste anual del 15%, los descuentos de marketing, los
invitados del presupuesto para la lista de compras, y los controles rojos de
GitHub, que son por facturación.

## Cuando termines cada bloque

Avisá el número de la propuesta. Y **si arreglás algo, sumalo a
`docs/YA-RESUELTO.md` en la misma propuesta**: si no queda anotado, la próxima
auditoría lo vuelve a encontrar y alguien lo arregla de nuevo.
