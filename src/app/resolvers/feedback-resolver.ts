import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { ApiServices, FeedbackResponse, PagedResponse, UserProfileResponse } from '../services/api-services';

export interface FeedbackResolvedData {
    profile: UserProfileResponse;
    feedbackPage: PagedResponse<FeedbackResponse>;
}

export const feedbackResolver: ResolveFn<FeedbackResolvedData> = async () => {
    const api = inject(ApiServices);
    const profile = await api.getProfile();

    const feedbackPage = api.isAdmin()
        ? await api.getFeedbacks(1, 6)
        : {
            items: [],
            pageNumber: 1,
            pageSize: 6,
            totalCount: 0,
            totalPages: 0
        };

    return { profile, feedbackPage };
};
