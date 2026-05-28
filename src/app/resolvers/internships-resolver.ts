import { ResolveFn } from '@angular/router';
import { inject } from '@angular/core';
import { ApiServices, AppliedInternshipResponse, InternshipResponse, PagedResponse } from '../services/api-services';

export interface InternshipsResolvedData {
    page: PagedResponse<InternshipResponse>;
    appliedInternships: AppliedInternshipResponse[];
}

export const internshipsResolver: ResolveFn<InternshipsResolvedData> = async () => {
    const api = inject(ApiServices);
    const pageSize = 6;
    const page = api.isAdmin()
        ? await api.getInternships(1, pageSize)
        : await api.getEligibleInternships(1, pageSize);

    const appliedInternships = api.isStudent()
        ? await api.getAppliedInternships()
        : [];

    return {
        page,
        appliedInternships
    };
};
