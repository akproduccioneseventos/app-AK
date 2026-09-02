---
name: que-cargue-rapido
description: Hacer que la app abra rapido en el celular del invitado y del prospecto, sin gastar mas por mes. Usala cuando algo tarde en abrir, cuando se agreguen fotos o videos, cuando se instale una biblioteca nueva, cuando una pantalla la vayan a usar 200 invitados a la vez -el muro, las estaciones, la galeria-, cuando el dueño diga que algo va lento, y antes de dar por terminada cualquier pantalla publica. Trae donde se va el tiempo de verdad, que medir, y la regla de que nada aumente la factura mensual.
---

# Que cargue rapido

**Dos escenarios distintos, y se arreglan distinto.** Confundirlos hace perder el
viaje:

- **El prospecto que llega de Google**, en su casa, con buena señal, y que **se va
  si tarda**. Ahi lo que importa es que **lo primero que se ve** aparezca ya.
- **El invitado en el salon**, 200 personas colgadas del mismo wifi flojo, sacando
  fotos y mirando el muro. Ahi lo que importa es **cuanto pesa cada foto** y
  **cuantas veces se pide lo mismo**.

## Antes de tocar nada: medir

**Nunca supongas donde se va el tiempo.** Es el error mas caro: se optimiza lo que
no era y el problema queda. Se abre la pantalla en el navegador con las
herramientas de desarrollo y se mira la pestaña de red: **que archivo tarda mas y
cuanto pesa**. Recien ahi se decide.

Si el problema es el servidor que arranca dormido, **eso ya esta decidido y no se
toca**: `minInstances: 0` en `apphosting.yaml` es del dueño, se paga por mes tenerlo
despierto, y dijo que no. **Es falso positivo.**

## Donde se va el tiempo, en orden

### 1. Las fotos, casi siempre

Es el 80% de los casos y el mas facil.

- **Formato moderno**: el componente `<Image>` de Next.js entrega WebP o AVIF solo.
  Una foto de fiesta pasa de 3 MB a 200 KB **sin que se note en pantalla**.
- **Tamaño real**: no se manda una foto de 4000 pixeles para mostrarla en 400.
- **Lugar reservado**: `width` y `height` siempre, o el texto salta cuando la foto
  termina de bajar y **se ve como un error**.
- **Las de mas abajo, despues**: solo las que se ven de entrada cargan primero
  (`priority`); el resto espera a que la persona baje.
- **Las que suben los invitados se achican ANTES de subir**, en el telefono. Eso
  ademas **ahorra plata**: se guarda menos y se lee menos.

### 2. Lo que se descarga sin usarse

- Una biblioteca entera para una sola funcion. **Antes de instalar algo nuevo,
  fijate si ya esta**: la app tiene `framer-motion`, `lucide-react`, `date-fns`.
- Lo pesado que no se ve de entrada —un mapa, un editor, un lector de codigos QR—
  **se carga cuando hace falta** (`next/dynamic`), no al abrir.
- **La pagina publica no deberia arrastrar codigo del panel interno.** Si lo hace,
  el prospecto descarga la app entera para ver un precio.

### 3. Pedir lo mismo muchas veces

Esto **se paga**: Firebase cobra por lectura.

- **La cache del navegador ya esta puesta** (`persistentLocalCache` en
  `src/lib/firebase/config.ts`). Hay una prueba que la vigila: **no la saques**.
- **Nunca pidas datos adentro de un bucle.** 200 invitados = 200 pedidos. Se traen
  todos juntos.
- **Escuchar en vivo solo lo que cambia en vivo** —el muro, la fiesta de hoy—. Lo
  que no cambia se lee una vez.

## La regla que manda sobre todas

**Nada que aumente lo que se paga por mes se cambia sin preguntar.** Ni memoria,
ni instancias, ni CPU, ni un servicio nuevo. Si la unica forma de acelerar algo es
pagando, **se deja preparado y se le pregunta al dueño**. Esa es una orden suya,
no una sugerencia.

## Como se sabe si mejoro

Medir **lo mismo, antes y despues**, y decirlo en criollo: *"la landing de quince
abria en 4 segundos y ahora en 1,5"*. Sin numero antes y despues, **no se sabe si
mejoro**, y ya paso de "arreglar" algo que no era el problema.

Y hay una trampa: **medir con la version de desarrollo no vale**, porque arma cada
pantalla al visitarla. Se mide sobre la version compilada.

## Antes de dar por terminada una pantalla publica

- ¿Las fotos pasan por `<Image>`, con su tamaño reservado?
- ¿Lo pesado que no se ve de entrada **espera**?
- ¿Se instalo alguna biblioteca nueva? ¿Habia una que ya estaba?
- ¿Se pide algo adentro de un bucle?
- ¿El numero de antes y el de despues, medidos sobre la version compilada?
- ¿Algo de esto **aumenta lo que se paga por mes**? Si la respuesta es si: **parar
  y preguntar.**
