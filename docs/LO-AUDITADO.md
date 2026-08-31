# Lo auditado, y CÓMO

**Idea del dueño, 31 de agosto de 2026.** Sus palabras: *"debería haber una lista interna de lo
auditado y de qué forma, para ir descontando; y si volvemos a ver otro método, se sabe cómo se
auditó antes."*

## Por qué existe

Hoy el número de la deuda —**255**— no dice **cómo** se contó. Entonces cuando baja, nadie sabe
si bajó porque se arregló algo o porque se midió distinto. Y cuando aparece un método mejor, se
vuelve a auditar TODO desde cero, incluso lo que ya se había mirado bien.

**Esta lista arregla las dos cosas:** dice qué se auditó, con qué método y qué día. Lo que ya
está mirado **con el método más fuerte se descuenta** y no se vuelve a mirar.

## Los métodos, del más flojo al más fuerte

Están ordenados a propósito. **Un método más fuerte reemplaza a uno más flojo; al revés no.**

| # | Método | Qué prueba | Qué NO ve |
|---|---|---|---|
| 1 | **Leído por un ayudante** | Que el código exista y parezca correcto | **Casi todo lo que falló este año.** No ve si funciona |
| 2 | **Revisor de tipos y compilación** | Que encaje y se pueda publicar | No ve si hace algo |
| 3 | **Prueba de las de siempre** (jest) | Que una función devuelva lo esperado | No ve la pantalla |
| 4 | **Prueba de navegador que abre la pantalla** | Que dibuje, que tenga botones, que no muestre basura | No ve si el ajuste se respeta |
| 5 | **Prueba de navegador que comprueba el RESULTADO** | Que lo que se configura **se vea**, que la captura salga | — |
| 6 | **Mirado en pantalla por una persona** (foto de pantalla) | Cómo se ve de verdad: colores, tamaños, si encandila | No corre solo |

**El piso para dar algo por auditado es el 4.** Del 1 al 3 no alcanzan: todo lo que se nos
escapó este año estaba en verde en los tres.

## La lista

Se actualiza **en la misma propuesta que audita algo**. Una línea por pantalla o módulo.

| Qué | Método | Cuándo | Quién | Qué se encontró |
|---|---|---|---|---|
| `/evento/fotocabina/[fiestaId]` | **5 + 6** | 31/08/2026 | Claude | Sana. Saca la tanda y arma la tira. Es la mejor de las seis |
| `/evento/plataforma-360/[fiestaId]` | **5 + 6** | 31/08/2026 | Claude | Muestra el texto de marca. **No usa el color de la fiesta** |
| `/evento/bogue/[fiestaId]` | **5 + 6** | 31/08/2026 | Claude | Muestra el texto de marca. Sana |
| `/evento/espejo-magico/[fiestaId]` | **4 + 6** | 31/08/2026 | Claude | Sana. Tiene accesorios arrastrables y firma. **Falta comprobar el texto de marca** |
| `/evento/touchpix/[fiestaId]` | **4 + 6** | 31/08/2026 | Claude | Sana. **Sin comprobar** que muestre la marca en la ventanita del QR |
| `/evento/buzon/[fiestaId]` | **4 + 6** | 31/08/2026 | Claude | Anda. **Es la única pantalla blanca**: encandila en un salón a oscuras |
| Consentimiento del invitado | **5** | 30/08/2026 | Claude | Se arregló: antes el ajuste se tiraba a la basura |
| Instalar una estación sola | **5** | 30/08/2026 | Claude | Anda. Queda instalada y se elige la fiesta al entrar |
| `/evento/album`, `/evento/dj`, `/evento/galeria`, `/evento/muro-en-vivo`, `/evento/totem`, `/evento/video-vida`, `/evento/zona-digital` | **1** | 31/08/2026 | ayudante | Sin hallazgos. **Método flojo: hay que subirlas al 4** |
| Tablero del operador | **1** | 31/08/2026 | ayudante | Anda. No se refresca solo y no se puede apagar una estación |
| Plata, cobros, comida y permisos | **3** | agosto 2026 | Claude | Sin hallazgos |

## Cómo se descuenta

**Lo que está en la lista con método 4 o más no se vuelve a auditar** salvo que se lo toque.

De las 348 pantallas de la app, **hoy hay 8 auditadas con método 4 o más**. Ese es el número
honesto, y es el que hay que subir.

**Cuando aparezca un método 7**, esta lista dice exactamente qué quedó mirado con el 4, con el 5
y con el 6, así se vuelve a mirar **sólo lo que quedó abajo** en vez de todo.
