import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
    ApiServices,
    AppliedStudentResponse,
    FeedbackResponse,
    FeedbackTimerResponse,
    InternshipRequest,
    InternshipResponse
} from '../../services/api-services';
import { SuccessDialogService } from '../../services/success-dialog.service';

interface LocalSkillItem {
    id: number;
    stackName: string;
}

@Component({
    selector: 'app-admin-dashboard',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './admin-dashboard.html',
    styleUrl: './admin-dashboard.css'
})
export class AdminDashboardComponent implements OnInit {
    private readonly formBuilder = inject(FormBuilder);
    protected internships: InternshipResponse[] = [];
    protected applications: AppliedStudentResponse[] = [];
    protected feedbacks: FeedbackResponse[] = [];
    protected selectedInternshipId: number | null = null;
    protected selectedTimer: FeedbackTimerResponse | null = null;
    protected editingInternshipId: number | null = null;
    protected message = '';
    protected applicationsMessage = '';
    protected isLoading = true;
    protected isSubmitting = false;
    protected timerMessage = '';
    protected skillsMessage = '';
    protected editingSkillId: number | null = null;
    protected completingInternshipId: number | null = null;
    protected localSkills: LocalSkillItem[] = [
        { id: 1, stackName: 'Angular' },
        { id: 2, stackName: 'ASP.NET Core' },
        { id: 3, stackName: 'SQL' }
    ];

    protected readonly internshipForm = this.formBuilder.group({
        name: ['', [Validators.required, Validators.minLength(3)]],
        backlogsCount: [null as number | null, [Validators.min(0), Validators.max(20)]],
        cgpa: [null as number | null, [Validators.min(0), Validators.max(10)]],
        streamBranch: ['', [Validators.required, Validators.minLength(2)]],
        stipend: [null as number | null, [Validators.min(0)]],
        duration: ['', [Validators.required, Validators.minLength(2)]],
        studentIdsText: ['']
    });

    protected readonly timerForm = this.formBuilder.group({
        startUtc: ['', [Validators.required]],
        endUtc: ['', [Validators.required]]
    });

    protected readonly skillForm = this.formBuilder.group({
        stackName: ['', [Validators.required, Validators.minLength(2)]]
    });

    protected readonly reviewNoteForm = this.formBuilder.group({
        note: ['']
    });

    constructor(
        private readonly api: ApiServices,
        private readonly successDialog: SuccessDialogService
    ) { }

    async ngOnInit(): Promise<void> {
        if (!this.api.isAdmin()) {
            window.location.href = '/internships';
            return;
        }

        await this.loadDashboard();
    }

    async selectInternship(internshipId: number): Promise<void> {
        this.selectedInternshipId = internshipId;
        await this.loadApplications();
    }

    editInternship(internship: InternshipResponse): void {
        this.editingInternshipId = internship.id;
        this.internshipForm.patchValue({
            name: internship.name,
            backlogsCount: internship.backlogsCount ?? null,
            cgpa: internship.cgpa ?? null,
            streamBranch: internship.streamBranch ?? '',
            stipend: internship.stipend ?? null,
            duration: internship.duration,
            studentIdsText: ''
        });
    }

    cancelEdit(): void {
        this.editingInternshipId = null;
        this.internshipForm.reset({
            name: '',
            backlogsCount: null,
            cgpa: null,
            streamBranch: '',
            stipend: null,
            duration: '',
            studentIdsText: ''
        });
    }

    async saveInternship(): Promise<void> {
        this.message = '';
        if (this.internshipForm.invalid) {
            this.internshipForm.markAllAsTouched();
            return;
        }

        const payload = this.buildInternshipPayload();
        this.isSubmitting = true;

        try {
            const isEditing = !!this.editingInternshipId;
            if (this.editingInternshipId) {
                await this.api.updateInternship(this.editingInternshipId, payload);
                this.message = 'Internship updated successfully.';
            } else {
                await this.api.createInternship(payload);
                this.message = 'Internship created successfully.';
            }

            this.cancelEdit();
            await this.loadDashboard();
            this.successDialog.show(isEditing ? 'Internship updated successfully.' : 'Internship created successfully.');
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
            await this.api.deleteInternship(internshipId);
            if (this.selectedInternshipId === internshipId) {
                this.selectedInternshipId = null;
                this.applications = [];
            }
            await this.loadDashboard();
            this.successDialog.show('Internship deleted successfully.');
        } catch (error) {
            this.message = this.api.extractErrorMessage(error, 'Could not delete the internship.');
        }
    }

    async markAsCompleted(internshipId: number): Promise<void> {
        if (!window.confirm('Mark this internship as completed? Certificates will be generated for approved students.')) {
            return;
        }

        this.completingInternshipId = internshipId;

        try {
            const response = await this.api.completeInternship(internshipId);
            this.message = response.message;
            await this.loadDashboard();
            this.successDialog.show(response.message || 'Internship marked as completed successfully.');
        } catch (error) {
            this.message = this.api.extractErrorMessage(error, 'Could not mark the internship as completed.');
        } finally {
            this.completingInternshipId = null;
        }
    }

