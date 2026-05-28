import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiServices } from '../../services/api-services';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterLink],
    templateUrl: './login.html',
    styleUrl: './login.css'
})
export class LoginComponent implements OnInit {
    private readonly formBuilder = inject(FormBuilder);
    protected message = '';
    protected isSubmitting = false;

    protected readonly form = this.formBuilder.group({
        username: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(8)]]
    });

    constructor(
        private readonly api: ApiServices,
        private readonly router: Router
    ) { }

    ngOnInit(): void {
        if (this.api.isAuthenticated()) {
            void this.router.navigateByUrl(this.api.getHomeRoute());
        }
    }

    async submit(): Promise<void> {
        this.message = '';
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.isSubmitting = true;
        try {
            await this.api.login(this.form.getRawValue() as { username: string; password: string });
            await this.router.navigateByUrl(this.api.getHomeRoute());
        } catch (error) {
            this.message = this.api.extractErrorMessage(error, 'Login failed. Check your credentials and try again.');
        } finally {
            this.isSubmitting = false;
        }
    }
}