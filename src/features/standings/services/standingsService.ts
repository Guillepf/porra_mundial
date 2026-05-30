import { doc, getDoc, getDocs, collection, query, orderBy, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Ranking, RankingEntry, UserProfile } from '@/types/global.types';

export const standingsService = {
  // Obtener la clasificación en tiempo real
  async getStandings(): Promise<RankingEntry[]> {
    const docRef = doc(db, 'rankings', 'current');
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return (docSnap.data() as Ranking).entries;
    }

    // Fallback: Generar al vuelo desde usuarios si no existe snapshot
    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy('totalPoints', 'desc'), orderBy('exactPredictions', 'desc'));
    const snapshot = await getDocs(q);

    let position = 1;
    return snapshot.docs.map((doc, index) => {
      const data = doc.data() as UserProfile;
      return {
        userId: doc.id,
        displayName: data.displayName || 'Usuario',
        photoURL: data.photoURL,
        totalPoints: data.totalPoints || 0,
        exactPredictions: data.exactPredictions || 0,
        totalPredictions: data.totalPredictions || 0,
        position: index + 1,
      };
    });
  },

  // Actualizar o regenerar el snapshot de clasificación completo
  async regenerateStandings(): Promise<void> {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);

    const entries: RankingEntry[] = snapshot.docs.map((doc) => {
      const data = doc.data() as UserProfile;
      return {
        userId: doc.id,
        displayName: data.displayName || 'Usuario de Porra',
        photoURL: data.photoURL,
        totalPoints: data.totalPoints || 0,
        exactPredictions: data.exactPredictions || 0,
        totalPredictions: data.totalPredictions || 0,
        position: 1, // Se ajusta al ordenar
      };
    });

    // Ordenar: Puntos -> Exactos -> Apuestas totales -> Nombre
    entries.sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) {
        return b.totalPoints - a.totalPoints;
      }
      if (b.exactPredictions !== a.exactPredictions) {
        return b.exactPredictions - a.exactPredictions;
      }
      if (b.totalPredictions !== a.totalPredictions) {
        return b.totalPredictions - a.totalPredictions;
      }
      return a.displayName.localeCompare(b.displayName);
    });

    // Asignar posiciones ordinales correctas
    entries.forEach((entry, idx) => {
      entry.position = idx + 1;
    });

    const rankingRef = doc(db, 'rankings', 'current');
    await setDoc(rankingRef, {
      entries,
      updatedAt: serverTimestamp(),
    });
  },
};
