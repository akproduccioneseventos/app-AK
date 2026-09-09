# Orden 52: decoracion y salon 3D que representen la fiesta acordada

> ACTUALIZACION 2026-09-09: evidencia historica de main8c5, NO una orden
> para reprogramar todo. Contrastar cada caso con el HEAD de la tanda abierta
> antes de editar y verificar alli rutas/simbolos/consumidores.
> PR #1204 observada en a0050d40181dbaf8f0e54ffa3f2d8ce191b7185d;
> no se certifico toda esa PR. Prevalece el reparto corregido de AGENTS.md:
> Claude: dinero, cobros, contabilidad, comida y permisos; Gemini: resto.
> DECO-03: la rama #1204 ya comprueba el resultado de guardar la imagen;
> NO reimplementar; validar. La ruta concreta objetada por Claude aun no se
> identifico; las rutas de esta auditoria deben revalidarse en la tanda.

2026-09-09. Codex revisa y propone; Gemini programa; Claude Opus compila.
Estado: revision parcial con ocho sondas fallidas reproducidas. No son correcciones.
Codigo auditado: main `8c5eb6e173e7b7b8dce6a8811cade7cf38411dfe`, vigente al consultar.
Checkout `d4fc888ef` contiene ese codigo y commits adicionales solo documentales.
Entrega: rama `codex/ordenes-45-a-48`, NO main. Una tanda coherente, sin fusion automatica.

## Lo que necesita AK

En una reunion, el cliente debe reconocer SU salon y entender donde quedaran la
entrada, las mesas, la pista y la decoracion. El equipo debe poder montar eso mismo.
Una imagen atractiva que cambia muebles, colores o medidas no sirve como plano.
Separar claramente plano operativo, visualizacion 3D e imagen conceptual de IA.

No empezar de cero. Reutilizar orden 24, devolucion 42 y orden 51. La 51 ya cubre
costos vacios, moodboard con exito falso y escrituras entre modulos: no duplicarla.
No reinstalar parches internos de React ni revivir la rama descartada de React18.

## Evidencia y limites

Graphify consultado en repo real; lectura focalizada de paginas y acciones. Un agente
economico reviso componentes 3D; director contrasto los hallazgos. Sin cambios de app,
datos reales, llamadas pagas de IA, instalaciones ni build. Serena del checkout aislado
no disponible en la revision previa; se usaron referencias y AST dirigidos.

Navegador: `/fiestas/nueva/decoracion` redirigio a login, que mostro Error al cargar;
el intento de reintentar fallo en el control de navegador. No se diagnostica la causa
ni una caida global. NO hay verificacion visual interior, GPU ni recorrido de cliente.

Se ejecuto `docs/evidencias/52-sondas-decoracion-3d.cjs`: 8 FAIL, salida 1. Extrae
funciones/callbacks reales con AST; simula React e IO. Comprueba props/decisiones y
resultados de funciones, NO pixeles WebGL ni toda la aplicacion.

```powershell
node docs/evidencias/52-sondas-decoracion-3d.cjs C:/Users/Usuario/Desktop/app/app-AK/node_modules/typescript
```

## A. Fidelidad entre plano y 3D (P1)

1. **Objetos incorrectos, DECO-05.** `SalonScene.tsx:116` usa Mesa3D para cualquier
   `type === 'element'` no resuelto antes. Decoracion/page.tsx:1732-1742 asigna ese
   tipo a todos los elementos del lienzo. Un arco de globos se convierte en mesa.
   Usar un mapeo explicito por tipo; conservar forma, dimensiones, material y cantidad.
   Si no hay modelo fiel, mostrar una representacion reconocible y advertir su limite,
   no inventar una mesa. No alcanza una etiqueta HTML sobre el canvas como evidencia.
2. **Giro ignorado, DECO-06.** SalonElement no pasa rotacion a barra/pista/escenario;
   Mesa3D tampoco aplica element.rotation. Probar barra rectangular a 0/90 grados
   en ambas vistas. Corregir tambien parentesis `(rotation + 45) % 360` en consumidores,
   pero no confundir crecimiento de grados con la causa principal del giro omitido.
3. **Escala perdida, DECO-07.** En invitados/layout/page.tsx:744-750, Cargar diseno
   copia elementos y dimensiones pero no pixelsPerMeter. Una mesa de 160 px pasa de
   2 m a 4 m si el origen usa 80 px/m y el evento 40. Copiar/normalizar unidades y
   fondo/calibracion relacionados. No cambiar medidas de fiestas existentes sin
   revisar compatibilidad y avisar al dueno si requiere migracion.

Conservar la conversion de coordenadas ya corregida por la orden 42. La devolucion
anterior dice que los muebles entran a la escena; estos defectos son de identidad,
orientacion y escala, no una repeticion del antiguo div oculto.

