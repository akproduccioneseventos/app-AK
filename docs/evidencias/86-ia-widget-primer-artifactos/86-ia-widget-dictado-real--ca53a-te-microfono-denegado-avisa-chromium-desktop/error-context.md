# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 86-ia-widget.spec.ts >> dictado real del widget envia, respuesta de respaldo se lee y chat persiste; microfono denegado avisa
- Location: tests\e2e\86-ia-widget.spec.ts:18:5

# Error details

```
Error: expect(received).toContain(expected) // indexOf

Expected substring: "Funcionando en modo respaldo"
Received string:    ""

Call Log:
- Timeout 20000ms exceeded while waiting on the predicate
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - generic [ref=e6]:
      - link "Logo de la Empresa" [ref=e8] [cursor=pointer]:
        - /url: /admin
        - img "Logo de la Empresa" [ref=e10]
      - generic [ref=e11]:
        - list [ref=e12]:
          - listitem [ref=e13]:
            - link "Centro de Control" [ref=e14] [cursor=pointer]:
              - /url: /
              - img [ref=e15]
              - generic [ref=e20]: Centro de Control
        - generic [ref=e21]:
          - generic [ref=e22]:
            - generic [ref=e23]: Mi Día
            - generic [ref=e24]: ☀️
          - list [ref=e26]:
            - listitem [ref=e27]:
              - link "Mi Día" [ref=e28] [cursor=pointer]:
                - /url: /mi-dia
                - img [ref=e29]
                - generic [ref=e35]: Mi Día
        - generic [ref=e36]:
          - generic [ref=e37]:
            - generic [ref=e38]: Fiestas
            - generic [ref=e39]: 🎉
          - list [ref=e41]:
            - listitem [ref=e42]:
              - link "Eventos Activos" [ref=e43] [cursor=pointer]:
                - /url: /eventos
                - img [ref=e44]
                - generic [ref=e50]: Eventos Activos
            - listitem [ref=e51]:
              - link "Calendario" [ref=e52] [cursor=pointer]:
                - /url: /calendario
                - img [ref=e53]
                - generic [ref=e55]: Calendario
            - listitem [ref=e56]:
              - link "Muro Social" [ref=e57] [cursor=pointer]:
                - /url: /empresa/red-social-eventos
                - img [ref=e58]
                - generic [ref=e61]: Muro Social
            - listitem [ref=e62]:
              - link "Incidentes" [ref=e63] [cursor=pointer]:
                - /url: /incidentes
                - img [ref=e64]
                - generic [ref=e66]: Incidentes
            - listitem [ref=e67]:
              - link "Guias de Armado" [ref=e68] [cursor=pointer]:
                - /url: /playbooks
                - img [ref=e69]
                - generic [ref=e72]: Guias de Armado
            - listitem [ref=e73]:
              - link "Alergias y Dietas" [ref=e74] [cursor=pointer]:
                - /url: /fiestas/nueva/alergias
                - img [ref=e75]
                - generic [ref=e84]: Alergias y Dietas
            - listitem [ref=e85]:
              - link "Portal de Proveedores" [ref=e86] [cursor=pointer]:
                - /url: /fiestas/nueva/proveedores-portal
                - img [ref=e87]
                - generic [ref=e92]: Portal de Proveedores
            - listitem [ref=e93]:
              - link "Personal en dos fiestas" [ref=e94] [cursor=pointer]:
                - /url: /recursos-multi-evento
                - img [ref=e95]
                - generic [ref=e99]: Personal en dos fiestas
        - generic [ref=e100]:
          - generic [ref=e101]:
            - generic [ref=e102]: La Empresa
            - generic [ref=e103]: 🏢
          - list [ref=e105]:
            - listitem [ref=e106]:
              - link "Gestión de Empresa" [ref=e107] [cursor=pointer]:
                - /url: /empresa
                - img [ref=e108]
                - generic [ref=e112]: Gestión de Empresa
            - generic [ref=e115]: Vender
            - listitem [ref=e116]:
              - link "Prospectos" [ref=e117] [cursor=pointer]:
                - /url: /contabilidad/crm
                - img [ref=e118]
                - generic [ref=e120]: Prospectos
            - listitem [ref=e121]:
              - link "Presupuestos" [ref=e122] [cursor=pointer]:
                - /url: /presupuestos/nuevo
                - img [ref=e123]
                - generic [ref=e126]: Presupuestos
            - listitem [ref=e127]:
              - link "Clientes" [ref=e128] [cursor=pointer]:
                - /url: /customers
                - img [ref=e129]
                - generic [ref=e134]: Clientes
            - listitem [ref=e135]:
              - link "Simulador IA" [ref=e136] [cursor=pointer]:
                - /url: /simulador-ak
                - img [ref=e137]
                - generic [ref=e140]: Simulador IA
            - generic [ref=e143]: Plata
            - listitem [ref=e144]:
              - link "Pagos Rápidos" [ref=e145] [cursor=pointer]:
                - /url: /pagos-rapidos
                - img [ref=e146]
                - generic [ref=e149]: Pagos Rápidos
            - listitem [ref=e150]:
              - link "Panel Contable" [ref=e151] [cursor=pointer]:
                - /url: /empresa/contabilidad
                - img [ref=e152]
                - generic [ref=e154]: Panel Contable
            - listitem [ref=e155]:
              - link "Facturas" [ref=e156] [cursor=pointer]:
                - /url: /invoices
                - img [ref=e157]
                - generic [ref=e160]: Facturas
            - listitem [ref=e161]:
              - link "Cambios a Aprobar" [ref=e162] [cursor=pointer]:
                - /url: /aprobaciones
                - img [ref=e163]
                - generic [ref=e166]: Cambios a Aprobar
            - listitem [ref=e167]:
              - link "Métricas del Negocio" [ref=e168] [cursor=pointer]:
                - /url: /empresa/dashboard
                - img [ref=e169]
                - generic [ref=e172]: Métricas del Negocio
            - generic [ref=e175]: Recursos
            - listitem [ref=e176]:
              - link "Comida / Menús" [ref=e177] [cursor=pointer]:
                - /url: /empresa/menus
                - img [ref=e178]
                - generic [ref=e180]: Comida / Menús
            - listitem [ref=e181]:
              - link "Lista de Compras" [ref=e182] [cursor=pointer]:
                - /url: /compras
                - img [ref=e183]
                - generic [ref=e187]: Lista de Compras
            - listitem [ref=e188]:
              - link "Salones" [ref=e189] [cursor=pointer]:
                - /url: /empresa/salones
                - img [ref=e190]
                - generic [ref=e193]: Salones
            - listitem [ref=e194]:
              - link "Catálogo de Servicios" [ref=e195] [cursor=pointer]:
                - /url: /empresa/servicios
                - img [ref=e196]
                - generic [ref=e200]: Catálogo de Servicios
            - listitem [ref=e201]:
              - link "Proveedores" [ref=e202] [cursor=pointer]:
                - /url: /proveedores
                - img [ref=e203]
                - generic [ref=e207]: Proveedores
            - listitem [ref=e208]:
              - link "Empleados" [ref=e209] [cursor=pointer]:
                - /url: /empleados
                - img [ref=e210]
                - generic [ref=e213]: Empleados
            - generic [ref=e216]: Marketing
            - listitem [ref=e217]:
              - link "Marketing y Difusión" [ref=e218] [cursor=pointer]:
                - /url: /empresa/marketing
                - img [ref=e219]
                - generic [ref=e223]: Marketing y Difusión
            - listitem [ref=e224]:
              - link "Redes Sociales" [ref=e225] [cursor=pointer]:
                - /url: /empresa/redes-sociales
                - img [ref=e226]
                - generic [ref=e229]: Redes Sociales
            - listitem [ref=e230]:
              - link "WhatsApp del Día" [ref=e231] [cursor=pointer]:
                - /url: /contabilidad/crm/outbox
                - img [ref=e232]
                - generic [ref=e235]: WhatsApp del Día
            - listitem [ref=e236]:
              - link "Rendimiento Anuncios" [ref=e237] [cursor=pointer]:
                - /url: /contabilidad/crm/marketing-ads
                - img [ref=e238]
                - generic [ref=e241]: Rendimiento Anuncios
            - listitem [ref=e242]:
              - link "Presentación LED" [ref=e243] [cursor=pointer]:
                - /url: /empresa/presentacion-led/configuracion
                - img [ref=e244]
                - generic [ref=e247]: Presentación LED
        - generic [ref=e248]:
          - generic [ref=e249]:
            - generic [ref=e250]: Configuración
            - generic [ref=e251]: ⚙️
          - list [ref=e253]:
            - listitem [ref=e254]:
              - link "Ajustes Generales" [ref=e255] [cursor=pointer]:
                - /url: /settings
                - img [ref=e256]
                - generic [ref=e259]: Ajustes Generales
            - listitem [ref=e260]:
              - link "Tareas Automáticas" [ref=e261] [cursor=pointer]:
                - /url: /settings/tareas-automaticas
                - img [ref=e262]
                - generic [ref=e264]: Tareas Automáticas
            - listitem [ref=e265]:
              - link "Conexiones" [ref=e266] [cursor=pointer]:
                - /url: /settings/sincronizaciones
                - img [ref=e267]
                - generic [ref=e270]: Conexiones
            - listitem [ref=e271]:
              - link "WhatsApp" [ref=e272] [cursor=pointer]:
                - /url: /settings/whatsapp
                - img [ref=e273]
                - generic [ref=e275]: WhatsApp
            - listitem [ref=e276]:
              - link "Cláusulas de Contrato" [ref=e277] [cursor=pointer]:
                - /url: /settings/contratos/clausulas
                - img [ref=e278]
                - generic [ref=e282]: Cláusulas de Contrato
            - listitem [ref=e283]:
              - link "Seguridad" [ref=e284] [cursor=pointer]:
                - /url: /settings/account
                - img [ref=e285]
                - generic [ref=e288]: Seguridad
            - listitem [ref=e289]:
              - link "Promociones" [ref=e290] [cursor=pointer]:
                - /url: /settings/promos
                - img [ref=e291]
                - generic [ref=e294]: Promociones
            - listitem [ref=e295]:
              - link "Asistente IA" [ref=e296] [cursor=pointer]:
                - /url: /settings/ai-assistant
                - img [ref=e297]
                - generic [ref=e300]: Asistente IA
            - listitem [ref=e301]:
              - link "Mapa Tecnológico" [ref=e302] [cursor=pointer]:
                - /url: /settings/mapa-tecnologico-ak
                - img [ref=e303]
                - generic [ref=e306]: Mapa Tecnológico
            - listitem [ref=e307]:
              - link "Laboratorio Experimental" [ref=e308] [cursor=pointer]:
                - /url: /settings/feature-flags
                - img [ref=e309]
                - generic [ref=e312]: Laboratorio Experimental
      - list [ref=e314]:
        - listitem [ref=e315]:
          - link "Alertas 2" [ref=e316] [cursor=pointer]:
            - /url: /alertas
            - img [ref=e317]
            - generic [ref=e320]: Alertas
            - generic [ref=e321]: "2"
    - main [ref=e322]:
      - generic [ref=e323]:
        - generic [ref=e324]:
          - generic [ref=e325]:
            - img [ref=e327]
            - heading "Tareas del Evento" [level=1] [ref=e330]
          - generic [ref=e331]:
            - link "Ingreso/Egreso Rápido" [ref=e332] [cursor=pointer]:
              - /url: /pagos-rapidos
              - button "Ingreso/Egreso Rápido" [ref=e333]:
                - img
                - generic [ref=e334]: Ingreso/Egreso Rápido
            - button "Abrir notificaciones" [ref=e335] [cursor=pointer]:
              - img
              - generic [ref=e336]: Abrir notificaciones
            - button "Logo de la Empresa" [ref=e337] [cursor=pointer]:
              - img "Logo de la Empresa" [ref=e339]
        - main [ref=e340]:
          - generic [ref=e341]:
            - generic [ref=e342]:
              - generic [ref=e343]:
                - img [ref=e344]
                - heading "Tareas del Evento" [level=1] [ref=e347]
              - generic [ref=e348]:
                - button "Sincronizar Tareas del Sistema" [ref=e349] [cursor=pointer]:
                  - img
                  - text: Sincronizar Tareas del Sistema
                - link "Volver" [ref=e350] [cursor=pointer]:
                  - /url: /fiestas/nueva?fiestaId=e2e_ia86_12512_1791591369307
                  - img
                  - text: Volver
            - generic [ref=e352]:
              - generic [ref=e353]:
                - generic [ref=e354]:
                  - img [ref=e355]
                  - text: Estado de la Planificación
                - generic [ref=e358]: 2 de 5 tareas cumplidas
              - progressbar [ref=e359]
              - generic [ref=e361]:
                - paragraph [ref=e362]: 40% completado
                - paragraph [ref=e363]: No hay vencimientos próximos.
            - generic [ref=e364]:
              - generic [ref=e365]:
                - generic [ref=e366]: Añadir Nueva Tarea
                - generic [ref=e367]: Crea tareas personalizadas para este evento específico.
              - generic [ref=e368]:
                - generic [ref=e369]:
                  - generic [ref=e370]:
                    - text: Título de la Tarea
                    - textbox "Título de la Tarea" [ref=e371]:
                      - /placeholder: "Ej: Confirmar DJ"
                  - generic [ref=e372]:
                    - generic [ref=e373]:
                      - text: Fecha Límite
                      - button "Selecciona una fecha" [ref=e374] [cursor=pointer]:
                        - img
                        - generic [ref=e375]: Selecciona una fecha
                    - generic [ref=e376]:
                      - text: Asignada A
                      - combobox "Asignada A" [ref=e377] [cursor=pointer]:
                        - generic: Seleccionar...
                        - img [ref=e378]
                      - combobox [ref=e380]
                - button "Añadir Tarea" [ref=e382] [cursor=pointer]:
                  - img
                  - text: Añadir Tarea
            - generic [ref=e383]:
              - generic [ref=e385]:
                - generic [ref=e386]:
                  - img [ref=e387]
                  - text: Lista de Tareas
                - generic [ref=e390]:
                  - button "Cargar" [ref=e391] [cursor=pointer]:
                    - img
                    - text: Cargar
                  - button "Guardar" [ref=e392] [cursor=pointer]:
                    - img
                    - text: Guardar
              - list [ref=e397]:
                - listitem [ref=e398]:
                  - checkbox "Revisar portal cliente con el cliente" [checked] [ref=e399] [cursor=pointer]:
                    - generic:
                      - img
                  - generic [ref=e400]:
                    - generic [ref=e401] [cursor=pointer]: Revisar portal cliente con el cliente
                    - generic [ref=e403]:
                      - img [ref=e404]
                      - text: Organizador
                  - button [ref=e408] [cursor=pointer]:
                    - img
                - listitem [ref=e409]:
                  - checkbox "Probar pantalla LED en modo gigante" [ref=e410] [cursor=pointer]
                  - generic [ref=e411]:
                    - generic [ref=e412] [cursor=pointer]: Probar pantalla LED en modo gigante
                    - generic [ref=e414]:
                      - img [ref=e415]
                      - text: Organizador
                  - button [ref=e419] [cursor=pointer]:
                    - img
                - listitem [ref=e420]:
                  - checkbox "Confirmar lista final de invitados" [ref=e421] [cursor=pointer]
                  - generic [ref=e422]:
                    - generic [ref=e423] [cursor=pointer]: Confirmar lista final de invitados
                    - generic [ref=e425]:
                      - img [ref=e426]
                      - text: Cliente
                  - button [ref=e431] [cursor=pointer]:
                    - img
                - listitem [ref=e432]:
                  - checkbox "Cargar fotos finales para invitacion y muro" [checked] [ref=e433] [cursor=pointer]:
                    - generic:
                      - img
                  - generic [ref=e434]:
                    - generic [ref=e435] [cursor=pointer]: Cargar fotos finales para invitacion y muro
                    - generic [ref=e437]:
                      - img [ref=e438]
                      - text: Cliente
                  - button [ref=e443] [cursor=pointer]:
                    - img
                - listitem [ref=e444]:
                  - checkbox "Asignar responsable de barra y social wall" [ref=e445] [cursor=pointer]
                  - generic [ref=e446]:
                    - generic [ref=e447] [cursor=pointer]: Asignar responsable de barra y social wall
                    - generic [ref=e449]:
                      - img [ref=e450]
                      - text: Organizador
                  - button [ref=e454] [cursor=pointer]:
                    - img
    - navigation "Navegacion del modulo" [ref=e455]:
      - button "Volver" [ref=e456] [cursor=pointer]:
        - img
      - button "Ir al panel principal" [ref=e457] [cursor=pointer]:
        - img
    - generic [ref=e458]:
      - generic [ref=e459]:
        - generic [ref=e460]:
          - generic [ref=e461]:
            - generic [ref=e462]:
              - generic [ref=e463]:
                - img [ref=e465]
                - generic [ref=e471]: 🥳
              - generic [ref=e472]:
                - generic [ref=e473]: Agente de esta Fiesta
                - paragraph [ref=e474]: Control de la fiesta abierta
            - generic [ref=e475]:
              - button "Activar modo manos libres (conversación continua por voz)" [ref=e476] [cursor=pointer]:
                - img [ref=e477]
              - button "Mover a la izquierda" [ref=e483] [cursor=pointer]:
                - img [ref=e484]
              - button "Silenciar voz" [ref=e487] [cursor=pointer]:
                - img [ref=e488]
              - button "Limpiar historial de este agente" [ref=e492] [cursor=pointer]:
                - img [ref=e493]
              - button "Cerrar" [ref=e496] [cursor=pointer]:
                - img [ref=e497]
          - generic [ref=e500]:
            - generic [ref=e501]: Fiesta actual
            - generic [ref=e502]: Especialista de pantalla
            - generic [ref=e503]: Fiesta detectada
          - generic [ref=e504]:
            - button "🥳 Fiesta" [ref=e505] [cursor=pointer]:
              - generic [ref=e506]:
                - img [ref=e508]
                - generic [ref=e514]: 🥳
              - text: Fiesta
            - button "🕵️‍♂️ Eventos" [ref=e515] [cursor=pointer]:
              - generic [ref=e516]:
                - img [ref=e518]
                - generic [ref=e528]: 🕵️‍♂️
              - text: Eventos
            - button "👩‍💼 Agenda" [ref=e529] [cursor=pointer]:
              - generic [ref=e530]:
                - img [ref=e532]
                - generic [ref=e535]: 👩‍💼
              - text: Agenda
            - button "💰 Caja" [ref=e536] [cursor=pointer]:
              - generic [ref=e537]:
                - img [ref=e539]
                - generic [ref=e541]: 💰
              - text: Caja
            - button "📢 Marketing" [ref=e542] [cursor=pointer]:
              - generic [ref=e543]:
                - img [ref=e545]
                - generic [ref=e548]: 📢
              - text: Marketing
            - button "🤵 General" [ref=e549] [cursor=pointer]:
              - generic [ref=e550]:
                - img [ref=e552]
                - generic [ref=e555]: 🤵
              - text: General
        - generic [ref=e556]:
          - generic [ref=e557]:
            - paragraph [ref=e560]: Resumen de esta fiesta, sonda IA86 1791591369307
            - generic [ref=e562]:
              - paragraph [ref=e563]: Agente "Fiesta de esta noche"
              - paragraph [ref=e564]: "Funcionando en modo respaldo. Sin datos inventados. Lo más importante ahora: 1. [ALTA] Fiesta de esta noche: cierre post-fiesta: Ya pasó hace 1 día(s). Conviene pedir testimonio, autorización de fotos e idea de publicación. 2. [ALTA] Fiesta de esta noche: cierre post-fiesta: Ya pasó hace 1 día(s). Conviene pedir testimonio, autorización de fotos e idea de publicación. 3. [ALTA] Fiesta de esta noche: oportunidad post-fiesta: Pasaron 1 día(s). Hay mensaje de testimonio y publicación sugerida listos para trabajar. 4. [ALTA] Fiesta de esta noche: oportunidad post-fiesta: Pasaron 1 día(s). Hay mensaje de testimonio y publicación sugerida listos para trabajar. 5. [MEDIA] Fiesta de esta noche: falta Tareas internas: 3 pendiente(s) de 5. 6. [NORMAL] Pipeline comercial sin datos visibles: No veo leads ni presupuestos recientes para trabajar. Puede ser falta de datos o una oportunidad de ordenar CRM. → Próximo paso: Revisá tareas, pagos, contrato y personal de esta fiesta. Error técnico: i.NodeSDK is not a constructor"
          - generic [ref=e565]:
            - generic [ref=e566]:
              - button "¿Qué le falta a esta fiesta?" [ref=e567] [cursor=pointer]
              - button "¿Qué está para revisar?" [ref=e568] [cursor=pointer]
              - button "¿Qué hago hoy?" [ref=e569] [cursor=pointer]
            - generic [ref=e570]:
              - textbox "Hablar con Fiesta..." [ref=e571]
              - button "Dictar por voz (envío automático)" [ref=e572] [cursor=pointer]:
                - img
              - button "Enviar" [disabled]:
                - img
      - button "Abrir Asistente IA AK" [ref=e573]:
        - generic [ref=e574]:
          - img [ref=e576]
          - generic [ref=e582]: 🥳
  - generic [ref=e584]:
    - button "Bruno Responsable general de fiesta" [ref=e585] [cursor=pointer]:
      - img [ref=e588]
      - generic [ref=e591]:
        - generic [ref=e592]: Bruno
        - generic [ref=e593]: Responsable general de fiesta
    - link "Personalizar asistentes" [ref=e594] [cursor=pointer]:
      - /url: /settings/asistentes-contextuales
      - img
    - link "Ver sincronizaciones" [ref=e595] [cursor=pointer]:
      - /url: /settings/sincronizaciones
      - img
  - region "Notifications (F8)":
    - list
  - alert [ref=e596]
```

