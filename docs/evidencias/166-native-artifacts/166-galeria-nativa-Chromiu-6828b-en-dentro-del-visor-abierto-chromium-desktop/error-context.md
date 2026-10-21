# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 166-galeria-nativa.spec.ts >> Chromium desktop: Tab y Shift+Tab nativos permanecen dentro del visor abierto
- Location: tests\e2e\166-galeria-nativa.spec.ts:101:5

# Error details

```
Error: Tab nativo no debe sacar el foco del visor

expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

```
Error: Shift+Tab nativo no debe sacar el foco del visor

expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e5]:
    - generic [ref=e8]:
      - generic [ref=e11]:
        - link "AK Producciones AK Producciones" [ref=e12] [cursor=pointer]:
          - /url: /
          - img "AK Producciones" [ref=e14]
          - generic [ref=e15]: AK Producciones
        - navigation [ref=e16]:
          - link "Inicio" [ref=e17] [cursor=pointer]:
            - /url: /#landing-hero
          - link "Servicios" [ref=e18] [cursor=pointer]:
            - /url: /#landing-services
          - link "Galería HD" [ref=e19] [cursor=pointer]:
            - /url: /#landing-gallery
          - link "Simulador" [ref=e20] [cursor=pointer]:
            - /url: /simulador-de-presupuesto
          - link "Blog" [ref=e21] [cursor=pointer]:
            - /url: /public/blog
          - link "Preguntas Frecuentes" [ref=e22] [cursor=pointer]:
            - /url: /#faq
          - link "Club Uruguay" [ref=e23] [cursor=pointer]:
            - /url: /club-uruguay
        - link "Simular mi presupuesto" [ref=e25] [cursor=pointer]:
          - /url: /simulador-de-presupuesto
      - generic [ref=e26]:
        - img "Fiesta de quince años producida por AK Producciones" [ref=e28]
        - generic [ref=e31]:
          - paragraph [ref=e32]:
            - img [ref=e33]
            - text: AK Producciones Eventos · Salto, Uruguay
          - heading "Organizá tu fiesta completa en Salto con AK Producciones" [level=1] [ref=e35]
          - paragraph [ref=e36]: Salón, comida, discoteca, decoración, fotografía, filmación, barra y coordinación en un solo lugar.
          - generic [ref=e37]:
            - generic [ref=e38]: Comida gourmet y barra
            - generic [ref=e40]: Ambientación y mobiliario
            - generic [ref=e42]: Discoteca, pantallas y luces
          - generic [ref=e45]:
            - generic [ref=e46]:
              - generic [ref=e47]: Tipo de evento
              - combobox "Tipo de evento" [ref=e48]:
                - option "15 Años" [selected]
                - option "Bodas"
                - option "Sociales"
                - option "Empresariales"
            - generic [ref=e49]:
              - generic [ref=e50]: Mes y año estimado
              - textbox "Mes y año estimado" [ref=e51]: 2026-12
            - generic [ref=e52]:
              - generic [ref=e53]: Invitados aprox.
              - spinbutton "Invitados aprox." [ref=e54]: "100"
            - link "Consultar disponibilidad de fecha" [ref=e56] [cursor=pointer]:
              - /url: /simulador-de-presupuesto?tipo=15%20A%C3%B1os&guests=100&mes=2026-12&entry=hero-fecha
              - img [ref=e57]
              - generic [ref=e59]: Consultar disponibilidad de fecha
          - generic [ref=e60]:
            - link "Simular mi presupuesto" [ref=e62] [cursor=pointer]:
              - /url: /simulador-de-presupuesto
              - text: Simular mi presupuesto
              - img [ref=e63]
            - link "Consultar disponibilidad por WhatsApp" [ref=e66] [cursor=pointer]:
              - /url: https://wa.me/59898355530?text=Hola%20AK%20Producciones%2C%20quisiera%20consultar%20disponibilidad%20para%20mi%20fiesta.
              - img [ref=e67]
              - text: Consultar disponibilidad por WhatsApp
    - generic [ref=e72]:
      - generic [ref=e73]:
        - generic [ref=e74]:
          - paragraph [ref=e75]: Producción integral AK
          - heading "Una sola conversación. Todos los servicios que tu fiesta necesita." [level=2] [ref=e76]
        - paragraph [ref=e77]: Reunimos catering, barra, ambientación, mobiliario, discoteca, tecnología y coordinación. Cada propuesta se adapta a tu fecha, estilo e invitados.
      - generic [ref=e78]:
        - link "Bodas, producción de AK Producciones Bodas Ceremonia, cena y fiesta coordinadas por un mismo equipo. Ver propuesta" [ref=e80] [cursor=pointer]:
          - /url: /simulador-de-presupuesto?tipo=boda
          - img "Bodas, producción de AK Producciones" [ref=e82]
          - generic [ref=e83]:
            - img [ref=e85]
            - heading "Bodas" [level=3] [ref=e87]
            - paragraph [ref=e88]: Ceremonia, cena y fiesta coordinadas por un mismo equipo.
            - generic [ref=e89]:
              - text: Ver propuesta
              - img [ref=e90]
        - link "Fiestas de 15, producción de AK Producciones Fiestas de 15 Una noche personal, con pista, recuerdos y energía para celebrar. Ver propuesta" [ref=e93] [cursor=pointer]:
          - /url: /simulador-de-presupuesto?tipo=15-anos
          - img "Fiestas de 15, producción de AK Producciones" [ref=e95]
          - generic [ref=e96]:
            - img [ref=e98]
            - heading "Fiestas de 15" [level=3] [ref=e100]
            - paragraph [ref=e101]: Una noche personal, con pista, recuerdos y energía para celebrar.
            - generic [ref=e102]:
              - text: Ver propuesta
              - img [ref=e103]
        - link "Cumpleaños y sociales, producción de AK Producciones Cumpleaños y sociales Gastronomía, barra y música pensadas según cada grupo. Ver propuesta" [ref=e106] [cursor=pointer]:
          - /url: /simulador-de-presupuesto?tipo=social
          - img "Cumpleaños y sociales, producción de AK Producciones" [ref=e108]
          - generic [ref=e109]:
            - img [ref=e111]
            - heading "Cumpleaños y sociales" [level=3] [ref=e113]
            - paragraph [ref=e114]: Gastronomía, barra y música pensadas según cada grupo.
            - generic [ref=e115]:
              - text: Ver propuesta
              - img [ref=e116]
        - link "Eventos empresariales, producción de AK Producciones Eventos empresariales Recepciones y encuentros con puesta técnica y operativa. Ver propuesta" [ref=e119] [cursor=pointer]:
          - /url: /simulador-de-presupuesto?tipo=corporativo
          - img "Eventos empresariales, producción de AK Producciones" [ref=e121]
          - generic [ref=e122]:
            - img [ref=e124]
            - heading "Eventos empresariales" [level=3] [ref=e128]
            - paragraph [ref=e129]: Recepciones y encuentros con puesta técnica y operativa.
            - generic [ref=e130]:
              - text: Ver propuesta
              - img [ref=e131]
    - generic [ref=e134]:
      - generic [ref=e136]:
        - generic [ref=e137]:
          - generic [ref=e138]:
            - generic [ref=e139]: ✨ El Valor de la Tranquilidad
            - 'heading "No vendemos luces ni sonido: diseñamos tu tranquilidad" [level=2] [ref=e140]'
            - paragraph [ref=e141]: El verdadero lujo es llegar al día de tu evento sin estrés. Olvidate de perseguir proveedores o comparar presupuestos incompletos.
          - generic [ref=e142]:
            - generic [ref=e143]:
              - img [ref=e145]
              - generic [ref=e148]:
                - heading "Disfrutá, nosotros nos encargamos" [level=3] [ref=e149]
                - paragraph [ref=e150]: AK coordina el salón, los tiempos, el staff y los detalles para que tu única responsabilidad sea divertirte como un invitado más.
            - generic [ref=e151]:
              - img [ref=e153]
              - generic [ref=e155]:
                - heading "Cero sorpresas ni intermediarios" [level=3] [ref=e156]
                - paragraph [ref=e157]: Desde la gastronomía gourmet hasta la discoteca y pantallas LED, todo funciona bajo una misma visión integral. Menos proveedores, todo coordinado por el mismo equipo.
            - generic [ref=e158]:
              - img [ref=e160]
              - generic [ref=e163]:
                - heading "Presupuesto claro y completo" [level=3] [ref=e164]
                - paragraph [ref=e165]: Un precio transparente que cubre todo lo que realmente necesitás, sin costos ocultos de último momento ni dolores de cabeza.
        - generic [ref=e166]:
          - generic [ref=e167]:
            - img "Equipo de organización AK Producciones" [ref=e168]
            - generic [ref=e170]:
              - text: Trabajo en equipo
              - paragraph [ref=e171]: Personas reales cuidando cada detalle
          - generic [ref=e172]:
            - img [ref=e174]
            - paragraph [ref=e177]: Reserva de fecha confirmada, plan de pagos claro y un equipo entero a tu disposición.
      - generic [ref=e179]:
        - generic [ref=e180]:
          - generic [ref=e181]:
            - generic [ref=e182]: Trayectoria AK
            - heading "Números que respaldan cada evento" [level=2] [ref=e183]
          - paragraph [ref=e184]: Experiencia real, atención cercana y producción integral para que la fiesta no dependa de improvisar.
        - generic [ref=e185]:
          - article [ref=e186]:
            - generic [ref=e188]: 🎉
            - generic [ref=e189]: "+200"
            - generic [ref=e190]: Eventos Realizados
          - article [ref=e191]:
            - generic [ref=e193]: ⭐
            - generic [ref=e194]: "+7"
            - generic [ref=e195]: Años de Experiencia
          - article [ref=e196]:
            - generic [ref=e198]: ❤️
            - generic [ref=e199]: Clientes
            - generic [ref=e200]: Satisfechos
      - generic [ref=e202]:
        - generic [ref=e203]:
          - generic [ref=e204]:
            - img [ref=e205]
            - text: Nuestra Historia y Compromiso
          - heading "El valor de contar con un equipo completo" [level=2] [ref=e210]
          - paragraph [ref=e211]: Desde la primera entrevista hasta el último tema de la noche, cada parte de la fiesta se coordina en conjunto para que no tengas que preocuparte por nada.
        - generic [ref=e212]:
          - article [ref=e213]:
            - generic [ref=e214]:
              - img "Planificación Profesional" [ref=e215]
              - generic [ref=e217]:
                - img [ref=e218]
                - text: Equipo AK
            - generic [ref=e220]:
              - heading "Planificación Profesional" [level=3] [ref=e221]
              - paragraph [ref=e222]: Un organizador experto escucha tu idea, proyecta el presupuesto y planifica cada paso de forma ordenada.
          - article [ref=e223]:
            - generic [ref=e224]:
              - img "Coordinación y Montaje" [ref=e225]
              - generic [ref=e227]:
                - img [ref=e228]
                - text: Equipo AK
            - generic [ref=e230]:
              - heading "Coordinación y Montaje" [level=3] [ref=e231]
              - paragraph [ref=e232]: Nuestro equipo monta la decoración, la gastronomía, la discoteca y la tecnología bajo un control estricto.
          - article [ref=e233]:
            - generic [ref=e234]:
              - img "Festejo en Familia" [ref=e235]
              - generic [ref=e237]:
                - img [ref=e238]
                - text: Equipo AK
            - generic [ref=e240]:
              - heading "Festejo en Familia" [level=3] [ref=e241]
              - paragraph [ref=e242]: Creamos la puesta en escena perfecta para que tu familia disfrute sin estrés, guardando recuerdos inolvidables.
    - generic [ref=e246]:
      - generic [ref=e247]:
        - generic [ref=e248]:
          - paragraph [ref=e249]:
            - img [ref=e250]
            - text: Salón destacado
          - heading "Club Uruguay" [level=2] [ref=e254]
          - paragraph [ref=e255]: Un espacio emblemático en el centro de Salto, preparado por AK Producciones con catering, música, ambientación, personal y tecnología coordinados en una sola propuesta.
          - generic [ref=e257]:
            - img [ref=e258]
            - paragraph [ref=e261]: Pleno centro de Salto
            - paragraph [ref=e262]: Club Uruguay, ubicación estratégica e histórica.
          - generic [ref=e263]:
            - link "Conocer el salón" [ref=e265] [cursor=pointer]:
              - /url: /club-uruguay
              - text: Conocer el salón
              - img [ref=e266]
            - link "Simular mi presupuesto" [ref=e269] [cursor=pointer]:
              - /url: /simulador-de-presupuesto?salon=club
              - img [ref=e270]
              - text: Simular mi presupuesto
        - generic [ref=e272]:
          - figure "Salón principal" [ref=e273]:
            - img "Salón principal de Club Uruguay preparado para una fiesta" [ref=e274]
            - paragraph [ref=e277]: Salón principal
          - generic [ref=e278]:
            - figure "Pista y discoteca":
              - img "Pista y discoteca instaladas en Club Uruguay"
              - generic [ref=e279]: Pista y discoteca
            - figure "Una fiesta en funcionamiento":
              - img "Fiesta de quince años con pista iluminada"
              - generic [ref=e280]: Una fiesta en funcionamiento
      - generic [ref=e281]:
        - heading "Ficha técnica del salón" [level=3] [ref=e282]
        - generic [ref=e283]:
          - generic [ref=e284]:
            - img [ref=e285]
            - generic [ref=e288]: Pleno centro de Salto
            - generic [ref=e289]: Acceso inmejorable
          - generic [ref=e290]:
            - img [ref=e291]
            - generic [ref=e295]: Climatización
            - generic [ref=e296]: Frío y calor
          - generic [ref=e297]:
            - img [ref=e298]
            - generic [ref=e302]: Recepción, salón principal y pista LED
            - generic [ref=e303]: Espacios integrados
          - generic [ref=e304]:
            - img [ref=e305]
            - generic [ref=e310]: Cocina equipada para catering
            - generic [ref=e311]: Instalaciones completas
          - generic [ref=e312]:
            - img [ref=e313]
            - generic [ref=e316]: Personal de baños durante todo el evento
            - generic [ref=e317]: Higiene permanente
    - generic [ref=e320]:
      - generic [ref=e322]:
        - generic [ref=e323]:
          - generic [ref=e324]:
            - img [ref=e325]
            - text: Tecnología AK para Eventos
          - heading "La app de tu fiesta" [level=2] [ref=e327]
          - paragraph [ref=e328]: Organizá los detalles, invitá a los tuyos y compartí los recuerdos desde un mismo lugar. Diseñada para que la fiesta se disfrute en la pista y en cada celular.
        - generic [ref=e330]:
          - button "1. Antes Portal Cliente Planificación sin fricción" [pressed] [ref=e331] [cursor=pointer]:
            - generic [ref=e332]:
              - img [ref=e334]
              - generic [ref=e337]: 1. Antes
            - generic [ref=e338]:
              - paragraph [ref=e339]: Portal Cliente
              - paragraph [ref=e340]: Planificación sin fricción
          - button "2. Invitación Invitación Acceso digital al instante" [ref=e341] [cursor=pointer]:
            - generic [ref=e342]:
              - img [ref=e344]
              - generic [ref=e347]: 2. Invitación
            - generic [ref=e348]:
              - paragraph [ref=e349]: Invitación
              - paragraph [ref=e350]: Acceso digital al instante
          - button "3. Durante Mural en Vivo Mural y DJ en vivo" [ref=e351] [cursor=pointer]:
            - generic [ref=e352]:
              - img [ref=e354]
              - generic [ref=e356]: 3. Durante
            - generic [ref=e357]:
              - paragraph [ref=e358]: Mural en Vivo
              - paragraph [ref=e359]: Mural y DJ en vivo
          - button "4. Barra y Tótem Barra & Cócteles Carta digital y pedidos" [ref=e360] [cursor=pointer]:
            - generic [ref=e361]:
              - img [ref=e363]
              - generic [ref=e366]: 4. Barra y Tótem
            - generic [ref=e367]:
              - paragraph [ref=e368]: Barra & Cócteles
              - paragraph [ref=e369]: Carta digital y pedidos
          - button "5. Después Recuerdos Recuerdos intactos" [ref=e370] [cursor=pointer]:
            - generic [ref=e371]:
              - img [ref=e373]
              - generic [ref=e377]: 5. Después
            - generic [ref=e378]:
              - paragraph [ref=e379]: Recuerdos
              - paragraph [ref=e380]: Recuerdos intactos
        - generic [ref=e382]:
          - generic [ref=e383]:
            - generic [ref=e384]:
              - img [ref=e385]
              - text: Planificación sin fricción
            - generic [ref=e388]:
              - 'heading "Portal del cliente: decisiones y acuerdos en orden" [level=3] [ref=e389]'
              - paragraph [ref=e390]: Menú, selección musical, decoración y tareas organizadas sin perderte en chats.
            - generic [ref=e392]:
              - img [ref=e393]
              - generic [ref=e396]:
                - paragraph [ref=e397]: Lo que sentís como cliente
                - paragraph [ref=e398]: “Organizás tu fiesta sin perder conversaciones en chats ni papeles sueltos.”
            - generic [ref=e399]:
              - link "Simular mi presupuesto" [ref=e400] [cursor=pointer]:
                - /url: /simulador-de-presupuesto
                - text: Simular mi presupuesto
                - img [ref=e401]
              - link "Consultar disponibilidad por WhatsApp" [ref=e403] [cursor=pointer]:
                - /url: https://wa.me/59898355530?text=Hola%2C%20estuve%20viendo%20%22La%20app%20de%20tu%20fiesta%22%20(Portal%20del%20cliente%3A%20decisiones%20y%20acuerdos%20en%20orden)%20en%20el%20sitio%20web%20de%20AK%20y%20me%20interesa%20saber%20m%C3%A1s%20para%20mi%20evento.
            - paragraph [ref=e404]: "* Muestra interactiva pedagógica con datos de prueba. No publica ni emite mensajes reales."
          - generic [ref=e406]:
            - generic [ref=e407]:
              - generic [ref=e408]:
                - generic [ref=e410]: DEMO EN VIVO
                - generic [ref=e411]: • 15 de Camila (Muestra)
              - generic [ref=e412]: Modo seguro
            - generic [ref=e413]:
              - generic [ref=e414]:
                - button "Menú & Platos" [ref=e415] [cursor=pointer]
                - button "Música elegida" [ref=e416] [cursor=pointer]
                - button "Mural de Deco" [ref=e417] [cursor=pointer]
              - generic [ref=e418]:
                - generic [ref=e419]:
                  - generic [ref=e420]: Propuesta Gastronómica Aprobada
                  - generic [ref=e421]: Confirmado
                - paragraph [ref=e422]: Recepción de bocados calientes + Asado Criollo Premium.
                - generic [ref=e423]:
                  - generic [ref=e424]:
                    - text: 🍽️
                    - strong [ref=e425]: "Celíacos:"
                    - text: 3 menúes adaptados
                  - generic [ref=e426]:
                    - text: 🥗
                    - strong [ref=e427]: "Vegetarianos:"
                    - text: 4 opciones gourmet
              - generic [ref=e428]:
                - generic [ref=e429]: 💬 Conversación centralizada con tu productor asignado
                - generic [ref=e430]: Al día
        - generic [ref=e431]:
          - paragraph [ref=e432]: ¿Querés ver cómo se adapta la app a tu tipo de fiesta?
          - paragraph [ref=e433]: Los módulos contratados se integran a tu presupuesto personalizado (cumpleaños de 15, bodas, empresariales o infantiles).
          - link "Hablar con un asesor por WhatsApp" [ref=e435] [cursor=pointer]:
            - /url: https://wa.me/59898355530?text=Hola%2C%20estuve%20viendo%20%22La%20app%20de%20tu%20fiesta%22%20(Portal%20del%20cliente%3A%20decisiones%20y%20acuerdos%20en%20orden)%20en%20el%20sitio%20web%20de%20AK%20y%20me%20interesa%20saber%20m%C3%A1s%20para%20mi%20evento.
            - text: Hablar con un asesor por WhatsApp
            - img [ref=e436]
      - generic [ref=e438]:
        - paragraph [ref=e439]: Y además, las estaciones que se montan en tu fiesta
        - generic [ref=e441]:
          - generic [ref=e442]:
            - generic [ref=e443]:
              - img [ref=e444]
              - text: Tecnología Interactiva · AK Producciones
            - heading "Experiencias que hacen tu fiesta inolvidable" [level=2] [ref=e446]
            - paragraph [ref=e447]: "No es sólo equipamiento: es diversión en vivo, recuerdos impresos en el momento y conexión real con cada uno de tus invitados."
          - generic [ref=e448]:
            - button "Impacto visual y viral Fotos, videos 360 y efectos IA" [ref=e449] [cursor=pointer]:
              - generic [ref=e450]: Impacto visual y viral
              - generic [ref=e451]: Fotos, videos 360 y efectos IA
            - button "Emoción y recuerdos Voces, historias y afectos" [ref=e452] [cursor=pointer]:
              - generic [ref=e453]: Emoción y recuerdos
              - generic [ref=e454]: Voces, historias y afectos
            - button "Interacción en pista Pantallas, QR y participación en vivo" [ref=e455] [cursor=pointer]:
              - generic [ref=e456]: Interacción en pista
              - generic [ref=e457]: Pantallas, QR y participación en vivo
          - generic [ref=e458]:
            - button "Tótem Touch IA" [ref=e459] [cursor=pointer]:
              - img [ref=e460]
              - text: Tótem Touch IA
            - button "Plataforma 360° Video" [ref=e463] [cursor=pointer]:
              - img [ref=e464]
              - text: Plataforma 360° Video
            - button "Vogue Boomerang & GIFs" [ref=e467] [cursor=pointer]:
              - img [ref=e468]
              - text: Vogue Boomerang & GIFs
            - button "Espejo Mágico Interactivo" [ref=e470] [cursor=pointer]:
              - img [ref=e471]
              - text: Espejo Mágico Interactivo
            - button "Fotocabina Impresa" [ref=e474] [cursor=pointer]:
              - img [ref=e475]
              - text: Fotocabina Impresa
          - generic [ref=e478]:
            - generic [ref=e479]:
              - generic [ref=e480]:
                - generic [ref=e482]: Exclusivo con IA
                - heading "Tótem Touch IA" [level=3] [ref=e483]
                - paragraph [ref=e484]: Transforma la foto del invitado en personajes y estilos con inteligencia artificial
                - paragraph [ref=e485]: Tus invitados posan frente a la pantalla táctil y el sistema de IA los convierte en superhéroes, personajes temáticos o retratos artísticos al instante, listos para descargar por QR o imprimir.
              - generic [ref=e486]:
                - generic [ref=e487]:
                  - img [ref=e489]
                  - heading "Estilos IA automáticos" [level=4] [ref=e491]
                  - paragraph [ref=e492]: Convierte retratos en héroes, realeza o arte digital en segundos.
                - generic [ref=e493]:
                  - img [ref=e495]
                  - heading "Fácil para todas las edades" [level=4] [ref=e498]
                  - paragraph [ref=e499]: Tocan la pantalla, sonríen y el tótem hace la magia.
                - generic [ref=e500]:
                  - img [ref=e502]
                  - heading "Descarga instantánea" [level=4] [ref=e508]
                  - paragraph [ref=e509]: Cada invitado se lleva su retrato digital directamente al celular.
              - generic [ref=e510]:
                - link "Incluir en mi simulación" [ref=e511] [cursor=pointer]:
                  - /url: /simulador-de-presupuesto?extra=serv_espejo_magico_ia
                  - img [ref=e512]
                  - text: Incluir en mi simulación
                - link "Quiero Tótem Touch IA" [ref=e514] [cursor=pointer]:
                  - /url: https://wa.me/59898355530?text=%C2%A1Hola!%20Me%20interes%C3%B3%20la%20tecnolog%C3%ADa%20de%20T%C3%B3tem%20Touch%20IA%20para%20mi%20evento.%20%C2%BFMe%20pueden%20pasar%20info%20y%20disponibilidad%3F
                  - text: Quiero Tótem Touch IA
                  - img [ref=e515]
                - link "Simular mi presupuesto" [ref=e517] [cursor=pointer]:
                  - /url: /simulador-de-presupuesto
            - generic [ref=e520]:
              - generic [ref=e521]:
                - generic [ref=e522]:
                  - img [ref=e523]
                  - text: Demostración interactiva
                - generic [ref=e525]: Ejemplo IA
              - paragraph [ref=e526]: "Así transforma el Tótem Touch IA la foto de tus invitados en tiempo real:"
              - generic [ref=e527]:
                - generic [ref=e528]:
                  - img "Foto original del invitado" [ref=e530]
                  - generic [ref=e531]: Antes (Original)
                - generic [ref=e532]:
                  - generic [ref=e533]:
                    - img "Transformación con inteligencia artificial" [ref=e534]
                    - generic [ref=e535]: Estilo IA
                  - generic [ref=e536]: Después (IA)
              - list [ref=e537]:
                - listitem [ref=e538]:
                  - img [ref=e539]
                  - generic [ref=e542]: Transformación facial con IA
                - listitem [ref=e543]:
                  - img [ref=e544]
                  - generic [ref=e547]: Temas y personajes de fiesta
                - listitem [ref=e548]:
                  - img [ref=e549]
                  - generic [ref=e552]: Descarga por código QR
                - listitem [ref=e553]:
                  - img [ref=e554]
                  - generic [ref=e557]: Impresión opcional en el acto
    - generic [ref=e560]:
      - generic [ref=e562]:
        - generic [ref=e563]:
          - img [ref=e564]
          - text: Galería y Producciones Reales
        - heading "Nuestros eventos en imágenes y movimiento" [level=2] [ref=e566]
        - generic [ref=e567]:
          - button "Fotos de montajes" [ref=e568] [cursor=pointer]:
            - img [ref=e569]
            - text: Fotos de montajes
          - button "Videos de fiestas reales" [ref=e572] [cursor=pointer]:
            - img [ref=e573]
            - text: Videos de fiestas reales
          - button "Video-testimonios" [ref=e575] [cursor=pointer]:
            - img [ref=e576]
            - text: Video-testimonios
      - generic [ref=e584]:
        - generic [ref=e586]:
          - paragraph [ref=e587]: Eventos reales
          - heading "Galería de eventos" [level=2] [ref=e588]
          - paragraph [ref=e589]: "Momentos reales de nuestras producciones: gastronomía, salones, pista LED, discoteca y ambientación."
        - generic [ref=e590]:
          - button "Todos" [ref=e591] [cursor=pointer]
          - button "Eventos" [ref=e592] [cursor=pointer]
          - button "Discoteca" [ref=e593] [cursor=pointer]
          - button "Catering" [ref=e594] [cursor=pointer]
          - button "Decoración" [ref=e595] [cursor=pointer]
          - button "Barra de Tragos" [ref=e596] [cursor=pointer]
          - button "Fotocabina" [ref=e597] [cursor=pointer]
          - button "Repostería" [ref=e598] [cursor=pointer]
          - button "Fotografía" [ref=e599] [cursor=pointer]
          - button "Salón" [ref=e600] [cursor=pointer]
        - generic [ref=e601]:
          - 'button "Abrir foto: Prueba nativa galería 166 foto uno" [active] [ref=e602] [cursor=pointer]':
            - img "Prueba nativa galería 166 foto uno" [ref=e603]
            - generic [ref=e605]: Fotografía
            - generic [ref=e606]:
              - generic [ref=e607]: Prueba nativa galería 166 foto uno
              - img [ref=e608]
          - 'button "Abrir foto: Prueba nativa galería 166 foto dos" [ref=e611] [cursor=pointer]':
            - img "Prueba nativa galería 166 foto dos" [ref=e612]
            - generic [ref=e614]: Fotografía
            - generic [ref=e615]:
              - generic [ref=e616]: Prueba nativa galería 166 foto dos
              - img [ref=e617]
          - 'button "Abrir foto: Decoración XV con equipo AK" [ref=e620] [cursor=pointer]':
            - img "Decoración XV con equipo AK" [ref=e621]
            - generic [ref=e623]: Decoración
            - generic [ref=e624]:
              - generic [ref=e625]: Decoración XV con equipo AK
              - img [ref=e626]
          - 'button "Abrir foto: Mesa principal XV" [ref=e629] [cursor=pointer]':
            - img "Mesa principal XV" [ref=e630]
            - generic [ref=e632]: Decoración
            - generic [ref=e633]:
              - generic [ref=e634]: Mesa principal XV
              - img [ref=e635]
          - 'button "Abrir foto: Mesa de catering AK" [ref=e638] [cursor=pointer]':
            - img "Mesa de catering AK" [ref=e639]
            - generic [ref=e641]: Catering
            - generic [ref=e642]:
              - generic [ref=e643]: Mesa de catering AK
              - img [ref=e644]
          - 'button "Abrir foto: Decoración rosa para XV" [ref=e647] [cursor=pointer]':
            - img "Decoración rosa para XV" [ref=e648]
            - generic [ref=e650]: Decoración
            - generic [ref=e651]:
              - generic [ref=e652]: Decoración rosa para XV
              - img [ref=e653]
          - 'button "Abrir foto: Salón con discoteca AK" [ref=e656] [cursor=pointer]':
            - img "Salón con discoteca AK" [ref=e657]
            - generic [ref=e659]: Salón
            - generic [ref=e660]:
              - generic [ref=e661]: Salón con discoteca AK
              - img [ref=e662]
          - 'button "Abrir foto: Kebab gourmet para eventos" [ref=e665] [cursor=pointer]':
            - img "Kebab gourmet para eventos" [ref=e666]
            - generic [ref=e668]: Catering
            - generic [ref=e669]:
              - generic [ref=e670]: Kebab gourmet para eventos
              - img [ref=e671]
          - 'button "Abrir foto: Iluminación de discoteca" [ref=e674] [cursor=pointer]':
            - img "Iluminación de discoteca" [ref=e675]
            - generic [ref=e677]: Discoteca
            - generic [ref=e678]:
              - generic [ref=e679]: Iluminación de discoteca
              - img [ref=e680]
          - 'button "Abrir foto: Montaje de discoteca y salón" [ref=e683] [cursor=pointer]':
            - img "Montaje de discoteca y salón" [ref=e684]
            - generic [ref=e686]: Discoteca
            - generic [ref=e687]:
              - generic [ref=e688]: Montaje de discoteca y salón
              - img [ref=e689]
          - 'button "Abrir foto: Pista iluminada para XV" [ref=e692] [cursor=pointer]':
            - img "Pista iluminada para XV" [ref=e693]
            - generic [ref=e695]: Salón
            - generic [ref=e696]:
              - generic [ref=e697]: Pista iluminada para XV
              - img [ref=e698]
          - 'button "Abrir foto: Photobooth estilo Vogue" [ref=e701] [cursor=pointer]':
            - img "Photobooth estilo Vogue" [ref=e702]
            - generic [ref=e704]: Fotocabina
            - generic [ref=e705]:
              - generic [ref=e706]: Photobooth estilo Vogue
              - img [ref=e707]
        - button "Ver más fotos y videos (24 de 144)" [ref=e711] [cursor=pointer]:
          - text: Ver más fotos y videos (24 de 144)
          - img [ref=e712]
    - generic [ref=e718]:
      - generic [ref=e719]:
        - generic [ref=e720]:
          - img [ref=e721]
          - text: Reseñas de clientes
        - heading "Experiencias compartidas" [level=2] [ref=e726]
        - paragraph [ref=e727]: Opiniones compartidas por clientes sobre su experiencia con AK Producciones.
      - generic [ref=e728]:
        - button "Ver reseña de Liliana Reyes" [ref=e729] [cursor=pointer]:
          - generic [ref=e730]:
            - generic [ref=e731]:
              - img [ref=e732]
              - generic [ref=e735]: Servicio de Fiesta
            - generic [ref=e736]:
              - img [ref=e737]
              - img [ref=e739]
              - img [ref=e741]
              - img [ref=e743]
              - img [ref=e745]
            - heading "La experiencia de Liliana Reyes" [level=3] [ref=e747]
            - paragraph [ref=e748]: “Muchas gracias por las atenciones recibidas. Y totalmente conforme con el servicio brindado. Nos vemos el año que viene, para repetir el movimiento. Leonardo y flia”
          - generic [ref=e749]:
            - generic [ref=e750]:
              - paragraph [ref=e751]: Liliana Reyes
              - paragraph [ref=e752]: Servicio de Fiesta
              - paragraph [ref=e753]: Cliente AK
            - generic [ref=e754]:
              - img [ref=e755]
              - text: Opinión publicada
        - button "Ver reseña de Analia Sosa" [ref=e758] [cursor=pointer]:
          - generic [ref=e759]:
            - generic [ref=e760]:
              - img [ref=e761]
              - generic [ref=e764]: Evento Social
            - generic [ref=e765]:
              - img [ref=e766]
              - img [ref=e768]
              - img [ref=e770]
              - img [ref=e772]
              - img [ref=e774]
            - heading "La experiencia de Analia Sosa" [level=3] [ref=e776]
            - paragraph [ref=e777]: “excelente servicio muy recomendable!!!muchas gracias”
          - generic [ref=e778]:
            - generic [ref=e779]:
              - paragraph [ref=e780]: Analia Sosa
              - paragraph [ref=e781]: Evento Social
              - paragraph [ref=e782]: Cliente AK
            - generic [ref=e783]:
              - img [ref=e784]
              - text: Opinión publicada
        - button "Ver reseña de Maria Rosario Volpi" [ref=e787] [cursor=pointer]:
          - generic [ref=e788]:
            - generic [ref=e789]:
              - img [ref=e790]
              - generic [ref=e793]: Boda
            - generic [ref=e794]:
              - img [ref=e795]
              - img [ref=e797]
              - img [ref=e799]
              - img [ref=e801]
              - img [ref=e803]
            - heading "La experiencia de Maria Rosario Volpi" [level=3] [ref=e805]
            - paragraph [ref=e806]: “GRASIAS. Alexander Nicolas Knuth por todo. El Servicio exelente. Y. Por Acompañarnos. En este. Dia tan especial para nosotros.”
          - generic [ref=e807]:
            - generic [ref=e808]:
              - paragraph [ref=e809]: Maria Rosario Volpi
              - paragraph [ref=e810]: Boda
              - paragraph [ref=e811]: Cliente AK
            - generic [ref=e812]:
              - img [ref=e813]
              - text: Opinión publicada
        - button "Ver reseña de Clau Piriz" [ref=e816] [cursor=pointer]:
          - generic [ref=e817]:
            - generic [ref=e818]:
              - img [ref=e819]
              - generic [ref=e822]: Cumpleaños
            - generic [ref=e823]:
              - img [ref=e824]
              - img [ref=e826]
              - img [ref=e828]
              - img [ref=e830]
              - img [ref=e832]
            - heading "La experiencia de Clau Piriz" [level=3] [ref=e834]
            - paragraph [ref=e835]: “Hermoso todo!”
          - generic [ref=e836]:
            - generic [ref=e837]:
              - paragraph [ref=e838]: Clau Piriz
              - paragraph [ref=e839]: Cumpleaños
              - paragraph [ref=e840]: Cliente AK
            - generic [ref=e841]:
              - img [ref=e842]
              - text: Opinión publicada
        - button "Ver reseña de Maria Rosario Volpi" [ref=e845] [cursor=pointer]:
          - generic [ref=e846]:
            - generic [ref=e847]:
              - img [ref=e848]
              - generic [ref=e851]: Servicio de Fiesta
            - generic [ref=e852]:
              - img [ref=e853]
              - img [ref=e855]
              - img [ref=e857]
              - img [ref=e859]
              - img [ref=e861]
            - heading "La experiencia de Maria Rosario Volpi" [level=3] [ref=e863]
            - paragraph [ref=e864]: “Muy buen servicio. Recomiendo”
          - generic [ref=e865]:
            - generic [ref=e866]:
              - paragraph [ref=e867]: Maria Rosario Volpi
              - paragraph [ref=e868]: Servicio de Fiesta
              - paragraph [ref=e869]: Cliente AK
            - generic [ref=e870]:
              - img [ref=e871]
              - text: Opinión publicada
      - generic [ref=e874]:
        - generic [ref=e875]:
          - generic [ref=e876]: Claridad y tranquilidad
          - 'heading "Cómo trabajamos: nuestro método en 3 pasos" [level=3] [ref=e877]'
          - paragraph [ref=e878]: Sin sorpresas ni letra chica. Un camino simple y organizado desde la primera consulta hasta la fiesta.
        - generic [ref=e879]:
          - generic [ref=e881]:
            - generic [ref=e882]:
              - img [ref=e884]
              - generic [ref=e887]: "01"
            - heading "1. Reservás tu fecha con una seña" [level=4] [ref=e888]
            - paragraph [ref=e889]: Asegurás tu fecha en la agenda oficial de AK y confirmás la disponibilidad de salón y equipos.
          - generic [ref=e891]:
            - generic [ref=e892]:
              - img [ref=e894]
              - generic [ref=e896]: "02"
            - heading "2. Plan de pagos mensuales a tu medida" [level=4] [ref=e897]
            - paragraph [ref=e898]: Abonás en cuotas fijas hasta la fecha del evento sin estrés ni sorpresas financieras.
          - generic [ref=e900]:
            - generic [ref=e901]:
              - img [ref=e903]
              - generic [ref=e907]: "03"
            - heading "3. Ajuste final de invitados 15 a 30 días antes" [level=4] [ref=e908]
            - paragraph [ref=e909]: Definís el número definitivo de asistentes, menú especial, alergias y cronograma con precisión.
    - generic [ref=e911]:
      - generic [ref=e913]:
        - generic [ref=e914]:
          - generic [ref=e915]: ❓ FAQ
          - heading "Preguntas Frecuentes" [level=2] [ref=e916]
          - paragraph [ref=e917]: Todo lo que necesitás saber antes de contratar tu evento
        - generic [ref=e918]:
          - button "¿Cómo reservo mi fecha?" [ref=e920] [cursor=pointer]:
            - generic [ref=e921]: ¿Cómo reservo mi fecha?
            - img [ref=e922]
          - button "¿Qué incluye el servicio integral?" [ref=e925] [cursor=pointer]:
            - generic [ref=e926]: ¿Qué incluye el servicio integral?
            - img [ref=e927]
          - button "¿Puedo contratar solo algunos servicios?" [ref=e930] [cursor=pointer]:
            - generic [ref=e931]: ¿Puedo contratar solo algunos servicios?
            - img [ref=e932]
          - button "¿Trabajan con Club Uruguay?" [ref=e935] [cursor=pointer]:
            - generic [ref=e936]: ¿Trabajan con Club Uruguay?
            - img [ref=e937]
          - button "¿Cómo pido presupuesto?" [ref=e940] [cursor=pointer]:
            - generic [ref=e941]: ¿Cómo pido presupuesto?
            - img [ref=e942]
          - button "¿Hacen fiestas de 15, bodas y cumpleaños?" [ref=e945] [cursor=pointer]:
            - generic [ref=e946]: ¿Hacen fiestas de 15, bodas y cumpleaños?
            - img [ref=e947]
      - generic [ref=e951]:
        - generic [ref=e952]:
          - generic [ref=e953]:
            - generic [ref=e954]:
              - img [ref=e955]
              - text: Consejos AK
            - heading "Contenido para planificar tu evento sin estrés" [level=2] [ref=e957]
            - paragraph [ref=e958]: Guías simples sobre presupuesto, comida, XV años, bodas y listas de organización.
          - link "Ver todos los artículos" [ref=e959] [cursor=pointer]:
            - /url: /public/blog
            - text: Ver todos los artículos
            - img [ref=e960]
        - generic [ref=e962]:
          - link "Organización integral de eventos y fiestas sin estrés Organización - 5 min Cómo empezar a organizar una fiesta sin estrés El orden correcto para pasar de una idea suelta a una fiesta posible, con fecha, invitados, prioridades y presupuesto claro. Leer artículo" [ref=e964] [cursor=pointer]:
            - /url: /public/blog/como-empezar-a-organizar-una-fiesta-sin-estres
            - img "Organización integral de eventos y fiestas sin estrés" [ref=e966]
            - generic [ref=e967]:
              - generic [ref=e968]:
                - generic [ref=e969]:
                  - img [ref=e970]
                  - text: Organización - 5 min
                - heading "Cómo empezar a organizar una fiesta sin estrés" [level=3] [ref=e973]
                - paragraph [ref=e974]: El orden correcto para pasar de una idea suelta a una fiesta posible, con fecha, invitados, prioridades y presupuesto claro.
              - generic [ref=e975]:
                - generic [ref=e976]: Leer artículo
                - img [ref=e977]
          - link "Presupuesto transparente para familias y clientes Presupuesto - 6 min Qué debe incluir un presupuesto de fiesta bien hecho Los puntos que tienen que estar claros para comparar propuestas sin caer en precios incompletos o sorpresas de último momento. Leer artículo" [ref=e980] [cursor=pointer]:
            - /url: /public/blog/presupuesto-de-fiesta-que-debe-incluir
            - img "Presupuesto transparente para familias y clientes" [ref=e982]
            - generic [ref=e983]:
              - generic [ref=e984]:
                - generic [ref=e985]:
                  - img [ref=e986]
                  - text: Presupuesto - 6 min
                - heading "Qué debe incluir un presupuesto de fiesta bien hecho" [level=3] [ref=e988]
                - paragraph [ref=e989]: Los puntos que tienen que estar claros para comparar propuestas sin caer en precios incompletos o sorpresas de último momento.
              - generic [ref=e990]:
                - generic [ref=e991]: Leer artículo
                - img [ref=e992]
          - link "Mesa de catering y gastronomía profesional AK Catering - 5 min Cómo elegir el menú para un evento sin equivocarte Una guía simple para elegir comida abundante, ordenada y acorde al tipo de fiesta, sin perder control del costo. Leer artículo" [ref=e995] [cursor=pointer]:
            - /url: /public/blog/como-elegir-el-menu-para-un-evento
            - img "Mesa de catering y gastronomía profesional AK" [ref=e997]
            - generic [ref=e998]:
              - generic [ref=e999]:
                - generic [ref=e1000]:
                  - img [ref=e1001]
                  - text: Catering - 5 min
                - heading "Cómo elegir el menú para un evento sin equivocarte" [level=3] [ref=e1004]
                - paragraph [ref=e1005]: Una guía simple para elegir comida abundante, ordenada y acorde al tipo de fiesta, sin perder control del costo.
              - generic [ref=e1006]:
                - generic [ref=e1007]: Leer artículo
                - img [ref=e1008]
    - generic [ref=e1012]:
      - generic [ref=e1014]:
        - generic [ref=e1015]: Calendario 2026/2027 Abierto
        - heading "¿Listo para crear algo increíble?" [level=2] [ref=e1017]:
          - generic [ref=e1018]: ¿Listo para crear algo increíble?
        - paragraph [ref=e1019]: Consultá tu fecha sin compromiso. Respondemos a la brevedad.
        - generic [ref=e1020]: "🔒 Reserva flexible: Señá tu fecha y armamos un plan de cuotas a tu medida."
        - generic [ref=e1021]:
          - link "Consultar disponibilidad por WhatsApp" [ref=e1022] [cursor=pointer]:
            - /url: https://wa.me/59898355530?text=Hola%20AK%20Producciones%2C%20me%20gustar%C3%ADa%20consultar%20disponibilidad%20para%20mi%20evento.
            - img [ref=e1023]
            - text: Consultar disponibilidad por WhatsApp
          - link "Llamar por teléfono a AK Producciones" [ref=e1025] [cursor=pointer]:
            - /url: tel:+59898355530
            - img [ref=e1026]
            - text: Llamar Directo
        - paragraph [ref=e1030]: O visitanos en redes
        - generic [ref=e1032]:
          - link "Visitar Instagram de AK Producciones" [ref=e1033] [cursor=pointer]:
            - /url: https://www.instagram.com/akproduccionesfiestasyeventos/
            - img [ref=e1034]
          - link "Visitar Facebook de AK Producciones" [ref=e1037] [cursor=pointer]:
            - /url: https://www.facebook.com/akproduccionessalto/
            - img [ref=e1038]
          - link "Visitar TikTok de AK Producciones" [ref=e1040] [cursor=pointer]:
            - /url: https://www.tiktok.com/@akproduccioneseve
            - img [ref=e1041]
      - generic [ref=e1047]:
        - generic [ref=e1048]:
          - generic [ref=e1049]:
            - generic [ref=e1050]:
              - generic [ref=e1051]:
                - generic [ref=e1052]: AK
                - img "AK Producciones" [ref=e1053]
              - generic [ref=e1054]:
                - generic [ref=e1055]: AK Producciones
                - generic [ref=e1056]: Producción Integral de Eventos • Salto, Uruguay
            - paragraph [ref=e1057]: Diseñamos bodas, 15 años y eventos empresariales inolvidables. Gastronomía gourmet, discoteca profesional, salones de gala y tecnología interactiva en un solo lugar.
          - generic [ref=e1058]:
            - link "Consultar disponibilidad por WhatsApp (abre en nueva ventana)" [ref=e1059] [cursor=pointer]:
              - /url: https://wa.me/59898355530?text=%C2%A1Hola%20AK%20Producciones!%20Quisiera%20consultar%20disponibilidad%20para%20mi%20fecha.
              - img [ref=e1063]
              - generic [ref=e1065]: WhatsApp Directo
            - link "Simular mi presupuesto" [ref=e1066] [cursor=pointer]:
              - /url: /simulador-de-presupuesto
              - img [ref=e1067]
              - generic [ref=e1069]: Simular mi presupuesto
        - generic [ref=e1070]:
          - generic [ref=e1071]:
            - heading "Salones Destacados" [level=4] [ref=e1072]:
              - img [ref=e1073]
              - text: Salones Destacados
            - list [ref=e1077]:
              - listitem [ref=e1078]:
                - link "Salón Club Uruguay (Exclusivo)" [ref=e1079] [cursor=pointer]:
                  - /url: /club-uruguay
                  - text: Salón Club Uruguay (Exclusivo)
              - listitem [ref=e1081]:
                - link "Gastronomía Gourmet & Catering" [ref=e1082] [cursor=pointer]:
                  - /url: "#landing-services"
                  - text: Gastronomía Gourmet & Catering
              - listitem [ref=e1084]:
                - link "Discoteca & Pistas de Luces LED" [ref=e1085] [cursor=pointer]:
                  - /url: "#landing-services"
                  - text: Discoteca & Pistas de Luces LED
              - listitem [ref=e1087]:
                - link "Plataforma 360° & Fotocabina QR" [ref=e1088] [cursor=pointer]:
                  - /url: "#landing-technology"
                  - text: Plataforma 360° & Fotocabina QR
          - generic [ref=e1090]:
            - heading "Accesos Rápidos" [level=4] [ref=e1091]:
              - img [ref=e1092]
              - text: Accesos Rápidos
            - list [ref=e1094]:
              - listitem [ref=e1095]:
                - link "→ Simulador de Presupuesto" [ref=e1096] [cursor=pointer]:
                  - /url: /simulador-de-presupuesto
                  - generic [ref=e1097]: →
                  - text: Simulador de Presupuesto
                  - img [ref=e1098]
              - listitem [ref=e1101]:
                - link "→ Galería de Eventos Reales" [ref=e1102] [cursor=pointer]:
                  - /url: "#landing-gallery"
                  - generic [ref=e1103]: →
                  - text: Galería de Eventos Reales
              - listitem [ref=e1104]:
                - link "→ Blog & Guías de Organización" [ref=e1105] [cursor=pointer]:
                  - /url: /public/blog
                  - generic [ref=e1106]: →
                  - text: Blog & Guías de Organización
              - listitem [ref=e1107]:
                - link "→ Testimonios & Preguntas Frecuentes" [ref=e1108] [cursor=pointer]:
                  - /url: "#landing-testimonials-faq"
                  - generic [ref=e1109]: →
                  - text: Testimonios & Preguntas Frecuentes
          - generic [ref=e1110]:
            - heading "Oficina & Atención" [level=4] [ref=e1111]:
              - img [ref=e1112]
              - text: Oficina & Atención
            - generic [ref=e1115]:
              - paragraph [ref=e1116]:
                - img [ref=e1117]
                - generic [ref=e1120]: Salto, Uruguay
              - paragraph [ref=e1121]:
                - img [ref=e1122]
                - link "+598 98 355 530" [ref=e1124] [cursor=pointer]:
                  - /url: tel:+59898355530
              - paragraph [ref=e1125]: Coordinación presencial el día de tu celebración.
          - generic [ref=e1126]:
            - heading "Comunidad & Redes" [level=4] [ref=e1127]:
              - img [ref=e1128]
              - text: Comunidad & Redes
            - paragraph [ref=e1130]: Seguinos en redes para ver coberturas en vivo, montajes reales y salones armados.
            - generic [ref=e1131]:
              - link "Visitar Instagram de AK Producciones (abre en nueva ventana)" [ref=e1132] [cursor=pointer]:
                - /url: https://www.instagram.com/akproduccionesfiestasyeventos/
                - img [ref=e1133]
              - link "Visitar Facebook de AK Producciones (abre en nueva ventana)" [ref=e1136] [cursor=pointer]:
                - /url: https://www.facebook.com/akproduccionessalto/
                - img [ref=e1137]
              - link "Visitar Pinterest de AK Producciones (abre en nueva ventana)" [ref=e1139] [cursor=pointer]:
                - /url: https://es.pinterest.com/akproduccionessalto/
                - img [ref=e1140]
              - link "Visitar WhatsApp de AK Producciones (abre en nueva ventana)" [ref=e1142] [cursor=pointer]:
                - /url: https://wa.me/59898355530?text=%C2%A1Hola%20AK%20Producciones!%20Quisiera%20consultar%20por%20mi%20evento.
                - img [ref=e1143]
              - link "Visitar TikTok de AK Producciones (abre en nueva ventana)" [ref=e1145] [cursor=pointer]:
                - /url: https://www.tiktok.com/@akproduccioneseve
                - img [ref=e1146]
        - generic [ref=e1150]:
          - generic [ref=e1151]:
            - paragraph [ref=e1152]: © 2026 AK Producciones Eventos. Todos los derechos reservados.
            - generic [ref=e1153]: ·
            - paragraph [ref=e1154]:
              - text: Tus datos se tratan según la
              - link "Ley 18.331" [ref=e1155] [cursor=pointer]:
                - /url: /privacidad
              - text: de Protección de Datos Personales.
          - generic [ref=e1156]:
            - link "Club Uruguay" [ref=e1157] [cursor=pointer]:
              - /url: /club-uruguay
            - link "Simulador" [ref=e1158] [cursor=pointer]:
              - /url: /simulador-de-presupuesto
            - link "Privacidad" [ref=e1159] [cursor=pointer]:
              - /url: /privacidad
            - link "Acceso Staff" [ref=e1160] [cursor=pointer]:
              - /url: /login
    - generic [ref=e1161]:
      - button "Subir al inicio" [ref=e1162] [cursor=pointer]:
        - img [ref=e1163]
      - link "Simular mi presupuesto" [ref=e1165] [cursor=pointer]:
        - /url: /simulador-de-presupuesto
        - img [ref=e1166]
        - generic [ref=e1168]: Simular mi presupuesto
      - link "Escribinos por WhatsApp" [ref=e1169] [cursor=pointer]:
        - /url: https://wa.me/59898355530?text=%F0%9F%91%8B%20%C2%A1Hola!%20Me%20gustar%C3%ADa%20cotizar%20y%20obtener%20informaci%C3%B3n%20sobre%20los%20servicios%20de%20AK%20Producciones.
        - img [ref=e1173]
  - region "Notifications (F8)":
    - list
  - alert [ref=e1175]
```

# Test source

```ts
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
  64  |   await expect(section).toBeVisible();
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
> 140 |     expect.soft(backward, 'Shift+Tab nativo no debe sacar el foco del visor').toBe(true);
      |                                                                               ^ Error: Shift+Tab nativo no debe sacar el foco del visor
  141 |     await page.keyboard.press('Escape');
  142 |     await expect(dialog).toBeHidden();
  143 |     await expect(firstCard).toBeFocused();
  144 |   } finally {
  145 |     await guardarEvidencia(page, testInfo, observed);
  146 |   }
  147 | });
  148 |
```