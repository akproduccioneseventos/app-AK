# Lo que hay que hacer ahora

**Para:** Gemini (Antigravity)
**Escribe:** Claude (auditoría y verificación)
**Fecha:** 13 de agosto de 2026
**Base:** `main` actualizado. Sincronizar antes de empezar.

Ésta es la **única orden vigente**. Reemplaza a `pantallas-de-la-noche.md` y al
bloque de colores de `pendiente-todo.md`. Lo que está en `hechas/` ya se hizo.

**Los cuatro bloques van en UNA SOLA PROPUESTA.** Leé `LEEME.md` de esta carpeta
para las reglas y los controles.

---

# BLOQUE A — La pantalla de impresión miente cuando se corta internet

**El más importante de todos. Empezá por acá.**

`src/app/evento/impresion/[fiestaId]/page.tsx:59-78`

Cuando falla la carga de fotos, muestra un cartel que desaparece a los dos
segundos y **sigue mostrando las fotos viejas de la memoria**. El operador no
tiene forma de saber que está viendo información vieja: sigue imprimiendo
tranquilo mientras las fotos nuevas de los invitados no le llegan nunca. Y eso
pasa en plena fiesta, sin margen para darse cuenta.

**Qué hacer:** copiar el patrón que ya usa la galería
(`evento/galeria/[fiestaId]/page.tsx:30-38`), que mantiene el estado de error y
lo muestra hasta que se recupera. Que el operador vea, de forma **permanente y
visible**, que perdió la conexión y desde cuándo.

# BLOQUE B — La presentación no se recupera sola

`src/app/presentacion-led/page.tsx:173-206` y `641-650`

Si se corta internet muestra "No pudimos cargar la presentación" y **se queda ahí
hasta que alguien apriete Reintentar a mano**. Si el corte dura tres minutos y
nadie está mirando, la pantalla queda muerta mucho más tiempo del necesario.

Las demás pantallas de la noche ya reintentan solas: la pantalla gigante cada 20
segundos, la galería cada 10, el tótem cada 2,5. **Hacé lo mismo acá**, dejando
igual el botón manual.

# BLOQUE C — El tótem avisa muy chiquito

`src/app/evento/totem/[fiestaId]/[totemId]/page.tsx:291-299`

Mientras espera el permiso del salón muestra "Conectando estación..." con una
rueda semitransparente y chica, dentro del mismo botón que el código QR. El
invitado ve el QR, lo escanea y no funciona, sin entender por qué.

**Qué hacer:** que mientras no esté conectado el QR **no se vea como
disponible**, y que el aviso se lea desde lejos. Es una pantalla que se mira
parado y de paso.

# BLOQUE D — Terminar los colores

La escala visual ya está fijada y **no se cambia**: tarjetas `rounded-xl`,
botones y campos `rounded-lg`, y los componentes compartidos usan los colores del
tema.

Falta recorrer las pantallas que todavía tienen colores escritos a mano
(`bg-amber-400`, `text-slate-800`) y pasarlas a los del tema (`bg-primary`,
`text-foreground`, `border-border`). Ya se hicieron a mano las que ve el cliente:
portal principal y sus variantes, confirmación de invitados, muro social,
invitación pública, portal del invitado, contrato, moodboard, configuración de la
fiesta y la bandeja del portal.

- **Pantalla por pantalla, nada de buscar y reemplazar masivo.** Son más de 200 y
  de golpe es imposible de revisar.
- **Anotá hasta dónde llegaste**, para poder retomarlo la próxima.
- Probá en claro y en oscuro antes de dar una pantalla por lista.
- **No toques** los colores que elige el usuario (croquis, decoración, números de
  mesa, invitaciones) ni el fondo blanco de los documentos que se imprimen.

# BLOQUE E — Las promociones se guardan sin fechas

`src/app/(app)/settings/promos/page.tsx:111-127`

Sólo se valida el título. Si se dejan vacías la fecha de inicio y la de fin, la
promoción se guarda igual y **el contador de la web nunca arranca**: queda una
promoción publicada que no cuenta nada.

Que no se pueda guardar sin las dos fechas, y que la de fin no sea anterior a la
de inicio.

---

## Lo que NO se toca nunca

- La validación del token de proveedor (`verifyAccesoPersonalToken`) en
  `fotografia` y `catering`. **Si hay conflicto ahí, quedate siempre con esa
  versión**: ya se reabrió el agujero una vez.
- Los tiempos de la fotocabina: 10 segundos la primera foto, 4 las demás.
- Los topes del contrato: 10% de reducción, 30% de aumento.
- Plata, cobros, comida y permisos: eso lo escribe Claude. Si te cruzás con algo
  de eso, avisá y seguí.

## Cuando termines

Avisá el número de la propuesta, anotá lo hecho en `docs/YA-RESUELTO.md` y **mové
este archivo a `hechas/` en la misma propuesta**.
