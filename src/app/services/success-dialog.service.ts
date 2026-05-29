import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface SuccessDialogState {
    title: string;
    message: string;
}

@Injectable({ providedIn: 'root' })
export class SuccessDialogService {
    private readonly dialogStateSubject = new BehaviorSubject<SuccessDialogState | null>(null);

    readonly dialogState$ = this.dialogStateSubject.asObservable();

    show(message: string, title = 'Success'): void {
        this.dialogStateSubject.next({ title, message });
    }

    close(): void {
        this.dialogStateSubject.next(null);
    }
}