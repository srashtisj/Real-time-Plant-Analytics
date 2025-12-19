import { Injectable, signal, WritableSignal } from '@angular/core';

export interface ChartModel {
  id: number;
  title: string;
  type: 'line' | 'bar' | 'doughnut' | 'pie' | 'radar' | 'polarArea';
  data: number[];
  labels: string[];
  color: string;
}

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private chartsSignal = signal<ChartModel[]>([]);
  private intervalId: any = null;
  private isStreamingSignal = signal<boolean>(false);

  readonly charts = this.chartsSignal.asReadonly();
  readonly isStreaming = this.isStreamingSignal.asReadonly();

  constructor() {
    this.initializeCharts();
  }

  toggleStream() {
    if (this.isStreamingSignal()) {
      this.stopStream();
    } else {
      this.startStream();
    }
  }

  private initializeCharts() {
    const colors = [
      '#3b82f6', // blue
      '#ef4444', // red
      '#10b981', // green
      '#f59e0b', // amber
      '#8b5cf6', // violet
      '#ec4899', // pink
      '#06b6d4', // cyan
      '#f97316', // orange
      '#6366f1', // indigo
      '#14b8a6', // teal
    ];

    const chartConfigs: { title: string, type: ChartModel['type'], labels?: string[] }[] = [
      { title: 'Server CPU Load (%)', type: 'line' },
      { title: 'Memory Usage (GB)', type: 'line' },
      { title: 'Network I/O (MB/s)', type: 'line' },
      { title: 'Disk Latency (ms)', type: 'line' },
      { title: 'Active Threads', type: 'bar' },
      { title: 'Request Rate (req/s)', type: 'bar' },
      { title: 'Error Distribution', type: 'doughnut', labels: ['400s', '500s', 'Timeout', 'CORS'] },
      { title: 'Cache Hit Ratio', type: 'pie', labels: ['Hit', 'Miss', 'Expired'] },
      { title: 'Cluster Health', type: 'radar', labels: ['CPU', 'RAM', 'Disk', 'Net', 'Temp'] },
      { title: 'Log Severity', type: 'polarArea', labels: ['Info', 'Warn', 'Err', 'Crit', 'Fatal'] },
      { title: 'Factory Temp Zone A', type: 'line' },
      { title: 'Factory Temp Zone B', type: 'line' },
      { title: 'Production Output', type: 'bar' },
      { title: 'Energy Consump. (kW)', type: 'line' },
      { title: 'Defect Analysis', type: 'radar', labels: ['Size', 'Shape', 'Color', 'Weight', 'Texture'] },
      { title: 'Shipping Status', type: 'doughnut', labels: ['Pending', 'In-Transit', 'Delivered', 'Returned'] },
      { title: 'Regional Sales', type: 'pie', labels: ['NA', 'EU', 'APAC', 'LATAM'] },
      { title: 'Sensor Vibrations', type: 'line' },
      { title: 'Pressure Levels (psi)', type: 'bar' },
      { title: 'System Efficiency', type: 'polarArea', labels: ['OEE', 'TEEP', 'Availability', 'Performance', 'Quality'] }
    ];

    const initialCharts: ChartModel[] = chartConfigs.map((config, index) => {
      let dataLength = 15; // Default for line/bar
      let labels = Array.from({ length: dataLength }, (_, j) => `t-${j}`);

      if (['doughnut', 'pie', 'polarArea', 'radar'].includes(config.type)) {
        if (config.labels) {
          dataLength = config.labels.length;
          labels = config.labels;
        } else {
           // Fallback if no labels provided for these types
           dataLength = 5;
           labels = ['A', 'B', 'C', 'D', 'E'];
        }
      }

      const data = Array.from({ length: dataLength }, () => Math.floor(Math.random() * 90) + 10);

      return {
        id: index + 1,
        title: config.title,
        type: config.type,
        data,
        labels,
        color: colors[index % colors.length]
      };
    });

    this.chartsSignal.set(initialCharts);
  }

  private startStream() {
    this.isStreamingSignal.set(true);
    this.intervalId = setInterval(() => {
      this.updateData();
    }, 200); 
  }

  private stopStream() {
    this.isStreamingSignal.set(false);
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private updateData() {
    this.chartsSignal.update(charts => {
      return charts.map(chart => {
        // Randomly skip some updates for natural feel
        if (Math.random() > 0.4) return chart;

        const newData = [...chart.data];
        
        if (['line', 'bar'].includes(chart.type)) {
          // Rolling window simulation for time-series
          const lastVal = newData[newData.length - 1];
          const change = Math.floor(Math.random() * 20) - 9; // -9 to +10
          let nextVal = lastVal + change;
          // Keep within logical bounds
          if (nextVal < 5) nextVal = 5;
          if (nextVal > 150) nextVal = 150;
          
          newData.shift();
          newData.push(nextVal);
        } else {
          // In-place jitter for categorical/snapshot charts (Pie, Radar, etc)
          const idx = Math.floor(Math.random() * newData.length);
          const current = newData[idx];
          const change = Math.floor(Math.random() * 15) - 7;
          let next = current + change;
          if (next < 5) next = 5;
          if (next > 100) next = 100;
          
          newData[idx] = next;
        }

        return { ...chart, data: newData };
      });
    });
  }
}