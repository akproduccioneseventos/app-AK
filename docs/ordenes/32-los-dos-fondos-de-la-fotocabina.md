# Orden 32 — Los DOS fondos de la fotocabina, y el que falta es el importante

**Para Gemini. Escrita el 1 de septiembre de 2026.**

> **Lo preguntó el dueño y destapó un problema:** *"debo poder cambiar el fondo que aparece en la
> pantalla, y adentro está la pantalla de la cámara... lo de atrás no sé cómo sería, eso es
> físico"*.

## Primero, la distinción, porque se estaban mezclando

**Son dos fondos distintos y ninguno de los dos está bien hoy:**

1. **El fondo de la PANTALLA**: la decoración alrededor de la cámara, en el monitor de la
   fotocabina. Es lo que ve la gente mientras espera su turno. **HOY NO SE PUEDE CAMBIAR.**
2. **El fondo de la FOTO**: lo que aparece detrás de la persona **en la imagen que se lleva**. El
   salón no cambia: se recorta a la persona y se le pone otro fondo en la foto, como en una
   videollamada. **HOY SÓLO FUNCIONA CON TELÓN VERDE.**

---


---

## BLOQUE 0 — EL CROMA ESTÁ A MEDIO CONECTAR Y SALE UNA MANCHA NEGRA  ← ARRANCÁ POR ACÁ

**Verificado abriendo el código.** Es un defecto que arruina la primera fiesta que lo use:

- La fotocabina llama a `aplicarChromaKey(ctx, ancho, alto)` cuando el ajuste está prendido
  (`src/app/evento/fotocabina/[fiestaId]/page.tsx:356`).
- Esa función **borra el verde y lo deja transparente**
  (`segmentacion-fondo.ts:58`, `data[i + 3] = 0`).
- **Nadie dibuja el fondo nuevo detrás.** Y la foto se guarda como JPEG, que **no admite
  transparencia**: el hueco sale **NEGRO**.

**Resultado hoy:** se cuelga la tela verde, se prende el croma, y el invitado se lleva una foto
con **una mancha negra atrás**.

**Y la función que sí sabe hacerlo bien —`procesarFondoCanvas`— está escrita y NO LA LLAMA
NADIE** en la fotocabina.

**Qué hacer:**

1. **Que la fotocabina use `procesarFondoCanvas`**, que dibuja primero el fondo nuevo y después
   la persona. Es la que ya está hecha.
2. **Que haya de dónde elegir el fondo.** Hoy **no existe ninguna pantalla** para cargarlos ni
   para que el invitado elija: el ajuste prende el croma y nada más.
3. **Si el croma está prendido y no hay ningún fondo cargado, que el croma NO se aplique.**
   Mejor la foto con la tela verde de fondo que con una mancha negra.

**La prueba:** con el croma prendido y un fondo cargado, **la imagen final no tiene ningún píxel
negro donde estaba el verde**. Es lo único que hay que comprobar, y es lo que hoy falla.


## BLOQUE 1 — EL CAMBIO DE FONDO SIN TELÓN NO ESTÁ HECHO  ← LO MÁS IMPORTANTE

**Se dio por hecho y no lo está.** Verificado en `src/lib/entretenimiento/segmentacion-fondo.ts`:

- Lo que hay es **`aplicarChromaKey`**: recorta **por color verde**, con tolerancia. **Necesita
  la tela colgada.**
- **No hay ningún modelo de reconocimiento de personas.** Cero menciones de MediaPipe,
  TensorFlow o BodyPix, ni en el código ni en las dependencias.
- El **"desenfoque"** que agregaste **desenfoca toda la imagen, incluida la cara** (línea ~92:
  se dibuja el video con `blur` y después el mismo video encima). No es el efecto de fondo
  desenfocado: es una foto borrosa.

**Lo que falta, y es lo que vale:** que funcione **sin colgar nada**. Es la función que venden
Simple Booth y dslrBooth, y la que hace que la estación se pueda poner en cualquier rincón del
salón.

**Cómo se hace, sin pagar por mes:** **MediaPipe Selfie Segmentation** o el equivalente de
TensorFlow.js, **corriendo en la máquina**. El modelo se descarga con la app. **Si la única forma
que encontrás cuesta plata por mes, PARÁ Y AVISÁ.**

**Y que elija sola:** si detecta un fondo de color parejo, usa el telón (sale mejor y más
rápido); si no, usa el reconocimiento. **El operador no configura nada.**

**Si la máquina no da** —se traba o baja de 15 cuadros por segundo—, se apaga solo y la estación
sigue andando como hoy. **Nunca dejarla colgada por esto.**

### Y arreglá el desenfoque

Que desenfoque **el fondo y no la persona**. Si no se puede sin el reconocimiento del punto
anterior, **que la opción no aparezca** hasta que esté: una foto toda borrosa no la quiere nadie.

**La prueba:** que con un fondo cargado y **sin telón verde**, la imagen final sea **distinta**
de la de sin fondo. Con telón ya funciona; lo que hay que comprobar es lo otro.

---

## BLOQUE 2 — El fondo de la PANTALLA, que no se puede cambiar

Hoy la fotocabina se ve igual en toda fiesta: fondo oscuro y punto.

- **Que use el fondo que el cliente cargó para su fiesta** —el mismo campo que ya existe—, con
  la foto detrás y la cámara adelante.
- **Si no cargó ninguno**, seis u ocho fondos listos que combinen con el color de la fiesta.
- **La cámara y el botón siempre por encima y legibles**: si el fondo es claro, que el texto se
  siga leyendo. **Nunca un fondo que tape lo que hay que tocar.**

Va también en Bogue, Touchpix y el Espejo. **En la 360 no** (la cámara gira).

---

## BLOQUE 3 — Que se entienda cuál es cuál

Al armar la fiesta, hoy dice "fondo" y no se sabe de cuál habla. **Que diga:**

- **"Fondo de la pantalla"** — *"Lo que se ve alrededor de la cámara, mientras esperan su turno."*
- **"Fondo de la foto"** — *"Lo que aparece detrás de la persona en la foto que se lleva. El salón
  no cambia."*

Esa segunda explicación es literal del dueño y hay que dejarla: **la duda de si había que cambiar
algo físico en el salón le pasó a él y le va a pasar a cualquiera.**

---

## LO QUE NO SE TOCA

- **El recorte por telón verde anda**: se le suma el otro camino, no se reemplaza.
- **Los marcos de la fotocabina** andan y están probados.
- **Nada que se pague por mes.**
- **Plata, cobros, comida y permisos: los hace Claude.**

## Cómo se comprueba que esta orden está hecha

```comprobar
usa: selfie_segmentation en package.json
usa: fondoDePantalla en src/app/evento/fotocabina/[fiestaId]/page.tsx
prueba: tests/e2e/el-fondo-sin-telon.spec.ts
```
