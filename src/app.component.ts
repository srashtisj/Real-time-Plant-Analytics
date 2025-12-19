import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartCardComponent } from './components/chart-card.component';
import { DataService } from './services/data.service';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ChartCardComponent],
  templateUrl: './app.component.html'
})
export class AppComponent {
  private dataService = inject(DataService);
  themeService = inject(ThemeService);
  
  charts = this.dataService.charts;
  isStreaming = this.dataService.isStreaming;
  updateFrequency = this.dataService.updateFrequency;

  toggleStream() {
    this.dataService.toggleStream();
  }

  onFrequencyChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.dataService.setUpdateFrequency(Number(value));
  }
}