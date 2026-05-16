import type { FiestaEnPlanificacion, Invitado, Tarea } from '@/types/fiesta';
import {
  defaultBebidasData,
  defaultCartaTragosData,
  defaultClientPortalSettings,
  defaultDecoracion,
  defaultGuestExperienceSettings,
  defaultModulosContratados,
  defaultPrograma,
  initialFiestaActualData,
} from '@/lib/fiesta-defaults';
import { defaultZonaDigitalAdolescentesSettings } from '@/lib/zona-digital-adolescentes';

export type AkDemoFiestaKind = 'xv' | 'boda' | 'club-uruguay' | 'corporativo' | 'tecnologia-total';

type DemoProfile = {
  kind: AkDemoFiestaKind;
  name: string;
  type: string;
  protagonist: string;
  place: string;
  primaryColor: string;
  guests: number;
  budget: number;
};

const DEMO_PROFILES: Record<AkDemoFiestaKind, DemoProfile> = {
  xv: {
    kind: 'xv',
    name: 'DEMO AK - XV Martina',
    type: 'XV',
    protagonist: 'Martina',
    place: 'Club Uruguay',
    primaryColor: '#dc2626',
    guests: 120,
    budget: 185000,
  },
  boda: {
    kind: 'boda',
    name: 'DEMO AK - Boda Sofia y Mateo',
    type: 'Boda',
    protagonist: 'Sofia y Mateo',
    place: 'Salon Principal',
    primaryColor: '#b91c1c',
    guests: 150,
    budget: 240000,
  },
  'club-uruguay': {
    kind: 'club-uruguay',
    name: 'DEMO AK - Club Uruguay Premium',
    type: 'Corporativo',
    protagonist: 'Club Uruguay',
    place: 'Club Uruguay',
    primaryColor: '#991b1b',
    guests: 180,
    budget: 310000,
  },
  corporativo: {
    kind: 'corporativo',
    name: 'DEMO AK - Evento Corporativo',
    type: 'Corporativo',
    protagonist: 'Equipo Comercial',
    place: 'Club Uruguay',
    primaryColor: '#111827',
    guests: 90,
    budget: 165000,
  },
  'tecnologia-total': {
    kind: 'tecnologia-total',
    name: 'DEMO AK - Tecnologia Total',
    type: 'XV',
    protagonist: 'Valentina',
    place: 'Club Uruguay',
    primaryColor: '#dc2626',
    guests: 160,
    budget: 335000,
  },
};

function futureDate(monthsAhead: number): string {
  const date = new Date();
  date.setMonth(date.getMonth() + monthsAhead);
  date.setDate(15);
  return date.toISOString().slice(0, 10);
}

function makeGuests(total: number): Invitado[] {
  return Array.from({ length: total }, (_, index) => ({
    id: `demo_guest_${index + 1}`,
    nombre: `Invitado demo ${index + 1}`,
    categoria: index % 5 === 0 ? 'Nino/Adolescente' as any : 'Adulto',
    contacto: `09${String(8000000 + index).slice(0, 7)}`,
    rsvp: index < Math.round(total * 0.68) ? 'Confirmado' : index % 7 === 0 ? 'Rechazado' : 'Pendiente',
    tableNumber: String((index % 15) + 1),
    cancionesDJ: index % 6 === 0 ? ['La cancion demo de la mesa'] : [],
    mensaje: index % 8 === 0 ? 'Nos vemos en la pista!' : undefined,
  }));
}

function makeTasks(): Tarea[] {
  return [
    { id: 'demo_task_1', texto: 'Revisar portal cliente con el cliente', completada: true, asignadaA: 'Organizador' },
    { id: 'demo_task_2', texto: 'Probar pantalla LED en modo gigante', completada: false, asignadaA: 'Organizador' },
    { id: 'demo_task_3', texto: 'Confirmar lista final de invitados', completada: false, asignadaA: 'Cliente' },
    { id: 'demo_task_4', texto: 'Cargar fotos finales para invitacion y muro', completada: true, asignadaA: 'Cliente' },
    { id: 'demo_task_5', texto: 'Asignar responsable de barra y social wall', completada: false, asignadaA: 'Organizador' },
  ];
}

