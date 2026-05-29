import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { SuccessDialogService } from '../../services/success-dialog.service';

@Component({
    selector: 'app-success-dialog',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './success-dialog.html',
    styleUrl: './success-dialog.css'
})
export class SuccessDialogComponent {
    constructor(protected readonly dialog: SuccessDialogService) { }

    close(): void {
        this.dialog.close();
    }
}