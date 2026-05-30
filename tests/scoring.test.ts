import { describe, it, expect } from 'vitest';
import { calculatePoints, isMatchLocked } from '@/features/predictions/utils/scoringSystem';

describe('Sistema de Puntuación (calculatePoints)', () => {
  it('Debe retornar 3 puntos si el resultado es exacto', () => {
    const result = { homeGoals: 2, awayGoals: 1 };
    const prediction = { homeGoals: 2, awayGoals: 1 };
    expect(calculatePoints(result, prediction)).toBe(3);
  });

  it('Debe retornar 1 punto si acierta el signo pero no el marcador exacto (victoria local)', () => {
    const result = { homeGoals: 3, awayGoals: 1 };
    const prediction = { homeGoals: 1, awayGoals: 0 };
    expect(calculatePoints(result, prediction)).toBe(1);
  });

  it('Debe retornar 1 punto si acierta el signo de empate pero con goles distintos', () => {
    const result = { homeGoals: 2, awayGoals: 2 };
    const prediction = { homeGoals: 1, awayGoals: 1 };
    expect(calculatePoints(result, prediction)).toBe(1);
  });

  it('Debe retornar 0 puntos si falla el signo por completo', () => {
    const result = { homeGoals: 0, awayGoals: 2 };
    const prediction = { homeGoals: 2, awayGoals: 1 };
    expect(calculatePoints(result, prediction)).toBe(0);
  });
});

describe('Bloqueo de Apuestas (isMatchLocked)', () => {
  it('Debe bloquear la apuesta si la hora actual es posterior al inicio del partido', () => {
    const pastDate = new Date(Date.now() - 1000 * 60 * 5); // Hace 5 minutos
    expect(isMatchLocked(pastDate)).toBe(true);
  });

  it('Debe permitir la apuesta si el partido es en el futuro', () => {
    const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24); // Mañana
    expect(isMatchLocked(futureDate)).toBe(false);
  });
});
