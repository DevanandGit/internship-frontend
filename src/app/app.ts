import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SuccessDialogComponent } from './components/success-dialog/success-dialog';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SuccessDialogComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
}
