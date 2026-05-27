import type { TelemetryConfig } from './types.js';
import { Tracer } from './spans.js';
import { OTLPExporter } from './exporter.js';

export class TelemetrySDK {
  private config: TelemetryConfig;
  private tracers: Map<string, Tracer> = new Map();
  private exporter: OTLPExporter | null = null;
  private initialized = false;

  constructor(config: TelemetryConfig) {
    this.config = config;
  }

  init(): void {
    if (!this.config.enabled) {
      return;
    }
    if (this.config.endpoint) {
      this.exporter = new OTLPExporter(this.config.endpoint);
    }
    this.initialized = true;
  }

  shutdown(): void {
    if (this.exporter) {
      this.exporter.shutdown();
    }
    this.tracers.clear();
    this.initialized = false;
  }

  getTracer(name: string): Tracer {
    if (!this.tracers.has(name)) {
      this.tracers.set(name, new Tracer(name));
    }
    return this.tracers.get(name)!;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getConfig(): TelemetryConfig {
    return { ...this.config };
  }
}
