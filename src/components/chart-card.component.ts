import { Component, ElementRef, ViewChild, input, effect, OnDestroy, AfterViewInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../services/theme.service';

declare var Chart: any;

@Component({
  selector: 'app-chart-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="group relative bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 h-full flex flex-col transition-all duration-300 hover:shadow-lg hover:-translate-y-1 dark:hover:shadow-blue-900/20 dark:hover:border-blue-500/30">
      
      <!-- Premium Glow Effect -->
      <div class="absolute inset-0 rounded-2xl bg-gradient-to-tr from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

      <div class="relative z-10 flex justify-between items-center mb-4">
        <div class="flex items-center space-x-2 overflow-hidden">
          <div class="w-1 h-4 rounded-full" [style.backgroundColor]="color()"></div>
          <h3 class="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest truncate" [title]="title()">{{ title() }}</h3>
        </div>
        <span class="text-[10px] font-mono font-medium px-2 py-1 rounded-md transition-colors" 
              [class.bg-green-100]="trend() > 0" 
              [class.text-green-700]="trend() > 0"
              [class.dark:bg-green-500/20]="trend() > 0"
              [class.dark:text-green-400]="trend() > 0"
              
              [class.bg-red-100]="trend() < 0" 
              [class.text-red-700]="trend() < 0"
              [class.dark:bg-red-500/20]="trend() < 0"
              [class.dark:text-red-400]="trend() < 0"

              [class.bg-slate-100]="trend() === 0" 
              [class.text-slate-600]="trend() === 0"
              [class.dark:bg-slate-800]="trend() === 0"
              [class.dark:text-slate-400]="trend() === 0">
          {{ trendLabel() }}
        </span>
      </div>
      
      <div class="flex-1 min-h-0 relative w-full flex items-center justify-center">
        <canvas #canvas></canvas>
      </div>
      
      <div class="relative z-10 mt-4 flex justify-between items-end border-t border-slate-100 dark:border-slate-800 pt-3">
        <div>
          <p class="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500 font-semibold">Current Value</p>
          <p class="text-xl font-bold text-slate-800 dark:text-slate-100 tabular-nums tracking-tight">{{ currentValue() }}</p>
        </div>
        <div class="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded border border-slate-100 dark:border-slate-700">
           {{ type() }}
        </div>
      </div>
    </div>
  `
})
export class ChartCardComponent implements AfterViewInit, OnDestroy {
  chartId = input.required<number>();
  type = input.required<'line' | 'bar' | 'doughnut' | 'pie' | 'radar' | 'polarArea'>();
  title = input.required<string>();
  data = input.required<number[]>();
  labels = input.required<string[]>();
  color = input.required<string>();

  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  
  private chartInstance: any = null;
  private themeService = inject(ThemeService);

  // Computed properties for display
  currentValue = computed(() => {
    const d = this.data();
    if (!d || d.length === 0) return '0';
    return d[d.length - 1].toLocaleString();
  });

  trend = computed(() => {
    const d = this.data();
    if (d.length < 2) return 0;
    return d[d.length - 1] - d[d.length - 2];
  });

  trendLabel = computed(() => {
    const t = this.trend();
    return t > 0 ? `+${t}` : `${t}`;
  });

  constructor() {
    // Data Effect
    effect(() => {
      const newData = this.data();
      if (this.chartInstance) {
        this.updateChartData(newData);
      }
    });

    // Theme Effect
    effect(() => {
      const isDark = this.themeService.isDarkMode();
      if (this.chartInstance) {
        this.updateChartTheme(isDark);
      }
    });
  }

  ngAfterViewInit() {
    this.initChart();
  }

  ngOnDestroy() {
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }
  }

  private initChart() {
    if (typeof Chart === 'undefined') {
      console.warn('Chart.js not loaded');
      return;
    }

    const ctx = this.canvasRef.nativeElement.getContext('2d');
    const config = this.getChartConfig(this.themeService.isDarkMode());
    this.chartInstance = new Chart(ctx, config);
  }

  private updateChartData(newData: number[]) {
    if (!this.chartInstance) return;

    this.chartInstance.data.datasets[0].data = newData;
    this.chartInstance.update('none'); 
  }

  private updateChartTheme(isDark: boolean) {
    if (!this.chartInstance) return;
    
    // Update Scale Colors
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)';
    const textColor = isDark ? '#94a3b8' : '#64748b'; // slate-400 / slate-500
    
    // Helper to safely access nested properties
    const options = this.chartInstance.options;

    // Update Scales
    if (options.scales.x) {
        if (options.scales.x.grid) options.scales.x.grid.color = 'transparent'; // keep x clean usually
    }
    if (options.scales.y) {
        if (options.scales.y.grid) options.scales.y.grid.color = gridColor;
    }
    if (options.scales.r) {
        if (options.scales.r.grid) options.scales.r.grid.color = gridColor;
        if (options.scales.r.pointLabels) options.scales.r.pointLabels.color = textColor;
    }

    // Update Legend
    if (options.plugins.legend) {
        options.plugins.legend.labels.color = textColor;
    }

    this.chartInstance.update('none');
  }

  private getChartConfig(isDark: boolean) {
    const chartType = this.type();
    const baseColor = this.color();
    const dataCount = this.data().length;
    
    const isMultiColor = ['doughnut', 'pie', 'polarArea'].includes(chartType);
    const isRadar = chartType === 'radar';

    let bgColors: string | string[];
    let borderColors: string | string[];

    if (isMultiColor) {
      bgColors = this.generateColorPalette(baseColor, dataCount);
      borderColors = isDark ? '#0f172a' : '#ffffff'; // Border matches card bg
    } else {
      bgColors = this.hexToRgba(baseColor, isRadar ? 0.2 : 0.5);
      borderColors = baseColor;
    }

    const gridColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)';
    const textColor = isDark ? '#94a3b8' : '#64748b';

    return {
      type: chartType,
      data: {
        labels: this.labels(),
        datasets: [{
          label: this.title(),
          data: this.data(),
          backgroundColor: bgColors,
          borderColor: borderColors,
          borderWidth: 2,
          tension: 0.3, 
          pointRadius: (chartType === 'line' || isRadar) ? 0 : 0, 
          pointHoverRadius: 4,
          pointBackgroundColor: baseColor,
          fill: chartType === 'line' || isRadar,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false, 
        plugins: {
          legend: {
            display: isMultiColor || isRadar, 
            position: 'bottom',
            labels: {
                boxWidth: 8,
                padding: 10,
                font: { size: 9, family: 'Inter' },
                usePointStyle: true,
                color: textColor
            }
          },
          tooltip: {
            enabled: true,
            mode: 'index',
            intersect: false,
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(15, 23, 42, 0.9)',
            titleColor: isDark ? '#0f172a' : '#f8fafc',
            bodyColor: isDark ? '#0f172a' : '#f8fafc',
            padding: 10,
            cornerRadius: 8,
            titleFont: { size: 11, weight: 'bold', family: 'Inter' },
            bodyFont: { size: 11, family: 'Inter' },
            borderColor: isDark ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)',
            borderWidth: 1
          }
        },
        scales: this.getScalesConfig(chartType, gridColor, textColor)
      }
    };
  }

  private getScalesConfig(type: string, gridColor: string, textColor: string) {
    if (['doughnut', 'pie'].includes(type)) return {};
    
    if (['radar', 'polarArea'].includes(type)) {
        return {
            r: {
                ticks: { display: false, backdropColor: 'transparent' },
                grid: { color: gridColor },
                angleLines: { color: gridColor },
                pointLabels: { 
                    display: type === 'radar',
                    font: { size: 9, family: 'Inter' },
                    color: textColor
                }
            }
        };
    }

    // Line and Bar
    return {
        x: {
            display: false,
            grid: { display: false }
        },
        y: {
            display: true,
            grid: { color: gridColor },
            ticks: { display: false },
            border: { display: false }, // Remove axis line
            beginAtZero: true
        }
    };
  }

  private hexToRgba(hex: string, alpha: number) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  private generateColorPalette(base: string, count: number): string[] {
    const palette = [];
    const step = 25;
    palette.push(base); 
    
    for(let i=1; i<count; i++) {
       const direction = i % 2 === 0 ? 1 : -1; 
       const multiplier = Math.ceil(i/2);
       const adjustment = direction * (multiplier * step);
       palette.push(this.adjustColor(base, adjustment));
    }
    return palette;
  }

  private adjustColor(color: string, amount: number) {
    return '#' + color.replace(/^#/, '').replace(/../g, color => ('0'+Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2));
  }
}