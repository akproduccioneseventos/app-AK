# Cómo se audita un módulo (el método que funcionó)

**Pedido del dueño, 31 de agosto de 2026:** *"la idea es auditar como hicimos en estas toda la
app"*.

El 31 de agosto se auditaron cinco módulos con este método —entretenimiento, pantalla gigante,
invitación, red social del evento y decoración— y **en los cinco apareció algo que las
auditorías anteriores no habían visto en meses**. No es teoría: es lo que dio resultado.

## Por qué el método viejo no servía

El método viejo era: mandar un ayudante a leer el código y preguntar *"¿está?"*. Con eso se
dijo **"cero errores"** mientras al invitado no se le pedía permiso para publicar su foto, las
estaciones no arrancaban y la fotocabina salía en negro.

**Todo lo que falló tenía la misma forma: escrito, compilando, con las pruebas en verde, y sin
hacer nada.** Leyendo código eso no se ve.

---

## Los cinco pasos, en este orden

### 1. Mirar afuera primero, no adentro

**Buscar diez o más plataformas del rubro** y anotar qué hacen hoy. No de memoria: buscando,
porque el rubro cambia todos los años.

Sirve para dos cosas, y la segunda importa más: saber qué nos falta, **y saber qué ya tenemos
mejor que ellos**. En la pantalla gigante resultó que **la nuestra le gana a las trece**, y eso
cambió la orden entera: en vez de agregar, había que no romper.

### 2. Medir lo nuestro con archivo y línea

Un ayudante económico hace el inventario del módulo: qué tiene, qué no, con `archivo:línea`.
**Nunca "parece que sí".**

### 3. VERIFICAR cada hallazgo con los propios ojos

**Éste es el paso que no se saltea nunca.** El 31 de agosto, de los avisos de los ayudantes:

- Dijeron que Bogue no leía el texto de marca. **Lo leía.**
- Dijeron que la 360 no ponía marca de agua. **La ponía** (segunda vez que se reporta mal).
- Dijeron que Touchpix no leía el color. **Lo leía.**
- Dijeron que la invitación no mostraba el mapa ni las preguntas. **Las dos cosas andaban.**
- Dijeron que teníamos filtro de belleza. **No: era un estilo llamado "Disco Glam".**

**Seis avisos falsos en un día.** Aplicarlos sin mirar habría tocado seis archivos al pedo, y
peor: le habría hecho rehacer a Gemini cosas que ya andaban.

### 4. ABRIR LA PANTALLA Y MIRARLA

Sin esto, el resto no vale. Se abre en el navegador, se le saca foto y **se mira con ojos
humanos**.

Fue así como aparecieron, el mismo día: **el buzón blanco** que encandila en un salón a oscuras,
**el botón de Touchpix sin nombre**, y que **el texto de marca aparece recién en la pantalla del
QR** y no al abrir. Ninguna de las tres se ve leyendo código.

### 5. Escribir la orden, masticada

Archivo, línea, nombre del campo, qué NO tocar, y **qué tiene que comprobar la prueba**. Si no
se puede escribir con ese detalle, **es que falta investigar**, no que falte trabajo del otro
lado.

Y cerrar con las tres listas separadas: **lo roto** (se arregla), **lo incómodo** y **lo feo**
(se anotan, decide el dueño).

---

## Lo que se anota siempre, al final

1. **`docs/LO-AUDITADO.md`**: qué módulo, con qué método y qué día. **Lo que está en nivel 4 o
   más no se vuelve a auditar.**
2. **`docs/YA-RESUELTO.md`**: lo arreglado **y los avisos falsos**, para que la próxima
   auditoría no los reporte de nuevo.
3. **Una prueba que mire el resultado**, no que el campo exista.

---

## La cola: qué módulos faltan

Cinco hechos, y el resto en este orden. **Primero lo que toca plata y lo que ve el cliente.**

| # | Módulo | Quién | Estado |
|---|---|---|---|
| 1 | Entretenimiento (6 estaciones) | Claude | **HECHO** — orden 20 |
| 2 | Pantalla gigante | Claude | **HECHO** — orden 22 |
| 3 | Invitación digital | Claude | **HECHO** — orden 23 |
| 4 | Red social del evento | Claude | **HECHO** — orden 23 |
| 5 | Decoración | Claude | **HECHO** — orden 24 |
| 6 | **Presupuestos y ventas** | **Claude** | pendiente — **es plata: no se delega** |
| 7 | **Cobros, cuotas y facturas** | **Claude** | pendiente — **es plata** |
| 8 | **Comida, menús y lista de compras** | **Claude** | pendiente — **es comida** |
| 9 | **Permisos: quién ve qué** | **Claude** | pendiente — **es permisos** |
| 10 | Invitados y confirmaciones | Gemini | pendiente |
| 11 | Portal del cliente | Gemini | pendiente |
| 12 | Música y DJ | Gemini | pendiente |
| 13 | Personal y proveedores | Gemini | pendiente |
| 14 | Logística y armado del salón | Gemini | pendiente |
| 15 | Marketing y redes | Gemini | pendiente |
| 16 | Configuración de la empresa | Gemini | pendiente |

**Uno por vez y terminado.** Un módulo a medias es una deuda que no salda nadie.

**Y la regla que manda sobre todo esto:** el dueño pidió esta auditoría. **No se abre trabajo
por gusto propio**: lo que anda y se ve bien **no es un hallazgo**.
