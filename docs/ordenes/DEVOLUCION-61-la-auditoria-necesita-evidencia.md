# DEVOLUCIÓN — Orden 61: la auditoría, así, no entra

Gracias por pasarla rápido. Pero **no la puedo tomar**, y el motivo no es formal: **marcó como
limpia el área donde está el único defecto conocido de entretenimiento**, que además te
devolví yo mismo hace unas horas.

## El ejemplo concreto, para que se vea el problema

Tu informe dice, sobre entretenimiento:

> *"El apagado de subida y el aviso de guardado offline quedaron atados a su propia sesión
> (`isLiveSession`), `retake()` limpia el estado heredado para el que llega"*

Lo busqué en las dos versiones que existen hoy:

- **En lo publicado** (`main`, hoy): en `src/app/evento/touchpix/[fiestaId]/page.tsx` **la
  palabra `isLiveSession` no aparece ni una vez**, y `retake()` no toca `setIsUploading`. Nada
  de eso existe.
- **En tu propuesta 1209** (sin fusionar, commit `f6b619a`): `isLiveSession` sí existe, pero
  **`retake()` NO limpia `isUploading`** —línea ~716— y el `finally` sigue con
  `if (isLiveSession()) setIsUploading(false)` —línea ~935—. Es exactamente el defecto de la
  devolución 48: **la cabina le queda trabada en "Subiendo…" a la persona siguiente.**

Así que el área que diste por limpia es la que tiene el defecto abierto. **Una auditoría que
aprueba lo que está roto es peor que no auditar**: da tranquilidad falsa y se publica con el
error adentro.

## Qué le falta a la auditoría para que valga

Cada "limpia" tiene que poder comprobarse sin creerte. Tres cosas, y son cortas:

1. **Contra qué versión miraste.** No es lo mismo lo publicado que tu propuesta sin fusionar.
   Escribilo arriba: *"mirado sobre `main`, commit tal"*.
2. **Qué miraste, con archivo y línea.** Por cada área y por cada pregunta que la aplique:
   *"pregunta 9 en la cola offline: `src/lib/...` línea 120, el resultado distingue completo de
   parcial"*. Si una pregunta **no aplica** a un área, decilo: *"pregunta 5, no aplica"*.
3. **Qué encontraste, aunque sea chico.** Un área entera limpia es posible; **las cinco
   limpias, después de que Codex encontrara veinte defectos ciertos en dos semanas, no es
   creíble sin evidencia.**

## Y el orden importa

**Primero terminá el arreglo de la devolución 48** —el `finally` sin condición no alcanza, hay
que hacer lo que dice ahí: cada operación toca sólo lo suyo y el turno nuevo limpia lo
heredado— y **después** volvé a pasar la auditoría. Si no, estás auditando código que ya sabés
que está mal.

## Cómo se entrega

**Una sola propuesta.** El arreglo de la 48 con su prueba, y la auditoría corregida en un
archivo de texto con la evidencia de arriba. Si un área te da limpia de verdad, con la
evidencia escrita **vale como trabajo hecho** y no se vuelve a mirar.
