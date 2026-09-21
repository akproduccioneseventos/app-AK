# Acá quedé

Hoja de traspaso entre chats. **Corta a propósito**: se lee entera al abrir cada sesión.
Lo histórico va a `docs/YA-RESUELTO.md`. **Se pisa, no se acumula.**

---

**Última actualización:** 20 de septiembre de 2026, de noche. **Rama
`fix/despertador-de-afuera`**, todo subido, **sin fusionar**.

## Lo que entró en esta tanda

- **Plata:** el indicador de preparación daba 100% con el cliente debiendo.
- **Comida:** la lista de compras sumaba gramos como si fueran kilos; y el salón que se arma
  solo contaba los invitados con un campo que no existe.
- **El buzón** decía "Sincronizado" con la lista borrada y la descarga bajaba un archivo vacío.
- **El secretario que habla** anotaba prospectos de mentira: decía que sí y no guardaba nada.
- **Al volver del ingreso** se perdía la fiesta y la pantalla quedaba cargando para siempre.
- **De Gemini:** el salón en 3D para el cliente (gira con el dedo, con la foto de respaldo), el
  armado automático, cinco piezas nuevas, y el botón de Vista 3D que no abría.

## Lo que cambió en el mecanismo

- **Preguntas 17, 18 y 19** en `docs/COMO-AUDITAR.md`.
- **Control nuevo: ninguna prueba apagada.** Aparecieron **dos de comida dormidas hacía
  semanas**; ya despertaron y pasan.
- **Control nuevo: el secretario hace lo que dice que hace** (una acción declarada que nadie
  ejecuta se pone en rojo).
- **La corrida dice qué archivo no carga** cuando una tanda no registra ninguna prueba.

## Lo único que falta para poder fusionar

- **`tests/e2e/48-touchpix-entrega-sin-reinicio.spec.ts`, de Gemini, no pasa.** Medido dos
  veces, sola y en tanda: la estación contesta *"La validacion del evento demoro demasiado"* en
  vez de mostrar el botón de sacar la foto. Devuelto en
  `docs/ordenes/DEVOLUCION-48b-la-prueba-nueva-de-touchpix-no-pasa.md`.
- **Todo lo demás está en verde**: compila, 2762 pruebas, sin acentos rotos, y la puerta llegó
  hasta el paso del navegador con nueve controles pasados.

## Lo que está esperando a Gemini

Órdenes **74** (secretario manos libres), **76** (importar planilla en el celular: el botón de
confirmar no se puede tocar) y **77** (el portal con clave también tiene que mostrar el 3D, sin
copiar el código), más la devolución de arriba.

## Trampas que no se repiten

- **La sesión del equipo son dos mitades**: cookie + marca en el navegador (`ponerSesionDelEquipo`).
- **No se sube lo que escribe la corrida**: `npm run limpiar:corrida`.
- **No se toca código mientras corre la puerta**: la tira abajo y no deja subir.
