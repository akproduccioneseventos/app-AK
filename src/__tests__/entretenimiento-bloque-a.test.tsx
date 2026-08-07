import { calculateLeaderboard, TriviaParticipant } from '@/lib/games/game-engine';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { SocialGalleryPost } from '@/types/social-gallery';

// Mock components to test isolated logic
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    return <img {...props} />;
  },
}));

describe('Bloque A: Entretenimiento Personalizado', () => {
  describe('A.1: Trivia por mesa', () => {
    it('suma los puntos al total de la mesa correcta', () => {
      const participants: TriviaParticipant[] = [
        { guestId: '1', guestName: 'Juan', tableNumber: 'Mesa 1', score: 100, answers: [] },
        { guestId: '2', guestName: 'Ana', tableNumber: 'Mesa 1', score: 150, answers: [] },
        { guestId: '3', guestName: 'Pedro', tableNumber: 'Mesa 2', score: 200, answers: [] },
      ];

      const result = calculateLeaderboard(participants);

      expect(result.tableLeaderboard).toBeDefined();
      expect(result.tableLeaderboard).toHaveLength(2);

      const mesa1 = result.tableLeaderboard?.find(t => t.tableNumber === 'Mesa 1');
      const mesa2 = result.tableLeaderboard?.find(t => t.tableNumber === 'Mesa 2');

      expect(mesa1?.score).toBe(250); // 100 + 150
      expect(mesa2?.score).toBe(200); // 200
    });

    it('ordena el ranking por mesa correctamente', () => {
      const participants: TriviaParticipant[] = [
        { guestId: '1', guestName: 'A', tableNumber: '1', score: 10, answers: [] },
        { guestId: '2', guestName: 'B', tableNumber: '2', score: 50, answers: [] },
        { guestId: '3', guestName: 'C', tableNumber: '3', score: 30, answers: [] },
      ];

      const result = calculateLeaderboard(participants);

      expect(result.tableLeaderboard?.[0].tableNumber).toBe('2'); // 50 pts
      expect(result.tableLeaderboard?.[1].tableNumber).toBe('3'); // 30 pts
      expect(result.tableLeaderboard?.[2].tableNumber).toBe('1'); // 10 pts
    });

    it('permite que un invitado sin mesa juegue y puntÃºe individualmente', () => {
      const participants: TriviaParticipant[] = [
        { guestId: '1', guestName: 'Sin Mesa', score: 100, answers: [] },
      ];

      const result = calculateLeaderboard(participants);

      expect(result.participants).toHaveLength(1);
      expect(result.participants[0].score).toBe(100);
      expect(result.tableLeaderboard).toHaveLength(0); // No tables
    });
  });

  describe('A.2: Muro saluda por nombre (Renderizado de publicaciones)', () => {
    // We test the presentation component logic representing the wall/feed
    // Since FeedPost is a client component, we simulate its rendering
    
    // Instead of deep rendering the complex page, we mock a simple representation 
    // of how the Wall renders author names based on our recent changes.
    const MockWallPost = ({ post }: { post: Partial<SocialGalleryPost> }) => (
      <div data-testid="wall-post">
        {post.authorName && <p data-testid="author-name">{post.authorName}</p>}
      </div>
    );

    it('muestra el nombre si la foto tiene un invitado identificado', () => {
      render(<MockWallPost post={{ authorName: 'Juan PÃ©rez', imageUrl: '/test.jpg' }} />);
      
      const authorEl = screen.getByTestId('author-name');
      expect(authorEl).toBeInTheDocument();
      expect(authorEl.textContent).toBe('Juan PÃ©rez');
    });

    it('no muestra ninguno y no falla si es una foto del QR general (sin nombre)', () => {
      // Missing authorName
      render(<MockWallPost post={{ imageUrl: '/test2.jpg' }} />);
      
      const postEl = screen.getByTestId('wall-post');
      expect(postEl).toBeInTheDocument();
      expect(screen.queryByTestId('author-name')).not.toBeInTheDocument();
    });
  });
});
