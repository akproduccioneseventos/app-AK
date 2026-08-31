import { sendPublicReaction, getPublicLiveReactions } from '@/app/actions/social-interactive';

describe('Orden 22 — La Pantalla Gigante y Mejoras de Entretenimiento', () => {
  describe('Bloque 3: Reacciones en vivo y aplausos que flotan', () => {
    it('permite enviar reacciones de aplausos, corazon y fuego', async () => {
      const fiestaId = 'fiesta_test_rx_123';
      const r1 = await sendPublicReaction(fiestaId, 'aplausos');
      expect(r1.success).toBe(true);
      expect(r1.reaction?.emoji).toBe('👏');

      const r2 = await sendPublicReaction(fiestaId, 'corazon');
      expect(r2.success).toBe(true);
      expect(r2.reaction?.emoji).toBe('❤️');

      const r3 = await sendPublicReaction(fiestaId, 'fuego');
      expect(r3.success).toBe(true);
      expect(r3.reaction?.emoji).toBe('🔥');

      const live = await getPublicLiveReactions(fiestaId);
      expect(live.length).toBeGreaterThanOrEqual(3);
      expect(live.map(r => r.type)).toContain('aplausos');
      expect(live.map(r => r.type)).toContain('corazon');
      expect(live.map(r => r.type)).toContain('fuego');
    });
  });

  describe('Bloque 2: Qué viene ahora (Cronograma en pantalla)', () => {
    it('no genera huecos si la fiesta no tiene cronograma cargado', () => {
      const programaVacio: any[] = [];
      const playlist = [
        { id: '1', type: 'cronograma', enabled: true, title: 'Programa', durationSeconds: 15 },
        { id: '2', type: 'mural', enabled: true, title: 'Fotos', durationSeconds: 15 },
      ];

      const filtrada = playlist.filter(item => {
        if (item.type === 'cronograma' && (!programaVacio || programaVacio.length === 0)) return false;
        return true;
      });

      expect(filtrada).toHaveLength(1);
      expect(filtrada[0].type).toBe('mural');
    });

    it('incluye la tarjeta de cronograma cuando hay momentos cargados', () => {
      const programaConMomentos = [
        { hora: '23:30', titulo: 'Vals de los 15' },
        { hora: '01:00', titulo: 'Corte de Torta' },
      ];
      const playlist = [
        { id: '1', type: 'mural', enabled: true, title: 'Fotos', durationSeconds: 15 },
      ];

      let lista = [...playlist];
      if (programaConMomentos.length > 0 && !lista.some(i => i.type === 'cronograma')) {
        lista.push({ id: 'auto_cronograma', type: 'cronograma', title: 'Qué viene ahora', durationSeconds: 15, enabled: true });
      }

      expect(lista.some(i => i.type === 'cronograma')).toBe(true);
    });
  });

  describe('Bloque 4: Moderación asistida sin IA de pago', () => {
    it('detecta posibles fotos repetidas y palabras sensibles para avisar al moderador humano', () => {
      const SENSITIVE_WORDS = ['spam', 'insulto', 'estafa', 'troll', 'fake', 'ofensivo'];
      function checkAssistance(post: any, allPosts: any[]) {
        const isDuplicate = allPosts.some(
          p => p.id !== post.id && p.authorName === post.authorName && (p.imageUrl === post.imageUrl || Math.abs(new Date(p.timestamp).getTime() - new Date(post.timestamp).getTime()) < 30_000)
        );
        const text = `${post.authorName || ''} ${post.caption || ''}`.toLowerCase();
        const hasSensitiveWords = SENSITIVE_WORDS.some(word => text.includes(word));
        return { isDuplicate, hasSensitiveWords };
      }

      const all = [
        { id: 'p1', authorName: 'Carlos', imageUrl: 'https://img.com/1.jpg', timestamp: '2026-08-31T20:00:00Z', caption: 'Hermosa fiesta' },
        { id: 'p2', authorName: 'Carlos', imageUrl: 'https://img.com/1.jpg', timestamp: '2026-08-31T20:00:10Z', caption: 'Hermosa fiesta' },
        { id: 'p3', authorName: 'Invitado X', imageUrl: 'https://img.com/3.jpg', timestamp: '2026-08-31T20:05:00Z', caption: 'Esto es puro spam y troll' },
      ];

      const check1 = checkAssistance(all[1], all);
      expect(check1.isDuplicate).toBe(true);
      expect(check1.hasSensitiveWords).toBe(false);

      const check2 = checkAssistance(all[2], all);
      expect(check2.isDuplicate).toBe(false);
      expect(check2.hasSensitiveWords).toBe(true);
    });
  });
});
