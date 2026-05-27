import { z } from 'zod';

export interface Channel {
  name: string;
  type: 'push' | 'webhook' | 'email';
  config: Record<string, any>;
}

export interface ChannelMessage {
  channel: string;
  subject?: string;
  body: string;
  metadata?: Record<string, any>;
}

export interface ChannelAllowlist {
  channels: string[];
  senders: string[];
  events?: string[];
}

export interface ChannelRoute {
  event: string;
  channels: string[];
  condition?: string;
}

export const ChannelSchema = z.object({
  name: z.string(),
  type: z.enum(['push', 'webhook', 'email']),
  config: z.record(z.any()),
});

export const ChannelMessageSchema = z.object({
  channel: z.string(),
  subject: z.string().optional(),
  body: z.string(),
  metadata: z.record(z.any()).optional(),
});

export const ChannelAllowlistSchema = z.object({
  channels: z.array(z.string()),
  senders: z.array(z.string()),
  events: z.array(z.string()).optional(),
});

export const ChannelRouteSchema = z.object({
  event: z.string(),
  channels: z.array(z.string()),
  condition: z.string().optional(),
});
