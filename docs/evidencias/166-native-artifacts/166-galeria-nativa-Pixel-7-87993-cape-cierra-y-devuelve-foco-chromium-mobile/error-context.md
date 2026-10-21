# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 166-galeria-nativa.spec.ts >> Pixel 7: abre tarjeta, enfoca cerrar, navega con flechas, Escape cierra y devuelve foco
- Location: tests\e2e\166-galeria-nativa.spec.ts:70:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('[data-testid="gallery-section"]')
Expected: visible
Error: strict mode violation: locator('[data-testid="gallery-section"]') resolved to 2 elements:
    1) <section id="galeria" aria-busy="true" data-testid="gallery-section" class="border-y border-neutral-200 bg-neutral-100 py-20 text-slate-950 sm:py-24">…</section> aka locator('#landing-gallery').getByTestId('gallery-section')
    2) <section id="galeria" data-testid="gallery-section" class="border-y border-neutral-200 bg-neutral-100 py-20 text-slate-950 sm:py-24">…</section> aka locator('section').filter({ hasText: 'Galería y Producciones' }).getByTestId('gallery-section')

Call log:
  - Expect "toBeVisible" with timeout 25000ms
  - waiting for locator('[data-testid="gallery-section"]')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e5]:
    - generic [ref=e8]:
      - generic [ref=e11]:
        - link "AK Producciones" [ref=e12] [cursor=pointer]:
          - /url: /
          - img "AK Producciones" [ref=e14]
        - button "Abrir menú" [ref=e16] [cursor=pointer]:
          - img [ref=e17]
      - generic [ref=e18]:
        - img "Fiesta de quince años producida por AK Producciones" [ref=e20]
        - generic [ref=e23]:
          - paragraph [ref=e24]:
            - img [ref=e25]
            - text: AK Producciones Eventos · Salto, Uruguay
          - heading "Organizá tu fiesta completa en Salto con AK Producciones" [level=1] [ref=e27]
          - paragraph [ref=e28]: Salón, comida, discoteca, decoración, fotografía, filmación, barra y coordinación en un solo lugar.
          - generic [ref=e29]:
            - generic [ref=e30]: Comida gourmet y barra
            - generic [ref=e32]: Ambientación y mobiliario
            - generic [ref=e34]: Discoteca, pantallas y luces
          - generic [ref=e37]:
            - generic [ref=e38]:
              - generic [ref=e39]: Tipo de evento
              - combobox "Tipo de evento" [ref=e40]:
                - option "15 Años" [selected]
                - option "Bodas"
                - option "Sociales"
                - option "Empresariales"
            - generic [ref=e41]:
              - generic [ref=e42]: Mes y año estimado
              - textbox "Mes y año estimado" [ref=e43]: 2026-12
            - generic [ref=e44]:
              - generic [ref=e45]: Invitados aprox.
              - spinbutton "Invitados aprox." [ref=e46]: "100"
            - link "Consultar disponibilidad de fecha" [ref=e48] [cursor=pointer]:
              - /url: /simulador-de-presupuesto?tipo=15%20A%C3%B1os&guests=100&mes=2026-12&entry=hero-fecha
              - img [ref=e49]
              - generic [ref=e51]: Consultar disponibilidad de fecha
          - generic [ref=e52]:
            - link "Simular mi presupuesto" [ref=e54] [cursor=pointer]:
              - /url: /simulador-de-presupuesto
              - text: Simular mi presupuesto
              - img [ref=e55]
            - link "Consultar disponibilidad por WhatsApp" [ref=e58] [cursor=pointer]:
              - /url: https://wa.me/59898355530?text=Hola%20AK%20Producciones%2C%20quisiera%20consultar%20disponibilidad%20para%20mi%20fiesta.
              - img [ref=e59]
              - text: Consultar disponibilidad por WhatsApp
    - generic [ref=e64]:
      - generic [ref=e65]:
        - generic [ref=e66]:
          - paragraph [ref=e67]: Producción integral AK
          - heading "Una sola conversación. Todos los servicios que tu fiesta necesita." [level=2] [ref=e68]
        - paragraph [ref=e69]: Reunimos catering, barra, ambientación, mobiliario, discoteca, tecnología y coordinación. Cada propuesta se adapta a tu fecha, estilo e invitados.
      - generic [ref=e70]:
        - link "Bodas, producción de AK Producciones Bodas Ceremonia, cena y fiesta coordinadas por un mismo equipo. Ver propuesta" [ref=e72] [cursor=pointer]:
          - /url: /simulador-de-presupuesto?tipo=boda
          - img "Bodas, producción de AK Producciones" [ref=e74]
          - generic [ref=e75]:
            - img [ref=e77]
            - heading "Bodas" [level=3] [ref=e79]
            - paragraph [ref=e80]: Ceremonia, cena y fiesta coordinadas por un mismo equipo.
            - generic [ref=e81]:
              - text: Ver propuesta
              - img [ref=e82]
        - link "Fiestas de 15, producción de AK Producciones Fiestas de 15 Una noche personal, con pista, recuerdos y energía para celebrar. Ver propuesta" [ref=e85] [cursor=pointer]:
          - /url: /simulador-de-presupuesto?tipo=15-anos
          - img "Fiestas de 15, producción de AK Producciones" [ref=e87]
          - generic [ref=e88]:
            - img [ref=e90]
            - heading "Fiestas de 15" [level=3] [ref=e92]
            - paragraph [ref=e93]: Una noche personal, con pista, recuerdos y energía para celebrar.
            - generic [ref=e94]:
              - text: Ver propuesta
              - img [ref=e95]
        - link "Cumpleaños y sociales, producción de AK Producciones Cumpleaños y sociales Gastronomía, barra y música pensadas según cada grupo. Ver propuesta" [ref=e98] [cursor=pointer]:
          - /url: /simulador-de-presupuesto?tipo=social
          - img "Cumpleaños y sociales, producción de AK Producciones" [ref=e100]
          - generic [ref=e101]:
            - img [ref=e103]
            - heading "Cumpleaños y sociales" [level=3] [ref=e105]
            - paragraph [ref=e106]: Gastronomía, barra y música pensadas según cada grupo.
            - generic [ref=e107]:
              - text: Ver propuesta
              - img [ref=e108]
        - link "Eventos empresariales, producción de AK Producciones Eventos empresariales Recepciones y encuentros con puesta técnica y operativa. Ver propuesta" [ref=e111] [cursor=pointer]:
          - /url: /simulador-de-presupuesto?tipo=corporativo
          - img "Eventos empresariales, producción de AK Producciones" [ref=e113]
          - generic [ref=e114]:
            - img [ref=e116]
            - heading "Eventos empresariales" [level=3] [ref=e120]
            - paragraph [ref=e121]: Recepciones y encuentros con puesta técnica y operativa.
            - generic [ref=e122]:
              - text: Ver propuesta
              - img [ref=e123]
    - generic [ref=e126]:
      - generic [ref=e128]:
        - generic [ref=e129]:
          - generic [ref=e130]:
            - generic [ref=e131]: ✨ El Valor de la Tranquilidad
            - 'heading "No vendemos luces ni sonido: diseñamos tu tranquilidad" [level=2] [ref=e132]'
            - paragraph [ref=e133]: El verdadero lujo es llegar al día de tu evento sin estrés. Olvidate de perseguir proveedores o comparar presupuestos incompletos.
          - generic [ref=e134]:
            - generic [ref=e135]:
              - img [ref=e137]
              - generic [ref=e140]:
                - heading "Disfrutá, nosotros nos encargamos" [level=3] [ref=e141]
                - paragraph [ref=e142]: AK coordina el salón, los tiempos, el staff y los detalles para que tu única responsabilidad sea divertirte como un invitado más.
            - generic [ref=e143]:
              - img [ref=e145]
              - generic [ref=e147]:
                - heading "Cero sorpresas ni intermediarios" [level=3] [ref=e148]
                - paragraph [ref=e149]: Desde la gastronomía gourmet hasta la discoteca y pantallas LED, todo funciona bajo una misma visión integral. Menos proveedores, todo coordinado por el mismo equipo.
            - generic [ref=e150]:
              - img [ref=e152]
              - generic [ref=e155]:
                - heading "Presupuesto claro y completo" [level=3] [ref=e156]
                - paragraph [ref=e157]: Un precio transparente que cubre todo lo que realmente necesitás, sin costos ocultos de último momento ni dolores de cabeza.
        - generic [ref=e158]:
          - generic [ref=e159]:
            - img "Equipo de organización AK Producciones" [ref=e160]
            - generic [ref=e162]:
              - text: Trabajo en equipo
              - paragraph [ref=e163]: Personas reales cuidando cada detalle
          - generic [ref=e164]:
            - img [ref=e166]
            - paragraph [ref=e169]: Reserva de fecha confirmada, plan de pagos claro y un equipo entero a tu disposición.
      - generic [ref=e171]:
        - generic [ref=e172]:
          - generic [ref=e173]:
            - generic [ref=e174]: Trayectoria AK
            - heading "Números que respaldan cada evento" [level=2] [ref=e175]
          - paragraph [ref=e176]: Experiencia real, atención cercana y producción integral para que la fiesta no dependa de improvisar.
        - generic [ref=e177]:
          - article [ref=e178]:
            - generic [ref=e180]: 🎉
            - generic [ref=e181]: "+200"
            - generic [ref=e182]: Eventos Realizados
          - article [ref=e183]:
            - generic [ref=e185]: ⭐
            - generic [ref=e186]: "+7"
            - generic [ref=e187]: Años de Experiencia
          - article [ref=e188]:
            - generic [ref=e190]: ❤️
            - generic [ref=e191]: Clientes
            - generic [ref=e192]: Satisfechos
      - generic [ref=e194]:
        - generic [ref=e195]:
          - generic [ref=e196]:
            - img [ref=e197]
            - text: Nuestra Historia y Compromiso
          - heading "El valor de contar con un equipo completo" [level=2] [ref=e202]
          - paragraph [ref=e203]: Desde la primera entrevista hasta el último tema de la noche, cada parte de la fiesta se coordina en conjunto para que no tengas que preocuparte por nada.
        - generic [ref=e204]:
          - article [ref=e205]:
            - generic [ref=e206]:
              - img "Planificación Profesional" [ref=e207]
              - generic [ref=e209]:
                - img [ref=e210]
                - text: Equipo AK
            - generic [ref=e212]:
              - heading "Planificación Profesional" [level=3] [ref=e213]
              - paragraph [ref=e214]: Un organizador experto escucha tu idea, proyecta el presupuesto y planifica cada paso de forma ordenada.
          - article [ref=e215]:
            - generic [ref=e216]:
              - img "Coordinación y Montaje" [ref=e217]
              - generic [ref=e219]:
                - img [ref=e220]
                - text: Equipo AK
            - generic [ref=e222]:
              - heading "Coordinación y Montaje" [level=3] [ref=e223]
              - paragraph [ref=e224]: Nuestro equipo monta la decoración, la gastronomía, la discoteca y la tecnología bajo un control estricto.
          - article [ref=e225]:
            - generic [ref=e226]:
              - img "Festejo en Familia" [ref=e227]
              - generic [ref=e229]:
                - img [ref=e230]
                - text: Equipo AK
            - generic [ref=e232]:
              - heading "Festejo en Familia" [level=3] [ref=e233]
              - paragraph [ref=e234]: Creamos la puesta en escena perfecta para que tu familia disfrute sin estrés, guardando recuerdos inolvidables.
    - generic [ref=e238]:
      - generic [ref=e239]:
        - generic [ref=e240]:
          - paragraph [ref=e241]:
            - img [ref=e242]
            - text: Salón destacado
          - heading "Club Uruguay" [level=2] [ref=e246]
          - paragraph [ref=e247]: Un espacio emblemático en el centro de Salto, preparado por AK Producciones con catering, música, ambientación, personal y tecnología coordinados en una sola propuesta.
          - generic [ref=e249]:
            - img [ref=e250]
            - paragraph [ref=e253]: Pleno centro de Salto
            - paragraph [ref=e254]: Club Uruguay, ubicación estratégica e histórica.
          - generic [ref=e255]:
            - link "Conocer el salón" [ref=e257] [cursor=pointer]:
              - /url: /club-uruguay
              - text: Conocer el salón
              - img [ref=e258]
            - link "Simular mi presupuesto" [ref=e261] [cursor=pointer]:
              - /url: /simulador-de-presupuesto?salon=club
              - img [ref=e262]
              - text: Simular mi presupuesto
        - generic [ref=e264]:
          - figure "Salón principal" [ref=e265]:
            - img "Salón principal de Club Uruguay preparado para una fiesta" [ref=e266]
            - paragraph [ref=e269]: Salón principal
          - generic [ref=e270]:
            - figure "Pista y discoteca" [ref=e271]:
              - img "Pista y discoteca instaladas en Club Uruguay" [ref=e272]
              - generic [ref=e274]: Pista y discoteca
            - figure "Una fiesta en funcionamiento" [ref=e275]:
              - img "Fiesta de quince años con pista iluminada" [ref=e276]
              - generic [ref=e278]: Una fiesta en funcionamiento
      - generic [ref=e279]:
        - heading "Ficha técnica del salón" [level=3] [ref=e280]
        - generic [ref=e281]:
          - generic [ref=e282]:
            - img [ref=e283]
            - generic [ref=e286]: Pleno centro de Salto
            - generic [ref=e287]: Acceso inmejorable
          - generic [ref=e288]:
            - img [ref=e289]
            - generic [ref=e293]: Climatización
            - generic [ref=e294]: Frío y calor
          - generic [ref=e295]:
            - img [ref=e296]
            - generic [ref=e300]: Recepción, salón principal y pista LED
            - generic [ref=e301]: Espacios integrados
          - generic [ref=e302]:
            - img [ref=e303]
            - generic [ref=e308]: Cocina equipada para catering
            - generic [ref=e309]: Instalaciones completas
          - generic [ref=e310]:
            - img [ref=e311]
            - generic [ref=e314]: Personal de baños durante todo el evento
            - generic [ref=e315]: Higiene permanente
    - generic [ref=e318]:
      - generic [ref=e320]:
        - generic [ref=e321]:
          - generic [ref=e322]:
            - img [ref=e323]
            - text: Tecnología AK para Eventos
          - heading "La app de tu fiesta" [level=2] [ref=e325]
          - paragraph [ref=e326]: Organizá los detalles, invitá a los tuyos y compartí los recuerdos desde un mismo lugar. Diseñada para que la fiesta se disfrute en la pista y en cada celular.
        - generic [ref=e328]:
          - button "1. Antes Portal Cliente" [pressed] [ref=e329] [cursor=pointer]:
            - generic [ref=e330]:
              - img [ref=e332]
              - generic [ref=e335]: 1. Antes
            - paragraph [ref=e337]: Portal Cliente
          - button "2. Invitación Invitación" [ref=e338] [cursor=pointer]:
            - generic [ref=e339]:
              - img [ref=e341]
              - generic [ref=e344]: 2. Invitación
            - paragraph [ref=e346]: Invitación
          - button "3. Durante Mural en Vivo" [ref=e347] [cursor=pointer]:
            - generic [ref=e348]:
              - img [ref=e350]
              - generic [ref=e352]: 3. Durante
            - paragraph [ref=e354]: Mural en Vivo
          - button "4. Barra y Tótem Barra & Cócteles" [ref=e355] [cursor=pointer]:
            - generic [ref=e356]:
              - img [ref=e358]
              - generic [ref=e361]: 4. Barra y Tótem
            - paragraph [ref=e363]: Barra & Cócteles
          - button "5. Después Recuerdos" [ref=e364] [cursor=pointer]:
            - generic [ref=e365]:
              - img [ref=e367]
              - generic [ref=e371]: 5. Después
            - paragraph [ref=e373]: Recuerdos
        - generic [ref=e375]:
          - generic [ref=e376]:
            - generic [ref=e377]:
              - img [ref=e378]
              - text: Planificación sin fricción
            - generic [ref=e381]:
              - 'heading "Portal del cliente: decisiones y acuerdos en orden" [level=3] [ref=e382]'
              - paragraph [ref=e383]: Menú, selección musical, decoración y tareas organizadas sin perderte en chats.
            - generic [ref=e385]:
              - img [ref=e386]
              - generic [ref=e389]:
                - paragraph [ref=e390]: Lo que sentís como cliente
                - paragraph [ref=e391]: “Organizás tu fiesta sin perder conversaciones en chats ni papeles sueltos.”
            - generic [ref=e392]:
              - link "Simular mi presupuesto" [ref=e393] [cursor=pointer]:
                - /url: /simulador-de-presupuesto
                - text: Simular mi presupuesto
                - img [ref=e394]
              - link "Consultar disponibilidad por WhatsApp" [ref=e396] [cursor=pointer]:
                - /url: https://wa.me/59898355530?text=Hola%2C%20estuve%20viendo%20%22La%20app%20de%20tu%20fiesta%22%20(Portal%20del%20cliente%3A%20decisiones%20y%20acuerdos%20en%20orden)%20en%20el%20sitio%20web%20de%20AK%20y%20me%20interesa%20saber%20m%C3%A1s%20para%20mi%20evento.
            - paragraph [ref=e397]: "* Muestra interactiva pedagógica con datos de prueba. No publica ni emite mensajes reales."
          - generic [ref=e399]:
            - generic [ref=e400]:
              - generic [ref=e401]:
                - generic [ref=e403]: DEMO EN VIVO
                - generic [ref=e404]: • 15 de Camila (Muestra)
              - generic [ref=e405]: Modo seguro
            - generic [ref=e406]:
              - generic [ref=e407]:
                - button "Menú & Platos" [ref=e408] [cursor=pointer]
                - button "Música elegida" [ref=e409] [cursor=pointer]
                - button "Mural de Deco" [ref=e410] [cursor=pointer]
              - generic [ref=e411]:
                - generic [ref=e412]:
                  - generic [ref=e413]: Propuesta Gastronómica Aprobada
                  - generic [ref=e414]: Confirmado
                - paragraph [ref=e415]: Recepción de bocados calientes + Asado Criollo Premium.
                - generic [ref=e416]:
                  - generic [ref=e417]:
                    - text: 🍽️
                    - strong [ref=e418]: "Celíacos:"
                    - text: 3 menúes adaptados
                  - generic [ref=e419]:
                    - text: 🥗
                    - strong [ref=e420]: "Vegetarianos:"
                    - text: 4 opciones gourmet
              - generic [ref=e421]:
                - generic [ref=e422]: 💬 Conversación centralizada con tu productor asignado
                - generic [ref=e423]: Al día
        - generic [ref=e424]:
          - paragraph [ref=e425]: ¿Querés ver cómo se adapta la app a tu tipo de fiesta?
          - paragraph [ref=e426]: Los módulos contratados se integran a tu presupuesto personalizado (cumpleaños de 15, bodas, empresariales o infantiles).
          - link "Hablar con un asesor por WhatsApp" [ref=e428] [cursor=pointer]:
            - /url: https://wa.me/59898355530?text=Hola%2C%20estuve%20viendo%20%22La%20app%20de%20tu%20fiesta%22%20(Portal%20del%20cliente%3A%20decisiones%20y%20acuerdos%20en%20orden)%20en%20el%20sitio%20web%20de%20AK%20y%20me%20interesa%20saber%20m%C3%A1s%20para%20mi%20evento.
            - text: Hablar con un asesor por WhatsApp
            - img [ref=e429]
      - generic [ref=e431]:
        - paragraph [ref=e432]: Y además, las estaciones que se montan en tu fiesta
        - generic [ref=e434]:
          - generic [ref=e435]:
            - generic [ref=e436]:
              - img [ref=e437]
              - text: Tecnología Interactiva · AK Producciones
            - heading "Experiencias que hacen tu fiesta inolvidable" [level=2] [ref=e439]
            - paragraph [ref=e440]: "No es sólo equipamiento: es diversión en vivo, recuerdos impresos en el momento y conexión real con cada uno de tus invitados."
          - generic [ref=e441]:
            - button "Visual y viral" [ref=e442] [cursor=pointer]:
              - generic [ref=e443]: Visual y viral
            - button "Emoción y recuerdos" [ref=e444] [cursor=pointer]:
              - generic [ref=e445]: Emoción y recuerdos
            - button "Interacción en pista" [ref=e446] [cursor=pointer]:
              - generic [ref=e447]: Interacción en pista
          - generic [ref=e448]:
            - button "Tótem Touch IA" [ref=e449] [cursor=pointer]:
              - img [ref=e450]
              - text: Tótem Touch IA
            - button "Plataforma 360° Video" [ref=e453] [cursor=pointer]:
              - img [ref=e454]
              - text: Plataforma 360° Video
            - button "Vogue Boomerang & GIFs" [ref=e457] [cursor=pointer]:
              - img [ref=e458]
              - text: Vogue Boomerang & GIFs
            - button "Espejo Mágico Interactivo" [ref=e460] [cursor=pointer]:
              - img [ref=e461]
              - text: Espejo Mágico Interactivo
            - button "Fotocabina Impresa" [ref=e464] [cursor=pointer]:
              - img [ref=e465]
              - text: Fotocabina Impresa
          - generic [ref=e468]:
            - generic [ref=e469]:
              - generic [ref=e470]:
                - generic [ref=e472]: Exclusivo con IA
                - heading "Tótem Touch IA" [level=3] [ref=e473]
                - paragraph [ref=e474]: Transforma la foto del invitado en personajes y estilos con inteligencia artificial
                - paragraph [ref=e475]: Tus invitados posan frente a la pantalla táctil y el sistema de IA los convierte en superhéroes, personajes temáticos o retratos artísticos al instante, listos para descargar por QR o imprimir.
              - generic [ref=e476]:
                - generic [ref=e477]:
                  - img [ref=e479]
                  - heading "Estilos IA automáticos" [level=4] [ref=e481]
                  - paragraph [ref=e482]: Convierte retratos en héroes, realeza o arte digital en segundos.
                - generic [ref=e483]:
                  - img [ref=e485]
                  - heading "Fácil para todas las edades" [level=4] [ref=e488]
                  - paragraph [ref=e489]: Tocan la pantalla, sonríen y el tótem hace la magia.
                - generic [ref=e490]:
                  - img [ref=e492]
                  - heading "Descarga instantánea" [level=4] [ref=e498]
                  - paragraph [ref=e499]: Cada invitado se lleva su retrato digital directamente al celular.
              - generic [ref=e500]:
                - link "Incluir en mi simulación" [ref=e501] [cursor=pointer]:
                  - /url: /simulador-de-presupuesto?extra=serv_espejo_magico_ia
                  - img [ref=e502]
                  - text: Incluir en mi simulación
                - link "Quiero Tótem Touch IA" [ref=e504] [cursor=pointer]:
                  - /url: https://wa.me/59898355530?text=%C2%A1Hola!%20Me%20interes%C3%B3%20la%20tecnolog%C3%ADa%20de%20T%C3%B3tem%20Touch%20IA%20para%20mi%20evento.%20%C2%BFMe%20pueden%20pasar%20info%20y%20disponibilidad%3F
                  - text: Quiero Tótem Touch IA
                  - img [ref=e505]
                - link "Simular mi presupuesto" [ref=e507] [cursor=pointer]:
                  - /url: /simulador-de-presupuesto
            - generic [ref=e510]:
              - generic [ref=e511]:
                - generic [ref=e512]:
                  - img [ref=e513]
                  - text: Demostración interactiva
                - generic [ref=e515]: Ejemplo IA
              - paragraph [ref=e516]: "Así transforma el Tótem Touch IA la foto de tus invitados en tiempo real:"
              - generic [ref=e517]:
                - generic [ref=e518]:
                  - img "Foto original del invitado" [ref=e520]
                  - generic [ref=e521]: Antes (Original)
                - generic [ref=e522]:
                  - generic [ref=e523]:
                    - img "Transformación con inteligencia artificial" [ref=e524]
                    - generic [ref=e525]: Estilo IA
                  - generic [ref=e526]: Después (IA)
              - list [ref=e527]:
                - listitem [ref=e528]:
                  - img [ref=e529]
                  - generic [ref=e532]: Transformación facial con IA
                - listitem [ref=e533]:
                  - img [ref=e534]
                  - generic [ref=e537]: Temas y personajes de fiesta
                - listitem [ref=e538]:
                  - img [ref=e539]
                  - generic [ref=e542]: Descarga por código QR
                - listitem [ref=e543]:
                  - img [ref=e544]
                  - generic [ref=e547]: Impresión opcional en el acto
    - generic [ref=e550]:
      - generic [ref=e552]:
        - generic [ref=e553]:
          - img [ref=e554]
          - text: Galería y Producciones Reales
        - heading "Nuestros eventos en imágenes y movimiento" [level=2] [ref=e556]
        - generic [ref=e557]:
          - button "Fotos de montajes" [ref=e558] [cursor=pointer]:
            - img [ref=e559]
            - text: Fotos de montajes
          - button "Videos de fiestas reales" [ref=e562] [cursor=pointer]:
            - img [ref=e563]
            - text: Videos de fiestas reales
          - button "Video-testimonios" [ref=e565] [cursor=pointer]:
            - img [ref=e566]
            - text: Video-testimonios
      - generic [ref=e574]:
        - generic [ref=e576]:
          - paragraph [ref=e577]: Eventos reales
          - heading "Galería de eventos" [level=2] [ref=e578]
          - paragraph [ref=e579]: "Momentos reales de nuestras producciones: gastronomía, salones, pista LED, discoteca y ambientación."
        - generic [ref=e580]:
          - button "Todos" [ref=e581] [cursor=pointer]
          - button "Eventos" [ref=e582] [cursor=pointer]
          - button "Discoteca" [ref=e583] [cursor=pointer]
          - button "Catering" [ref=e584] [cursor=pointer]
          - button "Decoración" [ref=e585] [cursor=pointer]
          - button "Barra de Tragos" [ref=e586] [cursor=pointer]
          - button "Fotocabina" [ref=e587] [cursor=pointer]
          - button "Repostería" [ref=e588] [cursor=pointer]
          - button "Fotografía" [ref=e589] [cursor=pointer]
          - button "Salón" [ref=e590] [cursor=pointer]
        - generic [ref=e591]:
          - 'button "Abrir foto: Prueba nativa galería 166 foto uno" [ref=e592] [cursor=pointer]':
            - img "Prueba nativa galería 166 foto uno" [ref=e593]
            - generic [ref=e595]: Fotografía
            - generic [ref=e596]:
              - generic [ref=e597]: Prueba nativa galería 166 foto uno
              - img [ref=e598]
          - 'button "Abrir foto: Prueba nativa galería 166 foto dos" [ref=e601] [cursor=pointer]':
            - img "Prueba nativa galería 166 foto dos" [ref=e602]
            - generic [ref=e604]: Fotografía
            - generic [ref=e605]:
              - generic [ref=e606]: Prueba nativa galería 166 foto dos
              - img [ref=e607]
          - 'button "Abrir foto: Decoración XV con equipo AK" [ref=e610] [cursor=pointer]':
            - img "Decoración XV con equipo AK" [ref=e611]
            - generic [ref=e613]: Decoración
            - generic [ref=e614]:
              - generic [ref=e615]: Decoración XV con equipo AK
              - img [ref=e616]
          - 'button "Abrir foto: Mesa principal XV" [ref=e619] [cursor=pointer]':
            - img "Mesa principal XV" [ref=e620]
            - generic [ref=e622]: Decoración
            - generic [ref=e623]:
              - generic [ref=e624]: Mesa principal XV
              - img [ref=e625]
          - 'button "Abrir foto: Mesa de catering AK" [ref=e628] [cursor=pointer]':
            - img "Mesa de catering AK" [ref=e629]
            - generic [ref=e631]: Catering
            - generic [ref=e632]:
              - generic [ref=e633]: Mesa de catering AK
              - img [ref=e634]
          - 'button "Abrir foto: Decoración rosa para XV" [ref=e637] [cursor=pointer]':
            - img "Decoración rosa para XV" [ref=e638]
            - generic [ref=e640]: Decoración
            - generic [ref=e641]:
              - generic [ref=e642]: Decoración rosa para XV
              - img [ref=e643]
          - 'button "Abrir foto: Salón con discoteca AK" [ref=e646] [cursor=pointer]':
            - img "Salón con discoteca AK" [ref=e647]
            - generic [ref=e649]: Salón
            - generic [ref=e650]:
              - generic [ref=e651]: Salón con discoteca AK
              - img [ref=e652]
          - 'button "Abrir foto: Kebab gourmet para eventos" [ref=e655] [cursor=pointer]':
            - img "Kebab gourmet para eventos" [ref=e656]
            - generic [ref=e658]: Catering
            - generic [ref=e659]:
              - generic [ref=e660]: Kebab gourmet para eventos
              - img [ref=e661]
          - 'button "Abrir foto: Iluminación de discoteca" [ref=e664] [cursor=pointer]':
            - img "Iluminación de discoteca" [ref=e665]
            - generic [ref=e667]: Discoteca
            - generic [ref=e668]:
              - generic [ref=e669]: Iluminación de discoteca
              - img [ref=e670]
          - 'button "Abrir foto: Montaje de discoteca y salón" [ref=e673] [cursor=pointer]':
            - img "Montaje de discoteca y salón" [ref=e674]
            - generic [ref=e676]: Discoteca
            - generic [ref=e677]:
              - generic [ref=e678]: Montaje de discoteca y salón
              - img [ref=e679]
          - 'button "Abrir foto: Pista iluminada para XV" [ref=e682] [cursor=pointer]':
            - img "Pista iluminada para XV" [ref=e683]
            - generic [ref=e685]: Salón
            - generic [ref=e686]:
              - generic [ref=e687]: Pista iluminada para XV
              - img [ref=e688]
          - 'button "Abrir foto: Photobooth estilo Vogue" [ref=e691] [cursor=pointer]':
            - img "Photobooth estilo Vogue" [ref=e692]
            - generic [ref=e694]: Fotocabina
            - generic [ref=e695]:
              - generic [ref=e696]: Photobooth estilo Vogue
              - img [ref=e697]
        - button "Ver más fotos y videos (24 de 144)" [ref=e701] [cursor=pointer]:
          - text: Ver más fotos y videos (24 de 144)
          - img [ref=e702]
    - generic [ref=e708]:
      - generic [ref=e709]:
        - generic [ref=e710]:
          - img [ref=e711]
          - text: Reseñas de clientes
        - heading "Experiencias compartidas" [level=2] [ref=e716]
        - paragraph [ref=e717]: Opiniones compartidas por clientes sobre su experiencia con AK Producciones.
      - generic [ref=e718]:
        - button "Ver reseña de Liliana Reyes" [ref=e719] [cursor=pointer]:
          - generic [ref=e720]:
            - generic [ref=e721]:
              - img [ref=e722]
              - generic [ref=e725]: Servicio de Fiesta
            - generic [ref=e726]:
              - img [ref=e727]
              - img [ref=e729]
              - img [ref=e731]
              - img [ref=e733]
              - img [ref=e735]
            - heading "La experiencia de Liliana Reyes" [level=3] [ref=e737]
            - paragraph [ref=e738]: “Muchas gracias por las atenciones recibidas. Y totalmente conforme con el servicio brindado. Nos vemos el año que viene, para repetir el movimiento. Leonardo y flia”
          - generic [ref=e739]:
            - generic [ref=e740]:
              - paragraph [ref=e741]: Liliana Reyes
              - paragraph [ref=e742]: Servicio de Fiesta
              - paragraph [ref=e743]: Cliente AK
            - generic [ref=e744]:
              - img [ref=e745]
              - text: Opinión publicada
        - button "Ver reseña de Analia Sosa" [ref=e748] [cursor=pointer]:
          - generic [ref=e749]:
            - generic [ref=e750]:
              - img [ref=e751]
              - generic [ref=e754]: Evento Social
            - generic [ref=e755]:
              - img [ref=e756]
              - img [ref=e758]
              - img [ref=e760]
              - img [ref=e762]
              - img [ref=e764]
            - heading "La experiencia de Analia Sosa" [level=3] [ref=e766]
            - paragraph [ref=e767]: “excelente servicio muy recomendable!!!muchas gracias”
          - generic [ref=e768]:
            - generic [ref=e769]:
              - paragraph [ref=e770]: Analia Sosa
              - paragraph [ref=e771]: Evento Social
              - paragraph [ref=e772]: Cliente AK
            - generic [ref=e773]:
              - img [ref=e774]
              - text: Opinión publicada
        - button "Ver reseña de Maria Rosario Volpi" [ref=e777] [cursor=pointer]:
          - generic [ref=e778]:
            - generic [ref=e779]:
              - img [ref=e780]
              - generic [ref=e783]: Boda
            - generic [ref=e784]:
              - img [ref=e785]
              - img [ref=e787]
              - img [ref=e789]
              - img [ref=e791]
              - img [ref=e793]
            - heading "La experiencia de Maria Rosario Volpi" [level=3] [ref=e795]
            - paragraph [ref=e796]: “GRASIAS. Alexander Nicolas Knuth por todo. El Servicio exelente. Y. Por Acompañarnos. En este. Dia tan especial para nosotros.”
          - generic [ref=e797]:
            - generic [ref=e798]:
              - paragraph [ref=e799]: Maria Rosario Volpi
              - paragraph [ref=e800]: Boda
              - paragraph [ref=e801]: Cliente AK
            - generic [ref=e802]:
              - img [ref=e803]
              - text: Opinión publicada
        - button "Ver reseña de Clau Piriz" [ref=e806] [cursor=pointer]:
          - generic [ref=e807]:
            - generic [ref=e808]:
              - img [ref=e809]
              - generic [ref=e812]: Cumpleaños
            - generic [ref=e813]:
              - img [ref=e814]
              - img [ref=e816]
              - img [ref=e818]
              - img [ref=e820]
              - img [ref=e822]
            - heading "La experiencia de Clau Piriz" [level=3] [ref=e824]
            - paragraph [ref=e825]: “Hermoso todo!”
          - generic [ref=e826]:
            - generic [ref=e827]:
              - paragraph [ref=e828]: Clau Piriz
              - paragraph [ref=e829]: Cumpleaños
              - paragraph [ref=e830]: Cliente AK
            - generic [ref=e831]:
              - img [ref=e832]
              - text: Opinión publicada
        - button "Ver reseña de Maria Rosario Volpi" [ref=e835] [cursor=pointer]:
          - generic [ref=e836]:
            - generic [ref=e837]:
              - img [ref=e838]
              - generic [ref=e841]: Servicio de Fiesta
            - generic [ref=e842]:
              - img [ref=e843]
              - img [ref=e845]
              - img [ref=e847]
              - img [ref=e849]
              - img [ref=e851]
            - heading "La experiencia de Maria Rosario Volpi" [level=3] [ref=e853]
            - paragraph [ref=e854]: “Muy buen servicio. Recomiendo”
          - generic [ref=e855]:
            - generic [ref=e856]:
              - paragraph [ref=e857]: Maria Rosario Volpi
              - paragraph [ref=e858]: Servicio de Fiesta
              - paragraph [ref=e859]: Cliente AK
            - generic [ref=e860]:
              - img [ref=e861]
              - text: Opinión publicada
      - generic [ref=e864]:
        - generic [ref=e865]:
          - generic [ref=e866]: Claridad y tranquilidad
          - 'heading "Cómo trabajamos: nuestro método en 3 pasos" [level=3] [ref=e867]'
          - paragraph [ref=e868]: Sin sorpresas ni letra chica. Un camino simple y organizado desde la primera consulta hasta la fiesta.
        - generic [ref=e869]:
          - generic [ref=e871]:
            - generic [ref=e872]:
              - img [ref=e874]
              - generic [ref=e877]: "01"
            - heading "1. Reservás tu fecha con una seña" [level=4] [ref=e878]
            - paragraph [ref=e879]: Asegurás tu fecha en la agenda oficial de AK y confirmás la disponibilidad de salón y equipos.
          - generic [ref=e881]:
            - generic [ref=e882]:
              - img [ref=e884]
              - generic [ref=e886]: "02"
            - heading "2. Plan de pagos mensuales a tu medida" [level=4] [ref=e887]
            - paragraph [ref=e888]: Abonás en cuotas fijas hasta la fecha del evento sin estrés ni sorpresas financieras.
          - generic [ref=e890]:
            - generic [ref=e891]:
              - img [ref=e893]
              - generic [ref=e897]: "03"
            - heading "3. Ajuste final de invitados 15 a 30 días antes" [level=4] [ref=e898]
            - paragraph [ref=e899]: Definís el número definitivo de asistentes, menú especial, alergias y cronograma con precisión.
    - generic [ref=e901]:
      - generic [ref=e903]:
        - generic [ref=e904]:
          - generic [ref=e905]: ❓ FAQ
          - heading "Preguntas Frecuentes" [level=2] [ref=e906]
          - paragraph [ref=e907]: Todo lo que necesitás saber antes de contratar tu evento
        - generic [ref=e908]:
          - button "¿Cómo reservo mi fecha?" [ref=e910] [cursor=pointer]:
            - generic [ref=e911]: ¿Cómo reservo mi fecha?
            - img [ref=e912]
          - button "¿Qué incluye el servicio integral?" [ref=e915] [cursor=pointer]:
            - generic [ref=e916]: ¿Qué incluye el servicio integral?
            - img [ref=e917]
          - button "¿Puedo contratar solo algunos servicios?" [ref=e920] [cursor=pointer]:
            - generic [ref=e921]: ¿Puedo contratar solo algunos servicios?
            - img [ref=e922]
          - button "¿Trabajan con Club Uruguay?" [ref=e925] [cursor=pointer]:
            - generic [ref=e926]: ¿Trabajan con Club Uruguay?
            - img [ref=e927]
          - button "¿Cómo pido presupuesto?" [ref=e930] [cursor=pointer]:
            - generic [ref=e931]: ¿Cómo pido presupuesto?
            - img [ref=e932]
          - button "¿Hacen fiestas de 15, bodas y cumpleaños?" [ref=e935] [cursor=pointer]:
            - generic [ref=e936]: ¿Hacen fiestas de 15, bodas y cumpleaños?
            - img [ref=e937]
      - generic [ref=e941]:
        - generic [ref=e942]:
          - generic [ref=e943]:
            - generic [ref=e944]:
              - img [ref=e945]
              - text: Consejos AK
            - heading "Contenido para planificar tu evento sin estrés" [level=2] [ref=e947]
            - paragraph [ref=e948]: Guías simples sobre presupuesto, comida, XV años, bodas y listas de organización.
          - link "Ver todos los artículos" [ref=e949] [cursor=pointer]:
            - /url: /public/blog
            - text: Ver todos los artículos
            - img [ref=e950]
        - generic [ref=e952]:
          - link "Organización integral de eventos y fiestas sin estrés Organización - 5 min Cómo empezar a organizar una fiesta sin estrés El orden correcto para pasar de una idea suelta a una fiesta posible, con fecha, invitados, prioridades y presupuesto claro. Leer artículo" [ref=e954] [cursor=pointer]:
            - /url: /public/blog/como-empezar-a-organizar-una-fiesta-sin-estres
            - img "Organización integral de eventos y fiestas sin estrés" [ref=e956]
            - generic [ref=e957]:
              - generic [ref=e958]:
                - generic [ref=e959]:
                  - img [ref=e960]
                  - text: Organización - 5 min
                - heading "Cómo empezar a organizar una fiesta sin estrés" [level=3] [ref=e963]
                - paragraph [ref=e964]: El orden correcto para pasar de una idea suelta a una fiesta posible, con fecha, invitados, prioridades y presupuesto claro.
              - generic [ref=e965]:
                - generic [ref=e966]: Leer artículo
                - img [ref=e967]
          - link "Presupuesto transparente para familias y clientes Presupuesto - 6 min Qué debe incluir un presupuesto de fiesta bien hecho Los puntos que tienen que estar claros para comparar propuestas sin caer en precios incompletos o sorpresas de último momento. Leer artículo" [ref=e970] [cursor=pointer]:
            - /url: /public/blog/presupuesto-de-fiesta-que-debe-incluir
            - img "Presupuesto transparente para familias y clientes" [ref=e972]
            - generic [ref=e973]:
              - generic [ref=e974]:
                - generic [ref=e975]:
                  - img [ref=e976]
                  - text: Presupuesto - 6 min
                - heading "Qué debe incluir un presupuesto de fiesta bien hecho" [level=3] [ref=e978]
                - paragraph [ref=e979]: Los puntos que tienen que estar claros para comparar propuestas sin caer en precios incompletos o sorpresas de último momento.
              - generic [ref=e980]:
                - generic [ref=e981]: Leer artículo
                - img [ref=e982]
          - link "Mesa de catering y gastronomía profesional AK Catering - 5 min Cómo elegir el menú para un evento sin equivocarte Una guía simple para elegir comida abundante, ordenada y acorde al tipo de fiesta, sin perder control del costo. Leer artículo" [ref=e985] [cursor=pointer]:
            - /url: /public/blog/como-elegir-el-menu-para-un-evento
            - img "Mesa de catering y gastronomía profesional AK" [ref=e987]
            - generic [ref=e988]:
              - generic [ref=e989]:
                - generic [ref=e990]:
                  - img [ref=e991]
                  - text: Catering - 5 min
                - heading "Cómo elegir el menú para un evento sin equivocarte" [level=3] [ref=e994]
                - paragraph [ref=e995]: Una guía simple para elegir comida abundante, ordenada y acorde al tipo de fiesta, sin perder control del costo.
              - generic [ref=e996]:
                - generic [ref=e997]: Leer artículo
                - img [ref=e998]
    - generic [ref=e1002]:
      - generic [ref=e1004]:
        - generic [ref=e1005]: Calendario 2026/2027 Abierto
        - heading "¿Listo para crear algo increíble?" [level=2] [ref=e1007]:
          - generic [ref=e1008]: ¿Listo para crear algo increíble?
        - paragraph [ref=e1009]: Consultá tu fecha sin compromiso. Respondemos a la brevedad.
        - generic [ref=e1010]: "🔒 Reserva flexible: Señá tu fecha y armamos un plan de cuotas a tu medida."
        - generic [ref=e1011]:
          - link "Consultar disponibilidad por WhatsApp" [ref=e1012] [cursor=pointer]:
            - /url: https://wa.me/59898355530?text=Hola%20AK%20Producciones%2C%20me%20gustar%C3%ADa%20consultar%20disponibilidad%20para%20mi%20evento.
            - img [ref=e1013]
            - text: Consultar disponibilidad por WhatsApp
          - link "Llamar por teléfono a AK Producciones" [ref=e1015] [cursor=pointer]:
            - /url: tel:+59898355530
            - img [ref=e1016]
            - text: Llamar Directo
        - paragraph [ref=e1020]: O visitanos en redes
        - generic [ref=e1022]:
          - link "Visitar Instagram de AK Producciones" [ref=e1023] [cursor=pointer]:
            - /url: https://www.instagram.com/akproduccionesfiestasyeventos/
            - img [ref=e1024]
          - link "Visitar Facebook de AK Producciones" [ref=e1027] [cursor=pointer]:
            - /url: https://www.facebook.com/akproduccionessalto/
            - img [ref=e1028]
          - link "Visitar TikTok de AK Producciones" [ref=e1030] [cursor=pointer]:
            - /url: https://www.tiktok.com/@akproduccioneseve
            - img [ref=e1031]
      - generic [ref=e1037]:
        - generic [ref=e1038]:
          - generic [ref=e1039]:
            - generic [ref=e1040]:
              - generic [ref=e1041]:
                - generic [ref=e1042]: AK
                - img "AK Producciones" [ref=e1043]
              - generic [ref=e1044]:
                - generic [ref=e1045]: AK Producciones
                - generic [ref=e1046]: Producción Integral de Eventos • Salto, Uruguay
            - paragraph [ref=e1047]: Diseñamos bodas, 15 años y eventos empresariales inolvidables. Gastronomía gourmet, discoteca profesional, salones de gala y tecnología interactiva en un solo lugar.
          - generic [ref=e1048]:
            - link "Consultar disponibilidad por WhatsApp (abre en nueva ventana)" [ref=e1049] [cursor=pointer]:
              - /url: https://wa.me/59898355530?text=%C2%A1Hola%20AK%20Producciones!%20Quisiera%20consultar%20disponibilidad%20para%20mi%20fecha.
              - img [ref=e1053]
              - generic [ref=e1055]: WhatsApp Directo
            - link "Simular mi presupuesto" [ref=e1056] [cursor=pointer]:
              - /url: /simulador-de-presupuesto
              - img [ref=e1057]
              - generic [ref=e1059]: Simular mi presupuesto
        - generic [ref=e1060]:
          - generic [ref=e1061]:
            - heading "Salones Destacados" [level=4] [ref=e1062]:
              - img [ref=e1063]
              - text: Salones Destacados
            - list [ref=e1067]:
              - listitem [ref=e1068]:
                - link "Salón Club Uruguay (Exclusivo)" [ref=e1069] [cursor=pointer]:
                  - /url: /club-uruguay
                  - text: Salón Club Uruguay (Exclusivo)
              - listitem [ref=e1071]:
                - link "Gastronomía Gourmet & Catering" [ref=e1072] [cursor=pointer]:
                  - /url: "#landing-services"
                  - text: Gastronomía Gourmet & Catering
              - listitem [ref=e1074]:
                - link "Discoteca & Pistas de Luces LED" [ref=e1075] [cursor=pointer]:
                  - /url: "#landing-services"
                  - text: Discoteca & Pistas de Luces LED
              - listitem [ref=e1077]:
                - link "Plataforma 360° & Fotocabina QR" [ref=e1078] [cursor=pointer]:
                  - /url: "#landing-technology"
                  - text: Plataforma 360° & Fotocabina QR
          - generic [ref=e1080]:
            - heading "Accesos Rápidos" [level=4] [ref=e1081]:
              - img [ref=e1082]
              - text: Accesos Rápidos
            - list [ref=e1084]:
              - listitem [ref=e1085]:
                - link "→ Simulador de Presupuesto" [ref=e1086] [cursor=pointer]:
                  - /url: /simulador-de-presupuesto
                  - generic [ref=e1087]: →
                  - text: Simulador de Presupuesto
                  - img [ref=e1088]
              - listitem [ref=e1091]:
                - link "→ Galería de Eventos Reales" [ref=e1092] [cursor=pointer]:
                  - /url: "#landing-gallery"
                  - generic [ref=e1093]: →
                  - text: Galería de Eventos Reales
              - listitem [ref=e1094]:
                - link "→ Blog & Guías de Organización" [ref=e1095] [cursor=pointer]:
                  - /url: /public/blog
                  - generic [ref=e1096]: →
                  - text: Blog & Guías de Organización
              - listitem [ref=e1097]:
                - link "→ Testimonios & Preguntas Frecuentes" [ref=e1098] [cursor=pointer]:
                  - /url: "#landing-testimonials-faq"
                  - generic [ref=e1099]: →
                  - text: Testimonios & Preguntas Frecuentes
          - generic [ref=e1100]:
            - heading "Oficina & Atención" [level=4] [ref=e1101]:
              - img [ref=e1102]
              - text: Oficina & Atención
            - generic [ref=e1105]:
              - paragraph [ref=e1106]:
                - img [ref=e1107]
                - generic [ref=e1110]: Salto, Uruguay
              - paragraph [ref=e1111]:
                - img [ref=e1112]
                - link "+598 98 355 530" [ref=e1114] [cursor=pointer]:
                  - /url: tel:+59898355530
              - paragraph [ref=e1115]: Coordinación presencial el día de tu celebración.
          - generic [ref=e1116]:
            - heading "Comunidad & Redes" [level=4] [ref=e1117]:
              - img [ref=e1118]
              - text: Comunidad & Redes
            - paragraph [ref=e1120]: Seguinos en redes para ver coberturas en vivo, montajes reales y salones armados.
            - generic [ref=e1121]:
              - link "Visitar Instagram de AK Producciones (abre en nueva ventana)" [ref=e1122] [cursor=pointer]:
                - /url: https://www.instagram.com/akproduccionesfiestasyeventos/
                - img [ref=e1123]
              - link "Visitar Facebook de AK Producciones (abre en nueva ventana)" [ref=e1126] [cursor=pointer]:
                - /url: https://www.facebook.com/akproduccionessalto/
                - img [ref=e1127]
              - link "Visitar Pinterest de AK Producciones (abre en nueva ventana)" [ref=e1129] [cursor=pointer]:
                - /url: https://es.pinterest.com/akproduccionessalto/
                - img [ref=e1130]
              - link "Visitar WhatsApp de AK Producciones (abre en nueva ventana)" [ref=e1132] [cursor=pointer]:
                - /url: https://wa.me/59898355530?text=%C2%A1Hola%20AK%20Producciones!%20Quisiera%20consultar%20por%20mi%20evento.
                - img [ref=e1133]
              - link "Visitar TikTok de AK Producciones (abre en nueva ventana)" [ref=e1135] [cursor=pointer]:
                - /url: https://www.tiktok.com/@akproduccioneseve
                - img [ref=e1136]
        - generic [ref=e1140]:
          - generic [ref=e1141]:
            - paragraph [ref=e1142]: © 2026 AK Producciones Eventos. Todos los derechos reservados.
            - paragraph [ref=e1143]:
              - text: Tus datos se tratan según la
              - link "Ley 18.331" [ref=e1144] [cursor=pointer]:
                - /url: /privacidad
              - text: de Protección de Datos Personales.
          - generic [ref=e1145]:
            - link "Club Uruguay" [ref=e1146] [cursor=pointer]:
              - /url: /club-uruguay
            - link "Simulador" [ref=e1147] [cursor=pointer]:
              - /url: /simulador-de-presupuesto
            - link "Privacidad" [ref=e1148] [cursor=pointer]:
              - /url: /privacidad
            - link "Acceso Staff" [ref=e1149] [cursor=pointer]:
              - /url: /login
    - generic [ref=e1150]:
      - link "Simular mi presupuesto" [ref=e1151] [cursor=pointer]:
        - /url: /simulador-de-presupuesto
        - img [ref=e1152]
      - link "Escribinos por WhatsApp" [ref=e1154] [cursor=pointer]:
        - /url: https://wa.me/59898355530?text=%F0%9F%91%8B%20%C2%A1Hola!%20Me%20gustar%C3%ADa%20cotizar%20y%20obtener%20informaci%C3%B3n%20sobre%20los%20servicios%20de%20AK%20Producciones.
        - img [ref=e1158]
  - region "Notifications (F8)":
    - list
  - alert [ref=e1160]
