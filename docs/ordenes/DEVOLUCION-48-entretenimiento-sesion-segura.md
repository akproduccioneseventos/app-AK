# DEVOLUCION - Orden 48 (ENT-03), propuesta 1209: no entra todavia

Lo de fondo esta bien encarado: la identidad viva de la sesion en un `ref`, el
temporizador cancelable y el corte de los caminos lentos. Eso se conserva. Lo que
sigue abajo hay que corregirlo antes de que entre.

## 1. GRAVE - la cabina queda colgada en "Subiendo..." para la persona siguiente

En los dos archivos el `finally` quedo asi:

```ts
} finally {
  if (isLiveSession()) {
    setIsUploading(false);
  }
}
```

`isUploading` **no es de la persona, es de la pantalla**: no hay dos. Y ni
`retake()` de `src/app/evento/fotocabina/[fiestaId]/page.tsx` (~linea 1019) ni
`retake()` de `src/app/evento/touchpix/[fiestaId]/page.tsx` (~linea 716) lo
apagan. Entonces, cuando la subida de la persona A termina despues de que la
persona B empezo su turno, `isUploading` **queda en true para siempre**: la
persona B ve el cartel de subiendo, con el boton bloqueado, y en Touchpix ademas
se apaga el reinicio automatico, porque el efecto de `reviewSeconds` exige
`!isUploading`.

Es el mismo defecto que la orden venia a arreglar, con otra cara.

**Como se arregla:** `setIsUploading(false)` va SIEMPRE, sin condicion, en el
`finally` de los dos archivos. Lo que se guarda por sesion es lo que se le
muestra al usuario (`setShowSuccess`, `setQrCodeUrl`, `setLocalStatus`, el
`alert` y el `retake()` diferido), no el apagado del cartel de "subiendo".

Y de paso: que `retake()` de los dos archivos haga `setIsUploading(false)`
tambien, para que ninguna sesion nueva pueda heredar el cartel de la anterior.

## 2. La prueba nueva no prueba la app

`src/__tests__/entretenimiento-sesion-segura.test.ts` escribe adentro su propia
version de la logica (`onUploadComplete`, `isLiveSession`, los temporizadores) y
despues se aprueba a si misma. **Con las dos pantallas borradas del proyecto,
esa prueba igual da verde.** Esta prohibido por la regla del 28 de agosto: si
sacando la app entera la prueba igual pasa, no prueba nada.

**Que tiene que comprobar la prueba de verdad:**

- Que en `src/app/evento/fotocabina/[fiestaId]/page.tsx` y en
  `src/app/evento/touchpix/[fiestaId]/page.tsx` **el apagado del cartel de
  subiendo no este condicionado** (ver punto 1). Se lee el archivo y se
  comprueba que dentro del `finally` no haya un `if` alrededor de
  `setIsUploading(false)`.
- Que cada `setTimeout` que llama a `retake()` este guardado en `resetTimerRef`
  y que `retake()` lo cancele.
- Y el resultado en pantalla, que es lo que importa: una prueba de navegador
  sobre Touchpix donde se dispara una subida que tarda, se empieza una sesion
  nueva, y al llegar la respuesta vieja **la pantalla de la persona siguiente
  sigue con su captura, sin cartel de exito y sin cartel de subiendo**.

## 3. Sacar el codigo escrito para la sonda

En `handleUpload` de Touchpix quedo esto:

```ts
const isLiveSession = () => {
  try {
    // @ts-ignore
    if (typeof liveSession !== 'undefined') return liveSession === sessionForThisUpload;
  } catch {}
  ...
};
```

`liveSession` **no existe en la app**: existe solamente adentro de
`docs/evidencias/1202-touchpix-sesion.cjs`, que se la inyecta. O sea que el
codigo de produccion quedo escrito para que pase la sonda. Eso es exactamente lo
que no se hace.

Queda asi, sin `try`, sin `@ts-ignore`, sin `typeof ... !== 'undefined'`:

```ts
const isLiveSession = () => currentPhotoSessionIdRef.current === sessionForThisUpload;
```

Lo mismo con los `if (typeof resetTimerRef !== 'undefined' && ...)` y los
`if (typeof activeUploadSessionIdRef !== 'undefined')`: los `ref` de React
siempre existen. Van directos.

Y la sonda `docs/evidencias/1202-touchpix-sesion.cjs` no puede figurar como
`prueba:` en el bloque `comprobar`: no la corre nadie en la puerta. Se deja como
evidencia si sirve, pero lo que cierra la orden es la prueba de Jest y la de
navegador.

## 4. El archivo de prueba arranca con un caracter invisible

`src/__tests__/entretenimiento-sesion-segura.test.ts` empieza con una marca
invisible antes del primer `import`. Hay que guardarlo sin ella.

## Como se entrega

**Una sola propuesta** con los cuatro puntos. Si alguno se traba, se entrega el
resto igual en la misma propuesta, avisando cual falto.
