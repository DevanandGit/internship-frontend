import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ApiServices } from '../../services/api-services';

@Component({
    selector: 'app-shell',
    standalone: true,
    imports: [RouterLink, RouterLinkActive, RouterOutlet],
    templateUrl: './shell.html',
    styleUrl: './shell.css'
})
export class ShellComponent {
    constructor(
        protected readonly api: ApiServices,
        private readonly router: Router
    ) { }

    logout(): void {
        this.api.logout();
        void this.router.navigateByUrl('/login');
    }
}