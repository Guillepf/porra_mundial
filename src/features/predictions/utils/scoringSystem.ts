import { Match, Prediction } from '@/types/global.types';

/**
 * Calcula los puntos de un pronóstico basado en el resultado real.
 * Resultado exacto = 3 puntos.
 * Signo/Ganador o Empate correcto = 1 punto.
 * Error absoluto = 0 puntos.
 */
export function calculatePoints(
  result: { homeGoals: number; awayGoals: number },
  prediction: { homeGoals: number; awayGoals: number }
): 0 | 1 | 3 {
  // Resultado exacto
  if (
    result.homeGoals === prediction.homeGoals &&
    result.awayGoals === prediction.awayGoals
  ) {
    return 3;
  }

  // Signo correcto (victoria local, empate o victoria visitante)
  const resultSign = Math.sign(result.homeGoals - result.awayGoals);
  const predictionSign = Math.sign(prediction.homeGoals - prediction.awayGoals);

  if (resultSign === predictionSign) {
    return 1;
  }

  return 0;
}

/**
 * Determina si las apuestas para un partido están bloqueadas (según la fecha actual).
 */
export function isMatchLocked(matchDate: any): boolean {
  if (!matchDate) return true;
  // Convertir Timestamp de Firestore a objeto de fecha JavaScript
  const scheduledTime = typeof matchDate.toDate === 'function' 
    ? matchDate.toDate().getTime() 
    : new Date(matchDate).getTime();
  
  return Date.now() >= scheduledTime;
}
