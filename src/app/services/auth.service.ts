import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { User } from '../models/group.model';
import { Database, ref, onValue, set, get } from '@angular/fire/database';
import { Auth, authState, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private usersSubject = new BehaviorSubject<User[]>([]);

  private readonly avatarColors = [
    '#8B5CF6', '#EC4899', '#06B6D4', '#10B981', '#F59E0B',
    '#EF4444', '#3B82F6', '#6366F1', '#14B8A6', '#F97316'
  ];

  private db = inject(Database);
  private auth = inject(Auth);

  constructor() {
    // Listen to Firebase Auth state
    authState(this.auth).subscribe(async (firebaseUser: any) => {
      if (firebaseUser) {
        // Fetch the custom user profile from Realtime DB
        const userRef = ref(this.db, `users/${firebaseUser.uid}`);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
          this.currentUserSubject.next(snapshot.val());
        } else {
          // If the user profile doesn't exist (e.g. Google Login first time)
          const newUser: User = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            email: firebaseUser.email || '',
            avatarColor: this.getRandomColor()
          };
          await set(userRef, newUser);
          this.currentUserSubject.next(newUser);
        }
      } else {
        this.currentUserSubject.next(null);
      }
    });

    // Listen to Firebase Realtime DB for users list (used for assigning members to groups)
    const usersRef = ref(this.db, 'users');
    onValue(usersRef, (snapshot: any) => {
      const data = snapshot.val();
      const users: User[] = data ? Object.values(data) : [];
      this.usersSubject.next(users);
    });
  }

  get currentUser$(): Observable<User | null> {
    return this.currentUserSubject.asObservable();
  }

  get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }
  
  get users$(): Observable<User[]> {
    return this.usersSubject.asObservable();
  }

  isLoggedIn(): boolean {
    return !!this.currentUserValue;
  }

  async register(name: string, email: string, password: string): Promise<{ success: boolean; message?: string }> {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      const user = userCredential.user;

      const newUser: User = {
        id: user.uid,
        name,
        email,
        avatarColor: this.getRandomColor()
      };

      // Save custom profile in Realtime Database
      await set(ref(this.db, `users/${user.uid}`), newUser);
      
      this.currentUserSubject.next(newUser);
      return { success: true };
    } catch (error: any) {
      console.error("Error registering user", error);
      let message = 'An error occurred during registration.';
      if (error.code === 'auth/email-already-in-use') message = 'Email is already registered.';
      if (error.code === 'auth/weak-password') message = 'Password should be at least 6 characters.';
      if (error.code === 'auth/invalid-email') message = 'Invalid email address.';
      return { success: false, message };
    }
  }

  async login(email: string, password: string): Promise<{ success: boolean; message?: string }> {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      
      // Fetch custom profile to update state synchronously
      const userRef = ref(this.db, `users/${userCredential.user.uid}`);
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        this.currentUserSubject.next(snapshot.val());
      }
      return { success: true };
    } catch (error: any) {
      console.error("Error logging in", error);
      let message = 'Invalid email or password.';
      if (error.code === 'auth/user-not-found') message = 'No account found with this email.';
      if (error.code === 'auth/wrong-password') message = 'Incorrect password.';
      if (error.code === 'auth/invalid-credential') message = 'Invalid credentials provided.';
      return { success: false, message };
    }
  }

  async loginWithGoogle(): Promise<{ success: boolean; message?: string }> {
    try {
      const provider = new GoogleAuthProvider();
      // Using popup for immediate result without redirects
      const userCredential = await signInWithPopup(this.auth, provider);
      const user = userCredential.user;
      
      // Ensure the user exists in the Realtime Database
      const userRef = ref(this.db, `users/${user.uid}`);
      const snapshot = await get(userRef);
      
      if (!snapshot.exists()) {
        const newUser: User = {
          id: user.uid,
          name: user.displayName || user.email?.split('@')[0] || 'User',
          email: user.email || '',
          avatarColor: this.getRandomColor()
        };
        await set(userRef, newUser);
        this.currentUserSubject.next(newUser);
      } else {
        this.currentUserSubject.next(snapshot.val());
      }

      return { success: true };
    } catch (error: any) {
      console.error("Error with Google login", error);
      return { success: false, message: 'Google login was cancelled or failed.' };
    }
  }

  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
    } catch (error) {
      console.error("Error signing out", error);
    }
  }

  getAllUsers(): User[] {
    return this.usersSubject.value;
  }

  private getRandomColor(): string {
    return this.avatarColors[Math.floor(Math.random() * this.avatarColors.length)];
  }
}
