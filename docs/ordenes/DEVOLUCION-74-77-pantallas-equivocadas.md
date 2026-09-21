# Devolución — Dos entregas cayeron en la pantalla equivocada, y una prueba sigue sin pasar

**Para Gemini.** Lo que entró bien y **no se rehace**: el componente compartido del salón en 3D
(`src/components/salon-3d/Salon3DClienteView.tsx`), su prueba
(`tests/e2e/salon-3d-cliente.spec.ts`, que **pasa**), y las mejoras de la pantalla
`/secretaria-ak`.

Quedan tres cosas, y las dos primeras son el mismo error: **se programó en una pantalla que no
era la que pedía la orden.**

## 1. El secretario que habla: la orden 74 era para el botón flotante

**Lo que pedía la orden:** `src/components/multiagent/multiagent-widget.tsx`, que es el
**botón flotante que aparece en TODA la app interna** (está puesto en
`src/components/app-shell.tsx:443`). Es el que usa el dueño.

**Lo que se tocó:** `src/app/secretaria-ak/page.tsx`, que es **otra pantalla**, una sola.

**Medido ahora mismo, en el botón flotante:** sigue todo igual que antes.

- Lo dictado se escribe en el cuadro y **no se manda** (línea ~302: `setInput(...)`, y hay que
  tocar "enviar"). La función para mandar ya acepta el texto: `handleSend(override?: string)`,
  línea ~431.
- **Se corta en la primera pausa** (`recognition.continuous = false`, línea ~294).
- **Si el micrófono falla, no dice nada**: `recognition.onerror = () => setIsRecordingVoice(false)`,
  línea ~307.
- Sigue leyendo en voz **sólo las tres primeras frases** (`truncateForSpeech`, línea 77).

**Qué hay que hacer:** los cuatro bloques de la orden 74, **en ese archivo**. Si algo de lo que
ya hiciste en `/secretaria-ak` sirve, reusalo; **no lo copies**: si el código de la voz va a
vivir en dos pantallas, sacalo a un lugar común, como hiciste bien con el salón 3D.

## 2. El portal con clave sigue mostrando sólo la foto

**Lo que pedía la orden 77:** que el 3D aparezca en
`src/app/portal/c/[accessKey]/PublicPortalClientExperience.tsx:1404` —el portal al que el
cliente entra **con su enlace privado**—.

**Lo que se hizo:** ponerlo en `/portal/[fiestaId]/decoracion` y en `portal-cliente/[id]`.

**Comprobado:** en `PublicPortalClientExperience.tsx` no aparece `Salon3DClienteView` ni una
sola vez. El cliente que entra con su clave **sigue viendo la foto**.

**Qué hay que hacer:** usar ahí el mismo componente que ya hiciste. **Le falta un dato a ese
portal** —`salonElements` y `pixelsPerMeter` no viajan por `mapFiestaToClientPortal`
(`src/lib/client-portal/public-fiesta.ts:110`)—: **eso lo engancho yo**, porque ese archivo
decide qué ve el cliente. Dejalo pedido en la propuesta y programá contra esos dos campos.

## 3. La prueba de Touchpix sigue sin pasar (tercera medición)

`tests/e2e/48-touchpix-entrega-sin-reinicio.spec.ts`, "ENT-03: sesión segura", **falla igual**,
en computadora y en celular. La pantalla sigue contestando *"La validacion del evento demoro
demasiado. Intenta nuevamente."* en vez de mostrar el botón de sacar la foto.

Está todo lo que hace falta para resolverla en
`docs/ordenes/DEVOLUCION-48b-la-prueba-nueva-de-touchpix-no-pasa.md`. **Es lo único que hoy
frena la publicación de toda la tanda.**

```comprobar
archivo: src/components/multiagent/multiagent-widget.tsx
usa: Salon3DClienteView en src/app/portal/c/[accessKey]/PublicPortalClientExperience.tsx
prueba: tests/e2e/48-touchpix-entrega-sin-reinicio.spec.ts
```

## Y la costumbre que evita esto

**Antes de empezar, abrí el archivo que nombra la orden.** Las dos veces el trabajo está bien
hecho, pero en una pantalla que no es la que usa la gente. La orden dice el archivo y la línea
justamente para eso.
