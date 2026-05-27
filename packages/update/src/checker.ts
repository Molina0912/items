import type { UpdateChannel, UpdateInfo } from './types.js';
import { resolveChannel } from './channels.js';

export class UpdateChecker {
  private packageName: string;
  private currentVersion: string;
  private lastCheckTime: number | null = null;
  private checkIntervalMs = 24 * 60 * 60 * 1000; // 24 hours

  constructor(packageName: string, currentVersion: string) {
    this.packageName = packageName;
    this.currentVersion = currentVersion;
  }

  async check(channel: UpdateChannel = 'stable'): Promise<UpdateInfo> {
    const tag = resolveChannel(channel);
    const url = `https://registry.npmjs.org/${this.packageName}/${tag}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        return {
          currentVersion: this.currentVersion,
          latestVersion: this.currentVersion,
          channel,
          updateAvailable: false,
        };
      }
      const data = (await response.json()) as { version?: string };
      const latestVersion = data.version ?? this.currentVersion;
      this.lastCheckTime = Date.now();
      return {
        currentVersion: this.currentVersion,
        latestVersion,
        channel,
        updateAvailable: latestVersion !== this.currentVersion,
      };
    } catch {
      return {
        currentVersion: this.currentVersion,
        latestVersion: this.currentVersion,
        channel,
        updateAvailable: false,
      };
    }
  }

  shouldNotify(): boolean {
    if (this.lastCheckTime === null) {
      return true;
    }
    return Date.now() - this.lastCheckTime > this.checkIntervalMs;
  }

  setCheckInterval(ms: number): void {
    this.checkIntervalMs = ms;
  }
}
