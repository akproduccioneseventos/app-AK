# Acá quedé

**23 de septiembre de 2026.** Rama `fix/traspaso-23`, sólo con esta hoja. **Todo lo mío está
fusionado** (1217 y 1214, las dos con la verificación completa en verde).

## Lo que entró hoy

- **Barra, fotos, salones y pagos de salones** aguantan varios servidores a la vez (1217).
- **De Gemini (1214):** secretario manos libres, salón 3D en el portal del cliente (con y sin
  clave) y escena armada sola. Se le sacó una línea que mandaba la clave del portal al navegador.
- **La verificación prueba lo nuevo, no toda la app** (orden del dueño): corre sólo las pruebas
  de navegador que el cambio alcanza, repite sólo lo que falló y compila una vez. Si el cambio
  toca algo general, corre todo.

## Pendiente, y es mío

- **Resto de la orden 81 de Codex** (rama `codex/contraste-1206-20260914`, commit 85e110a):
  la parte de datos, permisos, plata y comida, por rol.

## Espera decisión del dueño

- **Subir la memoria del servidor** (propuesta 1207). Recomendación: no subirla; nunca se midió
  que sea la causa.

## Espera a Gemini

- Devoluciones viejas: 42, 48, 48b, 61, 71, 74-77 pantallas equivocadas, acceso administrativo.

## Lo que ningún control cubre

Falta **un ensayo real** por rol, con fotocabina, 360, barra y conexiones de afuera.

## Trampas que no se repiten

- **Antes de esperar una corrida, mirar en la primera línea cuántas pruebas va a correr.**
- **No se sube lo que escribe la corrida**: `npm run limpiar:corrida`.
- **No se toca código ni se sube mientras corre la verificación.**
