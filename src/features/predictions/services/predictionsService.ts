import { doc, getDoc, setDoc, getDocs, collection, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Prediction } from '@/types/global.types';
import { isMatchLocked } from '../utils/scoringSystem';

export const predictionsService = {
  // Obtener un pronóstico por usuario y partido
  async getPrediction(userId: string, matchId: string): Promise<Prediction | null> {
    const predictionId = `${userId}_${matchId}`;
    const docRef = doc(db, 'predictions', predictionId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Prediction;
    }
    return null;
  },

  // Obtener todos los pronósticos de un usuario específico
  async getUserPredictions(userId: string): Promise<Prediction[]> {
    const predictionsRef = collection(db, 'predictions');
    const q = query(predictionsRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Prediction[];
  },

  // Guardar o actualizar un pronóstico de partido
  async savePrediction(
    userId: string,
    matchId: string,
    homeGoals: number,
    awayGoals: number,
    matchScheduledAt: any
  ): Promise<void> {
    // Comprobar bloqueo a nivel cliente antes de guardar
    if (isMatchLocked(matchScheduledAt)) {
      throw new Error('El partido ya ha comenzado. Apuesta bloqueada.');
    }

    const predictionId = `${userId}_${matchId}`;
    const docRef = doc(db, 'predictions', predictionId);

    const payload = {
      userId,
      matchId,
      homeGoals,
      awayGoals,
      points: null,
      isLocked: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(docRef, payload, { merge: true });
  },
};
