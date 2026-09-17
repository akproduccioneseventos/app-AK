# Orden 59 — El cartel no puede decir "protegido" sin saberlo, y la decoración probada de verdad

**Para Gemini. UNA SOLA PROPUESTA con los dos bloques.** Si uno se traba, entregá el otro
igual en la misma propuesta y decí cuál faltó.

---

## Bloque A — El cartel de respaldos miente cuando no sabe

**Dónde:** `src/app/(app)/settings/backup/page.tsx`.

**Qué pasa hoy, medido:** el estado arranca en `null` (línea ~32) y, si la consulta falla, se
convierte en `null` otra vez (`getBackupStatus().catch(() => null)`, línea ~75). Todo el cartel
pregunta `backupStatus?.isStale` (líneas ~176 a ~209). Con `null`, esa pregunta da "no" y la
pantalla muestra **verde, "ACTIVO Y PROTEGIDO"**.

O sea: **mientras carga, y cuando no se pudo averiguar, la pantalla afirma que los datos están
protegidos sin tener idea.** Es la forma exacta de error que esta app persigue: un cartel que
dice que todo está bien sin haber mirado.

**Qué hay que hacer:** que el cartel distinga **cuatro** estados, no dos:

1. **Cargando** — mientras se pide el estado. Ni verde ni rojo: un cartel neutro que diga que
   se está averiguando.
2. **No se pudo saber** — la consulta falló. Cartel de atención en ámbar, con el texto
   *"No se pudo averiguar cómo están los respaldos. Probá recargar; si sigue, creá un punto
   manual."* **Nunca verde.**
3. **Al día** — verde, como ahora.
4. **Sin respaldo reciente** — rojo, como ahora.

Para eso hace falta separar los tres casos que hoy se pisan en `null`. Poné una función en la
misma pantalla llamada **`comoEstaElRespaldo`** que devuelva `'cargando' | 'no-se-pudo-saber' |
'al-dia' | 'vencido'`, y que el cartel se dibuje a partir de eso. **El `catch` que hoy devuelve
`null` tiene que poder distinguirse del estado inicial**: guardá el fallo, no lo tires.

**Qué NO tocar:** el aviso rojo de "los respaldos automáticos fallaron N veces seguidas"
(línea ~165) ya funciona bien y queda igual. Tampoco se agrega una pantalla nueva: es esta.

**Qué tiene que comprobar la prueba** (`src/__tests__/el-cartel-de-respaldo-no-miente.test.ts`):
que con el estado **sin averiguar** el cartel **no** diga "ACTIVO Y PROTEGIDO", y que con el
estado al día sí lo diga. Probá la función `comoEstaElRespaldo` con los cuatro casos. **No vale
una prueba que se escriba la lógica adentro**: tiene que importar la pantalla de verdad.

```comprobar
archivo: src/app/(app)/settings/backup/page.tsx
usa: comoEstaElRespaldo en src/app/(app)/settings/backup/page.tsx
prueba: src/__tests__/el-cartel-de-respaldo-no-miente.test.ts
```

---

## Bloque B — La decoración editada mientras se guarda, probada en el componente real

**Contexto:** Codex reprodujo (DECO15) que editar mientras se está guardando puede perder lo
recién escrito. **El arreglo ya está en tu propuesta 1206**, con el contador de versiones. Lo
que falta es **la prueba que lo demuestre sobre el componente real**, no sobre una copia de la
lógica escrita adentro de la prueba.

**Qué tiene que comprobar:** que si alguien escribe algo **mientras** el guardado anterior está
en camino, después de recargar **está lo último que escribió**, no lo viejo. Los dos órdenes:
guardado A en curso → edición B → termina A; y edición B → guardado A que vuelve tarde.

**Qué NO hacer:** no rehagas el arreglo del contador de versiones, ya está. Esto es sólo la
prueba.

```comprobar
prueba: src/__tests__/la-decoracion-no-pierde-lo-ultimo-que-se-escribio.test.ts
```

---

## Lo que ya tenés pendiente y sigue igual

- **Devolución 48** (`docs/ordenes/DEVOLUCION-48-entretenimiento-sesion-segura.md`): **está
  corregida hoy**. Leé la parte de abajo: la indicación vieja de apagar el cartel "sin
  condición" era incompleta y creaba otro defecto. Ahí está la regla correcta y los dos casos
  que tiene que mirar la prueba.
- **Orden 47** (redes: la ventana bloqueada y el panel diciendo que se abrió).
- **Órdenes 55 y 56** siguen a medias en la propuesta 1206.
