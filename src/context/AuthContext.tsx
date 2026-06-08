import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signOut, updateProfile,
  type User,
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { createUserDoc, getUserDoc, isDisplayNameTaken } from '../firebase/db';
import type { AppUser } from '../types';

interface AuthCtx {
  firebaseUser: User | null;
  appUser: AppUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

function fallbackAppUser(user: User): AppUser {
  return {
    uid: user.uid,
    displayName: user.displayName ?? user.email?.split('@')[0] ?? 'Usuario',
    email: user.email ?? '',
    role: 'user',
    totalPoints: 0,
    createdAt: new Date(),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async user => {
      setFirebaseUser(user);
      if (user) {
        try {
          let u = await getUserDoc(user.uid);
          // Doc doesn't exist yet (e.g. Firestore write failed on register) — create it now
          if (!u) {
            await createUserDoc(user.uid, user.displayName ?? '', user.email ?? '');
            u = await getUserDoc(user.uid);
          }
          setAppUser(u ?? fallbackAppUser(user));
        } catch {
          // Firestore unreachable — use Auth data as fallback so UI doesn't break
          setAppUser(fallbackAppUser(user));
        }
      } else {
        setAppUser(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  async function login(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function register(email: string, password: string, displayName: string) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName });
    try {
      const taken = await isDisplayNameTaken(displayName);
      if (taken) {
        await cred.user.delete();
        const err = new Error('Nombre de usuario ya en uso') as Error & { code: string };
        err.code = 'app/display-name-taken';
        throw err;
      }
      await createUserDoc(cred.user.uid, displayName, email);
      const u = await getUserDoc(cred.user.uid);
      setAppUser(u ?? fallbackAppUser(cred.user));
    } catch (err) {
      const code = (err as { code?: string }).code ?? '';
      if (code === 'app/display-name-taken') throw err;
      setAppUser(fallbackAppUser(cred.user));
    }
  }

  async function logout() {
    await signOut(auth);
  }

  return (
    <Ctx.Provider value={{ firebaseUser, appUser, loading, login, register, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
