import { Component, ElementRef, ViewChild, input, effect, OnDestroy, AfterViewInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../services/theme.service';
import { ChartLoaderService } from '../services/chart-loader.service';

declare var Chart: any;

@Component({
  selector: 'app-chart-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="group relative bg-white dark:bg-black rounded-lg shadow-sm border border-slate-200 dark:border-green-800 p-4 h-full flex flex-col transition-all duration-300 hover:shadow-lg dark:hover:border-green-500/80 dark:hover:shadow-[0_0_15px_rgba(0,255,65,0.3)]">
      
      <!-- Matrix/Cyberpunk Corner Accents (only in dark mode) -->
      <div class="hidden dark:block absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-green-500 rounded-tl-sm"></div>
      <div class="hidden dark:block absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-green-500 rounded-tr-sm"></div>
      <div class="hidden dark:block absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-green-500 rounded-bl-sm"></div>
      <div class="hidden dark:block absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-green-500 rounded-br-sm"></div>

      <div class="relative z-10 flex justify-between items-center mb-4">
        <div class="flex items-center space-x-2 overflow-hidden">
          <div class="w-1 h-3 rounded-sm dark:bg-green-500" [class.bg-slate-400]="!isDarkMode()"></div>
          <h3 class="text-xs font-bold font-mono uppercase tracking-widest truncate text-slate-600 dark:text-green-500" [title]="title()">
            {{ title() }}
          </h3>
        </div>
        <span class="text-[10px] font-mono font-medium px-2 py-0.5 rounded border" 
              [class.bg-green-100]="!isDarkMode() && trend() > 0" 
              [class.text-green-700]="!isDarkMode() && trend() > 0"
              [class.border-green-200]="!isDarkMode() && trend() > 0"
              
              [class.bg-red-100]="!isDarkMode() && trend() < 0" 
              [class.text-red-700]="!isDarkMode() && trend() < 0"
              [class.border-red-200]="!isDarkMode() && trend() < 0"

              [class.dark:bg-green-900/30]="trend() > 0"
              [class.dark:text-green-400]="trend() > 0"
              [class.dark:border-green-600]="trend() > 0"
              
              [class.dark:bg-red-900/30]="trend() < 0"
              [class.dark:text-red-400]="trend() < 0"
              [class.dark:border-red-600]="trend() < 0"
              
              [class.border-transparent]="trend() === 0"
              [class.bg-slate-100]="!isDarkMode() && trend() === 0"
              [class.dark:text-slate-500]="trend() === 0">
          {{ trendLabel() }}
        </span>
      </div>
      
      <div class="flex-1 min-h-0 relative w-full flex items-center justify-center">
        <canvas #canvas></canvas>
      </div>
      
      <div class="relative z-10 mt-3 flex justify-between items-end border-t border-slate-100 dark:border-green-900/50 pt-2">
        <div class="font-mono">
          <p class="text-[10px] uppercase tracking-wide text-slate-400 dark:text-green-800">Val_Hex_0x</p>
          <p class="text-lg font-bold text-slate-800 dark:text-green-400 tabular-nums leading-none mt-1">{{ currentValue() }}</p>
        </div>
        <div class="text-[9px] uppercase font-bold text-slate-400 dark:text-green-900 bg-slate-50 dark:bg-green-900/10 px-1 py-0.5 rounded dark:border dark:border-green-900/30">
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
  private chartLoader = inject(ChartLoaderService);
  
  // Expose for template
  isDarkMode = this.themeService.isDarkMode;

  // Computed properties
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
    return t > 0 ? `▲${t}` : `${t}`;
  });

  constructor() {
    effect(() => {
      const newData = this.data();
      if (this.chartInstance) {
        this.updateChartData(newData);
      }
    });

    effect(() => {
      const isDark = this.themeService.isDarkMode();
      if (this.chartInstance) {
        this.updateChartTheme(isDark);
      }
    });
  }

  async ngAfterViewInit() {
    // Wait for the library to be loaded (lazy loaded)
    try {
      await this.chartLoader.loadChartJs();
      this.initChart();
    } catch (e) {
      console.error('Could not load Chart.js', e);
    }
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
    
    // Matrix Mode Colors
    const gridColor = isDark ? 'rgba(0, 255, 65, 0.1)' : 'rgba(0, 0, 0, 0.04)';
    const textColor = isDark ? '#00FF41' : '#64748b';
    
    // Helper to safely access nested properties
    const options = this.chartInstance.options;

    if (options.scales.y) {
        if (options.scales.y.grid) options.scales.y.grid.color = gridColor;
        if (options.scales.y.ticks) options.scales.y.ticks.color = textColor;
    }
    if (options.scales.r) {
        if (options.scales.r.grid) options.scales.r.grid.color = gridColor;
        if (options.scales.r.angleLines) options.scales.r.angleLines.color = gridColor;
        if (options.scales.r.pointLabels) options.scales.r.pointLabels.color = textColor;
    }
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
      borderColors = isDark ? '#000000' : '#ffffff'; 
    } else {
      bgColors = this.hexToRgba(baseColor, isRadar || isDark ? 0.2 : 0.5);
      borderColors = baseColor;
    }

    const gridColor = isDark ? 'rgba(0, 255, 65, 0.15)' : 'rgba(0, 0, 0, 0.04)';
    const textColor = isDark ? '#00FF41' : '#64748b';

    return {
      type: chartType,
      data: {
        labels: this.labels(),
        datasets: [{
          label: this.title(),
          data: this.data(),
          backgroundColor: bgColors,
          borderColor: borderColors,
          borderWidth: isDark ? 1 : 2,
          tension: 0.2, // Sharper lines for tech feel
          pointRadius: 0, 
          pointHoverRadius: 4,
          pointBackgroundColor: '#fff',
          fill: chartType === 'line' || isRadar,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false, 
        interaction: {
            mode: 'index',
            intersect: false,
        },
        plugins: {
          legend: {
            display: isMultiColor || isRadar, 
            position: 'bottom',
            labels: {
                boxWidth: 8,
                padding: 10,
                font: { size: 9, family: isDark ? 'Courier New' : 'Inter' },
                usePointStyle: true,
                color: textColor
            }
          },
          tooltip: {
            enabled: true,
            backgroundColor: isDark ? 'rgba(0, 20, 0, 0.9)' : 'rgba(15, 23, 42, 0.9)',
            titleColor: isDark ? '#00FF41' : '#f8fafc',
            bodyColor: isDark ? '#00FF41' : '#f8fafc',
            borderColor: isDark ? '#00FF41' : 'transparent',
            borderWidth: isDark ? 1 : 0,
            titleFont: { family: 'Courier New' },
            bodyFont: { family: 'Courier New' },
            padding: 8,
            displayColors: true
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
                    font: { size: 9, family: 'Courier New' },
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
            border: { display: false }, 
            beginAtZero: true
        }
    };
  }

  private hexToRgba(hex: string, alpha: number) {
    if (!hex.startsWith('#')) return hex;
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
     if (!color.startsWith('#')) return color;
    return '#' + color.replace(/^#/, '').replace(/../g, color => ('0'+Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2));
  }
}