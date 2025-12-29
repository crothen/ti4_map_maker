import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getAuth, provideAuth } from '@angular/fire/auth';

import { routes } from './app.routes';

const firebaseConfig = {
  projectId: "ti4-planner-chris-001",
  appId: "1:689229008896:web:708b32c8adcd0416d508e5",
  storageBucket: "ti4-planner-chris-001.firebasestorage.app",
  apiKey: "AIzaSyCYyCI_akiWLGpWgO64oMjeUhLZ8dAnQws",
  authDomain: "ti4-planner-chris-001.firebaseapp.com",
  messagingSenderId: "689229008896"
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(),
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideFirestore(() => getFirestore()),
    provideAuth(() => getAuth())
  ]
};
