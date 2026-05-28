import { ResolveFn } from '@angular/router';
import { inject } from '@angular/core';
import { ApiServices } from '../services/api-services';

export interface ProfileResolvedData {
    profile: Awaited<ReturnType<ApiServices['getProfile']>>;
    adminApplications: Awaited<ReturnType<ApiServices['getInternshipApplications']>>;
}

export const profileResolver: ResolveFn<ProfileResolvedData> = async () => {
    const api = inject(ApiServices);
    const profile = await api.getProfile();
    const adminApplications = profile.adminProfile
        ? await api.getInternshipApplications(null)
        : [];

    return { profile, adminApplications };
};
