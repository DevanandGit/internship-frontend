import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { ApiServices } from '../services/api-services';

export const authGuard: CanActivateFn = (route): boolean | UrlTree => {
    const api = inject(ApiServices);
    const router = inject(Router);
    const session = api.getSession();

    if (!session) {
        return router.createUrlTree(['/login']);
    }

    const requiredRoles = (route.data?.['roles'] as string[] | undefined) ?? [];
    if (requiredRoles.length > 0 && !requiredRoles.includes(session.role)) {
        return router.createUrlTree([api.getHomeRoute()]);
    }

    return true;
};

export const guestGuard: CanActivateFn = (): boolean | UrlTree => {
    const api = inject(ApiServices);
    const router = inject(Router);

    return api.isAuthenticated() ? router.createUrlTree([api.getHomeRoute()]) : true;
};