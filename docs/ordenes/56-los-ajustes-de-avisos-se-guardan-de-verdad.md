# Orden 56 — Los ajustes de avisos se guardan de verdad

**Para Gemini. Una sola propuesta.**

## Qué pasa hoy, y es una pantalla de mentira

`src/app/(app)/settings/notifications/page.tsx`, línea ~39:

```ts
async function saveNotificationPreferences(prefs: NotificationPreferences): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 1000));
  if (typeof window !== 'undefined') {
    localStorage.setItem('notification_prefs', JSON.stringify(prefs));
  }
}
```

Eso hace tres cosas, y ninguna es guardar:

1. **Espera un segundo a propósito** para que parezca que está guardando en algún lado.
2. **Escribe en el navegador de quien lo tocó.** Desde otra computadora, o borrando los datos
   del navegador, los ajustes vuelven a como estaban.
3. **No cambia qué avisos manda la app.** El que apaga "avisarme por mail de los pagos"
   los sigue recibiendo.

Es exactamente lo que la app persigue: un control en pantalla que no cambia nada es peor que
no tenerlo, porque el que lo usa cree que hizo algo.

## Qué hacer

Guardar las preferencias **del lado del servidor, por usuario**, y que quien manda los avisos
las lea antes de mandar.

- La acción de guardar y la de leer van en `src/app/actions/`, junto a las demás, y **piden
  sesión** con `requireAppSession` como hacen sus vecinas. Mirá
  `src/app/actions/contenido-publico.ts` como modelo: valida lo que recibe, devuelve
  `{ success: boolean }`, y la pantalla mira ese resultado.
- La pantalla ya usa el autoguardado con su cartelito de estado y **ya mira el resultado**: no
  hay que tocar esa parte, sólo cambiar el guardado falso por el de verdad.
- Al abrir la pantalla, las preferencias se leen del servidor, no del navegador. Si alguien
  tiene ajustes viejos guardados en su navegador, se usan una sola vez para no perderlos y
  después se guardan en el servidor.

**Y lo que le da sentido a todo:** el que manda los avisos tiene que **respetarlas**. Antes de
mandar un aviso por mail o dentro de la app, se mira si esa persona lo quiere. Un ajuste que
se guarda y nadie lee es el mismo problema con otra cara.

**Qué NO tocar:** el diseño de la pantalla, los grupos de avisos que ya están y el cartelito
de guardado. Andan.

**Qué tiene que comprobar la prueba, y es lo único que vale:** que **apagar un aviso hace que
no se mande**. Que la preferencia se guarde no alcanza: si el que manda no la mira, el cliente
recibe el mail igual. La prueba apaga un tipo de aviso, dispara el envío y comprueba que **no
salió**.

```comprobar
usa: requireAppSession en src/app/actions/preferencias-avisos.ts
usa: leerPreferenciasDeAvisos en src/app/(app)/settings/notifications/page.tsx
prueba: src/__tests__/los-avisos-respetan-lo-que-se-apago.test.ts
```