    async saveFeedbackTimer(): Promise<void> {
        this.timerMessage = '';
        if (!this.selectedInternshipId || this.timerForm.invalid) {
            this.timerForm.markAllAsTouched();
            return;
        }

        const startUtc = this.localDateTimeToUtcIso(this.timerForm.controls.startUtc.value ?? '');
        const endUtc = this.localDateTimeToUtcIso(this.timerForm.controls.endUtc.value ?? '');

        try {
            this.selectedTimer = await this.api.setFeedbackTimer(this.selectedInternshipId, { startUtc, endUtc });
            this.timerMessage = 'Feedback timer updated.';
            this.successDialog.show('Feedback timer updated successfully.');
        } catch (error) {
            this.timerMessage = this.api.extractErrorMessage(error, 'Could not update the feedback timer.');
        }
    }

    async approve(applicationId: number): Promise<void> {
        await this.reviewApplication(applicationId, true);
    }

    async reject(applicationId: number): Promise<void> {
        await this.reviewApplication(applicationId, false);
    }

    async saveSkill(): Promise<void> {
        this.skillsMessage = '';
        if (this.skillForm.invalid) {
            this.skillForm.markAllAsTouched();
            return;
        }

        const name = this.skillForm.controls.stackName.value?.trim() ?? '';
        if (this.editingSkillId) {
            const skill = this.localSkills.find((item) => item.id === this.editingSkillId);
            if (skill) {
                skill.stackName = name;
            }
            this.skillsMessage = 'Skill updated locally.';
            this.successDialog.show('Skill updated successfully.');
        } else {
            const nextId = this.localSkills.length > 0 ? Math.max(...this.localSkills.map((item) => item.id)) + 1 : 1;
            this.localSkills.push({ id: nextId, stackName: name });
            this.skillsMessage = 'Skill added locally.';
            this.successDialog.show('Skill added successfully.');
        }

        this.editingSkillId = null;
        this.skillForm.reset({ stackName: '' });
    }

    editSkill(skill: LocalSkillItem): void {
        this.editingSkillId = skill.id;
        this.skillForm.patchValue({ stackName: skill.stackName });
    }

    deleteSkill(skillId: number): void {
        this.localSkills = this.localSkills.filter((item) => item.id !== skillId);
        this.skillsMessage = 'Skill removed locally.';
        this.successDialog.show('Skill removed successfully.');
    }

    trackByInternship(_: number, item: InternshipResponse): number {
        return item.id;
    }

    trackByApplication(_: number, item: AppliedStudentResponse): number {
        return item.applicationId;
    }

    trackBySkill(_: number, item: LocalSkillItem): number {
        return item.id;
    }

    private buildInternshipPayload(): InternshipRequest {
        const rawValue = this.internshipForm.getRawValue();
        return {
            name: rawValue.name ?? '',
            backlogsCount: this.toNullableInteger(rawValue.backlogsCount),
            cgpa: this.toNullableNumber(rawValue.cgpa),
            streamBranch: rawValue.streamBranch ?? '',
            stipend: this.toNullableNumber(rawValue.stipend),
            duration: rawValue.duration ?? '',
            studentIds: this.parseIntegerList(rawValue.studentIdsText ?? '')
        };
    }

    private async loadDashboard(): Promise<void> {
        this.isLoading = true;
        this.message = '';
        try {
            this.internships = (await this.api.getInternships(1, 100)).items;
            this.feedbacks = (await this.api.getFeedbacks(1, 10, this.selectedInternshipId ?? undefined)).items;

            if (!this.selectedInternshipId && this.internships.length > 0) {
                this.selectedInternshipId = this.internships[0].id;
            }

            if (this.selectedInternshipId) {
                await this.loadApplications();
            }
        } catch (error) {
            this.message = this.api.extractErrorMessage(error, 'Could not load the dashboard.');
        } finally {
            this.isLoading = false;
        }
    }

    private async loadApplications(): Promise<void> {
        if (!this.selectedInternshipId) {
            this.applications = [];
            return;
        }

        try {
            this.applications = await this.api.getInternshipApplications(this.selectedInternshipId);
            this.feedbacks = (await this.api.getFeedbacks(1, 10, this.selectedInternshipId)).items;
        } catch (error) {
            this.applicationsMessage = this.api.extractErrorMessage(error, 'Could not load internship applications.');
        }
    }

    private async reviewApplication(applicationId: number, approve: boolean): Promise<void> {
        const note = this.reviewNoteForm.controls.note.value?.trim() ?? '';

        try {
            if (approve) {
                await this.api.approveApplication(applicationId, note);
            } else {
                await this.api.rejectApplication(applicationId, note);
            }

            this.reviewNoteForm.reset({ note: '' });
            await this.loadApplications();
            this.successDialog.show(approve ? 'Application approved successfully.' : 'Application rejected successfully.');
        } catch (error) {
            this.applicationsMessage = this.api.extractErrorMessage(error, 'Could not review the application.');
        }
    }

    private parseIntegerList(value: string): number[] {
        if (!value.trim()) {
            return [];
        }

        return value
            .split(',')
            .map((item) => Number.parseInt(item.trim(), 10))
            .filter((item) => Number.isFinite(item) && item > 0);
    }

    private toNullableInteger(value: number | null): number | null {
        return value === null || Number.isNaN(value) ? null : Math.trunc(value);
    }

    private toNullableNumber(value: number | null): number | null {
        return value === null || Number.isNaN(value) ? null : value;
    }

    private localDateTimeToUtcIso(value: string): string {
        return new Date(value).toISOString();
    }
}