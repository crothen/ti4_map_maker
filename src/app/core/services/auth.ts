import { Injectable, inject } from '@angular/core';
import { Auth, GoogleAuthProvider, signInWithPopup, user, User } from '@angular/fire/auth';
import { Firestore, doc, onSnapshot } from '@angular/fire/firestore';
import { Observable, of, switchMap, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth: Auth = inject(Auth);
  user$: Observable<User | null> = user(this.auth);

  private firestore: Firestore = inject(Firestore);

  isAdmin$: Observable<boolean> = this.user$.pipe(
    switchMap(u => {
      if (!u) {
        console.log('Auth: No user logged in');
        return of(false);
      }
      console.log('Auth: User checking:', u.uid);
      const userDoc = doc(this.firestore, `users/${u.uid}`);

      return new Observable<any>(observer => {
        return onSnapshot(userDoc,
          (snapshot) => {
            const data = snapshot.data();
            console.log('Auth: User data from Firestore:', data);
            observer.next(data);
          },
          (error) => {
            console.error('Auth: Error fetching user data:', error);
            observer.error(error);
          }
        );
      }).pipe(
        map((data: any) => {
          const isAdmin = data?.roles?.includes('ADMIN') ?? false;
          console.log('Auth: Is Admin?', isAdmin);
          return isAdmin;
        })
      );
    })
  );

  constructor() { }

  loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(this.auth, provider);
  }

  logout() {
    return this.auth.signOut();
  }
}
