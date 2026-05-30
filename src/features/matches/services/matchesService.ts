import { collection, query, orderBy, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Match } from '@/types/global.types';

export const matchesService = {
  // Obtener todos los partidos ordenados por fecha
  async getMatches(): Promise<Match[]> {
    const matchesRef = collection(db, 'matches');
    const q = query(matchesRef, orderBy('scheduledAt', 'asc'));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Match[];
  },

  // Obtener partido por ID
  async getMatchById(id: string): Promise<Match | null> {
    const docRef = doc(db, 'matches', id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Match;
    }
    return null;
  },
};
