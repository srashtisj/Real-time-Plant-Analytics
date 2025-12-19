import { Injectable, signal, WritableSignal, computed } from '@angular/core';

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
  
  // Frequency in Updates Per Second (Hz)
  private updateFrequencySignal = signal<number>(10); 

  readonly charts = this.chartsSignal.asReadonly();
  readonly isStreaming = this.isStreamingSignal.asReadonly();
  readonly updateFrequency = this.updateFrequencySignal.asReadonly();

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

  setUpdateFrequency(hz: number) {
    this.updateFrequencySignal.set(hz);
    // Restart stream if active to apply new frequency
    if (this.isStreamingSignal()) {
      this.stopStream();
      this.startStream();
    }
  }

  private initializeCharts() {
    // Neon palette for Matrix vibe, keeping some variety
    const colors = [
      '#00FF41', // Matrix Green
      '#008F11', // Darker Green
      '#39FF14', // Neon Green
      '#FFFF00', // Yellow (warning)
      '#FF00FF', // Magenta (glitch)
      '#00FFFF', // Cyan (cyber)
      '#FFFFFF', // White
    ];

    const chartConfigs: { title: string, type: ChartModel['type'], labels?: string[] }[] = [
      { title: 'Mainframe CPU Load', type: 'line' },
      { title: 'Neural Net Memory', type: 'line' },
      { title: 'Uplink Bandwidth', type: 'line' },
      { title: 'Encryption Entropy', type: 'line' },
      { title: 'Thread Daemon', type: 'bar' },
      { title: 'Packet Loss', type: 'bar' },
      { title: 'Firewall Hits', type: 'doughnut', labels: ['SSH', 'HTTP', 'FTP', 'Telnet'] },
      { title: 'Proxy Chain', type: 'pie', labels: ['Node 1', 'Node 2', 'Node 3'] },
      { title: 'System Integrity', type: 'radar', labels: ['Core', 'DB', 'Auth', 'UI', 'API'] },
      { title: 'Threat Level', type: 'polarArea', labels: ['Low', 'Med', 'High', 'Crit', 'Extr'] },
      { title: 'Cooling Array A', type: 'line' },
      { title: 'Cooling Array B', type: 'line' },
      { title: 'Qubit Stability', type: 'bar' },
      { title: 'Power Grid (GW)', type: 'line' },
      { title: 'Intrusion Vector', type: 'radar', labels: ['SQLi', 'XSS', 'DDoS', 'MitM', 'Phish'] },
      { title: 'Job Queue', type: 'doughnut', labels: ['Wait', 'Proc', 'Done', 'Fail'] },
      { title: 'Sector Access', type: 'pie', labels: ['Sec 1', 'Sec 2', 'Sec 3', 'Sec 4'] },
      { title: 'Haptic Feedback', type: 'line' },
      { title: 'Pressure (Bar)', type: 'bar' },
      { title: 'AI Sentiment', type: 'polarArea', labels: ['Joy', 'Anger', 'Fear', 'Logic', 'Hope'] }
    ];

    const initialCharts: ChartModel[] = chartConfigs.map((config, index) => {
      let dataLength = 15; 
      let labels = Array.from({ length: dataLength }, (_, j) => `t-${j}`);

      if (['doughnut', 'pie', 'polarArea', 'radar'].includes(config.type)) {
        if (config.labels) {
          dataLength = config.labels.length;
          labels = config.labels;
        } else {
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
    
    // Calculate interval in ms from Hz (updates per second)
    const hz = this.updateFrequencySignal();
    const ms = Math.floor(1000 / hz);
    
    // Clamp minimum to 1ms (setInterval limit)
    const safeMs = Math.max(1, ms);

    this.intervalId = setInterval(() => {
      this.updateData();
    }, safeMs); 
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
        // High speed mode: reduce randomness skipping to make it look busier
        if (this.updateFrequencySignal() > 50) {
           // update almost every frame
        } else {
           if (Math.random() > 0.4) return chart;
        }

        const newData = [...chart.data];
        
        if (['line', 'bar'].includes(chart.type)) {
          const lastVal = newData[newData.length - 1];
          const change = Math.floor(Math.random() * 20) - 9;
          let nextVal = lastVal + change;
          if (nextVal < 5) nextVal = 5;
          if (nextVal > 150) nextVal = 150;
          
          newData.shift();
          newData.push(nextVal);
        } else {
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