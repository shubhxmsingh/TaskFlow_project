import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile, Role } from '../types';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signInEmail: (email: string, pass: string) => Promise<void>;
  signUpEmail: (email: string, pass: string, name: string, role: Role) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getAuthErrorMessage(error: any) {
  const code = error?.code as string | undefined;
  switch (code) {
    case 'auth/operation-not-allowed':
      return 'This sign-in method is disabled in Firebase. Enable Email/Password and Google in Firebase Authentication > Sign-in method.';
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized in Firebase. Add your Railway domain to Authentication > Settings > Authorized domains.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Invalid email or password.';
    case 'auth/email-already-in-use':
      return 'This email is already registered. Try signing in instead.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in popup was closed before completing login.';
    default:
      return error?.message || 'Authentication failed. Please try again.';
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const profileDoc = await getDoc(doc(db, 'users', user.uid));
        if (profileDoc.exists()) {
          setProfile(profileDoc.data() as UserProfile);
        } else {
          // This fallback is mainly for Google sign-in where we don't have the role yet
          const newProfile: UserProfile = {
            uid: user.uid,
            email: user.email!,
            displayName: user.displayName || 'User',
            photoURL: user.photoURL || undefined,
            role: 'member',
            createdAt: new Date().toISOString(),
          };
          await setDoc(doc(db, 'users', user.uid), newProfile);
          setProfile(newProfile);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
  }, []);

  const signIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      toast.success('Signed in successfully');
    } catch (error) {
      console.error(error);
      toast.error(getAuthErrorMessage(error));
    }
  };

  const signInEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      toast.success('Welcome back!');
    } catch (error: any) {
      console.error(error);
      toast.error(getAuthErrorMessage(error));
    }
  };

  const signUpEmail = async (email: string, pass: string, name: string, role: Role) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const user = userCredential.user;
      
      await updateProfile(user, { displayName: name });
      
      const newProfile: UserProfile = {
        uid: user.uid,
        email: user.email!,
        displayName: name,
        role: role,
        createdAt: new Date().toISOString(),
      };
      
      await setDoc(doc(db, 'users', user.uid), newProfile);
      setProfile(newProfile);
      toast.success('Account created!');
    } catch (error: any) {
      console.error(error);
      toast.error(getAuthErrorMessage(error));
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      toast.success('Signed out');
    } catch (error) {
      console.error(error);
      toast.error('Failed to sign out');
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signInEmail, signUpEmail, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
