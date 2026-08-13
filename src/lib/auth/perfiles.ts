/**
 * Quién puede ver y tocar qué.
 *
 * Antes había dos roles sueltos (`admin` y `user`) y una pantalla que dejaba
 * asignar "módulos" por persona. Esos módulos no se comprobaban en ningún lado:
 * se guardaban y se mostraban como etiquetas, pero cualquiera con sesión entraba
 * igual a todo. Un cartel, no una puerta.
 *
 * Acá viven los perfiles de verdad. La regla es simple: cada perfil trae su lista
 * de permisos, y el servidor la comprueba antes de dejar hacer nada. Lo que se
 * esconde en pantalla es una comodidad; lo que decide es esto.
 */

export const PERMISOS = {
  /** Presupuestos, facturas, pagos, estado de cuenta. */
  CONTABILIDAD: 'contabilidad',
  /** Sueldos del personal y recibos. Aparte de contabilidad a proposito: la
   *  secretaria factura, pero no tiene por que ver cuanto gana cada uno. */
  SUELDOS: 'sueldos',
  /** Ganancias, costos reales y margen del negocio. */
  GANANCIAS: 'ganancias',
  /** Prospectos, seguimiento comercial, agenda. */
  CRM: 'crm',
  /** Armar y editar fiestas: menu, decoracion, cronograma, invitados. */
  ORGANIZACION: 'organizacion',
  /** La noche: control de entrada, muro, pantalla gigante, estaciones. */
  NOCHE: 'noche',
  /** Insumos, stock y proveedores. */
  INSUMOS: 'insumos',
  /** Crear usuarios, cambiar perfiles, borrar o resetear datos. */
  ADMINISTRACION: 'administracion',
} as const;

export type Permiso = (typeof PERMISOS)[keyof typeof PERMISOS];

export type Perfil =
  | 'dueno'
  | 'secretaria'
  | 'operador'
  | 'personal'
  | 'cliente'
  | 'prospecto'
  | 'invitado';

const TODOS = Object.values(PERMISOS) as Permiso[];

/**
 * Qué puede hacer cada perfil. Lo que no está en la lista, no se puede.
 */
export const PERMISOS_POR_PERFIL: Record<Perfil, readonly Permiso[]> = {
  // El dueño ve todo, incluida la plata y la administración.
  dueno: TODOS,

  // Factura, cobra y organiza. No ve sueldos ni ganancias: son del dueño.
  secretaria: [PERMISOS.CONTABILIDAD, PERMISOS.CRM, PERMISOS.ORGANIZACION, PERMISOS.INSUMOS],

  // El que está en la fiesta. Puerta, muro y pantalla. Nada de plata.
  operador: [PERMISOS.NOCHE, PERMISOS.ORGANIZACION],

  // Cada empleado ve lo suyo: su recibo y a qué fiesta está asignado. Eso se
  // resuelve por pantalla, no por permiso: no entra a ningún módulo del equipo.
  personal: [],

  // Los tres de afuera no entran a la aplicación del equipo. Tienen sus propias
  // puertas: el portal con su clave, el enlace de la invitación, el CRM.
  cliente: [],
  prospecto: [],
  invitado: [],
};

export const NOMBRE_DEL_PERFIL: Record<Perfil, string> = {
  dueno: 'Dueño',
  secretaria: 'Secretaria / Administración',
  operador: 'Operador de fiesta',
  personal: 'Personal',
  cliente: 'Cliente',
  prospecto: 'Prospecto',
  invitado: 'Invitado',
};

export const QUE_HACE_CADA_PERFIL: Record<Perfil, string> = {
  dueno: 'Ve y hace todo, incluidas las ganancias y los sueldos.',
  secretaria: 'Presupuestos, cobros, clientes y organización de las fiestas. No ve sueldos ni ganancias.',
  operador: 'La noche de la fiesta: control de entrada, muro y pantalla gigante. No ve nada de plata.',
  personal: 'Sólo su propio recibo y a qué fiesta está asignado.',
  cliente: 'Su portal, con su clave. No entra a la aplicación del equipo.',
  prospecto: 'Todavía no es cliente: vive en el CRM.',
  invitado: 'Su invitación, con su enlace.',
};

/** Los perfiles que se le pueden asignar a alguien del equipo. */
export const PERFILES_DEL_EQUIPO: readonly Perfil[] = ['dueno', 'secretaria', 'operador', 'personal'];

export function esPerfilValido(valor: unknown): valor is Perfil {
  return typeof valor === 'string' && valor in PERMISOS_POR_PERFIL;
}

/**
 * Traduce los dos roles viejos al perfil nuevo.
 *
 * Las cuentas que ya existen no tienen perfil cargado. `admin` pasa a dueño y
 * `user` a secretaria, que es lo que venia haciendo un colaborador: nadie pierde
 * acceso a lo que ya usaba, salvo los sueldos y las ganancias, que es justamente
 * lo que hay que cerrar.
 */
export function perfilDesdeRolViejo(role: string | undefined | null): Perfil {
  return role === 'admin' ? 'dueno' : 'secretaria';
}

export function perfilDe(user: { perfil?: string; role?: string } | undefined | null): Perfil {
  if (esPerfilValido(user?.perfil)) return user.perfil;
  return perfilDesdeRolViejo(user?.role);
}

export function puede(
  user: { perfil?: string; role?: string } | undefined | null,
  permiso: Permiso,
): boolean {
  // Sin usuario no se puede nada.
  //
  // Antes, preguntar por alguien que no existe devolvia los permisos de
  // secretaria, que incluyen ver plata. Venia de la conversion de las cuentas
  // viejas: el que no tiene perfil cargado se trata como secretaria, y eso esta
  // bien para una cuenta de verdad, pero no para la ausencia de cuenta. Una
  // pantalla que preguntaba antes de terminar de cargar la sesion mostraba
  // numeros que no le correspondian.
  //
  // La conversion de las cuentas viejas sigue igual: esto solo cambia el caso en
  // que no hay nadie.
  if (!user) return false;
  return PERMISOS_POR_PERFIL[perfilDe(user)].includes(permiso);
}
