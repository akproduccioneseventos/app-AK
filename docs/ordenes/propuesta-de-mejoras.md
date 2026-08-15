# Propuesta de mejoras — para decidir, no para hacer todavía

**Escribe:** Claude
**Fecha:** 15 de agosto de 2026
**Para:** el dueño. **Nada de esto se empieza sin que él elija.**

## Cómo se armó

Se leyó primero `docs/QUE-HAY-EN-LA-APP.md` para no proponer nada que ya exista.
La app ya tiene trece funciones de inteligencia artificial andando, filtro de
contenido en las fotos, cupones, tablero de conversión, pedido de reseña en
Google, recontacto automático, video del recuerdo y presentación para vender.
**Esto no es "lo que falta": es dónde se puede ganar más.**

Cada idea dice **qué gana el negocio** y **cuánto cuesta hacerla**, en criollo.

---

## Estado: el dueño pidió TODO (15 de agosto de 2026)

Se hace por tandas, no todo junto, porque una entrega gigante no se puede
revisar. **La tanda 1 ya está escrita** en
`docs/ordenes/mejoras-01-la-fiesta-vende-la-proxima.md`: son las ideas 1, 2 y 3
de acá abajo, más el arreglo de la galería vacía.

**Al escribirla se descubrió que la mitad ya estaba hecha por dentro**, y eso
las abarató mucho: `src/lib/commercial/acquisition.ts` ya define de dónde viene
cada interesado —con la fiesta y el invitado— y `public-lead-persistence.ts` ya
lo guarda. La app **ya sabe de qué fiesta vino cada prospecto**: falta ofrecerlo
en la fotocabina y tener la pantalla que lo muestre.

Las tandas siguientes, en este orden, cuando la 1 esté fusionada:

- **Tanda 2 — entretenimiento:** ideas 4, 5 y 6 (ranking en la pantalla gigante,
  mensajes para abrir dentro de X años, pedidos de música al DJ).
- **Tanda 3 — tiempo del equipo:** ideas 7 y 8 (pedido armado por proveedor,
  avisos preventivos).
- **Tanda 4 — contenido e inteligencia artificial:** ideas 10 y 11 (posteos
  automáticos desde las fotos de la fiesta, presupuesto que se explica solo).
- **Idea 9 (publicar automático en redes): no se hace por ahora.** Es la que más
  trámite tiene con Meta y la que menos trae al lado de las primeras.

---

# LO QUE MÁS PLATA TRAE POR LO QUE CUESTA

## 1. La fiesta se vende sola: el invitado pide su presupuesto esa misma noche

**Cuánto cuesta: poco.** Casi todo está hecho.

Hoy el invitado saca fotos, las sube al muro, se divierte, se va a la casa y se
olvida. Es el momento de mayor entusiasmo del año con AK y **no hay ninguna
puerta abierta** para que pida presupuesto.

**Qué hacer:** cuando el invitado descarga su foto o su tira de la fotocabina, en
la misma pantalla ofrecerle: *"¿Te toca cumplir 15 el año que viene? Mirá cuánto
sale tu fiesta"*, con el enlace al simulador. Sin insistir, sin tapar la foto: un
renglón abajo.

**Por qué rinde:** el simulador ya existe y ya mete los prospectos solos al CRM.
Sólo falta el puente. **Cien invitados por fiesta, cincuenta fiestas por año.**

## 2. Saber de qué fiesta salió cada cliente nuevo

**Cuánto cuesta: poco** — y menos de lo que parecía: **el dato ya se guarda**,
falta solamente la pantalla que lo muestre agrupado por fiesta.

Hoy entra un prospecto por el simulador y nadie sabe si vino de Instagram, de la
publicidad, o porque estuvo bailando en la fiesta de un primo. **Si no se sabe
qué trae clientes, se gasta a ciegas en publicidad.**

**Qué hacer:** que el enlace que se le muestra al invitado en la fiesta lleve una
marca de esa fiesta. Después, en el CRM, ver: "esta fiesta trajo 4 presupuestos y
1 contrato". El tablero de conversión ya existe: es una columna más.

**Por qué rinde:** cambia la conversación de "gastemos más en publicidad" a "las
fiestas de quince en el Club Uruguay nos traen tres clientes cada una".

## 3. El álbum que el cliente muestra, y que lleva la marca

**Cuánto cuesta: medio.** El video del recuerdo ya existe.

Después de la fiesta, el cliente quiere mostrar las fotos. Hoy tiene una galería
en el portal. Lo que **no** tiene es algo que pueda mandar por WhatsApp a la
familia entera y que se vea bien.

**Qué hacer:** un enlace público del álbum, lindo, con el nombre de la fiesta, la
marca de AK discreta al pie y un botón para pedir presupuesto. Que el cliente lo
reparta él, orgulloso, a cincuenta personas.

