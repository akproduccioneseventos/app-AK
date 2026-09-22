# Orden 78 — La portada no le muestra cajas grises al visitante

**Lo reporto el dueno el 21 de setiembre de 2026**, entrando a la web por primera vez en el
dia: *"la primera vez que entre a la web estaba lenta y aparecieron cosas imagenes raras"*.

**Que son esas "imagenes raras", medido, no supuesto.** Son los recuadros de espera de la
portada. En `src/app/page.tsx`, seis secciones lentas se cargan despues
(`Suspense`), y mientras tanto se dibujan **cajas grises que laten**: `SalonSkeleton`
(linea ~300), `GallerySkeleton`, `BlogSkeleton`, `VideoSkeleton`, `TestimonialsSkeleton`,
todas definidas en ese mismo archivo, con `bg-slate-200 animate-pulse`.

**Por que se ven tanto tiempo y esto NO se toca.** El servidor se duerme cuando nadie lo
usa —decision del dueno, `minInstances: 0` en `apphosting.yaml`, **no se cambia**—, asi que
la primera visita del dia espera a que despierte. Ahi los recuadros quedan a la vista varios
segundos. La espera es la decidida; **lo que esta mal es lo que se muestra durante la
espera**: a un prospecto que llega de Google le aparece media pantalla de cajas grises
latiendo, y eso parece una pagina rota, no una empresa que vende fiestas.

## Lo que hay que hacer

**Reemplazar esos cinco recuadros por una espera que se vea como parte de la pagina**, no
como un andamio. La idea: que mientras carga se vea **algo real de AK** —el titulo de la
seccion ya escrito, el fondo y los bordes definitivos, y adentro un movimiento suave—, de
manera que cuando llega el contenido **no cambie el tamano ni salte nada**.

Concretamente, para cada uno de los cinco:

1. **El titulo de la seccion va escrito desde el primer momento**, con la misma tipografia y
   el mismo lugar que tiene despues. No es un dato lento: esta en el codigo.
2. **Nada de `bg-slate-200 animate-pulse` a pantalla completa.** El bloque conserva el alto
   que va a tener —para que no salte— pero con el fondo y el borde definitivos de la seccion,
   y adentro un indicador discreto y centrado.
3. **Se respeta el estandar de movimiento de la app**: usar la habilidad `animaciones-pro`.
   Nada que parpadee fuerte ni que llame mas la atencion que el contenido.
4. **En el celular tiene que verse bien**: usar la habilidad `celular-primero`. Sin
   desbordes y sin que la pagina se corra de lugar cuando entra el contenido.

## Que NO tocar

- **`minInstances` ni `memoryMiB` en `apphosting.yaml`.** Es decision del dueno y cuesta
  plata por mes.
- **La carga diferida en si** (`Suspense` + los `Async*Section`). Eso hace que la portada
  aparezca al toque y **esta bien asi**: lo unico que cambia es lo que se dibuja mientras.
- **Los textos de venta, la promocion, el reloj del simulador y los descuentos.** Son
  decisiones comerciales del dueno.
- **Las secciones que ya andan** (`AkTeamStorySection`, `FAQSection`, `CTASection`).

## Como se entrega

**UNA sola propuesta con todo.** Si un bloque se traba, se entrega igual el resto en la
misma propuesta y se avisa cual falto.

Antes de decir "termine", pasar lo que tocaste por `docs/ANTES-DE-ENTREGAR.md`.

## Que tiene que comprobar la prueba

La prueba **no** puede buscar un nombre en el codigo: con eso daria verde igual con las
cajas grises puestas. Tiene que mirar **lo que manda el servidor antes de que llegue el
contenido lento**, que es exactamente lo que ve el visitante en esos segundos:

- Que en esa primera entrega **ya aparezcan los titulos** de las cinco secciones.
- Que **no aparezca ningun bloque con `animate-pulse`** ocupando la seccion entera.
- Y que el alto reservado sea el mismo antes y despues, para que no salte.

```comprobar
archivo: src/app/page.tsx
usa: SalonSkeleton en src/app/page.tsx
prueba: tests/e2e/la-portada-espera-sin-cajas-grises.spec.ts
```
