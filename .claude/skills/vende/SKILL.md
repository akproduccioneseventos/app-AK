---
name: vende
description: Mira cualquier pantalla, texto o pantalla nueva de la app con ojo de vendedor, no de programador. Usala cuando el dueño pida revisar si algo "vende", mejorar textos que ve el cliente, entender por qué se pierden presupuestos, o antes de dar por terminada cualquier pantalla que vea un cliente o un invitado. También cuando pida material de venta.
---

# Vende

**Regla del dueño: toda la app vende.** No hay pantallas "internas" y pantallas
"comerciales". El invitado que usa la fotocabina es el cliente de la fiesta del
año que viene. El proveedor que recibe un PDF prolijo recomienda. La pantalla que
el equipo usa adelante del cliente también vende.

Por eso esta habilidad no se aplica sólo al módulo comercial: se aplica a
cualquier cosa que se toque.

## Antes de opinar

1. Leé `docs/YA-RESUELTO.md`. Si algo figura ahí, está decidido y no se discute.
   En particular son **decisiones de marketing del dueño, no errores**: el ajuste
   anual del 15%, el descuento del 50% del Salón Club Uruguay y el descuento del
   presupuesto.
2. Orientate con `graphify query` antes de leer archivos.
3. Escribí siempre en castellano rioplatense simple. El dueño no es programador:
   nada de jerga sin traducir.

## Las cuatro preguntas

Aplicalas a cualquier pantalla, texto o funcionalidad. En ese orden.

### 1. ¿Esto hace que el cliente confíe?

La confianza es lo que cierra una fiesta de cien mil pesos. Se pierde con
detalles:

- Un número que no coincide con otro número de otra pantalla. **Es lo que más
  mata una venta**: el cliente deja de creer en todo lo demás.
- Un documento con un hueco sin completar, un acento roto o un texto cortado.
- Un "Error desconocido" o cualquier palabra de programador a la vista.
- Una pantalla que dice que guardó cuando no guardó.

### 2. ¿Se entiende sin que nadie lo explique?

El cliente abre el portal solo, a las once de la noche, desde el celular. No hay
nadie al lado para explicarle.

- ¿El texto dice **qué hacer**, o sólo **qué pasó**? "No hay datos" no sirve:
  "Todavía no cargaste invitados. Empezá por acá" sí.
- ¿Los montos dicen de qué son y hasta cuándo?
- ¿Se entiende qué está contratado y qué es un extra que se puede sumar?

### 3. ¿Da ganas?

Compite con plataformas pagas que se ven muy bien.

- Pantallas vacías con gracia: un ícono, una frase, y el próximo paso. Nunca una
  línea gris sola.
- Jerarquía: **un** botón principal por pantalla, el resto secundarios.
- Que se vea bien en el celular, que es donde se abre.
- Las fotos y los recuerdos son el producto: que se luzcan, no que entren
  apretados en una tarjeta chica.

### 4. ¿Dónde se pierde plata acá?

Buscá el paso donde el cliente abandona o donde AK deja de cobrar:

- Un formulario largo que se pierde si falla el guardado.
- Un pedido de presupuesto que llega sin forma de contactar a la persona.
- Un extra contratable que en ningún lado se ofrece.
- Un cliente que informa un pago y no recibe respuesta.
- Un seguimiento que deja al prospecto sin contactar por días.

## Cómo escribir los textos que ve el cliente

- **Como habla el dueño**, no como escribe un sistema. "Te faltan 20.000 para
  completar la seña", no "Saldo pendiente insuficiente".
- **Decí el próximo paso**, siempre. Un cartel que sólo informa es media ayuda.
- **Los números en pesos uruguayos**, con separador de miles, sin decimales.
- **Nada de mayúsculas gritando** ni signos de exclamación de más.
- **Nunca culpes al cliente.** "No pudimos procesar el pago" antes que "Ingresaste
  mal los datos".

## Qué entregar

Separá siempre en tres, porque se arreglan distinto:

1. **Lo que rompe una venta** — hay que arreglarlo ya.
2. **Lo que enfría** — pasos de más, textos confusos, cosas que no dan ganas.
3. **Lo que se está dejando de vender** — extras que nadie ofrece, momentos donde
   se podría sumar algo.

Para cada punto: **qué ve la persona en pantalla** y **qué cambia para el
negocio**. Nada de rutas de archivo ni jerga en el informe al dueño.

## Y después

- Si el arreglo es de plata, cobros, comida o permisos, **lo programa Claude**.
- Todo lo demás va a una orden en `docs/ordenes/` para Gemini.
- Lo que se cambie se anota en `docs/YA-RESUELTO.md`, con el porqué.
