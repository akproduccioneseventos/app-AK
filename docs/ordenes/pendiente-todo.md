# Orden única — todo lo que falta

**Para:** Gemini (Antigravity)
**Escribe:** Claude
**Fecha:** 10 de agosto de 2026
**Base:** `main` actualizado. Sincronizar antes de empezar.

Junta en un solo lugar todo lo pendiente. Reemplaza a las órdenes anteriores:
`planificacion-02.md` (bloques A y B), `entretenimiento-03.md` y el bloque A de
`estetica-01.md`. Lo demás de esas órdenes **ya está hecho y fusionado**.

## Reglas que valen para toda esta orden

- **Una propuesta por bloque grande** (A, B, C, D, E). No una por archivo, no
  una por hallazgo. Cada fusión se paga.
- Antes de subir, los cuatro controles sobre el conjunto: `npx tsc --noEmit`,
  `npx jest --silent`, `npm run check:acentos`, `npm run build`. **Si alguno
  falla, no subas.**
- **Guardá en UTF-8** y cuidado con las comillas invertidas: ya rompieron el
  proyecto tres veces.
- Leé `docs/YA-RESUELTO.md` antes de reportar nada y **anotá ahí todo lo que
  modifiques, en la misma propuesta**, con el porqué de cada decisión.
- **No toques**: plata, cobros, comida ni permisos. Si te cruzás con algo de
  eso, avisá y seguí.

### Lo que NO se toca nunca (ya verificado)

- La validación del token de proveedor (`verifyAccesoPersonalToken`) en
  `fotografia` y `catering`. **Si aparece un conflicto ahí, quedate siempre con
  esa versión.** Ya se reabrió el agujero una vez.
- Los tiempos de la fotocabina (10 segundos la primera foto, 4 las otras).
- Los topes del contrato: 10% de reducción, 30% de aumento.
- Los colores que elige el usuario (croquis, decoración, números de mesa,
  invitaciones) y el fondo blanco de los documentos que se imprimen.

---

# BLOQUE A — Terminar los colores

Ya está fijada la escala: tarjetas `rounded-xl`, botones y campos `rounded-lg`,
y los componentes compartidos usan los colores del tema. **No la cambies.**

Falta recorrer el resto de las pantallas pasando los colores escritos a mano
(`bg-amber-400`, `text-slate-800`) a los del tema (`bg-primary`,
`text-foreground`, `border-border`). Se recorrieron ya las que ve el cliente.

- **Pantalla por pantalla, no buscar y reemplazar masivo.** Son 211 y hacerlo de
  golpe es imposible de revisar.
- **Anotá hasta dónde llegaste** para poder retomarlo.
- Probá en claro y en oscuro antes de dar una pantalla por lista.

# BLOQUE B — Pantallas del invitado

`src/app/(app)/fiestas/nueva/`: `buzon`, `regalos`, `pagina-web`, `video-vida`,
`zona-digital`, `barra-tecnologica`, `social-fiesta-pro`.

Es donde el equipo configura lo que después ve el invitado: un error se
multiplica por la cantidad de invitados.

- ¿Se puede ver cómo queda antes de guardar?
- ¿Qué pasa si el cliente no contrató eso? Ninguna pantalla puede romperse ni
  quedar vacía sin explicar.
- Regalos y buzón tocan datos personales: que no se filtre nada.

# BLOQUE C — Lo que se imprime y se entrega

`carteleria`, `carta-tragos`, `numeros-mesa` (hay dos pantallas con ese nombre:
averiguá si son lo mismo, **avisá y no borres**), `resumen-imprimible`,
`carga-operativa/pdf`, `reuniones/imprimir`.

- **Que no se corte.** Probá con 150 invitados, no con tres.
- **Que no salga en blanco sin avisar**: si faltan datos, decir cuáles.
- **Los datos internos no van en lo que se imprime para afuera.**

# BLOQUE D — Entretenimiento: video y guía

- **Plataforma 360**: cámara lenta (por defecto), música de fondo cargable por
  evento, nombre del evento sobre el video, y guía en pantalla como la
  fotocabina. **Si el procesado traba una tablet, pará y avisá** en vez de
  entregar algo que se cuelga en la fiesta.
- **Bogue: es de FOTOS.** Hoy saca varias, arma un video boomerang y **descarta
  las fotos**. Hay que guardarlas, mostrárselas al invitado y poder imprimirlas
  con `imprimirRecuerdo` y `tira-fotocabina.ts` — **no escribas otra**. El
  boomerang queda como extra. Si falla el armado, las fotos igual se guardan.
- **Cápsula del tiempo**: disparadores de qué decir, poder escucharse antes de
  mandar, y aviso de cuánto queda antes de que corte a los 15 segundos.
- **Prueba antes de la fiesta**: que el operador confirme cámara, muro e
  impresora por estación contratada, imprimiendo una hoja de prueba de verdad.

# BLOQUE E — Ajustes del sistema

**Nunca se auditó y de ahí salen los textos que ve el cliente.**
`src/app/(app)/settings/` entero: plantillas de contrato, de invitación y de
WhatsApp, catálogo de menús, salones, empleados y proveedores.

- **Que no se pueda guardar una plantilla con un marcador inventado.** Si la
  plantilla trae `{{ALGO}}` que el sistema no sabe completar, sale escrito así
  en el contrato del cliente. Avisá al guardar, no después.
- Guardado que falle en silencio.
- Textos en criollo, no en jerga.
- **Los precios del catálogo no los toques**: son plata.

---

## Cuando termines cada bloque

Avisá el número de la propuesta y **anotá en `docs/YA-RESUELTO.md`** lo que
tocaste, con el porqué. Es la única memoria compartida entre las tres IA.
