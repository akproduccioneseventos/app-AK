import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import type {
  CartaTragosData,
  ClientPortalSettings,
  DecoracionData,
  FiestaEnPlanificacion,
  GuestExperienceSettings,
  Invitado,
  LayoutElement,
  ListaDeCargaOperativa,
  ModulosContratados,
  PersonalAsignadoDetalleStorage,
  SocialGallerySettings,
  VideoVidaData,
} from '../../src/types/fiesta';
import type { Customer } from '../../src/types/customer';
import type { Presupuesto } from '../../src/types/presupuesto';
import type { FullMenu } from '../../src/types/catering';
import type { ServicioEmpresa } from '../../src/types/empresa';
import type { Empleado } from '../../src/types/empleado';

export const ROBOT_PROJECT_ID = 'demo-ak-producciones';
export const ROBOT_FIESTA_A_ID = 'robot_fiesta_a';
export const ROBOT_FIESTA_B_ID = 'robot_fiesta_b';
export const ROBOT_FIESTA_A_NOMBRE = 'ROBOT Boda Ana y Luis';
export const ROBOT_FIESTA_B_NOMBRE = 'ROBOT Quince Sofía';
export const ROBOT_MUESTRA_ID = 'fiesta_muestra_auditor';
export const ROBOT_MUESTRA_NOMBRE = 'DEMO AK - XV Martina';
export const ROBOT_MENU_PUBLICADO_ID = 'robot_menu_publicado';
export const ROBOT_MENU_BORRADOR_ID = 'robot_menu_borrador';
export const ROBOT_MENU_BORRADOR_NOMBRE = 'ROBOT Menú Borrador Secreto';
export const ROBOT_SERVICIO_PUBLICADO_ID = 'robot_servicio_publicado';
export const ROBOT_SERVICIO_BORRADOR_ID = 'robot_servicio_borrador';
export const ROBOT_SERVICIO_BORRADOR_NOMBRE = 'ROBOT Servicio Borrador Oculto';

function fechaEnDias(dias: number): string {
  const fecha = new Date(Date.now() + dias * 24 * 60 * 60 * 1000);
  return fecha.toISOString().slice(0, 10);
}

function sanitizarParaFirestore<T>(valor: T): T {
  if (Array.isArray(valor)) {
    return valor.map((item) => sanitizarParaFirestore(item)) as unknown as T;
  }
  if (valor && typeof valor === 'object') {
    const limpio: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(valor as Record<string, unknown>)) {
      if (v !== undefined) {
        limpio[k] = sanitizarParaFirestore(v);
      }
    }
    return limpio as T;
  }
  return valor;
}

function crearModulosActivos(): ModulosContratados {
  return {
    tareas: true,
    invitados: true,
    paginaWeb: true,
    decoracion: true,
    catering: true,
    musica: true,
    personal: true,
    itinerario: true,
    documentos: true,
    costos: true,
    cargaOperativa: true,
    fotografia: true,
    videoVida: true,
    reuniones: true,
    muroSocial: true,
    redSocial: true,
    regalos: true,
    feedback: true,
    menuMesa: true,
    checkin: true,
    resumenImprimible: true,
    configuracion: true,
    disenoSalon: true,
    listaCompras: true,
    portalCliente: true,
    numerosMesa: true,
    mesasCliente: true,
    resumenPlanificacion: true,
    enVivo: true,
    entretenimiento: true,
    barraTecnologica: true,
    pantallasTotem: true,
    zonaDigital: true,
    discoteca: true,
    filmacion: true,
    carteleria: true,
    buzon: true,
  };
}

function crearInvitados(prefijo: string, tokenPrincipal: string): Invitado[] {
  return [
    {
      id: `${prefijo}_inv_1`,
      nombre: `${prefijo} Invitado Principal`,
      categoria: 'Adulto',
      contacto: '099000111',
      rsvp: 'Confirmado',
      partySize: 2,
      tableNumber: '1',
      dietaryRestriction: 'Ninguna',
      guestAccessToken: tokenPrincipal,
      cancionesDJ: ['Tema de prueba'],
    },
    {
      id: `${prefijo}_inv_2`,
      nombre: `${prefijo} Invitado Mesa Dos`,
      categoria: 'Adulto',
      contacto: '099000222',
      rsvp: 'Pendiente',
      partySize: 1,
      tableNumber: '2',
      dietaryRestriction: 'Celiaco',
      isCeliac: true,
      guestAccessToken: `${tokenPrincipal}-2`,
    },
  ];
}

