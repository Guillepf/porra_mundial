import { doc, setDoc, writeBatch, collection, getDocs, query, where, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { auth } from '@/lib/firebase';
import { Match, Prediction, UserProfile } from '@/types/global.types';
import { calculatePoints } from '@/features/predictions/utils/scoringSystem';
import { standingsService } from '@/features/standings/services/standingsService';

export const adminService = {
  // Crear o actualizar un partido
  async saveMatch(matchId: string | null, matchData: Partial<Match>): Promise<void> {
    const finalId = matchId || `match_${Date.now()}`;
    const docRef = doc(db, 'matches', finalId);

    const payload: Record<string, unknown> = {
      ...matchData,
      updatedAt: serverTimestamp(),
    };

    if (!matchId) {
      payload.createdAt = serverTimestamp();
    }

    await setDoc(docRef, payload, { merge: true });
  },

  // Introducir el resultado real de un partido y disparar el cálculo
  async setMatchResult(matchId: string, homeGoals: number, awayGoals: number): Promise<void> {
    // 1. Actualizar el partido con el resultado y estado finalizado
    const matchRef = doc(db, 'matches', matchId);
    await setDoc(
      matchRef,
      {
        status: 'finished',
        result: { homeGoals, awayGoals },
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    // 2. Traer todos los pronósticos de este partido
    const predictionsRef = collection(db, 'predictions');
    const q = query(predictionsRef, where('matchId', '==', matchId));
    const snapshot = await getDocs(q);

    const batch = writeBatch(db);

    // 3. Calcular puntos para cada pronóstico y encolar actualización
    const predictions = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Prediction, 'id'>),
    }));

    console.log('Admin setMatchResult: current auth uid=', auth.currentUser?.uid, 'predictionsCount=', predictions.length);

    for (const pred of predictions) {
        console.log('Enqueue prediction update:', pred.id, { userId: pred.userId, matchId: pred.matchId });
      const points = calculatePoints({ homeGoals, awayGoals }, { homeGoals: pred.homeGoals, awayGoals: pred.awayGoals });
      const predRef = doc(db, 'predictions', pred.id);
      batch.update(predRef, {
        points,
        isLocked: true,
        updatedAt: serverTimestamp(),
      });
    }

    try {
      await batch.commit();
    } catch (err) {
      // Si falla el batch (p. ej. permiso en alguno), intentamos aplicar updates uno-a-uno
      console.error('Batch commit for predictions failed, falling back to individual updates', err);
      const failedIds: string[] = [];

      for (const pred of predictions) {
        const predRef = doc(db, 'predictions', pred.id);
        const points = calculatePoints({ homeGoals, awayGoals }, { homeGoals: pred.homeGoals, awayGoals: pred.awayGoals });
        try {
          await updateDoc(predRef, {
            points,
            isLocked: true,
            updatedAt: serverTimestamp(),
          });
        } catch (e) {
          console.error(`Failed to update prediction ${pred.id}:`, e);
          failedIds.push(pred.id);
            console.log('Attempting single update for prediction', pred.id, pred);
        }
      }

      if (failedIds.length > 0) {
        throw new Error(`Failed to update predictions: ${failedIds.join(', ')}; original error: ${String(err)}`);
      }
    }

    // 4. Recalcular las estadísticas y el puntaje acumulado de todos los usuarios
    await this.recalculateAllUsersPoints();
  },

  // Recalcular todos los puntos de todos los usuarios y generar la clasificación
  async recalculateAllUsersPoints(): Promise<void> {
    // Traer todos los usuarios
    const usersRef = collection(db, 'users');
    const usersSnap = await getDocs(usersRef);

    const batch = writeBatch(db);

    for (const userDoc of usersSnap.docs) {
      const userId = userDoc.id;

      // Traer todos los pronósticos de este usuario
      const predRef = collection(db, 'predictions');
      const q = query(predRef, where('userId', '==', userId));
      const predSnap = await getDocs(q);

      let totalPoints = 0;
      let exactPredictions = 0;
      let totalPredictions = predSnap.docs.length;

      predSnap.docs.forEach((doc) => {
        const pred = doc.data() as Prediction;
        if (pred.points !== null && pred.points !== undefined) {
          totalPoints += pred.points;
          if (pred.points === 3) {
            exactPredictions += 1;
          }
        }
      });

      // Actualizar el perfil del usuario con los acumulados
      const userDocRef = doc(db, 'users', userId);
      batch.update(userDocRef, {
        totalPoints,
        exactPredictions,
        totalPredictions,
        updatedAt: serverTimestamp(),
      });
    }

    await batch.commit();

    // 5. Regenerar el snapshot de clasificación pública global
    await standingsService.regenerateStandings();
  },
};
