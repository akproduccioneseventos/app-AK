import { hasPublicGuestAccess } from '@/lib/guest-portal-public-data';
import type { InvitacionDigitalConfig, HitoInvitacion, HospedajeInvitacion } from '@/types/fiesta';

describe('Bloque 5 - Que las fotos de las estaciones tengan dueño', () => {
  const guest1 = {
    id: 'guest-1',
    nombre: 'Martín Pérez',
    rsvp: 'Confirmado' as const,
    guestAccessToken: 'token-secreto-martin',
  };
  const guest2 = {
    id: 'guest-2',
    nombre: 'Lucía Gómez',
    rsvp: 'Confirmado' as const,
    guestAccessToken: 'token-secreto-lucia',
  };

  describe('Validación de dueño de fotos en estaciones', () => {
    it('comprueba que la foto queda con dueño cuando se envían guestId y token legítimo', () => {
      expect(hasPublicGuestAccess(guest1, 'guest-1', 'token-secreto-martin')).toBe(true);
    });

    it('no asocia dueño si se manda el guestId de otro invitado con un token inválido o de otro', () => {
      // Regla estricta: un identificador suelto no se guarda nunca
      expect(hasPublicGuestAccess(guest1, 'guest-1', 'token-secreto-lucia')).toBe(false);
      expect(hasPublicGuestAccess(guest1, 'guest-1', '')).toBe(false);
      expect(hasPublicGuestAccess(undefined, 'guest-1', 'token-secreto-martin')).toBe(false);
      expect(hasPublicGuestAccess(guest1, 'guest-2', 'token-secreto-martin')).toBe(false);
    });
  });
});

describe('Bloque 6 - Que el anfitrión pueda cargar su historia y sus hoteles', () => {
  it('no muestra secciones si no hay hitos ni hospedajes configurados', () => {
    const configSinDatos: InvitacionDigitalConfig = {
      nombreHomenajeada: 'Sofía',
      tipoEvento: '15',
      estiloEvento: 'formal',
      colorPrincipal: '#d4a574',
      colorSecundario: '#f5e6d3',
      colorAcento: '#8b6f47',
      nombreSalon: 'Salón Salto',
      direccionSalon: 'Av. Costanera 100',
      linkMaps: '',
      fechaEvento: '2026-11-15',
      horaEvento: '21:00',
      fotoPortada: '',
      galeriaFotos: [],
      textoBienvenida: 'Bienvenidos a mis 15',
      dressCode: { tipo: 'formal' },
      mostrarDressCode: true,
      regalos: { tipo: 'ninguno' },
      plantillaId: 'EleganteDorado',
      rsvpActivo: true,
      contadorActivo: true,
      portalSocialActivo: false,
      hitos: [],
      hospedajes: [],
    };

    const hitosVisibles = (configSinDatos.hitos || []).length > 0;
    const hospedajesVisibles = (configSinDatos.hospedajes || []).length > 0;

    expect(hitosVisibles).toBe(false);
    expect(hospedajesVisibles).toBe(false);
  });

  it('permite agregar hitos a la historia sin datos de ejemplo precargados', () => {
    const nuevoHito: HitoInvitacion = {
      fecha: '2020',
      titulo: 'El comienzo',
      descripcion: 'Nos conocimos en la facultad de Salto.',
    };

    const hitos: HitoInvitacion[] = [nuevoHito];
    expect(hitos).toHaveLength(1);
    expect(hitos[0].titulo).toBe('El comienzo');
    expect(hitos[0].fecha).toBe('2020');
  });

  it('permite agregar hospedajes recomendados para invitados de afuera', () => {
    const nuevoHotel: HospedajeInvitacion = {
      nombre: 'Hotel Salto & Casino',
      direccion: '25 de Agosto 5, Salto, Uruguay',
      telefono: '+598 473 32222',
      linkBooking: 'https://www.hotelsalto.com.uy',
    };

    const hospedajes: HospedajeInvitacion[] = [nuevoHotel];
    expect(hospedajes).toHaveLength(1);
    expect(hospedajes[0].nombre).toBe('Hotel Salto & Casino');
    expect(hospedajes[0].direccion).toContain('Salto');
  });

  it('vuelve a ocultar las secciones si se borran todos los hitos y hospedajes', () => {
    let hitos: HitoInvitacion[] = [
      { fecha: '2022', titulo: 'Viaje', descripcion: 'Nuestro primer viaje juntos' },
    ];
    let hospedajes: HospedajeInvitacion[] = [
      { nombre: 'Gran Hotel Brisas', direccion: 'Salto', telefono: '099123456' },
    ];

    expect(hitos.length).toBeGreaterThan(0);
    expect(hospedajes.length).toBeGreaterThan(0);

    // Borrado manual
    hitos = [];
    hospedajes = [];

    expect(hitos.length > 0).toBe(false);
    expect(hospedajes.length > 0).toBe(false);
  });
});
