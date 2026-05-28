import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
    ApiServices,
    AppliedInternshipResponse,
    FeedbackResponse,
    PagedResponse,
    UserProfileResponse
} from '../../services/api-services';
import { FeedbackResolvedData } from '../../resolvers/feedback-resolver';

@Component({
    selector: 'app-feedback',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './feedback.html',
    styleUrl: './feedback.css'
})
export class FeedbackComponent implements OnInit {
    private readonly formBuilder = inject(FormBuilder);
    private readonly cdr = inject(ChangeDetectorRef);

    protected profile: UserProfileResponse | null = null;
    protected isAdminView = false;
    protected isLoading = true;
    protected message = '';
    protected pageNumber = 1;
    protected pageSize = 6;
    protected totalPages = 0;
    protected totalCount = 0;
    protected feedbacks: FeedbackResponse[] = [];
    protected studentInternships: AppliedInternshipResponse[] = [];
    protected activeInternship: AppliedInternshipResponse | null = null;
    protected showModal = false;
    protected isSubmitting = false;
    protected submittedInternshipIds = new Set<number>();

    protected readonly feedbackForm = this.formBuilder.group({
        rating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
        comments: ['']
    });

    constructor(
        private readonly api: ApiServices,
        private readonly route: ActivatedRoute
    ) { }

    async ngOnInit(): Promise<void> {
        const resolved = this.route.snapshot.data?.['feedbackData'] as FeedbackResolvedData | undefined;
        if (resolved) {
            this.applyResolvedData(resolved);
            this.isLoading = false;
            return;
        }

        await this.loadData(1);
    }

    openFeedbackModal(internship: AppliedInternshipResponse): void {
        this.activeInternship = internship;
        this.feedbackForm.reset({ rating: 5, comments: '' });
        this.showModal = true;
    }

    closeModal(): void {
        this.showModal = false;
        this.activeInternship = null;
        this.feedbackForm.reset({ rating: 5, comments: '' });
        this.isSubmitting = false;
        this.cdr.detectChanges();
    }

    async submitFeedback(): Promise<void> {
        if (!this.activeInternship) {
            return;
        }

        if (this.feedbackForm.invalid) {
            this.feedbackForm.markAllAsTouched();
            return;
        }

        this.isSubmitting = true;
        try {
            const raw = this.feedbackForm.getRawValue();
            await this.api.submitFeedback(this.activeInternship.internshipId, {
                rating: Number(raw.rating ?? 5),
                comments: raw.comments?.trim() || ''
            });

            this.message = 'Feedback submitted successfully.';
            this.submittedInternshipIds.add(this.activeInternship.internshipId);
            this.closeModal();
            this.cdr.detectChanges();
        } catch (error) {
            this.message = this.api.extractErrorMessage(error, 'Could not submit feedback.');
        } finally {
            this.isSubmitting = false;
        }
    }

    async changePage(delta: number): Promise<void> {
        const nextPage = this.pageNumber + delta;
        if (nextPage < 1 || nextPage > this.totalPages) {
            return;
        }

        await this.loadData(nextPage);
    }

    isApproved(application: AppliedInternshipResponse): boolean {
        return application.status === 'Approved';
    }

    canSubmitFor(internshipId: number): boolean {
        return !this.submittedInternshipIds.has(internshipId);
    }

    private applyResolvedData(resolved: FeedbackResolvedData): void {
        this.profile = resolved.profile;
        this.isAdminView = this.api.isAdmin();
        if (this.isAdminView) {
            this.applyFeedbackPage(resolved.feedbackPage);
        } else {
            this.studentInternships = this.profile.appliedInternships.filter((item) => item.status === 'Approved');
        }
    }

    private async loadData(pageNumber: number): Promise<void> {
        this.isLoading = true;
        this.message = '';

        try {
            this.profile = await this.api.getProfile();
            this.isAdminView = this.api.isAdmin();
            if (this.isAdminView) {
                const page = await this.api.getFeedbacks(pageNumber, this.pageSize);
                this.applyFeedbackPage(page);
            } else {
                this.studentInternships = this.profile.appliedInternships.filter((item) => item.status === 'Approved');
            }
        } catch (error) {
            this.message = this.api.extractErrorMessage(error, 'Unable to load feedback right now.');
        } finally {
            this.isLoading = false;
        }
    }

    private applyFeedbackPage(page: PagedResponse<FeedbackResponse>): void {
        this.feedbacks = page.items;
        this.pageNumber = page.pageNumber;
        this.pageSize = page.pageSize;
        this.totalCount = page.totalCount;
        this.totalPages = page.totalPages;
    }
}