function crearMesas(prefijo: string): LayoutElement[] {
  return [
    {
      id: `${prefijo}_mesa_1`,
      name: 'Mesa 1',
      x: 120,
      y: 120,
      width: 90,
      height: 90,
      rotation: 0,
      type: 'element',
      category: 'Mesas',
      shape: 'circle',
      seats: 8,
    },
    {
      id: `${prefijo}_mesa_2`,
      name: 'Mesa 2',
      x: 260,
      y: 120,
      width: 90,
      height: 90,
      rotation: 0,
      type: 'element',
      category: 'Mesas',
      shape: 'circle',
      seats: 8,
    },
  ];
}

function crearPersonal(empleadoId: string): PersonalAsignadoDetalleStorage[] {
  return [
    {
      empleadoId,
      rolId: 'rol_mozo',
      eventSalary: 4500,
      asistenciaConfirmada: true,
    },
  ];
}

function crearCartaTragos(nombreProtagonista: string): CartaTragosData {
  return {
    titulo: 'CARTA DE TRAGOS',
    protagonistaNombre: nombreProtagonista,
    numeroPrincipal: 'ROBOT BAR',
    backgroundColor: '#ffffff',
    titleSize: 'medium',
    paletaColores: {
      primary: '#9333ea',
      secondary: '#363636',
      accent: '#ffffff',
      background: '#ffffff',
    },
    items: [
      {
        id: 'robot_trago_1',
        nombre: 'Mojito Clásico',
        descripcion: 'Ron blanco, menta fresca, lima y soda.',
        ingredientes: ['Ron', 'Menta', 'Lima', 'Hielo'],
        stockDisponible: 100,
      },
    ],
    empresa: {
      linea1: 'AK PRODUCCIONES',
      linea2: 'Servicio de fiestas integral',
      contacto: '098 355 530',
    },
  };
}

function crearListaCarga(prefijo: string): ListaDeCargaOperativa {
  return {
    notasGenerales: `Notas de carga ${prefijo}`,
    categorias: [
      {
        id: `${prefijo}_cat_1`,
        nombre: 'Sonido e Iluminación',
        items: [
          {
            id: `${prefijo}_item_1`,
            nombre: 'Cabina DJ Principal',
            cantidad: '1',
            unidad: 'Uds.',
            cargado: false,
            retornado: false,
          },
        ],
      },
    ],
  };
}

function crearPortalCliente(accessKey: string): ClientPortalSettings {
  return {
    enabled: true,
    accessKey,
    claveCambiadaPorCliente: true,
    accessPhase: 'organizacion',
    liveAccessDaysBefore: 7,
    checklist: { visible: true, editable: true },
    itinerario: { visible: true },
    musica: { visible: true, editable: true },
    videoVida: { visible: true, editable: true },
    listaRegalos: { visible: true },
    documentos: { visible: true },
    notasCliente: { visible: true, editable: true },
    invitados: { visible: true },
    paginaPublica: { visible: true },
    fotografiaYFilmacion: { visible: true },
    moodboard: { visible: true, editable: true },
    buzon: { visible: true, editable: true },
    contrato: { visible: true },
    pagos: { visible: true },
    simuladorInvitados: { visible: true, minReductionPercent: 10, maxIncreasePercent: 30 },
    simuladorInvitadosConfig: { limiteReduccionPorcentaje: 10, limiteAumentoPorcentaje: 30, penalizacionReduccion: true },
    calculadoraBebidas: { visible: true, items: [] },
    serviciosContratados: { visible: true },
    ubicacion: { visible: true },
    menu: { visible: true },
    cartaTragos: { visible: true },
    dressCode: { visible: true },
    faq: { visible: true },
    informarPago: { visible: true, editable: true },
  };
}

function crearDecoracion(prefijo: string, primary: string, secondary: string, accent: string): DecoracionData {
  return {
    tema: `Estilo ${prefijo}`,
    paletaColores: { primary, secondary, accent },
    notaDecoracionParaElCliente: `Ambientación ${prefijo}`,
    items: [],
    salonWidth: 15,
    salonHeight: 15,
    salonElements: crearMesas(prefijo),
    moodboardItems: [],
  };
}

function crearSocialGallery(): SocialGallerySettings {
  return {
    enabled: true,
    allowLikes: true,
    allowComments: true,
    uploadsActive: true,
    requireApproval: false,
  };
}

