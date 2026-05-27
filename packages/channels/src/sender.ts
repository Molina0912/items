import type { ChannelAllowlist } from './types.js';

export class SenderValidator {
  private allowlist: ChannelAllowlist;

  constructor(allowlist: ChannelAllowlist) {
    this.allowlist = { ...allowlist, senders: [...allowlist.senders] };
  }

  validate(sender: string, channel: string): boolean {
    return (
      this.allowlist.senders.includes(sender) &&
      this.allowlist.channels.includes(channel)
    );
  }

  addSender(sender: string): void {
    if (!this.allowlist.senders.includes(sender)) {
      this.allowlist.senders.push(sender);
    }
  }

  removeSender(sender: string): void {
    this.allowlist.senders = this.allowlist.senders.filter((s) => s !== sender);
  }

  getSenders(): string[] {
    return [...this.allowlist.senders];
  }
}
