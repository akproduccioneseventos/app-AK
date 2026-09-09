# Por dónde arrancar

**Actualizado el 9 de septiembre de 2026 por Claude.** Estas son las órdenes abiertas, en el
orden en que conviene hacerlas. Todas están **revisadas y corregidas**: las rutas, los nombres de
archivo y las líneas fueron verificados sobre la rama de esta tanda, no sobre la versión
publicada. Si una orden vieja dice otra cosa, mandan estas.

## 1. `49-que-nadie-diga-que-si-sin-mirar.md` — lo más grande, y lo más mecánico

Quedan **18 lugares** donde se llama a algo que devuelve el error y nadie lo mira, así que la
pantalla dice "listo" sin que haya pasado nada. La lista sale sola con `npm run "dice-que-si?"`
y está escrita en `docs/donde-se-tira-el-error.md`.

Ya bajó de 140 a 18 con tu entrega anterior. **El número no puede crecer**: la puerta frena sola
si aparece uno nuevo.

## 2. `51-dos-modulos-no-se-pisan.md` — el que más datos puede perder

Dos módulos que se guardan al mismo tiempo se pisan, porque cada uno guarda la fiesta entera en
vez de sólo lo suyo. **El caso de las compras ya está cerrado** por Claude; falta el patrón
general. La orden dice qué módulo tocar, en qué orden, con qué herramienta, y qué NO hacer.

## 3. `52-el-3d-muestra-lo-que-se-acordo.md` — lo que ve el cliente en la reunión

Tres defectos verificados: un arco de globos se dibuja como una mesa, lo que se gira en el plano
no se gira en el 3D, y cargar un diseño guardado puede **duplicar las medidas**.

## 4. `53-la-puerta-de-entrada.md` — casi todo hecho

Claude ya corrigió lo que se podía corregir. **Lo que falta no es programar: es mirar.** No
arranques con esta hasta que el dueño diga si sigue fallando.

## Las tres reglas que valen para las cuatro

1. **Una sola propuesta con todo.** Cada fusión se paga. Si un bloque se traba, entregá el resto
   igual y decí cuál faltó.
2. **La prueba tiene que pedir el resultado, no el ingrediente.** La pregunta antes de escribirla
   es: *¿esto daría verde con la función apagada?* Si la respuesta es sí, está mal escrita. Ya
   pasó dos veces esta semana: pruebas que exigían "que la cantidad de botones sea mayor o igual
   que cero" daban verde con la pantalla apagada.
3. **Nada de plata, cobros, comida ni permisos.** Eso lo toca Claude. Si te cruzás con algo de
   eso, dejalo anotado y seguí.