**Por qué rinde:** es publicidad que reparte el cliente, gratis, a gente que
acaba de ver una fiesta de AK.

---

# ENTRETENIMIENTO: LO QUE HACE QUE LA FIESTA SE HABLE

## 4. El ranking de la noche en la pantalla gigante

**Cuánto cuesta: medio.**

Las fotos del muro ya se ven en la pantalla grande. Falta la competencia, que es
lo que hace que la gente participe.

**Qué hacer:** cada tanto, la pantalla muestra "La foto más querida de la noche"
con la que más corazones tiene, y una tabla corta de las mesas que más
participaron. Nada de nombres, nada de perdedores: sólo festejar.

**Por qué rinde:** multiplica las fotos subidas, que es lo que después alimenta el
álbum, el video del recuerdo y las redes.

## 5. Un mensaje para los quince años de la hija, dentro de diez

**Cuánto cuesta: medio.**

El buzón de deseos ya existe. Esto es darle sentido en el tiempo.

**Qué hacer:** que el invitado pueda grabar un saludo corto marcado como *"abrir
dentro de X años"*. AK guarda el enlace y lo manda en la fecha. Para un
casamiento o unos quince, es emocionante y no lo hace nadie en Salto.

**Por qué rinde:** es un extra que se cobra y que no cuesta nada producir. Y a los
diez años, AK vuelve a aparecer en la vida de esa familia.

## 6. Que el invitado elija la música desde el celular

**Cuánto cuesta: medio.** El guion del DJ ya existe.

**Qué hacer:** un enlace donde los invitados piden temas, y el DJ ve la lista
ordenada por cuántos la pidieron. El DJ elige, no la máquina.

**Por qué rinde:** el invitado siente que la fiesta es suya, y el DJ deja de
adivinar.

---

# LO QUE LE AHORRA TIEMPO AL EQUIPO

## 7. La lista de compras que se cierra sola con el proveedor

**Cuánto cuesta: medio.**

La lista de compras ya existe y ya se agrupa por proveedor. Falta el último paso:
el pedido armado, en un mensaje listo para mandar por WhatsApp a cada proveedor,
con lo que le toca a él y nada más.

**Por qué rinde:** hoy alguien copia esa lista a mano, y ahí es donde se pierden
cosas.

## 8. Avisar antes de que se haga tarde

**Cuánto cuesta: poco.**

Ya hay alertas y recordatorios de cobro. Falta el aviso preventivo del evento:
*"faltan 10 días y todavía no está el menú cerrado"*, *"faltan 5 días y falta un
mozo"*.

**Por qué rinde:** el problema aparece cuando todavía se puede arreglar, no la
semana de la fiesta.

---

# MARKETING E INTELIGENCIA ARTIFICIAL

## 9. Publicar en las redes de verdad, no copiar y pegar

**Cuánto cuesta: alto**, y depende de trámites con Meta, no de programar.

El planificador ya escribe el contenido con inteligencia artificial. Después
**hay que copiarlo y pegarlo a mano**. Automatizarlo requiere credenciales
comerciales de Meta y una cuenta de empresa.

**Recomendación honesta:** esto **no** lo haría ahora. Es el que más trámite tiene
y el que menos plata trae comparado con los primeros tres.

## 10. Las fotos de la fiesta se convierten solas en material para redes

**Cuánto cuesta: medio.**

Al día siguiente de cada fiesta hay decenas de fotos aprobadas. Que la app arme
sola tres o cuatro posteos listos —foto elegida, texto escrito, etiquetas— y los
deje en el planificador para aprobar con un toque.

**Por qué rinde:** el contenido es el trabajo más caro de sostener, y AK genera
material todos los fines de semana sin usarlo.

## 11. Presupuesto que se explica solo cuando el cliente lo abre

**Cuánto cuesta: poco.**

El cliente abre el presupuesto y ve una lista con precios. No ve **por qué** ese
precio. Un párrafo corto, escrito con inteligencia artificial a partir de lo que
está contratado: *"Para 80 personas en el Club Uruguay incluimos X, Y y Z; el
salón ya viene con la limpieza"*.

**Por qué rinde:** el presupuesto que se entiende se compara mejor con el del que
cobra más barato y da menos.

---

# LO QUE YO HARÍA, EN ESTE ORDEN

1. **El puente de la fotocabina al simulador** (idea 1). Es el más barato y el que
   más puede traer.
2. **Saber de qué fiesta viene cada cliente** (idea 2). Sin esto se sigue gastando
   a ciegas.
3. **El álbum que el cliente reparte** (idea 3).

Con esas tres, cada fiesta que AK hace **trabaja para vender la próxima**. Es lo
que hoy no pasa: hoy la fiesta termina y se apaga.

El resto son buenas ideas, pero se hacen después y de a una.

**Nada de esto está empezado.** Cuando elijas, se escribe la orden y se hace.
