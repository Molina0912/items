import type { ChannelRoute, ChannelAllowlist, ChannelMessage } from './types.js';

export class ChannelRouter {
  private routes: ChannelRoute[];
  private allowlist: ChannelAllowlist;

  constructor(routes: ChannelRoute[], allowlist: ChannelAllowlist) {
    this.routes = [...routes];
    this.allowlist = allowlist;
  }

  route(event: string, message: ChannelMessage): string[] {
    const matchingRoutes = this.routes.filter((r) => r.event === event);
    const channels: string[] = [];
    for (const route of matchingRoutes) {
      for (const channel of route.channels) {
        if (this.allowlist.channels.includes(channel) && !channels.includes(channel)) {
          channels.push(channel);
        }
      }
    }
    return channels;
  }

  send(message: ChannelMessage): { dispatched: boolean; channel: string } {
    if (!this.allowlist.channels.includes(message.channel)) {
      return { dispatched: false, channel: message.channel };
    }
    return { dispatched: true, channel: message.channel };
  }

  addRoute(route: ChannelRoute): void {
    this.routes.push(route);
  }

  removeRoute(event: string): void {
    this.routes = this.routes.filter((r) => r.event !== event);
  }

  getRoutes(): ChannelRoute[] {
    return [...this.routes];
  }
}
