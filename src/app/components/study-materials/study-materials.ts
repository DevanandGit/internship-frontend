import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
    ApiServices,
    StudentLookupResponse,
    StudyMaterialResponse
} from '../../services/api-services';
import { StudyMaterialsResolvedData } from '../../resolvers/study-materials-resolver';
import { SuccessDialogService } from '../../services/success-dialog.service';

@Component({
    selector: 'app-study-materials',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './study-materials.html',
    styleUrl: './study-materials.css'
})
export class StudyMaterialsComponent implements OnInit {
    private readonly formBuilder = inject(FormBuilder);
    private readonly destroyRef = inject(DestroyRef);

    protected materials: StudyMaterialResponse[] = [];
    protected selectedMaterial: StudyMaterialResponse | null = null;
    protected students: StudentLookupResponse[] = [];
    protected isLoading = false;
    protected isSubmitting = false;
    protected isAdminView = false;
    protected message = '';
    protected editingMaterialId: number | null = null;
    protected selectedMaterialId: number | null = null;
    protected selectedStudentId: number | null = null;
    protected selectedNoteFileName = '';
    protected selectedVideoFileName = '';
    private selectedNoteFile: File | null = null;
    private selectedVideoFile: File | null = null;

    protected readonly studyMaterialForm = this.formBuilder.group({
        name: ['', [Validators.required, Validators.minLength(3)]],
        noteUrl: ['', [Validators.required, Validators.minLength(2)]],
        videoUrl: ['', [Validators.required, Validators.minLength(2)]]
    });

    constructor(
        private readonly api: ApiServices,
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly successDialog: SuccessDialogService
    ) { }

    async ngOnInit(): Promise<void> {
        this.isAdminView = this.api.isAdmin();

        this.route.data
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((data) => {
                this.applyResolvedData(data['studyMaterialsData'] as StudyMaterialsResolvedData | undefined);
            });
    }

    async selectMaterial(materialId: number): Promise<void> {
        await this.router.navigate(['/study-materials', materialId]);
    }

    async showList(): Promise<void> {
        await this.router.navigate(['/study-materials']);
    }

    beginCreate(): void {
        this.editingMaterialId = null;
        this.selectedNoteFile = null;
        this.selectedVideoFile = null;
        this.selectedNoteFileName = '';
        this.selectedVideoFileName = '';
        this.studyMaterialForm.reset({
            name: '',
            noteUrl: '',
            videoUrl: ''
        });
    }

    beginEdit(material: StudyMaterialResponse): void {
        this.editingMaterialId = material.id;
        this.selectedNoteFile = null;
        this.selectedVideoFile = null;
        this.selectedNoteFileName = '';
        this.selectedVideoFileName = '';
        this.studyMaterialForm.patchValue({
            name: material.name,
            noteUrl: material.noteUrl ?? '',
            videoUrl: material.videoUrl ?? ''
        });
    }

    cancelEdit(): void {
        this.beginCreate();
    }

    async saveMaterial(): Promise<void> {
        this.message = '';

        if (this.studyMaterialForm.invalid) {
            this.studyMaterialForm.markAllAsTouched();
            return;
        }

        const rawValue = this.studyMaterialForm.getRawValue();
        const payload = new FormData();
        payload.append('name', rawValue.name?.trim() ?? '');
        payload.append('noteUrl', rawValue.noteUrl?.trim() ?? '');
        payload.append('videoUrl', rawValue.videoUrl?.trim() ?? '');
        const isEditing = this.editingMaterialId !== null;
        const materialId = this.editingMaterialId;

        if (this.selectedNoteFile) {
            payload.append('noteFile', this.selectedNoteFile);
        }

        if (this.selectedVideoFile) {
            payload.append('videoFile', this.selectedVideoFile);
        }

        this.isSubmitting = true;

        try {
            if (isEditing && materialId !== null) {
                await this.api.updateStudyMaterial(materialId, payload);
                this.message = 'Study material updated.';
                await this.refreshMaterialsAndDetail(materialId);
            } else {
                const created = await this.api.createStudyMaterial(payload);
                this.message = 'Study material created.';
                this.editingMaterialId = null;
                await this.router.navigate(['/study-materials', created.id]);
            }
            this.successDialog.show(isEditing ? 'Study material updated successfully.' : 'Study material created successfully.');
        } catch (error) {
            this.message = this.api.extractErrorMessage(error, 'Could not save the study material.');
        } finally {
            this.isSubmitting = false;
        }
    }

