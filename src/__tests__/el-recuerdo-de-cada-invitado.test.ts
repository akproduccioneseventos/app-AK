import { buildMorningRecap, isRecapAvailable } from '@/lib/recap/recap-engine';
import { recordQuinceaneraLeadAction } from '@/app/actions/commercial-intelligence';
import type { SocialGalleryPost } from '@/types/social-gallery';
import type { PublicGuestEvent } from '@/lib/guest-portal-public-data';

describe('El recuerdo de cada invitado (Orden de Agosto 2026)', () => {
  const mockPosts: SocialGalleryPost[] = [
    {
      id: 'post_g1_1',
      fiestaId: 'fiesta_test_1',
      imageUrl: 'https://example.com/foto1.jpg',
      authorName: 'Martina',
      guestId: 'guest_martina',
      timestamp: new Date().toISOString(),
      likes: 5,
      comments: [],
      moderationStatus: 'approved',
    },
    {
      id: 'post_g1_2',
      fiestaId: 'fiesta_test_1',
      imageUrl: 'https://example.com/foto2.jpg',
      authorName: 'Martina',
      guestId: 'guest_martina',
      timestamp: new Date().toISOString(),
      likes: 12,
      comments: [],
      moderationStatus: 'approved',
    },
    {
      id: 'post_general_1',
      fiestaId: 'fiesta_test_1',
      imageUrl: 'https://example.com/foto_top.jpg',
      authorName: 'Lucas',
      guestId: 'guest_lucas',
      timestamp: new Date().toISOString(),
      likes: 85,
      comments: [],
      moderationStatus: 'approved',
    },
    {
      id: 'post_general_2',
      fiestaId: 'fiesta_test_1',
      imageUrl: 'https://example.com/foto_secundaria.jpg',
      authorName: 'Valeria',
      guestId: 'guest_valeria',
      timestamp: new Date().toISOString(),
      likes: 42,
      comments: [],
      moderationStatus: 'approved',
    },
  ];

  const mockFiesta: Partial<PublicGuestEvent> = {
    configuracion: {
      nombreEvento: 'XV de Sofía',
      fechaEvento: '2026-08-16T21:00:00.000Z',
      nombreLugar: 'Club Uruguay',
      tipoCelebracion: '15 Años',
      invitadosEstimados: 120,
    } as any,
    zonaDigitalAdolescentes: {
      enabled: true,
      recapEnabled: true,
      paparazziEnabled: true,
      musicRequestsEnabled: true,
      socialWallLive: true,
      gamesEnabled: true,
      missionsEnabled: true,
      secretMissionsEnabled: true,
    },
    programa: [
      { id: 'p1', hora: '21:30', titulo: 'Entrada Triunfal' },
      { id: 'p2', hora: '23:00', titulo: 'Vals con la Familia' },
    ] as any,
  };

  describe('Bloque 1 y 2 — Filtrado personalizado de fotos por invitado', () => {
    it('prioriza las fotos del invitado que coincidan con guestId', () => {
      const recap = buildMorningRecap(mockFiesta, mockPosts, 'guest_martina');

      expect(recap.guestPhotoCount).toBe(2);
      expect(recap.photos.length).toBe(4);

      // Las dos primeras deben ser las de Martina marcadas con esTuFoto: true
      expect(recap.photos[0].guestId).toBe('guest_martina');
      expect(recap.photos[0].esTuFoto).toBe(true);
      expect(recap.photos[1].guestId).toBe('guest_martina');
      expect(recap.photos[1].esTuFoto).toBe(true);

      // Las siguientes deben ser las fotos generales de la noche
      expect(recap.photos[2].guestId).toBe('guest_lucas');
      expect(recap.photos[2].esTuFoto).toBe(false);
    });

    it('si el invitado no sacó fotos, muestra el recuerdo general de la fiesta sin fallar', () => {
      const recap = buildMorningRecap(mockFiesta, mockPosts, 'guest_sin_fotos');

      expect(recap.guestPhotoCount).toBe(0);
      expect(recap.photos.length).toBe(4);
      expect(recap.photos[0].id).toBe('post_general_1'); // La más votada
      expect(recap.photos[0].esTuFoto).toBe(false);
    });
  });

  describe('Bloque 5 — Guardado de quinceañeras sin teléfono inventado', () => {
    it('no guarda 099000000 cuando no se deja contacto', async () => {
      const res = await recordQuinceaneraLeadAction({
        fiestaId: 'fiesta_test_1',
        nombreFiesta: 'XV de Sofía',
        nombre: 'Agustina',
        respuestaQuince: 'El año que viene',
        contacto: '', // No dejó teléfono
        origen: 'fotocabina',
      });

      expect(res.success).toBe(true);
      expect(res.leadId).toBeDefined();

      const { readData } = await import('@/lib/data-service');
      const leads = await readData<any[]>('crm-leads.json', []);
      const savedLead = leads.find((l) => l.id === res.leadId);

      expect(savedLead).toBeDefined();
      expect(savedLead.phone).toBe(''); // NO '099000000'
      expect(savedLead.notes).toContain('no dejó teléfono');
    });
  });
});
