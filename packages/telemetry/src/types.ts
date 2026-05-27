import { z } from 'zod';

export type SpanStatus = 'ok' | 'error' | 'unset';

export interface TelemetryConfig {
  enabled: boolean;
  endpoint?: string;
  serviceName?: string;
  batchSize?: number;
  flushInterval?: number;
}

export type SpanAttributeValue = string | number | boolean;

export interface SpanEvent {
  name: string;
  timestamp: number;
  attributes?: Record<string, SpanAttributeValue>;
}

export interface SpanData {
  name: string;
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  startTime: number;
  endTime?: number;
  attributes: Record<string, SpanAttributeValue>;
  events: SpanEvent[];
  status: SpanStatus;
}

export const TelemetryConfigSchema = z.object({
  enabled: z.boolean(),
  endpoint: z.string().optional(),
  serviceName: z.string().optional(),
  batchSize: z.number().optional(),
  flushInterval: z.number().optional(),
});

export const SpanAttributeValueSchema = z.union([z.string(), z.number(), z.boolean()]);

export const SpanEventSchema = z.object({
  name: z.string(),
  timestamp: z.number(),
  attributes: z.record(SpanAttributeValueSchema).optional(),
});

export const SpanDataSchema = z.object({
  name: z.string(),
  traceId: z.string(),
  spanId: z.string(),
  parentSpanId: z.string().optional(),
  startTime: z.number(),
  endTime: z.number().optional(),
  attributes: z.record(SpanAttributeValueSchema),
  events: z.array(SpanEventSchema),
  status: z.enum(['ok', 'error', 'unset']),
});
