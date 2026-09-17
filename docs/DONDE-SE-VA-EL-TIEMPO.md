# Dónde se va el tiempo de la verificación (medido, no estimado)

**Orden del dueño, 17 de septiembre de 2026: "debés acelerar los procesos".** Esto queda escrito
para que nadie vuelva a adivinar dónde está el problema: **está medido**, sacado de los registros
de las corridas reales de este contenedor.

## El reparto, de una corrida completa

| Paso | Cuánto tarda | Qué mira |
|---|---|---|
| Acentos | 1 segundo | Todo |
| Lo que se dijo es lo que es | 1 segundo | Todo |
| El trinquete | 1 segundo | Todo |
| Revisor de tipos | 11 segundos | El código |
| Pruebas (las de siempre) | 40 segundos | El código |
| **Compilación** | **6 minutos** | El código |
| Seguridad de la base | 15 segundos | El código |
| Las pruebas nuevas, primero | 0 a 2 minutos | Sólo las pruebas nuevas |
| **La app usada de verdad (navegador)** | **31 minutos** | El código |
| Recorrido de pantallas | 20 segundos a 18 minutos | Las pantallas que cambiaron |

**La conclusión, y es la única que importa:** de los ~40 minutos de una corrida completa,
**31 son el navegador**. La compilación son 6. Todo lo demás junto no llega a un minuto y medio.

## Qué se hizo ya, y cuánto sacó

1. **Retomar donde quedó** (15 de septiembre). Si se cae el contenedor, no repite lo que ya dio
   bien. Ahorra hasta 40 minutos por caída.
2. **Cada paso mira sólo lo que lo puede cambiar** (17 de septiembre). Tocar un documento ya no
   dispara la compilación ni el navegador: pasa de 40 minutos a menos de 5.

## Lo que se probó y NO funcionó (no repetirlo)

**Correr las pruebas de navegador de a más.** Ya está hecho: hoy corren de a tres, en una sola
tanda, salvo cuatro que tienen que ir solas porque comparten la fiesta de prueba. Pasar de tres a
cuatro ganó el 9% y empezó a dar fallas inventadas. **El tiempo no está en la falta de paralelo.**

## Dónde está de verdad, y cómo se va a saber

Son **182 pruebas de navegador que tardan 31 minutos corriendo de a tres**: unos 30 segundos cada
una. El problema era que nadie sabía **cuáles** se llevan el tiempo, y averiguarlo costaba otra
corrida de 31 minutos.

Los tiempos ya venían en el informe de cada corrida **y se tiraban**. Desde el 17 de septiembre de
2026 se imprimen: al final de cada verificación sale **la lista de las cinco pruebas más lentas y
cuánto pesan sobre el total**. Con esa lista se decide qué se acelera; sin ella se adivina, y
adivinar acá ya costó caro dos veces.

## Lo que falta, y por qué no se hizo de una

**El navegador corre de a una prueba por vez** (`workers: 1` en `playwright.config.ts`) en una
máquina de cuatro núcleos. Correr de a dos debería sacar cerca de la mitad.

**No se cambia a ciegas.** Ya pasó: las pruebas de navegador de esta app se pisan entre ellas
cuando corren juntas —dos corridas a la vez se mataban, y una prueba con la máquina cargada falla
sola—. Antes de dejarlo puesto hay que **correr la tanda entera de a dos y ver que dé verde**, no
suponerlo.

**Regla que queda:** cualquier cambio de velocidad se mide con el reloj de la corrida y se anota
en esta tabla. Una aceleración que no se midió no existe.
