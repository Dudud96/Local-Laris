import { create } from 'zustand';
import { User as FirebaseUser, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export type UserRole = 'admin' | 'seller' | 'buyer';

export interface AppUser {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  storeId?: string;
  photoURL?: string;
}

interface AuthState {
  user: AppUser | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  setUser: (user: AppUser | null) => void;
  setFirebaseUser: (u: FirebaseUser | null) => void;
  setLoading: (l: boolean) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  firebaseUser: null,
  loading: true,
  setUser: (user) => set({ user }),
  setFirebaseUser: (firebaseUser) => set({ firebaseUser }),
  setLoading: (loading) => set({ loading }),
  logout: async () => {
    await signOut(auth);
    set({ user: null, firebaseUser: null });
  },
}));

export const initAuth = () => {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    useAuthStore.getState().setFirebaseUser(firebaseUser);
    
    if (firebaseUser) {
      try {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const data = userDoc.data() as Omit<AppUser, 'uid'>;
          useAuthStore.getState().setUser({ uid: firebaseUser.uid, ...data });
        } else {
          // If no doc exists due to previous permission error, create it now
          const role: UserRole = firebaseUser.email === 'dududsaputra@gmail.com' ? 'seller' : 'buyer';
          const newDoc = {
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            role,
          };
          
          import('firebase/firestore').then(({ doc, setDoc, serverTimestamp }) => {
            setDoc(userDocRef, { ...newDoc, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }).catch(console.error);
            if (role === 'seller') {
               const storeRef = doc(userDocRef.firestore, 'stores', firebaseUser.uid);
               setDoc(storeRef, {
                 ownerId: firebaseUser.uid,
                 storeName: `${newDoc.name} Store`,
                 description: '',
                 status: 'pending',
                 isVerified: false,
                 createdAt: serverTimestamp(),
                 updatedAt: serverTimestamp()
               }).catch(console.error);
            }
          });
          
          useAuthStore.getState().setUser({ 
            uid: firebaseUser.uid, 
            ...newDoc
          });
        }
      } catch (e) {
        console.error("Error fetching user profile:", e);
      }
    } else {
      useAuthStore.getState().setUser(null);
    }
    useAuthStore.getState().setLoading(false);
  });
};