```

# Test source

```ts
  1   | import { expect, test, type Page, type TestInfo } from '@playwright/test';
  2   |
  3   | const BASE_URL = 'http://127.0.0.1:3300';
  4   | const AISLADO = process.env.AK_ENTORNO_AISLADO === 'true'
  5   |   && process.env.AK_USE_LOCAL_JSON_ONLY === 'true'
  6   |   && process.env.PLAYWRIGHT_BASE_URL?.replace(/\/$/, '') === BASE_URL;
  7   | const GALERIA = '[data-testid="gallery-section"]';
  8   | const DIALOGO = '[role="dialog"][aria-label="Vista ampliada de la galería"]';
  9   | const CERRAR = 'button[aria-label="Cerrar galería"]';
  10  | const FOTOS = ['Prueba nativa galería 166 foto uno', 'Prueba nativa galería 166 foto dos'];
  11  | const SVG_QA = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="20" viewBox="0 0 32 20"><rect width="32" height="20" fill="#d71920"/></svg>';
  12  |
  13  | test.use({ serviceWorkers: 'block', baseURL: BASE_URL });
  14  | test.skip(!AISLADO, 'Solo runner ficticio local: AK_ENTORNO_AISLADO, AK_USE_LOCAL_JSON_ONLY y 127.0.0.1:3300 requeridos.');
  15  |
  16  | async function guardarEvidencia(page: Page, testInfo: TestInfo, observations: Record<string, unknown>) {
  17  |   observations.finalUrl = page.url();
  18  |   observations.finalFocus = await page.evaluate(() => {
  19  |     const active = document.activeElement;
  20  |     return active instanceof HTMLElement
  21  |       ? { tag: active.tagName, text: active.getAttribute('aria-label') || active.innerText?.trim().slice(0, 100) || '' }
  22  |       : null;
  23  |   }).catch((error: unknown) => ({ error: String(error) }));
  24  |   await testInfo.attach('166-observed.json', {
  25  |     contentType: 'application/json',
  26  |     body: JSON.stringify(observations, null, 2),
  27  |   });
  28  |   await testInfo.attach('166-gallery.png', {
  29  |     contentType: 'image/png',
  30  |     body: await page.screenshot({ fullPage: true }).catch(() => Buffer.from('')),
  31  |   });
  32  | }
  33  |
  34  | async function preparar(page: Page, testInfo: TestInfo, observations: Record<string, unknown>) {
  35  |   await page.route('**/*', async (route) => {
  36  |     const url = new URL(route.request().url());
  37  |     if (route.request().resourceType() === 'image') {
  38  |       await route.fulfill({ status: 200, contentType: 'image/svg+xml', body: SVG_QA });
  39  |       return;
  40  |     }
  41  |     if (/^https?:$/.test(url.protocol) && !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) {
  42  |       if (route.request().resourceType() === 'image') {
  43  |         await route.fulfill({ status: 200, contentType: 'image/svg+xml', body: SVG_QA });
  44  |       } else {
  45  |         observations.blockedExternal = [...((observations.blockedExternal as string[] | undefined) || []), `${url.origin}${url.pathname}`];
  46  |         await route.abort('blockedbyclient');
  47  |       }
  48  |       return;
  49  |     }
  50  |     await route.continue();
  51  |   });
  52  |
  53  |   const health = await page.request.get('/api/health');
  54  |   const body = await health.json().catch(() => ({}));
  55  |   observations.health = { status: health.status(), version: body.version, services: body.services };
  56  |   expect(health.ok(), 'health local debe responder').toBe(true);
  57  |   expect(body.version, 'health debe identificar fuente Claude108e').toMatch(/^108e/);
  58  |   expect(body.services).toBeTruthy();
  59  |   for (const [name, active] of Object.entries(body.services)) {
  60  |     expect(active, `health.services.${name} debe permanecer desactivado`).toBe(false);
  61  |   }
  62  |   await page.goto('/#landing-gallery', { waitUntil: 'domcontentloaded' });
  63  |   const section = page.locator(GALERIA);
> 64  |   await expect(section).toBeVisible();
      |                         ^ Error: expect(locator).toBeVisible() failed
  65  |   await expect(section).not.toHaveAttribute('aria-busy', 'true');
  66  |   for (const title of FOTOS) await expect(section.getByRole('button', { name: new RegExp(title) })).toBeVisible();
  67  |   observations.galleryLoaded = true;
  68  | }
  69  |
  70  | test('Pixel 7: abre tarjeta, enfoca cerrar, navega con flechas, Escape cierra y devuelve foco', async ({ page }, testInfo) => {
  71  |   testInfo.setTimeout(90_000);
  72  |   const observed: Record<string, unknown> = { source: 'Claude108e17b4387237fc921ea12e8d1eb65b20f62ac9', device: 'Pixel 7', case: 'entrada-flechas-escape-retorno' };
  73  |   try {
  74  |     await preparar(page, testInfo, observed);
  75  |     const section = page.locator(GALERIA);
  76  |     const firstCard = section.getByRole('button', { name: new RegExp(FOTOS[0]) });
  77  |     await firstCard.scrollIntoViewIfNeeded();
  78  |     await firstCard.tap();
  79  |     const dialog = page.locator(DIALOGO);
  80  |     await expect(dialog).toBeVisible();
  81  |     await expect.poll(() => page.evaluate(() => document.activeElement?.getAttribute('aria-label'))).toBe('Cerrar galería');
  82  |     observed.opened = true;
  83  |     observed.autofocusClose = await page.evaluate(() => document.activeElement?.getAttribute('aria-label'));
  84  |     const initialPicture = await dialog.locator('img').getAttribute('src');
  85  |     await page.keyboard.press('ArrowRight');
  86  |     await expect.poll(() => dialog.locator('img').getAttribute('src')).not.toBe(initialPicture);
  87  |     observed.arrowRight = true;
  88  |     await page.keyboard.press('ArrowLeft');
  89  |     await expect(dialog.locator('img')).toHaveAttribute('src', initialPicture!);
  90  |     observed.arrowLeft = true;
  91  |
  92  |     await page.keyboard.press('Escape');
  93  |     await expect(dialog).toBeHidden();
  94  |     await expect(firstCard).toBeFocused();
  95  |     observed.escapeAndReturn = true;
  96  |   } finally {
  97  |     await guardarEvidencia(page, testInfo, observed);
  98  |   }
  99  | });
  100 |
  101 | test('Chromium desktop: Tab y Shift+Tab nativos permanecen dentro del visor abierto', async ({ page }, testInfo) => {
  102 |   testInfo.setTimeout(90_000);
  103 |   const observed: Record<string, unknown> = { source: 'Claude108e17b4387237fc921ea12e8d1eb65b20f62ac9', device: 'Desktop Chrome', case: 'native-tab-containment' };
  104 |   try {
  105 |     await preparar(page, testInfo, observed);
  106 |     const section = page.locator(GALERIA);
  107 |     const firstCard = section.getByRole('button', { name: new RegExp(FOTOS[0]) });
  108 |     await firstCard.scrollIntoViewIfNeeded();
  109 |     await firstCard.click();
  110 |     const dialog = page.locator(DIALOGO);
  111 |     await expect(dialog).toBeVisible();
  112 |     await expect.poll(() => page.evaluate(() => document.activeElement?.getAttribute('aria-label'))).toBe('Cerrar galería');
  113 |
  114 |     const focusables = dialog.locator('button:visible');
  115 |     const count = await focusables.count();
  116 |     expect(count).toBeGreaterThanOrEqual(4);
  117 |     const focusState = async () => page.evaluate(() => {
  118 |       const active = document.activeElement;
  119 |       const dialogNode = document.querySelector('[role="dialog"][aria-label="Vista ampliada de la galería"]');
  120 |       return { inside: Boolean(active && dialogNode?.contains(active)), label: active?.getAttribute('aria-label') || '' };
  121 |     });
  122 |
  123 |     for (let i = 0; i < count + 2; i++) {
  124 |       await page.keyboard.press('Tab');
  125 |       const state = await focusState();
  126 |       observed.tabSteps = [...((observed.tabSteps as unknown[]) || []), state];
  127 |       if (!state.inside) break;
  128 |     }
  129 |     await dialog.locator(CERRAR).focus();
  130 |     for (let i = 0; i < count + 2; i++) {
  131 |       await page.keyboard.press('Shift+Tab');
  132 |       const state = await focusState();
  133 |       observed.shiftTabSteps = [...((observed.shiftTabSteps as unknown[]) || []), state];
  134 |       if (!state.inside) break;
  135 |     }
  136 |     const forward = (observed.tabSteps as Array<{ inside: boolean }>).every(s => s.inside);
  137 |     const backward = (observed.shiftTabSteps as Array<{ inside: boolean }>).every(s => s.inside);
  138 |     observed.nativeTabContainment = forward && backward;
  139 |     expect.soft(forward, 'Tab nativo no debe sacar el foco del visor').toBe(true);
  140 |     expect.soft(backward, 'Shift+Tab nativo no debe sacar el foco del visor').toBe(true);
  141 |     await page.keyboard.press('Escape');
  142 |     await expect(dialog).toBeHidden();
  143 |     await expect(firstCard).toBeFocused();
  144 |   } finally {
  145 |     await guardarEvidencia(page, testInfo, observed);
  146 |   }
  147 | });
  148 |
```