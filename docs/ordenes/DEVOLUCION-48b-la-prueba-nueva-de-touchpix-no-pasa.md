# Devolución — La prueba nueva de Touchpix no pasa (ENT-03)

**Para Gemini. Todo lo demás de tu entrega entró: el salón 3D del cliente, el armado
automático, las cinco piezas nuevas y —lo más importante— el botón de Vista 3D, que ahora
SÍ abre el 3D. Esa prueba pasa en verde.**

Lo único que queda es la prueba que trajiste vos:
`tests/e2e/48-touchpix-entrega-sin-reinicio.spec.ts`, la de "sesión segura: la subida lenta de
A no pisa la sesión de B".

## Medido dos veces, el 20 de septiembre de 2026

- **En tanda y corriendo sola, falla igual.** No es la máquina cargada.
- Busca `button[aria-label="Sacar foto"]`, que **existe** en
  `src/app/evento/touchpix/[fiestaId]/page.tsx:1672`.
- Lo que muestra la pantalla en su lugar es:
  **"Experiencia no disponible — La validacion del evento demoro demasiado. Intenta
  nuevamente."**

## Qué hay que mirar, en este orden

1. **Por qué la validación del evento no termina a tiempo** con la fiesta de prueba. Eso es lo
   que decide si el defecto es de la estación o del permiso que arma la prueba
   (`crearPermisoDeEstacion`, en `tests/e2e/helpers/fiesta-de-prueba.ts`).
2. Si es la prueba: que espere a que la estación valide antes de buscar el botón, y **que falle
   diciendo "la estación no validó el evento"**, no "no encuentro el botón". Con el mensaje
   equivocado se buscan horas del lado que no es.
3. Si es la estación: que un invitado no se quede con **"Experiencia no disponible"** por una
   demora; que reintente sola y recién después avise.

**No toques** lo que ya quedó bien: el apagado del cartel por sesión
(`currentPhotoSessionIdRef`) está correcto y es lo que pedía la devolución 48.

```comprobar
archivo: tests/e2e/48-touchpix-entrega-sin-reinicio.spec.ts
prueba: tests/e2e/48-touchpix-entrega-sin-reinicio.spec.ts
```


---

## Al dia 21 de septiembre de 2026: lo encontre yo, y queda un solo paso

**Eran dos cosas del freno de la prueba, no de la app**, y las dos estan arregladas:

1. La prueba frenaba **todos** los pedidos POST de la pantalla desde antes de abrirla. Esa
   pantalla usa POST a su misma direccion para **tres** cosas: validar el evento al abrir,
   avisar en que anda la estacion, y subir la foto. Al frenar la validacion, la estacion
   mostraba *"La validacion del evento demoro demasiado"*.
2. Frenando todo despues de abrir, se comia el aviso de "sacando foto" y la captura nunca
   aparecia.

Ahora el freno se pone despues de abrir y **solo sobre la subida** (se reconoce por el peso:
una foto pesa, los avisos son dos renglones). **Con eso pasa en celular.**

**Lo que queda, y es tuyo:** en pantalla de computadora, despues de tocar "Sacar foto", **no
aparece el boton de publicar** (`Publicar al muro` / `Guardar foto`, linea ~1537 de
`src/app/evento/touchpix/[fiestaId]/page.tsx`). En celular aparece y la prueba pasa. Medido
tres veces, sola y en tanda.

Averigua **por que la captura no termina de mostrarse en pantalla grande**: puede ser la
pantalla o puede ser la prueba, pero hay que medirlo antes de tocar. Si al final resulta que la
captura si funciona y lo que falla es el selector, la prueba tiene que **fallar diciendo que la
captura no aparecio**, no "no encuentro el boton".
