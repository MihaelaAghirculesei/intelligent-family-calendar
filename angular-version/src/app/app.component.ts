import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CalendarComponent } from './components/calendar/calendar.component';

@Component({
  selector: 'app-root',
  imports: [CalendarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  title = 'Intelligent Family Calendar';
}
