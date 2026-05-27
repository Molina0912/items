import type { ChannelRouter } from './router.js';
import type { ChannelMessage } from './types.js';

export interface PermissionQuery {
  resource: string;
  action: string;
  requester: string;
}

export interface PermissionDecision {
  resource: string;
  action: string;
  allowed: boolean;
  reason?: string;
}

export class PermissionRelay {
  private router: ChannelRouter;

  constructor(router: ChannelRouter) {
    this.router = router;
  }

  relayPermissionRequest(query: PermissionQuery, channel: string): { dispatched: boolean; channel: string } {
    const message: ChannelMessage = {
      channel,
      subject: `Permission request: ${query.action} on ${query.resource}`,
      body: `Requester "${query.requester}" is requesting "${query.action}" access to "${query.resource}".`,
      metadata: { type: 'permission_request', ...query },
    };
    return this.router.send(message);
  }

  relayPermissionResponse(decision: PermissionDecision, channel: string): { dispatched: boolean; channel: string } {
    const message: ChannelMessage = {
      channel,
      subject: `Permission decision: ${decision.action} on ${decision.resource}`,
      body: `Decision: ${decision.allowed ? 'ALLOWED' : 'DENIED'}${decision.reason ? ` - ${decision.reason}` : ''}`,
      metadata: { type: 'permission_response', ...decision },
    };
    return this.router.send(message);
  }
}