## B. Colores y propuesta del cliente (P1)

**DECO-02:** el editor manual escribe `paletaColores` (decoracion/page.tsx:294-302),
pero el portal `/portal/[fiestaId]/decoracion/page.tsx:143` y el generador IA leen
`colorPalette`. Elegir un estilo actualiza ambos, editar luego un color no.
La sonda reproduce un prompt con paleta vieja. Definir una lectura/escritura canonica
compatible con los datos previos y aplicar a editor, 3D, portal y generador.

El portal de propuesta SI existe y registra opinion: no crearlo de nuevo. Muestra
fotos IA, paleta, items y referencias, pero no consume `vistaDecorativa`; la captura
`salonPreview3dUrl` esta en el portal general. Conectar el diseno vigente a la propuesta
existente para que el cliente no opine sobre otra representacion. Separar inspiracion
de propuesta concreta. Su opinion NO acepta un presupuesto ni contrato.

## C. Guardar, exportar y compartir (P1/P2)

**DECO-08:** invitados/layout/page.tsx:366 ignora success:false y el callback de
autoguardado devuelve true. Propagar resultado al hook existente; probar recarga.
En :525 la captura tambien ignora resultado y anuncia Preview guardado en el portal.
Corregir ambos consumidores aunque la accion servidor ya devuelva errores correctamente.

**Exportacion sin descarga (inspeccion de codigo):** decoracion/page.tsx:668-670,
handleExportPng solo muestra Usá la captura de pantalla de tu dispositivo; el boton
en :1622 promete Exportar PNG. Implementar descarga real del diseno, sin controles,
recortes ni zoom accidental. Comprobar fondos remotos y errores de exportacion.
Subir la captura a almacenamiento apropiado y guardar su URL, no inflar la fiesta
con imagenes base64. No declarar compartido hasta confirmar persistencia y lectura
con sesion de cliente. No exponer costos internos ni enlaces administrativos.

## D. IA de decoracion: completar lo prometido, sin gasto sorpresa

**DECO-01:** generarVisualizacionSalonAi recibe salonFotoUrl pero no lo utiliza;
generateGeminiImage recibe solo prompt. El helper ya admite `images` en
src/lib/ai/gemini-image.ts:12-16. Usar la foto autorizada real con validacion de
origen/formato/tamano y limites de descarga; evitar SSRF al resolver URLs en servidor.
Conservar estructura del salon, no agregar mobiliario premium no seleccionado como
lo hace el prompt actual (:197). La imagen sigue siendo conceptual, nunca garantia
de exactitud geometrica o montaje. Sin foto, decirlo y no fingir reproduccion del salon.

**Funcion no conectada:** busqueda exacta en src encuentra la definicion y tests,
ningun consumidor TSX de generarVisualizacionSalonAi. No afirmar que hoy un cliente
usa ese generador o que ya esta gastando por ese recorrido. Conectar el disparo manual
en el editor existente SOLO despues de proteger limites y guardado.

**DECO-03:** updateDecoracion falla y el generador igual devuelve success:true.
**DECO-04:** con dos imagenes existentes, dos solicitudes simultaneas llaman dos
veces al generador aunque solo queda un cupo. La prueba anterior comprueba el tope
cuando ya hay tres; no prueba concurrencia ni fallo de persistencia.
Reservar cupo atomicamente y usar idempotencia/reconciliacion para no regenerar una
imagen ya pagada si falla su guardado. Mantener limite de tres por fiesta y disparo
humano; no contratar proveedores, generar en bucle ni aumentar presupuesto.

## E. Propuesta de experiencia profesional, a validar con el dueno

Estas mejoras son propuestas de producto; no fingir observacion visual ni implementar
cambios de funcionamiento sin aprobacion. Primero corregir A-D.

- **Un espacio de trabajo:** lienzo amplio, biblioteca lateral plegable con fotos de
  elementos reales AK, propiedades solo del objeto seleccionado; aprovechar controles
  existentes. En movil propiedades en panel inferior, sin tapar el objeto.
- **Vistas claras:** Plano / 3D / Propuesta sobre el mismo diseno. Separar esquema
  medido de composicion decorativa libre: hoy hay salonElements y vistaDecorativa.
  No fusionar arbitrariamente ambos sistemas ni duplicar mesas por concatenacion.
- **Presentacion al cliente:** imagen/diseno grande primero; luego paleta, elementos
  por zona y opinion. Fondo neutro claro con acentos de la fiesta; texto fuera de la
  imagen y sin costos. Quitar la etiqueta Prismm si no existe integracion acreditada.
- **Movimiento que ayuda:** transicion de camara suave entre entrada, pista y mesa
  principal, con control de detener y respeto por reduced-motion. No rotacion continua
  mientras se edita, luces parpadeantes ni efectos pesados en cada tarjeta.
