# Acá quedé

Hoja de traspaso entre chats. **Corta a propósito**: se lee entera al abrir cada
sesión. Lo histórico va a `ESTADO-AUDITORIA.md`.

Quien cierre una sesión reescribe este archivo. Se pisa, no se acumula.

---

**Última actualización:** 20 de agosto de 2026, cierre del día.
**Estado de la app:** sana. Acentos limpios, tipos en cero, 304 archivos de prueba
con 1988 pruebas en verde, compila, seguridad de la base en verde.
**Propuestas abiertas:** ninguna.
**Siguiente orden en la fila:** `docs/ordenes/4-la-auditoria-que-corre-sola.md`.
Antes está `docs/ordenes/2-despues-de-los-comentarios.md` si no se entregó.

## Lo que hay que recordar de hoy

**La entrega de la orden 3 pasaba los cinco controles de salud y traía cuatro cosas
rotas igual.** Compilaba, tipos en cero, pruebas en verde. Aparecieron sólo al
preguntar otra cosa: **¿qué pasa si dos personas del equipo tienen la aplicación
abierta al mismo tiempo?**

Un posteo salía dos veces en el Instagram y el Facebook de la empresa. La nota del
blog se generaba dos veces y se pagaba dos veces. El disparo lo hacía cualquiera del
equipo cuando antes pedía administrador. Y el código prometía con mayúsculas que
nunca se le escribe solo al cliente, cuando sí lo hacía. Los cuatro arreglados, con
pruebas que los congelan.

> **Pregunta fija para toda revisión de ahora en más:** cuando algo pasa de correr en
> un solo lugar a correr en el navegador de cada uno, no alcanza con "¿funciona?".
> Hay que preguntar **"¿qué pasa si dos lo hacen a la vez?"**.

## Lo otro que se cerró hoy

- **Fugas de datos en pantallas abiertas sin cuenta.** La más grave: el permiso para
  publicar en el Facebook y el Instagram de AK viajaba al celular de cada invitado.
  También salía la lista completa de fiestas, la receta y el margen de cada plato, el
  contacto del gerente de cada salón y la cédula de cada empleado.
- **Los robots se cortan en la puerta** (`/wp-admin`, `/.env` y compañía), con una
  prueba que además cuida que ninguna pantalla real quede bloqueada.
- **Los dos chats de inteligencia artificial tienen tope**, así que un robot no puede
  vaciar la cuenta preguntando toda la noche.

## Velocidad: ya está medido, no medirlo de nuevo

Cada pantalla contesta entre **5 y 25 milésimas de segundo**. La app no es lenta. Lo
que se siente lento es el servidor arrancando después de un rato sin visitas, y **eso
queda así por decisión del dueño**: dejarlo despierto se paga todos los meses. Está
en la lista de decisiones cerradas de `CLAUDE.md`.

Dato que hace que la decisión sea barata: la portada y todas las páginas de venta
**ya salen armadas de antes**, así que el prospecto que llega desde Google no espera.
El que espera es el invitado o el equipo, y sólo si nadie tocó la app en todo el día.

## Lo que depende del dueño

1. **Prender los cuatro despertadores externos**, con el paso a paso sin jerga en
   `docs/PRENDER-LAS-TAREAS.md`. Destraba tres tareas de una.
2. **Pedir una reseña por fiesta**, a todos por igual y sin premio.
3. Anotarse en los directorios gratis.

## Decisiones del dueño que NO se vuelven a preguntar

Están todas en `CLAUDE.md`. Las de hoy: **no se toca nada que aumente lo que cobra
Firebase**, y **el video de vida no lo toca la app**.
