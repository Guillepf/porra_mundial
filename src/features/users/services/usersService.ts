import { doc, getDoc, getDocs, collection, query, where, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserProfile } from '@/types/global.types';

export const usersService = {
  // Obtener perfil completo de un usuario
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { uid: docSnap.id, ...docSnap.data() } as UserProfile;
    }
    return null;
  },

  // Obtener lista completa de usuarios
  async getAllUsers(): Promise<UserProfile[]> {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);

    return snapshot.docs.map((doc) => ({
      uid: doc.id,
      ...doc.data(),
    })) as UserProfile[];
  },

  // Actualizar perfil de usuario (por ejemplo nombre visible)
  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
    const docRef = doc(db, 'users', userId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date(),
    });
  },
};
