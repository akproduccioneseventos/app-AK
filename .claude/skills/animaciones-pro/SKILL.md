---
name: animaciones-pro
description: El estandar de movimiento de la app AK. Usala SIEMPRE que haya que animar algo, dar movimiento, "que se vea mas vivo", hacer transiciones, aparecer al bajar, carruseles, contadores, efectos al pasar el mouse, o antes de dar por terminada cualquier pantalla que vea un cliente o un invitado. Tambien cuando una pantalla se sienta "quieta", "plana", "barata" o "estatica", cuando haya que revisar movimiento que ya existe, y cuando se escriba una orden que pida animaciones. Trae las curvas, los tiempos, el codigo exacto con framer-motion y las tres pruebas que separan una animacion profesional de una que espanta clientes.
---

# Animaciones pro

**Por que existe:** el movimiento mal hecho es **peor que ninguno**. Una pagina que
se sacude, rebota o hace esperar se siente barata y lenta, justo al reves de lo que
se buscaba. Y hay una forma de arruinarlo que es la mas cara de todas: **animar la
entrada de lo que vende** —el precio, el titulo, el boton de contacto— y que el
prospecto entre, no lo vea, y se vaya.

Esta habilidad existe para que eso no pase, y para no volver a discutir tiempos y
curvas en cada pantalla.

---

## Lo que separa lo profesional de lo amateur

No es la cantidad de movimiento: **es la contencion**. Las tres diferencias, en
orden de cuanto se notan:

1. **Lo pro se mueve poco y rapido.** 16 a 24 pixeles, 0,3 a 0,5 segundos. Lo
   amateur viene volando de 100 pixeles, tarda un segundo y rebota.
2. **Lo pro desacelera al final.** Las cosas del mundo real frenan; no arrancan y
   paran de golpe. Eso es la "curva", y es la mitad del efecto.
3. **Lo pro no te hace esperar nada.** El contenido esta; el movimiento lo acompaña.

## Las curvas, que es lo que casi nadie ajusta

En `framer-motion` la curva va como cuatro numeros. Estas tres cubren todo:

```ts
// src/lib/motion.ts  — un solo lugar, para que toda la app se mueva igual
export const SUAVE   = [0.22, 1, 0.36, 1] as const;   // entrar: arranca rapido y frena. El 90% de los casos.
export const PAREJO  = [0.4, 0, 0.2, 1] as const;     // mover algo que ya esta en pantalla.
export const SALIR   = [0.4, 0, 1, 1] as const;       // irse: acelera y desaparece. Rapido, 0,2s.
```

**Nunca uses el rebote (`type: 'spring'` con bounce) en una pagina de venta.** El
rebote es simpatico en un juego y se ve barato en un precio. La excepcion son las
pantallas de fiesta —la fotocabina, el muro— donde el clima es otro.

## Los tiempos, que no se discuten mas

| Que | Cuanto | Por que |
|---|---|---|
| Entrar un bloque | **0,4 s** | Menos se pierde, mas se siente lento |
| Salir | **0,2 s** | Irse siempre es mas rapido que llegar |
| Cascada entre hermanos | **0,08 s** | Se lee como un movimiento, no como una fila |
| Pasar el mouse | **0,15 s** | Tiene que sentirse instantaneo |
| Contador que sube | **1,2 s** | Es el unico que puede tardar: la gracia es verlo subir |

**La cascada se corta a los 4 escalones.** Doce cosas entrando de a una aburren y
la ultima llega cuando el ojo ya se fue.

## Que se anima y que no

Anima **solo dos cosas**: `opacity` y `transform` (mover, agrandar). Son las unicas
que el navegador resuelve sin volver a calcular la pagina; todo lo demas
—`width`, `height`, `top`, `margin`— hace saltar el texto de alrededor y **se ve
como un error, no como un efecto**.

```tsx
// Bien: se mueve sin empujar a nadie
<motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} />

// Mal: el navegador recalcula la pagina en cada cuadro y tironea
<motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} />
```

