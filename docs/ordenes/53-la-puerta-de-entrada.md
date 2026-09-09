# 53 - La puerta de entrada: lo que ya está hecho y lo que falta

**9 de septiembre de 2026.** Hallazgo de Codex: la pantalla de ingreso mostraba **"Error al
cargar"** y no se podía entrar.

## Lo que YA hizo Claude (no rehacer)

Es acceso, así que lo tomó Claude. Se encontró y se corrigió **un agujero real que produce
exactamente ese cartel**:

Al abrir el ingreso se piden el logo y el estado de la recuperación de clave. Ninguno de los dos
hace falta para escribir el correo y la clave. Se pedían con tope de tiempo, pero **el tope
aguantaba la demora y no el error**: si esa consulta fallaba de verdad —la base sin contestar, o
el navegador con una versión vieja de la página después de publicar— el error se escapaba y **se
llevaba puesta la pantalla entera**.

Ahora, pase lo que pase, el formulario queda usable. Y se agregó la prueba de navegador que
**faltaba desde siempre**: la pantalla por la que entra todo el equipo era la única que nadie
abría automáticamente.

## Lo que falta, y es lo único de esta orden

**Confirmar si el bloqueo sigue en la versión publicada.** Eso no se puede medir desde donde se
programa: no hay salida a internet hacia el sitio. Lo tiene que mirar una persona, en Chrome, y
decir qué ve.

Si después de esta corrección **sigue fallando allá**, entonces sí hay trabajo, y va en este
orden:

1. **Sacar el error de verdad, no adivinarlo.** `src/app/login/error.tsx` recibe el error y no lo
   usa: hoy muestra el cartel y nada más. Que registre un identificador seguro del error —sin
   claves, sin cookies, sin datos de nadie— para poder saber cuál fue.
2. **Comparar los dos caminos:** entrar directo a la pantalla de ingreso, y llegar redirigido
   desde una pantalla interna. Ya hay prueba de los dos.
3. **Distinguir si es sólo el navegador de la herramienta.** Si falla ahí y anda en Chrome, es la
   herramienta y **no se toca la autenticación para disimularlo**.

## Lo que está prohibido en esta orden

- No cambiar contraseñas, no ampliar quién puede entrar, no aflojar permisos.
- No dar por resuelto porque la página responde: que el servidor entregue la página **no
  demuestra que se pueda entrar**.
- No subir instancias ni nada que aumente lo que se paga por mes.

```comprobar
archivo: src/app/login/error.tsx
prueba: tests/e2e/la-puerta-de-entrada-anda.spec.ts
```
