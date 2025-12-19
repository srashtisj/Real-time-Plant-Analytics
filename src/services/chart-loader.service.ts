import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ChartLoaderService {
  private scriptLoaded = false;
  private loadPromise: Promise<void> | null = null;

  /**
   * Loads the Chart.js library dynamically.
   * Returns a promise that resolves when the script is loaded and executed.
   */
  loadChartJs(): Promise<void> {
    // If already loaded, resolve immediately
    if (this.scriptLoaded) return Promise.resolve();
    
    // If loading is in progress, return the existing promise (singleton)
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        this.scriptLoaded = true;
        resolve();
      };
      
      script.onerror = () => {
        this.loadPromise = null; // Allow retry
        reject(new Error('Failed to load Chart.js'));
      };
      
      document.head.appendChild(script);
    });

    return this.loadPromise;
  }
}