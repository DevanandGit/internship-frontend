import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiServices, AppliedInternshipResponse, InternshipResponse, InternshipRequest } from '../../services/api-services';
import { InternshipsResolvedData } from '../../resolvers/internships-resolver';

@Component({
    selector: 'app-internships',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './internships.html',
    styleUrl: './internships.css'
})
export class InternshipsComponent implements OnInit {
    protected internships: InternshipResponse[] = [];
    protected appliedInternships: AppliedInternshipResponse[] = [];
    protected eligibleIds = new Set<number>();
    protected isAdminView = false;
    protected pageNumber = 1;
    protected pageSize = 6;
    protected totalCount = 0;
    protected totalPages = 0;
    protected message = '';
    protected isLoading = true;
    protected isApplying = false;
    protected showModal = false;
    protected modalTitle = '';
    protected isSubmitting = false;
    protected editingInternshipId: number | null = null;

    private readonly fb = inject(FormBuilder);
    private readonly cdr = inject(ChangeDetectorRef);
    protected internshipForm = this.fb.group({
        name: ['', [Validators.required, Validators.minLength(3)]],
        backlogsCount: [null as number | null, [Validators.min(0), Validators.max(20)]],
        cgpa: [null as number | null, [Validators.min(0), Validators.max(10)]],
        streamBranch: ['', [Validators.required, Validators.minLength(2)]],
        stipend: [null as number | null, [Validators.min(0)]],
        duration: ['', [Validators.required, Validators.minLength(2)]]
    });

    constructor(
        protected readonly api: ApiServices,
        private readonly route: ActivatedRoute,
        private readonly router: Router
    ) { }

    protected createInProgress = false;

    openCreateModal(): void {
        this.editingInternshipId = null;
        this.modalTitle = 'Create internship';
        this.internshipForm.reset({
            name: '',
            backlogsCount: null,
            cgpa: null,
            streamBranch: '',
            stipend: null,
            duration: ''
        });
        this.showModal = true;
    }

    openEditModal(internship: InternshipResponse): void {
        this.editingInternshipId = internship.id;
        this.modalTitle = 'Update internship';
        this.internshipForm.setValue({
            name: internship.name,
            backlogsCount: internship.backlogsCount ?? null,
            cgpa: internship.cgpa ?? null,
            streamBranch: internship.streamBranch ?? '',
            stipend: internship.stipend ?? null,
            duration: internship.duration
        });
        this.showModal = true;
    }

    closeModal(): void {
        this.showModal = false;
        this.isSubmitting = false;
        this.cdr.detectChanges();
    }

    async saveFromModal(): Promise<void> {
        if (this.internshipForm.invalid) {
            this.internshipForm.markAllAsTouched();
            return;
        }

        const payload: InternshipRequest = {
            name: (this.internshipForm.controls.name.value ?? '').toString(),
            backlogsCount: this.toNullableInteger(this.internshipForm.controls.backlogsCount.value ?? null),
            cgpa: this.toNullableNumber(this.internshipForm.controls.cgpa.value ?? null),
            streamBranch: (this.internshipForm.controls.streamBranch.value ?? '').toString(),
            stipend: this.toNullableNumber(this.internshipForm.controls.stipend.value ?? null),
            duration: (this.internshipForm.controls.duration.value ?? '').toString(),
            studentIds: []
        };

        this.isSubmitting = true;
        try {
            if (this.editingInternshipId) {
                await this.api.updateInternship(this.editingInternshipId, payload);
                this.message = 'Internship updated successfully.';
            } else {
                await this.api.createInternship(payload);
                this.message = 'Internship created successfully.';
            }

            this.closeModal();
            await this.loadData(this.pageNumber);
        } catch (error) {
            this.message = this.api.extractErrorMessage(error, 'Could not save the internship.');
        } finally {
            this.isSubmitting = false;
        }
    }

    async deleteInternship(internshipId: number): Promise<void> {
        if (!window.confirm('Delete this internship?')) {
            return;
        }

        try {
            this.isLoading = true;
            await this.api.deleteInternship(internshipId);
            this.message = 'Internship deleted.';
            await this.loadData(this.pageNumber);
        } catch (error) {
            this.message = this.api.extractErrorMessage(error, 'Could not delete the internship.');
        } finally {
            this.isLoading = false;
        }
    }

    async ngOnInit(): Promise<void> {
        this.isAdminView = this.api.isAdmin();

        const resolvedData = this.route.snapshot.data['internshipsData'] as InternshipsResolvedData | undefined;

        if (resolvedData) {
            this.applyPageData(resolvedData.page);
            this.appliedInternships = resolvedData.appliedInternships;
            this.isLoading = false;
            return;
        }

        await this.loadData(1);
    }

    async apply(internshipId: number): Promise<void> {
        this.isApplying = true;
        this.message = '';

        try {
            await this.api.applyToInternship(internshipId);
            this.message = 'Application submitted successfully.';
            await this.loadAppliedInternships();
        } catch (error) {
            this.message = this.api.extractErrorMessage(error, 'Unable to apply to the internship right now.');
        } finally {
            this.isApplying = false;
        }
    }

    isApplied(internshipId: number): boolean {
        return this.appliedInternships.some((item) => item.internshipId === internshipId);
    }

    isEligible(internshipId: number): boolean {
        return this.eligibleIds.has(internshipId);
    }

    async changePage(delta: number): Promise<void> {
        const nextPage = this.pageNumber + delta;
        if (nextPage < 1 || nextPage > this.totalPages) {
            return;
        }

        await this.loadData(nextPage);
    }

    private async loadData(pageNumber: number): Promise<void> {
        this.isLoading = true;
        this.message = '';

        try {
            const isStudentView = this.api.isStudent();
            const internshipsResponse = this.isAdminView
                ? await this.api.getInternships(pageNumber, this.pageSize)
                : await this.api.getEligibleInternships(pageNumber, this.pageSize);

            this.applyPageData(internshipsResponse);

            if (isStudentView) {
                await this.loadAppliedInternships();
            } else {
                this.appliedInternships = [];
            }
        } catch (error) {
            this.message = this.api.extractErrorMessage(error, 'Unable to load internships right now.');
            // helpful debug log when paging fails unexpectedly
            // eslint-disable-next-line no-console
            console.warn('loadData failed', error);
        } finally {
            this.isLoading = false;
            try {
                this.cdr.detectChanges();
            } catch {
                // ignore detection errors
            }
        }
    }

    protected formatValue(value: number | null | undefined): string {
        return value === null || value === undefined ? 'Any' : value.toString();
    }

    private applyPageData(page: {
        items: InternshipResponse[];
        pageNumber: number;
        pageSize: number;
        totalCount: number;
        totalPages: number;
    }): void {
        this.pageNumber = page.pageNumber;
        this.pageSize = page.pageSize;
        this.totalCount = page.totalCount;
        this.totalPages = page.totalPages;
        this.internships = page.items;
        this.eligibleIds = this.api.isStudent() ? new Set(this.internships.map((item) => item.id)) : new Set<number>();
    }

    private async loadAppliedInternships(): Promise<void> {
        try {
            this.appliedInternships = await this.api.getAppliedInternships();
        } catch {
            this.appliedInternships = [];
        }
    }

    private toNullableInteger(value: number | null): number | null {
        return value === null || Number.isNaN(value) ? null : Math.trunc(value);
    }

    private toNullableNumber(value: number | null): number | null {
        return value === null || Number.isNaN(value) ? null : value;
    }
}