function crearGuestExperience(): GuestExperienceSettings {
  return {
    enabled: true,
    showAkBranding: true,
    showLandingCta: true,
    showSocialCta: true,
    showBudgetSimulatorCta: false,
    allowSongSuggestions: true,
    allowPhotoUpload: true,
    allowGuestPortal: true,
  };
}

function crearVideoVida(texto: string, cancion: string): VideoVidaData {
  return {
    galleryEnabled: true,
    photosUploaded: true,
    photoCount: 12,
    songSuggestion: cancion,
    customText: texto,
  };
}

export function construirDatosRobot(): {
  fiestas: FiestaEnPlanificacion[];
  clientes: Customer[];
  presupuestos: Presupuesto[];
  menus: Array<FullMenu & { estado?: 'borrador' | 'publicado'; publicado?: boolean; esBorrador?: boolean }>;
  servicios: Array<ServicioEmpresa & { estado?: 'borrador' | 'publicado'; publicado?: boolean; esBorrador?: boolean }>;
  empleados: Empleado[];
} {
  const fecha20Dias = fechaEnDias(20);
  const fecha30Dias = fechaEnDias(30);
  const ahoraIso = new Date().toISOString();

  const clienteA: Customer = {
    id: 'robot_cliente_a',
    name: 'Ana Gómez (ROBOT)',
    phone: '099111001',
    estadoCliente: 'Actual',
    partyDate: fecha20Dias,
    partyTime: '21:00 - 05:00',
    partyType: 'Boda',
    partyForWhom: ROBOT_FIESTA_A_NOMBRE,
    guestCount: 120,
    venueName: 'Club Uruguay',
    presupuestoId: 'robot_presupuesto_a',
  };

  const clienteB: Customer = {
    id: 'robot_cliente_b',
    name: 'Sofía Pérez (ROBOT)',
    phone: '099111002',
    estadoCliente: 'Actual',
    partyDate: fecha20Dias,
    partyTime: '21:30 - 05:30',
    partyType: 'XV años',
    partyForWhom: ROBOT_FIESTA_B_NOMBRE,
    guestCount: 140,
    venueName: 'Salón Prado',
    presupuestoId: 'robot_presupuesto_b',
  };

  const empleado1: Empleado = {
    id: 'robot_empleado_1',
    nombre: 'Lucas Fernández (ROBOT)',
    cedula: '41234567',
    fechaNacimiento: '1995-05-12',
    telefono: '099333444',
    email: 'lucas.robot@akproducciones.test',
    rolIds: ['rol_mozo'],
  };

  const menuPublicado: FullMenu & { estado: 'publicado'; publicado: boolean; esBorrador: boolean } = {
    id: ROBOT_MENU_PUBLICADO_ID,
    name: 'ROBOT Menú Gala Publicado',
    description: 'Menú completo publicado para pruebas del robot.',
    featured: true,
    templateType: 'Personalizado',
    estado: 'publicado',
    publicado: true,
    esBorrador: false,
    createdAt: ahoraIso,
    updatedAt: ahoraIso,
    items: [
      {
        id: 'robot_plato_entrada',
        name: 'Bruschettas Caprese ROBOT',
        type: 'Entrada',
        ingredients: [],
        totalDishCost: 120,
        profitMargin: 100,
        suggestedSellingPrice: 240,
      },
      {
        id: 'robot_plato_principal',
        name: 'Bondiola Braseada ROBOT',
        type: 'Plato Principal',
        ingredients: [],
        totalDishCost: 350,
        profitMargin: 100,
        suggestedSellingPrice: 700,
      },
    ],
  };

  const menuBorrador: FullMenu & { estado: 'borrador'; publicado: boolean; esBorrador: boolean } = {
    id: ROBOT_MENU_BORRADOR_ID,
    name: ROBOT_MENU_BORRADOR_NOMBRE,
    description: 'Menú en borrador que nunca debe verse en lo público.',
    featured: false,
    templateType: 'Personalizado',
    estado: 'borrador',
    publicado: false,
    esBorrador: true,
    createdAt: ahoraIso,
    updatedAt: ahoraIso,
    items: [
      {
        id: 'robot_plato_borrador',
        name: 'Plato Borrador Oculto ROBOT',
        type: 'Plato Principal',
        ingredients: [],
        totalDishCost: 100,
        profitMargin: 100,
        suggestedSellingPrice: 200,
      },
    ],
  };

  const servicioPublicado: ServicioEmpresa & { estado: 'publicado'; publicado: boolean; esBorrador: boolean } = {
    id: ROBOT_SERVICIO_PUBLICADO_ID,
    nombre: 'ROBOT Fotocabina 360 Publicada',
    tipoItem: 'Servicio',
    categoria: 'Servicio de entretenimiento',
    valorUnitarioEstimado: 6000,
    precioVenta: 14000,
    calculationMethod: 'fijo',
    unidad: 'Por evento',
    isFeatured: true,
    estado: 'publicado',
    publicado: true,
    esBorrador: false,
  };

  const servicioBorrador: ServicioEmpresa & { estado: 'borrador'; publicado: boolean; esBorrador: boolean } = {
    id: ROBOT_SERVICIO_BORRADOR_ID,
    nombre: ROBOT_SERVICIO_BORRADOR_NOMBRE,
    tipoItem: 'Servicio',
    categoria: 'Servicio de entretenimiento',
    valorUnitarioEstimado: 2000,
    precioVenta: 5000,
    calculationMethod: 'fijo',
    unidad: 'Por evento',
    isFeatured: false,
    estado: 'borrador',
    publicado: false,
    esBorrador: true,
  };

  const presupuestoA: Presupuesto = {
    id: 'robot_presupuesto_a',
    numero: 901,
    clienteNombre: clienteA.name,
    clienteContacto: clienteA.phone,
    eventoTipo: 'Boda',
    eventoFecha: fecha20Dias,
    eventoHoraInicio: '21:00',
    duracionHoras: 8,
    invitadosCantidad: 120,
    invitadosAdultos: 100,
    invitadosNinos: 10,
    invitadosAdolescentes: 10,
    salonFiestas: 'Club Uruguay',
    protagonista1Nombre: 'Ana',
    protagonista2Nombre: 'Luis',
    selectedMenuId: ROBOT_MENU_PUBLICADO_ID,
    itemsPresupuestados: [
      {
        idServicioCatalogo: 'robot_plato_principal',
        nombreServicio: 'Bondiola Braseada ROBOT',
        cantidad: 120,
        unidad: 'Por persona',
        precioUnitario: 700,
        precioUnitarioPresupuesto: 700,
        costoTotalItem: 84000,
        categoriaServicio: 'Servicio de catering',
        calculationMethod: 'porPersona',
        precioPorPersona: 700,
      },
      {
        idServicioCatalogo: ROBOT_SERVICIO_PUBLICADO_ID,
        nombreServicio: servicioPublicado.nombre,
        cantidad: 1,
        unidad: 'Por evento',
        precioUnitario: 14000,
        precioUnitarioPresupuesto: 14000,
        costoTotalItem: 14000,
        categoriaServicio: 'Servicio de entretenimiento',
        calculationMethod: 'fijo',
      },
    ],
    costoTotalEstimado: 98000,
    totalConDescuento: 98000,
    timestamp: ahoraIso,
    estado: 'Aceptado',
    source: 'manual',
    senia: 30000,
    saldo: 68000,
  };

  const presupuestoB: Presupuesto = {
    id: 'robot_presupuesto_b',
    numero: 902,
    clienteNombre: clienteB.name,
    clienteContacto: clienteB.phone,
    eventoTipo: 'XV años',
    eventoFecha: fecha20Dias,
    eventoHoraInicio: '21:30',
    duracionHoras: 8,
    invitadosCantidad: 140,
    invitadosAdultos: 80,
    invitadosNinos: 10,
    invitadosAdolescentes: 50,
    salonFiestas: 'Salón Prado',
    protagonista1Nombre: 'Sofía',
    selectedMenuId: ROBOT_MENU_PUBLICADO_ID,
    itemsPresupuestados: [
      {
        idServicioCatalogo: 'robot_plato_principal',
        nombreServicio: 'Bondiola Braseada ROBOT',
        cantidad: 140,
        unidad: 'Por persona',
        precioUnitario: 700,
        precioUnitarioPresupuesto: 700,
        costoTotalItem: 98000,
        categoriaServicio: 'Servicio de catering',
        calculationMethod: 'porPersona',
        precioPorPersona: 700,
      },
      {
        idServicioCatalogo: ROBOT_SERVICIO_PUBLICADO_ID,
        nombreServicio: servicioPublicado.nombre,
        cantidad: 1,
        unidad: 'Por evento',
        precioUnitario: 14000,
        precioUnitarioPresupuesto: 14000,
        costoTotalItem: 14000,
        categoriaServicio: 'Servicio de entretenimiento',
        calculationMethod: 'fijo',
      },
    ],
    costoTotalEstimado: 112000,
    totalConDescuento: 112000,
    timestamp: ahoraIso,
    estado: 'Aceptado',
    source: 'manual',
    senia: 35000,
    saldo: 77000,
  };

  const fiestaA: FiestaEnPlanificacion = {
    id: ROBOT_FIESTA_A_ID,
    estado: 'En Planificación',
    presupuestoId: presupuestoA.id,
    menuAsignadoId: ROBOT_MENU_PUBLICADO_ID,
    configuracion: {
      nombreEvento: ROBOT_FIESTA_A_NOMBRE,
      tipoCelebracion: 'Boda',
      fechaEvento: fecha20Dias,
      horaInicio: '21:00',
      horaFin: '05:00',
      nombreLugar: 'Club Uruguay',
      direccionLugar: 'Uruguay 850, Salto',
      invitadosEstimados: 120,
      invitadosAdultos: 100,
      invitadosNinos: 10,
      invitadosAdolescentes: 10,
      presupuestoEstimado: 98000,
      notesAdicionales: 'Fiesta activa A sembrada para el auditor robot.',
      clienteId: clienteA.id,
      clienteNombre: clienteA.name,
      protagonista1Nombre: 'Ana',
      protagonista2Nombre: 'Luis',
      nombreAgasajado: 'Ana y Luis',
    },
    modulosContratados: crearModulosActivos(),
    personalAsignado: crearPersonal(empleado1.id),
    invitados: crearInvitados('AnaLuis', 'robot-token-a'),
    decoracion: crearDecoracion('a', '#9333ea', '#1e293b', '#f59e0b'),
    cartaTragos: crearCartaTragos('Ana y Luis'),
    listaDeCargaOperativa: crearListaCarga('Fiesta A'),
    videoVida: crearVideoVida('Recuerdos Ana y Luis', 'Tema A'),
    clientPortalSettings: crearPortalCliente('robot-portal-a'),
    socialGallerySettings: crearSocialGallery(),
    guestExperienceSettings: crearGuestExperience(),
  };

  const fiestaB: FiestaEnPlanificacion = {
    id: ROBOT_FIESTA_B_ID,
    estado: 'En Planificación',
    presupuestoId: presupuestoB.id,
    menuAsignadoId: ROBOT_MENU_PUBLICADO_ID,
    configuracion: {
      nombreEvento: ROBOT_FIESTA_B_NOMBRE,
      tipoCelebracion: 'XV años',
      fechaEvento: fecha20Dias,
      horaInicio: '21:30',
      horaFin: '05:30',
      nombreLugar: 'Salón Prado',
      direccionLugar: 'Av. Blandengues 420, Salto',
      invitadosEstimados: 140,
      invitadosAdultos: 80,
      invitadosNinos: 10,
      invitadosAdolescentes: 50,
      presupuestoEstimado: 112000,
      notesAdicionales: 'Fiesta activa B sembrada para el auditor robot.',
      clienteId: clienteB.id,
      clienteNombre: clienteB.name,
      protagonista1Nombre: 'Sofía',
      nombreAgasajado: 'Sofía',
    },
    modulosContratados: crearModulosActivos(),
    personalAsignado: crearPersonal(empleado1.id),
    invitados: crearInvitados('Sofia', 'robot-token-b'),
    decoracion: crearDecoracion('b', '#db2777', '#0f172a', '#f472b6'),
    cartaTragos: crearCartaTragos('Sofía'),
    listaDeCargaOperativa: crearListaCarga('Fiesta B'),
    videoVida: crearVideoVida('Recuerdos Sofía', 'Tema B'),
    clientPortalSettings: crearPortalCliente('robot-portal-b'),
    socialGallerySettings: crearSocialGallery(),
    guestExperienceSettings: crearGuestExperience(),
  };

  // Igual que src/lib/automatico/al-entrar-a-la-app.ts ~326-352
  const fiestaMuestra: FiestaEnPlanificacion = {
    id: ROBOT_MUESTRA_ID,
    esMuestra: true,
    estado: 'En Planificación',
    configuracion: {
      nombreEvento: ROBOT_MUESTRA_NOMBRE,
      tipoCelebracion: 'XV',
      fechaEvento: fecha30Dias,
      horaInicio: '21:00',
      horaFin: '05:00',
      nombreLugar: 'Club Uruguay',
      invitadosEstimados: 120,
      presupuestoEstimado: 185000,
      notesAdicionales: 'Fiesta de muestra para el auditor.',
      protagonista1Nombre: 'Martina',
    },
    modulosContratados: crearModulosActivos(),
    personalAsignado: [],
    invitados: [
      {
        id: 'demo_guest_1',
        guestAccessToken: 'token-muestra-1',
        nombre: 'Invitado demo 1',
        categoria: 'Adulto',
        contacto: '098000001',
        rsvp: 'Confirmado',
        tableNumber: '1',
      },
    ],
    videoVida: crearVideoVida('Recuerdos de muestra', 'Tema muestra'),
    clientPortalSettings: crearPortalCliente('muestra-auditor-key-fija'),
  };

  return {
    fiestas: [fiestaA, fiestaB, fiestaMuestra],
    clientes: [clienteA, clienteB],
    presupuestos: [presupuestoA, presupuestoB],
    menus: [menuPublicado, menuBorrador],
    servicios: [servicioPublicado, servicioBorrador],
    empleados: [empleado1],
  };
}

