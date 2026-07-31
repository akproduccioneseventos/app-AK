import { calculateLeaderboard, checkTriviaAnswer, DEFAULT_TRIVIA_QUESTIONS, DEFAULT_PHOTO_MISSIONS, TriviaParticipant } from '../lib/games/game-engine';

describe('game-engine', () => {
  it('calculateLeaderboard returns sorted participants', () => {
    const participants: TriviaParticipant[] = [
      { guestId: '1', guestName: 'Juan', score: 10, answers: [] },
      { guestId: '2', guestName: 'Ana', score: 30, answers: [] },
      { guestId: '3', guestName: 'Pedro', score: 20, answers: [] },
      { guestId: '4', guestName: 'Maria', score: 40, answers: [] }
    ];

    const leaderboard = calculateLeaderboard(participants);

    expect(leaderboard.participants[0].score).toBe(40);
    expect(leaderboard.participants[1].score).toBe(30);
    expect(leaderboard.participants[2].score).toBe(20);
    expect(leaderboard.participants[3].score).toBe(10);
    
    expect(leaderboard.topThree).toHaveLength(3);
    expect(leaderboard.topThree[0].guestName).toBe('Maria');
    expect(leaderboard.topThree[2].guestName).toBe('Pedro');
  });

  it('checkTriviaAnswer returns true for correct answer', () => {
    const question = DEFAULT_TRIVIA_QUESTIONS[0];
    const isCorrect = checkTriviaAnswer(question, question.correctOptionId);
    expect(isCorrect).toBe(true);

    const wrongOption = question.options.find(o => o.id !== question.correctOptionId)?.id;
    if (wrongOption) {
      const isWrong = checkTriviaAnswer(question, wrongOption);
      expect(isWrong).toBe(false);
    }
  });

  it('DEFAULT_TRIVIA_QUESTIONS has 5 questions', () => {
    expect(DEFAULT_TRIVIA_QUESTIONS).toHaveLength(5);
  });

  it('DEFAULT_PHOTO_MISSIONS has 5 missions', () => {
    expect(DEFAULT_PHOTO_MISSIONS).toHaveLength(5);
  });
});