    async deleteMaterial(materialId: number): Promise<void> {
        if (!window.confirm('Delete this study material?')) {
            return;
        }

        try {
            await this.api.deleteStudyMaterial(materialId);
            if (this.selectedMaterialId === materialId) {
                await this.router.navigate(['/study-materials']);
            }

            this.message = 'Study material deleted.';
            await this.loadPageData();
            this.successDialog.show('Study material deleted successfully.');
        } catch (error) {
            this.message = this.api.extractErrorMessage(error, 'Could not delete the study material.');
        }
    }

    async assignSelectedStudent(): Promise<void> {
        if (!this.isAdminView || !this.selectedMaterialId || !this.selectedStudentId) {
            return;
        }

        try {
            await this.api.assignStudyMaterial(this.selectedMaterialId, this.selectedStudentId);
            this.message = 'Study material assigned to the student.';
            await this.refreshMaterialsAndDetail(this.selectedMaterialId);
            this.successDialog.show('Study material assigned successfully.');
        } catch (error) {
            this.message = this.api.extractErrorMessage(error, 'Could not assign the study material.');
        }
    }

    async unassignSelectedStudent(): Promise<void> {
        if (!this.isAdminView || !this.selectedMaterialId || !this.selectedStudentId) {
            return;
        }

        try {
            await this.api.unassignStudyMaterial(this.selectedMaterialId, this.selectedStudentId);
            this.message = 'Study material removed from the student.';
            await this.refreshMaterialsAndDetail(this.selectedMaterialId);
            this.successDialog.show('Study material unassigned successfully.');
        } catch (error) {
            this.message = this.api.extractErrorMessage(error, 'Could not unassign the study material.');
        }
    }

    onFileSelected(event: Event, controlName: 'noteUrl' | 'videoUrl'): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];

        if (!file) {
            return;
        }

        const fileName = file.name;
        this.studyMaterialForm.patchValue({
            [controlName]: fileName
        });

        if (controlName === 'noteUrl') {
            this.selectedNoteFile = file;
            this.selectedNoteFileName = fileName;
        } else {
            this.selectedVideoFile = file;
            this.selectedVideoFileName = fileName;
        }
    }

    onStudentSelected(event: Event): void {
        const input = event.target as HTMLSelectElement;
        const value = Number(input.value);
        this.selectedStudentId = Number.isFinite(value) && value > 0 ? value : null;
    }

    trackByMaterial(_: number, material: StudyMaterialResponse): number {
        return material.id;
    }

    trackByStudent(_: number, student: StudentLookupResponse): number {
        return student.id;
    }

    get assignedStudents(): StudentLookupResponse[] {
        return this.selectedMaterial?.assignedStudents ?? [];
    }

    get selectedStudentName(): string {
        const match = this.students.find((student) => student.id === this.selectedStudentId);
        return match?.name ?? '';
    }

    private async loadPageData(): Promise<void> {
        this.isLoading = true;

        try {
            this.materials = await this.api.getStudyMaterials();

            if (this.isAdminView) {
                await this.loadStudents();
            }

            if (this.selectedMaterialId) {
                this.selectedMaterial = await this.api.getStudyMaterial(this.selectedMaterialId);
                this.syncStudentSelection();
            } else {
                this.selectedMaterial = null;
            }
        } catch (error) {
            this.message = this.api.extractErrorMessage(error, 'Unable to load study materials right now.');
        } finally {
            this.isLoading = false;
        }
    }

    private async loadStudents(): Promise<void> {
        try {
            this.students = await this.api.getStudents();
            this.syncStudentSelection();
        } catch {
            this.students = [];
        }
    }

    private applyResolvedData(resolvedData: StudyMaterialsResolvedData | undefined): void {
        if (!resolvedData) {
            return;
        }

        this.materials = resolvedData.materials;
        this.selectedMaterial = resolvedData.selectedMaterial;
        this.students = resolvedData.students;
        this.selectedMaterialId = resolvedData.selectedMaterial?.id ?? null;
        this.syncStudentSelection();
        this.isLoading = false;
    }

    private syncStudentSelection(): void {
        if (this.students.length === 0) {
            this.selectedStudentId = null;
            return;
        }

        const assignedIds = new Set(this.assignedStudents.map((student) => student.id));

        if (this.selectedStudentId && this.students.some((student) => student.id === this.selectedStudentId)) {
            return;
        }

        if (assignedIds.size > 0) {
            const assignedStudent = this.students.find((student) => assignedIds.has(student.id));
            this.selectedStudentId = assignedStudent?.id ?? this.students[0].id;
            return;
        }

        this.selectedStudentId = this.students[0].id;
    }

    private async refreshMaterialsAndDetail(materialId: number): Promise<void> {
        this.materials = await this.api.getStudyMaterials();
        this.selectedMaterial = await this.api.getStudyMaterial(materialId);
        this.syncStudentSelection();
    }
}