export async function sembrarRobot(): Promise<{
  fiestasIds: string[];
  clientesIds: string[];
  presupuestosIds: string[];
  menusIds: string[];
  serviciosIds: string[];
}> {
  const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
  if (!emulatorHost) {
    throw new Error(
      'Prohibido sembrar sin FIRESTORE_EMULATOR_HOST: el sembrador del robot sólo puede correr contra el emulador, nunca contra producción.',
    );
  }
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || ROBOT_PROJECT_ID;
  if (!projectId.startsWith('demo-')) {
    throw new Error(`Proyecto inválido para el robot ("${projectId}"): debe empezar con "demo-".`);
  }

  if (!getApps().length) {
    initializeApp({ projectId });
  }
  const db = getFirestore();
  const datos = construirDatosRobot();
  const syncedAt = new Date().toISOString();

  const escribirColeccion = async <T extends { id: string }>(coleccion: string, items: T[]) => {
    const batch = db.batch();
    for (const item of items) {
      const ref = db.collection(coleccion).doc(item.id);
      batch.set(ref, sanitizarParaFirestore({ ...item, _syncedAt: syncedAt }));
    }
    await batch.commit();
  };

  await Promise.all([
    escribirColeccion('fiestas', datos.fiestas),
    escribirColeccion('clientes', datos.clientes),
    escribirColeccion('presupuestos', datos.presupuestos),
    escribirColeccion('menus_catering', datos.menus),
    escribirColeccion('servicios', datos.servicios),
    escribirColeccion('empleados', datos.empleados),
    // El servidor busca en `users` al dueño de la cookie del robot (`ponerSesionDelEquipo`,
    // userId "admin"); sin él, cada acción contestaba "Tu sesión se cerró" y el robot veía
    // 500 en todas las pantallas del equipo (25/11/2026).
    escribirColeccion('users', [
      { id: 'admin', email: 'admin@akproducciones.com', role: 'admin', perfil: 'dueno', versionDeSesion: 1 },
      { id: 'auditor-e2e', email: 'auditor@externo.test', role: 'admin', perfil: 'auditor', versionDeSesion: 1 },
    ]),
  ]);

  return {
    fiestasIds: datos.fiestas.map((f) => f.id),
    clientesIds: datos.clientes.map((c) => c.id),
    presupuestosIds: datos.presupuestos.map((p) => p.id),
    menusIds: datos.menus.map((m) => m.id),
    serviciosIds: datos.servicios.map((s) => s.id),
  };
}

const esEjecucionDirecta =
  typeof process !== 'undefined' &&
  Array.isArray(process.argv) &&
  process.argv[1] &&
  process.argv[1].replace(/\\/g, '/').endsWith('tests/robot/sembrar.ts');

if (esEjecucionDirecta) {
  sembrarRobot()
    .then((res) => {
      console.log('[robot:sembrar] Base del emulador sembrada:', JSON.stringify(res));
      process.exit(0);
    })
    .catch((err) => {
      console.error('[robot:sembrar] Error:', err instanceof Error ? err.message : err);
      process.exit(1);
    });
}
