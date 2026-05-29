import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiServices, UserProfileResponse, AppliedStudentResponse } from '../../services/api-services';
import { ActivatedRoute } from '@angular/router';
import { ProfileResolvedData } from '../../resolvers/profile-resolver';
import { SuccessDialogService } from '../../services/success-dialog.service';

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './profile.html',
    styleUrl: './profile.css'
})
export class ProfileComponent implements OnInit {
    private readonly formBuilder = inject(FormBuilder);
    protected profile: UserProfileResponse | null = null;
    protected isLoading = true;
    protected message = '';
    protected changeResult = '';
    protected adminApplications: AppliedStudentResponse[] = [];

    protected readonly changeForm = this.formBuilder.group({
        currentPassword: ['', [Validators.required, Validators.minLength(8)]],
        newPassword: ['', [Validators.required, Validators.minLength(8)]]
    });

    constructor(
        private readonly api: ApiServices,
        private readonly successDialog: SuccessDialogService,
        private readonly route: ActivatedRoute
    ) { }

    async ngOnInit(): Promise<void> {
        const resolved = this.route.snapshot.data?.['profile'] as ProfileResolvedData | undefined;
        if (resolved) {
            this.profile = resolved.profile;
            this.adminApplications = resolved.adminApplications ?? [];
            this.isLoading = false;
        } else {
            await this.loadProfile();
        }
    }

    async loadProfile(): Promise<void> {
        this.isLoading = true;
        this.message = '';

        try {
            this.profile = await this.api.getProfile();
        } catch (error) {
            this.message = this.api.extractErrorMessage(error, 'Unable to load the profile right now.');
        } finally {
            this.isLoading = false;
        }
    }

    async changePassword(): Promise<void> {
        this.changeResult = '';
        if (this.changeForm.invalid) {
            this.changeForm.markAllAsTouched();
            return;
        }

        try {
            const response = await this.api.changePassword(this.changeForm.getRawValue() as { currentPassword: string; newPassword: string });
            this.changeResult = response.message;
            this.changeForm.reset();
            this.successDialog.show(response.message || 'Password changed successfully.');
        } catch (error) {
            this.changeResult = this.api.extractErrorMessage(error, 'Could not change the password.');
        }
    }

    private async loadAdminApplications(): Promise<void> {
        try {
            this.adminApplications = await this.api.getInternshipApplications(null);
        } catch (error) {
            // ignore for now, surface in UI message if needed
            this.message = this.api.extractErrorMessage(error, 'Could not load applications.');
            this.adminApplications = [];
        }
    }

    async approveApplication(applicationId: number): Promise<void> {
        try {
            await this.api.approveApplication(applicationId, '');
            await this.loadAdminApplications();
            this.successDialog.show('Application approved successfully.');
        } catch (error) {
            this.message = this.api.extractErrorMessage(error, 'Could not approve application.');
        }
    }

    async rejectApplication(applicationId: number): Promise<void> {
        try {
            await this.api.rejectApplication(applicationId, '');
            await this.loadAdminApplications();
            this.successDialog.show('Application rejected successfully.');
        } catch (error) {
            this.message = this.api.extractErrorMessage(error, 'Could not reject application.');
        }
    }
}