## El patron que se usa en el 90% de los casos

Aparecer al llegar a la pantalla, **una sola vez**, en cascada:

```tsx
'use client';
import { motion } from 'framer-motion';
import { SUAVE } from '@/lib/motion';

const contenedor = {
  oculto: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const bloque = {
  oculto: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: SUAVE } },
};

export function Seccion({ children }: { children: React.ReactNode }) {
  return (
    <motion.section
      variants={contenedor}
      initial="oculto"
      whileInView="visible"
      // `once` es lo que evita que se re-anime al subir y bajar, que marea.
      // El margen negativo lo dispara un poco antes de llegar: cuando el ojo
      // llega, el movimiento ya empezo y se siente natural.
      viewport={{ once: true, margin: '-80px' }}
    >
      {React.Children.map(children, (hijo) => (
        <motion.div variants={bloque}>{hijo}</motion.div>
      ))}
    </motion.section>
  );
}
```

## Lo que NUNCA se anima al entrar

**Esta es la regla que evita perder plata.** No pongas `initial={{ opacity: 0 }}`
en:

- **El titulo principal** de la pagina.
- **El precio** y cualquier numero de plata.
- **El boton de contacto o de WhatsApp.**
- **La primera imagen grande.**

Esos se ven de entrada, quietos. **Google mide cuanto tarda en verse lo mas grande
de la pantalla**, y arrancarlo invisible empeora esa medicion y el lugar en el
buscador. Y peor: si el codigo falla, lo que arranco en `opacity: 0` **queda
invisible para siempre** y el prospecto ve un hueco donde estaba el precio.

Animar lo de mas abajo, si. Lo de arriba, no.

## Respetar a quien pidio menos movimiento

Hay gente a la que el movimiento le da mareo y lo desactiva en su telefono. Hay que
respetarlo, y ademas se hace en tres lineas:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

Con `framer-motion`, `useReducedMotion()` devuelve `true` y ahi se entrega el
contenido **quieto y visible** —nunca escondido—.

## En el celular, mas sobrio

La mitad de distancia (8 px), sin efectos al pasar el dedo —no existe el "pasar el
mouse"— y sin acercamientos en las fotos. La pantalla es chica y el dedo va rapido.

---

## Como se prueba que la animacion es de verdad

**Una prueba que solo mire "se ve el titulo" pasa igual con la pagina quieta.** Es
el error clasico y deja el control mintiendo. Hacen falta las tres:

```ts
// 1. QUE SE MUEVA DE VERDAD: la posicion cambia entre el momento de entrar y despues.
const antes = await bloque.boundingBox();
await page.waitForTimeout(600);
const despues = await bloque.boundingBox();
expect(antes!.y).not.toBeCloseTo(despues!.y, 0);

// 2. QUE NO ESCONDA LO QUE VENDE: visible ANTES de que termine ninguna animacion.
await page.goto('/landing/xv-anos');
await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
await expect(page.getByRole('link', { name: /whatsapp|contacto/i })).toBeVisible();

// 3. QUE RESPETE A QUIEN PIDIO MENOS MOVIMIENTO: quieto, pero VISIBLE.
await page.emulateMedia({ reducedMotion: 'reduce' });
await page.goto('/landing/xv-anos');
await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
```

La numero 2 es la que importa de verdad: **es la unica que agarra el error caro**,
el de animar el precio y que el cliente no lo vea.

---

## Antes de dar por terminada una pantalla

- ¿El titulo, el precio y el boton **se ven de entrada**, sin esperar?
- ¿Se anima **solo** opacidad y movimiento? (nada de alto, ancho ni margenes)
- ¿Entra **una sola vez**, no cada vez que se sube y baja?
- ¿La cascada tiene **4 escalones o menos**?
- ¿Con el movimiento desactivado **se ve todo igual**, solo que quieto?
- ¿En el celular es **mas sobrio**?
- ¿Hay **una prueba de las tres de arriba**, no solo un "se ve"?

Si alguna da que no, todavia no esta.