# Test source

```ts
  1  | // @ts-nocheck -- REAL widget/server/fallback. Browser speech instrumented, not physical audio.
  2  | import fs from 'node:fs';
  3  | import os from 'node:os';
  4  | import path from 'node:path';
  5  | import { test, expect } from '@playwright/test';
  6  | import { crearFiestaDeEstaNoche, guardarFiesta, borrarFiesta, ponerSesionDelEquipo } from './helpers/fiesta-de-prueba';
  7  | if (process.env.AK_ENTORNO_AISLADO !== 'true' || path.dirname(process.cwd()) !== os.tmpdir()
  8  |   || !path.basename(process.cwd()).startsWith('ak-entorno-aislado-')) throw new Error('Solo TEMP aislado');
  9  | const id = `e2e_ia86_${process.pid}_${Date.now()}`;
  10 | const pregunta = `Resumen de esta fiesta, sonda IA86 ${Date.now()}`;
  11 | function leer(file: string) {
  12 |   for (const base of ['data', 'src/data']) {
  13 |     const p = path.join(process.cwd(), base, file);
  14 |     if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
  15 |   }
  16 |   return {};
  17 | }
  18 | test('dictado real del widget envia, respuesta de respaldo se lee y chat persiste; microfono denegado avisa', async ({page, context, baseURL}, info) => {
  19 |   test.setTimeout(150000);
  20 |   guardarFiesta(crearFiestaDeEstaNoche({id}));
  21 |   await ponerSesionDelEquipo(context, baseURL);
  22 |   await page.addInitScript(() => {
  23 |     window.__spoken86 = [];
  24 |     class Rec {
  25 |       start() { window.__rec86 = this; }
  26 |       stop() { queueMicrotask(() => this.onend?.()); }
  27 |     }
  28 |     window.SpeechRecognition = Rec;
  29 |     Object.defineProperty(window, 'speechSynthesis', {configurable:true, value:{
  30 |       getVoices:()=>[{lang:'es-UY', name:'Sonda controlada'}], cancel:()=>{},
  31 |       speak:u=>{ window.__spoken86.push(u.text); u.onstart?.(); setTimeout(()=>u.onend?.(),40); },
  32 |     }});
  33 |   });
  34 |   try {
  35 |     await page.goto(`/fiestas/nueva/tareas?fiestaId=${id}`, {waitUntil:'domcontentloaded'});
  36 |     await page.getByRole('button',{name:'Abrir Asistente IA AK'}).click();
  37 |     await expect(page.getByPlaceholder(/Hablar con/)).toBeVisible();
  38 |     await page.getByTitle('Dictar por voz (envío automático)',{exact:true}).click();
  39 |     await page.evaluate(texto => {
  40 |       window.__rec86.onresult({results:[Object.assign([{transcript:texto}],{isFinal:true})]});
  41 |       window.__rec86.stop();
  42 |     }, pregunta);
  43 |     await expect(page.getByText(pregunta,{exact:true})).toBeVisible();
  44 |     await expect(page.getByText(/Funcionando en modo respaldo\. Sin datos inventados\./)).toBeVisible({timeout:90000});
> 45 |     await expect.poll(()=>page.evaluate(()=>window.__spoken86.join('\n')),{timeout:20000}).toContain('Funcionando en modo respaldo');
     |                                                                                            ^ Error: expect(received).toContain(expected) // indexOf
  46 |     await expect.poll(()=>leer('multiagent/chats.json').sessions?.find(s=>s.fiestaId===id)?.messages?.filter(m=>m.role==='user' && m.content===pregunta).length,{timeout:20000}).toBe(1);
  47 |     const stored = leer('multiagent/chats.json').sessions.find(s=>s.fiestaId===id);
  48 |     expect(stored.messages.filter(m=>m.role==='assistant')).toHaveLength(1);
  49 |     await info.attach('chat-real-persistido.json',{body:JSON.stringify(stored,null,2),contentType:'application/json'});
  50 |     await page.reload({waitUntil:'domcontentloaded'});
  51 |     await page.getByRole('button',{name:'Abrir Asistente IA AK'}).click();
  52 |     await expect(page.getByText(pregunta,{exact:true})).toBeVisible();
  53 |     await page.getByTitle('Dictar por voz (envío automático)',{exact:true}).click();
  54 |     await page.evaluate(()=>window.__rec86.onerror({error:'not-allowed'}));
  55 |     await expect(page.getByText(/No se pudo acceder al micrófono/)).toBeVisible();
  56 |     expect(leer('multiagent/chats.json').sessions.find(s=>s.fiestaId===id).messages).toHaveLength(2);
  57 |     await page.screenshot({path:info.outputPath('asistente-real-86.png')});
  58 |   } finally { borrarFiesta(id); }
  59 | });
  60 | 
```