- **Fidelidad antes que cantidad:** mejorar los modelos de los muebles que AK tiene,
  sus medidas y materiales. No agregar miles de modelos ajenos. Reutilizar escenas,
  instancias y carga diferida para celulares, con alternativa 2D si falla WebGL.
- **Montaje claro:** vincular cada elemento con su zona/cantidad y el checklist ya
  existente. Para opinion versionada del cliente, proponer revision/fecha explicita
  sin reutilizar una aprobacion vieja en un diseno nuevo ni convertirla en contrato.

Referencia oficial consultada: [Tripleseat Floorplans](https://support.tripleseat.com/hc/en-us/articles/24113016974103-What-is-Tripleseat-Floorplans)
y [Cvent Event Design](https://www.cvent.com/en/event-marketing-management/cvent-event-design-software).
Ambos presentan 2D/3D y planificacion visual; Cvent incluye planos a escala y reutilizacion.
Tomar ese criterio, no copiar interfaces ni comprar licencias. El valor para AK es
entender y montar la misma fiesta que se le mostro al cliente.

## Fotos del catalogo revisadas y carga de salones

Pedido adicional del dueno: usar SUS decoraciones y permitir empezar con fotos del
salon. Codex abrio y miro tres archivos existentes en public/media/catalogo-servicios:

- decoracion-xv-lila-01.jpeg: globos, fondo y letrero luminoso, letras XV, pedestales
  de estructura negra, tela violeta, candelabro y alfombra; se ve marca AK.
- decoracion-boda-mesa-01.jpeg: globos blancos/dorados, telas, letrero Nuestra Boda,
  mesa blanca y soportes para reposteria.
- decoracion-centro-mesa-01.jpeg: flores rosas/blancas en recipiente transparente
  sobre base circular espejada. No deducir medidas ni propiedad del objeto por la foto.

Usar esas referencias para identificar objetos y materiales, NO un catalogo generico
de mesas. Una foto de un montaje completo no demuestra stock disponible: vincular
al inventario existente con validacion del equipo. No contar los globos individuales
como unidades de inventario automaticamente ni inventar precios/medidas.

Recorrido existente verificado en codigo, pendiente de navegador autenticado:
Empresa > Salones > Nuevo Salon > nombre y datos conocidos > Guardar > Editar >
Fotos del Salon > Subir. La subida solo aparece para un salon ya creado. La primera
foto es portada. Mantener fotos generales, detalles y decoraciones diferenciadas
al proponer mejoras; no prometer que hoy existen etiquetas si no estan implementadas.

Para el dueno: conseguir foto general desde cada esquina, entrada, paredes/columnas
y techo, idealmente vacio; y al menos ancho/largo medidos, con puertas y obstaculos.
Sin medidas se puede mostrar inspiracion, NO reconstruccion 3D fiable. Una foto
en perspectiva NO es un plano cenital y no debe colocarse como fondo a escala.
El croquis existente tiene dimensiones en metros; Alto en ese plano significa la
segunda dimension del suelo, no la altura del techo. Proponer renombrar a Largo
para evitar confusion. No exigir GLB/GLTF al dueno ni vender foto-a-3D automatica.

## Criterio final y falsos positivos descartados

El agente observo que modelo3dUrl no se carga en SalonScene. La pantalla lo llama
Modelo 3D o visor externo y explica que no cambia el editor. NO es por si solo un P1:
es un enlace separado. Integrarlo requeriria validar modelo, licencia, escala y
rendimiento, y aprobacion del dueno. No prometer que cargar URL importa automaticamente.

Gemini entrega una tanda con A-D y pruebas. Claude compila sobre el mismo SHA y
registra resultado. Actualizar grafo solo al cambiar estructura importante.
Exigir capturas desktop/movil con escena no vacia, comprobacion de pixeles y giro,
escala 40/80, formas redonda/rectangular/arco/barra, paleta manual y cambio de estilo,
guardado con fallo/reintento, exportacion real y portal aislado por fiesta.
Para IA: pruebas mock de referencia/cupo/persistencia; prueba paga solo autorizada.
No usar datos de fiestas reales para experimentar. No afirmar auditoria terminada
hasta completar navegador autenticado, GPU, seguridad y sincronizacion real.

El E2E siguiente es PROPUESTO/PENDIENTE, no existe ni fue ejecutado en esta entrega.
El bloque es inventario de integracion, no evidencia visual ni certificado.

```comprobar
archivo: src/components/salon-3d/SalonScene.tsx
usa: SalonScene en src/app/(app)/fiestas/nueva/decoracion/page.tsx
prueba: tests/e2e/decoracion-salon-3d-fidelidad.spec.ts
```
