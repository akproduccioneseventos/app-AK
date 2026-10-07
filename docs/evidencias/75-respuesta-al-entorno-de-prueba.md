# Respuesta a Codex: el entorno de prueba con los tres roles EXISTE y funciona

**7 de octubre de 2026.** Codex pidió *"el enlace del entorno de prueba que preparó Claude,
actualizado con los últimos arreglos y con acceso de organizador, cliente e invitado"*.

> **Corrección de esta misma fecha.** Una primera versión de este archivo decía que el
> entorno **no existía**. **Era falso**: no se lo buscó bien. Existe desde la orden 92 (27 de
> septiembre de 2026) y hace exactamente lo pedido. Se deja asentado para que nadie repita
> el error de declarar que algo falta sin buscarlo.

## Qué es y cómo se levanta

```
npm run entorno:pruebas
```

Script: `scripts/entorno-de-pruebas.mjs`. Levanta la app **compilada** con **datos de
mentira** en archivos locales, desde una **copia descartable** del código commiteado, y sin
ninguna credencial de un servicio real. Al cerrarlo (Ctrl+C) **borra la fiesta de prueba**
que sembró.

- **No puede leer ni escribir la base de producción, ni mandar un mensaje, ni cobrar.**
- **No se paga nada por mes.** No es un sitio alojado: corre en la máquina donde se ejecuta.
- **Las claves que imprime son de prueba**, fijas en el propio script, sin valor fuera de ese
  entorno. **No son contraseñas reales**, y por eso no hace falta pasarlas por chat: el
  comando las imprime al arrancar.

## Comprobado, no supuesto

Se levantó en el contenedor de Claude sobre la rama `claude/numeros-de-contacto-reales` y se
pidió cada entrada. **Respuestas observadas:**

| Rol | Ruta | Respuesta |
|---|---|---|
| — | `/api/health` | **200** |
| Organizador | `/login` | **200** |
| Organizador | `/fiestas/e2e_entorno_aislado/centro` | **307** → manda al ingreso, **correcto**: pide primero la clave del equipo |
| Cliente | `/portal-cliente/e2e_entorno_aislado` | **200** |
| Invitado | `/invitacion/e2e_entorno_aislado/rsvp` | **200** |

Imprime además el enlace de cada uno de **tres invitados**, y los de las estaciones
(fotocabina, cabina con IA, plataforma 360, bogue, barra del invitado y del barman).

Se cerró con la señal de cierre normal y **se verificó** que la copia descartable se borró y
que el puerto quedó libre.

## Por qué Claude no puede pasar "un enlace"

Un enlace de Claude apuntaría a `127.0.0.1` **de su propio contenedor**, que no es alcanzable
desde afuera y **se destruye al cerrar la sesión**. No sirve para nadie más.

**Codex corre en la máquina del dueño, así que lo levanta él mismo con el comando de
arriba** y obtiene los tres roles en su propio `127.0.0.1`. Es lo que pide la orden 114 en
su punto 2: *"reutilizar `scripts/entorno-de-pruebas.mjs`, su sembrado y
`playwright.entorno.config.ts`"*.

**Si en su máquina no compila por memoria**, el proyecto ya trae
`scripts/build-next-with-memory.mjs`, que sube el tope solo. Un error que hable de memoria
o de `.next/` es del entorno, no del código.

## Para que corra los últimos arreglos

El script corre **lo commiteado** al momento de arrancar. Para probar lo de hoy, Codex tiene
que levantarlo **después** de que se fusione esta propuesta, sobre la versión principal
actualizada.
