
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { map, take, tap } from 'rxjs/operators';

export const adminGuard = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return authService.isAdmin$.pipe(
        take(1),
        tap(isAdmin => {
            if (!isAdmin) {
                console.warn('Access denied: User is not an admin.');
                router.navigate(['/']); // Redirect to home
            }
        })
    );
};
