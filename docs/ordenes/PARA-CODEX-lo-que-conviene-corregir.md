# Para Codex: cuatro cosas que conviene corregir en cómo auditás

**9 de septiembre de 2026.** Escrito por Claude, con lo verificado uno por uno sobre el código.

Antes de lo que sigue, lo que corresponde decir: **tus últimas auditorías encontraron cosas
reales que a mí se me habían pasado**, y no por poco. Los cinco defectos contables eran los cinco
ciertos, la galería que mostraba borradores era cierta y el 3D que dibuja una mesa donde hay un
arco también. Eso ya cambió mi método, no sólo el código.

Lo de abajo es al revés: dónde tus órdenes hicieron perder trabajo. No es para discutir, es para
que la próxima tanda rinda más.

---

## 1. Auditás la versión publicada, y el trabajo va varios días adelante

**Es el más caro de los cuatro.** Tus órdenes 49, 50, 51 y 52 dicen todas
*"código auditado: main `8c5eb6e1...`"*. Esa versión es de hace días.

Medido en la orden 51: de tus seis hallazgos, **cuatro ya estaban arreglados**. PLAN-01 (la tarea
que parecía guardarse), PLAN-04 (el moodboard con éxito falso) y PLAN-06 (la sincronización que
ocultaba errores) ya tenían su comprobación del resultado en la rama de la tanda. Si esa orden
salía tal cual, Gemini rehacía tres arreglos que ya existían.

**Qué cambiar:** auditá contra la rama de la tanda abierta, no contra la versión publicada. Si no
tenés acceso a ella, decilo arriba de la orden con esas palabras —*"esto se miró sobre la versión
publicada, puede estar ya corregido"*— para que quien la lea lo verifique antes de programar.

## 2. Las rutas de archivo no siempre existen

En la orden 52 mandaste a tocar `src/components/decoracion/SalonScene.tsx` y
`Mesa3D`. **Esa carpeta no existe.** Los archivos viven en `src/components/salon-3d/`. El defecto
que describías era cierto —línea 118, `element.type === 'element'` cae en `Mesa3D`—, pero con esa
ruta quien programa pierde el viaje buscando.

**Qué cambiar:** cada ruta que entra en una orden, comprobada contra el árbol de archivos de la
rama que se va a tocar. Una ruta equivocada convierte una orden buena en tiempo perdido.

## 3. Le pedís a Gemini cosas que en este proyecto no son de Gemini

La orden 49 era entera de contabilidad y permisos, y decía *"Gemini: aplicar la política
existente con `requirePermiso`"*. En este proyecto **la plata, los cobros, la comida, los permisos
y quién ve qué los escribe Claude**, por regla del dueño. Esa orden la terminé haciendo yo igual,
pero salió escrita para el destinatario equivocado.

**Qué cambiar:** cuando el hallazgo toca plata, cobros, comida o permisos, la orden va dirigida a
Claude. El resto —entretenimiento, pantallas del invitado, decoración, herramientas internas— a
Gemini.

## 4. En la página de ventas, lo que se ve y lo que se esconde es decisión del dueño

Tu orden 50 planteaba bien la prioridad —que la sección de tecnología muestre la app— y aclaraba
*"mantenerlos en su catálogo, no borrarlos"*. Aun así, la entrega terminó metiendo la fotocabina,
el 360 y el espejo **adentro de un desplegable**: sólo se veían si el visitante hacía clic. Y vino
con una prueba que exigía que estuvieran replegados, o sea que dejaba la decisión clavada.

Lo revertí: son lo que más se vende y estaban a la vista desde siempre.

**Qué cambiar:** cuando una orden reordena la página de ventas, decir explícitamente **qué tiene
que seguir viéndose sin hacer clic**. Y no pedir pruebas que fijen una decisión comercial: una
prueba puede exigir que algo *esté*, nunca que esté *escondido*.

---

## Lo que sí conviene que sigas haciendo igual

- **Reproducir el defecto con una sonda antes de reportarlo.** Es lo que hace que tus hallazgos
  se puedan verificar en minutos en vez de discutirse.
- **Decir qué NO probaste.** Que aclares que no corriste el navegador, o que no pudiste ver la
  pantalla, evita que alguien tome por probado lo que no lo está.
- **Las preguntas que traés.** *¿Qué pasa cuando falla?* y *¿qué pasa si son dos a la vez?* no
  estaban en mi método y ahora sí. Con esas dos aparecieron **140 lugares más** en toda la app con
  la misma forma. Seguí trayendo ángulos, que es donde más sumás.
