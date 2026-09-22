# Orden 79 — Ocho enlaces que no llevan a ningún lado, y el barrido con las dos preguntas nuevas

**Los ocho enlaces los encontró Codex el 22 de setiembre de 2026** (barrido de 412 enlaces
sobre 1916 archivos). **Las dos preguntas nuevas salieron de los defectos del calendario** de
esa misma revisión, y son las número **20 y 21** de `docs/COMO-AUDITAR.md`.

**Una sola propuesta con los dos bloques.** Si uno se traba, entregá el otro igual en la misma
propuesta y avisá cuál faltó.

Antes de decir "terminé", pasá lo que tocaste por `docs/ANTES-DE-ENTREGAR.md`.

---

## Bloque 1 — Los ocho enlaces muertos

**La investigación ya está hecha: estos son los destinos reales, no hay que buscarlos.**

### 1.a — El botón de rescate del prospecto (el más caro de los tres)

- **Dónde:** `src/app/portal/page.tsx`, línea ~470, el botón *"Cotizar mi fiesta"*.
- **Qué tiene hoy:** `href="/presupuesto"`. **Esa pantalla no existe.**
- **A dónde va:** `/simulador-de-presupuesto` (`src/app/simulador-de-presupuesto/page.tsx`).
- **Por qué importa más que los otros:** ese botón aparece **cuando algo falló o no hay
  fiesta**. O sea que es el rescate de alguien que ya se topó con un problema, y hoy lo manda
  a una segunda pared. Es un prospecto perdido.

### 1.b — Las conexiones de redes

- **Dónde:** `src/app/(app)/empresa/presencia-digital/page.tsx`, línea ~50.
- **Qué tiene hoy:** `href="/ajustes/redes-sociales"`. **No existe.**
- **A dónde va:** `/settings/social-connections`
  (`src/app/(app)/settings/social-connections/page.tsx`).
- **Ojo con esto:** comprobá que esa pantalla **haga lo que el enlace promete** —conectar las
  cuentas de redes—, y no sólo que abra. Si lo que promete el texto está en otro lado, cambiá
  el texto, no el destino.

### 1.c — Los seis "volver a las fiestas"

- **Qué tienen hoy:** `/fiestas`, que **no existe** (hay `/fiestas/[id]` y `/fiestas/nueva`,
  pero no el listado).
- **El listado real es `/eventos`** (`src/app/(app)/eventos/page.tsx`, es el que llama a
  `getFiestas`).
- **Dónde están los seis:**
  - `src/app/(app)/contabilidad/crm/atraccion-fiestas/page.tsx`, línea ~216.
  - `src/app/(app)/fiestas/nueva/carga-operativa/pdf`, línea ~181.
  - `src/app/(app)/fiestas/nueva/gestion-costos-rentabilidad/reporte`, línea ~95.
  - `src/app/(app)/fiestas/nueva/itinerario/pdf`, línea ~109.
  - `src/app/(app)/fiestas/nueva/musica/pdf`, línea ~112.
  - `src/app/(app)/fiestas/nueva/resumen-imprimible`, línea ~180.
- **Y la regla que decide cuál usar, que es lo importante:** los cinco que salen de un impreso
  **están adentro de una fiesta**. Ahí volver al listado es perderle el trabajo al que
  imprimió: tienen que volver **a esa fiesta**, conservando su identificador. Sólo el de
  `atraccion-fiestas` va al listado `/eventos`.

### Qué NO tocar en este bloque

- **Los cálculos de los impresos.** Sólo se cambia el enlace de retorno.
- **`sitemap.xml`, los dos enlaces de respaldo y el de Google:** Codex ya los verificó y están
  bien. No son hallazgos.
- **La protección de acceso** de ninguna de esas pantallas.

---

## Bloque 2 — Barrido con las preguntas 20 y 21

Las dos están escritas completas en `docs/COMO-AUDITAR.md`. Acá va la búsqueda mecánica.

### 2.a — Pregunta 20: dos cosas distintas dibujadas igual, una sola acción

**Qué buscar:** listas, calendarios y tableros donde se junten **elementos de tipos
distintos** en un mismo arreglo, y después una acción los trate a todos igual. La pista
mecánica: un arreglo que se arma con dos o más `push`/`map` de orígenes distintos, y un
manejador —`onDrop`, `onClick`, `onSelect`— que usa un identificador compartido.

**Cuenta como hallazgo** cuando la acción puede escribir, borrar o mandar un aviso **sobre el
elemento equivocado**.

**No cuenta** cuando los dos tipos hacen lo mismo a propósito, ni cuando la acción sólo abre
una pantalla.

### 2.b — Pregunta 21: un registro roto se lleva puesta la lista

**Qué buscar:** un `map`, `forEach` o `for` que arme una lista para mostrar, con el `try` **por
fuera del ciclo**, y un `catch` que devuelva lista vacía.

**Cuenta como hallazgo** cuando un solo registro con un dato malo puede dejar la pantalla
vacía, y esa pantalla vacía **se ve igual que no tener nada**.

**No cuenta** cuando el error ya se aísla adentro del ciclo.

### Dónde buscar, y qué NO tocar

Buscá en todo `src/`. Pero **lo que sea de plata, cobros, comida o permisos lo listás y me lo
pasás: no lo arreglás vos.** Eso incluye `src/app/actions/` de contabilidad, cobros, sueldos,
presupuestos y menús.

**El calendario ya está arreglado** (`src/app/actions/agenda.ts` y
`src/app/(app)/calendario/page.tsx`): no lo rehagas, es el ejemplo de cómo tiene que quedar.

---

## Qué tiene que comprobar la prueba

**No sirve buscar un nombre en el código: daría verde con el enlace roto puesto.** Las pruebas
tienen que mirar el resultado:

- **Para los enlaces:** abrir cada uno de los ocho en el navegador y comprobar que **la pantalla
  que llega es la correcta**, no que responde. Los cinco de los impresos, además, con una fiesta
  abierta, comprobando que **vuelven a esa misma fiesta** y no al listado.
- **Para el barrido:** por cada lugar que arregles, una prueba que le meta el caso malo —el
  elemento del otro tipo, el registro con el dato roto— y compruebe que **lo demás sigue
  funcionando** y que no se tocó lo que no correspondía.

```comprobar
archivo: src/app/portal/page.tsx
usa: /simulador-de-presupuesto en src/app/portal/page.tsx
usa: /settings/social-connections en src/app/(app)/empresa/presencia-digital/page.tsx
prueba: tests/e2e/los-enlaces-llegan-a-donde-dicen.spec.ts
```
