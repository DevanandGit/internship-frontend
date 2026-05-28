import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiServices } from '../../services/api-services';

function passwordsMatch(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value as string | null;
    const confirmPassword = control.get('confirmPassword')?.value as string | null;

    if (!password || !confirmPassword) {
        return null;
    }

    return password === confirmPassword ? null : { passwordMismatch: true };
}

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterLink],
    templateUrl: './register.html',
    styleUrl: './register.css'
})
export class RegisterComponent {
    private readonly formBuilder = inject(FormBuilder);
    protected message = '';
    protected isSubmitting = false;

    protected readonly form = this.formBuilder.group(
        {
            name: ['', [Validators.required, Validators.minLength(3)]],
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(8)]],
            confirmPassword: ['', [Validators.required]],
            collegeName: ['', [Validators.required, Validators.minLength(3)]],
            cgpa: [null as number | null, [Validators.min(0), Validators.max(10)]],
            backlogsCount: [0, [Validators.min(0), Validators.max(20)]],
            streamBranch: ['', [Validators.required, Validators.minLength(2)]]
        },
        { validators: passwordsMatch }
    );

    constructor(
        private readonly api: ApiServices,
        private readonly router: Router
    ) { }

    async submit(): Promise<void> {
        this.message = '';
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const formValue = this.form.getRawValue();

        this.isSubmitting = true;
        try {
            await this.api.registerStudent({
                name: formValue.name ?? '',
                email: formValue.email ?? '',
                password: formValue.password ?? '',
                collegeName: formValue.collegeName ?? '',
                cgpa: this.toNullableNumber(formValue.cgpa),
                backlogsCount: this.toNullableInteger(formValue.backlogsCount),
                streamBranch: formValue.streamBranch ?? '',
                skillIds: []
            });

            await this.router.navigateByUrl(this.api.getHomeRoute());
        } catch (error) {
            this.message = this.api.extractErrorMessage(error, 'Registration failed. Please review the form and try again.');
        } finally {
            this.isSubmitting = false;
        }
    }

    private toNullableNumber(value: number | null): number | null {
        return value === null || Number.isNaN(value) ? null : value;
    }

    private toNullableInteger(value: number | null): number | null {
        return value === null || Number.isNaN(value) ? null : Math.trunc(value);
    }
}