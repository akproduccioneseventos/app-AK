# 49 - Que ninguna pantalla diga "listo" sin haberlo hecho

**Para Gemini.** Fecha: 8 de septiembre de 2026.

## Por que existe

El 8 de septiembre aparecieron cinco defectos con la misma forma: se llama a algo que
**devuelve** el error en vez de tirarlo, nadie mira el resultado, y la pantalla contesta que
salio bien. Un cobro que desaparecia, una cuota anunciada como cobrada sin guardarse, un
contrato firmado que no quedaba registrado.

**Lo que toca plata, cobros, comida, permisos y prospectos ya lo arreglo Claude.** Queda el
resto, y es lo de esta orden.

## Que hay que hacer

Corre `npm run "dice-que-si?"`. Te da la lista completa, con archivo y linea. Hoy son **108**,
y estan escritos en `docs/donde-se-tira-el-error.md`.

Para cada uno, **una de dos cosas, nunca otra**:

**a) Si el resultado importa** -si al fallar el usuario ve algo que no es cierto, o se pierde
un dato-: guardalo y miralo. Si fallo, la funcion devuelve `{ success: false, error }` con un
mensaje en criollo que diga que no quedo guardado, y la pantalla lo muestra. **Nunca contestar
que si.**

```ts
const guardado = await updateDecoracion(fiestaId, datos);
if (!guardado.success) {
  return { success: false, error: guardado.error || 'No se pudo guardar la decoracion.' };
}
```

**b) Si de verdad no importa** -un aviso secundario, algo que se reintenta solo-: dejalo dicho
en la linea de arriba, con el motivo:

```ts
// no-mira-el-resultado: es un aviso al panel; la foto ya quedo guardada
await avisarALaPantalla(...);
```

**El motivo se escribe pensandolo.** Poner el comentario para que el control se calle es
exactamente lo que esta prohibido.

## Por donde empezar, en este orden

1. `src/app/actions/fiesta/` (58) — es lo que arma la fiesta: decoracion, costos, documentos,
   video de vida. Si algo no se guarda, el equipo trabaja con datos viejos en la fiesta.
2. `src/app/actions/multiagent.ts` (12) y `src/app/actions/whatsapp.ts` (3) — mensajes
   preparados que pueden quedar sin preparar.
3. `src/app/portal/` y `src/app/(app)/` — lo que ve el cliente y el equipo.

## Lo que NO hay que tocar

- Nada de `src/app/actions/invoices.ts`, `presupuestos.ts`, `payment-plans.ts`,
  `price-adjustments.ts`, `insumos.ts` ni `dashboard.ts`: ya esta hecho.
- Las lineas que ya tienen `// no-mira-el-resultado:` puestas.

## Como se sabe que esta hecha

El numero de `npm run "dice-que-si?"` tiene que **bajar**, y el trinquete guarda el numero
nuevo. No hace falta llegar a cero de una: cada tanda que baje, sirve. **Lo que no puede es
crecer**, y de eso se encarga la puerta sola.

```comprobar
archivo: docs/donde-se-tira-el-error.md
usa: llamadasQueTiranElError en scripts/lo-que-se-dijo-es-lo-que-es.mjs
prueba: src/__tests__/los-documentos-no-se-dan-por-guardados.test.ts
```