export function buildAkDemoFiesta(kind: AkDemoFiestaKind): FiestaEnPlanificacion {
  const profile = DEMO_PROFILES[kind] || DEMO_PROFILES.xv;
  const id = `demo_${profile.kind}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const date = futureDate(profile.kind === 'club-uruguay' ? 3 : 4);
  const accessKey = `demo-${profile.kind}-${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();

  return {
    ...initialFiestaActualData,
    id,
    estado: 'Demo AK',
    invitacionSlug: `demo-${profile.kind}-${Date.now()}`,
    configuracion: {
      ...initialFiestaActualData.configuracion,
      nombreEvento: profile.name,
      tipoCelebracion: profile.type,
      fechaEvento: date,
      horaInicio: '21:00',
      horaFin: '05:00',
      nombreLugar: profile.place,
      direccionLugar: 'Uruguay 580, Salto',
      googleMapsUrl: 'https://maps.google.com',
      invitadosEstimados: profile.guests,
      presupuestoEstimado: profile.budget,
      clienteNombre: `Cliente demo ${profile.protagonist}`,
      protagonista1Nombre: profile.protagonist,
      protagonistaFotoUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200&auto=format&fit=crop',
      primaryColor: profile.primaryColor,
      notesAdicionales: 'Evento demo generado para vender y probar la experiencia tecnologica AK completa.',
    },
    modulosContratados: {
      ...defaultModulosContratados,
      regalos: true,
      feedback: true,
      menuMesa: true,
      checkin: true,
      zonaDigital: true,
      entretenimiento: true,
      barraTecnologica: true,
      pantallasTotem: true,
      carteleria: true,
      resumenImprimible: true,
    },
    personalAsignado: [
      { empleadoId: 'demo_coord', rolId: 'responsable_general', eventSalary: 4500 },
      { empleadoId: 'demo_barra', rolId: 'barra', eventSalary: 2800 },
      { empleadoId: 'demo_social', rolId: 'social_wall', eventSalary: 3200 },
      { empleadoId: 'demo_contable', rolId: 'contable', eventSalary: 2600 },
    ],
    reuniones: [
      { id: 'demo_meet_1', titulo: 'Reunion de experiencia tecnologica', fecha: futureDate(1), notas: 'Se reviso portal, muro, barra, invitacion y pantalla LED.', acuerdos: 'Cliente aprueba demo completa para mostrar a familia.' },
      { id: 'demo_meet_2', titulo: 'Reunion final operativa', fecha: futureDate(2), notas: 'Checklist final con responsables y pruebas de pantalla.', acuerdos: 'AK controla pantalla, QR, barra y social.' },
    ],
    tareas: makeTasks(),
    invitados: makeGuests(profile.guests),
    clientChecklist: [
      { id: 'client_demo_1', texto: 'Confirmar invitados finales', completada: false },
      { id: 'client_demo_2', texto: 'Subir fotos para pantalla e invitacion', completada: true },
      { id: 'client_demo_3', texto: 'Elegir canciones especiales', completada: true },
    ],
    clientNotes: 'Demo con portal activo, invitados cargados, pantalla y experiencia social conectada.',
    clientPortalSettings: {
      ...defaultClientPortalSettings,
      enabled: true,
      accessKey,
      checklist: { visible: true, editable: true },
      itinerario: { visible: true },
      musica: { visible: true, editable: true },
      moodboard: { visible: true, editable: true },
      cartaTragos: { visible: true },
      dressCode: { visible: true },
    },
    clientePortalExperience: {
      heroImageUrl: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?q=80&w=1200&auto=format&fit=crop',
      protagonistImageUrl: 'https://images.unsplash.com/photo-1523438885200-e635ba2c371e?q=80&w=900&auto=format&fit=crop',
      primaryColor: profile.primaryColor,
      eventDisplayName: profile.name.replace('DEMO AK - ', ''),
      welcomeMessage: 'Bienvenido al portal demo de AK Producciones. Todo esta organizado en un solo lugar.',
      organizerMessage: 'AK acompana cada etapa: antes, durante y despues de la fiesta.',
      simplicityMode: true,
    },
    invitacionDigital: {
      ...initialFiestaActualData.invitacionDigital,
      cabecera: {
        ...initialFiestaActualData.invitacionDigital?.cabecera,
        protagonista1: profile.protagonist,
        paletaColores: { primary: profile.primaryColor, secondary: '#111827', accent: '#ffffff' },
      } as any,
    },
    programa: defaultPrograma,
    decoracion: {
      ...defaultDecoracion,
      tema: 'AK premium tecnologico',
      paletaColores: { primary: profile.primaryColor, secondary: '#111827', accent: '#ffffff' },
      generalNotesDecoracion: 'Demo con visuales premium, portada, pantalla LED y estaciones tecnologicas.',
      moodboardItems: [
        { id: 'mood_1', type: 'image', url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=900&auto=format&fit=crop', title: 'Salon armado' },
        { id: 'mood_2', type: 'color', color: profile.primaryColor, title: 'Color AK' },
      ] as any,
    },
    bebidas: {
      ...defaultBebidasData,
      categorias: defaultBebidasData.categorias.map((category) => category.id === 'barra_tragos' ? { ...category, activada: true } : category),
    },
    cartaTragos: {
      ...defaultCartaTragosData,
      protagonistaNombre: profile.protagonist,
      paletaColores: { primary: profile.primaryColor, secondary: '#111827', accent: '#ffffff' },
    },
    musica: {
      cancionEntrada: 'Entrada demo AK',
      cancionVals: profile.kind === 'xv' ? 'Vals demo' : undefined,
      cancionesTortaBrindis: ['Brindis demo', 'Cierre demo'],
      playlistFiesta: 'Playlist demo AK - pop, cumbia, reggaeton y clasicos',
      sugerenciasInvitados: 'Los invitados pueden pedir canciones desde el celular.',
    },
    socialGallerySettings: {
      enabled: true,
      title: `Muro social de ${profile.protagonist}`,
      subtitle: 'Subi tu foto, etiqueta a AK y mira la pantalla gigante.',
      allowLikes: true,
      allowComments: true,
      uploadsActive: true,
      requireApproval: true,
      chatEnabled: true,
      showPolls: true,
      showSongRequests: true,
      showDedications: true,
      backgroundColor: '#ffffff',
      accentColor: profile.primaryColor,
      marketingTickerText: 'Compartilo con #AKProducciones',
      ledMarqueeText: 'AK Producciones - experiencia tecnologica en vivo',
      screenMode: {
        enabled: true,
        loop: true,
        isPlaying: false,
        currentItemIndex: 0,
        playlist: [
          { id: 'screen_demo_1', type: 'mural', title: 'Muro social', durationSeconds: 20, enabled: true, layout: 'landscape' },
          { id: 'screen_demo_2', type: 'canciones', title: 'Pedidos musicales', durationSeconds: 15, enabled: true, layout: 'landscape' },
          { id: 'screen_demo_3', type: 'juego', title: 'Encuesta en vivo', durationSeconds: 15, enabled: true, layout: 'landscape' },
        ],
      },
      brand: {
        companyName: 'AK Producciones',
        instagramHandle: '@akproduccioneseventos',
        whatsappNumber: '59898355530',
        landingUrl: 'https://akproducciones.uy/',
        ctaText: 'Tecnologia para fiestas memorables',
      },
      audioRhythm: {
        enabled: true,
        title: 'Momento pista AK',
        subtitle: 'Visuales audiorritmicos, fotos, QR y energia de discoteca.',
        visualStyle: 'neon-bars',
        accentColor: profile.primaryColor,
        secondaryColor: '#ffffff',
        intensity: 82,
        showPhotos: true,
        showQr: true,
        qrUrl: `/evento/social/${id}`,
      },
      totemScreens: [
        {
          id: 'totem_demo_entrada',
          enabled: true,
          title: `Bienvenidos a ${profile.protagonist}`,
          subtitle: 'Escanea el QR y participa',
          honoreeName: profile.protagonist,
          heroPhotoUrl: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?q=80&w=1200&auto=format&fit=crop',
          backgroundMode: 'aurora',
          layout: 'portrait',
          accentColor: profile.primaryColor,
          qrUrl: `/q/${id}`,
          qrLabel: 'Entrar a la experiencia',
          showQr: true,
          showLatestPhotos: true,
          syncedWithSocialWall: true,
          audioReactive: true,
          updatedAt: now,
        },
        {
          id: 'totem_demo_pista',
          enabled: true,
          title: 'Modo pista',
          subtitle: 'Fotos, retos y ranking en vivo',
          honoreeName: profile.protagonist,
          backgroundMode: 'social-rain',
          layout: 'landscape',
          accentColor: '#111827',
          qrUrl: `/evento/zona-digital/${id}`,
          qrLabel: 'Jugar ahora',
          showQr: true,
          showLatestPhotos: true,
          syncedWithSocialWall: true,
          audioReactive: true,
          updatedAt: now,
        },
      ],
    },
    zonaDigitalAdolescentes: {
      ...defaultZonaDigitalAdolescentesSettings,
      title: `Zona Digital ${profile.protagonist}`,
      subtitle: 'Retos, juegos, fotos, barra, 360, totems, emojis y ranking para vivir la tecnologia AK desde el celular.',
      primaryColor: '#111827',
      accentColor: profile.primaryColor,
      hashtag: '#AKProducciones',
      qrUrl: `/evento/zona-digital/${id}`,
      showSocialFollowGate: true,
      allowComments: true,
      allowDedications: true,
      allowSongVotes: true,
      autoRotateOnScreens: true,
      syncWithMuroSocial: true,
      syncWithTotems: true,
      syncWithBarra: true,
      syncWithEntretenimiento: true,
      recapEnabled: true,
      updatedAt: now,
    },
    eventoEnVivo: {
      fotos: [
        { id: 'foto_demo_1', url: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=900&auto=format&fit=crop', autor: 'AK Demo', mensaje: 'Primera foto del muro', timestamp: new Date().toISOString() },
      ],
      mensajes: [
        { id: 'msg_demo_1', autor: 'Familia demo', mensaje: 'Que noche increible!', timestamp: new Date().toISOString(), destacado: true },
      ],
      solicitudesCanciones: [
        { id: 'song_demo_1', invitadoNombre: 'Invitado demo', cancion: 'Vivir mi vida', artista: 'Marc Anthony', timestamp: new Date().toISOString() },
      ],
      votaciones: [
        { id: 'vote_demo_1', pregunta: 'Que momento queres ver en pantalla?', activa: true, timestamp: new Date().toISOString(), opciones: [
          { id: 'op_1', texto: 'Fotos de la pista', votos: 18 },
          { id: 'op_2', texto: 'Mensajes familiares', votos: 9 },
        ] },
      ],
    },
    screenPlaylist: {
      items: [
        { id: 'playlist_demo_1', title: 'Portada fiesta demo', type: 'mural' as any, durationSeconds: 18, enabled: true },
        { id: 'playlist_demo_2', title: 'Muro social demo', type: 'redes' as any, durationSeconds: 20, enabled: true },
      ] as any,
      loop: true,
      orientation: 'landscape',
      isPlaying: false,
      currentIndex: 0,
    },
    mediaLibrary: [
      { id: 'media_demo_1', fiestaId: id, fileName: 'demo-salon.jpg', url: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=1200&auto=format&fit=crop', type: 'image', uploadedAt: new Date().toISOString(), label: 'Salon demo', globalShared: true },
      { id: 'media_demo_2', fiestaId: id, fileName: 'demo-pista.jpg', url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1200&auto=format&fit=crop', type: 'image', uploadedAt: new Date().toISOString(), label: 'Pista demo', globalShared: true },
    ],
    guestPortalSettings: {
      showMural: true,
      showFotos: true,
      showInvitacionWeb: true,
      showMesaAsignada: true,
      showItinerario: true,
      showMusica: true,
      showRegalos: true,
      showCheckin: true,
      welcomeMessage: 'Bienvenido a la experiencia demo AK.',
      customBgColor: '#ffffff',
      customAccentColor: profile.primaryColor,
      coverImageUrl: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?q=80&w=1200&auto=format&fit=crop',
    },
    guestExperienceSettings: {
      ...defaultGuestExperienceSettings,
      allowPhotoUpload: true,
      showBudgetSimulatorCta: true,
    },
    fotografiaYFilmacion: {
      servicios: [
        { id: 'foto_demo', nombre: 'Cobertura fotografica demo', estado: 'En revisión', fechaEntregaEstimada: futureDate(5), notas: 'Material para galeria y redes.' },
      ],
      notasGenerales: 'Demo con flujo completo de foto, video, muro y galeria final.',
    },
    planDePagos: {
      id: `plan_${id}`,
      fiestaId: id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notas: 'Plan demo para mostrar portal cliente.',
      cuotas: [
        { id: 'cuota_demo_1', descripcion: 'Sena demo', monto: 45000, fechaVencimiento: futureDate(1), estado: 'pagada' as any },
        { id: 'cuota_demo_2', descripcion: 'Saldo demo', monto: profile.budget - 45000, fechaVencimiento: futureDate(3), estado: 'pendiente' as any },
      ] as any,
    },
    galeriaEntregada: profile.kind === 'tecnologia-total',
    galeriaUrl: 'https://akproducciones.uy/galeria-demo',
    npsScore: 10,
    postEventoCompletado: false,
    others: {
      ...(initialFiestaActualData.others || {}),
      demoAk: {
        kind: profile.kind,
        createdAt: new Date().toISOString(),
        purpose: 'Demo premium para venta, pruebas y entrenamiento interno.',
      },
      entretenimiento: {
        modules: ['fotocabina', 'plataforma360', 'bogue', 'espejo-magico'],
      },
    },
  } as FiestaEnPlanificacion;
}
